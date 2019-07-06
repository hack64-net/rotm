class EAHD:
    def __init__(self, src):
        self.src = src

    def __bytes_to_int24(self, arr, offset):
        return int.from_bytes(arr[offset:offset+3], byteorder='big')

    def __bytes_to_int_reversed(self, arr, offset):
        return int.from_bytes(arr[offset:offset+4], byteorder='little')
        
    def __memset(self, dst, dst_offset, value, amount):
        for i in range(amount):
            dst[dst_offset + i] = value

    def __memcpy(self, dst, dst_offset, dst_backwards_offset, amount):
        src_offset = dst_offset - dst_backwards_offset
        for i in range(amount):
            dst[dst_offset + i] = dst[src_offset + i]

    def __fetch_bytes(self, dst, dst_offset, dst_backwards_offset, amount):
        if dst_backwards_offset > 1:
            self.__memcpy(dst, dst_offset, dst_backwards_offset, amount)
        else:
            self.__memset(dst, dst_offset, dst[dst_offset - dst_backwards_offset], amount)
        return dst_offset + amount

    def __copy_literal(self, dst, dst_offset, src, src_offset, amount):
        for i in range(amount):
            dst[dst_offset + i] = src[src_offset + i]

    def parse(self):
        decompressed_size = self.__bytes_to_int24(self.src, 0x2)
        dst = [0] * decompressed_size # Decompressed data list
        src_offset = 0x5
        dst_offset = 0
        while True:
            cmd = self.__bytes_to_int_reversed(self.src, src_offset)
            if cmd & 0x80 == 0: # Covers commands 00 to 7F
                src_offset += 2
                # Copy bytes from the compressed data array
                amount_to_copy = cmd & 0x3
                self.__copy_literal(dst, dst_offset, self.src, src_offset, amount_to_copy)
                src_offset += amount_to_copy
                dst_offset += amount_to_copy
                # Fetch bytes from previous decompressed data
                backward_fetch_offset = ((cmd << 3) & 0x300) + ((cmd >> 8) & 0xFF) + 1
                amount_of_bytes_to_fetch = ((cmd >> 2) & 0x7) + 3
                dst_offset = self.__fetch_bytes(dst, dst_offset, backward_fetch_offset, amount_of_bytes_to_fetch)
                continue
            if cmd & 0x40 == 0: # Covers commands 0x80 to 0xBF
                # Copy bytes from the compressed data array
                src_offset += 3
                amount_to_copy = ((cmd >> 8) >> 6) & 0x3
                self.__copy_literal(dst, dst_offset, self.src, src_offset, amount_to_copy)
                src_offset += amount_to_copy
                dst_offset += amount_to_copy
                # Fetch bytes from previous decompressed data
                backward_fetch_offset = (((cmd >> 8) << 8) & 0x3F00) + ((cmd >> 16) & 0xFF) + 1
                amount_of_bytes_to_fetch = (cmd & 0x3F) + 4
                dst_offset = self.__fetch_bytes(dst, dst_offset, backward_fetch_offset, amount_of_bytes_to_fetch)
                continue
            if cmd & 0x20 == 0: # Covers commands 0xC0 to 0xDF
                src_offset += 4
                amount_to_copy = cmd & 0x3
                self.__copy_literal(dst, dst_offset, self.src, src_offset, amount_to_copy)
                src_offset += amount_to_copy
                dst_offset += amount_to_copy
                # Fetch bytes from previous decompressed data
                backward_fetch_offset = ((cmd << 12) & 0x10000) + (((cmd >> 8) << 8) & 0xFF00) + 1 + ((cmd >> 16) & 0xFF)
                amount_of_bytes_to_fetch = ((cmd << 6) & 0x300) + ((cmd >> 24) & 0xFF) + 5
                dst_offset = self.__fetch_bytes(dst, dst_offset, backward_fetch_offset, amount_of_bytes_to_fetch)
                continue
            src_offset += 1
            if (cmd & 0xFF) < 0xFC: # Covers commands 0xE0 to 0xFB
                # Copy bytes from the compressed data array
                amount_to_copy = ((cmd & 0x1F) + 1) * 4
                self.__copy_literal(dst, dst_offset, self.src, src_offset, amount_to_copy)
                src_offset += amount_to_copy
                dst_offset += amount_to_copy
                continue
            if cmd & 3 != 0: # Copy any left-over bytes
                # Copy bytes from the compressed data array
                amount_to_copy = cmd & 0x3
                self.__copy_literal(dst, dst_offset, self.src, src_offset, amount_to_copy)
                src_offset += amount_to_copy
                dst_offset += amount_to_copy
            break # A command of 0xFC, 0xFD, 0xFE, or 0xFF will end the decompression routine.
        return dst
