var width = 400, height = 300;
var view_angle = 45,
    aspect = width / height,
    near = 0.1,
    far = 10 * 1000;
var container = document.getElementById('container');

var renderer = new THREE.WebGLRenderer();
var camera = new THREE.PerspectiveCamera(view_angle, aspect, near, far);
camera.position.z = 5;
var scene = new THREE.Scene();
scene.add(camera);
renderer.setSize(width, height);
container.appendChild(renderer.domElement);

//var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
var material = new THREE.MeshLambertMaterial({color: 0x00ff00});
var cube = new THREE.Mesh(new THREE.CubeGeometry(1, 1, 1), material);
scene.add(cube);

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
  cube.rotation.x += 0.1;
  cube.rotation.y += 0.1;
}
render();

light = new THREE.HemisphereLight( 0xfffff0, 0x101020, 1.25 );
light.position.set( 0.75, 1, 0.25 );
scene.add( light );

// var pointLight = new THREE.PointLight(0xffffff);
// pointLight.position.x = 10;
// pointLight.position.y = 50;
// pointLight.position.z = 130;
// scene.add(pointLight);

// renderer.render(scene, camera);

