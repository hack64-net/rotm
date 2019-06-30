import png
import os
from OpenGL.GL import *

OUTPUT_DIR = 'export/'

class ExportOBJ:
    @staticmethod
    def write(name, materials):
        if not os.path.exists(OUTPUT_DIR):
            os.mkdir(OUTPUT_DIR)
        out_str = 'mtllib ' + name + '.mtl\n'
        totalNumTriangles = 0
        mtl_file_ref = ['']
        vertices = []
        texCoords = []
        texIndex = 0
        for material in materials:
            m = materials[material]
            if ExportOBJ.write_material(name, texIndex, m, mtl_file_ref):
                texIndex += 1
            out_str += 'usemtl ' + hex(m.address) + '\n'
            totalNumTriangles += len(m.triangles)
            for triangle in m.triangles:
                v1 = triangle[0]
                v2 = triangle[1]
                v3 = triangle[2]
                v1_str = ExportOBJ.write_vertex(True, v1.x, v1.y, v1.z, v1.nxr, v1.nyg, v1.nzb)
                v2_str = ExportOBJ.write_vertex(True, v2.x, v2.y, v2.z, v2.nxr, v2.nyg, v2.nzb)
                v3_str = ExportOBJ.write_vertex(True, v3.x, v3.y, v3.z, v3.nxr, v3.nyg, v3.nzb)
                if not v1_str in vertices:
                    vertices.append(v1_str)
                    out_str += v1_str + '\n'
                if not v2_str in vertices:
                    vertices.append(v2_str)
                    out_str += v2_str + '\n'
                if not v3_str in vertices:
                    vertices.append(v3_str)
                    out_str += v3_str + '\n'
                v1_index = vertices.index(v1_str) + 1
                v2_index = vertices.index(v2_str) + 1
                v3_index = vertices.index(v3_str) + 1
                if m.GLid == -1: 
                    # No texture
                    out_str += ExportOBJ.write_face([v1_index], [v2_index], [v3_index]) + '\n'
                else: 
                    # Has texture, so also include UV coordinates.
                    v1_u = v1.u * m.UVScale[0]
                    v1_v = v1.v * m.UVScale[1]
                    v2_u = v2.u * m.UVScale[0]
                    v2_v = v2.v * m.UVScale[1]
                    v3_u = v3.u * m.UVScale[0]
                    v3_v = v3.v * m.UVScale[1]
                    
                    # Note: Wrap & Mirror modes are not taken into account.
                    
                    tc1_str = ExportOBJ.write_tex_coordinate(v1_u, v1_v)
                    if not tc1_str in texCoords:
                        texCoords.append(tc1_str)
                        out_str += tc1_str + '\n'
                        
                    tc2_str = ExportOBJ.write_tex_coordinate(v2_u, v2_v)
                    if not tc2_str in texCoords:
                        texCoords.append(tc2_str)
                        out_str += tc2_str + '\n'
                        
                    tc3_str = ExportOBJ.write_tex_coordinate(v3_u, v3_v)
                    if not tc3_str in texCoords:
                        texCoords.append(tc3_str)
                        out_str += tc3_str + '\n'
                        
                    tc1_index = texCoords.index(tc1_str) + 1
                    tc2_index = texCoords.index(tc2_str) + 1
                    tc3_index = texCoords.index(tc3_str) + 1
                    out_str += ExportOBJ.write_face([v1_index, tc1_index], [v2_index, tc2_index], [v3_index, tc3_index]) + '\n'
        #print(out_str)
        with open(OUTPUT_DIR + name + '.obj', "w") as text_file:
            text_file.write(out_str)
        with open(OUTPUT_DIR + name + '.mtl', "w") as text_file:
            text_file.write(mtl_file_ref[0])
        print(name + ' exported! It had ' + str(totalNumTriangles) + ' triangles!')
    
    @staticmethod
    def write_vertex(usingColor, x, y, z, r, g, b):
        values = [x, y, z]
        if usingColor:
            values.append(r / 255.0)
            values.append(g / 255.0)
            values.append(b / 255.0)
        return 'v ' + (' '.join((str(i) for i in values)))
        
    @staticmethod
    def write_tex_coordinate(u, v):
        return 'vt ' + str(u) + ' ' + str(v)
        
    @staticmethod
    # v = [vertex, texture coordinates, normals]
    def write_face(v1, v2, v3):
        return 'f ' + ('/'.join((str(i) for i in v1))) + ' ' + ('/'.join((str(i) for i in v2))) + ' ' + ('/'.join((str(i) for i in v3)))
        
    @staticmethod
    def write_material(name, index, material, mtl_ref):
        mtl_ref[0] += 'newmtl ' + hex(material.address) + '\n'
        mtl_ref[0] += 'Ka 0.0 0.0 0.0\n'
        mtl_ref[0] += 'Kd 1.0 1.0 1.0\n'
        mtl_ref[0] += 'Ks 0.33 0.33 0.33\n'
        if material.GLid > -1:
            if not os.path.exists(OUTPUT_DIR + name):
                os.mkdir(OUTPUT_DIR + name)
            filepath = name + '/' + str(index)
            ExportOBJ.write_png(OUTPUT_DIR + filepath, material.size[0], material.size[1], material.texData)
            mtl_ref[0] += 'map_Kd ' + filepath + '.png\n\n'
            return True # increment texture index
        mtl_ref[0] += '\n'
        return False
        
    @staticmethod
    def flip_texture_vertically(pixels, width, height):
        newPixels = []
        for y in range(height, 0, -1):
            for x in range(0, width):
                index = (y - 1) * (width * 4) + (x * 4)
                newPixels.append(pixels[index + 0])
                newPixels.append(pixels[index + 1])
                newPixels.append(pixels[index + 2])
                newPixels.append(pixels[index + 3])
        return newPixels
        
    @staticmethod
    def write_png(name, texWidth, texHeight, pixels):
        export_pixels = ExportOBJ.flip_texture_vertically(pixels, texWidth, texHeight)
        f = open(name + '.png', 'wb')
        writer = png.Writer(width=texWidth, height=texHeight, alpha=True)
        writer.write_array(f, export_pixels)
        f.close()

