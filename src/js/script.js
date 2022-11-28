import * as THREE from "../../lib/three.module.js";
import { OrbitControls } from "../../lib/OrbitControls.js";
import warehouseJson from "../../src/json/warehouse.json" assert { type: "json" };

// Loader
let warehouseData;

function getData() {
	if (window.warehouseDataGenerator) {
		warehouseDataGenerator.getData();
	}
}
window.dataCallback = function (data) {
	if (data) {
		warehouseData = data;
		getBoxes();
	}
	// setTimeout(getData,50)
};
window.warehouseDataGenerator.getData();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Sizes
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

// Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

// Axes Helper
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Object
let json = warehouseJson.sizes;
let boxRacks = warehouseJson.racks;
let shuttle = json.shuttle;
let elevator = json.elevator;
let boxGap = 0.05;

let positionX = 0;
let positionY = 0;
let positionZ = 0;

const buildWarehouse = function (d, h, w, x, y, z) {
	const boxGroup = new THREE.Group();
	boxGroup.position.set(json.width.length * -1, 0, (json.depth.length + (elevator.width * 0.001) / 2) * -0.3);
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

	// const tag = document.createElement('.text-label');
	const map = new THREE.TextureLoader().load("../src/images/tag.png");
	const material = new THREE.SpriteMaterial({ map: map });
	const sprite = new THREE.Sprite(material);

	sprite.scale.set(0.5, 0.5, 0.5);
	sprite.position.set(x, json.height.length, z);
	boxGroup.add(sprite);
};

//Elevator
buildWarehouse(
	elevator.depth * 0.001,
	elevator.height * 0.001,
	elevator.width * 0.001,
	-(json.width[0] * 0.001 + (elevator.width * 0.001) / 2),
	(elevator.height * 0.001) / 2,
	(elevator.width * 0.001) / 2 + 0.15
);

//Shuttle
buildWarehouse(
	shuttle.depth * 0.001,
	shuttle.height * 0.001,
	shuttle.width * 0.001,
	-(json.width[0] * 0.001 + (elevator.width * 0.001) / 2),
	(shuttle.height * 0.001) / 2,
	(elevator.width * 0.001) / 2 + 0.15
);

//Containers in rack
for (let k = 0; k < json.depth.length; k++) {
	for (let j = 0; j < json.height.length; j++) {
		for (let i = 0; i < json.width.length; i++) {
			if (i !== 0) {
				positionX += json.width[i] * 0.001 + boxGap;
			}
			const boxW = json.width[i] * 0.001;
			const boxH = json.height[j] * 0.001;
			const boxD = json.depth[k] * 0.001;
			buildWarehouse(boxD, boxH, boxW, positionX - (json.width[i] * 0.001) / 2, positionY + (json.height[j] * 0.001) / 2, positionZ - (json.depth[k] * 0.001) / 2);
		}
		positionX = 0;
		positionY += json.height[j] * 0.001 + boxGap;
	}
	positionY = 0;
	positionZ += json.depth[k] * 0.001 * 2 + shuttle.width * 0.001;
}

//Colored Boxes
const createBox = function (w, h, d, x, y, z, color, name) {
	console.log(x);
	const colorBoxes = new THREE.Group();
	scene.add(colorBoxes);

	const item = new THREE.Mesh(
		new THREE.BoxGeometry(w, h, d),
		new THREE.MeshStandardMaterial({
			color: `#${color}`,
		})
	);

	item.position.set(x, y, z);
	item.name = name;
	colorBoxes.add(item);
	return item;
};

const getBoxes = function () {
	let boxInfos = warehouseJson.box_infos; //5

	// createBox(boxInfos[0].width * 0.001, boxInfos[0].height * 0.001, boxInfos[0].depth * 0.001, 0, 0, 0, boxInfos[0].color, boxInfos[0].name);

	for (let i = 0; i < warehouseData.warehouse.length; i++) {
		const warehouseItem = warehouseData.warehouse[i];
		const matchingInfo = boxInfos.find((item) => item.type === warehouseItem.box_type);
		let floor, rack, direction, number;

		if (matchingInfo) {
			const idSplit = warehouseItem.id.split("-");
			floor = idSplit[0];
			rack = idSplit[1];
			direction = idSplit[2];
			number = idSplit[3];
			console.log(floor, rack, direction, number);

			let rackX = warehouseJson.sizes.width;
			let totalW = rackX.reduce((a, b) => a + b, 0);
			console.log(totalW);

			createBox(matchingInfo.width * 0.001, matchingInfo.height * 0.001, matchingInfo.depth * 0.001, (totalW * 0.001) / 6, (floor * 0.001) / 2, number, matchingInfo.color, matchingInfo.name);
		}

		// if (warehouseItem.dir === "L") {
		// 	console.log("left");
		// } else {
		// 	console.log("right");
		// }
	}
};

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
camera.position.set(20, 10, -20);
camera.lookAt(0, 0, 0);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false; // controls off
controls.enableKeys = false;
controls.minZoom = 0;
controls.maxZoom = 2;

// Renderer
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setClearColor("#d0d0d0");

function animate() {
	requestAnimationFrame(animate);
	// scene.rotation.y += 0.005;

	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();
	renderer.render(scene, camera);
}

requestAnimationFrame(animate);
