const fs = require('fs');
const zlib = require('zlib');

Number.prototype.hex = function(len)
{
    len = len || 8;
    var s = this.toString(16);
    while(s.length < len) s = "0" + s;
    return s.toUpperCase();
}

var data = fs.readFileSync('sr64.z64');
var dv = new DataView(data.buffer);

for(var i = 0; i < data.byteLength; i += 2)
{
    if(dv.getUint16(i) == 0x78DA)
    {
        var zlibData = new DataView(data.buffer, i);
        try
        {
            var test = zlib.inflateSync(zlibData);
            fs.writeFileSync("dump/" + i.hex() + ".bin", test);
            console.log(i.hex());
        }
        catch(e)
        {
            
        }
    }
}