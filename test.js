var width = 400, height = 300;
var view_angle = 45,
    aspect = width / height,
    near = 0.1,
    far = 10 * 1000;
var container = document.getElementById('container');

var renderer = new THREE.WebGLRenderer();
var camera = new THREE.PerspectiveCamera(view_angle, aspect, near, far);
camera.position.z = 300;
var scene = new THREE.Scene();
scene.add(camera);
renderer.setSize(width, height);
container.appendChild(renderer.domElement);

var radius = 50,
    segments = 16,
    rings = 16;

var sphereMaterial = new THREE.MeshLambertMaterial({color: 0xcc0000});
var sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, rings), sphereMaterial);
scene.add(sphere);

var pointLight = new THREE.PointLight(0xffffff);
pointLight.position.x = 10;
pointLight.position.y = 50;
pointLight.position.z = 130;
scene.add(pointLight);

renderer.render(scene, camera);

