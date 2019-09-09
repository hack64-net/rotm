F3DEX_CMDS = {
    'VTX'         : 0x04,
    'TRI2'        : 0xB1,
    'ENDDL'       : 0xB8,
    'TRI1'        : 0xBF,
    'LOADTLUT'    : 0xF0,
    'SETTILESIZE' : 0xF2,
    'LOADBLOCK'   : 0xF3,
    'SETTILE'     : 0xF5,
    'SETTIMG'     : 0xFD
}

/*
 * Assumptions:
 * 1.) All data is self-contained within the rnx/rnc data
 * 2.) Only the CI4 texture format is used.
 */
class ForsakenModel {
    constructor(rnx_data) {
        this.data = rnx_data;
        this.materials = [];
        this.parse_f3dex();
    }
    
    __check_if_material_has_vertex(material, vertexOffset) {
        var foundIndex = material.indexIDs.indexOf(vertexOffset);
        if(foundIndex == -1) {
            foundIndex = material.indexIDs.length;
            material.indexIDs.push(vertexOffset);
            material.vertices.push(new ForsakenModel_Vertex(this.data, vertexOffset, material));
        }
        return foundIndex;
    }
    
    parse_f3dex() {
        var cmd_offset = bytes_to_uint(this.data, 0);
        var ended = false;
        var currentMaterial = this.materials[0];
        var currentVerticesOffset = 0;
        var currentTimgOffset = 0;
        var loadingTexture = false;
        while (!ended) {
            var w1 = bytes_to_uint(this.data, cmd_offset);
            var w2 = bytes_to_uint(this.data, cmd_offset + 4);
            //console.log(hex64(w1, w2));
            var cmd = u8(w1 >> 24);
            switch(cmd) {
                case F3DEX_CMDS['VTX']:
                    currentVerticesOffset = w2 & 0x00FFFFFF;
                    break;
                case F3DEX_CMDS['TRI1']:
                    if(loadingTexture)
                    {
                        currentMaterial.parseTexture(this.data);
                        loadingTexture = false;
                    }
                    var localIndex1 = this.__check_if_material_has_vertex(currentMaterial, currentVerticesOffset + (((w2 & 0xFF0000) >> 16) / 2)*0x10);
                    var localIndex2 = this.__check_if_material_has_vertex(currentMaterial, currentVerticesOffset + (((w2 & 0xFF00) >> 8) / 2)*0x10);
                    var localIndex3 = this.__check_if_material_has_vertex(currentMaterial, currentVerticesOffset + ((w2 & 0xFF) / 2)*0x10);
                    var face3 = new THREE.Face3(localIndex1, localIndex2, localIndex3);
                    face3.vertexColors[0] = currentMaterial.vertices[localIndex1].color;
                    face3.vertexColors[1] = currentMaterial.vertices[localIndex2].color;
                    face3.vertexColors[2] = currentMaterial.vertices[localIndex3].color;
                    face3.vertexNormals[0] = currentMaterial.vertices[localIndex1].normal;
                    face3.vertexNormals[1] = currentMaterial.vertices[localIndex2].normal;
                    face3.vertexNormals[2] = currentMaterial.vertices[localIndex3].normal;
                    face3.uvs = [
                        currentMaterial.vertices[localIndex1].uv, 
                        currentMaterial.vertices[localIndex2].uv, 
                        currentMaterial.vertices[localIndex3].uv
                    ];
                    currentMaterial.triangles.push(face3);
                    break;
                case F3DEX_CMDS['TRI2']:
                    if(loadingTexture)
                    {
                        currentMaterial.parseTexture(this.data);
                        loadingTexture = false;
                    }
                    var localIndex1 = this.__check_if_material_has_vertex(currentMaterial, currentVerticesOffset + (((w2 & 0xFF0000) >> 16) / 2)*0x10);
                    var localIndex2 = this.__check_if_material_has_vertex(currentMaterial, currentVerticesOffset + (((w2 & 0xFF00) >> 8) / 2)*0x10);
                    var localIndex3 = this.__check_if_material_has_vertex(currentMaterial, currentVerticesOffset + ((w2 & 0xFF) / 2)*0x10);
                    var face3 = new THREE.Face3(localIndex1, localIndex2, localIndex3);
                    face3.vertexColors[0] = currentMaterial.vertices[localIndex1].color;
                    face3.vertexColors[1] = currentMaterial.vertices[localIndex2].color;
                    face3.vertexColors[2] = currentMaterial.vertices[localIndex3].color;
                    face3.vertexNormals[0] = currentMaterial.vertices[localIndex1].normal;
                    face3.vertexNormals[1] = currentMaterial.vertices[localIndex2].normal;
                    face3.vertexNormals[2] = currentMaterial.vertices[localIndex3].normal;
                    face3.uvs = [
                        currentMaterial.vertices[localIndex1].uv, 
                        currentMaterial.vertices[localIndex2].uv, 
                        currentMaterial.vertices[localIndex3].uv
                    ];
                    currentMaterial.triangles.push(face3);
                    localIndex1 = this.__check_if_material_has_vertex(currentMaterial, currentVerticesOffset + (((w1 & 0xFF0000) >> 16) / 2)*0x10);
                    localIndex2 = this.__check_if_material_has_vertex(currentMaterial, currentVerticesOffset + (((w1 & 0xFF00) >> 8) / 2)*0x10);
                    localIndex3 = this.__check_if_material_has_vertex(currentMaterial, currentVerticesOffset + ((w1 & 0xFF) / 2)*0x10);
                    face3 = new THREE.Face3(localIndex1, localIndex2, localIndex3);
                    face3.vertexColors[0] = currentMaterial.vertices[localIndex1].color;
                    face3.vertexColors[1] = currentMaterial.vertices[localIndex2].color;
                    face3.vertexColors[2] = currentMaterial.vertices[localIndex3].color;
                    face3.vertexNormals[0] = currentMaterial.vertices[localIndex1].normal;
                    face3.vertexNormals[1] = currentMaterial.vertices[localIndex2].normal;
                    face3.vertexNormals[2] = currentMaterial.vertices[localIndex3].normal;
                    face3.uvs = [
                        currentMaterial.vertices[localIndex1].uv, 
                        currentMaterial.vertices[localIndex2].uv, 
                        currentMaterial.vertices[localIndex3].uv
                    ];
                    currentMaterial.triangles.push(face3);
                    break;
                case F3DEX_CMDS['ENDDL']:
                    ended = true;
                    break;
                case F3DEX_CMDS['LOADTLUT']:
                    var numColors = ((bytes_to_ushort(this.data, cmd_offset + 5) >> 4) >> 2) + 1;
                    currentMaterial.paletteBytes = this.data.subarray(currentTimgOffset, currentTimgOffset + (numColors*2));
                    break;
                case F3DEX_CMDS['SETTILESIZE']:
                    currentMaterial.width = ((bytes_to_ushort(this.data, cmd_offset + 5) >> 4) >> 2) + 1;
                    currentMaterial.height = ((bytes_to_ushort(this.data, cmd_offset + 6) & 0xFFF) >> 2) + 1;
                    break;
                case F3DEX_CMDS['LOADBLOCK']:
                    currentMaterial.ciDataOffset = currentTimgOffset;
                    break;
                case F3DEX_CMDS['SETTIMG']:
                    if(!loadingTexture)
                    {
                        this.materials.push(new ForsakenModel_Material());
                        currentMaterial = this.materials[this.materials.length - 1];
                    }
                    currentTimgOffset = w2 & 0xFFFFFF;
                    loadingTexture = true;
                    break;
                    
            }
            cmd_offset += 8;
        }
    }
}

class ForsakenModel_Material {
    constructor(textureOffset) {
        this.triangles = [];
        this.indexIDs = [];
        this.vertices = [];
        this.paletteBytes = [];
        this.width = 0;
        this.height = 0;
        this.palette = null;
        this.ciDataOffset = 0;
        this.ciData = null;
        this.rgbaData = null;
        this.hasTransparency = false;
        this.tex = null;
    }
    
    parseTexture(data) {
        var numBytes = (this.width * this.height) / 2;
        this.ciData = data.subarray(this.ciDataOffset, this.ciDataOffset + numBytes);
        this.palette = N64TextureDecoder.decode_rgba16(this.paletteBytes, this.paletteBytes.length / 2, 1);
        this.rgbaData = N64TextureDecoder.decode_ci4(this.ciData, this.palette, this.width, this.height);
        this.uvScale = new THREE.Vector2(32.0 / this.width, 32.0 / this.height);
        this.hasTransparency = N64TextureDecoder.does_texture_have_transparency(this.rgbaData);
        this.tex = new THREE.DataTexture(this.rgbaData, this.width, this.height, THREE.RGBAFormat);
    }
}

class ForsakenModel_Vertex {
    constructor(data, offset, material) {
        var x = bytes_to_short(data, offset) * WORLD_SCALE;
        var y = bytes_to_short(data, offset + 2) * WORLD_SCALE;
        var z = bytes_to_short(data, offset + 4) * WORLD_SCALE;
        var u = bytes_to_short(data, offset + 8);
        var v = bytes_to_short(data, offset + 10);
        var nx = data[offset + 0xC];
        var ny = data[offset + 0xD];
        var nz = data[offset + 0xE];
        var r = 0xFF;
        var g = 0xFF;
        var b = 0xFF;
        
        this.color = new THREE.Color(r / 255, g / 255, b / 255);
        this.normal = new THREE.Vector3(nx / 255, ny / 255, nz / 255);
        this.uv = new THREE.Vector2(u, v).divideScalar(2048.0);
        this.pos = new THREE.Vector3(x, -y, z);
        this.pos.color = this.color;
        this.pos.normal = this.normal;
        this.pos.uv = this.uv.multiply(material.uvScale);
    }
}






