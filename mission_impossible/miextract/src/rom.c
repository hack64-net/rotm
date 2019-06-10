#include "rom.h"

void rom_open(rom_t *rom, const char *path)
{
    rom->fp = fopen(path, "rb");
    fseek(rom->fp, 0, SEEK_END);
    rom->size = ftell(rom->fp);
    rewind(rom->fp);
    rom->data = (uint8_t *) malloc(rom->size);
    fread(rom->data, 1, rom->size, rom->fp);
}

void rom_close(rom_t *rom)
{
    free(rom->data);
    fclose(rom->fp);
}
