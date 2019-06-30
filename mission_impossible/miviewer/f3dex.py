from OpenGL.GLUT import *
from OpenGL.GLU import *
from OpenGL.GL import *
from renderModes import *
from n64texture import N64TextureDecoder
from exportOBJ import ExportOBJ
from enum import Enum

class Vtx:
    def __init__(self, x, y, z, u, v, nxr, nyg, nzb, a):
        self.x = x 
        self.y = y 
        self.z = z 
        self.u = u 
        self.v = v 
        self.nxr = nxr # Normal X value or red color
        self.nyg = nyg # Normal Y value or green color
        self.nzb = nzb # Normal Z value or blue color
        self.a = a # transparency

class VtxCollection:
    def __init__(self, bytes):
        numBytes = len(bytes)
        if numBytes == 0 or numBytes % 16 != 0:
            raise Exception('[VtxCollection.init] Incorrect array size')
        numVertices = int(numBytes / 16)
        self.vertices = [None] * numVertices
        for i in range(numVertices):
            offset = i * 16
            x = self.intToSignedShort(((bytes[offset] << 8) | (bytes[offset + 1])))
            y = self.intToSignedShort(((bytes[offset + 2] << 8) | (bytes[offset + 3])))
            z = self.intToSignedShort(((bytes[offset + 4] << 8) | (bytes[offset + 5])))
            UV_SCALE = 0.001
            u = self.intToSignedShort((bytes[offset + 8] << 8) | (bytes[offset + 9])) * UV_SCALE
            v = self.intToSignedShort((bytes[offset + 10] << 8) | (bytes[offset + 11])) * UV_SCALE
            nxr = bytes[offset + 12]
            nyg = bytes[offset + 13]
            nzb = bytes[offset + 14]
            a = bytes[offset + 15]
            self.vertices[i] = Vtx(x, y, z, u, v, nxr, nyg, nzb, a)
            
    def intToSignedShort(self, val):
        if val > 32767:
            return val - 65536
        return val
        
    def get_bounding_box(self):
        min = [99999.0, 99999.0, 99999.0]
        max = [-99999.0, -99999.0, -99999.0]
        for vtx in self.vertices:
            if vtx.x < min[0]:
                min[0] = vtx.x
            if vtx.x > max[0]:
                max[0] = vtx.x
            if vtx.y < min[1]:
                min[1] = vtx.y
            if vtx.y > max[1]:
                max[1] = vtx.y
            if vtx.z < min[2]:
                min[2] = vtx.z
            if vtx.z > max[2]:
                max[2] = vtx.z
        return [min, max]
        
class Material:
    def __init__(self, segAddress=0, tex_id=-1, size=[0,0], texScale=[0,0], format=0, wrapS=0, wrapT=0, geoMode=0, texData=[]):
        self.address = segAddress
        self.GLid = tex_id # if id is -1, then material has no texture.
        self.size = [size[0], size[1]] # deep copy
        self.UVScale = [texScale[0], texScale[1]] # deep copy
        self.format = format
        self.wrapS = wrapS
        self.wrapT = wrapT
        self.geometryMode = geoMode
        self.texData = texData
        self.triangles = []

    def __str__(self):
        return str(self.__class__) + ": " + str(self.__dict__)
            
class F3DEX:
    class GEOMETRY_MODES(Enum):
        G_ZBUFFER            = 0x00000001
        G_SHADE              = 0x00000004
        G_SHADING_SMOOTH     = 0x00000200
        G_CULL_FRONT         = 0x00001000
        G_CULL_BACK          = 0x00002000
        G_FOG                = 0x00010000
        G_LIGHTING           = 0x00020000
        G_TEXTURE_GEN        = 0x00040000
        G_TEXTURE_GEN_LINEAR = 0x00080000

    class CMDS(Enum):
        VTX            = 0x04
        TRI2           = 0xB1
        CLEARGEOMODE   = 0xB6
        SETGEOMODE     = 0xB7
        SETOTHERMODE_L = 0xB9
        SETOTHERMODE_H = 0xBA
        TEXTURE        = 0xBB
        TRI1           = 0xBF
        SETTILESIZE    = 0xF2
        SETTILE        = 0xF5
        SETPRIMCOLOR   = 0xFA
        SETENVCOLOR    = 0xFB
        SETCOMBINE     = 0xFC
        SETTIMG        = 0xFD

    def __init__(self, segments, numOfSeg7Textures):
        self.isFirstIteration = {}
        self.numOfSeg7Textures = numOfSeg7Textures
        self.currentSeg7TextureIndex = 0
        self.currentSeg7TextureSize = 0
        self.segments = segments
        self.drawTriangles = False
        self.loadedMaterial = False
        self.verticesAddress = 0 # segment address to vertices
        self.vertices = {} # Dictionary of vertex collections.
        self.materialTexSize = [0, 0]
        self.materialUVTexScale = [0.0, 0.0]
        self.materialTexAddress = 0
        self.materialTexFormat = 0
        self.materialWrapS = GL_CLAMP
        self.materialWrapT = GL_CLAMP
        self.materialTextureEnabled = False
        self.textures = {} # Dictionary of textures
        self.materials = { 0 : Material() } # Dictionary of materials, contains a single null material.
        self.curMaterial = self.materials[0]
        self.curGeometryMode = 0
        
    def get_bounding_box(self):
        min = [99999.0, 99999.0, 99999.0]
        max = [-99999.0, -99999.0, -99999.0]
        for index in self.vertices:
            bb = self.vertices[index].get_bounding_box()
            if bb[0][0] < min[0]:
                min[0] = bb[0][0]
            if bb[1][0] > max[0]:
                max[0] = bb[1][0]
            if bb[0][1] < min[1]:
                min[1] = bb[0][1]
            if bb[1][1] > max[1]:
                max[1] = bb[1][1]
            if bb[0][2] < min[2]:
                min[2] = bb[0][2]
            if bb[1][2] > max[2]:
                max[2] = bb[1][2]
        return [min, max]
        
    def bytesToInt(self, segment, offset):
        return (self.segments[segment][offset] << 24) | (self.segments[segment][offset + 1] << 16) | (self.segments[segment][offset + 2] << 8) | (self.segments[segment][offset + 3])

    def exportToOBJ(self, name):
        ExportOBJ.write(name, self.materials)
        
    def parse(self, segmentAddress, currentSeg7TextureIndex):
        if not segmentAddress in self.isFirstIteration:
            self.isFirstIteration[segmentAddress] = True
        elif self.isFirstIteration[segmentAddress]:
            self.isFirstIteration[segmentAddress] = False
        self.parsingSegmentAddress = segmentAddress
        self.currentSeg7TextureIndex = currentSeg7TextureIndex
        segment = (segmentAddress >> 24) & 0xFF
        offset = segmentAddress & 0x00FFFFFF
        if offset >= len(self.segments[segment]):
            return
        cmd = self.segments[segment][offset]
        while cmd != 0xB8:
            if self.drawTriangles and not (cmd == self.CMDS.TRI1.value or cmd == self.CMDS.TRI2.value):
                glEnd()
                self.drawTriangles = False
            word1 = self.bytesToInt(segment, offset)
            word2 = self.bytesToInt(segment, offset + 4)
            self.parseCMD(cmd, word1, word2)
            offset += 8
            cmd = self.segments[segment][offset]
        if self.drawTriangles:
            glEnd()
            self.drawTriangles = False
    
    def parseCMD(self, cmd, word1, word2):
        if cmd == self.CMDS.VTX.value:
            numVerts = (word1 & 0xFFFF) >> 10
            self.loadVertices(numVerts, word2)
        elif cmd == self.CMDS.TRI1.value:
            v1_index = ((word2 >> 16) & 0xFF) // 2
            v2_index = ((word2 >> 8) & 0xFF) // 2
            v3_index = (word2 & 0xFF) // 2
            self.drawTriangle(self.vertices[self.verticesAddress].vertices[v1_index], self.vertices[self.verticesAddress].vertices[v2_index], self.vertices[self.verticesAddress].vertices[v3_index])
        elif cmd == self.CMDS.TRI2.value:
            v1_index = ((word1 >> 16) & 0xFF) // 2
            v2_index = ((word1 >> 8) & 0xFF) // 2
            v3_index = (word1 & 0xFF) // 2
            v4_index = ((word2 >> 16) & 0xFF) // 2
            v5_index = ((word2 >> 8) & 0xFF) // 2
            v6_index = (word2 & 0xFF) // 2
            self.drawTriangle(self.vertices[self.verticesAddress].vertices[v1_index], self.vertices[self.verticesAddress].vertices[v2_index], self.vertices[self.verticesAddress].vertices[v3_index])
            self.drawTriangle(self.vertices[self.verticesAddress].vertices[v4_index], self.vertices[self.verticesAddress].vertices[v5_index], self.vertices[self.verticesAddress].vertices[v6_index])
        elif cmd == self.CMDS.SETTIMG.value:
            self.setTextureAddress(word2)
        elif cmd == self.CMDS.SETTILESIZE.value:
            width = (((word2 >> 12) & 0xFFF) >> 2) + 1
            height = ((word2 & 0xFFF) >> 2) + 1
            self.setTextureSize(width, height)
        elif cmd == self.CMDS.SETTILE.value:
            tile = (word2 >> 24) & 0x7
            format = 0
            if tile < 7:
                format = (word1 >> 16) & 0xF8
            wrapS = GL_REPEAT
            wrapT = GL_REPEAT
            wrapSVal = (word2 >> 8) & 0x3
            wrapTVal = (word2 >> 18) & 0x3
            if wrapSVal == 1:
                wrapS = GL_MIRRORED_REPEAT
            elif wrapSVal == 2:
                wrapS = GL_CLAMP_TO_EDGE
            if wrapTVal == 1:
                wrapT = GL_MIRRORED_REPEAT
            elif wrapTVal == 2:
                wrapT = GL_CLAMP_TO_EDGE
            self.setTile(format, wrapS, wrapT)
        elif cmd == self.CMDS.TEXTURE.value:
            enabled = word1 & 0xFF
            self.texture(enabled)
        elif cmd == self.CMDS.SETGEOMODE.value:
            self.set_geometry_mode(word2)
        elif cmd == self.CMDS.CLEARGEOMODE.value:
            self.clear_geometry_mode(word2)
        elif cmd == self.CMDS.SETOTHERMODE_L.value:
            if word1 == 0xB900031D: # If setRenderMode
                renderMode = word2
                if does_render_mode_contain_transparency(renderMode):
                    glEnable(GL_BLEND)
                    glEnable(GL_ALPHA_TEST)
                else:
                    glDisable(GL_BLEND)
                    glDisable(GL_ALPHA_TEST)
            
    def set_geometry_mode(self, mode):
        self.curGeometryMode |= mode
        
    def clear_geometry_mode(self, mode):
        self.curGeometryMode &= ~mode
    
    def texture(self, enabled):
        if enabled == 1:
            glEnable(GL_TEXTURE_2D)
            self.materialTextureEnabled = True
        else:
            glDisable(GL_TEXTURE_2D)
            self.materialTextureEnabled = False
            
    def setTextureAddress(self, segmentAddress):
        self.materialTexAddress = segmentAddress
        self.loadedMaterial = False
        
    def setTile(self, format, wrapS, wrapT):
        if format != 0:
            self.materialTexFormat = format
        self.materialWrapS = wrapS
        self.materialWrapT = wrapT
        self.loadedMaterial = False
        
    def setTextureSize(self, width, height):
        self.materialTexSize[0] = width
        self.materialTexSize[1] = height
        self.materialUVTexScale[0] = 32.0 / width 
        self.materialUVTexScale[1] = 32.0 / height 
        self.loadedMaterial = False
        
    def loadVertices(self, numVertices, segmentAddress):
        if not segmentAddress in self.vertices:
            segment = (segmentAddress >> 24) & 0xFF
            offset = segmentAddress & 0x00FFFFFF
            rangeEnd = offset+(numVertices * 16)
            self.vertices[segmentAddress] = VtxCollection(self.segments[segment][offset:rangeEnd])
            print('Loaded new vertices from segment address: ' + hex(segmentAddress))
        self.verticesAddress = segmentAddress
    
    
    def load_and_bind_texture(self, segment, offset, numBytes):
        segmentAddress = (segment << 24) | offset
        rangeEnd = offset + numBytes
        bytes = []
        id = -1
        if self.segments[segment] != None:
            self.textures[segmentAddress] = glGenTextures(1)
            id = self.textures[segmentAddress]
            bytes = self.segments[segment][offset:rangeEnd]
            
        texData = N64TextureDecoder.decode_data(bytes, self.materialTexFormat, self.materialTexSize[0], self.materialTexSize[1])

        glBindTexture(GL_TEXTURE_2D, self.textures[segmentAddress])
        glPixelStorei(GL_UNPACK_ALIGNMENT,1)
        glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, self.materialWrapS)
        glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, self.materialWrapT)
        glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR)
        glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR)
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, self.materialTexSize[0], self.materialTexSize[1], 0, GL_RGBA, GL_UNSIGNED_BYTE, texData)
        
        self.materials[segmentAddress] = Material(segmentAddress, id, self.materialTexSize, self.materialUVTexScale, self.materialTexFormat, self.materialWrapS, self.materialWrapT, self.curGeometryMode, texData)
        self.curMaterial = self.materials[segmentAddress]
        
    
    # special case for segment 7 textures
    def loadSegment7Textures(self):
        self.currentSeg7TextureSize = N64TextureDecoder.get_number_bytes_for_texture_data(self.materialTexFormat, self.materialTexSize[0], self.materialTexSize[1])
        for i in range(self.numOfSeg7Textures):
            segAddress = self.bytesToInt(7, i * 4)
            segment = (segAddress >> 24) & 0xFF
            self.load_and_bind_texture(segment, segAddress & 0x00FFFFFF, self.currentSeg7TextureSize)
        
    def loadMaterial(self):
        segment = (self.materialTexAddress >> 24) & 0xFF
        if not self.materialTexAddress in self.textures:
            if segment == 7:
                self.loadSegment7Textures()
                self.textures[self.materialTexAddress] = 0xDEADBEEF # Just here to occupy a place
                return 
            elif segment == 1 or segment == 4:
                numBytes = N64TextureDecoder.get_number_bytes_for_texture_data(self.materialTexFormat, self.materialTexSize[0], self.materialTexSize[1])
                self.load_and_bind_texture(segment, self.materialTexAddress & 0x00FFFFFF, numBytes)
                print("Loaded new texture: " + hex(self.materialTexAddress))
                return
            else:
                print("loadMaterial error: Using unknown segment: " + hex(segment))
                return
        else:
            if segment == 7:
                address = self.bytesToInt(0x07, self.currentSeg7TextureIndex * 4)
                glBindTexture(GL_TEXTURE_2D, self.textures[address])
                self.curMaterial = self.materials[address]
            else:
                glBindTexture(GL_TEXTURE_2D, self.textures[self.materialTexAddress])
                self.curMaterial = self.materials[self.materialTexAddress]
            glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, self.materialWrapS)
            glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, self.materialWrapT)
            glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR)
            glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR)
        
    
    def drawTriangle(self, v1, v2, v3):
        if not self.loadedMaterial:
            self.loadMaterial()
            self.loadedMaterial = True
        if not self.drawTriangles:
            glBegin(GL_TRIANGLES)
            self.drawTriangles = True
        if self.isFirstIteration[self.parsingSegmentAddress]:
            self.curMaterial.triangles.append([v1, v2, v3])
        useVertexColors = (self.curGeometryMode & self.GEOMETRY_MODES.G_LIGHTING.value) == 0
        if useVertexColors:
            glColor3ub(v1.nxr, v1.nyg, v1.nzb)
        glTexCoord2f(v1.u * self.materialUVTexScale[0], v1.v * self.materialUVTexScale[1]);
        glVertex3f(v1.x, v1.y, v1.z)
        if useVertexColors:
            glColor3ub(v2.nxr, v2.nyg, v2.nzb)
        glTexCoord2f(v2.u * self.materialUVTexScale[0], v2.v * self.materialUVTexScale[1]);
        glVertex3f(v2.x, v2.y, v2.z)
        if useVertexColors:
            glColor3ub(v3.nxr, v3.nyg, v3.nzb)
        glTexCoord2f(v3.u * self.materialUVTexScale[0], v3.v * self.materialUVTexScale[1]);
        glVertex3f(v3.x, v3.y, v3.z)