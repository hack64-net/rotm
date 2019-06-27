#include <stdlib.h>
#include <stdio.h>

#include "SOOLFile.h"

int main(int argc, const char *argv[])
{
    const char *szSoolPath;
    CSOOLFile sool;

    if(argc < 2)
    {
        return EXIT_FAILURE;
    }

    szSoolPath = argv[1];

    sool.Open(szSoolPath);
    //sool.Disassemble();
    sool.Decompile();

    return EXIT_SUCCESS;
}