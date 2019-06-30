from OpenGL.GLU import *
from OpenGL.GL import *
from PyQt4.QtGui import *
from PyQt4.QtOpenGL import *
from PyQt4.QtCore import *

from f3dex import F3DEX
from levelModel import LevelModel
from n64texture import N64TextureDecoder
from enum import Enum
import traceback
import sys
import os
import datetime
import copy 

titleName = 'Mission Impossible 64 Graphics Viewer'

f3dex_dic = {} # Dictionary of F3DEX objects.
f3dex = None
startAddress = 0
usingMultipleModels = False
startAddresses = []
numOfSeg7Textures = 0
selectedItem = None
directory = './data/'

def bytes_to_int(arr, offset):
    return (arr[offset] << 24) | (arr[offset + 1] << 16) | (arr[offset + 2] << 8) | (arr[offset + 3])

# Currently, only static objects & levels can be viewed and/or exported by this tool.
class FILETYPE(Enum):
    STATIC_OBJECT   = 0
    ANIMATED_OBJECT = 1
    LEVEL           = 2
    
def determine_file_type(bytes):
    offset_0 = bytes_to_int(bytes, 0)
    offset_4 = bytes_to_int(bytes, 4)
    offset_8 = bytes_to_int(bytes, 8)
    offset_C = bytes_to_int(bytes, 12)
    
    if offset_0 & 0x04000000 != 0:
        return FILETYPE.LEVEL # Segment 4 is just for levels as far as I know.
    elif offset_0 & 0x01000000 != 0:
        if offset_8 & 0x01000000 != 0:
            return FILETYPE.ANIMATED_OBJECT
        else:
            return FILETYPE.STATIC_OBJECT
    raise ValueError('Unknown filetype!')

def load_file(filename):
    global f3dex
    global startAddress
    global startAddresses
    global numOfSeg7Textures
    global usingMultipleModels
    global currentSeg7TextureIndex
    currentSeg7TextureIndex = 0
    usingMultipleModels = False
    temp_segments = [None] * 16
    with open(filename, "rb") as file:
        bytes = file.read()
        fileType = determine_file_type(bytes)
        if fileType == FILETYPE.STATIC_OBJECT:
            temp_segments[1] = bytes
            startAddress = bytes_to_int(temp_segments[1], 0x0)
            numOfSeg7Textures = bytes_to_int(temp_segments[1], 0x8)
            if numOfSeg7Textures > 0:
                textureAddressesListOff = bytes_to_int(temp_segments[1], 0xC) & 0x00FFFFFF
                # NOTE: segment 7 contains the array of the segment 1 address to the textures.
                temp_segments[7] = temp_segments[1][textureAddressesListOff:textureAddressesListOff+(numOfSeg7Textures*4)]
                #print('Segment 7 size = ' + hex(len(temp_segments[7])))
            f3dex = F3DEX(temp_segments, numOfSeg7Textures)
        elif fileType == FILETYPE.ANIMATED_OBJECT:
            print("This program cannot currently read Animated Objects. :(")
            f3dex = None
        elif fileType == FILETYPE.LEVEL:
            temp_segments[4] = bytes
            level = LevelModel(temp_segments)
            usingMultipleModels = True
            startAddresses = level.get(True)
            numOfSeg7Textures = 0
            f3dex = F3DEX(temp_segments, 0)

class MainWindow(QMainWindow):
    def __init__(self):
        super(MainWindow, self).__init__()
        self.setWindowTitle(titleName)
        self.make_menu()
        self.form_widget = FormWidget(self) 
        self.setCentralWidget(self.form_widget) 
        self.resize(640, 480)
        self.show()
        
    def rename_file(self):
        global selectedItem
        if selectedItem == None:
            print('No file selected!')
            return
        oldText = selectedItem.text()
        text,ok = QInputDialog.getText(self, 'Text Input Dialog', 'Enter new name:', text=oldText)
        if ok:
            os.rename(directory + oldText, directory + text)
            selectedItem.setText(text)
            print('Renamed "' + oldText + '" to "' + text + '"')
            
    def export_file_to_OBJ(self):
        global selectedItem
        global f3dex
        if selectedItem == None:
            print('No file selected!')
            return
        text,ok = QInputDialog.getText(self, 'Text Input Dialog', 'Enter obj filename:', text=selectedItem.text()[0:selectedItem.text().index('.')])
        if ok:
            f3dex.exportToOBJ(text)
            
    def toggle_axis(self):
        global drawAxisLines
        drawAxisLines = self.axisAction.isChecked()
        
    # Creates the menu bar and the options
    def make_menu(self):
        menubar = self.menuBar()
        fileMenu = menubar.addMenu('&File')
        # File -> Rename
        renameAction = QAction("&Rename", self)
        renameAction.setStatusTip('Rename the file')
        renameAction.triggered.connect(self.rename_file)
        fileMenu.addAction(renameAction)
        # File -> Export
        exportAction = QAction("&Export", self)
        exportAction.setStatusTip('Export file to .obj')
        exportAction.triggered.connect(self.export_file_to_OBJ)
        fileMenu.addAction(exportAction)
        viewMenu = menubar.addMenu('&View')
        # View -> Draw Axis Lines
        self.axisAction = QAction("&Draw Axis Lines", self)
        self.axisAction.setStatusTip('Toggle axis lines in viewer')
        self.axisAction.triggered.connect(self.toggle_axis)
        self.axisAction.setCheckable(True)
        self.axisAction.setChecked(True)
        viewMenu.addAction(self.axisAction)
        
class FormWidget(QWidget):
    def __init__(self, parent):        
        super(FormWidget, self).__init__(parent)
        splitter = QSplitter(Qt.Horizontal)
        self.layout = QHBoxLayout(self)
        self.make_sidebar(splitter)
        self.make_render_and_toolbar(splitter)
        splitter.setSizes([40, 100])
        self.layout.addWidget(splitter)
        
    def make_button(self, layout, text):
        button = QPushButton(text)
        layout.addWidget(button)
        
    def make_listbox(self, layout, strings):
        list = QListWidget()
        list.addItems(strings)
        list.doubleClicked.connect(self.listitem_clicked)
        self.list = list
        layout.addWidget(list)
        
    def listitem_clicked(self, qmodelindex):
        global zoomValue
        global f3dex
        global selectedItem
        zoomValue = 0.0
        item = self.list.currentItem()
        selectedItem = item
        fileToLoad = item.text()
        f3dex = None
        load_file(directory + fileToLoad)
        self.glWindow.update()
        print('Loaded ' + fileToLoad)

    def get_files_from_dir_with_extension(self, path, extension):
        return [f for f in os.listdir(path) if f.endswith(extension)]

    def rotate_slider_changed(self):
        global angleAcceleration
        angleAcceleration = self.rotateSlider.value() * 0.01
        
    def zoom_slider_changed(self):
        global zoomAcceleration
        zoomAcceleration = self.zoomSlider.value() * 0.0001
        
    def x_slider_changed(self):
        global xAcceleration
        xAcceleration = self.xSlider.value() * 0.1
        
    def y_slider_changed(self):
        global yAcceleration
        yAcceleration = self.ySlider.value() * 0.1
        
    def z_slider_changed(self):
        global zAcceleration
        zAcceleration = self.zSlider.value() * 0.1
        
    def make_slider(self, min, max, tickInterval, value, changed, tooltip=None):
        slider = QSlider(Qt.Horizontal)
        slider.setMinimum(min)
        slider.setMaximum(max)
        slider.setValue(value)
        slider.setTickPosition(QSlider.TicksBelow)
        slider.setTickInterval(tickInterval)
        slider.valueChanged.connect(changed)
        if tooltip != None:
            slider.setToolTip(tooltip)
        return slider
        
    def make_separator_line(self):
        line = QFrame()
        line.setFrameShape(QFrame.VLine)
        return line
        
    # Create the slider controls
    def make_toolbar(self, container):
        toolbar = QWidget()
        layout = QHBoxLayout(toolbar)
        self.rotateSlider = self.make_slider(-9, 9, 3, 0, self.rotate_slider_changed, 'Rotate Y-Axis')
        layout.addWidget(self.rotateSlider)
        layout.addWidget(self.make_separator_line())
        self.zoomSlider = self.make_slider(-9, 9, 3, 0, self.zoom_slider_changed, 'Zoom In/Out')
        layout.addWidget(self.zoomSlider)
        layout.addWidget(self.make_separator_line())
        self.xSlider = self.make_slider(-9, 9, 3, 0, self.x_slider_changed, 'Move on X-Axis')
        layout.addWidget(self.xSlider)
        self.ySlider = self.make_slider(-9, 9, 3, 0, self.y_slider_changed, 'Move on Y-Axis')
        layout.addWidget(self.ySlider)
        self.zSlider = self.make_slider(-9, 9, 3, 0, self.z_slider_changed, 'Move on Z-Axis')
        layout.addWidget(self.zSlider)
        layout.setMargin(0)
        toolbar.setLayout(layout)
        toolbar.setFixedHeight(20)
        container.addWidget(toolbar)

    def make_render_and_toolbar(self, container):
        render_and_toolbar = QWidget()
        layout = QVBoxLayout(render_and_toolbar)
        self.make_toolbar(layout)
        self.glWindow = glWidget(self)
        layout.addWidget(self.glWindow)
        render_and_toolbar.setLayout(layout)
        container.addWidget(render_and_toolbar)
    
    def make_sidebar(self, container):
        sidebar = QWidget()
        sidebarLayout = QVBoxLayout(sidebar)
        self.make_listbox(sidebarLayout, self.get_files_from_dir_with_extension(directory, '.bin'))
        sidebar.setLayout(sidebarLayout)
        container.addWidget(sidebar)
        
drawAxisLines = True
        
def drawAxis():
    global drawAxisLines
    if drawAxisLines:
        glDisable(GL_TEXTURE_2D)
        glBegin(GL_LINES)
        glColor3f(1.0, 0.0, 0.0)
        glVertex3f(0.0, 0.0, 0.0)
        glVertex3f(10000.0, 0.0, 0.0)
        glColor3f(0.0, 1.0, 0.0)
        glVertex3f(0.0, 0.0, 0.0)
        glVertex3f(0.0, 10000.0, 0.0)
        glColor3f(0.0, 0.0, 1.0)
        glVertex3f(0.0, 0.0, 0.0)
        glVertex3f(0.0, 0.0, 10000.0)
        glEnd()
        
currentSeg7TextureIndex = 0
oldElapsedTime = datetime.datetime.now()
currentTime = 0.0
angle = 0.0
zoomValue = 0.0
angleAcceleration = 0.0
zoomAcceleration = 0.0
xOffset = 0.0
yOffset = 0.0
zOffset = 0.0
xAcceleration = 0.0
yAcceleration = 0.0
zAcceleration = 0.0

def drawModel():
    global usingMultipleModels
    global startAddresses
    global angle
    global currentSeg7TextureIndex
    global numOfSeg7Textures
    global oldElapsedTime
    global currentTime
    global zoomValue
    global angleAcceleration
    global zoomAcceleration
    global xAcceleration
    global yAcceleration
    global zAcceleration
    global xOffset
    global yOffset
    global zOffset
    color = [1.0, 1.0, 1.0, 1.0]
    
    elapsedTime = datetime.datetime.now()
    deltaTime = (elapsedTime - oldElapsedTime).microseconds / 1000
    currentTime += deltaTime
    oldElapsedTime = elapsedTime
    angle += deltaTime * angleAcceleration
    
    if f3dex != None:
        bb_max = f3dex.get_bounding_box()[1]
        value = bb_max[0]
        if bb_max[1] > value:
            value = bb_max[1]
        if bb_max[2] > value:
            value = bb_max[2]
        value *= 0.0025
        if zoomAcceleration != 0:
            zoomValue += deltaTime * zoomAcceleration
        if xAcceleration != 0:
            xOffset += deltaTime * xAcceleration
        if yAcceleration != 0:
            yOffset += deltaTime * yAcceleration
        if zAcceleration != 0:
            zOffset += deltaTime * zAcceleration
        value += zoomValue
        gluLookAt(value,value,value,  0,0,0,  0,1,0)
    
    if f3dex != None:
        glDisable(GL_TEXTURE_2D)
        if not usingMultipleModels:
            glScalef(0.002, 0.002, 0.002)
            glRotatef(angle, 0.0, 1.0, 0.0)
            glTranslatef(xOffset, yOffset, zOffset)
            f3dex.parse(startAddress, currentSeg7TextureIndex)
        else:
            glScalef(0.002, 0.002, 0.002)
            glRotatef(angle, 0.0, 1.0, 0.0)
            glTranslatef(xOffset, yOffset, zOffset)
            for address in startAddresses:
                f3dex.parse(address.segAddress, 0)
    drawAxis()

    if numOfSeg7Textures > 0:
        if currentTime >= 200.0:
            currentSeg7TextureIndex += 1
            if(currentSeg7TextureIndex >= numOfSeg7Textures):
                currentSeg7TextureIndex = 0
            currentTime = 0.0
    
class glWidget(QGLWidget):
    def __init__(self, parent):
        QGLWidget.__init__(self, parent)
        self.setMinimumSize(320, 240)
        
    def wheelEvent(self,event):
        global zoomValue
        dir = event.delta() / 120
        zoomValue -= dir * 0.01
        
    def paintGL(self):
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        glPushMatrix()
        drawModel()
        glPopMatrix()
        glFlush()
        if f3dex != None:
            self.update()
            
    def resizeGL(self, w, h):
        glViewport(0, 0, w, h)
        glMatrixMode(GL_PROJECTION)
        glLoadIdentity()
        gluPerspective(60.0,w/h,0.0001,32000.0)
        
    def initializeGL(self):
        glClearColor(0.5, 0.5, 1.0, 1.0)
        glShadeModel(GL_SMOOTH)
        glEnable(GL_CULL_FACE)
        glFrontFace(GL_CW)
        glEnable(GL_DEPTH_TEST)
        glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA)
        glDepthFunc(GL_LEQUAL)
        glDepthMask(GL_TRUE)
        glAlphaFunc(GL_GEQUAL, 0.01)
        glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST)
        glTexParameterf(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST)
        
        glViewport(0, 0, 640, 480)
        glMatrixMode(GL_PROJECTION)
        gluPerspective(60.0,640/480,100.0,32000.0)
        glMatrixMode(GL_MODELVIEW)
        glPushMatrix()

try:
    if __name__ == '__main__':
        app = QApplication(['Yo'])
        window = MainWindow()
        app.exec_()
except Exception as ex:
    print(ex)
    traceback.print_stack()
