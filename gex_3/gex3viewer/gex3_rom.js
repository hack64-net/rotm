// Look at the first 4 bytes of the ROM to detect endianness
ENDIANNESS = {
    0x80371240 : 'BIG',
    0x40123780 : 'LITTLE',
    0x37804012 : 'MIXED'
}

class Gex3ROM {
    constructor(bytes) {
        this.bytes = bytes;
        this.endian = ENDIANNESS[bytes_to_uint(this.bytes, 0)];
        
        console.log('Endianness = ' + this.endian);
        
        if(this.endian == 'LITTLE') {
            this.convert_from_little_endian();
        } else if(this.endian == 'MIXED') {
            this.convert_from_mixed_endian();
        }
        
        set_status_text("Loaded!");
    }
    
    get_u32(offset) {
        return u32(bytes_to_int(this.bytes, offset));
    }
    
    get_section(start, end){
        return this.bytes.subarray(start, end);
    }
    
    log_endianness_warning(){
        console.warn("Next time use a big-endian ROM file for faster loading.");
    }
    
    /* Convert from Little to Big endian */
    convert_from_little_endian() {
        this.log_endianness_warning();
        
        // DEBUG_TimeMeasure_Start();
        
        var romLength = this.bytes.length;
        for(var i = 0; i < romLength; i += 4) {
            var byte1 = this.bytes[i*4+1];
            var byte2 = this.bytes[i*4+2];
            var byte3 = this.bytes[i*4+3];
            this.bytes[i*2+3] = this.bytes[i*2+0];
            this.bytes[i*2+2] = byte1;
            this.bytes[i*2+1] = byte2;
            this.bytes[i*2+0] = byte3;
        }
        
        // DEBUG_TimeMeasure_Stop();
    }
    
    /* Convert from Mixed to Big endian */
    convert_from_mixed_endian() {
        this.log_endianness_warning();
        
        // DEBUG_TimeMeasure_Start();
        
        var romLength = this.bytes.length;
        for(var i = 0; i < romLength; i += 2) {
            var byte1 = this.bytes[i*2+1];
            this.bytes[i*2+1] = this.bytes[i*2+0];
            this.bytes[i*2+0] = byte1;
        }
        
        // DEBUG_TimeMeasure_Stop();
    }
}