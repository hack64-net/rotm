#include <stdio.h>
#include <vector>
#include "SOOLDisassembler.h"

sool_opinfo_t CSOOLDisassembler::Ops[] = {
    {0x00, "end", 0},
    {0x01, "unk01", 0},
    {0x02, "return", 0},
    {0x03, "ifgoto", 1, FMT_TARGET},
    {0x04, "goto", 1, FMT_TARGET},
    {0x05, "immload", 1, FMT_NUM},
    {0x06, "immload_06", 1, FMT_NUM},
    {0x07, "varload", 1, FMT_VAR},
    {0x08, "objvarload", 2},
    {0x09, "immload_09", 1},
    {0x0A, "immload2", 2, FMT_NUM, FMT_NUM},
    {0x0B, "objelemload", 0},
    {0x0C, "objelemload_k", 0},
    {0x0D, "objelemvarload", 0},
    {0x0E, "unk0E", 2},
    {0x0F, "unk0F", 0},
    {0x10, "setflag2 ", 0},
    {0x11, "clearflag2", 0},
    {0x12, "unk12", 0},
    {0x13, "unk13", 0},
    {0x14, "cmpleqz", 0},
    {0x15, "cmpeq", 0},
    {0x16, "cmpneq", 0},
    {0x17, "lgcand", 0},
    {0x18, "lgcor", 0},
    {0x19, "sub", 0},
    {0x1A, "add", 0},
    {0x1B, "mod", 0},
    {0x1C, "mul", 0},
    {0x1D, "div", 0},
    {0x1E, "cmplt", 0},
    {0x1F, "cmpgt", 0},
    {0x20, "cmplte", 0},
    {0x21, "cmpgte", 0},
    {0x22, "neg", 0},
    {0x23, "and", 0},
    {0x24, "or", 0},
    {0x25, "lsh", 0},
    {0x26, "rsh", 0},
    {0x28, "varstore", 0},
    {0x29, "objvarstore", 0},
    {0x2A, "varinc", 0},
    {0x2B, "objvinc", 0},
    {0x2C, "vardec", 0},
    {0x2D, "objvardec", 0},
    {0x2E, "objvarmov", 0},
    {0x2F, "objvaradd", 0},
    {0x30, "varsub", 0},
    {0x31, "objvarsub", 0},
    {0x32, "clearflag3", 0},
    {0x34, "setflag0clearflag3", 0},
    {0x35, "objclearflags01", 0},
    {0x36, "objsetflag1", 0},
    {0x37, "clearflag3_unkcnd", 0},
    {0x38, "objclearflag3_unkcnd", 0},
    {0x39, "callmethod", 0},
    {0x3A, "objcallmethod", 0},
    {0x3B, "pop", 0},
    {0, NULL, 0}
};

sool_opinfo_t *CSOOLDisassembler::Lookup(uint8_t cmdByte)
{
    for(int i = 0; Ops[i].name != NULL; i++)
    {
        if(Ops[i].cmdByte == cmdByte)
        {
            return &Ops[i];
        }
    }
    return NULL;
}

int CSOOLDisassembler::DecodeOp(uint8_t *data, uint32_t offsVars)
{
    sool_opinfo_t *op = Lookup(data[0]);

    if(op == NULL)
    {
        if(data[0] >= 0x3C && data[0] <= 0x4A)
        {
            printf("            %-15s %d\n", "callvnative", data[0] - 0x3C);
            return 1;
        }

        if(data[0] >= 0x50 && data[0] <= 0x5E)
        {
            printf("            %-15s %d\n", "callnative", data[0] - 0x50);
            return 1;
        }
        
        printf("            unknown op %02X\n", data[0]);
        return 0;
    }
    else
    {
        int len = 1;

        printf("            %-15s", op->name);

        if(op->nimm > 0)
        {
            uint16_t imm = data[1+0*2] | (data[2+0*2] << 8);
            ImmFmt fmt = op->fmt0;

            // check for load_imm_09, store_var
            if(data[0] == 0x09 && data[3] == 0x28) 
            {
                fmt = FMT_VAR;
            }

            switch(fmt)
            {
            case FMT_NUM: printf(" 0x%04X", imm); break;
            case FMT_VAR: printf(" @@var%02X", (imm-offsVars)/2); break;
            case FMT_TARGET: printf(" @@L%04X", imm); break;
            }
            len+=2;
        }

        if(op->nimm > 1)
        {
            printf(",");
            uint16_t imm = data[1+1*2] | (data[2+1*2] << 8);
            switch(op->fmt1)
            {
            case FMT_NUM: printf(" 0x%04X", imm); break;
            case FMT_VAR: printf(" @@var%02X", imm); break;
            case FMT_TARGET: printf(" @@L%04X", imm); break;
            }
            len+=2;
        }
        printf("\n");
        return len;
    }

    return 1;
}

void CSOOLDisassembler::DisassembleMethod(uint8_t *commands, uint32_t methodOffs, uint32_t methodEndOffs, uint32_t offsVars)
{
    bool done = false;

    std::vector<uint16_t> branchTargets;

    size_t methodSize = methodEndOffs - methodOffs;

    // collect branch targets
    for(int i = 0; i < methodSize;)
    {
        sool_opinfo_t *opinfo = Lookup(commands[i]);
        int len = 1;

        if(opinfo != NULL)
        {
            len += opinfo->nimm * 2;
        }

        if(commands[i] == 0x03 || commands[i] == 0x04)
        {
            uint16_t targetOffs = commands[i+1] | (commands[i+2] << 8);
            branchTargets.push_back(targetOffs);
        }

        i += len;
    }

    while(methodOffs < methodEndOffs)
    {
        for(int i = 0; i < branchTargets.size(); i++)
        {
            if(methodOffs == branchTargets[i])
            {
                printf("            @@L%04X:\n", methodOffs);
                break;
            }
        }

        if(commands[0] == 0x02 || commands[0] == 0x00)
        {
            done = true;
        }

        int len = DecodeOp(commands, offsVars);
        commands += len;
        methodOffs += len;
    }
    printf("\n");
}