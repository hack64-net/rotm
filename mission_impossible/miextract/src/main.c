#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#include "rom.h"
#include "raw_inflate.h"
#include "sool.h"

#ifdef _WIN32
    #include <direct.h>
#endif

#ifdef _WIN32
    #define makedir _mkdir
#else
    #define makedir(path) mkdir(path, 0777) 
#endif

// note: this feature only works with GCC
#pragma scalar_storage_order big-endian
typedef struct
{
    uint32_t dstSize;
    uint32_t srcSize;
    uint32_t unk08;
    uint32_t offset;
    uint32_t unk10; // 0x00000000 when dst and src are the same size, otherwise 0x04000000
} BurpBlock;

typedef struct
{
    char      signature[4];  // "Burp"
    uint32_t  numBlocks;
    BurpBlock blocks[];
} BurpHeader;
#pragma scalar_storage_order default

void burp_info(rom_t *rom, uint32_t burpOffset)
{
    BurpHeader *burp = (BurpHeader *)&rom->data[burpOffset];

    printf("0x%08X:\n", burpOffset);
    printf("    dstSize    srcSize    unk08      offset     unk10\n");
    for(int i = 0; i < burp->numBlocks; i++)
    {
        BurpBlock *block = &burp->blocks[i];
        printf("    0x%08X 0x%08X 0x%08X 0x%08X 0x%08X // 0x%08X\n",
            block->dstSize, block->srcSize, block->unk08, block->offset, block->unk10,
            burpOffset + block->offset);
    }
    printf("\n");
}

void burp_dump(rom_t *rom, uint32_t burpOffset, const char* outputDir)
{
    BurpHeader *burp = (BurpHeader *)&rom->data[burpOffset];

    char burpDirPath[256];
    sprintf(burpDirPath, "%s/%08X", outputDir, burpOffset);
    makedir(burpDirPath);

    for(int i = 0; i < burp->numBlocks; i++)
    {
        BurpBlock *block = &burp->blocks[i];
        uint32_t srcOffset = burpOffset + block->offset;
        uint8_t *dst = malloc(block->dstSize);
        uint8_t *src = &rom->data[srcOffset];
        
        char outputPath[256];
        sprintf(outputPath, "%s/%08X.bin", burpDirPath, srcOffset);
        FILE *fp = fopen(outputPath, "wb");

        if(block->unk10 == 0x00000000) // uncompressed
        {
            fwrite(&rom->data[srcOffset], 1, block->srcSize, fp);
        }
        else if(block->unk10 == 0x04000000) // deflate
        {
            raw_inflate(dst, block->dstSize, src, block->srcSize);
            fwrite(dst, 1, block->dstSize, fp);

            if(memcmp(dst, "SOOL", 4) == 0)
            {
                //char outputPath[256];
                sprintf(outputPath, "%s/%08X.sool.txt", burpDirPath, srcOffset);
                sool_decode(dst, outputPath);
                //printf("SOOL\n");
            }
        }
        else
        {
            printf("?\n");
        }

        fclose(fp);
        free(dst);
    }
}

int main(int argc, const char *argv[])
{
    if(argc != 3)
    {
        printf("usage: miextract <rom_path> <output_dir_path>\n");
        return EXIT_FAILURE;
    }

    const char *romPath = argv[1];
    const char *outputDirPath = argv[2];

    rom_t rom;
    rom_open(&rom, romPath);

    makedir(outputDirPath);

    for(size_t offset = 0; offset < rom.size; offset += 4)
    {
        BurpHeader *burp = (BurpHeader *)&rom.data[offset];
        if(memcmp("Burp", burp->signature, sizeof(burp->signature)) == 0)
        {
            burp_info(&rom, offset);
            burp_dump(&rom, offset, outputDirPath);
        }
    }

    return EXIT_SUCCESS;
}
