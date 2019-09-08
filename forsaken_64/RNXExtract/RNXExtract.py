import os
import sys

# Constants (Uses registers A0 to A3)
RNC_CONSTANT_A0 = 0xFF000000 # Not used.
RNC_CONSTANT_A1 = 0x80000000
RNC_CONSTANT_A2 = 0xFFFFFF00 # Not used.
RNC_CONSTANT_A3 = 0x8000

# Variables (Registers S0-S5 and T0-T7)
RNC_S0 = 0 # Index in input data
RNC_S1 = 0 # Index in output data
RNC_S2 = 0 # Index into s2 buffer
RNC_S3 = 0
RNC_S4 = 0
RNC_S5 = 0
RNC_T0 = 0
RNC_T1 = 0
RNC_T2 = 0
RNC_T3 = 0
RNC_T4 = 0
RNC_T5 = 0
RNC_T6 = 0
RNC_T7 = 0

# Temp buffer allocated on stack
RNC_S2_BUFFER = None

# Compressed data
RNC_INPUT = None

# Decompressed data
RNC_OUTPUT = None

####### Helper Functions #######

def pr(RNC_str, RNC_val):
    return RNC_str + " = " + hex(RNC_val) + '; '

def print_registers():
    print('---------------------------------------------------')
    print(pr('s0',RNC_S0) + pr('s1',RNC_S1) + pr('s2',RNC_S2) + pr('s3',RNC_S3))
    print(pr('s4',RNC_S4) + pr('s5',RNC_S5))
    print(pr('t0',RNC_T0) + pr('t1',RNC_T1) + pr('t2',RNC_T2) + pr('t3',RNC_T3))
    print(pr('t4',RNC_T4) + pr('t5',RNC_T5) + pr('t6',RNC_T6) + pr('t7',RNC_T7))
    print('---------------------------------------------------')
    with open("RNC_S2_BUFFER.bin", "wb") as s2BufferFile:
        s2BufferFile.write(bytearray(RNC_S2_BUFFER))
    raise Exception("printed registers!")

# Shift right logical
def srl(val, n): 
    return val>>n if val >= 0 else (val+0x100000000)>>n
    
# Shift left logical
def sll(val, n):
    if n == 0xFFFFFFFF or n == -1: # Weird. I'm not sure why this happens with N64.
        return 0x80000000
    else:
        return (val << n) & 0xFFFFFFFF # Have to do this because of python's big integers
    
def __bytes_to_int16_le(arr, offset):
    return int.from_bytes(arr[offset:offset+2], byteorder='little')
    
def __bytes_to_int16(arr, offset):
    return int.from_bytes(arr[offset:offset+2], byteorder='big')

def __bytes_to_int(arr, offset):
    return int.from_bytes(arr[offset:offset+4], byteorder='big')
    
################################

def func_8000A6CC():
    global RNC_INPUT, RNC_OUTPUT, RNC_S2_BUFFER, RNC_S0, RNC_S1, RNC_S2, RNC_S3, RNC_S4, RNC_S5, RNC_T0, RNC_T1, RNC_T2, RNC_T3, RNC_T4, RNC_T5, RNC_T6, RNC_T7
    while True:
        RNC_OUTPUT[RNC_S4] = RNC_INPUT[RNC_S3]
        RNC_S3 += 1
        RNC_S4 += 1
        RNC_T0 -= 1
        if RNC_T0 < 0:
            break
    
def func_8000A54C():
    global RNC_INPUT, RNC_OUTPUT, RNC_S2_BUFFER, RNC_S0, RNC_S1, RNC_S2, RNC_S3, RNC_S4, RNC_S5, RNC_T0, RNC_T1, RNC_T2, RNC_T3, RNC_T4, RNC_T5, RNC_T6, RNC_T7
    RNC_T0 = 0x1F
    RNC_T1 = 0x5
    func_8000A4B8()
    RNC_T0 -= 1
    if RNC_T0 < 0:
        return
    RNC_T2 = RNC_T0
    RNC_T3 = RNC_T0
    temp_buffer = [0] * 0x10
    RNC_S1 = 0
    while True:
        RNC_T0 = 0x0F
        RNC_T1 = 0x4
        func_8000A4B8()
        temp_buffer[RNC_S1] = RNC_T0 & 0xFF
        RNC_S1 += 1
        RNC_T2 -= 1
        if RNC_T2 < 0:
            break
    RNC_T0 = RNC_CONSTANT_A1
    RNC_T1 = 1
    RNC_T2 = 0
    store_t5 = RNC_T5
    store_t6 = RNC_T6
    store_t7 = RNC_T7
    while True:
        RNC_T4 = RNC_T3
        RNC_S1 = 0
        while True:
            at = temp_buffer[RNC_S1]
            RNC_S1 += 1
            if RNC_T1 != at:
                RNC_T4 -= 1
                if RNC_T4 < 0:
                    break
                continue
            RNC_T5 = sll(1, RNC_T1) - 1
            RNC_S2_BUFFER[RNC_S0 + 1] = RNC_T5 & 0xFF
            RNC_S2_BUFFER[RNC_S0] = (RNC_T5 >> 8) & 0xFF
            RNC_S0 += 2
            RNC_T5 = RNC_T2
            at = sll(RNC_T5, 0x10)
            RNC_T5 = srl(RNC_T5, 0x10) | at
            RNC_T7 = RNC_T1 - 1
            while True:
                RNC_T6 &= 0xFFFF
                at = RNC_T5 & RNC_CONSTANT_A3
                RNC_T5 = sll(RNC_T5, 1)
                RNC_T6 = srl(RNC_T6, 1)
                if at != 0:
                    RNC_T6 |= RNC_CONSTANT_A3
                RNC_T7 -= 1
                if RNC_T7 < 0:
                    break
            RNC_T5 = 0x10 - RNC_T1
            RNC_T6 = srl(RNC_T6, RNC_T5)
            RNC_S2_BUFFER[RNC_S0 + 1] = RNC_T6 & 0xFF
            RNC_S2_BUFFER[RNC_S0] = (RNC_T6 >> 8) & 0xFF
            RNC_S0 += 2
            RNC_S2_BUFFER[RNC_S0 + 0x3C] = RNC_T1 & 0xFF
            RNC_T5 = RNC_T3 - RNC_T4
            RNC_S2_BUFFER[RNC_S0 + 0x3D] = RNC_T5 & 0xFF
            RNC_T6 = 1
            RNC_T5 -= 1
            RNC_T6 = sll(RNC_T6, RNC_T5)
            RNC_T6 -= 1
            RNC_S2_BUFFER[RNC_S0 + 0x3F] = RNC_T6 & 0xFF
            RNC_S2_BUFFER[RNC_S0 + 0x3E] = (RNC_T6 >> 8) & 0xFF
            RNC_T2 = (RNC_T2 + RNC_T0) & 0xFFFFFFFF
            RNC_T4 -= 1
            if RNC_T4 < 0:
                break
        RNC_T0 = srl(RNC_T0, 1)
        RNC_T1 += 1
        if RNC_T1 == 0x11:
            break
    RNC_T5 = store_t5
    RNC_T6 = store_t6
    RNC_T7 = store_t7

def func_8000A528():
    global RNC_INPUT, RNC_OUTPUT, RNC_S2_BUFFER, RNC_S0, RNC_S1, RNC_S2, RNC_S3, RNC_S4, RNC_S5, RNC_T0, RNC_T1, RNC_T2, RNC_T3, RNC_T4, RNC_T5, RNC_T6, RNC_T7
    RNC_T1 = 3
    while RNC_T1 >= 0:
        RNC_T0 = sll(RNC_T0, 8) | RNC_INPUT[RNC_S0]
        RNC_S0 += 1
        RNC_T1 -= 1

def func_8000A4EC():
    global RNC_INPUT, RNC_OUTPUT, RNC_S2_BUFFER, RNC_S0, RNC_S1, RNC_S2, RNC_S3, RNC_S4, RNC_S5, RNC_T0, RNC_T1, RNC_T2, RNC_T3, RNC_T4, RNC_T5, RNC_T6, RNC_T7
    RNC_T7 += RNC_T1
    RNC_T6 = srl(RNC_T6, RNC_T7)
    RNC_S3 += 4
    RNC_T6 |= sll(RNC_INPUT[RNC_S3 - 2], 0x10)
    RNC_T6 |= sll(RNC_INPUT[RNC_S3 - 1], 0x18)
    RNC_S3 -= 2
    RNC_T1 -= RNC_T7
    RNC_T7 = 0x10 - RNC_T1
    
def func_8000A4B8():
    global RNC_INPUT, RNC_OUTPUT, RNC_S2_BUFFER, RNC_S0, RNC_S1, RNC_S2, RNC_S3, RNC_S4, RNC_S5, RNC_T0, RNC_T1, RNC_T2, RNC_T3, RNC_T4, RNC_T5, RNC_T6, RNC_T7
    RNC_T0 &= RNC_T6
    RNC_T7 -= RNC_T1
    if RNC_T7 < 0:
        func_8000A4EC()
    RNC_T6 = srl(RNC_T6, RNC_T1)
    
def func_8000A3E0():
    global RNC_INPUT, RNC_OUTPUT, RNC_S2_BUFFER, RNC_S0, RNC_S1, RNC_S2, RNC_S3, RNC_S4, RNC_S5, RNC_T0, RNC_T1, RNC_T2, RNC_T3, RNC_T4, RNC_T5, RNC_T6, RNC_T7
    while True:
        RNC_T0 = (RNC_S2_BUFFER[RNC_S0] << 8) | RNC_S2_BUFFER[RNC_S0 + 1]
        RNC_S0 += 2
        RNC_T0 &= RNC_T6
        temp = (RNC_S2_BUFFER[RNC_S0] << 8) | RNC_S2_BUFFER[RNC_S0 + 1]
        RNC_S0 += 2
        RNC_T0 -= temp
        if RNC_T0 == 0:
            break
    RNC_T1 = RNC_S2_BUFFER[RNC_S0 + 0x3C]
    RNC_T7 -= RNC_T1
    if RNC_T7 < 0:
        func_8000A4EC()
    RNC_T6 = srl(RNC_T6, RNC_T1)
    RNC_T0 = RNC_S2_BUFFER[RNC_S0 + 0x3D]
    if RNC_T0 - 2 < 0:
        return
    RNC_T0 -= 1
    RNC_T1 = RNC_T0
    RNC_T2 = RNC_T0
    RNC_T0 = (RNC_S2_BUFFER[RNC_S0 + 0x3E] << 8) | RNC_S2_BUFFER[RNC_S0 + 0x3F]
    RNC_T0 &= RNC_T6
    RNC_T7 -= RNC_T1
    if RNC_T7 < 0:
        func_8000A4EC()
    RNC_T6 = srl(RNC_T6, RNC_T1)
    RNC_T0 |= sll(1, RNC_T2)

def func_8000A204():
    global RNC_INPUT, RNC_OUTPUT, RNC_S2_BUFFER, RNC_S0, RNC_S1, RNC_S2, RNC_S3, RNC_S4, RNC_S5, RNC_T0, RNC_T1, RNC_T2, RNC_T3, RNC_T4, RNC_T5, RNC_T6, RNC_T7
    RNC_S0 += 4
    RNC_T0 = 0x80090000
    func_8000A528()
    RNC_S3 = RNC_S0 + 10
    RNC_S4 = RNC_S1
    RNC_S5 = RNC_S4 + RNC_T0
    RNC_T6 = __bytes_to_int16_le(RNC_INPUT, RNC_S3)
    RNC_T0 = 2
    RNC_T1 = 2
    func_8000A4B8()
    while True:
        # The following part isn't necessary, so I commented it out.
        '''
        RNC_S0 = RNC_S2
        RNC_S1 = RNC_S4
        i = 0xC0
        while i >= 0:
            RNC_S2_BUFFER[RNC_S0] = 0xC9
            #RNC_OUTPUT[RNC_S1] = 0xC9
            RNC_S0 += 1
            RNC_S1 += 1
            i -= 1
        '''
        RNC_S0 = RNC_S2
        func_8000A54C()
        RNC_S0 = RNC_S2 + 0x80
        func_8000A54C()
        RNC_S0 = RNC_S2 + 0x100
        func_8000A54C()
        RNC_T0 = -1
        RNC_T1 = 0x10
        func_8000A4B8()
        RNC_T4 = (RNC_T0 - 1) & 0xFFFF
        first_entry = True
        while True:
            if not first_entry:
                RNC_S0 = RNC_S2 + 0x80
                RNC_T0 = 0
                func_8000A3E0()
                RNC_T0 = -RNC_T0
                RNC_S1 = (RNC_S4 + RNC_T0) - 1
                RNC_S0 = RNC_S2 + 0x100
                func_8000A3E0()
                RNC_OUTPUT[RNC_S4] = RNC_OUTPUT[RNC_S1]
                RNC_S4 += 1
                RNC_S1 += 1
                while True:
                    RNC_OUTPUT[RNC_S4] = RNC_OUTPUT[RNC_S1]
                    RNC_S4 += 1
                    RNC_S1 += 1
                    RNC_T0 -= 1
                    if RNC_T0 < 0:
                        break
            first_entry = False
            RNC_S0 = RNC_S2
            func_8000A3E0()
            RNC_T0 -= 1
            if RNC_T0 >= 0:
                func_8000A6CC()
                RNC_T0 = (RNC_INPUT[RNC_S3 + 1] << 8) | RNC_INPUT[RNC_S3]
                RNC_T0 = sll(RNC_T0, RNC_T7)
                RNC_T1 = sll(1, RNC_T7) - 1
                RNC_T6 &= RNC_T1
                RNC_T6 |= RNC_T0
            RNC_T4 -= 1
            if RNC_T4 < 0:
                break
        if RNC_S4 - RNC_S5 >= 0:
            break

def ResetVariables():
    global RNC_S0, RNC_S1, RNC_S2, RNC_S3, RNC_S4, RNC_S5, RNC_T0, RNC_T1, RNC_T2, RNC_T3, RNC_T4, RNC_T5, RNC_T6, RNC_T7
    RNC_S0 = 0
    RNC_S1 = 0
    RNC_S2 = 0
    RNC_S3 = 0
    RNC_S4 = 0
    RNC_S5 = 0
    RNC_T0 = 0
    RNC_T1 = 0
    RNC_T2 = 0
    RNC_T3 = 0
    RNC_T4 = 0
    RNC_T5 = 0
    RNC_T6 = 0
    RNC_T7 = 0

def DecodeRNC(compressed_data): # func_8000A1A0
    global RNC_INPUT, RNC_OUTPUT, RNC_S2_BUFFER
    RNC_INPUT = compressed_data + bytes([0, 0, 0, 0]) # Append 4 bytes to input data for safety.
    RNC_OUTPUT = [0] * __bytes_to_int(RNC_INPUT, 4)
    RNC_S2_BUFFER = [0] * 0x180 
    ResetVariables()
    func_8000A204()
    return RNC_OUTPUT
    
# Written by Zoinkity
def crc(data):
    """Generates CRC from field data, returning a short int.
    If you intend to running it many times you could calc the table
    just once (during __init__, for instance) and feed it here."""
    tbl = list()
    crc = 0

    # generate CRC table
    for i in range(256):
        for j in range(8):
            i = (i>>1)^0xA001 if (i&1) else (i>>1)
        tbl.append(i)

    # compute CRC from data
    for i in data:
        crc^= i
        crc = (crc>>8) ^ tbl[crc&0xFF]

    # return as a short
    return crc&0xFFFF

WORD_RNX1 = 0x524E5801
WORD_RNC1 = 0x524E4301
WORD_RNX2 = 0x524E5802
WORD_RNC2 = 0x524E4302
WORD_FILL = 0x46494C4C
WORD_END  = 0x454E4421

def parseRNX(rom, i):
    offset = i*4
    start_offset = offset
    output_data = [0] * 0
    while True:
        while rom[offset] == 0:
            offset += 1
        word = __bytes_to_int(rom, offset)
        if word == WORD_END:
            break
        elif word == WORD_RNC1 or word == WORD_RNX1:
            cmp_size = __bytes_to_int(rom, offset + 8)
            compressed_data = rom[offset:offset+cmp_size+0x12]
            output_data += DecodeRNC(compressed_data)
            offset += cmp_size + 0x12
        elif word == WORD_RNC2 or word == WORD_RNX2:
            offset += __bytes_to_int(rom, offset + 8) + 0x12
            raise Exception("RNX2/RNC2 was found! Oh no!!!!!!!")
        elif word == WORD_FILL:
            fillAmount = __bytes_to_int16(rom, offset + 4)
            fillValue = rom[offset + 6]
            output_data += [fillValue] * fillAmount
            offset += 8
        else:
            raise Exception("Invalid word!")
    with open("out/" + hex(start_offset) + ".rnx.bin", "wb") as outFile:
        outFile.write(bytearray(output_data))
    return offset // 4

def parseStandaloneRNC(rom, i):
    offset = i*4
    cmp_size = __bytes_to_int(rom, offset + 8)
    compressed_data = rom[offset:offset+cmp_size+0x12]
    output_data = DecodeRNC(compressed_data)
    with open("out/" + hex(offset) + ".rnc.bin", "wb") as outFile:
        outFile.write(bytearray(output_data))
    return (offset + cmp_size + 0x12) // 4

if len(sys.argv) > 1:
    with open(sys.argv[1], "rb") as inFile:
        outExists = 0
        print("Extracting files into /out/ directory...")
        try:
            os.mkdir("out")
        except FileExistsError:
            outExists = 1
        rom = inFile.read()
        numWords = len(rom) // 4
        i = 0
        while i < numWords:
            word = __bytes_to_int(rom, i*4)
            if word == WORD_RNX1:
                i = parseRNX(rom, i)
            elif word == WORD_RNC1:
                i = parseStandaloneRNC(rom, i)
            else:
                i += 1
        print("Done!")
else:
    print("Usage: RNXExtract <ROM_FILE>")
