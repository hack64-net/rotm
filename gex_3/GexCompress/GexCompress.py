import sys
import zlib

def print_usage():
    print("Usage: GexCompress.py <-c to compress OR -d to decompress> <in_filepath> <out_filepath>")

def decompress_raw_deflate(compressed_bytes):
    return zlib.decompress(compressed_bytes, wbits=-15)

def compress_raw_deflate(bytes):
    return zlib.compress(bytes, level=9)[2:] # Remove zlib header.

if len(sys.argv) == 4:
    with open(sys.argv[2], 'rb') as inFile, open(sys.argv[3], 'wb') as outFile:
        if sys.argv[1] == "-c":
            outFile.write(compress_raw_deflate(inFile.read()))
        elif sys.argv[1] == "-d":
            outFile.write(decompress_raw_deflate(inFile.read()))
        else:
            print("Error: Invalid argument. Should be '-c' for compressing or '-d' for decompressing")
            print_usage()
else:
    print("Error: Invalid num of args!")
    print_usage()
