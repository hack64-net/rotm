# RNXExtract v1.1

This is a simple python tool to decompress and extract all the huffman-encoded RNC & RNX blocks within a Forsaken64 ROM file. Note that this tool only supports the huffman encoding method, since the prefix method doesn't seem to be used within forsaken 64.

## Usage

`py RNXExtract.py <ROM_File>`

This will extract all the data into a generated directory `/out/`. You should get 493 files inside the directory.

## Changelog

### Version 1.1

* Added support for "RAW!" tags. They are used in the game N64 "Shadow Man". Using RNXExtract with that game should produce 3,573 files.
