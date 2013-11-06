var ObjectLoader = THREE.ObjectLoader;
var DOWN = 40, UP = 38, RIGHT = 39, LEFT = 37, Z = 90, X = 88, C = 67, DEL = 46, R = 82, L = 76, SPACE = 32;
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
camera.position.z = 50;
camera.position.y = 10;
camera.rotation.x = -degreesToRadians(20);
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

var highlight_material = new THREE.MeshLambertMaterial({color: 0x1ba1e2});
var grey_material = new THREE.MeshLambertMaterial({color: 0xaaaaaa});
var caught_material = new THREE.MeshLambertMaterial({color: 0xff0000});

var loaded = {};

var thirty_deg = degreesToRadians(30);

function createAnim(prop, values, time, fn) {
  var obj = {};
  var initial_val = values.shift();
  obj[prop] = initial_val;
  var tween, prev_tween;
  var tweens = values.map(function(val) {
    var to_obj = {};
    to_obj[prop] = val;
    tween = new TWEEN.Tween(obj).to(to_obj, time).onUpdate(fn);
    if (prev_tween)
      prev_tween.chain(tween);
    return prev_tween = tween;
  });
  // cycle back to the beginning for a loop
  //tweens[tweens.length - 1].chain(tweens[0]);
  return tweens;
}

var is_healed = false;
var is_caught = false;
var game_over = false;
var is_winner = false;

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
  TWEEN.update();
  if (is_healed && !is_caught && !is_winner) {
    var jesus = loaded.Jesus[0];
    if (dist(jesus.position, origin) > 40) {
      is_winner = true;
      game_over = true;
      alert('You won!');
      window.location.reload();
    }
  }
}
render();

getElem('load').addEventListener('click', load);
function caught() {
  is_caught = true;
  loaded.pharisee.forEach(function(pharisee) {
    setMaterial(pharisee, caught_material);
  });
  setTimeout(function() {
    game_over = true;
    alert('Sorry, you lose.');
    window.location.reload();
  }, 2000);
}

document.addEventListener('keydown', function(evt) {
  var mult = window.event.shiftKey ? 0.5 : 1;
  var walk_speed = window.event.shiftKey ? 5 : 10;
  var jesus = loaded.Jesus[0];
  var green_guy = loaded['green guy'] && loaded['green guy'][0];
  if (!brick && evt.keyCode != C) return;
  switch(evt.keyCode) {
    case DOWN:
      if (!is_caught)
        walk(jesus, -walk_speed);
      break;
    case UP:
      if (!is_caught)
        walk(jesus, walk_speed);
      break;
    case LEFT:
      jesus.rotation.y += degreesToRadians(30);
      break;
    case RIGHT:
      jesus.rotation.y -= degreesToRadians(30);
      break;
    case SPACE:
      green_guy.rotation.x += degreesToRadians(90);
      green_guy.position.y += 3.33333333;
      is_healed = true;
      if (watchers.length)
        caught();
      break;
  }
});

function walk(brick, dist) {
  var to_obj = {
    'x': brick.position.x + Math.sin(brick.rotation.y) * dist,
    'z': brick.position.z + Math.cos(brick.rotation.y) * dist
  };

  var obj = {'x': brick.position.x, 'z': brick.position.z};
  var tween = new TWEEN.Tween(obj).to(to_obj, is_caught ? 200 : 800).onUpdate(function() {
    brick.position.x = this.x;
    brick.position.z = this.z;
  });
  tween.start();

  walkAnim(brick);
}

function walkAnim(brick) {
  createAnim('x', [0, thirty_deg, 0, -thirty_deg, 0, thirty_deg, 0, -thirty_deg, 0], is_caught ? 25 : 100, function() {
    var legs = [], arms = [];
    brick.children.forEach(function(obj) {
      var name = (obj.userData && obj.userData.name) || '';
      if (name.indexOf('leg') > -1)
        legs.push(obj);
      else if (name.indexOf('arm') > -1)
        arms.push(obj);
    });
    if (legs.length < 2) return;
    //console.log(legs[0] == brick.children[5]);
    //console.log(legs[0] == loaded.pharisee[1]['pharisee leg'], brick == loaded.pharisee[2]);
    legs[0].rotation.x = this.x;
    legs[1].rotation.x = -this.x;
    
    if (arms.length < 2) return;
    // divide by 2 because arms swing half as far
    arms[0].rotation.x = -this.x / 2;
    arms[1].rotation.x = this.x / 2;
  })[0].start();
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

function dist(pt1, pt2) {
  var delta_x = pt1.x - pt2.x;
  var delta_z = pt1.z - pt2.z;
  return Math.sqrt(delta_x * delta_x + delta_z * delta_z);
}

function degreesToRadians(deg) {
  return deg * Math.PI / 180;
}
function radiansToDegrees(rad) {
  return rad * 180 / Math.PI;
}

function angleBetweenPts(pt1, pt2) {
  var deltaX = pt2.x - pt1.x;
  var deltaZ = pt2.z - pt1.z;
  return Math.atan2(deltaX, deltaZ);
}

function load(callback) {
  var loader = new ObjectLoader();
  var name = $('input').val();
  loader.load('levels/' + name + '.json', function(obj) {
    // if (!group.children.length) {
    //   scene.remove(group);
    //   group = obj;
    //   scene.add(group);
    //   brick = obj.children[obj.children.length - 1];
    // }
    // else {
      group.add(obj);
      brick = obj;
    //}
    obj.userData = {'name': name};

    registerLoadedNames(obj);
    if (callback) callback();
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

var watchers = [];
var origin = {'x':0, 'z':0};
load(function() {
  loaded.pharisee.forEach(function(pharisee) {
    var movePharisee = function(pharisee) {
      var green_guy = loaded['green guy'][0];
      var jesus = loaded.Jesus[0];
      if (is_caught)
        pharisee.rotation.y = angleBetweenPts(pharisee.position, jesus.position);
      else if (pharisee.position.x > 30 || pharisee.position.z > 30)
        pharisee.rotation.y = angleBetweenPts(pharisee.position, origin);
      else
        pharisee.rotation.y += degreesToRadians(Math.random() * 180 - 90);
      
      var angle_to_green_guy = angleBetweenPts(pharisee.position, green_guy.position);
      var angle_diff = radiansToDegrees(pharisee.rotation.y - angle_to_green_guy);
      angle_diff = angle_diff % 360;
      if (angle_diff > 180)
        angle_diff -= 360;
      else if (angle_diff < -180)
        angle_diff += 360;

      var x_diff = Math.abs(pharisee.position.x - green_guy.position.x);
      var z_diff = Math.abs(pharisee.position.z - green_guy.position.z);
      if (angle_diff > -60 && angle_diff < 60 && x_diff < 20 && z_diff < 20)
        addToWatchers(pharisee);
      else
        removeFromWatchers(pharisee);
      
      //if (angle_diff < 60 && angle_diff > -60)
      walk(pharisee, 5);
      if (!game_over)
        setTimeout(movePharisee, is_caught ? 200 : 800);
    }.bind(null, pharisee);
    movePharisee();
  });
  loadFaces('Jesus', 'smile');
  loadFaces('pharisee', 'angry');
  loadFaces('green guy', 'grumpy');
});

function loadFaces(name, face_name) {
  var texture = THREE.ImageUtils.loadTexture('levels/face-' + face_name + '.jpg', {}, function() {
    //renderer.render(scene, camera);
  });
  texture.wrapS = THREE.RepeatWrapping;//texture.wrapT = THREE.ClampToEdgeWrapping;
  //texture.repeat.set(125, 125);
  //texture.offset.set(15, 15);
  texture.offset.x = degreesToRadians(name == 'pharisee' ? -90 : 90) / (2 * Math.PI);
  texture.needsUpdate = true;
  var sphereMaterial = new THREE.MeshLambertMaterial( { map: texture } );
  //var sphere = new THREE.Mesh(new THREE.Sphere(radius, segments, rings),sphereMaterial);
  loaded[name].forEach(function(obj) {
    obj.children.forEach(function(obj) {
      if (obj.geometry instanceof THREE.SphereGeometry) {
        obj.material = sphereMaterial;
      }
    });
  });
}

function addToWatchers(pharisee) {
  if (watchers.indexOf(pharisee) == -1) {
    watchers.push(pharisee);
    if (!is_caught)
      setMaterial(pharisee, highlight_material);
    if (is_healed && !is_caught)
      caught();
  }
}

function removeFromWatchers(pharisee) {
  var ix = watchers.indexOf(pharisee);
  if (ix > -1) {
    watchers.splice(ix, 1);
    if (!is_caught)
      setMaterial(pharisee, grey_material);
  }
}

// just goes 2 levels deep
function setMaterial(obj, material) {
  obj.children.forEach(function(obj) {
    if (obj.material) {
      if (!(obj.geometry instanceof THREE.SphereGeometry))
        obj.material = material;
    }
    else {
      obj.children.forEach(function(obj) {
        obj.material = material;
      });
    }
  });
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
