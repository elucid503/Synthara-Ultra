import * as THREE from "https://cdn.skypack.dev/three@0.136.0";

let SEPARATION = 100, AMOUNTX = 100, AMOUNTY = 100;

let camera, scene, renderer;

let particles, count = 0;

let mouseX = 0; //eslint-disable-line
let mouseY = 0; //eslint-disable-line

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {

  let container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);

  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 1500;

  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x2b2b2b);
  let numParticles = AMOUNTX * AMOUNTY;

  let positions = new Float32Array(numParticles * 3);
  let scales = new Float32Array(numParticles);

  let i = 0, j = 0;

  for (let ix = 0; ix < AMOUNTX; ix++) {
    
    for (let iy = 0; iy < AMOUNTY; iy++) {

      positions[i] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2; // x
      positions[i + 1] = 0; // y
      positions[i + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2; // z

      scales[j] = 1;
      i += 3;
      j++;
      
    }

  }

  let geometry = new THREE.BufferGeometry();

  geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.addAttribute("scale", new THREE.BufferAttribute(scales, 1));
  
  let material = new THREE.ShaderMaterial({
    uniforms: {
      color: {
        value: new THREE.Color(0xffffff)
      }
    },

    vertexShader: document.getElementById("vertexshader").textContent,
    fragmentShader: document.getElementById("fragmentshader").textContent

  });
  
  particles = new THREE.Points(geometry, material);
  scene.add(particles);
  particles.rotation.x = 1000;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  document.addEventListener("mousemove", onDocumentMouseMove, false);
  document.addEventListener("touchstart", onDocumentTouchStart, false);
  document.addEventListener("touchmove", onDocumentTouchMove, false);
  window.addEventListener("resize", onWindowResize, false);

}

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
}

function onDocumentMouseMove(event) {

  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
  
}

function onDocumentTouchStart(event) {

    if (event.touches.length === 1) {
      
        mouseX = event.touches[0].pageX - windowHalfX;
        mouseY = event.touches[0].pageY - windowHalfY;
        
    }
}

function onDocumentTouchMove(event) {

    if (event.touches.length === 1) {
      
        event.preventDefault();  
        mouseX = event.touches[0].pageX - windowHalfX;   
        mouseY = event.touches[0].pageY - windowHalfY;
        
    }
    
}

function animate() {

    requestAnimationFrame(animate);
    render();
    
}

function render() {

    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    
    let positions = particles.geometry.attributes.position.array;
    
    let scales = particles.geometry.attributes.scale.array;
    
    let i = 0, j = 0;
    
    for (let ix = 0; ix < AMOUNTX; ix++) {

        for (let iy = 0; iy < AMOUNTY; iy++) {

            positions[i + 1] =
                Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50;
            scales[j] =
                (Math.sin((ix + count) * 0.3) + 1) * 8 +
                (Math.sin((iy + count) * 0.5) + 1) * 8;
            i += 3;
            j++;

        }

    }

    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.scale.needsUpdate = true;
    renderer.render(scene, camera);
    
    count += 0.02;
    
}

$("#docs").on("click", () => {

  window.open("https://synthara.xyz/api/docs");

});

$("#website").on("click", () => {

  window.open("https://synthara.xyz/ultra");

});

$("#discord").on("click", () => {

  window.open("https://discord.gg/xTqs3Q7nbx");

});