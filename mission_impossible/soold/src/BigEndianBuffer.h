#ifndef BIGENDIANBUFFER_H
#define BIGENDIANBUFFER_H

#include <stdint.h>

class CBigEndianBuffer
{
protected:
    uint8_t *m_Buffer;
    
public:
    uint8_t  GetU8(size_t offs);
    uint16_t GetU16(size_t offs);
    uint32_t GetU32(size_t offs);
    uint8_t* SubBuffer(size_t offs);
};

#endif // BIGENDIANBUFFER_H
