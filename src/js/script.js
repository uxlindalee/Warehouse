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

window.warehouseDataGenerator.getData();

//Group

// Axes Helper
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Object

let boxSizes = warehouseJson.sizes;
let boxRacks = warehouseJson.racks;
let shuttle = boxSizes.shuttle;
let elevator = boxSizes.elevator;
let boxInfos = warehouseJson.box_infos;

let positionX = 0;
let positionY = 0;
let positionZ = 0;

const buildWarehouse = function (d, h, w, x, y, z) {
	const boxGroup = new THREE.Group();

	// boxGroup.position.set(-5.8, 0, -1.15);
	// boxGeometry.computeBoundingBox();

	scene.add(boxGroup);

	const boxGeometry = new THREE.BoxGeometry(w, h, d);
	const boxMaterial = new THREE.MeshBasicMaterial({
		color: "#ffffff",
		transparent: true,
		opacity: 0.5,
	});
	const box = new THREE.Mesh(boxGeometry, boxMaterial);
	const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: "#bbb", linewidth: 10 }));
	wireframe.renderOrder = 1;
	box.add(wireframe);
	box.opacity = 0.5;
	box.castShadow = true;
	box.position.set(x, y, z);
	boxGroup.add(box);
};

//Elevator
buildWarehouse(elevator.depth * 0.001, elevator.height * 0.001, elevator.width * 0.001, -(elevator.width * 0.001) / 2, (elevator.height * 0.001) / 2, 0);
// buildWarehouse(elevator.depth * 0.001, elevator.height * 0.001, elevator.width * 0.001, 0, 0, 0);

//Shuttle
buildWarehouse(shuttle.depth * 0.001, shuttle.height * 0.001, shuttle.width * 0.001, -(shuttle.width * 0.001) / 2, (shuttle.height * 0.001) / 2, 0);

//Containers in rack
for (let k = 0; k < boxSizes.depth.length; k++) {
	for (let j = 0; j < boxSizes.height.length; j++) {
		for (let i = 0; i < boxSizes.width.length; i++) {
			if (i !== 0) {
				positionX += boxSizes.width[i] * 0.001 + 0.05;
			}
			const boxW = boxSizes.width[i] * 0.001;
			const boxH = boxSizes.height[j] * 0.001;
			const boxD = boxSizes.depth[k] * 0.001;

			buildWarehouse(boxD, boxH, boxW, positionX - (boxSizes.width[i] * 0.001) / 2, positionY + (boxSizes.height[j] * 0.001) / 2, positionZ - (boxSizes.depth[k] * 0.001) / 2);
		}
		positionX = 0;
		positionY += boxSizes.height[j] * 0.001 + 0.05;
	}
	positionY = 0;
	positionZ += boxSizes.depth[k] * 0.001 * 2 + shuttle.width * 0.001;
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
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(-20, 10, 20);

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
