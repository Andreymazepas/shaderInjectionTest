import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'dat.gui';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);

const matcapMaterial = new THREE.MeshMatcapMaterial({
  matcap: new THREE.TextureLoader().load('qaajfu295li81.jpg'),
});

matcapMaterial.onBeforeCompile = (shader) => {
  const uniforms = shader.uniforms;
  uniforms.time = { value: 0.0 };
  uniforms.width = { value: 20.0 };
  uniforms.height = { value: 4.0 };
  uniforms.speed = { value: 1.0 };

  shader.vertexShader = `
    varying vec2 vUv;
    uniform float time;
    uniform float width;
    uniform float height;
    uniform float speed;

    ${shader.vertexShader.replace(
      'vViewPosition = - mvPosition.xyz;',
      `
      vUv = uv;
      vec2 center = vec2(0.5, 0.5);
      float distance = length(vUv - center);
      float rippleAmount = sin(distance * width - time * speed) * height;
      vec3 newPosition = position + vec3(0.0, 0.0, rippleAmount);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      vViewPosition = vec3(-mvPosition.x , -mvPosition.y * rippleAmount, -mvPosition.z);
    `
    )}
  `;
  matcapMaterial.userData.shader = shader;
};
matcapMaterial.customProgramCacheKey = () => 'matcapMaterial';

const planeGeometry = new THREE.PlaneGeometry(100, 100, 25, 25);
const plane = new THREE.Mesh(planeGeometry, matcapMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -10;
scene.add(plane);

camera.position.z = 40;
camera.position.y = 100;
scene.add(new THREE.AmbientLight(0x404040));

const gui = new GUI();
let addedToGUI = false;

const animate = () => {
  requestAnimationFrame(animate);

  plane.rotation.z += 0.005;
  controls.update();

  if (matcapMaterial.userData.shader) {
    const shaderUniforms = matcapMaterial.userData.shader.uniforms;

    shaderUniforms.time.value += 0.05;

    if (!addedToGUI) {
      gui.add(shaderUniforms.width, 'value', 0, 100).name('Width');
      gui.add(shaderUniforms.height, 'value', 0, 20).name('Height');
      gui.add(shaderUniforms.speed, 'value', 0, 5).name('Speed');
      gui.add(matcapMaterial, 'flatShading').onChange(() => {
        matcapMaterial.needsUpdate = true;
      });
      addedToGUI = true;
    }
  }

  renderer.render(scene, camera);
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
