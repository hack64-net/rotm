/* Convert value to unsigned 32 bit. */
function u32(val) {
    return val >>> 0;
}

/* Convert value to signed 16 bit. */
function s16(val) {
    return (val << 16) >> 16;
}

/* Convert value to unsigned 8 bit. */
function u8(val) {
    return val & 0xFF;
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

function bytes_to_short_le(bytes, offset) {
    return (bytes[offset+1] << 8) | bytes[offset+0];
}

function hex(value) {
    return "0x"+u32(value).toString(16);
}

function pad(s, size) {
    while (s.length < size) s = "0" + s;
    return s;
}

function hex64(valueUpper, valueLower) {
    return "0x"+pad(u32(valueUpper).toString(16), 8)+pad(u32(valueLower).toString(16), 8);
}

function printArrayAsHex(arr) {
    var output = '';
    var strLength = arr.length;
    for(var i = 0; i < strLength; i++){
        if(i > 0)
            if((i & 0xF) == 0)
                output += '; '
            else
                output += ', '
        if(arr[i] != undefined){
            output += hex(arr[i]);
        } else {
            output += 'undefined'
        }
    }
    console.log(output);
}

function concatUint8Arrays(arr1, arr2) {
    var newArray = new Uint8Array(arr1.length + arr2.length);
    newArray.set(arr1);
    newArray.set(arr2, arr1.length);
    return newArray;
}

function binArrayToString(array) {
  return String.fromCharCode.apply(String, array);
}

function set_status_text(text) {
    document.getElementById('status').textContent = text;
}

// This is necessary for the exporters to work properly
function convert_texture_to_png_texture(texture, doClamp) {
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
    
    if(doClamp){
        new_tex.wrapS = THREE.ClampToEdgeWrapping;
        new_tex.wrapT = THREE.ClampToEdgeWrapping;
    } else {
        new_tex.wrapS = THREE.RepeatWrapping;
        new_tex.wrapT = THREE.RepeatWrapping;
    }
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
