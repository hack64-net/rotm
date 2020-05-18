#ifndef _BLHZ_H_
#define _BLHZ_H_

uint32_t lzss_decode(uint8_t *src, uint8_t *dst);
uint32_t lzss_calc_dst_size(uint8_t* src);
void lzss_decode_to_file(uint8_t* src, const char *path);

#endif