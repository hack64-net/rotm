#include <stdlib.h>
#include <stdint.h>
#include <stdio.h>

// common lzss decoder
// shygoo 2020

static uint8_t decoderCache[0x1000];

uint32_t lzss_decode(uint8_t *src, uint8_t *dst)
{
    uint32_t srcSize = 4 + *(uint32_t *)&src[0];
    uint32_t srcIdx = 4;
    uint32_t dstIdx = 0;
    uint16_t cacheIdx = 0x0FEE;
    uint16_t flags = 0;

    for(uint16_t i = 0; i < 0x1000; i++)
    {
        decoderCache[i] = 0;
    }
    
    while(srcIdx < srcSize)
    {
        flags >>= 1;

        if((flags & 0x0100) == 0)
        {
            flags = 0xFF00 | src[srcIdx++];
        }

        if(flags & 0x0001)
        {
            uint8_t value = src[srcIdx++];
            dst[dstIdx++] = value;
            decoderCache[cacheIdx++] = value;
            cacheIdx &= 0x0FFF;
        }
        else
        {
            uint8_t pair0 = src[srcIdx++];
            uint8_t pair1 = src[srcIdx++];

            uint16_t offset = pair0 | ((pair1 & 0x00F0) << 4);
            uint16_t length = (pair1 & 0x000F) + 3;

            for(uint16_t i = 0; i < length; i++)
            {
                uint8_t value = decoderCache[(offset + i) & 0x0FFF];
                dst[dstIdx++] = value;
                decoderCache[cacheIdx++] = value;
                cacheIdx &= 0x0FFF;
            }
        }
    }

    return dstIdx;
}

uint32_t lzss_calc_dst_size(uint8_t* src)
{
    uint32_t srcSize = 4 + *(uint32_t *)&src[0];
    uint32_t srcIdx = 4;
    uint32_t dstIdx = 0;
    uint16_t flags = 0;

    while(srcIdx < srcSize)
    {
        flags >>= 1;

        if((flags & 0x0100) == 0)
        {
            flags = 0xFF00 | src[srcIdx++];
        }

        if(flags & 0x0001)
        {
            srcIdx++;
            dstIdx++;
        }
        else
        {
            srcIdx++;
            dstIdx += (src[srcIdx++] & 0x000F) + 3;
        }
    }

    return dstIdx;
}

void lzss_decode_to_file(uint8_t* src, const char *path)
{
    uint32_t dstSize = lzss_calc_dst_size(src);
    uint8_t *dst = (uint8_t *)malloc(dstSize);
    FILE *fp = fopen(path, "wb");
    lzss_decode(src, dst);
    fwrite(dst, 1, dstSize, fp);
    fclose(fp);
}
