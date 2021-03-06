var camera, scene, renderer;
var geometry, material, mesh;
var renderer_width = 800, renderer_height = 400;

var ROM, levelViewer, objects;

function create_3d_window(){
    init();
    animate();
}

function make_object_box(position){
    var geometry = new THREE.BoxGeometry( 8, 8, 8 );
    var material = new THREE.MeshBasicMaterial( {color: 0xFF0000, wireframe:true  } );
    var box = new THREE.Mesh( geometry, material );
    box.position.set(position.x, position.y, position.z);
    return box;
}

function init_objects() {
    objects = [];
    var offset = 0x818C0;
    while (offset < 0x854F0){
        var obj = new Gex3Object(ROM, offset);
        objects[obj.name] = obj;
        offset += 0x10;
    }
}

function load_new_map(){
    // Load Map
    var num_materials = levelViewer.materials.length;
    
    var geometries = new Array(num_materials);
    var materials = new Array(num_materials);
    
    for(var i = 0; i < num_materials; i++){
        geometries[i] = new THREE.Geometry();
        
        levelViewer.materials[i].vertices.forEach(function(vert) {
            geometries[i].vertices.push(vert.pos);
        });
        
        if(levelViewer.materials[i].isAnimated) {
            materials[i] = new THREE.MeshBasicMaterial({ 
                vertexColors: THREE.VertexColors,
                map: convert_texture_to_png_texture(levelViewer.materials[i].animFrames[0].tex),
                transparent: levelViewer.materials[i].animFrames[0].hasTransparency,
                side: THREE.DoubleSide
            });
        } else if(levelViewer.materials[i].tex != undefined) {
            materials[i] = new THREE.MeshBasicMaterial({ 
                vertexColors: THREE.VertexColors,
                map: convert_texture_to_png_texture(levelViewer.materials[i].tex),
                transparent: levelViewer.materials[i].hasTransparency,
                side: THREE.DoubleSide
            });
        } else {
            materials[i] = new THREE.MeshBasicMaterial({ 
                vertexColors: THREE.VertexColors
            });
        }
        
        if(levelViewer.materials[i].triangles != undefined) {
            //var texWidth = levelViewer.materials[i].width;
            //var texHeight = levelViewer.materials[i].height;
            levelViewer.materials[i].triangles.forEach(function(tri) {
                geometries[i].faces.push(tri);
                geometries[i].faceVertexUvs[0].push(tri.uvs);
                //console.log(geometries[i].faceVertexUvs[0]);
                geometries[i].uvsNeedUpdate = true;
            });
        }
    }
    
    
    // Clear scene
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    
    
    for(var i = 0; i < num_materials; i++){
        if(geometries[i].faces.length > 0){
            var mesh = new THREE.Mesh( geometries[i], materials[i] );
            scene.add(mesh);
        }
    }
    
    /*
    // The following is unfinished. Might return to this later, but I may also not.
    
    var objModels = [];
    // Load object models
    levelViewer.objectNameList.forEach(function(objName) {
        objModels.push(objects[objName].get_mesh());
    });
    
    levelViewer.levelObjects.forEach(function(obj) {
        if(obj.id != -1) { // An object id of -1 means that it has no model.
            var original_mesh = objModels[obj.id];
            if(original_mesh != undefined){
                scene.add(obj.make_clone(original_mesh));
            } else {
                console.error(levelViewer.objectNameList[obj.id] + ' with the id ' + obj.id + ' is undefined!');
            }
        }
        scene.add(make_object_box(obj.pos));
    });
    */
    
    update_camera_position();
}

function reset() {
    camAngleX = -0.78; 
    camAngleY = -0.68;
    xOff = 200.0;
    yOff = 200.0;
    zOff = 200.0;
    xRotate = -0.7;
    yRotate = -0.68;
    zRotate = -0.71;
}

function update_camera_position() {
    camera.position.x = xOff;
    camera.position.y = yOff;
    camera.position.z = zOff;
    camera.lookAt(new THREE.Vector3(xOff+xRotate,yOff+yRotate,zOff+zRotate));
}

function init() {
    camera = new THREE.PerspectiveCamera( 70, renderer_width / renderer_height, 1, 1000000 );
    camera.position.x = 500;
    camera.position.y = 500;
    camera.position.z = 500;
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();

    geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    material = new THREE.MeshNormalMaterial();

    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( renderer_width, renderer_height );
    renderer.setClearColor( 0x208FFF, 1 );
    renderer.domElement.id = 'renderer';
    document.body.appendChild( renderer.domElement );

    init_controls(document.body);
}

function animate() {
	requestAnimationFrame( animate );
    update_camera_position();
	renderer.render( scene, camera );
}

var numOfSlidersPerRow = 3;

function add_button(container, id, text, onclick) {
    var button = document.createElement('input');
    button.id = id;
    button.type = 'button';
    button.value = text;
    button.onclick = onclick;
    container.appendChild(button);
}

function add_slider(container, id, min, max, step) {
    var slider = document.createElement('input');
    slider.id = id;
    slider.type = 'range';
    slider.value = 0;
    slider.step = step;
    slider.min = min;
    slider.max = max;
    slider.style = "width:" + (renderer_width / numOfSlidersPerRow) + 'px';
    container.appendChild(slider);
}

function add_break(container) {
    container.appendChild(document.createElement('br'));
}

function add_drop_down(container, id, list, onchange){
    var select = document.createElement("select");
    select.id = id;
    for(var i = 0; i < list.length; i++) {
        var option = document.createElement("option");
        option.value = list[i];
        option.innerHTML = list[i];
        select.appendChild(option);
    }
    select.onchange = onchange;
    container.appendChild(select);
}

function add_notice_box(container, text) {
    var box = document.createElement("span");
    box.innerHTML = text;
    box.style = 'width:' + renderer_width + 'px;background-color:#FFFBE6;border:black;border-style:solid;border-width:thin;padding:5px';
    container.appendChild(box);
}

function init_controls(container) {
    var controls = document.createElement('div');
    init_webgl_controls(document.getElementById('renderer'));
    add_button(controls, 'buttonReset', 'Reset Camera', reset);
    add_break(controls);
    add_break(controls);
    add_notice_box(controls, "Controls: Hold down the left mouse button and move to rotate camera. Use mouse wheel to move forward/backward.");
    container.appendChild(controls);
    reset();
}
