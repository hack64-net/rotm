const lzhuf2 = {}; /* decompressor for Micro Machines 64 Turbo */
if (typeof module != 'undefined') module.exports = lzhuf2;

(function(lzhuf2) {

const WINDOW_SIZE = 0x5900;
var gWindow = new Uint8Array(WINDOW_SIZE);
var gWndWriteOffset = 0;

const gFineOffsetBitWidths = [ 0x0004, 0x0006, 0x0008, 0x000A, 0x000C, 0x000E ];
const gCoarseOffsets = [ 0x0000, 0x0010, 0x0050, 0x0150, 0x0550, 0x1550 ];

var gLSons = new Array(0x275);
var gRSons = new Array(0x275);
var gPrnts = new Array(0x275 * 2);
var gFreqs = new Array(0x275 * 2);

var gNumBits;
var gCurBits;

var gSrc;
var gDst;
var gSrcOffset;
var gDstOffset;

lzhuf2.decode = function(dst, src)
{
    gNumBits = 0;
    gCurBits = 0;
    gSrcOffset = 0;
    gDstOffset = 0;
    gWndWriteOffset = 0;

    gSrc = src;
    gDst = dst;

    initTree();

    var code;
    while((code = getCode()) != 0x100)
    {
        if(code < 0x100)
        {
            writeByte(code);
        }
        else
        {
            var idx = ((code - 0x101) / 0x3E) | 0;
            var length = code - (idx * 0x3E + 0xFE);
            var offset = gCoarseOffsets[idx] + getBits(gFineOffsetBitWidths[idx]) + length;
            var wndReadOffset = gWndWriteOffset - offset;

            if(wndReadOffset < 0)
            {
                wndReadOffset = wndReadOffset + WINDOW_SIZE;
            }

            while(length--)
            {
                var byte = gWindow[wndReadOffset++];
                wndReadOffset = wndReadOffset % WINDOW_SIZE;
                writeByte(byte);
            }
        }
    }

    return gDstOffset;
}

lzhuf2.calcSize = function(src)
{
    gNumBits = 0;
    gCurBits = 0;
    gSrcOffset = 0;
    gDstOffset = 0;
    gSrc = src;
    initTree();

    var code;
    while((code = getCode()) != 0x100)
    {
        if(code < 0x100)
        {
            gDstOffset++;
        }
        else
        {
            var idx = ((code - 0x101) / 0x3E) | 0;
            var length = code - (idx * 0x3E + 0xFE);
            getBits(gFineOffsetBitWidths[idx]);
            gDstOffset += length;
        }
    }

    return { srcSize: gSrcOffset, dstSize: gDstOffset };
}

function writeByte(byte)
{
    gWindow[gWndWriteOffset++] = byte;
    gWndWriteOffset = gWndWriteOffset % WINDOW_SIZE;
    gDst.setUint8(gDstOffset++, byte);
}

function initTree()
{
    var j = 2;
    for(var i = 1; i <= 0x274; i++)
    {
        gPrnts[j+0] = i;
        gPrnts[j+1] = i;
        gFreqs[j+0] = 1;
        gFreqs[j+1] = 1;
        gLSons[i] = j;
        gRSons[i] = j + 1;
        j += 2;
    }

    gLSons[0] = 0;
    gRSons[0] = 0;
    gPrnts[0] = 0;
    gPrnts[1] = 0;
    gFreqs[0] = 0;
    gFreqs[1] = 0;
}

function getBit()
{
    if(gNumBits == 0)
    {
        gCurBits = gSrc.getUint8(gSrcOffset++);
        gNumBits = 8;
    }
    
    var bit = gCurBits >> 7;
    gCurBits = (gCurBits << 1) & 0xFF;
    gNumBits--;
    return bit;
}

function getBits(numBits)
{
    var bits = 0;

    for(var sft = 0; sft < numBits; sft++)
    {
        bits |= getBit() << sft;
    }

    return bits;
}

function getCode()
{
    var idx = 1;

    while(idx < 0x275)
    {
        idx = getBit() ? gRSons[idx] : gLSons[idx];
    }

    var code = idx - 0x275;
    update(code);
    return code;
}


function update(a0)
{
    var s2 = a0 + 0x275;

    gFreqs[s2]++;
    
    var s1 = gPrnts[s2];

    if(s1 == 1)
    {
        return;
    }

    var a1;

    if(gLSons[s1] == s2)
    {
        a1 = gRSons[s1];
    }
    else
    {
        a1 = gLSons[s1];
    }

    reconstruct(s2, a1)

    do
    {
        var a2 = gPrnts[s1];

        if(gLSons[a2] == s1)
        {
            s0 = gRSons[a2];
        }
        else
        {
            s0 = gLSons[a2];
        }

        if(gFreqs[s0] < gFreqs[s2])
        {
            if(gLSons[a2] == s1)
            {
                gRSons[a2] = s2;
            }
            else
            {
                gLSons[a2] = s2;
            }

            if(gLSons[s1] == s2)
            {
                gLSons[s1] = s0;
                a1 = gRSons[s1];
            }
            else
            {
                gRSons[s1] = s0;
                a1 = gLSons[s1];
            }

            gPrnts[s0] = s1;
            gPrnts[s2] = a2;

            reconstruct(s0, a1)
            s2 = s0;
        }

        s2 = gPrnts[s2];
        s1 = gPrnts[s2];
    } while(s1 != 1);
}

function reconstruct(a, b)
{
    do {
        gFreqs[gPrnts[a]] = gFreqs[a] + gFreqs[b];

        a = gPrnts[a];
        
        if(a != 1)
        {
            if(gLSons[gPrnts[a]] == a)
            {
                b = gRSons[gPrnts[a]];
            }
            else
            {
                b = gLSons[gPrnts[a]];
            }
        }
    } while(a != 1);

    if(gFreqs[1] == 0x7D0)
    {
        for(var i = 1; i < 0x4EA; i++)
        {
            gFreqs[i] = (gFreqs[i] / 2) | 0;
        }
    }
}

})(lzhuf2);
