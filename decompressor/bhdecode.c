#include <stdlib.h>
#include <stdint.h>
#include <stdio.h>
#include <stdint.h>

#ifdef _WIN32
#include <direct.h>
#else
#include <sys/stat.h>
#include <sys/types.h>
#endif

#include "lzss.h"

// bomberman hero gfx/collision file dumper
// shygoo 2020

#define BSWAP32(v) ((((v) & 0x000000FF) << 24) | \
                    (((v) & 0x0000FF00) <<  8) | \
                    (((v) & 0x00FF0000) >>  8) | \
                    (((v) & 0xFF000000) >> 24))

#define BH_LEVEL_TABLE_ADDR 0x000F984C
#define BH_NAME_TABLE_ADDR  0x001172AC

typedef struct
{
    /*00*/ uint32_t unk00;
    /*04*/ uint32_t collisionStart;
    /*08*/ uint32_t collisionEnd;
    /*0C*/ uint32_t gfxStart;
    /*10*/ uint32_t gfxEnd;
    /*14*/ uint32_t unk14;
    /*18*/ uint32_t unk18;
    /*1C*/ uint32_t unk1C;
    /*20*/ uint32_t unk20;
} bh_level_info_t;

void decompress_levels(uint8_t *rom, const char *dirPath)
{
    bh_level_info_t *levelTable = (bh_level_info_t *) &rom[BH_LEVEL_TABLE_ADDR];

    for(int i = 0; i < 107; i++)
    {
        bh_level_info_t info = levelTable[i];

        uint32_t dstSize;
        uint32_t collisionAddr = BSWAP32(info.collisionStart);
        uint32_t gfxAddr = BSWAP32(info.gfxStart);

        char path[256];

        sprintf(path, "%s/%02X.collision.bin", dirPath, i);
        lzss_decode_to_file(&rom[collisionAddr], path);

        sprintf(path, "%s/%02X.gfx.bin", dirPath, i);
        lzss_decode_to_file(&rom[gfxAddr], path);

        printf("unk00: %08X, collision:%08X %08X, gfx:%08X %08X, unk14: %08X, unk18: %08X, unk20: %08X\n",
            BSWAP32(info.unk00),
            BSWAP32(info.collisionStart),
            BSWAP32(info.collisionEnd),
            BSWAP32(info.gfxStart),
            BSWAP32(info.gfxEnd),
            BSWAP32(info.unk14),
            BSWAP32(info.unk18),
            BSWAP32(info.unk1C),
            BSWAP32(info.unk20));
    }
}

void print_some_names(uint8_t *rom)
{
    // print names from some table
    for(int i = 0; i < 652; i++)
    {
        uint8_t *entry = &rom[BH_NAME_TABLE_ADDR + (i * 0x60)];
        printf("%s\n", &entry[0x4C]);
    }
}

int makedir(const char *name)
{
    #ifdef _WIN32
	mkdir(name);
	#else
	mkdir(name, 0777);
	#endif
}

int main(int argc, const char *argv[])
{
    uint8_t *rom;
    size_t romSize;
    const char *romPath;
    const char* dirPath;
    FILE *fp;

    if(argc < 3)
    {
        printf("usage: bhdecode <rom> <dump_dir>\n");
        return EXIT_FAILURE;
    }

    romPath = argv[1];
    dirPath = argv[2];
    fp = fopen(romPath, "rb");

    if(fp == NULL)
    {
        printf("failed to open '%s'\n", romPath);
        return EXIT_FAILURE;
    }

    makedir(dirPath);

    fseek(fp, 0, SEEK_END);
    romSize = ftell(fp);
    rewind(fp);
    rom = (uint8_t *)malloc(romSize);
    fread(rom, 1, romSize, fp);
    fclose(fp);

    decompress_levels(rom, dirPath);
    //print_some_names(rom);
    free(rom);
}
