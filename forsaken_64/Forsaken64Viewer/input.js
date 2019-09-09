var camAngleX = 0; 
var camAngleY = 0;
var isDragging = false;
var xOff = 200.0;
var yOff = 200.0;
var zOff = 200.0;
var xRotate = 0;
var yRotate = 0;
var zRotate = 0;
var mouse = new THREE.Vector2();

var curWebglContainer;

function init_webgl_controls(webglContainer) {
    webglContainer.addEventListener("wheel", function(e){
        // Turns out that deltaY is different based on the browser. :|
        // This should help even things out for all of them.
        move_cam(20 * (e.deltaY > 0 ? -1 : 1));
    });
    webglContainer.addEventListener("mousedown", function(e){
        isDragging = true;
    });
    window.addEventListener("mouseup", function(e){
        isDragging = false;
    });
    window.addEventListener("mousemove", function(event){
        if(isDragging) {
            moveCamera(event);
        } else {
            mouse.x = event.clientX - curWebglContainer.getBoundingClientRect().left;
            mouse.y = event.clientY - curWebglContainer.getBoundingClientRect().top;
        }
    });
    curWebglContainer = webglContainer;
}

function moveCamera(event){
    var MousePosX = (event.clientX - curWebglContainer.getBoundingClientRect().left) - mouse.x;
    var MousePosY = (event.clientY - curWebglContainer.getBoundingClientRect().top) - mouse.y;

    camAngleX = camAngleX + (0.01 * MousePosX);
    camAngleY = camAngleY - (0.01 * MousePosY);
            
    mouse.x = event.clientX - curWebglContainer.getBoundingClientRect().left;
    mouse.y = event.clientY - curWebglContainer.getBoundingClientRect().top;
    orient_cam(camAngleX,camAngleY);
}

function orient_cam(ang, ang2){
	xRotate = Math.sin(ang);
	yRotate = ang2;
	zRotate = -Math.cos(ang);
}
    
function move_cam(direction){
	xOff += direction * xRotate;
	yOff += direction * yRotate;
	zOff += direction * zRotate;
}
