var camera, scene, renderer;
var geometry, material, mesh;
var renderer_width = 1000, renderer_height = 500;
var zoom_value = 1.0;
var slider_rotate_x, slider_rotate_y, slider_rotate_z;
var slider_zoom;
var rnd_data;

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
    new_tex.wrapS = THREE.ClampToEdgeWrapping;
    new_tex.wrapT = THREE.ClampToEdgeWrapping;
    new_tex.minFilter = THREE.LinearFilter;
    
    img.onload = function(){
        new_tex.flipY = false;
        new_tex.needsUpdate = true;
    }
    
    return new_tex;
}

function load_new_3d_object(rnd){
    var num_materials = rnd.materials.length;
    
    var geometries = new Array(num_materials);
    var materials = new Array(num_materials);
    
    for(var i = 0; i < num_materials; i++){
        geometries[i] = new THREE.Geometry();
        rnd.points.forEach(function(e) {
            geometries[i].vertices.push(e.vec3)
        });
        if(rnd.SHPN != null && rnd.materials[i].tex != undefined){
            materials[i] = new THREE.MeshBasicMaterial({ 
                vertexColors: THREE.VertexColors,
                map: convert_texture_to_png_texture(rnd.materials[i].tex),
                transparent: rnd.materials[i].hasTransparency,
                side: THREE.DoubleSide
            });
        } else {
            materials[i] = new THREE.MeshBasicMaterial({ 
                vertexColors: THREE.VertexColors
            });
        }
    }
    
    var triCount = 0
    rnd.triangles.forEach(function(e) {
        var matID = e.materialID;
        geometries[matID].faces.push(e.face3)
        if(rnd.SHPN != null)
        {
            width = rnd.materials[matID].tex_width;
            height = rnd.materials[matID].tex_height;
            if(width != 0 && height != 0) {
                var Uvs = e.Uvs;
                geometries[matID].faceVertexUvs[0].push(Uvs);
                geometries[matID].uvsNeedUpdate = true;
            }
        }
    }); 
    
    
    // Clear scene
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    
    for(var i = 0; i < num_materials; i++){
        if(geometries[i].faces.length > 0){
            mesh = new THREE.Mesh( geometries[i], materials[i] );
            scene.add(mesh);
        }
    }
    
    rnd_data = rnd
    
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
    camera.position.x = rnd_data.max_point.vec3.x * 1.5 * zoom_value;
    camera.position.y = rnd_data.max_point.vec3.y * 1.5 * zoom_value;
    camera.position.z = rnd_data.max_point.vec3.z * 1.5 * zoom_value;
    camera.lookAt(0, 0, 0);
}

function init() {
	camera = new THREE.PerspectiveCamera( 70, renderer_width / renderer_height, 1, 1000000 );
    camera.position.x = 500;
    camera.position.y = 500;
    camera.position.z = 500;
    camera.lookAt(0, 0, 0);
    //camera.up.set( 0, 0, 1 );

	scene = new THREE.Scene();

	geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
	material = new THREE.MeshNormalMaterial();

	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );
    
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( renderer_width, renderer_height );
    renderer.setClearColor( 0x208FFF, 1 );
	document.body.appendChild( renderer.domElement );
    
    init_controls();
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

function init_controls() {
    var controls = document.createElement('div');
    add_slider(controls, 'rotateSliderX', -5, 5, 0.25);
    add_slider(controls, 'rotateSliderY', -5, 5, 0.25);
    add_slider(controls, 'rotateSliderZ', -5, 5, 0.25);
    controls.appendChild(document.createElement('br'));
    add_slider(controls, 'zoomSlider', -5, 5, 0.25);
    controls.appendChild(document.createElement('br'));
    add_button(controls, 'buttonReset', 'Reset Camera', reset);
    document.body.appendChild(controls);
}




