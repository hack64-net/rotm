class RND_Util {
    static bytes_to_int(bytes, offset) {
        return (bytes[offset+0] << 24) | (bytes[offset+1] << 16) | 
               (bytes[offset+2] << 8) | bytes[offset+3];
    }
    static bytes_to_short_le(bytes, offset) {
        var val = (bytes[offset+1] << 8) | bytes[offset+0];
        return (val << 16) >> 16; // Javascript uses 32-bit integers
    }
    static get_string(bytes, offset) {
        var result = "";
        while(bytes[offset] != 0) {
            result+= (String.fromCharCode(bytes[offset++]));
        }
        return result;
    }
    static get_shpn_name(bytes, offset) {
        var result = "";
        for(var i = offset; i < offset + 4; ++i) {
            result+= (String.fromCharCode(bytes[i]));
        }
        return result;
    }
}

class RND_Point {
    constructor(x, y, z) {
        this.vec3 = new THREE.Vector3(x, y, z);
    }
}

class RND_Vertex {
    constructor(pointID, r, g, b, u, v) {
        this.uv = new THREE.Vector2(u, v);
        this.color = new THREE.Color(r / 255, g / 255, b / 255);
        this.pointID = pointID;
    }
}

class RND_Triangle {
    constructor(v1, v2, v3, matID) {
        var p1 = v1.pointID
        var p2 = v2.pointID
        var p3 = v3.pointID
        this.materialID = matID;
        this.face3 = new THREE.Face3(p1, p2, p3);
        this.face3.vertexColors[0] = v1.color
        this.face3.vertexColors[1] = v2.color
        this.face3.vertexColors[2] = v3.color
        this.Uvs = [v1.uv, v2.uv, v3.uv]
    }
}

class RND_Material { 
    constructor(name, textureName) {
        this.name = name;
        this.texName = textureName;
    }
}


class RND_Unk {} // 2 bytes each
class RND_Unk2 {} // 0x2E bytes each
class RND_Unk3 {} // 0xE bytes each
class RND_Unk4 {} // ??? bytes each
class RND_Unk5 {} // ??? bytes each
class RND_Unk6 {} // ??? bytes each

class RND {
    constructor(bytes) {
        var num_points = RND_Util.bytes_to_short_le(bytes, 0x28);
        var num_verts = RND_Util.bytes_to_short_le(bytes, 0x2A);
        var num_triangles = RND_Util.bytes_to_short_le(bytes, 0x2C);
        
        var num_materials = RND_Util.bytes_to_short_le(bytes, 0x2E);
        var num_unk = RND_Util.bytes_to_short_le(bytes, 0x30);
        var num_unk2 = RND_Util.bytes_to_short_le(bytes, 0x32);
        var num_unk3 = bytes[0x34];
        var num_unk4 = bytes[0x35];
        var num_unk5 = RND_Util.bytes_to_short_le(bytes, 0x36);
        var num_unk6 = RND_Util.bytes_to_short_le(bytes, 0x38);
        
        this.points = [];
        this.vertices = [];
        this.triangles = [];
        this.materials = [];
        
        this.SHPN = null;
        
        // Bounding box points
        this.max_point = new RND_Point(0, 0, 0);
        this.min_point = new RND_Point(0, 0, 0);
        
        var offset = 0x40;
        
        for(var i = 0; i < num_points; i++) {
            var x = RND_Util.bytes_to_short_le(bytes, offset);
            var y = RND_Util.bytes_to_short_le(bytes, offset + 2);
            var z = RND_Util.bytes_to_short_le(bytes, offset + 4);
            var newPoint = new RND_Point(x, y, z);
            this._check_points_min_max(newPoint);
            this.points.push(newPoint);
            offset += 6;
        }
        console.log('offset = ' + offset.toString(16))
        
        for(var i = 0; i < num_verts; i++) {
            var u = RND_Util.bytes_to_short_le(bytes, offset);
            var v = RND_Util.bytes_to_short_le(bytes, offset + 2);
            var red = bytes[offset + 4];
            var green = bytes[offset + 5];
            var blue = bytes[offset + 6];
            var pointID = RND_Util.bytes_to_short_le(bytes, offset + 8);
            this.vertices.push(new RND_Vertex(pointID, red, green, blue, u, v));
            offset += 10;
        }
        console.log('offset = ' + offset.toString(16))
        
        for(var i = 0; i < num_triangles; i++) {
            var v1 = RND_Util.bytes_to_short_le(bytes, offset);
            var v2 = RND_Util.bytes_to_short_le(bytes, offset + 2);
            var v3 = RND_Util.bytes_to_short_le(bytes, offset + 4);
            var materialID = bytes[offset + 6];// RND_Util.bytes_to_short_le(bytes, offset + 6);
            
            this.triangles.push(
                new RND_Triangle(this.vertices[v1], this.vertices[v2], this.vertices[v3], materialID)
            );
            offset += 8;
        }
        console.log('offset = ' + offset.toString(16))
        
        //offset += 0x43 * num_materials;
        for(var i = 0; i < num_materials; i++) {
            var mat_name = RND_Util.get_string(bytes, offset);
            var tex_name = RND_Util.get_shpn_name(bytes, offset + 0x20);
            this.materials.push(
                new RND_Material(mat_name, tex_name)
            );
            offset += 0x43;
        }
        console.log('offset = ' + offset.toString(16))
        
        
        offset += 2 * num_unk;
        console.log('offset = ' + offset.toString(16))
        
        offset += 0x2E * num_unk2;
        console.log('offset = ' + offset.toString(16))
        
        offset += 0xE * num_unk3;
        console.log('offset = ' + offset.toString(16))
        
        offset += 0x10 * num_unk5;
        console.log('offset = ' + offset.toString(16))
        
        offset += 8 * num_unk6;
        console.log('offset = ' + offset.toString(16))
        
        
    }
    
    load_SHPN(nsh_bytes) {
        var signature = RND_Util.get_shpn_name(nsh_bytes, 0);
        if(signature != "SHPN") {
            alert("Invalid SHPN file!");
        } else {
            this.SHPN = new SHPN(nsh_bytes);
            for(var i = 0; i < this.materials.length; i++) {
                var raw_tex_array = this.SHPN.get_texture_data_by_name(this.materials[i].texName);
                var tex_data = new Uint8Array(raw_tex_array);
                var tex_size = this.SHPN.get_texture_size_by_name(this.materials[i].texName)
                if(tex_data.length > 0) {
                    this.materials[i].tex_width = tex_size[0]
                    this.materials[i].tex_height = tex_size[1]
                    this.materials[i].tex = new THREE.DataTexture(tex_data, tex_size[0], tex_size[1], THREE.RGBAFormat);
                    this.materials[i].tex.WrapS = THREE.RepeatWrapping;
                    this.materials[i].tex.WrapT = THREE.RepeatWrapping;
                    this.materials[i].tex.repeat.x = 32
                    this.materials[i].tex.repeat.y = 32
                    this.materials[i].tex.needsUpdate = true;
                } else {
                    console.log("Null material! Tex Name = " + this.materials[i].texName)
                    this.materials[i].tex_width = 0
                    this.materials[i].tex_height = 0
                }
            }
        }
    }
    
    _check_points_min_max(point) {
        if(point.vec3.x < this.min_point.vec3.x)
            this.min_point.vec3.x = point.vec3.x;
        if(point.vec3.y < this.min_point.vec3.y)
            this.min_point.vec3.y = point.vec3.y;
        if(point.vec3.z < this.min_point.vec3.z)
            this.min_point.vec3.z = point.vec3.z;
        if(point.vec3.x > this.max_point.vec3.x)
            this.max_point.vec3.x = point.vec3.x;
        if(point.vec3.y > this.max_point.vec3.y)
            this.max_point.vec3.y = point.vec3.y;
        if(point.vec3.z > this.max_point.vec3.z)
            this.max_point.vec3.z = point.vec3.z;
    }
}












