import sys
import os
import shutil
import glob
import subprocess
import math
from random import randint

# ---------------------------------------------------------------------------

def main(command, inShadowManMode, inFilename, outFilename):
    dosbox_path = find_dosbox_path()
    if dosbox_path is not None:
        with open(inFilename, "rb") as inFile:
            data = list(inFile.read())
            if command == 'p':
                # Check if first 3 bytes are "RNX" or "RNC"
                if data[0] == 0x52 and data[1] == 0x4E and (data[2] == 0x58 or data[2] == 0x43): 
                    print("This file has already been packed! Aborting!")
                    return
                sub_files = split_raw_file(data)
                checksums = get_checksums_for_sub_files(sub_files)
                sub_filenames = write_sub_files(sub_files)
                pack_files(dosbox_path, sub_filenames)
                packed_data = load_packed_files(sub_filenames, checksums, inShadowManMode)
                if inShadowManMode:
                    write_file(outFilename, packed_data[0])
                    write_file(outFilename + ".crcs", packed_data[1])
                else:
                    write_file(outFilename, packed_data)
            elif command == 'u':
                crc_file = inFilename + ".crcs" if inShadowManMode else None
                if (crc_file is not None) and (not os.path.exists(crc_file)):
                    print(crc_file + " was not found! Aborting!")
                    return
                sub_files = split_rnx_file(data, crc_file)
                sub_filenames = []
                for sub_file in sub_files:
                    if sub_file[0] != "RAW" and sub_file[0] != "FILL":
                        sub_filenames.append(sub_file[0])
                unpack_files(dosbox_path, sub_filenames)
                unpacked_data = []
                for sub_file in sub_files:
                    if sub_file[0] == "RAW" or sub_file[0] == "FILL":
                        unpacked_data += sub_file[1]
                    else:
                        with open(sub_file[0], "rb") as subFile:
                            unpacked_data += list(subFile.read())
                write_file(outFilename, unpacked_data)
                

def find_dosbox_path():
    if os.name == 'nt': # Currently just windows only.
        folder = get_program_files_32bit()
        return glob.glob(folder + '\\DOSBox*')[0] + '\\DOSBox.exe'
    else:
        print('Your OS is currently not supported. Sorry!')
    return None

# From: https://stackoverflow.com/a/5838022
def get_program_files_32bit():
    if 'PROGRAMFILES(X86)' in os.environ: # Check if 64-bit windows
        return os.environ['PROGRAMFILES(X86)']
    else:
        return os.environ['PROGRAMFILES']

WORD_RNC1 = 0x524E4301
WORD_RNC2 = 0x524E4302
WORD_RNX1 = 0x524E5801
WORD_RNX2 = 0x524E5802
WORD_FILL = 0x46494C4C
WORD_RAW  = 0x52415721
WORD_END  = 0x454E4421

valid_words = [WORD_RNC1, WORD_RNC2, WORD_RNX1, WORD_RNX2, WORD_FILL, WORD_RAW, WORD_END]

def align_size_8bytes(size):
    return (size + 7) & 0xFFFFFFF8

def get_u16(data, offset):
    return int.from_bytes(data[offset:offset+2], byteorder='big')

def get_u32(data, offset):
    return int.from_bytes(data[offset:offset+4], byteorder='big')

def set_u32(data, offset, value):
    data[offset]     = (value >> 24) & 0xFF
    data[offset + 1] = (value >> 16) & 0xFF
    data[offset + 2] = (value >> 8) & 0xFF
    data[offset + 3] = value & 0xFF

def get_rnx_word(data, offset):
    word = get_u32(data, offset)
    if word not in valid_words:
        raise Exception("Not a valid RNX file! Invalid word: '" + hex(word) + "'. Aborting!")
    return word

def get_checksums_for_sub_files(sub_files): 
    checksums = []
    
    for sub_file in sub_files:
        checksum = 0
        for byte in sub_file:
            checksum += byte
        checksums.append(checksum)
    
    return checksums

def split_rnx_file(data, crc_file):
    global TEMP_DIR
    
    crcs = []
    if crc_file is not None: # Only done for ShadowManMode
        with open(crc_file, "rb") as crcFile:
            crcsData = list(crcFile.read())
            for i in range(len(crcsData) // 4):
                crcs.append(get_u32(crcsData, i * 4))
        #print(crcs)
    
    sub_files = []
    offset = 0
    num_rnc = 0
    word = get_rnx_word(data, offset)
    while word != WORD_END:
        if word == WORD_RNC1 or word == WORD_RNC2 or word == WORD_RNX1 or word == WORD_RNX2:
            if data[offset + 2] == 0x58: # Check for "RNX", and change it to "RNC"
                data[offset + 2] = 0x43
            if crc_file is not None: # Only done for ShadowManMode
                set_u32(data, offset + 0xC, crcs[num_rnc])
            total_size = get_u32(data, offset + 8) + 0x12
            filename = "./"+TEMP_DIR+"/P" + str(num_rnc)
            rnc_data = list(data[offset:offset+total_size])
            write_file(filename, rnc_data)
            sub_files.append([filename])
            num_rnc += 1
            offset += align_size_8bytes(total_size)
        elif word == FILL:
            length = get_u16(data, offset+4)
            value = offset[5]
            sub_files.append(["FILL", list([value] * length)])
            offset += 8
        elif word == RAW:
            total_size = get_u32(data, offset + 4) + 8
            sub_files.append(["RAW", list(data[offset+8:offset+total_size])])
            offset += align_size_8bytes(total_size)
        else:
            raise Exception("Wait... how did you get here?")
        word = get_rnx_word(data, offset)
    return sub_files

def split_raw_file(data):
    num_sub_files = math.ceil(len(data) / 0x4000)
    sub_files = []
    for i in range(num_sub_files):
        sub_files.append(data[i*0x4000:(i+1)*0x4000])
    return sub_files
    
def write_sub_files(sub_files):
    global TEMP_DIR
    index = 0
    for sub_file in sub_files:
        filename = "./"+TEMP_DIR+"/P" + str(index)
        write_file(filename, sub_file)
        while not os.path.exists(filename):
            time.sleep(1) # Wait for the file to exist before continuing
        index += 1
    filenames = []
    for i in range(index):
        filenames.append(str("./"+TEMP_DIR+"/P" + str(i)))
    return filenames

def load_packed_files(sub_filenames, checksums, inShadowManMode):
    num_files = len(sub_filenames)
    result = []
    if inShadowManMode:
        saved_crcs = []
    for i in range(num_files):
        with open(sub_filenames[i], "rb") as inFile:
            sub_data = list(inFile.read())
            if not (sub_data[0] == 0x52 and sub_data[1] == 0x4E and sub_data[2] == 0x43): 
                print("Something went wrong when packing '" + sub_filenames[i] + "' Aborting!")
                sys.exit()
            if i < num_files - 1:
                sub_data[2] = 0x58 # Change 'RNC' to 'RNX'
            if inShadowManMode:
                saved_crcs += sub_data[0x0C:0x10]
                set_u32(sub_data, 0x0C, checksums[i]) # Overwrite checksum.
            while len(sub_data) % 8 != 0:
                sub_data.append(0) # Make sure file is 8-byte aligned
            result += sub_data
    result += [0x45, 0x4E, 0x44, 0x21] # Add "END!"
    
    if inShadowManMode:
        return (result, saved_crcs)
    else:
        return result            

def pack_file(dosbox_path, filename):
    run_ppibm(dosbox_path, ["mount C \"" + os.getcwd() + "\"", "C:", "ppibm.exe p " + filename, "exit"])
    
def unpack_file(dosbox_path, filename):
    run_ppibm(dosbox_path, ["mount C \"" + os.getcwd() + "\"", "C:", "ppibm.exe u " + filename, "exit"])
    
def pack_files(dosbox_path, filenames):
    run_ppibm(dosbox_path, ["mount C \"" + os.getcwd() + "\"", "C:", "ppibm.exe p " + ' '.join(filenames), "exit"])
    
def unpack_files(dosbox_path, filenames):
    run_ppibm(dosbox_path, ["mount C \"" + os.getcwd() + "\"", "C:", "ppibm.exe u " + ' '.join(filenames), "exit"])

def run_ppibm(dosbox_path, dosbox_commands):
    os.environ["SDL_VIDEODRIVER"] = 'dummy'
    dosbox_command = [dosbox_path]
    for command in dosbox_commands:
        dosbox_command.append('-c')
        dosbox_command.append(command)
    dosbox_command.append('-noconsole')
    dosbox_command.append('-conf ./dosbox.config')
    #print(dosbox_command)
    subprocess.check_call(dosbox_command)

def write_file(filename, data):
    with open(filename, "wb") as outFile:
        outFile.write(bytearray(data))

# ---------------------------------------------------------------------------

if len(sys.argv) < 3:
    print("Usage:")
    print("Packing a file:   RNXProPack.py p [-ShadowManMode] <in_file> [out_file]")
    print("Unpacking a file: RNXProPack.py u [-ShadowManMode] <in_file> [out_file]")
    print("Make sure you include the '-ShadowManMode' option if you are working with the game 'Shadow Man'")
    sys.exit()

num_args = len(sys.argv)
command = sys.argv[1]
inShadowManMode = False
args_index = 2

if sys.argv[args_index].lower() == '-shadowmanmode':
    inShadowManMode = True
    args_index += 1

if args_index == num_args - 1:
    inFilename = sys.argv[args_index]
    outFilename = sys.argv[args_index]
else:
    inFilename = sys.argv[args_index]
    outFilename = sys.argv[args_index + 1]

TEMP_DIR = "_" + hex(randint(0, 0xFFFFFF))[2:]

# Delete temp directory if it exists.
if os.path.isdir(TEMP_DIR):
    shutil.rmtree(TEMP_DIR)

# Create temp directory
os.mkdir(TEMP_DIR)

main(command, inShadowManMode, inFilename, outFilename)

# Delete temp directory
shutil.rmtree(TEMP_DIR)