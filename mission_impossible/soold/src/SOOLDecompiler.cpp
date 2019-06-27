#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include <stdlib.h>
#include <vector>
#include "SOOLDecompiler.h"

#define IMM0(pcmd) ((pcmd)[1] | ((pcmd)[2] << 8))
#define IMM1(pcmd) ((pcmd)[3] | ((pcmd)[4] << 8))

void CSOOLDecompExprStack::Push(const char* format, ...)
{
    expr_t expr;
    expr.type = EXPR_STR;

    va_list args;
    va_start(args, format);
    expr.str = (char*)malloc(256);   
    vsnprintf(expr.str, 256, format, args);
    m_Stack.push(expr);
    va_end(args);
}

void CSOOLDecompExprStack::Push(int number)
{
    expr_t expr;
    expr.type = EXPR_NUM;
    expr.num = number;
    m_Stack.push(expr);
}

void CSOOLDecompExprStack::TopString(char *buffer)
{
    expr_t expr = m_Stack.top();

    if(expr.type == EXPR_STR)
    {
        strcpy(buffer, expr.str);
    }
    else if(expr.type == EXPR_NUM)
    {
        sprintf(buffer, "0x%04X", expr.num);
    }
}

ExprType CSOOLDecompExprStack::TopType(void)
{
    expr_t expr;
    expr = m_Stack.top();
    return expr.type;
}

void CSOOLDecompExprStack::PopString(char *buffer)
{
    if(m_Stack.size() == 0)
    {
        printf("POPPING EMPTY STACK\n");
        exit(0);
    }

    expr_t expr = m_Stack.top();

    if(expr.type == EXPR_STR)
    {
        strcpy(buffer, expr.str);
        free(expr.str);
        m_Stack.pop();
    }
    else if(expr.type == EXPR_NUM)
    {
        sprintf(buffer, "0x%04X", expr.num);
        m_Stack.pop();
    }
}

int CSOOLDecompExprStack::PopNumber()
{
    if(m_Stack.size() == 0)
    {
        printf("POPPING EMPTY STACK\n");
        exit(0);
    }

    expr_t expr = m_Stack.top();

    if(expr.type != EXPR_NUM)
    {
        printf("EXPECTED NUMBER EXPR\n");
        exit(0);
    }

    int value = expr.num;
    m_Stack.pop();
    return value;
}

///////////////////

void CSOOLDecompiler::DecompileMethod(uint8_t *pcmd, int methodOffs)
{
    CSOOLDecompExprStack stck;
    char expr0[256];
    char expr1[256];
    char expr2[256];

    bool bLastCmdWasStore = 0;

    int offs = 0;

    std::vector<uint16_t> targets;

    // labels pass
    while(1)
    {
        switch(pcmd[offs])
        {
        case 0x00:
        case 0x01:
        case 0x02:
            goto endpass;
        case 0x03:
        case 0x04:
            targets.push_back(IMM0(&pcmd[offs]));
            offs += 3;
            break;
        case 0x05:
        case 0x06:
        case 0x07:
        case 0x09:
            offs += 3;
            break;
        case 0x08:
        case 0x0A:
        case 0x0E:
            offs += 5;
            break;
        default:
            offs++;
            break;
        }
    }
    endpass:

    offs = 0;

    while(1)
    {
        //printf("        //%02X\n", pcmd[offs]);

        for(int i = 0; i < targets.size(); i++)
        {
            if(methodOffs + offs == targets[i])
            {
                printf("       L_%04X:\n", methodOffs + offs);
                break;
            }
        }

        if(pcmd[offs] == 0x00 || pcmd[offs] == 0x02)
        {
            //printf("        //end of method\n");
            break;
        }

        if(pcmd[offs] == 0x28 || pcmd[offs] == 0x29)
        {
            // store_var
            bLastCmdWasStore = 1;
        }
        else
        {
            if(pcmd[offs] != 0x3B)
            {
                bLastCmdWasStore = 0;
            }
        }

        //printf("L_%04X: ", methodOffs + offs);

        if(pcmd[offs] >= 0x3C && pcmd[offs] <= 0x4A)
        {
            int nargs = pcmd[offs] - 0x3C;
            int code = stck.PopNumber(); // code

            printf("        vnative%02X(", code);
            for(int i = 0; i < nargs; i++)
            {
                stck.PopString(expr0);
                if(i != 0) printf(", ");
                printf("%s", expr0);
            }
            printf(")\n");
            offs++;
            continue;
        }

        if(pcmd[offs] >= 0x50 && pcmd[offs] <= 0x5E)
        {
            int nargs = pcmd[offs] - 0x50;
            char callexpr[256];
            char *o = callexpr;
            int code = stck.PopNumber(); // code
            o += sprintf(o, "native%02X(", code);

            for(int i = 0; i < nargs; i++)
            {
                stck.PopString(expr0);
                if(i != 0) o += sprintf(o, ", ");
                o += sprintf(o, "%s", expr0);
            }

            o += sprintf(o, ")");
            stck.Push(callexpr);
            offs++;
            continue;
        }

        int varId, varId2;

        switch(pcmd[offs])
        {
            case 0x00: break; // end
            case 0x01: break; // end?
            case 0x02: break; // end
            case 0x03: // branch_cond
                stck.PopString(expr0);
                printf("        if(%s) goto L_%04X\n", expr0, IMM0(&pcmd[offs]));
                offs += 3;
                break;

            case 0x04: // branch
                printf("        goto L_%04X\n", IMM0(&pcmd[offs]));
                offs += 3;
                break;

            case 0x05:
            case 0x06:
            case 0x09: // load_imm
                stck.Push(IMM0(&pcmd[offs]));
                offs += 3;
                break;

            case 0x07: // load_imm_var
                stck.Push("var%02X", IMM0(&pcmd[offs]));
                offs += 3;
                break;

            case 0x08: // load_imm_ctx_var
                stck.Push("obj%02X.var%02X", IMM0(&pcmd[offs]), IMM1(&pcmd[offs]));
                offs += 5;
                break;

            case 0x0A: // load_imm2
                stck.Push(IMM0(&pcmd[offs]));
                stck.Push(IMM1(&pcmd[offs]));
                offs += 5;
                break;

            case 0x0B: // load_ctx_elem
                stck.PopString(expr0); // elemKey
                stck.PopString(expr1); // ctxId -- todo may need to check if its a var or a raw number
                stck.Push("obj[%s].elem[%s]", expr1, expr0);
                offs++;
                break;

            case 0x0C: // load_ctx_elem_keep_ctx
                stck.PopString(expr0);
                stck.TopString(expr1);
                stck.Push("obj[%s].elem[%s]", expr1, expr0);
                offs++;
                break;

            case 0x0D: // load_ctx_elem_var
                stck.PopString(expr0); // elemKey
                stck.PopString(expr1); // ctxId -- todo may need to check if var or raw number
                stck.Push("obj[%s].var[elem[%s]]", expr1, expr0);
                offs++;
                break;

            case 0x0F: // unk0F
                stck.PopString(expr0);
                stck.PopString(expr1);
                printf("        unk0F(%s, %s)\n", expr0, expr1);
                offs++;
                break;

            case 0x10:
                printf("        set_flag_2\n");
                offs++;
                break;

            case 0x11:
                printf("        clear_flag_2\n");
                offs++;
                break;

            case 0x12:
                stck.PopString(expr0);
                stck.Push("unk12(%s)", expr0);
                offs++;
                break;

            case 0x13:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("unk13(%s, %s)", expr0, expr1);
                offs++;
                break;

            case 0x14:
                stck.PopString(expr0);
                stck.Push("((%s) <= 0)", expr0);
                offs++;
                break;

            case 0x15:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s == %s)", expr0, expr1);
                offs++;
                break;

            case 0x16:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s != %s)", expr0, expr1);
                offs++;
                break;

            case 0x17:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s && %s)", expr0, expr1);
                offs++;
                break;

            case 0x18:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s || %s)", expr0, expr1);
                offs++;
                break;

            case 0x19:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s - %s)", expr1, expr0);
                offs++;
                break;

            case 0x1A:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s + %s)", expr1, expr0);
                offs++;
                break;

            case 0x1B:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s %% %s)", expr1, expr0);
                offs++;
                break;

            case 0x1C:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s * %s)", expr1, expr0);
                offs++;
                break;

            case 0x1D:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s / %s)", expr1, expr0);
                offs++;
                break;

            case 0x1E:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s < %s)", expr1, expr0);
                offs++;
                break;

            case 0x1F:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s > %s)", expr1, expr0);
                offs++;
                break;

            case 0x20:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s <= %s)", expr1, expr0);
                offs++;
                break;

            case 0x21:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s >= %s)", expr1, expr0);
                offs++;
                break;

            case 0x22:
                stck.PopString(expr0);
                stck.Push("-(%s)", expr0);
                offs++;
                break;

            case 0x23:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s & %s)", expr1, expr0);
                offs++;
                break;

            case 0x24:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s | %s)", expr1, expr0);
                offs++;
                break;

            case 0x25:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s << %s)", expr1, expr0);
                offs++;
                break;

            case 0x26:
                stck.PopString(expr0);
                stck.PopString(expr1);
                stck.Push("(%s >> %s)", expr1, expr0);
                offs++;
                break;

            case 0x28:
                varId = stck.PopNumber(); // var
                stck.TopString(expr1); // value
                printf("        var%02X = %s\n", varId, expr1);
                offs++;
                break;

            case 0x29:
                varId = stck.PopNumber(); // var
                stck.TopString(expr1); // ctx
                stck.TopString(expr2); // value
                printf("        %s.var%02X = %s\n", varId, expr0, expr2);
                offs++;
                break;

            case 0x2A:
                varId = stck.PopNumber(); // var
                printf("        var%02X++\n", varId);
                offs++;
                break;

            case 0x2B:
                varId = stck.PopNumber(); // var
                stck.PopString(expr1); // ctx
                printf("        %s.var%02X++\n", varId, expr0);
                offs++;
                break;

            case 0x2C:
                varId = stck.PopNumber(); // var
                printf("        var%02X--\n", varId);
                offs++;
                break;

            case 0x2D:
                varId = stck.PopNumber(); // var
                stck.PopString(expr1); // ctx
                printf("        %s.var[%s]--\n", expr1, expr0);
                offs++;
                break;

            case 0x2E:
                varId = stck.PopNumber();
                varId2 = stck.PopNumber();
                printf("        var%02X = var%02X\n", varId2, varId);
                offs++;
                break;

            case 0x2F:
                stck.PopString(expr0); // varoffset
                stck.PopString(expr1); // ctxId
                stck.PopString(expr2); // value
                printf("        %s.var[%s] += %s\n", expr1, expr0, expr2);
                offs++;
                break;

            case 0x30:
                stck.PopString(expr0); // varoffset
                stck.PopString(expr1); // value
                printf("        var[%s] -= %s\n", expr0, expr1);
                offs++;
                break;

            case 0x31:
                stck.PopString(expr0); // varoffset
                stck.PopString(expr1); // ctxId
                stck.PopString(expr2); // value
                printf("        %s.var[%s] -= %s\n", expr1, expr0, expr2);
                offs++;
                break;

            case 0x32:
                printf("        clear_flag_3\n");
                offs++;
                break;

            case 0x34:
                printf("        set_flag_0_clear_flag_3\n");
                offs++;
                break;

            case 0x35:
                stck.PopString(expr0);
                printf("        clear_ctx_flags_0_1(%s)\n", expr0);
                offs++;
                break;

            case 0x36:
                stck.PopString(expr0);
                printf("        set_ctx_flag_1(%s)\n", expr0);
                offs++;
                break;

            case 0x37:
                stck.PopString(expr0);
                printf("        clear_flag_3_unk_cond(%s)\n", expr0);
                offs++;
                break;

            case 0x38:
                stck.PopString(expr0); // ctx
                stck.PopString(expr1); // value
                printf("        clear_ctx_flag_3_unk_cond(%s, %s)\n", expr0, expr1);
                offs++;
                break;

            case 0x39:
                varId = stck.PopNumber(); // method id
                printf("        meth%02X()\n", varId);
                offs++;
                break;

            case 0x3A:
                stck.PopString(expr0); // ctxid
                stck.PopString(expr1); // method id
                printf("        obj[%s].meth[%s]()\n", expr0, expr1);
                offs++;
                break;

            case 0x3B:
                stck.PopString(expr0);
                if(!bLastCmdWasStore)
                {
                    printf("        %s // pop_nop\n", expr0);
                }
                offs++;
                break;

            default:
                printf("        unknown command %02x\n", pcmd[offs]);
                return;
        }
    }
}

//////////////////////

/*
int main(int argc, const char *argv[])
{
    CSOOLFile sool;
    sool.Open("newfile.bin");
    //sool.ParseTest();
    sool.Disassemble();
}*/