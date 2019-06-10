#include <stdint.h>
#include "raw_inflate.h"
#include "zlib.h"

int raw_inflate(uint8_t *dst, size_t dstSize, uint8_t *src, size_t srcSize)
{
    int status;
    z_stream strm;

    strm.next_in = src;
    strm.avail_in = srcSize;
    strm.next_out = dst;
    strm.avail_out = dstSize;
    strm.zalloc = Z_NULL;
    strm.zfree = Z_NULL;
    strm.opaque = NULL;

    status = inflateInit2(&strm, -15);

    if(status != Z_OK)
    {
        return 0;
    }

    while(1)
    {
        status = inflate(&strm, Z_SYNC_FLUSH);

        if(status == Z_STREAM_END)
        {
            return 1;
        }

        if(status != Z_OK)
        {
            return 0;
        }
    }
}
