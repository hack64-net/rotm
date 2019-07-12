SPECIAL_SHPN_TYPES = {
    0x27 : 'palette', // Palette data for ci textures
    0x66 : '8-bit texture'
}

// Class with helpful functions.
class SHPN_Util {
    static bytes_to_int(bytes, offset) {
        return (bytes[offset+0] << 24) | (bytes[offset+1] << 16) | 
               (bytes[offset+2] << 8) | bytes[offset+3];
    }
    static bytes_to_int24(bytes, offset) {
        return (bytes[offset+0] << 16) | (bytes[offset+1] << 8) | bytes[offset+2];
    }
    static bytes_to_short(bytes, offset) {
        return (bytes[offset+0] << 8) | bytes[offset+1];
    }
    static get_name(bytes, offset) {
        var result = "";
        for(var i = offset; i < offset + 4; ++i) {
            result+= (String.fromCharCode(bytes[i]));
        }
        return result;
    }
    static determine_texture_format(paletteOffset, type){
        if(paletteOffset) {
            if(SPECIAL_SHPN_TYPES[type] == '8-bit texture')
                return 'ci8'
            else
                return 'ci4'
        } else {
            if(SPECIAL_SHPN_TYPES[type] == '8-bit texture')
                return 'i8'
            else
                return 'i4'
        }
    }
    static palette_bytes_to_rgba32_arr(paletteBytes, name=''){
        // The first 0x10 bytes is some kind of header? Ignoring it for now.
        var rgbaData = paletteBytes.slice(0x10, paletteBytes.length)
        
        if (name == "TR11")
            console.log(rgbaData)
        
        var numColors = rgbaData.length / 2
        return N64TextureDecoder.decode_rgba16(rgbaData, numColors, 1);
    }
}

class SHPN_Texture {
    constructor(name, bytes) {
        //console.log(name)
        this.name = name
        this.type = bytes[0]
        this.paletteOffset = SHPN_Util.bytes_to_int24(bytes, 1)
        this.width = SHPN_Util.bytes_to_short(bytes, 4)
        this.height = SHPN_Util.bytes_to_short(bytes, 6)
        
        if (SPECIAL_SHPN_TYPES[this.type] == 'palette') {
            this.name += ' (CI palette, contains ' + this.width + ' colors)'
        } else {
            this.format = SHPN_Util.determine_texture_format(this.paletteOffset, this.type)
            if (this.paletteOffset){
                this.colors = SHPN_Util.palette_bytes_to_rgba32_arr(bytes.slice(this.paletteOffset, bytes.length), this.name)
                if(this.name == "TR11"){
                    console.log(bytes)
                    console.log(this.paletteOffset)
                    console.log(bytes.slice(this.paletteOffset, bytes.length))
                }
            }
            var texData = bytes.slice(0x10, this.paletteOffset ? this.paletteOffset : bytes.length)
            this.data = N64TextureDecoder.decode_data(texData, this.colors, this.format, this.width, this.height)
        }
    }
    
    // Gets HTML text information on this texture.
    get_info() {
        var div = document.createElement('div');
        var name = document.createElement('span');
        name.style = "font-size:x-large;margin-right:10px;font-weight: bold;";
        name.innerText = this.name;
        div.appendChild(name);
        if (SPECIAL_SHPN_TYPES[this.type] != 'palette'){
            var attributes = document.createElement('span');
            attributes.innerText = 
                'Width = ' + this.width + ', Height = ' + this.height + 
                ', Texture Format = ' + this.format.toUpperCase();
            div.appendChild(attributes);
            div.appendChild(document.createElement('br'));
            div.appendChild(document.createElement('br'));
            if(this.width * this.height < 65536)
                div.appendChild(this.make_canvas(3));
            div.appendChild(this.make_canvas(1));
        }
        div.appendChild(document.createElement('hr'));
        return div;
    }
    
    make_canvas(scaleCanvas){
        var canvas = document.createElement('canvas');
        canvas.width = this.width * scaleCanvas;
        canvas.height = this.height * scaleCanvas;
        var context = canvas.getContext('2d');
        //context.scale(1, 1);
        var imgData = context.createImageData(this.width, this.height);
        
        for (var i = 0; i < imgData.data.length; i++)
            imgData.data[i] = this.data[i];
        
        context.putImageData(imgData, 0, 0);
        
        if (scaleCanvas != 1) {
            var img = new Image();
            img.src = canvas.toDataURL();
            img.onload = () => {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.imageSmoothingEnabled = false;
                context.scale(scaleCanvas, scaleCanvas);
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
        }
        
        return canvas
    }
}

class SHPN {
    constructor(bytes) {
        this.bytes = bytes
        this.file_size = SHPN_Util.bytes_to_int(bytes, 4)
        this.numTextures = SHPN_Util.bytes_to_int(bytes, 8)
        this.textures = []
        
        // Loop through the index table and add files
        for(var i = 0; i < this.numTextures; i++) {
            var offset = 0x10 + (i * 8)
            var name = SHPN_Util.get_name(bytes, offset)
            var tex_offset = SHPN_Util.bytes_to_int(bytes, offset + 4)
            var tex_bytes;
            if (i == this.numTextures - 1) { // Final texture
                tex_bytes = bytes.slice(tex_offset, this.file_size)
            } else {
                var next_tex_offset = SHPN_Util.bytes_to_int(bytes, offset + 12)
                tex_bytes = bytes.slice(tex_offset, next_tex_offset)
            }
            this.textures.push(new SHPN_Texture(name, tex_bytes))
        }
    }
    
    get_texture_data_by_name(name){
        var numTextures = this.textures.length;
        for(var i = 0; i < numTextures; i++) {
            if(this.textures[i].name == name) {
                return this.textures[i].data;
            }
        };
        return null;
    }
    
    get_texture_size_by_name(name){
        var numTextures = this.textures.length;
        for(var i = 0; i < numTextures; i++) {
            if(this.textures[i].name == name) {
                return [this.textures[i].width, this.textures[i].height];
            }
        };
        return null;
    }
    
    print_info() {
        var output = document.createElement('div');
        var header = document.createElement('h1');
        header.innerText = this.numTextures + ' textures found'
        output.appendChild(header)
        output.appendChild(document.createElement('hr'))
        for(var i = 0; i < this.numTextures; i++) {
            output.appendChild(this.textures[i].get_info())
        }
        return output
    }
}