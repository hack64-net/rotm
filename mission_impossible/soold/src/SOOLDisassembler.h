#ifndef SOOLDISASSEMBLER_H
#define SOOLDISASSEMBLER_H

#include <stdint.h>

enum ImmFmt
{
    FMT_NUM,
    FMT_VAR,
    FMT_TARGET
};

typedef struct
{
    uint8_t     cmdByte;
    const char *name;
    int         nimm;
    ImmFmt      fmt0, fmt1;
} sool_opinfo_t;

class CSOOLDisassembler
{
private:
    static sool_opinfo_t Ops[];
    static sool_opinfo_t *Lookup(uint8_t cmdByte);
    static int DecodeOp(uint8_t *data, uint32_t offsVars);
public:
    static void DisassembleMethod(uint8_t *commands, uint32_t methodOffs, uint32_t methodEndOffs, uint32_t offsVars);
};

#endif // SOOLDISASSEMBLER_H