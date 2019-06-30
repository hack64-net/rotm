def bytes_to_int(arr, offset):
    return (arr[offset] << 24) | (arr[offset + 1] << 16) | (arr[offset + 2] << 8) | (arr[offset + 3])

def bytes_to_short(arr, offset):
    val = (arr[offset + 0] << 8) | (arr[offset + 1])
    if val > 32767:
        return val - 65536
    else:
        return val
        
class LevelModelDisplayList:
    def __init__(self, segAddress, x, y, z, x2, y2, z2):
        self.segAddress = segAddress
        self.x = x
        self.y = y
        self.z = z
        self.x2 = x2
        self.y2 = y2
        self.z2 = z2
    
class LevelModel:
    def parse_node(self, parent, segmentAddress, minAddress, x, y, z, x2, y2, z2):
        segment = (segmentAddress >> 24) & 0xFF
        offset = segmentAddress & 0x00FFFFFF
        value = bytes_to_int(self.segments[segment], offset)
        if value & 0xFF000000 == 0x04000000:
            if value >= minAddress:
                parent.append(LevelModelDisplayList(value, x, y, z, x2, y2, z2))
                return
            childAddr = value
            nextAddr = bytes_to_int(self.segments[segment], offset + 4)
            child = []
            self.parse_node(child, childAddr, minAddress, x, y, z, x2, y2, z2)
            parent.append(child)
            if(nextAddr & 0xFF000000 == 0x04000000):
                next = []
                self.parse_node(next, nextAddr, minAddress, x, y, z, x2, y2, z2)
                parent.append(next)
        else:
            _x = bytes_to_short(self.segments[segment], offset + 0) 
            _y = bytes_to_short(self.segments[segment], offset + 2) 
            _z = bytes_to_short(self.segments[segment], offset + 4) 
            _x2 = bytes_to_short(self.segments[segment], offset + 6) 
            _y2 = bytes_to_short(self.segments[segment], offset + 8) 
            _z2 = bytes_to_short(self.segments[segment], offset + 10) 
            address = bytes_to_int(self.segments[segment], offset + 12)
            if(address & 0xFF000000 == 0x04000000):
                this = []
                self.parse_node(this, address, minAddress, x+_x, y+_y, z+_z, x2+_x2, y2+_y2, z2+_z2)
                parent.append(this)

    def flatten(self,x):
        result = []
        for el in x:
            if hasattr(el, "__iter__") and not isinstance(el, str):
                result.extend(self.flatten(el))
            else:
                result.append(el)
        return result
            
    def __init__(self, segments):
        self.segments = segments
        self.treeRoot = []
        rootAddr = bytes_to_int(self.segments[4], 0)
        minAddr = bytes_to_int(self.segments[4], 12)
        self.parse_node(self.treeRoot, rootAddr, minAddr, 0, 0, 0, 0, 0, 0)
        
    def get(self, flatList = False):
        if flatList:
            return self.flatten(self.treeRoot)
        else:
            return self.treeRoot