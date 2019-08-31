const WORLD_SCALE = 0.02;

/* Convert value to unsigned 32 bit. */
function u32(val) {
    return val >>> 0;
}

/* Convert value to signed 16 bit. */
function s16(val) {
    return (val << 16) >> 16;
}

function bytes_to_int(bytes, offset) {
    return (bytes[offset+0] << 24) | (bytes[offset+1] << 16) | (bytes[offset+2] << 8) | bytes[offset+3];
}

function bytes_to_uint(bytes, offset) {
    return u32((bytes[offset+0] << 24) | (bytes[offset+1] << 16) | (bytes[offset+2] << 8) | bytes[offset+3]);
}

function bytes_to_ushort(bytes, offset) {
    return (bytes[offset+0] << 8) | bytes[offset+1];
}

function bytes_to_short(bytes, offset) {
    return s16((bytes[offset+0] << 8) | bytes[offset+1]);
}

function binArrayToString(array) {
  return String.fromCharCode.apply(String, array);
}

function set_status_text(text) {
    document.getElementById('status').textContent = text;
}

// This is necessary for the exporters to work properly
function convert_texture_to_png_texture(texture) {
    var pixels = texture.image.data,
    width = texture.image.width, 
    height = texture.image.height,

    canvas = document.createElement('canvas'),
    context = canvas.getContext('2d'),
    imgData = context.createImageData(width, height);

    canvas.height = height;
    canvas.width = width;
    
    // Copy texture data directly
    for(var i = 0; i < pixels.length*4; i++) {
        imgData.data[i] = pixels[i];
    }

    context.putImageData(imgData, 0, 0);

    var img = new Image();
    img.src = canvas.toDataURL('image/png');
    var new_tex = new THREE.Texture(img);
    
    // These 3 lines need to be here to prevent the textures from 
    // being automatically scaled down to a power of two.
    //new_tex.wrapS = THREE.ClampToEdgeWrapping;
    //new_tex.wrapT = THREE.ClampToEdgeWrapping;
    new_tex.wrapS = THREE.RepeatWrapping;
    new_tex.wrapT = THREE.RepeatWrapping;
    new_tex.minFilter = THREE.LinearFilter;
    
    img.onload = function(){
        new_tex.flipY = false;
        new_tex.needsUpdate = true;
    }
    
    return new_tex;
}

var __DEBUG_start = 0;
function DEBUG_TimeMeasure_Start() {
    __DEBUG_start = new Date().getTime();
}

function DEBUG_TimeMeasure_Stop() {
    console.log(((new Date().getTime() - __DEBUG_start) / 1000) + ' seconds');
}
