/* Note: This isn't anywhere near complete yet! */
class ExtOBJExporter {
    constructor(scene) {
        // this.data = .obj text
        // this.mtlData = .mtl text
        // this.textures = array of texture data
        
        console.log(scene);
        
        var objText = '';
        var mtlText = '';
        var textures = [];
        
        // Each mesh in the scene has a copy of all the vertices (Probably a bad idea).
        var vertices = scene.children[0].geometry.vertices;
        var numVerts = vertices.length;
        for(var i = 0; i < numVerts; i++) {
            objText += 'v ' + vertices[i].x + ' ' + vertices[i].y + ' ' + vertices[i].z + ' '
            + vertices[i].color.r + ' ' + vertices[i].color.g + ' ' + vertices[i].color.b 
            + '\n';
        }
        
        scene.children.forEach(function(child) {
            if(child.type == 'Mesh') {
                var faces = child.geometry.faces;
                var numFaces = faces.length;
                for(var i = 0; i < numFaces; i++) {
                    objText += 'f ' + (faces[i].a + 1) + ' ' + (faces[i].b + 1) + ' ' + (faces[i].c + 1) + '\n';
                }
            }
        });
        
        this.data = objText;
        this.mtlData = mtlText;
        this.textures = textures;
    }
}