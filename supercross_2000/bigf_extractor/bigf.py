import os
from eahd import EAHD

class BIGF_file:
    def __init__(self, name, offset, length, bytes, depth):
        self.name = name
        self.offset = offset
        self.length = length
        self.bytes = bytes
        self.depth = depth
        self.compressed = False
        
        if name.endswith('.big'):
            self.BIGF = BIGF(bytes, depth + 1)
        else:
            if bytes[0] == 0x10 and bytes[1] == 0xFB:
                self.compressed = True
                self.file_parser = EAHD(bytes)
        
    def __str__(self):
        string = '[' + self.name + '] offset = ' + hex(self.offset) + ', length = ' + hex(self.length)
        if self.name.endswith('.big'):
            string += '\n' + self.BIGF.get_files_printed()
        return string
        
    def output_to_dir(self, directory):
        if self.name.endswith('.big'):
            self.BIGF.output_to_dir(directory + self.name + '/')
        elif not self.compressed:
            with open(directory + self.name, "wb") as file:
                file.write(self.bytes)
        else:
            with open(directory + self.name, "wb") as file:
                file.write(bytearray(self.file_parser.parse()))
    
class BIGF:
    def __init__(self, data, depth=0):
        self.bytes = data
        self.total_size = self.__bytes_to_int32_be(0x4)
        self.num_files = self.__bytes_to_int32_be(0x8)
        self.index_table_size = self.__bytes_to_int32_be(0xC)
        self.files = []
        self.depth = depth
        self.__parse_index_table()
    
    def __calculate_archive_size(self):
        if self.total_size >= 1024 * 1024:
            return "{0:.2f}".format(self.total_size / 1024 / 1024) + ' MB'
        elif self.total_size >= 1024:
            return "{0:.2f}".format(self.total_size / 1024) + ' KB'
        else:
            return str(self.total_size) + ' Bytes'
    
    def __parse_index_table(self):
        current_offset = 0x10
        for x in range(self.num_files):
            file_offset = self.__bytes_to_int32_be(current_offset)
            file_size = self.__bytes_to_int32_be(current_offset + 4)
            file_name_len = self.__strlen(current_offset + 8)
            file_name = self.bytes[current_offset+8:current_offset+8+file_name_len].decode("ascii")
            file_bytes = self.bytes[file_offset:file_offset+file_size]
            self.files.append(BIGF_file(file_name, file_offset, file_size, file_bytes, self.depth))
            current_offset += 8 + (file_name_len + 1)
    
    def __strlen(self, offset):
        count = 0
        while self.bytes[offset] != 0:
            offset += 1
            count += 1
        return count
        
    def __bytes_to_int32_be(self, offset):
        return int.from_bytes(self.bytes[offset:offset+4], byteorder='big')
        
    def get_files_printed(self):
        indent = ' ' * (self.depth * 4)
        files_str = indent + 'Size of bigf archive: ' + self.__calculate_archive_size() + '\n'
        files_str += indent + 'Number of files: ' + str(self.num_files) + '\n'
        for i in range(self.num_files):
            files_str += indent + str(self.files[i])
            if i < self.num_files - 1:
                files_str += '\n'
        return files_str
        
    def output_to_dir(self, dirname):
        if not os.path.exists(dirname):
            os.mkdir(dirname)
        for file in self.files:
            file.output_to_dir(dirname)
