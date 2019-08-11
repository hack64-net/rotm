var camera, scene, renderer;
var geometry, material, mesh;
var renderer_width = 800, renderer_height = 400;
var zoom_value = 1.0;
var slider_rotate_x, slider_rotate_y, slider_rotate_z;
var slider_zoom;

var ROM, levelViewer;

function create_3d_window(){
    init();
    animate();
}

// This is necessary for the exporters to work properly
function convert_texture_to_png_texture(texture) {
    var pixels = texture.image.data,
    width = texture.image.width, 
    height = texture.image.height,

    canvas = document.createElement('canvas'),
    context = canvas.getContext('2d'),
    imgData = context.createImageData(width, height);

    canvas.height = height;
    canvas.width = width;
    
    // Copy texture data directly
    for(var i = 0; i < pixels.length*4; i++) {
        imgData.data[i] = pixels[i];
    }

    context.putImageData(imgData, 0, 0);

    var img = new Image();
    img.src = canvas.toDataURL('image/png');
    var new_tex = new THREE.Texture(img);
    
    // These 3 lines need to be here to prevent the textures from 
    // being automatically scaled down to a power of two.
    //new_tex.wrapS = THREE.ClampToEdgeWrapping;
    //new_tex.wrapT = THREE.ClampToEdgeWrapping;
    new_tex.wrapS = THREE.RepeatWrapping;
    new_tex.wrapT = THREE.RepeatWrapping;
    new_tex.minFilter = THREE.LinearFilter;
    
    img.onload = function(){
        new_tex.flipY = false;
        new_tex.needsUpdate = true;
    }
    
    return new_tex;
}

function load_new_map(){
    var num_materials = levelViewer.materials.length;
    
    var geometries = new Array(num_materials);
    var materials = new Array(num_materials);
    
    for(var i = 0; i < num_materials; i++){
        geometries[i] = new THREE.Geometry();
        levelViewer.vertices.forEach(function(vert) {
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
    
    update_camera_position();
}

function reset() {
    zoom_value = 1.0;
    scene.rotation.x = 0;
    scene.rotation.y = 0;
    scene.rotation.z = 0;
    update_camera_position();
}

function update_camera_position() {
    //camera.position.x = rnd_data.max_point.vec3.x * 1.5 * zoom_value;
    //camera.position.y = rnd_data.max_point.vec3.y * 1.5 * zoom_value;
    //camera.position.z = rnd_data.max_point.vec3.z * 1.5 * zoom_value;
    camera.position.x = 200 * 1.5 * zoom_value;
    camera.position.y = 200 * 1.5 * zoom_value;
    camera.position.z = 200 * 1.5 * zoom_value;
    camera.lookAt(0, 0, 0);
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
    document.body.appendChild( renderer.domElement );

    init_controls(document.body);
}

function setup_sliders() {
    slider_rotate_x = document.getElementById('rotateSliderX');
    slider_rotate_y = document.getElementById('rotateSliderY');
    slider_rotate_z = document.getElementById('rotateSliderZ');
    slider_zoom = document.getElementById('zoomSlider');
}

function animate() {
	requestAnimationFrame( animate );
	//mesh.rotation.x += 0.001;
    if(slider_rotate_x != null) {
        scene.rotation.x += slider_rotate_x.value * 0.01;
        scene.rotation.y += slider_rotate_y.value * 0.01;
        scene.rotation.z += slider_rotate_z.value * 0.01;
        if(slider_zoom.value != 0) {
            zoom_value += slider_zoom.value * 0.005;
            update_camera_position();
        }
    }
    else
        setup_sliders();
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

function init_controls(container) {
    var controls = document.createElement('div');
    add_slider(controls, 'rotateSliderX', -5, 5, 0.25);
    add_slider(controls, 'rotateSliderY', -5, 5, 0.25);
    add_slider(controls, 'rotateSliderZ', -5, 5, 0.25);
    add_break(controls);
    add_slider(controls, 'zoomSlider', -5, 5, 0.25);
    add_break(controls);
    add_button(controls, 'buttonReset', 'Reset Camera', reset);
    container.appendChild(controls);
}
