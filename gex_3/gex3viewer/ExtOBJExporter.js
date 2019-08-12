class ExtOBJExporter {
    constructor(scene, name, texDirName) {
        // this.data = .obj text
        // this.mtlData = .mtl text
        // this.textures = array of texture maps
        
        console.log(scene);
        
        var objText = '';
        var mtlText = '';
        var textures = [];
        var verticesBase = 0;
        var textureNum = 0;
        
        objText += 'mtllib ' + name + '.mtl\n\n';
        
        scene.children.forEach(function(child) {
            if(child.type === 'Mesh') {
                var textureName = 'texture_' + textureNum;
                
                var map = child.material.map;
                map.name = textureName + '.png';
                textures.push(map);
                
                /*** Update .mtl text ***/
                mtlText += 'newmtl ' + textureName + '\n';
                mtlText += 'Ka 1.00 1.00 1.00\n'; // Ambient color
                mtlText += 'Kd 1.00 1.00 1.00\n'; // Diffuse color
                mtlText += 'Ks 0.33 0.33 0.33\n'; // Specular color
                mtlText += 'map_Kd ' + texDirName + '/' + textureName + '.png\n\n'; // Diffuse Map
                
                /*** Update .obj text ***/
                objText += 'usemtl ' + textureName + '\n'
                
                var vertices = child.geometry.vertices;
                var numVerts = vertices.length;
                for(var i = 0; i < numVerts; i++) {
                    objText += 'v ' + vertices[i].x + ' ' + vertices[i].y + ' ' + vertices[i].z + ' ' + vertices[i].color.r + ' ' + vertices[i].color.g + ' ' + vertices[i].color.b + '\n';
                    objText += 'vt ' + vertices[i].uv.x + ' ' + (-vertices[i].uv.y) + '\n';
                }
                
                var faces = child.geometry.faces;
                var numFaces = faces.length;
                for(var i = 0; i < numFaces; i++) {
                    var indexA = faces[i].a + 1 + verticesBase;
                    var indexB = faces[i].b + 1 + verticesBase;
                    var indexC = faces[i].c + 1 + verticesBase;
                    objText += 'f ' + (indexA + '/' + indexA) + ' ' + (indexB + '/' + indexB) + ' ' + (indexC + '/' + indexC) + '\n';
                }
                
                objText += '\n';
                
                textureNum++;
                verticesBase += numVerts;
            }
        });
        
        this.data = objText;
        this.mtlData = mtlText;
        this.textures = textures;
    }
}