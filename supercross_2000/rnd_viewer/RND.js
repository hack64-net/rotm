class RND_Util {
    static bytes_to_short_le(bytes, offset) {
        var val = (bytes[offset+1] << 8) | bytes[offset+0];
        return (val << 16) >> 16; // Javascript uses 32-bit integers
    }
}

class RND_Point {
    constructor(x, y, z) {
        this.vec3 = new THREE.Vector3(x, y, z);
    }
}

class RND_Vertex {
    constructor(pointID) {
        this.pointID = pointID;
    }
}

class RND_Triangle {
    constructor(v1, v2, v3, p1, p2, p3) {
        this.vertexIDs = new THREE.Vector3(v1, v2, v3);
        this.face3 = new THREE.Face3(p1, p2, p3);
    }
}

class RND {
    constructor(bytes) {
        var num_points = RND_Util.bytes_to_short_le(bytes, 0x28);
        var num_verts = RND_Util.bytes_to_short_le(bytes, 0x2A);
        var num_triangles = RND_Util.bytes_to_short_le(bytes, 0x2C);
        this.points = [];
        this.vertices = [];
        this.triangles = [];
        
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
        
        for(var i = 0; i < num_verts; i++) {
            var pointID = RND_Util.bytes_to_short_le(bytes, offset + 8);
            this.vertices.push(new RND_Vertex(pointID));
            offset += 10;
        }
        
        for(var i = 0; i < num_triangles; i++) {
            var v1 = RND_Util.bytes_to_short_le(bytes, offset);
            var v2 = RND_Util.bytes_to_short_le(bytes, offset + 2);
            var v3 = RND_Util.bytes_to_short_le(bytes, offset + 4);
            var p1 = this.vertices[v1].pointID
            var p2 = this.vertices[v2].pointID
            var p3 = this.vertices[v3].pointID
            this.triangles.push(new RND_Triangle(v1, v2, v3, p1, p2, p3));
            offset += 8;
        }
        
        console.log(this)
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












