#include <stdio.h>
#include <stdint.h>
#include <string.h>

#include "SOOLFile.h"
#include "SOOLDecompiler.h"
#include "SOOLDisassembler.h"

bool CSOOLFile::Open(const char *path)
{
    m_FP = fopen(path, "rb");
    if(m_FP == NULL)
    {
        return false;
    }

    fseek(m_FP, 0, SEEK_END);
    m_Size = ftell(m_FP);
    m_Buffer = new uint8_t[m_Size];

    rewind(m_FP);
    fread(m_Buffer, 1, m_Size, m_FP);

    return true;
}

void CSOOLFile::GetHeader(SOOLFileHdr *hdr)
{
    memcpy(hdr->signature, &m_Buffer[0x00], 4);
    hdr->size = GetU32(0x04);
    hdr->numSections = GetU16(0x08);
    hdr->_padding = GetU16(0x0A);
}

size_t CSOOLFile::GetSectionOffset(int sectionNum)
{
    size_t offsSectionArray = 0x00 + sizeof(SOOLFileHdr);
    return GetU32(offsSectionArray + sectionNum * sizeof(uint32_t));
}

CSOOLSctn CSOOLFile::GetSection(int sectionNum)
{
    return CSOOLSctn(this, sectionNum);
}

void CSOOLFile::Decompile()
{
    SOOLFileHdr hdr;
    GetHeader(&hdr);

    for(int i = 0; i < hdr.numSections; i++)
    {
        CSOOLSctn sctn = GetSection(i);
        sctn.Decompile();
    }
}

void CSOOLFile::Disassemble()
{
    SOOLFileHdr hdr;
    GetHeader(&hdr);

    printf(".n64\n");
    printf(".create \"test.sool.bin\", 0\n");
    printf(".include \"sooldefs.asm\"\n\n");
    printf("Header\n");
    for(int i = 0; i < hdr.numSections; i++)
    {
        printf("    SectionRef sec%02X\n", i);
    }
    printf("EndHeader\n\n");

    for(int i = 0; i < hdr.numSections; i++)
    {
        CSOOLSctn sctn = GetSection(i);
        sctn.Disassemble();
    }

    printf("EndSool\n");
    printf(".close\n");
}

/////////////////////////

CSOOLSctn::CSOOLSctn(CSOOLFile *file, int sectionNum):
    m_File(file),
    m_SectionNum(sectionNum)
{
    m_SectionOffs = m_File->GetSectionOffset(sectionNum);
    m_Buffer = m_File->SubBuffer(m_SectionOffs);
}

void CSOOLSctn::GetHeader(SOOLSctnHdr *hdr)
{
    hdr->offsVars = GetU16(0x00);
    hdr->offsVarsEnd = GetU16(0x02);
    hdr->offsElements = GetU16(0x04);
    hdr->numElements = GetU16(0x06);
    hdr->unk08 = GetU16(0x08);
    hdr->numPublicMethods = GetU16(0x0A);
    hdr->offsMethodsEnd = GetU16(0x0C);
    hdr->numMethods = GetU16(0x0E);
}

void CSOOLSctn::Decompile()
{
    SOOLSctnHdr hdr;
    GetHeader(&hdr);

    printf("interactor obj%02X\n{\n", m_SectionNum);

    //printf("    /* Variables */\n");
    for(int varOffset = hdr.offsVars; varOffset < hdr.offsVarsEnd; varOffset += sizeof(uint16_t))
    {
        printf("    var%02X = 0x%04X\n", varOffset, GetU16(varOffset));
    }
    printf("\n");

    //printf("    /* Elements */\n");
    for(int nElem = 0; nElem < hdr.numElements; nElem++)
    {
        uint16_t elemKey = GetU16(hdr.offsElements + (nElem * 4)); // GetElement(SOOLElem*)
        uint16_t elemValue = GetU16(hdr.offsElements + (nElem * 4) + 2);
        printf("    elem[0x%04X] = 0x%04X\n", elemKey, elemValue);
    }
    printf("\n");

    //printf("    /* Methods */\n");
    for(int nMethod = 0; nMethod < hdr.numMethods; nMethod++)
    {
        uint16_t methodOffs = GetU16(0x10 + nMethod * 2); // GetMethodOffs
        uint8_t *cmdptr = SubBuffer(methodOffs);

        printf("    method meth%02X\n    {\n", nMethod);

        CSOOLDecompiler::DecompileMethod(cmdptr, methodOffs);

        printf("    }\n\n");
    }

    printf("}\n\n");
}

void CSOOLSctn::Disassemble(void)
{
    SOOLSctnHdr hdr;
    GetHeader(&hdr);

    printf("Section sec%02X", m_SectionNum);

    // check for entry method
    bool bHaveEntryMethod = false;

    for(int nMethod = 0; nMethod < hdr.numMethods; nMethod++)
    {
        uint16_t methodOffs = GetU16(0x10 + nMethod * 2);
        if(methodOffs == hdr.numPublicMethods)
        {
            bHaveEntryMethod = true;
            printf(", method%02X", nMethod);
            break;
        }
    }

    if(!bHaveEntryMethod)
    {
        printf(", 0x%04X", hdr.numPublicMethods);
    }
    printf("\n");

    // Method refs
    printf("    MethodRefs\n");
    for(int i = 0; i < hdr.numMethods; i++)
    {
        printf("        MethodRef @@method%02X\n", i);
    }
    printf("    EndMethodRefs\n\n");

    // Var definitions
    printf("    Vars\n");
    for(int offsVar = hdr.offsVars; offsVar < hdr.offsVarsEnd; offsVar += sizeof(uint16_t))
    {
        printf("        Var @@var%02X, 0x%04X\n", (offsVar-hdr.offsVars)/sizeof(uint16_t), GetU16(offsVar));
    }
    printf("    EndVars\n\n");

    // Methods
    printf("    Methods\n");
    for(int i = 0; i < hdr.numMethods; i++)
    {
        printf("        Method @@method%02X\n", i);
        uint16_t methodOffs = GetU16(0x10 + i * 2); // GetMethodOffs
        uint16_t methodEndOffs;

        if(i == hdr.numMethods - 1)
        {
            methodEndOffs = hdr.offsMethodsEnd;
        }
        else
        {
            methodEndOffs = GetU16(0x10 + (i+1) * 2);
        }

        uint8_t *commands = SubBuffer(methodOffs);

        CSOOLDisassembler::DisassembleMethod(commands, methodOffs, methodEndOffs, hdr.offsVars);
    }
    printf("    EndMethods\n");
    if((hdr.offsMethodsEnd % 2) != 0)
    {
        printf("    .db 0x%02X // garbage padding byte\n", GetU8(hdr.offsMethodsEnd));
    }
    printf("\n");

    // Elements
    printf("    Elements\n");
    for(int nElem = 0; nElem < hdr.numElements; nElem++)
    {
        uint16_t elemKey = GetU16(hdr.offsElements + (nElem * 4)); // GetElement(SOOLElem*)
        uint16_t elemValue = GetU16(hdr.offsElements + (nElem * 4) + 2);
        printf("        Element 0x%04X, 0x%04X\n", elemKey, elemValue);
    }
    printf("    EndElements\n");

    printf("EndSection\n\n");
}