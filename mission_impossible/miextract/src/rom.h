#ifndef _ROM_H_
#define _ROM_H_

#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>

#define bswap32(n) (((unsigned)n & 0xFF000000) >> 24 | (n & 0xFF00) << 8 | (n & 0xFF0000) >> 8 | n << 24)
#define bswap16(n) (((unsigned)n & 0xFF00) >> 8 | n << 8)

typedef struct
{
    FILE    *fp;
    size_t   size;
    uint8_t *data;
} rom_t;

void rom_open(rom_t *rom, const char *path);
void rom_close(rom_t *rom);

#endif /* _ROM_H_ */
