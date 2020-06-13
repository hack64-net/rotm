function LevelInfo(dv, offset)
{
    this.offsTransformations = dv.getUint32(offset + 0x00);
    this.numTransformations = dv.getUint32(offset + 0x04);

    this.offsTextureMeta = dv.getUint32(offset + 0x0C);
    this.numTextures = dv.getUint32(offset + 0x10); // dstSize is this * 12

    this.offsTextureFile = dv.getUint32(offset + 0x14);
    this.textureFileSize = dv.getUint32(offset + 0x18);

    this.offsUnk1C = dv.getUint32(offset + 0x1C);
    this.sizeUnk1C = dv.getUint32(offset + 0x20);

    this.offsTexCoordFile = dv.getUint32(offset + 0x34);
    this.texCoordFileSize = dv.getUint32(offset + 0x38);

    this.offsGfxFile = dv.getUint32(offset + 0x3C);
    this.gfxFileSize = dv.getUint32(offset + 0x40);
}
