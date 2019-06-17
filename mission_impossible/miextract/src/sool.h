typedef struct
{
    uint8_t cmdByte;
    const char *name;
    int     nimm;
} sool_opinfo_t;

sool_opinfo_t *sool_op_lookup(uint8_t cmdByte);
void sool_decode_ops(uint8_t *data, uint32_t sectionOffs, uint32_t methodOffs, FILE *fp);
void sool_decode(uint8_t *data, const char *path);