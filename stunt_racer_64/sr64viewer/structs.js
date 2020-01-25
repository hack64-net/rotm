function MapHeader(mapdv)
{
    this.offsEnd                 = mapdv.getUint32(0x000);
    this.offsSphere              = mapdv.getUint32(0x00C)

//  this.offsCollisionFilePtrs   = mapdv.getUint32(0x048); // here for documentation purposes
    this.numCollisionFiles       = mapdv.getUint32(0x04C);
    this.offsCollisionFileGroups = mapdv.getUint32(0x050);
    this.numCollisionFileGroups  = mapdv.getUint32(0x054);
    this.offsCollisionTable      = mapdv.getUint32(0x058);
//  this.offsMeshFilePtrs        = mapdv.getUint32(0x05C)
    this.numMeshFiles            = mapdv.getUint32(0x060);
    this.offsMeshFileGroups      = mapdv.getUint32(0x064);
    this.numMeshFileGroups       = mapdv.getUint32(0x068);
    this.offsMeshTable           = mapdv.getUint32(0x06C);
    //                                             0x070 00000000
//  this.offsUnk2FilePtrs        = mapdv.getUint32(0x074);
    this.numUnk2Files            = mapdv.getUint32(0x078);
    this.offsUnk2FileGroups      = mapdv.getUint32(0x07C);
    this.numUnk2FileGroups       = mapdv.getUint32(0x080);
    //                                             0x084 00000000
    //                                             0x088 00000000
    this.offsUnk2Table           = mapdv.getUint32(0x08C);
//  this.offsPathFilePtrs0       = mapdv.getUint32(0x090);
    this.numPathFiles0           = mapdv.getUint32(0x094);
    this.offsPathFileGroups0     = mapdv.getUint32(0x098);
    this.numPathFileGroups0      = mapdv.getUint32(0x09C);
//  this.unkA0                   = mapdv.getUint32(0x0A0);
    this.offsPathTable0          = mapdv.getUint32(0x0A4);
//  this.offsPathFilePtrs1       = mapdv.getUint32(0x0A8);
    this.numPathFiles1           = mapdv.getUint32(0x0AC);
    this.offsPathFileGroups1     = mapdv.getUint32(0x0B0);
    this.numPathFileGroups1      = mapdv.getUint32(0x0B4);
//  this.unkB8                   = mapdv.getUint32(0x0B8);
    this.offsPathTable1          = mapdv.getUint32(0x0BC);
//  this.offsPathFilePtrs2       = mapdv.getUint32(0x0C0);
    this.numPathFiles2           = mapdv.getUint32(0x0C4);
    this.offsPathFileGroups2     = mapdv.getUint32(0x0C8);
    this.numPathFileGroups2      = mapdv.getUint32(0x0CC);
//  this.unkD0                   = mapdv.getUint32(0x0D0);
    this.offsPathTable2          = mapdv.getUint32(0x0D4);
//  this.offsPathFilePtrs2       = mapdv.getUint32(0x0D8);
    this.numPathFiles3           = mapdv.getUint32(0x0DC);
    this.offsPathFileGroups3     = mapdv.getUint32(0x0E0);
    this.numPathFileGroups3      = mapdv.getUint32(0x0E4);
//  this.unkE8                   = mapdv.getUint32(0x0E8);
    this.offsPathTable3          = mapdv.getUint32(0x0EC);
//  this.numUnkPathPtrs          = mapdv.getUint32(0x0F0);
    this.numUnkPathFiles         = mapdv.getUint32(0x0F4);
    this.offsUnkPathGroups       = mapdv.getUint32(0x0F8);
    this.numUnkPathGroups        = mapdv.getUint32(0x0FC);
    this.offsUnkPathTable        = mapdv.getUint32(0x100);
    //                                             0x104
    this.offsTiltLines           = mapdv.getUint32(0x108);
    this.numTiltLines            = mapdv.getUint32(0x10C);

    //this.offsDpTable           = mapdv.getUint32(0x11C); // 00024DF8
    this.offsDpTable             = mapdv.getUint32(0x12C); // 00024F7C

    this.offsSceneryObjects      = mapdv.getUint32(0x324);
    this.numSceneryObjects       = mapdv.getUint32(0x328);

    this.offsUnkGeom             = 0x334;

    this.numCoinGroups           = mapdv.getUint16(0x3B0);
    this.numSomething2           = mapdv.getUint16(0x3B4);
    this.numBoosters             = mapdv.getUint16(0x3B8);
    this.offsCoinGroups          = mapdv.getUint32(0x3C4);
    this.offsSomething2          = mapdv.getUint32(0x3C8);
    //                                        0x3CC 00000000
    this.offsBoosters            = mapdv.getUint32(0x3D0);
}

function CompressedFileHeader(dv, offset)
{
    this.srcSize = dv.getUint32(offset + 0x00);
    this.dstSize = dv.getUint32(offset + 0x04);
}
CompressedFileHeader.SIZE = 8;

function ObjectMeta(dv, offset)
{
    this.offsGeomMeta    = dv.getUint32(offset + 0x00);
    this.unk04           = dv.getUint32(offset + 0x04);
    this.unk08           = dv.getUint32(offset + 0x08);
    this.unk0C           = dv.getUint32(offset + 0x0C);
    this.offsPosition    = dv.getUint32(offset + 0x10);
    this.offsAnimHeaders = dv.getUint32(offset + 0x14);
    this.numAnimHeaders  = dv.getUint32(offset + 0x18);
    this.unk1C           = dv.getUint32(offset + 0x1C);
    this.unk20           = dv.getUint32(offset + 0x20);
    this.unk24           = dv.getUint32(offset + 0x24);
}
ObjectMeta.SIZE = 0x28;

function AnimHeader(dv, offset)
{
    this.flags00   = dv.getUint32(offset + 0x00);
    this.unk04     = dv.getUint32(offset + 0x04);
    this.unk08     = dv.getFloat32(offset + 0x08);
    this.unk0C     = dv.getFloat32(offset + 0x0C);
    this.flags10   = dv.getUint32(offset + 0x10);
    this.offsUnk14 = dv.getUint32(offset + 0x14);
    this.offsUnk18 = dv.getUint32(offset + 0x18);
    this.offsUnk1C = dv.getUint32(offset + 0x1C);
}
AnimHeader.SIZE = 0x20;

function MeshMeta(dv, offset)
{
    this.unk00        = dv.getUint32(offset + 0x00);
    this.unk04        = dv.getUint32(offset + 0x04);
    this.offsGeomMeta = dv.getUint32(offset + 0x08);
    this.meshX        = (dv.getInt32(offset + 0x0C) / 2048);
    this.meshY        = (dv.getInt32(offset + 0x10) / 2048);
    this.meshZ        = (dv.getInt32(offset + 0x14) / 2048);
    this.unk18        = dv.getUint32(offset + 0x18);
    this.unk1C        = dv.getUint32(offset + 0x1C);
    this.unk20        = dv.getUint32(offset + 0x20);
    this.unk24        = dv.getUint32(offset + 0x24);
}

function GeometryMeta(dv, offset)
{
    this.offsVertices  = dv.getUint32(offset + 0x00);
    this.numVertices   = dv.getUint32(offset + 0x04);
    this.offsFaces     = dv.getUint32(offset + 0x08);
    this.numFaces      = dv.getUint32(offset + 0x0C);
    this.offsTexCoords = dv.getUint32(offset + 0x10);
    this.numTexCoords  = dv.getUint32(offset + 0x14);
    this.offsColors    = dv.getUint32(offset + 0x18);
    this.numColors     = dv.getUint32(offset + 0x1C);
}

function Vec3s(dv, offset)
{
    this.x = dv.getInt16(offset + 0x00);
    this.y = dv.getInt16(offset + 0x02);
    this.z = dv.getInt16(offset + 0x04);
}
Vec3s.SIZE = 0x06;

function Vec3f(dv, offset)
{
    this.x = dv.getFloat32(offset + 0x00);
    this.y = dv.getFloat32(offset + 0x04);
    this.z = dv.getFloat32(offset + 0x08);
}
Vec3f.SIZE = 0x0C;

function MeshFace(dv, offset)
{
    this.unk00 = dv.getUint16(offset + 0x00);
    this.unk02 = dv.getUint16(offset + 0x02); // if((unk02 & *(u32*)(0x800A920C)) != 0) don't draw
    this.materialIndex = dv.getUint8(offset + 0x04);
    // 05, 06, 07 padding
    this.vertexIndex0   = dv.getInt16(offset + 0x08);
    this.vertexIndex1   = dv.getInt16(offset + 0x0A);
    this.vertexIndex2   = dv.getInt16(offset + 0x0C);
    this.vertexIndex3   = dv.getInt16(offset + 0x0E);
    this.texCoordIndex0 = dv.getInt16(offset + 0x10);
    this.texCoordIndex1 = dv.getInt16(offset + 0x12);
    this.texCoordIndex2 = dv.getInt16(offset + 0x14);
    this.texCoordIndex3 = dv.getInt16(offset + 0x16);
    this.colorIndex0    = dv.getInt16(offset + 0x18);
    this.colorIndex1    = dv.getInt16(offset + 0x1A);
    this.colorIndex2    = dv.getInt16(offset + 0x1C);
    this.colorIndex3    = dv.getInt16(offset + 0x1E);
}
MeshFace.SIZE = 0x20;

function CollisionMeta(dv, offset)
{
    this.offsFaces    = dv.getUint32(offset + 0x00);
    this.numFaces     = dv.getUint32(offset + 0x04);
    this.offsVertices = dv.getUint32(offset + 0x08);
    this.numVertices  = dv.getUint32(offset + 0x0C);
    this.offs2        = dv.getUint32(offset + 0x10);
    this.num2         = dv.getUint32(offset + 0x14);
    this.offs3        = dv.getUint32(offset + 0x18);
    this.num3         = dv.getUint32(offset + 0x1C); // always zero
}

function CollisionFace(dv, offset)
{
    this.vertexIndex0  = dv.getInt16(offset + 0x00);
    this.vertexIndex1  = dv.getInt16(offset + 0x02);
    this.vertexIndex2  = dv.getInt16(offset + 0x04);
    this.unk06         = dv.getUint16(offset + 0x06);
    this.unk08         = dv.getUint16(offset + 0x08);
}
CollisionFace.SIZE = 0x0A;

function CollisionVertex(dv, offset)
{
    this.position = new Vec3f(dv, offset + 0x00);
    this.unk0C    = dv.getUint32(offset + 0x0C);
    this.unk10    = dv.getUint16(offset + 0x10);
    this.unk12    = dv.getUint16(offset + 0x12);
}
CollisionVertex.SIZE = 0x14;

function CollisionUnknown(dv, offset)
{
    this.sectionIndex0 = dv.getInt16(offset + 0x00);
    this.faceIndex0    = dv.getInt16(offset + 0x02);
    this.sectionIndex1 = dv.getInt16(offset + 0x04);
    this.faceIndex1    = dv.getInt16(offset + 0x06);
    this.sectionIndex2 = dv.getInt16(offset + 0x08);
    this.faceIndex2    = dv.getInt16(offset + 0x0A);
}
CollisionUnknown.SIZE = 0x0C;
