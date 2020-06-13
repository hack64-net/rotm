// common lzss decoder

const lzss = {};
if(typeof module != 'undefined') module.exports = lzss;

lzss.decode = function(src, dst, dstSize)
{
    var windowBuf = new Uint8Array(0x1000);

    var srcOffset = 0;
    var dstOffset = 0;
    var windowIdx = 0x0FEE;
    var flags = 0;
    
    while(dstOffset < dstSize)
    {
        flags >>= 1;

        if((flags & 0x0100) == 0)
        {
            flags = 0xFF00 | src.getUint8(srcOffset++);
        }

        if(flags & 0x0001)
        {
            var value = src.getUint8(srcOffset++);
            dst.setUint8(dstOffset++, value)
            windowBuf[windowIdx++] = value;
            windowIdx &= 0x0FFF;
        }
        else
        {
            var pairhi = src.getUint8(srcOffset++);
            var pairlo = src.getUint8(srcOffset++);

            var offset = pairhi | ((pairlo & 0x00F0) << 4);
            var length = (pairlo & 0x000F) + 3;

            for(var i = 0; i < length; i++)
            {
                var value = windowBuf[(offset + i) & 0x0FFF];
                dst.setUint8(dstOffset++, value);
                windowBuf[windowIdx++] = value;
                windowIdx &= 0x0FFF;
            }
        }
    }

    return dstOffset;
}
