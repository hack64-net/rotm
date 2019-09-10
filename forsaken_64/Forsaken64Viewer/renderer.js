var camera, scene, renderer;
var geometry, material, mesh;
var renderer_width = 800, renderer_height = 400;

var rom;

function create_3d_window(){
    init();
    animate();
}

function load_model(offset){
    var model;
    var isLevel = (typeof offset === 'object');
    
    if(isLevel) {
        var geo_rnx = new RNX(rom, offset.geometry);
        var tex_rnx = new RNX(rom, offset.textures);
        model = new ForsakenLevel(geo_rnx.get_data(), tex_rnx.get_data());
    } else {
        var rnx = new RNX(rom, offset);
        model = new ForsakenModel(rnx.get_data());
    }
    
    var num_materials = model.materials.length;
    
    var geometries = new Array(num_materials);
    var materials = new Array(num_materials);
    
    for(var i = 0; i < num_materials; i++){
        geometries[i] = new THREE.Geometry();
        
        model.materials[i].vertices.forEach(function(vert) {
            geometries[i].vertices.push(vert.pos);
        });
        
        if(model.materials[i].tex != undefined) {
            if(isLevel) {
                materials[i] = new THREE.MeshBasicMaterial({ 
                    vertexColors: THREE.VertexColors,
                    map: convert_texture_to_png_texture(model.materials[i].tex, true),
                    transparent: model.materials[i].hasTransparency,
                    //side: THREE.DoubleSide
                });
            } else {
                materials[i] = new THREE.MeshLambertMaterial({ 
                    vertexColors: THREE.VertexColors,
                    map: convert_texture_to_png_texture(model.materials[i].tex, false),
                    transparent: model.materials[i].hasTransparency,
                });
            }
        } else {
            materials[i] = new THREE.MeshBasicMaterial({ 
                vertexColors: THREE.VertexColors,
            });
        }
        
        if(model.materials[i].triangles != undefined) {
            model.materials[i].triangles.forEach(function(tri) {
                geometries[i].faces.push(tri);
                geometries[i].faceVertexUvs[0].push(tri.uvs);
                geometries[i].uvsNeedUpdate = true;
                geometries[i].normalsNeedUpdate = true;
            });
        }
    }
    
    // Clear scene
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    
    var light = new THREE.PointLight( 0xFFFFFF, 1, 1000000 );
    light.position.set( 1000, 1000, 1000 );
    scene.add( light );
    
    for(var i = 0; i < num_materials; i++){
        if(geometries[i].faces.length > 0){
            var mesh = new THREE.Mesh( geometries[i], materials[i] );
            //scene.add(new THREE.VertexNormalsHelper( mesh, 10, 0xff0000 ));
            scene.add(mesh);
        }
    }
    
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
    //camera.lookAt(new THREE.Vector3(0,0,0));
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

function add_drop_down(container, id, levelList, objectList, onchange){
    var select = document.createElement("select");
    select.id = id;
    for(var i = 0; i < levelList.length; i++) {
        var option = document.createElement("option");
        option.value = 'Level:'+i;
        option.innerHTML = "Level: 0x" + levelList[i].geometry.toString(16);
        select.appendChild(option);
    }
    for(var i = 0; i < objectList.length; i++) {
        var option = document.createElement("option");
        option.value = 'Object:'+i;
        option.innerHTML = "Object: 0x" + objectList[i].toString(16);
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
