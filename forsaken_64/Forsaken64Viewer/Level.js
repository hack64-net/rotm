const LEVEL_SCALE = 0.05;

class ForsakenLevel {
    constructor(geoData, texData) {
        var numTextures = this.get_num_of_textures(texData);
        var numVerts = bytes_to_ushort(geoData, 0);
        var numTriangles = bytes_to_ushort(geoData, 2);
        this.vertices = [];
        this.materials = [];
        
        var texOffset = 0;
        for(var i = 0; i < numTextures; i++){
            this.materials.push(new ForsakenLevelMaterial(texData, texOffset));
            texOffset += 0x14;
        }
        
        var offset = 0x30;
        
        for(var i = 0; i < numVerts; i++){
            this.vertices.push(new ForsakenLevelVertex(geoData.slice(offset, offset+0x8)));
            offset += 0x8;
        }
        
        for(var i = 0; i < numTriangles; i++){
            var quad = new ForsakenLevelQuad(geoData.slice(offset, offset+0x18), this.materials, this.vertices);
            offset += 0x18;
        }
    }
    
    get_num_of_textures(texData) {
        return Math.floor(bytes_to_uint(texData, 0x10) / 0x14);
    }
}

class ForsakenLevelVertex {
    constructor(data) {
        var x = bytes_to_short(data, 0) * LEVEL_SCALE;
        var y = -bytes_to_short(data, 2) * LEVEL_SCALE;
        var z = -bytes_to_short(data, 4) * LEVEL_SCALE;
        this.pos = new THREE.Vector3(x, y, z);
    }
}

class ForsakenLevelMaterial {
    constructor(texData, index) {
        this.vertices = [];
        this.triangles = [];
        
        var u = bytes_to_short(texData, index + 0x0);
        var v = bytes_to_short(texData, index + 0x2);
        this.uv_a = new THREE.Vector2(u, v).divideScalar(2048.0);
        
        u = bytes_to_short(texData, index + 0x4);
        v = bytes_to_short(texData, index + 0x6);
        this.uv_b = new THREE.Vector2(u, v).divideScalar(2048.0);
        
        u = bytes_to_short(texData, index + 0x8);
        v = bytes_to_short(texData, index + 0xA);
        this.uv_c = new THREE.Vector2(u, v).divideScalar(2048.0);
        
        u = bytes_to_short(texData, index + 0xC);
        v = bytes_to_short(texData, index + 0xE);
        this.uv_d = new THREE.Vector2(u, v).divideScalar(2048.0);
        
        var texOffset = bytes_to_uint(texData, index + 0x10);
        var rgba16Data = texData.slice(texOffset, texOffset + 0x800);
        var rgbaData = N64TextureDecoder.decode_rgba16_no_transparency(rgba16Data, 32, 32);
        
        this.hasTransparency = false;
        this.tex = new THREE.DataTexture(rgbaData, 32, 32, THREE.RGBAFormat);
    }
    
    addFace(vert1, vert2, vert3, isFirst) {
        var first = this.vertices.length;
        this.vertices.push(vert1);
        this.vertices.push(vert2);
        this.vertices.push(vert3);
        var face = new THREE.Face3(first, first + 1, first + 2);
        face.vertexColors[0] = new THREE.Color(1, 1, 1);
        face.vertexColors[1] = new THREE.Color(1, 1, 1);
        face.vertexColors[2] = new THREE.Color(1, 1, 1);
        face.vertexNormals[0] = new THREE.Vector3(0, 1, 0);
        face.vertexNormals[1] = new THREE.Vector3(0, 1, 0);
        face.vertexNormals[2] = new THREE.Vector3(0, 1, 0);
        if(isFirst){
            face.uvs = [this.uv_a, this.uv_b, this.uv_c];
        } else {
            face.uvs = [this.uv_a, this.uv_c, this.uv_d];
        }
        this.triangles.push(face);
    }
}

class ForsakenLevelQuad {
    constructor(data, materials, vertices) {
        var a = bytes_to_int(data, 0);
        var b = bytes_to_int(data, 0x4);
        var c = bytes_to_int(data, 0x8);
        var d = bytes_to_int(data, 0xC);
        var materialID = bytes_to_ushort(data, 0x14);
        var flags = bytes_to_ushort(data, 0x16);
        materials[materialID].addFace(vertices[a], vertices[b], vertices[c], true);
        if(d > -1 && ((flags & 0x300) != 0x300)){
            materials[materialID].addFace(vertices[a], vertices[c], vertices[d], false);
        }
    }
}