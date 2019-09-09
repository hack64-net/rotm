var WORD_RNX1 = 0x524E5801
var WORD_RNC1 = 0x524E4301
var WORD_RNX2 = 0x524E5802
var WORD_RNC2 = 0x524E4302
var WORD_FILL = 0x46494C4C
var WORD_END  = 0x454E4421

/*
 * Class to decode huffman RNX/RNC encoded blocks 
 * Python version of this code can be found here: https://github.com/hack64-net/rotm/tree/master/forsaken_64/RNXExtract
 */
class RNX {
    constructor(rom, offset) {
        this.output = null;
        if(typeof offset === 'string') {
            offset = parseInt(offset, 10);
        }
        var word = rom.get_u32(offset);
        switch(word) {
            case WORD_RNC1:
                var compressed_length = rom.get_u32(offset + 8) + 0x12;
                var compressed_data = rom.get_section(offset, offset + compressed_length);
                this.decode_RNC(compressed_data);
                this.output = this.RNC_OUTPUT;
                break;
            case WORD_RNX1:
                this.decode_RNX(rom, offset);
                break;
            case WORD_RNC2:
            case WORD_RNX2:
                throw "RNC prefix encoding is not supported.";
                break;
            default:
                throw "Invalid word: " + hex(word);
        }
    }
    
    decode_RNX(rom, offset) {
        var start_offset = offset;
        this.output = new Uint8Array(0);
        var ended = false;
        while(!ended) {
            while (rom.get_u8(offset) == 0){
                offset += 1
            }
            var word = rom.get_u32(offset);
            switch(word){
                case WORD_END:
                    ended = true;
                    break;
                case WORD_RNC1:
                case WORD_RNX1:
                    var compressed_length = rom.get_u32(offset + 8) + 0x12;
                    var compressed_data = rom.get_section(offset, offset + compressed_length);
                    this.decode_RNC(compressed_data);
                    this.output = concatUint8Arrays(this.output, this.RNC_OUTPUT);
                    offset += compressed_length
                    break;
                case WORD_RNC2:
                case WORD_RNX2:
                    throw "RNC prefix encoding is not supported.";
                case WORD_FILL:
                    var fillAmount = rom.get_u16(offset + 4);
                    var fillValue = rom.get_u8(offset + 6);
                    var fillValues = new Uint8Array(fillAmount);
                    fillValues.fill(fillValue);
                    this.output = concatUint8Arrays(this.output, fillValues);
                    offset += 8
                    break;
                default:
                    throw "Invalid word: " + hex(word);
            }
        }
    }
    
    decode_RNC(compressed_data) {
        this.RNC_CONSTANT_A0 = u32(0xFF000000); // Not used.
        this.RNC_CONSTANT_A1 = u32(0x80000000);
        this.RNC_CONSTANT_A2 = u32(0xFFFFFF00); // Not used.
        this.RNC_CONSTANT_A3 = u32(0x8000);
        
        // Variables (Registers S0-S5 && T0-T7)
        this.RNC_S0 = 0; // Index in input data
        this.RNC_S1 = 0; // Index in output data
        this.RNC_S2 = 0; // Index into s2 buffer
        this.RNC_S3 = 0;
        this.RNC_S4 = 0;
        this.RNC_S5 = 0;
        this.RNC_T0 = 0;
        this.RNC_T1 = 0;
        this.RNC_T2 = 0;
        this.RNC_T3 = 0;
        this.RNC_T4 = 0;
        this.RNC_T5 = 0;
        this.RNC_T6 = 0;
        this.RNC_T7 = 0;
        
        this.RNC_S2_BUFFER = new Uint8Array(0x180);
        
        var decompressed_length = bytes_to_uint(compressed_data, 4);
        
        var append = new Uint8Array([0, 0, 0, 0]);
        
        this.RNC_INPUT = concatUint8Arrays(compressed_data, append);
        this.RNC_OUTPUT = new Uint8Array(decompressed_length);
        
        // Start decoding
        this.func_8000A204();
    }
    
    get_data() {
        return this.output;
    }
    
/******************* Helper Functions *******************/
    pr(RNC_str, RNC_val){
        return RNC_str + " = " + hex(RNC_val) + '; ';
    }

    print_registers(){
        console.log('---------------------------------------------------')
        console.log(this.pr('s0',this.RNC_S0) + this.pr('s1',this.RNC_S1) + this.pr('s2',this.RNC_S2) + this.pr('s3',this.RNC_S3))
        console.log(this.pr('s4',this.RNC_S4) + this.pr('s5',this.RNC_S5))
        console.log(this.pr('t0',this.RNC_T0) + this.pr('t1',this.RNC_T1) + this.pr('t2',this.RNC_T2) + this.pr('t3',this.RNC_T3))
        console.log(this.pr('t4',this.RNC_T4) + this.pr('t5',this.RNC_T5) + this.pr('t6',this.RNC_T6) + this.pr('t7',this.RNC_T7))
        console.log('---------------------------------------------------')
        throw "printed registers!"
    }

    // Shift right logical
    srl(val, n) {
        if (n == 0xFFFFFFFF || n == -1) // Weird. I'm not sure why this happens with N64.
            return u32(0x80000000);
        else
            return u32(val >>> n);
    }
    
    // Shift left logical
    sll(val, n){
        return u32(val << n);
    }
    
/********************************************************/

/********************* RNC Decoding *********************/

    func_8000A6CC() {
        while(true) {
            this.RNC_OUTPUT[this.RNC_S4] = this.RNC_INPUT[this.RNC_S3]
            this.RNC_S3 += 1
            this.RNC_S4 += 1
            this.RNC_T0 -= 1
            if(this.RNC_T0 < 0) {
                break
            }
        }
    }
    
    func_8000A54C() {
        this.RNC_T0 = 0x1F
        this.RNC_T1 = 0x5
        this.func_8000A4B8()
        this.RNC_T0 -= 1
        if (this.RNC_T0 < 0){
            return
        }
        this.RNC_T2 = this.RNC_T0
        this.RNC_T3 = this.RNC_T0
        var temp_buffer = new Array(0x10)
        this.RNC_S1 = 0
        while(true) {
            this.RNC_T0 = 0x0F
            this.RNC_T1 = 0x4
            this.func_8000A4B8()
            temp_buffer[this.RNC_S1] = this.RNC_T0 & 0xFF
            this.RNC_S1 += 1
            this.RNC_T2 -= 1
            if (this.RNC_T2 < 0){
                break
            }
        }
        this.RNC_T0 = this.RNC_CONSTANT_A1
        this.RNC_T1 = 1
        this.RNC_T2 = 0
        var store_t5 = this.RNC_T5
        var store_t6 = this.RNC_T6
        var store_t7 = this.RNC_T7
        while (true) {
            this.RNC_T4 = this.RNC_T3
            this.RNC_S1 = 0
            while (true) {
                var at = temp_buffer[this.RNC_S1]
                this.RNC_S1 += 1
                if (this.RNC_T1 != at){
                    this.RNC_T4 -= 1
                    if (this.RNC_T4 < 0){
                        break
                    }
                    continue
                }
                this.RNC_T5 = this.sll(1, this.RNC_T1) - 1
                this.RNC_S2_BUFFER[this.RNC_S0 + 1] = this.RNC_T5 & 0xFF
                this.RNC_S2_BUFFER[this.RNC_S0] = (this.RNC_T5 >> 8) & 0xFF
                this.RNC_S0 += 2
                this.RNC_T5 = this.RNC_T2
                at = this.sll(this.RNC_T5, 0x10)
                this.RNC_T5 = this.srl(this.RNC_T5, 0x10) | at
                this.RNC_T7 = this.RNC_T1 - 1
                while (true) {
                    this.RNC_T6 &= 0xFFFF
                    at = this.RNC_T5 & this.RNC_CONSTANT_A3
                    this.RNC_T5 = this.sll(this.RNC_T5, 1)
                    this.RNC_T6 = this.srl(this.RNC_T6, 1)
                    if (at != 0){
                        this.RNC_T6 |= this.RNC_CONSTANT_A3
                    }
                    this.RNC_T7 -= 1
                    if (this.RNC_T7 < 0){
                        break
                    }
                }
                this.RNC_T5 = 0x10 - this.RNC_T1
                this.RNC_T6 = this.srl(this.RNC_T6, this.RNC_T5)
                this.RNC_S2_BUFFER[this.RNC_S0 + 1] = this.RNC_T6 & 0xFF
                this.RNC_S2_BUFFER[this.RNC_S0] = (this.RNC_T6 >> 8) & 0xFF
                this.RNC_S0 += 2
                this.RNC_S2_BUFFER[this.RNC_S0 + 0x3C] = this.RNC_T1 & 0xFF
                this.RNC_T5 = this.RNC_T3 - this.RNC_T4
                this.RNC_S2_BUFFER[this.RNC_S0 + 0x3D] = this.RNC_T5 & 0xFF
                this.RNC_T6 = 1
                this.RNC_T5 -= 1
                this.RNC_T6 = this.sll(this.RNC_T6, this.RNC_T5)
                this.RNC_T6 -= 1
                this.RNC_S2_BUFFER[this.RNC_S0 + 0x3F] = this.RNC_T6 & 0xFF
                this.RNC_S2_BUFFER[this.RNC_S0 + 0x3E] = (this.RNC_T6 >> 8) & 0xFF
                this.RNC_T2 = u32(this.RNC_T2 + this.RNC_T0)
                this.RNC_T4 -= 1
                if (this.RNC_T4 < 0){
                    break
                }
            }
            this.RNC_T0 = this.srl(this.RNC_T0, 1)
            this.RNC_T1 += 1
            if (this.RNC_T1 == 0x11) {
                break
            }
        }
        this.RNC_T5 = store_t5
        this.RNC_T6 = store_t6
        this.RNC_T7 = store_t7
    }

    func_8000A528() {
        this.RNC_T1 = 3
        while (this.RNC_T1 >= 0) {
            this.RNC_T0 = this.sll(this.RNC_T0, 8) | this.RNC_INPUT[this.RNC_S0]
            this.RNC_S0 += 1
            this.RNC_T1 -= 1
        }
    }

    func_8000A4EC() {
        this.RNC_T7 += this.RNC_T1
        this.RNC_T6 = this.srl(this.RNC_T6, this.RNC_T7)
        this.RNC_S3 += 4
        this.RNC_T6 |= this.sll(this.RNC_INPUT[this.RNC_S3 - 2], 0x10)
        this.RNC_T6 |= this.sll(this.RNC_INPUT[this.RNC_S3 - 1], 0x18)
        this.RNC_S3 -= 2
        this.RNC_T1 -= this.RNC_T7
        this.RNC_T7 = 0x10 - this.RNC_T1
    }
    
    func_8000A4B8() {
        this.RNC_T0 &= this.RNC_T6
        this.RNC_T7 -= this.RNC_T1
        if (this.RNC_T7 < 0){
            this.func_8000A4EC()
        }
        this.RNC_T6 = this.srl(this.RNC_T6, this.RNC_T1)
    }
    
    func_8000A3E0() {
        while (true) {
            this.RNC_T0 = (this.RNC_S2_BUFFER[this.RNC_S0] << 8) | this.RNC_S2_BUFFER[this.RNC_S0 + 1]
            this.RNC_S0 += 2
            this.RNC_T0 &= this.RNC_T6
            var temp = (this.RNC_S2_BUFFER[this.RNC_S0] << 8) | this.RNC_S2_BUFFER[this.RNC_S0 + 1]
            this.RNC_S0 += 2
            this.RNC_T0 -= temp
            if (this.RNC_T0 == 0) {
                break
            }
        }
        this.RNC_T1 = this.RNC_S2_BUFFER[this.RNC_S0 + 0x3C]
        this.RNC_T7 -= this.RNC_T1
        if (this.RNC_T7 < 0) {
            this.func_8000A4EC()
        }
        this.RNC_T6 = this.srl(this.RNC_T6, this.RNC_T1)
        this.RNC_T0 = this.RNC_S2_BUFFER[this.RNC_S0 + 0x3D]
        if (this.RNC_T0 - 2 < 0) {
            return
        }
        this.RNC_T0 -= 1
        this.RNC_T1 = this.RNC_T0
        this.RNC_T2 = this.RNC_T0
        this.RNC_T0 = (this.RNC_S2_BUFFER[this.RNC_S0 + 0x3E] << 8) | this.RNC_S2_BUFFER[this.RNC_S0 + 0x3F]
        this.RNC_T0 &= this.RNC_T6
        this.RNC_T7 -= this.RNC_T1
        if (this.RNC_T7 < 0) {
            this.func_8000A4EC()
        }
        this.RNC_T6 = this.srl(this.RNC_T6, this.RNC_T1)
        this.RNC_T0 |= this.sll(1, this.RNC_T2)
    }

    func_8000A204() {
        this.RNC_S0 += 4
        this.RNC_T0 = u32(0x80090000)
        this.func_8000A528()
        this.RNC_S3 = this.RNC_S0 + 10
        this.RNC_S4 = this.RNC_S1
        this.RNC_S5 = this.RNC_S4 + this.RNC_T0
        this.RNC_T6 = bytes_to_short_le(this.RNC_INPUT, this.RNC_S3)
        this.RNC_T0 = 2
        this.RNC_T1 = 2
        this.func_8000A4B8()
        while(true){
            this.RNC_S0 = this.RNC_S2
            this.func_8000A54C()
            this.RNC_S0 = this.RNC_S2 + 0x80
            this.func_8000A54C()
            this.RNC_S0 = this.RNC_S2 + 0x100
            this.func_8000A54C()
            this.RNC_T0 = -1
            this.RNC_T1 = 0x10
            this.func_8000A4B8()
            this.RNC_T4 = (this.RNC_T0 - 1) & 0xFFFF
            var first_entry = true
            while(true){
                if (!first_entry){
                    this.RNC_S0 = this.RNC_S2 + 0x80
                    this.RNC_T0 = 0
                    this.func_8000A3E0()
                    this.RNC_T0 = -this.RNC_T0
                    this.RNC_S1 = (this.RNC_S4 + this.RNC_T0) - 1
                    this.RNC_S0 = this.RNC_S2 + 0x100
                    this.func_8000A3E0()
                    this.RNC_OUTPUT[this.RNC_S4] = this.RNC_OUTPUT[this.RNC_S1]
                    this.RNC_S4 += 1
                    this.RNC_S1 += 1
                    while (true){
                        this.RNC_OUTPUT[this.RNC_S4] = this.RNC_OUTPUT[this.RNC_S1]
                        this.RNC_S4 += 1
                        this.RNC_S1 += 1
                        this.RNC_T0 -= 1
                        if (this.RNC_T0 < 0){
                            break
                        }
                    }
                }
                first_entry = false
                this.RNC_S0 = this.RNC_S2
                this.func_8000A3E0()
                this.RNC_T0 -= 1
                if (this.RNC_T0 >= 0){
                    this.func_8000A6CC()
                    this.RNC_T0 = (this.RNC_INPUT[this.RNC_S3 + 1] << 8) | this.RNC_INPUT[this.RNC_S3]
                    this.RNC_T0 = this.sll(this.RNC_T0, this.RNC_T7)
                    this.RNC_T1 = this.sll(1, this.RNC_T7) - 1
                    this.RNC_T6 &= this.RNC_T1
                    this.RNC_T6 |= this.RNC_T0
                }
                this.RNC_T4 -= 1
                if (this.RNC_T4 < 0){
                    break
                }
            }
            if(this.RNC_S4 - this.RNC_S5 >= 0) {
                break
            }
        }
    }
    
/********************************************************/
}
