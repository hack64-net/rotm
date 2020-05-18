const fs = require('fs');

if(process.argv.length < 4)
{
    console.log("usage: node hhdecode.js <rom> <dump_dir>");
    process.exit(1);
}

const ROM_PATH = process.argv[2];
const DUMP_DIR = process.argv[3];

const ADDR_FILES = 0x39BF0;
const NUM_FILES = 625;

var rom = new DataView(fs.readFileSync(ROM_PATH).buffer);

if(!fs.existsSync(DUMP_DIR))
{
    fs.mkdirSync(DUMP_DIR);
}

Number.prototype.hex = function(n)
{
    var s = this.toString(16).toUpperCase();
    while(s.length < (n || 8)) s = "0" + s;
    return s;
}

for(var i = 0; i < NUM_FILES; i++)
{
    var value = rom.getUint32(ADDR_FILES + i * 4);
    var fileAddr = value & 0xFFFFFF;
    //var flag = (value >>> 24).toString(16);

    var size = rom.getUint32(fileAddr);

    if(size > 0xFFFFFF)
    {
        continue;
    }

    var src = new Uint8Array(rom.buffer.slice(fileAddr, fileAddr + size));
    var data = decompress(src);

    if(data == null)
    {
        console.log("skipped " + fileAddr.hex());
        continue;
    }

    fs.writeFileSync(DUMP_DIR + "/" + fileAddr.hex() + ".bin", data);
}

function decompress(src)
{
    var dst = [];
    var srcSize = src.byteLength;
    var srcPos = 4;
    var dstPos = 0;
    var errored = false;

    while(srcPos < srcSize)
    {
        var directive = src[srcPos++];

        if(directive <= 0x7F)
        {
            var length = 2 + (directive >> 2);
            var relOffset = src[srcPos++] + ((directive & 0x03) << 8);
            var wndPos = dstPos - relOffset;
            while(length--)
            {
                dst[dstPos++] = dst[wndPos++];
            }
        }
        else if(directive >= 0x80 && directive <= 0x9F)
        {
            var length = (directive & 0x1F);
            while(length--)
            {
                dst[dstPos++] = src[srcPos++];
            }
        }
        else if(directive >= 0xC0)
        {
            var runByte = 0;
            var length = 2 + (directive & 0x1F);

            if(directive == 0xFF)
            {
                length = 2 + src[srcPos++];
            }
            else if((directive & 0xE0) == 0xC0)
            {
                runByte = src[srcPos++];
            }

            while(length--)
            {
                dst[dstPos++] = runByte;
            }
        }
        else
        {
            console.log((srcPos-1).hex(2) + ":" + dstPos.hex(2) + " unhandled cmd " + directive.hex(2));
            return null;
        }
    }

    return new Buffer(new Uint8Array(dst));
}

