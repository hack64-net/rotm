.macro Header
    .definelabel sool_file_start, .
    .ascii "SOOL"
    .dw (sool_file_end - sool_file_start)
    .dh (section_refs_end - section_refs_start) / 4
    .dh 0x0000
    .definelabel section_refs_start, .
.endmacro

.macro EndHeader
    .definelabel section_refs_end, .
    .fill (section_refs_end - section_refs_start) / 2, 0xFF
    .fill (section_refs_end - section_refs_start) / 2, 0x00
.endmacro

.macro SectionRef, offs
    .dw offs
.endmacro

.macro EndSool
    .definelabel sool_file_end, .
.endmacro

.macro Section, name, specialMethod
    .definelabel name, .
    .headersize -.
    .dh @@vars_start
    .dh @@vars_end
    .if (@@elements_end - @@elements_start) != 0
        .dh @@elements_start
    .else
        .dh 0xFFFF
    .endif
    .dh (@@elements_end - @@elements_start) / 4
    .dh 0xFFFF // unknown
    .dh specialMethod // unknown purpose, main?
    .dh @@methods_end
    .dh (@@method_refs_end - @@method_refs_start) / 2
.endmacro

.macro EndSection
    .headersize 0
.endmacro

.macro MethodRefs
    .definelabel @@method_refs_start, .
.endmacro

.macro EndMethodRefs
    .definelabel @@method_refs_end, .
.endmacro

.macro MethodRef, offs
    .dh offs
.endmacro

.macro Vars
    .definelabel @@vars_start, .
.endmacro

.macro EndVars
    .definelabel @@vars_end, .
.endmacro

.macro Var, name, value
    .definelabel name, .
    .dh value
.endmacro

.macro Methods
    //.definelabel @@methods_start, .
.endmacro

.macro EndMethods
    .definelabel @@methods_end, .
.endmacro

.macro Method, name
    .definelabel name, .
.endmacro

.macro Elements
    .definelabel @@elements_start, .
.endmacro

.macro EndElements
    .definelabel @@elements_end, .
.endmacro

.macro Element, key, value
    .dh key, value
.endmacro

////////////////////

.macro end                    :: .db 0x00 :: .endmacro
.macro unk01                  :: .db 0x01 :: .endmacro
.macro return                 :: .db 0x02 :: .endmacro
.macro ifgoto, imm1           :: .db 0x03 :: .dh (imm1 >> 8) | ((imm1 & 0xFF) << 8) :: .endmacro
.macro goto, imm1             :: .db 0x04 :: .dh (imm1 >> 8) | ((imm1 & 0xFF) << 8) :: .endmacro
.macro immload, imm1          :: .db 0x05 :: .dh (imm1 >> 8) | ((imm1 & 0xFF) << 8) :: .endmacro
.macro immload_06, imm1       :: .db 0x06 :: .dh (imm1 >> 8) | ((imm1 & 0xFF) << 8) :: .endmacro
.macro varload, imm1          :: .db 0x07 :: .dh (imm1 >> 8) | ((imm1 & 0xFF) << 8) :: .endmacro
.macro objvarload, imm1, imm2 :: .db 0x08 :: .dh (imm1 >> 8) | ((imm1 & 0xFF) << 8) :: .dh (imm2 >> 8) | ((imm2 & 0xFF) << 8) :: .endmacro
.macro immload_09, imm1       :: .db 0x09 :: .dh (imm1 >> 8) | ((imm1 & 0xFF) << 8) :: .endmacro
.macro immload2, imm1, imm2   :: .db 0x0A :: .dh (imm1 >> 8) | ((imm1 & 0xFF) << 8) :: .dh (imm2 >> 8) | ((imm2 & 0xFF) << 8) :: .endmacro
.macro objelemload            :: .db 0x0B :: .endmacro
.macro objelemload_k          :: .db 0x0C :: .endmacro
.macro objelemvarload         :: .db 0x0D :: .endmacro
.macro unk0E, imm1, imm2      :: .db 0x0E :: .dh (imm1 >> 8) | ((imm1 & 0xFF) << 8) :: .dh (imm2 >> 8) | ((imm2 & 0xFF) << 8) :: .endmacro
.macro unk0F                  :: .db 0x0F :: .endmacro
.macro setflag2               :: .db 0x10 :: .endmacro
.macro clearflag2             :: .db 0x11 :: .endmacro
.macro unk12                  :: .db 0x12 :: .endmacro
.macro unk13                  :: .db 0x13 :: .endmacro
.macro cmpleqz                :: .db 0x14 :: .endmacro
.macro cmpeq                  :: .db 0x15 :: .endmacro
.macro cmpneq                 :: .db 0x16 :: .endmacro
.macro lgcand                 :: .db 0x17 :: .endmacro
.macro lgcor                  :: .db 0x18 :: .endmacro
.macro sub                    :: .db 0x19 :: .endmacro
.macro add                    :: .db 0x1A :: .endmacro
.macro mod                    :: .db 0x1B :: .endmacro
.macro mul                    :: .db 0x1C :: .endmacro
.macro div                    :: .db 0x1D :: .endmacro
.macro cmplt                  :: .db 0x1E :: .endmacro
.macro cmpgt                  :: .db 0x1F :: .endmacro
.macro cmplte                 :: .db 0x20 :: .endmacro
.macro cmpgte                 :: .db 0x21 :: .endmacro
.macro neg                    :: .db 0x22 :: .endmacro
.macro and                    :: .db 0x23 :: .endmacro
.macro or                     :: .db 0x24 :: .endmacro
.macro lsh                    :: .db 0x25 :: .endmacro
.macro rsh                    :: .db 0x26 :: .endmacro
.macro varstore               :: .db 0x28 :: .endmacro
.macro objvarstore            :: .db 0x29 :: .endmacro
.macro varinc                 :: .db 0x2A :: .endmacro
.macro objvinc                :: .db 0x2B :: .endmacro
.macro vardec                 :: .db 0x2C :: .endmacro
.macro objvardec              :: .db 0x2D :: .endmacro
.macro objvarmov              :: .db 0x2E :: .endmacro
.macro objvaradd              :: .db 0x2F :: .endmacro
.macro varsub                 :: .db 0x30 :: .endmacro
.macro objvarsub              :: .db 0x31 :: .endmacro
.macro clearflag3             :: .db 0x32 :: .endmacro
.macro setflag0clearflag3     :: .db 0x34 :: .endmacro
.macro objclearflags01        :: .db 0x35 :: .endmacro
.macro objsetflag1            :: .db 0x36 :: .endmacro
.macro clearflag3_unkcnd      :: .db 0x37 :: .endmacro
.macro objclearflag3_unkcnd   :: .db 0x38 :: .endmacro
.macro callmethod             :: .db 0x39 :: .endmacro
.macro objcallmethod          :: .db 0x3A :: .endmacro
.macro pop                    :: .db 0x3B :: .endmacro
.macro callvnative, nargs     :: .db 0x3C + nargs :: .endmacro
.macro callnative, nargs      :: .db 0x50 + nargs :: .endmacro

