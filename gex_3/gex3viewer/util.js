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

function set_status_text(text) {
    document.getElementById('status').textContent = text;
}

var __DEBUG_start = 0;
function DEBUG_TimeMeasure_Start() {
    __DEBUG_start = new Date().getTime();
}

function DEBUG_TimeMeasure_Stop() {
    console.log(((new Date().getTime() - __DEBUG_start) / 1000) + ' seconds');
}