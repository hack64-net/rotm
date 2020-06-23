const fs = require('fs');
const lzhuf2 = require('./js/lzhuf2.js');

const raLevelTable = 0x0006F690;
const NUM_LEVELS = 7;

// hardcoded in func_800413E0
var endPositions = [
    0x05076EE0,
    0x06043100,
    0x0709B380,
    0x080A96A0,
    0x0906FD60,
    0x0A08C010,
    0x0D078780
];

function main()
{
    if(process.argv.length < 4)
    {
        console.log('node mm64t_dump.js <rom_path> <dump_dir_path>');
        return;
    }

    var romPath = process.argv[2];
    var dumpDirPath = process.argv[3];

    makedir(dumpDirPath);

    var dvRom = new DataView(fs.readFileSync(romPath).buffer);

    for(var i = 0; i < NUM_LEVELS; i++)
    {
        var level = loadLevel(dvRom, i);
        var levelName = "level_" + hex(i, 2);
        var levelDirPath = dumpDirPath + '/' + levelName;
        var defsDirPath = levelDirPath + '/defs'; 
        makedir(levelDirPath);
        makedir(defsDirPath);

        var pathPref = levelDirPath + "/" + levelName + "_";
        var pathPrefDefs = defsDirPath + "/" + levelName + "_";

        dumpdv(pathPref + '00_' + hex(level.raFile0) + '.bin', level.dvFile0);
        dumpdv(pathPref + 'ci_' + hex(level.raFile1) + '.bin', level.dvFile1);
        dumpdv(pathPref + 'tlut_' + hex(level.raFile2) + '.bin', level.dvFile2);
        dumpdv(pathPref + 'dlists_' + hex(level.raFile3) + '.bin', level.dvFile3);

        for(var j = 0; j < level.otherFiles.length; j++)
        {
            var file = level.otherFiles[j];
            dumpdv(pathPrefDefs + 'defs_' + hex(j,2) + '_' + hex(file.ra) + '.bin', file.dv)
        }

        dumpjson(pathPref + 'texmeta.json', level.textureMeta);
        dumpjson(pathPref + 'dlmeta.json', level.dlistPtrs);
    }
}

function loadLevel(dvRom, levelIdx)
{
    var raEntry = raLevelTable + levelIdx * 12;
    var raStart = dvRom.getUint32(raEntry + 0x00) & 0x00FFFFFF;

    var stream = new DVStream(dvRom, raStart);

    var level = {
        numDLists: 0,
        dlistPtrs: [],
        positions: [],
        numToggle: 0,
        toggle: [],
        dvFile0: null,
        numTextures: 0,
        numUnk: 0,
        textureMeta: [],
        dvFile1: null,
        dvFile2: null,
        dvFile3: null,
        raFile0: 0,
        raFile1: 0,
        raFile2: 0,
        raFile3: 0,
        numOtherFiles: 0,
        otherFiles: [],
    };

    level.numDLists = stream.readU32();
    for(var i = 0; i < level.numDLists; i++)
    {
        var dlistPtr = stream.readU32();
        level.dlistPtrs.push(dlistPtr);
    }

    for(var i = 0; i < level.numDLists; i++)
    {
        var x = stream.readF32();
        var y = stream.readF32();
        level.positions.push({x: x, y: y});
    }

    stream.align16();

    level.numToggle = stream.readU32();
    for(var i = 0; i < level.numToggle; i++)
    {
        var s = stream.readU8();
        level.toggle.push(s);
    }

    stream.align16();

    level.raFile0 = stream.offset;
    level.dvFile0 = stream.decompress();
    stream.align16();

    level.numTextures = stream.readU32();
    level.numUnk = stream.readU32();

    for(var i = 0; i < level.numTextures; i++)
    {
        var ciOffset = stream.readU32();
        var tlutOffset = stream.readU32();
        var width = stream.readU16();
        var height = stream.readU16();
        level.textureMeta.push({ciOffset: ciOffset, tlutOffset: tlutOffset, width: width, height: height});
    }

    stream.align16();

    level.raFile1 = stream.offset;
    level.dvFile1 = stream.decompress();
    stream.align16();

    level.raFile2 = stream.offset;
    level.dvFile2 = stream.decompress();
    stream.align16();

    level.raFile3 = stream.offset;
    var file3Size = raStart + (endPositions[levelIdx] & 0x00FFFFFF) - stream.offset;
    level.dvFile3 = stream.getdv(file3Size);
    stream.align16();

    level.numOtherFiles = stream.readU32();
    for(var i = 0; i < level.numOtherFiles; i++)
    {
        // redundant src size values of the files, ignore
        stream.readU32(); 
    }
    stream.align16();

    for(var i = 0; i < level.numOtherFiles; i++)
    {
        var raFile = stream.offset;
        var dvFile = stream.decompress();
        level.otherFiles.push({ra: raFile, dv: dvFile});
        stream.align16();
    }

    return level;
}

function makedir(path)
{
    if(!fs.existsSync(path))
    {
        fs.mkdirSync(path);
    }
}

function dumpjson(path, object)
{
    function replacer(key, value)
    {
        if(typeof value == 'number')
        {
            var len = value > 0xFFFF ? 8 : 4;
            return hex(value, len);
        }
        return value;
    }

    var json = JSON.stringify(object, replacer, 2);
    fs.writeFileSync(path, json);
}

function dumpdv(path, dv)
{
    fs.writeFileSync(path, Buffer.from(dv.buffer, dv.byteOffset, dv.byteLength));
}

function hex(n, len)
{
    len = len || 8;
    var s = n.toString(16).toUpperCase();
    while(s.length < len) s = "0" + s;
    return s;
}

function DVStream(dv, offset)
{
    this.dv = dv;
    this.offset = offset;
}

DVStream.prototype.readU32 = function()
{
    var value = this.dv.getUint32(this.offset);
    this.offset += 4;
    return value;
}

DVStream.prototype.readF32 = function()
{
    var value = this.dv.getFloat32(this.offset);
    this.offset += 4;
    return value;
}

DVStream.prototype.readU8 = function()
{
    var value = this.dv.getUint8(this.offset++);
    return value;
}

DVStream.prototype.readU16 = function()
{
    var value = this.dv.getUint16(this.offset);
    this.offset += 2;
    return value;
}

DVStream.prototype.skip = function(n)
{
    this.offset += n;
}

DVStream.prototype.align16 = function()
{
    this.offset = (this.offset + 0x0F) & 0xFFFFFFF0;
}

DVStream.prototype.getdv = function(size)
{
    var dv = new DataView(this.dv.buffer, this.offset, size);
    this.skip(size);
    return dv;
}

DVStream.prototype.decompress = function()
{
    var srcSize = this.readU32();
    var dvSrc = this.getdv(srcSize);
    var dstSize = lzhuf2.calcSize(dvSrc).dstSize;
    var dvDst = new DataView(new ArrayBuffer(dstSize));
    lzhuf2.decode(dvDst, dvSrc);
    return dvDst;
}

main();