import re
from bigf import BIGF

def main():
    print('BIGF extractor v1.0 by Davideesk')
    print('Enter the path to the .big archive file, or "q" to quit.')
    print('You can optionally set a range if you want to extract from a ROM file like:')
    print('Example: > supercross2000.u.z64 0x55F70-0xEE5D10')
    while True:
        cmd = input("> ")
        if cmd == 'q':
            break
        else:
            filename = cmd
            search = re.search("[ ]", filename)
            byte_range = [0, 0]
            taking_range = False
            error_occured = False
            if search:
                offset_range = filename[search.end():]
                filename = filename[0:search.start()]
                searchRange = re.search("[-]", offset_range)
                if searchRange:
                    taking_range = True
                    start = offset_range[0:searchRange.start()].lower()
                    end = offset_range[searchRange.end():].lower()
                    try:
                        if start.startswith("0x"):
                            byte_range[0] = int(start, 16)
                        else:
                            byte_range[0] = int(start)
                        if end.startswith("0x"):
                            byte_range[1] = int(end, 16)
                        else:
                            byte_range[1] = int(end)
                    except:
                        error_occured = True
                        print('Error: invalid range')
                else:
                    error_occured = True
                    print('Error: invalid range')
            if not error_occured:
                with open(filename, "rb") as file:
                    if taking_range:
                        bigf_file = BIGF(file.read()[byte_range[0]:byte_range[1]])
                    else:
                        bigf_file = BIGF(file.read())
                    print('Extracting...')
                    bigf_file.output_to_dir('bigf/')
                    print('Done!')
                
    
if __name__== "__main__":
  main()
