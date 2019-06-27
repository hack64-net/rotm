#include <stdint.h>
#include "BigEndianBuffer.h"

#define BSWAP32(v) ((((v) & 0x000000FF) << 24) | \
                    (((v) & 0x0000FF00) <<  8) | \
                    (((v) & 0x00FF0000) >>  8) | \
                    (((v) & 0xFF000000) >> 24))

#define BSWAP16(v) ((((v) & 0x00FF) << 8) | \
                    (((v) & 0xFF00) >> 8))

uint8_t CBigEndianBuffer::GetU8(size_t offs)
{
    return m_Buffer[offs];
}

uint16_t CBigEndianBuffer::GetU16(size_t offs)
{
    return BSWAP16(*(uint16_t*)&m_Buffer[offs]);
}

uint32_t CBigEndianBuffer::GetU32(size_t offs)
{
    return BSWAP32(*(uint32_t*)&m_Buffer[offs]);
}

uint8_t *CBigEndianBuffer::SubBuffer(size_t offs)
{
    return &m_Buffer[offs];
}