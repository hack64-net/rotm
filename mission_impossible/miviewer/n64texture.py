from enum import Enum

class FORMATS(Enum):
    RGBA16 = 0x10
    RGBA32 = 0x18
    YUV16  = 0x30
    CI4    = 0x40
    CI8    = 0x48
    IA4    = 0x60
    IA8    = 0x68
    IA16   = 0x70
    I4     = 0x80
    I8     = 0x88

class N64TextureDecoder:
        
    @staticmethod
    def get_number_bytes_for_texture_data(format, width, height):
        if format == FORMATS.RGBA16.value or format == FORMATS.IA16.value or format == FORMATS.YUV16.value:
            return width * height * 2
        elif format == FORMATS.RGBA32.value:
            return width * height * 4
        elif format == FORMATS.IA8.value or format == FORMATS.I8.value or format == FORMATS.CI8.value:
            return width * height
        elif format == FORMATS.IA4.value or format == FORMATS.I4.value or format == FORMATS.CI4.value:
            return width * height // 2
        else:
            return 0
        
    @staticmethod
    def decode_data(bytes, format, width, height):
        #print("format = " + hex(format))
        if format == FORMATS.RGBA16.value:
            return N64TextureDecoder.decode_rgba16(bytes, width, height)
        elif format == FORMATS.RGBA32.value:
            return N64TextureDecoder.decode_rgba32(bytes, width, height)
        elif format == FORMATS.IA4.value:
            return N64TextureDecoder.decode_ia4(bytes, width, height)
        elif format == FORMATS.IA8.value:
            return N64TextureDecoder.decode_ia8(bytes, width, height)
        elif format == FORMATS.IA16.value:
            return N64TextureDecoder.decode_ia16(bytes, width, height)
        elif format == FORMATS.I4.value:
            return N64TextureDecoder.decode_i4(bytes, width, height)
        elif format == FORMATS.I8.value:
            return N64TextureDecoder.decode_i8(bytes, width, height)
        else:
            print("Warning, Unknown format: " + hex(format))
            return []

    @staticmethod
    def decode_rgba16(bytes, width, height):
        if len(bytes) < width * height * 2:
            print("RGBA16 decode error: byte array smaller than texture size")
            return []
        texData = [0] * (width * height * 4)
        length = width * height
        for i in range(length):
            pixel = (bytes[i * 2] << 8) | bytes[i * 2 + 1]
            texData[(i * 4) + 0] = ((pixel >> 11) & 0x1F) * 8        # Red
            texData[(i * 4) + 1] = ((pixel >> 6) & 0x1F) * 8         # Green
            texData[(i * 4) + 2] = ((pixel >> 1) & 0x1F) * 8         # Blue
            texData[(i * 4) + 3] = 0xFF if (pixel & 1) > 0 else 0x00 # Transparency
        return texData
        
    @staticmethod
    def decode_rgba32(bytes, width, height):
        #print('[RGBA32] len(bytes) = ' + hex(len(bytes)) + ', w*h*4 = ' + hex(width * height * 4))
        if len(bytes) < width * height * 4:
            print("RGBA32 decode error: byte array smaller than texture size")
            return []
        return bytes
        
    @staticmethod
    def decode_ia4(bytes, width, height):
        #print('[IA4] len(bytes) = ' + hex(len(bytes)))
        if len(bytes) < width * height // 2:
            print("IA4 decode error: byte array smaller than texture size")
            return []
        
        texData = [0] * (width * height * 4)
        length = width * height
        for i in range(length):
            intensity1 = (bytes[i] >> 5) & 0x7
            alpha1 = (bytes[i] >> 4) & 0x1
            intensity2 = (bytes[i] >> 1) & 0x7
            alpha2 = bytes[i] & 0x1
            texData[(i * 8) + 0] = intensity1 # Red
            texData[(i * 8) + 1] = intensity1 # Green
            texData[(i * 8) + 2] = intensity1 # Blue
            texData[(i * 8) + 3] = alpha1     # Transparency
            texData[(i * 8) + 0] = intensity2 # Red
            texData[(i * 8) + 1] = intensity2 # Green
            texData[(i * 8) + 2] = intensity2 # Blue
            texData[(i * 8) + 3] = alpha2     # Transparency
        
        return texData

    @staticmethod
    def decode_ia8(bytes, width, height):
        #print('[IA8] len(bytes) = ' + hex(len(bytes)))
        if len(bytes) < width * height:
            print("IA8 decode error: byte array smaller than texture size")
            return []
        
        texData = [0] * (width * height * 4)
        length = width * height
        for i in range(length):
            intensity = (bytes[i] >> 4) & 0xF
            alpha = bytes[i] & 0xF
            texData[(i * 4) + 0] = intensity # Red
            texData[(i * 4) + 1] = intensity # Green
            texData[(i * 4) + 2] = intensity # Blue
            texData[(i * 4) + 3] = alpha     # Transparency
        
        return texData
        
    @staticmethod
    def decode_ia16(bytes, width, height):
        #print('[IA16] len(bytes) = ' + hex(len(bytes)))
        if len(bytes) < width * height * 2:
            print("IA16 decode error: byte array smaller than texture size")
            return []
        
        texData = [0] * (width * height * 4)
        length = width * height
        for i in range(length):
            intensity = bytes[i * 2]
            alpha = bytes[i * 2 + 1]
            texData[(i * 4) + 0] = intensity # Red
            texData[(i * 4) + 1] = intensity # Green
            texData[(i * 4) + 2] = intensity # Blue
            texData[(i * 4) + 3] = alpha     # Transparency
        
        return texData

    @staticmethod
    def decode_i4(bytes, width, height):
        #print('[I4] len(bytes) = ' + hex(len(bytes)))
        if len(bytes) < (width * height) // 2:
            print("I4 decode error: byte array smaller than texture size")
            return []
        
        texData = [0] * (width * height * 4)
        
        length = width * height
        for i in range(length):
            pixel1 = (bytes[i] >> 4) & 0xF
            pixel2 = bytes[i] & 0xF
            
            texData[(i * 8) + 0] = pixel1 # Red
            texData[(i * 8) + 1] = pixel1 # Green
            texData[(i * 8) + 2] = pixel1 # Blue
            texData[(i * 8) + 3] = 0xFF   # Transparency
            texData[(i * 8) + 4] = pixel2 # Red
            texData[(i * 8) + 5] = pixel2 # Green
            texData[(i * 8) + 6] = pixel2 # Blue
            texData[(i * 8) + 7] = 0xFF   # Transparency
        
        return texData

    @staticmethod
    def decode_i8(bytes, width, height):
        #print('[I8] len(bytes) = ' + hex(len(bytes)))
        if len(bytes) < width * height:
            print("I8 decode error: byte array smaller than texture size")
            return []
        
        length = width * height
        texData = [0] * length * 4
        for i in range(length):
            pixel = bytes[i]
            texData[(i * 4) + 0] = pixel # Red
            texData[(i * 4) + 1] = pixel # Green
            texData[(i * 4) + 2] = pixel # Blue
            texData[(i * 4) + 3] = 0xFF  # Transparency
        
        return texData

