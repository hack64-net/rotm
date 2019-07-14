// Class with helpful functions.
class FNTN_Util {
    static bytes_to_int(bytes, offset) {
        return (bytes[offset+0] << 24) | (bytes[offset+1] << 16) | 
               (bytes[offset+2] << 8) | bytes[offset+3];
    }
    static bytes_to_short(bytes, offset) {
        return (bytes[offset+0] << 8) | bytes[offset+1];
    }
}

class FNTN {
    constructor(bytes) {
        this.bytes = bytes
        this.fileSize = FNTN_Util.bytes_to_int(bytes, 4);
        var sheetHeaderOffset = FNTN_Util.bytes_to_int(bytes, 0x1C);
        this.sheetWidth = FNTN_Util.bytes_to_short(bytes, sheetHeaderOffset + 4);
        this.sheetHeight = FNTN_Util.bytes_to_short(bytes, sheetHeaderOffset + 6);
        var sheetStart = sheetHeaderOffset + 0x10
        var sheetLength = (this.sheetWidth * this.sheetHeight) / 2;
        this.data = 
            N64TextureDecoder.decode_i4(
                bytes.slice(sheetStart, sheetStart + sheetLength), 
                this.sheetWidth, 
                this.sheetHeight
            );
    }
    
    // Gets HTML text information on this font sheet.
    get_info() {
        var div = document.createElement('div');
        var attributes = document.createElement('span');
        attributes.innerText = 
            'Width = ' + this.sheetWidth + ', Height = ' + this.sheetHeight;
        div.appendChild(attributes);
        div.appendChild(document.createElement('br'));
        div.appendChild(document.createElement('br'));
        if(this.sheetWidth * this.sheetHeight < 65536)
            div.appendChild(this.make_canvas(3));
        div.appendChild(this.make_canvas(1));
        div.appendChild(document.createElement('hr'));
        return div;
    }
    
    make_canvas(scaleCanvas){
        var canvas = document.createElement('canvas');
        canvas.width = this.sheetWidth * scaleCanvas;
        canvas.height = this.sheetHeight * scaleCanvas;
        var context = canvas.getContext('2d');
        //context.scale(1, 1);
        var imgData = context.createImageData(this.sheetWidth, this.sheetHeight);
        
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
