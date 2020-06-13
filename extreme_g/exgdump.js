/*
Extreme-G (U) ROM decompressor

Usage:

    node exgdump.js <rom_path> <dump_dir_path>

*/

const fs = require('fs');
const lzss = require('./js/lzss.js');
const lzhuf = require('./js/lzhuf.js');

const EXG_NUM_LEVELS = 18;

const EXG_LEVEL_TABLE_ADDR = 0x00001408;
const EXG_LZSS_BANK0_ADDR  = 0x000014A0;
const EXG_LZSS_BANK1_ADDR  = 0x007A2DF0;

const EXG_LZSS_MAGIC = 0x4C5A5353;

function padleft(str, len, chr)
{
    for(; str.length < len; str = chr + str);
    return str;
}

function padright(str, len, chr)
{
    for(; str.length < len; str = str + chr);
    return str;
}

function hex(num, len)
{
    return padleft(num.toString(16).toUpperCase(), len || 8, '0');
}

function dumpLzssBank(dvRom, bankAddr, dirPath)
{
    makedir(dirPath);

    console.log("dumping lzss bank " + hex(bankAddr) + " ...\n");

    var numFiles = dvRom.getUint32(bankAddr + 0x00);
    
    for(var i = 0; i < numFiles; i++)
    {
        var entryAddr = bankAddr + 0x08 + (i*16);
        var offset  = dvRom.getUint32(entryAddr + 0x00);
        var magic   = dvRom.getUint32(entryAddr + 0x04);
        var dstSize = dvRom.getUint32(entryAddr + 0x08);
        var srcSize = dvRom.getUint32(entryAddr + 0x0C);

        var srcAddr = bankAddr + offset;

        console.log("    src: " + hex(srcAddr) + " srcSize: " + hex(srcSize) + " dstSize: " + hex(dstSize));

        var dvSrc = new DataView(dvRom.buffer, srcAddr);
        var dvDst = new DataView(new ArrayBuffer(dstSize));
        lzss.decode(dvSrc, dvDst, dstSize);

        var name = padleft(srcAddr.toString(16).toUpperCase(), 8, "0") + ".bin";
        fs.writeFileSync(dirPath + "/" + name, Buffer.from(dvDst.buffer));
    }

    console.log("");
}

function lzhuf_load(dvRom, romAddress, dstSize)
{
    var dvSrc = new DataView(dvRom.buffer, romAddress);
    var dvDst = new DataView(new ArrayBuffer(dstSize));
    lzhuf.decode(dvSrc, dvDst, dstSize);
    return dvDst;
}

function dumpLevels(dvRom, levelTableAddr, dirPath)
{
    makedir(dirPath);
    console.log("dumping level data ...\n")

    for(var i = 0; i < EXG_NUM_LEVELS; i++)
    {
        var infoAddr = dvRom.getUint32(levelTableAddr + i*4);
        var info = new LevelInfo(dvRom, infoAddr);

        var levelName = "level_" + hex(i,2);
        var levelDirPath = dirPath + "/" + levelName;
        var lvPref = levelName + ".";

        console.log("    " + levelName + "\n");

        makedir(levelDirPath);

        function _dumpLevelFile(name, offsFileInfo)
        {
            var fileAddr = infoAddr + dvRom.getUint32(infoAddr + offsFileInfo);
            var dstSize = dvRom.getUint32(infoAddr + offsFileInfo + 0x04);
            if(offsFileInfo == 0x0C) { dstSize *= 12; } // oh well

            var data = lzhuf_load(dvRom, fileAddr, dstSize);
            var srcSize = lzhuf.numBytesRead;
            var fileName = lvPref + name + "." + hex(fileAddr);
            
            fs.writeFileSync(levelDirPath + "/" + fileName + ".bin", Buffer.from(data.buffer));

            console.log("      " + padright(name, 5, " ") + " ",
                "src: " + hex(fileAddr),
                "srcSize: " + hex(srcSize),
                "dstSize: " + hex(dstSize));
        }

        _dumpLevelFile("texmeta", 0x0C);
        _dumpLevelFile("textures", 0x14);
        _dumpLevelFile("unk1C", 0x1C);
        _dumpLevelFile("unk34", 0x34);

        _dumpLevelFile("gfx", 0x3C);
        console.log("");
    }
}

function dumpOtherStuff(dvRom, dirPath)
{
    makedir(dirPath);

    console.log("dumping other lzss bank 00001288 ...\n");
    var BASE = 0x00001288;
    for(var i = 0; i < 24; i++)
    {
        var entryAddr = BASE + i*16;
        var fileAddr = dvRom.getUint32(entryAddr + 0x00);
        var srcSize = dvRom.getUint32(entryAddr + 0x04);
        var dstSize = dvRom.getUint32(fileAddr);

        console.log("    " +
            "src: " + hex(fileAddr + 4),
            "srcSize: " + hex(srcSize - 4),
            "dstSize: " + hex(dstSize));

        var src = new DataView(dvRom.buffer, fileAddr + 4, srcSize - 4);
        var dst = new DataView(new ArrayBuffer(dstSize));
        lzss.decode(src, dst, dstSize);

        fs.writeFileSync(dirPath + "/" + hex(fileAddr) + ".bin", Buffer.from(dst.buffer));
    }
    console.log("");
}

function makedir(path)
{
    if(!fs.existsSync(path))
    {
        fs.mkdirSync(path);
    }
}

function dumpMisc(dvRom, addr, dumpDir, prefix)
{
    prefix = prefix || "";
    var dstSize = dvRom.getUint32(addr);
    var data = lzhuf_load(dvRom, addr+4, dstSize);
    fs.writeFileSync(dumpDir + "/" + prefix + hex(addr+4) + ".bin", Buffer.from(data.buffer));
    console.log("    src: " + hex(addr+4) + " srcSize: " + hex(lzhuf.numBytesRead) + " dstSize: " + hex(dstSize));
}

function dumpTable1450(dvRom, dumpDirPath)
{
    console.log("dumping table 00001450 ...\n");
    makedir(dumpDirPath)
    dumpMisc(dvRom, 0x000C6690, dumpDirPath, "texbank.");
    dumpMisc(dvRom, 0x000CE500, dumpDirPath, "texbank.");
    dumpMisc(dvRom, 0x000D5C40, dumpDirPath, "texbank.");
    dumpMisc(dvRom, 0x000DC550, dumpDirPath, "texbank.");
    console.log("");
}

function main()
{
    if(process.argv.length < 4)
    {
        console.log("usage: node exgdump.js <rom_path> <dump_dir_path>");
        return;
    }

    var romPath = process.argv[2];
    var dumpDirPath = process.argv[3];

    var dvRom = new DataView(fs.readFileSync(romPath).buffer);
    
    makedir(dumpDirPath);

    dumpLzssBank(dvRom, EXG_LZSS_BANK0_ADDR, dumpDirPath + "/lzssbank0");
    dumpLzssBank(dvRom, EXG_LZSS_BANK1_ADDR, dumpDirPath + "/lzssbank1");
    dumpOtherStuff(dvRom, dumpDirPath + "/lzss_1288");
    dumpTable1450(dvRom, dumpDirPath + "/table_1450");
    
    console.log("dumping miscellaneous ...\n");
    dumpMisc(dvRom, 0x000C3400, dumpDirPath, "texbank.");
    dumpMisc(dvRom, 0x0002F480, dumpDirPath);
    console.log("");

    dumpLevels(dvRom, EXG_LEVEL_TABLE_ADDR, dumpDirPath + "/leveldata");
}

main();

function LevelInfo(dv, offset)
{
    this.offsTransformations = dv.getUint32(offset + 0x00);
    this.numTransformations = dv.getUint32(offset + 0x04);

    this.offsTexMeta = dv.getUint32(offset + 0x0C);
    this.numTexMetaEntries = dv.getUint32(offset + 0x10); // dstSize is this * 12

    this.offsTextures = dv.getUint32(offset + 0x14);
    this.sizeTextures = dv.getUint32(offset + 0x18);

    this.offsUnk1C = dv.getUint32(offset + 0x1C);
    this.sizeUnk1C = dv.getUint32(offset + 0x20);

    this.offsUnk34 = dv.getUint32(offset + 0x34);
    this.sizeUnk34 = dv.getUint32(offset + 0x38);

    this.offsGfx = dv.getUint32(offset + 0x3C);
    this.gfxSize = dv.getUint32(offset + 0x40);
}