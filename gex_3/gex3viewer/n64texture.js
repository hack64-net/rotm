FORMATS = {
    'RGBA16' : 0x10,
    'RGBA32' : 0x18,
    'YUV16'  : 0x30,
    'CI4'    : 0x40,
    'CI8'    : 0x48,
    'IA4'    : 0x60,
    'IA8'    : 0x68,
    'IA16'   : 0x70,
    'I4'     : 0x80,
    'I8'     : 0x88
}

class N64TextureDecoder {
    static does_texture_have_transparency(rgba32Data) {
        var length = rgba32Data.length / 4;
        for(var i = 0; i < length; i++){
            if(rgba32Data[i*4+3] < 0xFF) {
                return true;
            }
        }
        return false;
    }
    
    static get_number_bytes_for_texture_data(format, width, height) {
        if (format == FORMATS['RGBA16'] || format == FORMATS['IA16'] || format == FORMATS['YUV16'])
            return width * height * 2
        else if (format == FORMATS['RGBA32'])
            return width * height * 4
        else if (format == FORMATS['IA8'] || format == FORMATS['I8'] || format == FORMATS['CI8'])
            return width * height
        else if (format == FORMATS['IA4'] || format == FORMATS['I4'] || format == FORMATS['CI4'])
            return width * height / 2
        else
            return 0
    }
    
    static decode_data(bytes, paletteColors, format, width, height) {
        var value;
        
        // Detect if format is a string or a number.
        if (typeof format === 'string' || format instanceof String){
            format = format.toUpperCase();
            value = FORMATS[format];
        } else {
            value = format;
        }
        
        switch(value){
            case FORMATS['RGBA16']:
                return  N64TextureDecoder.decode_rgba16(bytes, width, height);
            case FORMATS['RGBA32']:
                return  N64TextureDecoder.decode_rgba32(bytes, width, height);
            case FORMATS['CI4']:
                return  N64TextureDecoder.decode_ci4(bytes, paletteColors, width, height);
            case FORMATS['CI8']:
                return  N64TextureDecoder.decode_ci8(bytes, paletteColors, width, height);
            case FORMATS['IA4']:
                return  N64TextureDecoder.decode_ia4(bytes, width, height);
            case FORMATS['IA8']:
                return  N64TextureDecoder.decode_ia8(bytes, width, height);
            case FORMATS['IA16']:
                return  N64TextureDecoder.decode_ia16(bytes, width, height);
            case FORMATS['I4']:
                return  N64TextureDecoder.decode_i4(bytes, width, height);
            case FORMATS['I8']:
                return  N64TextureDecoder.decode_i8(bytes, width, height);
            default:
                console.log('Unknown texture format: ' + format);
                break;
        }
    }
    
    static decode_rgba16(bytes, width, height) {
        if (bytes.length < width * height * 2){
            console.error("RGBA16 decode error: byte array smaller than texture size");
            return undefined;
        }
        var texData = new Array(width * height * 4)
        var length = width * height
        for (var i = 0; i < length; i++){
            var pixel = (bytes[i * 2] << 8) | bytes[i * 2 + 1]
            texData[(i * 4) + 0] = ((pixel >> 11) & 0x1F) * 8    // Red
            texData[(i * 4) + 1] = ((pixel >> 6) & 0x1F) * 8     // Green
            texData[(i * 4) + 2] = ((pixel >> 1) & 0x1F) * 8     // Blue
            texData[(i * 4) + 3] = (pixel & 1) > 0 ? 0xFF : 0x00 // Transparency
        }
        return texData;
    }
    static decode_rgba32(bytes, width, height) {
        if (bytes.length < width * height * 4){
            print("RGBA32 decode error: byte array smaller than texture size")
            return undefined;
        }
        return bytes;
    }
    static decode_ci4(bytes, paletteColors, width, height) {
        if (bytes.length < (width * height) / 2) {
            console.error("CI4 decode error: byte array smaller than texture size");
            return undefined;
        }
        
        var texData = new Array(width * height * 4);
        var length = width * height / 2;
        for (var i = 0; i < length; i++){
            var index1 = (bytes[i] >> 4) & 0xF;
            var index2 = bytes[i] & 0xF;
            
            texData[(i * 8) + 0] = paletteColors[(index1 * 4) + 0]; // Red
            texData[(i * 8) + 1] = paletteColors[(index1 * 4) + 1]; // Green
            texData[(i * 8) + 2] = paletteColors[(index1 * 4) + 2]; // Blue
            texData[(i * 8) + 3] = paletteColors[(index1 * 4) + 3]; // Transparency
            texData[(i * 8) + 4] = paletteColors[(index2 * 4) + 0]; // Red
            texData[(i * 8) + 5] = paletteColors[(index2 * 4) + 1]; // Green
            texData[(i * 8) + 6] = paletteColors[(index2 * 4) + 2]; // Blue
            texData[(i * 8) + 7] = paletteColors[(index2 * 4) + 3]; // Transparency
        }
        return texData;
    }
    static decode_ci8(bytes, paletteColors, width, height) {
        if (bytes.length < width * height){
            console.error("CI8 decode error: byte array smaller than texture size");
            return undefined;
        }
        
        var length = width * height;
        var texData = new Array(length * 4);
        for (var i = 0; i < length; i++){
            var index = bytes[i];
            texData[(i * 4) + 0] = paletteColors[(index * 4) + 0]; // Red
            texData[(i * 4) + 1] = paletteColors[(index * 4) + 1]; // Green
            texData[(i * 4) + 2] = paletteColors[(index * 4) + 2]; // Blue
            texData[(i * 4) + 3] = paletteColors[(index * 4) + 3]; // Transparency
        }
        
        return texData;
    }
    static decode_ia4(bytes, width, height) {
        if (bytes.length < (width * height / 2)){
            console.error("IA4 decode error: byte array smaller than texture size");
            return undefined;
        }
        
        var texData = new Array(width * height * 4);
        var length = width * height;
        for (var i = 0; i < length; i++){
            var intensity1 = (bytes[i] >> 5) & 0x7;
            var alpha1 = (bytes[i] >> 4) & 0x1;
            var intensity2 = (bytes[i] >> 1) & 0x7;
            var alpha2 = bytes[i] & 0x1;
            texData[(i * 8) + 0] = intensity1; // Red
            texData[(i * 8) + 1] = intensity1; // Green
            texData[(i * 8) + 2] = intensity1; // Blue
            texData[(i * 8) + 3] = alpha1;     // Transparency
            texData[(i * 8) + 0] = intensity2; // Red
            texData[(i * 8) + 1] = intensity2; // Green
            texData[(i * 8) + 2] = intensity2; // Blue
            texData[(i * 8) + 3] = alpha2;     // Transparency
        }
        
        return texData;
    }
    static decode_ia8(bytes, width, height) {
        if (bytes.length < (width * height)){
            console.error("IA8 decode error: byte array smaller than texture size");
            return undefined;
        }
        
        var texData = new Array(width * height * 4);
        var length = width * height;
        for (var i = 0; i < length; i++){
            var intensity = (bytes[i] >> 4) & 0xF;
            var alpha = bytes[i] & 0xF;
            texData[(i * 4) + 0] = intensity; // Red
            texData[(i * 4) + 1] = intensity; // Green
            texData[(i * 4) + 2] = intensity; // Blue
            texData[(i * 4) + 3] = alpha;     // Transparency
        }
        
        return texData;
    }
    static decode_ia16(bytes, width, height) {
        if (bytes.length < (width * height * 2)){
            console.error("IA16 decode error: byte array smaller than texture size");
            return undefined;
        }
        
        var texData = new Array(width * height * 4);
        var length = width * height;
        for (var i = 0; i < length; i++){
            var intensity = bytes[i * 2];
            var alpha = bytes[i * 2 + 1];
            texData[(i * 4) + 0] = intensity; // Red
            texData[(i * 4) + 1] = intensity; // Green
            texData[(i * 4) + 2] = intensity; // Blue
            texData[(i * 4) + 3] = alpha;     // Transparency
        }
        
        return texData;
    }
    static decode_i4(bytes, width, height) {
        if (bytes.length < (width * height) / 2) {
            console.error("I4 decode error: byte array smaller than texture size");
            return undefined;
        }
        
        var texData = new Array(width * height * 4);
        var length = width * height;
        for (var i = 0; i < length; i++){
            var pixel1 = (bytes[i] >> 4) & 0xF;
            var pixel2 = bytes[i] & 0xF;
            
            texData[(i * 8) + 0] = pixel1 * 16; // Red
            texData[(i * 8) + 1] = pixel1 * 16; // Green
            texData[(i * 8) + 2] = pixel1 * 16; // Blue
            texData[(i * 8) + 3] = 0xFF;        // Transparency
            texData[(i * 8) + 4] = pixel2 * 16; // Red
            texData[(i * 8) + 5] = pixel2 * 16; // Green
            texData[(i * 8) + 6] = pixel2 * 16; // Blue
            texData[(i * 8) + 7] = 0xFF;        // Transparency
        }
        return texData;
    }
    static decode_i8(bytes, width, height) {
        if (bytes.length < width * height){
            console.error("I8 decode error: byte array smaller than texture size");
            return undefined;
        }
        
        var length = width * height;
        var texData = new Array(length * 4);
        for (var i = 0; i < length; i++){
            var pixel = bytes[i];
            texData[(i * 4) + 0] = pixel; // Red
            texData[(i * 4) + 1] = pixel; // Green
            texData[(i * 4) + 2] = pixel; // Blue
            texData[(i * 4) + 3] = 0xFF;  // Transparency
        }
        
        return texData;
    }
}
