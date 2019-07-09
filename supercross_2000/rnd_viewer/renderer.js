var camera, scene, renderer;
var geometry, material, mesh;
var renderer_width = 500, renderer_height = 250;
var zoom_value = 1.0;
var slider_rotate_x, slider_rotate_y, slider_rotate_z;
var slider_zoom;
var rnd_data;

function create_3d_window(){
    init();
    animate();
}

function load_new_3d_object(rnd){
    var geom = new THREE.Geometry();
    
    rnd.points.forEach(function(e) {
      geom.vertices.push(e.vec3)
    }); 
    
    rnd.triangles.forEach(function(e) {
      geom.faces.push(e.face3)
    }); 
    material = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
    
    scene.remove(mesh);
    mesh = new THREE.Mesh( geom, material );
    scene.add(mesh);
    
    rnd_data = rnd
    
    update_camera_position();
}

function update_camera_position() {
    camera.position.x = rnd_data.max_point.vec3.x * 1.5 * zoom_value;
    camera.position.y = rnd_data.max_point.vec3.y * 1.5 * zoom_value;
    camera.position.z = rnd_data.max_point.vec3.z * 1.5 * zoom_value;
    camera.lookAt(0, 0, 0);
}

function init() {
	camera = new THREE.PerspectiveCamera( 70, renderer_width / renderer_height, 0.01, 1000000 );
    camera.position.x = 500;
    camera.position.y = 500;
    camera.position.z = 500;
    camera.lookAt(0, 0, 0);
    camera.up.set( 0, 0, 1 );

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
        mesh.rotation.x += slider_rotate_x.value * 0.01;
        mesh.rotation.y += slider_rotate_y.value * 0.01;
        mesh.rotation.z += slider_rotate_z.value * 0.01;
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
    add_slider(controls, 'rotateSliderX', -3, 3, 1);
    add_slider(controls, 'rotateSliderY', -3, 3, 1);
    add_slider(controls, 'rotateSliderZ', -3, 3, 1);
    controls.appendChild(document.createElement('br'));
    add_slider(controls, 'zoomSlider', -3, 3, 1);
    document.body.appendChild(controls);
}




