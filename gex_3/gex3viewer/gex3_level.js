const LEVELS = [
    "Snow Level (Totally Scrooged)",
    "Mystery Level (Clueless in Seattle)",
    "Egypt Level (Holy Moses!)",
    "Army Level (War is Heck)",
    "Western Level (The Organ Trail)",
    "Pirate Level (Cutchesse Island)",
    "Greek Level (Unsolved Mythstories)",
    "Beanstalk Level (Red Riding in the Hood)",
    "Anime Level (When Sushi goes Bad)",
    "Gangster Level (My Three Goons)",
    "Superhero Level (Superzeroes)",
    "Snowboard Bonus",
    "Western Bonus",
    "Pirate Bonus",
    "Greek Bonus",
    "Army Bonus",
    "Indy secret",
    "Pirate secret",
    "Lifeguard secret",
    "Scuba secret",
    "Wrestling Boss",
    "Wizard of Oz Boss",
    "Spacestation",
    "Mission control Hub",
    "Lake Flacid Hub",
    "Slappy Valley Hub",
    "Funky Town Hub",
    "Title Screen",
    "Boot Screen",
    "New Game Cutscene",
]

const LEVELS_START_OFFSET = 0x8013C
const LEVEL_BASE_RAM_ADDRESS = u32(0x8024B000)

function address_to_map_offset(address) {
    return address - LEVEL_BASE_RAM_ADDRESS;
}

class Gex3LevelViewer {
    constructor(rom) {
        this.ROM = rom; // Gex3ROM class
    }
    
    select_level_from_index(index) {
        this.select_level(LEVELS[index]);
    }
    
    select_level(level) {
        console.log('Level changed to: ' + level);
        
        var index = LEVELS.indexOf(level);
        var mainDataOffset = LEVELS_START_OFFSET + (index * 0x54);
        
        var compressedMapDataStart = this.ROM.get_u32(mainDataOffset + 0x1C);
        var compressedMapDataEnd = this.ROM.get_u32(mainDataOffset + 0x20);
        
        // Get uncompressed map data.
        this.MapData = pako.inflate(this.ROM.get_section(compressedMapDataStart, compressedMapDataEnd), {raw:true});
        
        var mainHeaderOffset = address_to_map_offset(bytes_to_uint(this.MapData, 0));
        
        this.tree = new Gex3LevelViewerTree(this.MapData, bytes_to_uint(this.MapData, mainHeaderOffset));
        //console.log(this.tree.get_nodes_with_type(2));
        
        this.geoGroups = []
        var nodesForTriangles = this.tree.get_nodes_with_type(2);
        
        var segment1StartOffset = address_to_map_offset(bytes_to_uint(this.MapData, mainHeaderOffset + 0x30));
        var segment2StartOffset = address_to_map_offset(bytes_to_uint(this.MapData, mainHeaderOffset + 0x58));
        var segment3StartOffset = address_to_map_offset(bytes_to_uint(this.MapData, mainHeaderOffset + 0x5C));
        var numberOfVertices = bytes_to_uint(this.MapData, mainHeaderOffset + 0x18);
        
        // Load materials
        var textureListOffset = address_to_map_offset(bytes_to_uint(this.MapData, 0x2C));
        var numOfTextures = bytes_to_uint(this.MapData, textureListOffset);
        this.materials = [];
        for(var i = 0; i < numOfTextures; i++) {
            var address = bytes_to_uint(this.MapData, textureListOffset + 4 + (i*4));
            this.materials.push(new Gex3LevelViewerMaterial(this.MapData, address, segment3StartOffset));
        }
        
        nodesForTriangles.forEach(function(element) {
            this.geoGroups.push(
                new Gex3LevelViewerGeoGroup(this.MapData, element.offset + 0x18, this.materials, segment1StartOffset, segment2StartOffset, segment3StartOffset)
            );
        }, this);
    }
}

class Gex3LevelViewerVertex {
    constructor(data, offset, material) {
        var x = bytes_to_short(data, offset) * 0.02;
        var y = bytes_to_short(data, offset + 2) * 0.02;
        var z = bytes_to_short(data, offset + 4) * 0.02;
        var u = bytes_to_short(data, offset + 8);
        var v = bytes_to_short(data, offset + 10);
        var r = data[offset + 0xC];
        var g = data[offset + 0xD];
        var b = data[offset + 0xE];
        
        this.color = new THREE.Color(r / 255, g / 255, b / 255);
        this.uv = new THREE.Vector2(u, v).divideScalar(2048.0);
        this.pos = new THREE.Vector3(x, z, -y); // Model is Z-Up, so make it Y-up instead.
        this.pos.color = this.color;
        this.pos.uv = this.uv.multiply(material.uvScale);
    }
}

class Gex3LevelViewerGeoGroup {
    constructor(data, start_offset, materials, segment1Start, segment2Start, segment3Start) {
        this.__parse(data, start_offset, materials, segment1Start, segment2Start, segment3Start);
    }
    
    __check_if_material_has_vertex(data, material, vertexID, segment1Start) {
        var foundIndex = material.indexIDs.indexOf(vertexID);
        if(foundIndex == -1) {
            foundIndex = material.indexIDs.length;
            material.indexIDs.push(vertexID);
            material.vertices.push(new Gex3LevelViewerVertex(data, segment1Start + (vertexID*0x10), material));
        }
        //console.log(material.indexIDs);
        return foundIndex;
    }
    
    __parse(data, start_offset, materials, segment1Start, segment2Start, segment3Start) {
        var offset = start_offset;
        var end = 100;
        var block = 0;
        var currentMaterial = null;
        while(end > 0) {
            var headerNumBytes = bytes_to_ushort(data, offset + 2);
            if (headerNumBytes == 0){
                end = 0;
                continue;
            }
            
            var type = bytes_to_ushort(data, offset);
            var headerTextureID = bytes_to_ushort(data, offset + 4);
            
            var numCmds = headerNumBytes / 8;
            offset += 8;
            if(type != 0x01 && type != 0x05) {
                offset += 8;
                //this.textures.push(headerTextureID);
                currentMaterial = materials[headerTextureID];
            }
            
            var indiciesOffset = 0;
            //var triangles = [];
            
            for(var i = 0; i < numCmds; i++) {
                var cmd = data[offset];
                // words
                var w1 = bytes_to_uint(data, offset);
                var w2 = bytes_to_uint(data, offset + 4);
                switch(cmd) {
                    case 0x01:
                        var numVerts = (w1 & 0xFF000) >> 12;
                        var localOffset = (w1 & 0xFF) - (numVerts * 2);
                        var indexStart = (w2 & 0xFFFFFF) / 0x10;
                        indiciesOffset = indexStart + localOffset; // This might be wrong, check later.
                        break;
                    case 0x05:
                        if(currentMaterial != null){
                            var localIndex1 = this.__check_if_material_has_vertex(data, currentMaterial, (((w1 & 0xFF0000) >> 16) / 2) + indiciesOffset, segment1Start);
                            var localIndex2 = this.__check_if_material_has_vertex(data, currentMaterial, (((w1 & 0xFF00) >> 8) / 2) + indiciesOffset, segment1Start);
                            var localIndex3 = this.__check_if_material_has_vertex(data, currentMaterial, ((w1 & 0xFF) / 2) + indiciesOffset, segment1Start);
                            var face3 = new THREE.Face3(localIndex1, localIndex2, localIndex3);
                            face3.vertexColors[0] = currentMaterial.vertices[localIndex1].color;
                            face3.vertexColors[1] = currentMaterial.vertices[localIndex2].color;
                            face3.vertexColors[2] = currentMaterial.vertices[localIndex3].color;
                            face3.uvs = [
                                currentMaterial.vertices[localIndex1].uv, 
                                currentMaterial.vertices[localIndex2].uv, 
                                currentMaterial.vertices[localIndex3].uv
                            ];
                            currentMaterial.triangles.push(face3);
                        }
                        break;
                    case 0x06:
                        if(currentMaterial != null){
                            var localIndex1 = this.__check_if_material_has_vertex(data, currentMaterial, (((w1 & 0xFF0000) >> 16) / 2) + indiciesOffset, segment1Start);
                            var localIndex2 = this.__check_if_material_has_vertex(data, currentMaterial, (((w1 & 0xFF00) >> 8) / 2) + indiciesOffset, segment1Start);
                            var localIndex3 = this.__check_if_material_has_vertex(data, currentMaterial, ((w1 & 0xFF) / 2) + indiciesOffset, segment1Start);
                            var localIndex4 = this.__check_if_material_has_vertex(data, currentMaterial, (((w2 & 0xFF0000) >> 16) / 2) + indiciesOffset, segment1Start);
                            var localIndex5 = this.__check_if_material_has_vertex(data, currentMaterial, (((w2 & 0xFF00) >> 8) / 2) + indiciesOffset, segment1Start);
                            var localIndex6 = this.__check_if_material_has_vertex(data, currentMaterial, ((w2 & 0xFF) / 2) + indiciesOffset, segment1Start);
                            var face3 = new THREE.Face3(localIndex1, localIndex2, localIndex3);
                            face3.vertexColors[0] = currentMaterial.vertices[localIndex1].color;
                            face3.vertexColors[1] = currentMaterial.vertices[localIndex2].color;
                            face3.vertexColors[2] = currentMaterial.vertices[localIndex3].color;
                            face3.uvs = [
                                currentMaterial.vertices[localIndex1].uv, 
                                currentMaterial.vertices[localIndex2].uv, 
                                currentMaterial.vertices[localIndex3].uv
                            ];
                            currentMaterial.triangles.push(face3);
                            var face3_2 = new THREE.Face3(localIndex4, localIndex5, localIndex6);
                            face3_2.vertexColors[0] = currentMaterial.vertices[localIndex4].color;
                            face3_2.vertexColors[1] = currentMaterial.vertices[localIndex5].color;
                            face3_2.vertexColors[2] = currentMaterial.vertices[localIndex6].color;
                            face3_2.uvs = [
                                currentMaterial.vertices[localIndex4].uv, 
                                currentMaterial.vertices[localIndex5].uv, 
                                currentMaterial.vertices[localIndex6].uv
                            ];
                            currentMaterial.triangles.push(face3_2);
                        }
                        break;
                    case 0xDE:
                        if(type == 1) {
                            //this.textures.push(new Gex3LevelViewerMaterial(data, segment2Start + (w2 & 0x00FFFFFF), segment3Start));
                            currentMaterial = materials[0]; // Fix later!
                        } else {
                            console.error('0xDE command used with type ' + type + ' at offset = 0x' + offset.toString(16));
                            return;
                        }
                        break;
                    case 0xDF: // Just ends the display list. No need to do anything with it.
                        break;
                    default:
                        //console.error('Invalid command: ' + cmd.toString(16) + ' at offset 0x' + offset.toString(16));
                        return;
                }
                offset += 8;
            }
            block++;
        }
    }
}

class Gex3LevelViewerTree {
    constructor(data, start_address) {
        this.rootNode = new Gex3LevelViewerTreeNode(data, start_address);
    }
    
    get_nodes_with_type(type) {
        var nodes = [];
        this.rootNode.get_node_if_type(nodes, type);
        return nodes;
    }
}

class Gex3LevelViewerTreeNode {
    constructor(data, address) {
        var offset = address_to_map_offset(address);
        this.type = data[offset + 0xC];
        // this.bytes = data.subarray(offset, offset + 0x18);
        this.offset = offset;
        this.address = address;
        this.node1Addr = bytes_to_uint(data, offset + 0x10);
        this.node2Addr = bytes_to_uint(data, offset + 0x14);
        this.node1 = this.check_if_valid_node_address(data, this.node1Addr);
        this.node2 = this.check_if_valid_node_address(data, this.node2Addr);
    }
    
    check_if_valid_node_address(data, address) {
        var node = null;
        if ((address >= LEVEL_BASE_RAM_ADDRESS) && (address < u32(0x80800000))){
            var checkNode = new Gex3LevelViewerTreeNode(data, address);
            var node1AddrValid = (checkNode.node1Addr == 0) || ((checkNode.node1Addr & 0x80000000) != 0);
            var node2AddrValid = (checkNode.node2Addr == 0) || ((checkNode.node2Addr & 0x80000000) != 0);
            if (node1AddrValid && node2AddrValid) {
                node = checkNode;
            }
        }
        
        return node
    }
    
    get_node_if_type(nodes, type) {
        if(this.type == type) {
            nodes.push(this);
        }
        if (this.node1 != null) {
            this.node1.get_node_if_type(nodes, type);
        }
        if (this.node2 != null) {
            this.node2.get_node_if_type(nodes, type);
        }
    }
}

class Gex3LevelViewerMaterial {
    constructor(data, addressOrOffset, segment3Start) {
        this.indexIDs = [];
        this.vertices = [];
        this.triangles = [];
        this.isAnimated = false;
        if((addressOrOffset & 0x80000000) != 0) { // Check if using RAM address.
            this.address = addressOrOffset;
            if (this.address > LEVEL_BASE_RAM_ADDRESS) {
                this.offset = address_to_map_offset(addressOrOffset);
                var dataType = bytes_to_ushort(data, this.offset);
                if(dataType == 0x0007){
                    this.isAnimated = true;
                    this.animFrames = [];
                    var numOfAnimatedFrames = bytes_to_ushort(data, this.offset + 2);
                    for(var i = 0; i < numOfAnimatedFrames; i++) {
                        var address = bytes_to_uint(data, this.offset + 4 + (i*4));
                        this.animFrames.push(new Gex3LevelViewerMaterial(data, address, segment3Start));
                    }
                    this.__parse(data, segment3Start);
                } else {
                    // Normal texture data.
                    this.__parse(data, segment3Start);
                }
                
            }
        } else { // Just an offset.
            this.offset = addressOrOffset
            this.address = LEVEL_BASE_RAM_ADDRESS + addressOrOffset;
            this.__parse(data, segment3Start);
        }
    }
    
    __parse(data, segment3Start) {
        var format = 0x10;
        var texWidth = 32;
        var texHeight = 32;
        var palette = [];
        var texOffset = 0;
        var offset = this.offset;
        var cmd = data[offset];
        while(cmd != 0xDF){
            switch(cmd){
                case 0xF0:
                    var numColors = ((bytes_to_ushort(data, offset + 5) >> 4) >> 2) + 1;
                    var bytes = data.subarray(texOffset, texOffset + (numColors*2));
                    palette = N64TextureDecoder.decode_rgba16(bytes, numColors, 1);
                    break;
                case 0xF2:
                    texWidth = ((bytes_to_ushort(data, offset + 5) >> 4) >> 2) + 1;
                    texHeight = ((bytes_to_ushort(data, offset + 6) & 0xFFF) >> 2) + 1;
                    break;
                case 0xF5:
                    if((data[offset + 1] != 0) && (data[offset + 2] != 0)) {
                        format = data[offset + 1];
                    }
                    break;
                case 0xFD:
                    format = data[offset + 1];
                    var seg3Offset = bytes_to_int(data, offset + 4) & 0x00FFFFFF;
                    texOffset = seg3Offset + segment3Start;
                    break;
                case 0xF3:
                case 0xE6:
                case 0xE7:
                case 0xE3:
                    break;
                default:
                    //if(cmd != undefined) console.error("Invalid F3DEX2 texture cmd: " + cmd.toString(16));
                    cmd = 0xDF;
                    continue; // break out of the while loop
            }
            // Get next cmd
            offset += 8;
            cmd = data[offset];
        }
        
        var numBytes = N64TextureDecoder.get_number_bytes_for_texture_data(format, texWidth, texHeight);
        var bytes = data.subarray(texOffset, texOffset + numBytes);
        
        this.format = format;
        this.width = texWidth;
        this.height = texHeight;
        
        this.uvScale = new THREE.Vector2(32.0 / texWidth, 32.0 / texHeight);
        
        this.palette = palette;
        this.rgbaData = N64TextureDecoder.decode_data(bytes, palette, format, texWidth, texHeight);
        this.hasTransparency = N64TextureDecoder.does_texture_have_transparency(this.rgbaData);
        this.tex = new THREE.DataTexture(this.rgbaData, texWidth, texHeight, THREE.RGBAFormat);
    }
}
