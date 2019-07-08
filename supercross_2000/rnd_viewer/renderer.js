var camera, scene, renderer;
var geometry, material, mesh;

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
    
    scene.remove(mesh);
    mesh = new THREE.Mesh( geom, new THREE.MeshNormalMaterial() );
    scene.add(mesh);
    
    camera.position.x = rnd.max_point.vec3.x * 1.5;
    camera.position.y = rnd.max_point.vec3.y * 1.5;
    camera.position.z = rnd.max_point.vec3.z * 1.5;
    camera.lookAt(0, 0, 0);
}

function init() {
	camera = new THREE.PerspectiveCamera( 70, 1.0, 0.01, 1000000 );
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
	renderer.setSize( 250, 250 );
    renderer.setClearColor( 0x208FFF, 1 );
	document.body.appendChild( renderer.domElement );
}

function animate() {
	requestAnimationFrame( animate );
	mesh.rotation.x += 0.01;
	mesh.rotation.y += 0.02;
	renderer.render( scene, camera );
}