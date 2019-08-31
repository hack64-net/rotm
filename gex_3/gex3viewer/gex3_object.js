/* Note: This code is unfinished. */

class Gex3Object {
    constructor(rom, offset) {
        this.name = binArrayToString(rom.get_section(offset, offset+8));
        this.romOffset = offset;
        this.compressedStart = bytes_to_uint(rom.bytes, offset+8);
        this.compressedEnd = bytes_to_uint(rom.bytes, offset+12);
        this.ObjData = pako.inflate(rom.get_section(this.compressedStart, this.compressedEnd), {raw:true});
        this.model = null;
    }
    
    __get_file_offset(localOffset) {
        return this.objFileStart + localOffset;
    }
    
    __get_uint_from_local_offset(localOffset) {
        return bytes_to_uint(this.ObjData, this.__get_file_offset(localOffset));
    }
    
    __get_ushort_from_local_offset(localOffset) {
        return bytes_to_ushort(this.ObjData, this.__get_file_offset(localOffset));
    }
    
    __get_offset_from_double_local_offset(localOffset){
        return this.__get_file_offset(this.__get_uint_from_local_offset(localOffset));
    }
    
    __get_uint_from_double_local_offset(localOffset){
        return this.__get_uint_from_local_offset(this.__get_uint_from_local_offset(localOffset));
    }
   
    get_mesh() {
        if(this.model == null){
            this.model = new THREE.Object3D();
            
            var numOfOffsets = bytes_to_uint(this.ObjData, 0);
            this.objFileStart = 4 + (numOfOffsets * 4);
            
            var iThinkThisIsAHeaderLocalOffset = this.__get_uint_from_double_local_offset(bytes_to_uint(this.ObjData, 4));
            
            var numOfVerts = this.__get_ushort_from_local_offset(iThinkThisIsAHeaderLocalOffset);
            var numOfTriangles = this.__get_ushort_from_local_offset(iThinkThisIsAHeaderLocalOffset + 0x04);
            var verticesOffset = this.__get_offset_from_double_local_offset(iThinkThisIsAHeaderLocalOffset + 0x08);
            var vertexColorsOffset = this.__get_offset_from_double_local_offset(iThinkThisIsAHeaderLocalOffset + 0x0C);
            var triangleListOffset = this.__get_offset_from_double_local_offset(iThinkThisIsAHeaderLocalOffset + 0x14);
            var segment5Offset = this.__get_offset_from_double_local_offset(iThinkThisIsAHeaderLocalOffset + 0x34);
            
            if(this.name == 'campfre_'){
                console.log('this.objFileStart = ' + this.objFileStart.toString(16));
                console.log(
                    this.name 
                    + ': verticesOffset = ' + verticesOffset.toString(16) 
                    + ', vertexColorsOffset = ' + vertexColorsOffset.toString(16)
                    + ', triangleListOffset = ' + triangleListOffset.toString(16)
                    + ', segment5Offset = ' + segment5Offset.toString(16)
                );
            }
            
            var vertices = [];
            for(var i = 0; i < numOfVerts; i++) {
                var vertexOffset = verticesOffset + (i*8);
                var vertexColorOffset = vertexColorsOffset + (i*4);
                vertices.push(new Gex3ObjectVertex(this.ObjData, vertexOffset, vertexColorOffset));
            }
            
            var materials = {};
            var geometries = {};
            
            for(var i = 0; i < numOfTriangles; i++) {
                var index = triangleListOffset + (i * 0xC);
                var materialInfoLocalOffset = bytes_to_int(this.ObjData, index + 8);
                if (materialInfoLocalOffset >= 0){
                    
                } else { // No texture.
                    
                }
            }
            
            
            /*
            for(var i = 0; i < numOfMaterials; i++){
                var usedVertices = [];
                var geometry = new THREE.Geometry();
                
                var material = new THREE.MeshBasicMaterial({ 
                    vertexColors: THREE.VertexColors,
                    //map: convert_texture_to_png_texture(levelViewer.materials[i].animFrames[0].tex),
                    //transparent: levelViewer.materials[i].animFrames[0].hasTransparency,
                    side: THREE.DoubleSide
                });
                
                this.model.add(new THREE.Mesh(geometry, material));
            }
            */
        }
        return this.model;
    }
}

class Gex3ObjectVertex {
    constructor(data, vertexOffset, vertexColorOffset) {
        var x = bytes_to_short(data, vertexOffset);
        var y = bytes_to_short(data, vertexOffset + 2);
        var z = bytes_to_short(data, vertexOffset + 4);
        var r = data[vertexColorOffset];
        var g = data[vertexColorOffset + 1];
        var b = data[vertexColorOffset + 2];
        this.color = new THREE.Color(r / 255, g / 255, b / 255);
        this.pos = new THREE.Vector3(x, z, -y)  // Convert Z-Up to Y-Up.
                  .multiplyScalar(WORLD_SCALE); // Scale down vertices.
        this.pos.color = this.color;
    }
}


