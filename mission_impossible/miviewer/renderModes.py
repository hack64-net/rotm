renderModes = {
    # Note: Confirm these later.
    0xC8112068 : { "Transparent" : False }, # ???
    0xC8113068 : { "Transparent" : True },  # ???
    0xC8112078 : { "Transparent" : False }, # G_RM_FOG_SHADE_A, G_RM_AA_ZB_OPA_SURF2
    0xC8113078 : { "Transparent" : True },  # G_RM_FOG_SHADE_A, G_RM_AA_ZB_TEX_EDGE2
    0xC8104570 : { "Transparent" : True },  # ???
    0x00552068 : { "Transparent" : False }, # ???
    0x00552078 : { "Transparent" : False }, # G_RM_AA_ZB_OPA_SURF, G_RM_AA_ZB_OPA_SURF2
    0x00553068 : { "Transparent" : True },  # ???
    0x00553078 : { "Transparent" : True },  # G_RM_AA_ZB_TEX_EDGE, G_RM_AA_ZB_TEX_EDGE2
    0x0C192068 : { "Transparent" : False }, # ???
    0x0C192078 : { "Transparent" : True },  # G_RM_PASS, G_RM_AA_ZB_OPA_SURF2 ???
    0x00504570 : { "Transparent" : True }   # ???
}

def does_render_mode_contain_transparency(mode):
    #print("Mode: " + hex(mode))
    if(renderModes.get(mode) == None):
        print("Unknown Mode: " + hex(mode))
        return False
    return renderModes[mode]["Transparent"]
    
    
