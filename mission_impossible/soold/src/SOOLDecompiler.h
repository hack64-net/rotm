#ifndef SOOLDECOMPILER_H
#define SOOLDECOMPILER_H

#include <stdint.h>
#include <stack>

enum ExprType
{
    EXPR_NUM,
    EXPR_STR
};

typedef struct
{
    ExprType type;
    union {
        int   num;
        char *str;
    };
} expr_t;

class CSOOLDecompExprStack
{
private:
    std::stack<expr_t> m_Stack;

public:
    void Push(const char *format, ...);
    void Push(int value);
    ExprType TopType(void);
    void TopString(char *buffer);
    void PopString(char *buffer);
    int  PopNumber();
};

class CSOOLDecompiler
{
public:
    static void DecompileMethod(uint8_t *commands, int methodOffs);
};

#endif // SOOLDECOMPILER_H
