var ObjectExporter = THREE.ObjectExporter;
var ObjectLoader = THREE.ObjectLoader;
var DOWN = 40, UP = 38, RIGHT = 39, LEFT = 37, Z = 90, X = 88, C = 67, DEL = 46, R = 82, L = 76;
var types = {
  'Brick (2x4)': [4, 2],
  'Half Brick (2x2)': [2, 2],
  'Double (1x2)': [1, 2],
  'Single (1x1)': [1, 1],
  '1x3': [3, 1],
  '1x4': [4, 1],
  '1x6': [6, 1],
  '1x8': [8, 1],
  '1x12': [12, 1],
  '1x16': [16, 1],
  '2x3': [3, 2],
  '2x4': [4, 2],
  '2x6': [6, 2],
  '2x8': [8, 2],
  '2x12': [12, 2],
  '2x16': [16, 2],
  'Circle 1x1': [1, 1],
  'Circle 2x2': [2, 2],
  'Sphere 1x1': [1, 1],
  'Sphere 2x2': [2, 2]
};
var thin_height = 0.3333;

var header_padding = 3;
var width = window.innerWidth, height = window.innerHeight - getElem('header').clientHeight - header_padding * 2;
var view_angle = 45,
    aspect = width / height,
    near = 0.1,
    far = 10 * 1000;
var container = document.getElementById('container');
var prev_brick, brick;

// antialiasing may default to true if available
var renderer = new THREE.WebGLRenderer({antialiasing: true});
renderer.setClearColor(0xFFFFFF, 1);
var camera = new THREE.PerspectiveCamera(view_angle, aspect, near, far);
camera.position.z = 30;
var scene = new THREE.Scene();
scene.add(camera);
renderer.setSize(width, height);
container.appendChild(renderer.domElement);
var group = new THREE.Object3D();
scene.add(group);

var pointLight = new THREE.PointLight(0xffffff);
pointLight.position.x = 50;
pointLight.position.y = 20;
pointLight.position.z = 130;
scene.add(pointLight);

var light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);

var controls = new THREE.OrbitControls(camera, renderer.domElement);
//var controls = new THREE.EditorControls(group, renderer.domElement);

scene.add(buildAxes(1000));

var loaded = {};

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
  controls.update();
}
render();

// prevent arrow keys from unintentionally changing the menu
getElem('color').addEventListener('change', function() {
  getElem('color').blur();
});
getElem('type').addEventListener('type', function() {
  getElem('type').blur();
});
getElem('thin').addEventListener('thin', function() {
  getElem('thin').blur();
});

getElem('create').addEventListener('click', create);
getElem('save').addEventListener('click', save);
getElem('load').addEventListener('click', load);

document.addEventListener('keydown', function(evt) {
  var mult = 1;
  if (window.event.shiftKey)
    mult = (evt.keyCode == DOWN || evt.keyCode == UP) ? thin_height : 0.5;

  if (!brick && evt.keyCode != C) return;
  switch(evt.keyCode) {
    case DOWN:
      brick.position.y -= 1 * mult;
      break;
    case UP:
      brick.position.y += 1 * mult;
      break;
    case LEFT:
      brick.position.x -= 1 * mult;
      break;
    case RIGHT:
      brick.position.x += 1 * mult;
      break;
    case Z:
      brick.position.z += 1 * mult;
      break;
    case X:
      brick.position.z -= 1 * mult;
      break;
    case C:
      create();
      break;
    case DEL:
      remove();
      break;
    case R:
      brick.rotation.y += degreesToRadians(30);
      if (brick.rotation.y > degreesToRadians(360))
        brick.rotation.y -= degreesToRadians(360);
      break;
    case L:
      brick.rotation.x += degreesToRadians(90);
      break;
  }
});

getElem('rotate').addEventListener('click', function() {
  if (!brick) return;
  brick.rotation.y += degreesToRadians(90);
  
  // b/c it rotates around the center and the center might not snap...
  // TODO: it'd be much simpler to have a snap(brick) function!
  brick.position.x += brick.geometry.depth / 2;
  brick.position.x -= brick.geometry.width / 2;
  brick.position.z += brick.geometry.width / 2;
  brick.position.z -= brick.geometry.depth / 2;
});

function create() {
  //var material = new THREE.MeshBasicMaterial({color: 0x00ff00});
  var material = new THREE.MeshLambertMaterial({color: parseInt(val('color'), 16)});
  var type = val('type');
  var width = types[type][0];
  var depth = types[type][1];
  var is_thin = val('thin') == 'Thin';
  var height = is_thin ? thin_height : 1;

  prev_brick = brick;
  if (type.indexOf('Circle') > -1)
    brick = new THREE.Mesh(new THREE.CylinderGeometry(width/2, width/2, height, 16), material);
  else if (type.indexOf('Sphere') > -1)
    brick = new THREE.Mesh(new THREE.SphereGeometry(width/2, 8, 6), material);
  else
    brick = new THREE.Mesh(new THREE.CubeGeometry(width, height, depth), material);
  group.add(brick);

  if (is_thin)
    brick.is_thin = true;

  // give it a little nicer initial position, based on prev brick
  if (prev_brick) {
    brick.position.x = prev_brick.position.x;
    brick.position.y = prev_brick.position.y;
    brick.position.z = prev_brick.position.z;
  }
  else {
    brick.position.x -= 2;
    brick.position.y -= 2;
  }

  snap(brick);
}

function getWidth(brick) {
  var geo = brick.geometry;
  return geo.width || (geo.radiusTop || geo.radius) * 2;
}
function getDepth(brick) {
  var geo = brick.geometry;
  return geo.depth || (geo.radiusTop || geo.radius) * 2;
}

function remove() {
  group.remove(brick);
}

function snap(brick) {
  var center = brick.position;

  var delta_x = getWidth(brick) / 2;
  center.x = Math.round(center.x - delta_x) + delta_x;

  var delta_y = (brick.geometry.height / 2) || brick.geometry.radius;
  center.y = Math.round(center.y - delta_y) + delta_y;

  var delta_z = getDepth(brick) / 2;
  center.z = Math.round(center.z - delta_z) + delta_z;
}

function val(elem_id) {
  var elem = getElem(elem_id);
  var value = elem.options[elem.selectedIndex].value;
  return value;
}

function getElem(elem_id) {
  return document.getElementById(elem_id);
}

function degreesToRadians(deg) {
  return deg * Math.PI / 180;
}

function save() {
  var exporter = new ObjectExporter();
  var data = exporter.parse(group);
  $.ajax({
    'url': $('input').val(),
    'type': 'POST',
    'dataType': 'json',
    'data': JSON.stringify(data),
    'success': function() {
      alert('success!');
    }
  });
}

function load() {
  var loader = new ObjectLoader();
  var name = $('input').val();
  loader.load('/levels/' + name + '.json', function(obj) {
    if (!group.children.length) {
      scene.remove(group);
      group = obj;
      scene.add(group);
      brick = obj.children[obj.children.length - 1];
    }
    else {
      group.add(obj);
      brick = obj;
    }
    obj.userData = {'name': name};

    registerLoadedNames(obj);
  });
}

function registerLoadedNames(obj) {
  var name = obj.userData && obj.userData.name;
  if (name) {
    if (!loaded[name])
      loaded[name] = [];
    loaded[name].push(obj);
  }
  if (obj.children)
    obj.children.forEach(registerLoadedNames);
}

// TODO:
// - Fix color (I increased the ambient lighting, but it just made the colors washed out)
// - Stop the animation (but not abruptly, let it run its course to the end, but stop chaining - remove the repeat?)
// - Run the animation while moving the character w/ tweening/easing in response to a keystroke

// might want to show seams between bricks or texture or something

// You could go from building things (planes, boats, dragons, castles)
// to populating a world with these things...

// And it would be really cool to add scripts for these objects to animate them
// and make them react to events in their environment...

// Add scripts to randomly place trees... rivers... mountains...
// Or Streets? Buildings? Castles? Just how sci-fi do we want to go? Flying cars?

// light = new THREE.HemisphereLight( 0xfffff0, 0x101020, 1.25 );
// light.position.set( 0.75, 1, 0.25 );
// scene.add( light );



// from http://soledadpenades.com/articles/three-js-tutorials/drawing-the-coordinate-axes/
function buildAxes(length) {
  var axes = new THREE.Object3D();
  axes.add(buildAxis(new THREE.Vector3(length, 0, 0), 0xFF0000)); // +X
  axes.add(buildAxis(new THREE.Vector3(-length, 0, 0), 0xFF0000)); // -X
  axes.add(buildAxis(new THREE.Vector3(0, length, 0), 0x00FF00)); // +Y
  axes.add(buildAxis(new THREE.Vector3(0, -length, 0), 0x00FF00)); // -Y
  axes.add(buildAxis(new THREE.Vector3(0, 0, length), 0x0000FF)); // +Z
  axes.add(buildAxis(new THREE.Vector3(0, 0, -length), 0x0000FF)); // -Z
  return axes;
}

function buildAxis(dst, colorHex) {
  var src = new THREE.Vector3(0, 0, 0),
    geom = new THREE.Geometry(),
    mat = new THREE.LineBasicMaterial({linewidth: 3, color: colorHex});
  geom.vertices.push(src.clone());
  geom.vertices.push(dst.clone());
  return new THREE.Line(geom, mat, THREE.LinePieces);
}
