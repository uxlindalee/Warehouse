import * as THREE from "../../lib/three.module.js";
import { OrbitControls } from "../../lib/OrbitControls.js";
import warehouseJson from "../../src/json/warehouse.json" assert { type: "json" };

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Sizes
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

// Loader
const loader = new THREE.FileLoader();
loader.load("../../src/json/warehouse.json", function getData() {
	if (window.warehouseDataGenerator) {
		warehouseDataGenerator.getData();
	}
});

window.dataCallback = function (data) {
	if (data) {
		let warehouse = data.warehouse;
		let shuttle = data.shuttle;
	}
	// setTimeout(getData,50)
};

//Group
const boxGroup = new THREE.Group();
scene.add(boxGroup);

// Axes Helper
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Object

let boxSizes = warehouseJson.sizes;
let boxRacks = warehouseJson.racks;
let boxShuttles = warehouseJson.shuttles;
let boxInfos = warehouseJson.box_infos;

let positionX = 0;
let positionY = 0;
let positionZ = 0;

// Object
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshBasicMaterial({
	color: "#ff0000",
	transparent: true,
	opacity: 0.5,
});
const box = new THREE.Mesh(boxGeometry, boxMaterial);

const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: "#bbb", linewidth: 10 }));
wireframe.renderOrder = 1;
box.add(wireframe);
box.opacity = 0.5;
box.castShadow = true;
boxGroup.add(box);

for (let h = 0; h < boxSizes.height.length; h++) {
	positionY += boxSizes.height[h] * 0.0001 + 0.7;
	// positionZ = h > 0 ? (positionZ = boxShuttles.width + boxSizes.depth[h] / 2) : -(boxShuttles.width + boxSizes.depth[h] / 2);
	for (let i = 0; i < boxSizes.width.length; i++) {
		console.log(positionX);
		box.scale.set(boxSizes.width[i] * 0.001, boxSizes.height[0] * 0.001, boxSizes.depth[0] * 0.001);

		// box.position.set(0, 0, 0);
		box.position.set(positionX, positionY, 0);
		positionX += boxSizes.width[i] * 0.0001;
		boxGroup.add(box);
	}
}

// Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(10, 5, -10);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Renderer
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setClearColor("#d0d0d0");

function animate() {
	requestAnimationFrame(animate);

	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();
	renderer.render(scene, camera);
}

requestAnimationFrame(animate);
