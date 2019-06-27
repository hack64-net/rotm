#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>

#include "sool.h"

#define getu16(ptr)((ptr)[0] << 8 | (ptr)[1])
#define getu32(ptr)(uint32_t)(((ptr)[0] << 24) | ((ptr)[1] << 16) | ((ptr)[2] << 8) | ((ptr)[3] << 0))

sool_opinfo_t ops[] = {
    {0x00, "set_flag_1", 0},
    {0x01, "unk_ret0", 0},
    {0x02, "return", 0},
    {0x03, "goto_cond", 1},
    {0x04, "goto", 1},
    {0x05, "num", 1},
    {0x06, "load_num__06", 1},
    {0x07, "var", 1},
    {0x08, "cvar", 2},
    {0x09, "offs", 1},
    {0x0A, "num2", 2},

    {0x0B, "cidoffs", 0},
    {0x0C, "cidoffs_kc", 0},
    {0x0D, "cidvar", 0},

    {0x0E, "unk0E", 2},
    {0x0F, "unk0F", 0},
    {0x10, "set_flag_2 ", 0},
    {0x11, "clear_flag_2", 0},
    {0x12, "unk12", 0},
    {0x13, "unk13", 0},
    {0x14, "leqz", 0},
    {0x15, "cmp_eq", 0},
    {0x16, "cmp_neq", 0},
    {0x17, "lgc_and", 0},
    {0x18, "lgc_or", 0},
    {0x19, "sub", 0},
    {0x1A, "add", 0},
    {0x1B, "mod", 0},
    {0x1C, "mul", 0},
    {0x1D, "div", 0},
    {0x1E, "cmp_lt", 0},
    {0x1F, "cmp_gt", 0},
    {0x20, "cmp_lte", 0},
    {0x21, "cmp_gte", 0},
    {0x22, "inv", 0},
    {0x23, "and", 0},
    {0x24, "or", 0},
    {0x25, "lsh", 0},
    {0x26, "rsh", 0},
    {0x28, "store_var", 0},
    {0x29, "store_ctx_var", 0},
    {0x2A, "inc_var", 0},
    {0x2B, "inc_ctx_var", 0},
    {0x2C, "dec_var", 0},
    {0x2D, "dec_ctx_var", 0},
    {0x2E, "copy_ctx_var", 0},
    {0x2F, "add_ctx_var", 0},
    {0x30, "sub_var", 0},
    {0x31, "sub_ctx_var", 0},
    {0x32, "clear_flag_3", 0},
    {0x34, "set_flag_0_clear_flag_3", 0},
    {0x35, "clear_ctx_flags_0_1", 0},
    {0x36, "set_ctx_flag_1", 0},
    {0x37, "clear_flag_3_unk_cond", 0},
    {0x38, "clear_ctx_flag_3_unk_cond", 0},
    {0x39, "call_method", 0},
    {0x3A, "call_ctx_method", 0},
    {0x3B, "pop_nop", 0},
    {0, NULL, 0}
};

sool_opinfo_t *sool_op_lookup(uint8_t cmdByte)
{
    for(int i = 0; ops[i].name != NULL; i++)
    {
        if(ops[i].cmdByte == cmdByte)
        {
            return &ops[i];
        }
    }
    return NULL;
}

// decode one method
void sool_decode_ops(uint8_t *data, uint32_t sectionOffs, uint32_t methodOffs, FILE *fp)
{
    //printf("methodSize: %d\n", methodSize);
    int i = 0;
    while(1)
    {
        uint8_t *cmd = &data[i];
        sool_opinfo_t *op = sool_op_lookup(cmd[0]);
        uint32_t fileOffs = sectionOffs + methodOffs;

        fprintf(fp, "/*%08X %04X %02X*/", fileOffs + i, methodOffs + i, cmd[0]);

        if(op == NULL)
        {
            if(cmd[0] >= 0x3C && cmd[0] <= 0x4A)
            {
                fprintf(fp, " %-15s %d\n", "othervoidcall", cmd[0] - 0x3C);
                i++;
                continue;
            }
            else if(cmd[0] >= 0x50 && cmd[0] <= 0x5E)
            {
                fprintf(fp, " %-15s %d\n", "othercall", cmd[0] - 0x50);
                i++;
                continue;
            }
            else
            {
                fprintf(fp, "unknown op %02X\n", cmd[0]);
                break;
            }
        }
        else
        {
            fprintf(fp, " %-15s", op->name);
            for(int j = 0; j < op->nimm; j++)
            {
                uint16_t imm = cmd[1+j*2] | (cmd[2+j*2] << 8);
                if(j != 0) fprintf(fp, ",");
                fprintf(fp, " 0x%04X", imm);
            }
            fprintf(fp, "\n");
        }

        i += 1 + (op->nimm * 2);

        if(cmd[0] == 0 || cmd[0] == 2)
        {
            break;
        }
    }
}

void sool_decode(uint8_t *data, const char *path)
{
    FILE *fp = fopen(path, "wb");

    uint32_t size = getu32(&data[0x04]);
    uint16_t numSections = getu16(&data[0x08]);

    fprintf(fp, "size: 0x%08X\n", size);
    fprintf(fp, "numSections: 0x%04X\n\n", numSections);

    for(int i = 0; i < numSections * 4; i += 4)
    {
        uint32_t sectionOffs = getu32(&data[0x0C + i]);
        fprintf(fp, "------------------------------\n"
            "Section 0x%02X @ 0x%08X\n", i/4, sectionOffs);

        uint16_t offsVars = getu16(&data[sectionOffs + 0x00]);
        uint16_t offsVarsEnd = getu16(&data[sectionOffs + 0x02]);
        uint16_t offsVirtualElements = getu16(&data[sectionOffs + 0x04]);
        uint16_t numVirtualElements = getu16(&data[sectionOffs + 0x06]);
        uint16_t unk08 = getu16(&data[sectionOffs + 0x08]);
        uint16_t numPublicMethods = getu16(&data[sectionOffs + 0x0A]);
        uint16_t offsMethodsEnd = getu16(&data[sectionOffs + 0x0C]);
        uint16_t numMethods = getu16(&data[sectionOffs + 0x0E]);

        fprintf(fp,
            "Section header:\n"
            "%04X offsVars\n"
            "%04X offsVarsEnd\n"
            "%04X offsVirtualElements\n"
            "%04X numVirtualElements\n"
            "%04X unk08\n"
            "%04X numPublicMethods\n"
            "%04X offsMethodsEnd\n"
            "%04X numMethods\n\n",
            offsVars, offsVarsEnd,
            offsVirtualElements, numVirtualElements,
            unk08, numPublicMethods, offsMethodsEnd, numMethods);

        fprintf(fp, "Method offsets:\n");
        for(int j = 0; j < numMethods; j++)
        {
            uint32_t methodOffs = getu16(&data[sectionOffs + 0x10 + j*2]);
            fprintf(fp, "%04X\n", methodOffs);
        }
        fprintf(fp, "\n");

        if(offsVars != 0xFFFF)
        {
            fprintf(fp, "Variables:\n");
            for(int j = offsVars; j < offsVarsEnd; j += 2)
            {
                uint32_t var = getu16(&data[sectionOffs + offsVars + j]);
                fprintf(fp, "%04X: %04X\n", j, var);
            }
        }
        fprintf(fp, "\n");

        for(int j = 0; j < numMethods; j++)
        {
            uint32_t methodOffs = getu16(&data[sectionOffs + 0x10 + j*2]);
            fprintf(fp, "%04X:\n", methodOffs);
            sool_decode_ops(&data[sectionOffs + methodOffs], sectionOffs, methodOffs, fp);
            fprintf(fp, "\n");
        }

        if(numVirtualElements != 0)
        {
            fprintf(fp, "Virtual elements:\n");
            for(int j = 0; j < numVirtualElements; j++)
            {
                uint16_t key = getu16(&data[sectionOffs + offsVirtualElements + j*4]);
                uint16_t value = getu16(&data[sectionOffs + offsVirtualElements + j*4 + 2]);
                fprintf(fp, "%04X -> %04X\n", key, value);
            }
        }

        fprintf(fp, "\n");
    }

    fclose(fp);
}
