#ifndef SOOLFILE_H
#define SOOLFILE_H

#include <stdint.h>
#include <stdio.h>

#include "BigEndianBuffer.h"

class CSOOLFile;
class CSOOLSctn;

typedef struct
{
    char signature[4]; // "SOOL"
    uint32_t size;
    uint16_t numSections;
    uint16_t _padding;
} SOOLFileHdr;

class CSOOLFile : public CBigEndianBuffer
{
private:
    FILE *m_FP;
    size_t m_Size;

public:
    bool Open(const char *path);
    void GetHeader(SOOLFileHdr *hdr);
    //int GetNumSections();
    size_t GetSectionOffset(int index);
    CSOOLSctn GetSection(int index);
    void Decompile(void);
    void Disassemble(void);
};

typedef struct
{
    uint16_t offsVars;
    uint16_t offsVarsEnd;
    uint16_t offsElements;
    uint16_t numElements;
    uint16_t unk08;
    uint16_t numPublicMethods; // unconfirmed
    uint16_t offsMethodsEnd;
    uint16_t numMethods;
} SOOLSctnHdr;

class CSOOLSctn : public CBigEndianBuffer
{
private:
    CSOOLFile *m_File;
    int m_SectionNum;
    int m_SectionOffs;

public:
    CSOOLSctn(CSOOLFile *file, int sectionNum);
    void GetHeader(SOOLSctnHdr *hdr);
    void Decompile(void);
    void Disassemble(void);
};

#endif // SOOLFILE_H
