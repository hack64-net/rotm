# RNXProPack v1.0

This tool can be used to compress and decompress data using Acclaim's RNC extension called "RNX". [It uses the original RNCProPack program created by Rob Northen Computing](http://aminet.net/package/util/pack/RNC_ProPack). I made this tool to help reverse engineer the game "Shadow Man" for the Nintendo 64. 

## Dependencies

I used Python v3.8.1 when writing the tool, but I think any python version past v3.3 should be fine.

[DOSBox](https://www.dosbox.com/download.php?main=1) is required to run the `ppibm.exe` program.
You won't have to change your existing dosbox config settings, since there is a config file in the repository that will be used.
I used DOSBox v0.74-3 when writing this tool.

Currently this tool only works on the Windows OS (only tested on Windows 10). If you *really* need a linux version, please let me know ([DavidSM64 on GitHub](https://github.com/DavidSM64) or [@Davideesk on Twitter](https://twitter.com/Davideesk)) and I'll try to come up with something.

## Usage

Packing a data file:
`py RNXProPack.py p [-ShadowManMode] <in_file> [out_file]`

Unpacking a data file:
`py RNXProPack.py u [-ShadowManMode] <in_file> [out_file]`

If no `out_file` is specified, then the input file will be overwritten with the packed/unpacked data.

The `-ShadowManMode` argument is only required if you are using this tool with the game "Shadow Man"

For whatever reason, the RNX/RNC header in "Shadow Man" is slightly different. Instead of 2 16-bit checksums for both the compressed and uncompressed data, the developers used a single 32-bit checksum for the uncompressed data only.

Because of this quirk, this tool also generate a `.crcs` file when in Shadow Man mode. You only need this file if you want to unpack the compressed data later.