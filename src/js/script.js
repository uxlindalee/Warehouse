import * as THREE from "../../lib/three.module.js";
import { OrbitControls } from "../../lib/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "../../lib/CSS2DRenderer.js";
import warehouseJson from "../../src/json/warehouse.json" assert { type: "json" };

// Loader
let warehouseData;
let warehouseRacks = [];
let labelRenderer;

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
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const light = new THREE.DirectionalLight(0xffffff, 0.3);
light.position.set(0, 10, 0);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.radius = 0;
light.shadow.camera.near = 0.1;
light.shadow.camera.far = 100;
scene.add(light);

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

	const tag = document.createElement("p");
	tag.className = "text-label";
	tag.textContent = "1";
	// for (let i = 0; i <= 6; i++) {
	// 	tag.textContent = i;
	// 	console.log(i);
	// }

	const tagLabel = new CSS2DObject(tag);
	tagLabel.position.set(x, json.height.length, z);
	boxGroup.add(tagLabel);

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
	const colorBoxes = new THREE.Group();
	colorBoxes.position.set(json.width.length * -1.75, y / 2 + h / 2, 0);
	// colorBoxes.position.set(x, y, z);
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
	let warehouseRacks = [];
	let warehouseBoxes = [];

	// createBox(boxInfos[0].width * 0.001, boxInfos[0].height * 0.001, boxInfos[0].depth * 0.001, boxInfos[0].width * -0.005, (boxInfos[0].height * 0.001) / 2, 0, boxInfos[0].color, boxInfos[0].name);
	// createBox(
	// 	boxInfos[1].width * 0.001,
	// 	boxInfos[1].height * 0.001,
	// 	boxInfos[1].depth * 0.001,
	// 	boxInfos[1].width * -0.003,
	// 	(boxInfos[1].height * 0.001) / 2,
	// 	(boxInfos[1].depth * 0.001) / 2,
	// 	boxInfos[1].color,
	// 	boxInfos[1].name
	// );
	// createBox(boxInfos[2].width * 0.001, boxInfos[2].height * 0.001, boxInfos[2].depth * 0.001, boxInfos[2].width * 0.001, (boxInfos[2].height * 0.001) / 2, 0, boxInfos[2].color, boxInfos[2].name);
	// createBox(boxInfos[3].width * 0.001, boxInfos[3].height * 0.001, boxInfos[3].depth * 0.001, boxInfos[3].width * 0.003, (boxInfos[3].height * 0.001) / 2, 0, boxInfos[3].color, boxInfos[3].name);
	// createBox(boxInfos[4].width * 0.001, boxInfos[4].height * 0.001, boxInfos[4].depth * 0.001, boxInfos[4].width * 0.005, (boxInfos[4].height * 0.001) / 2, 0, boxInfos[4].color, boxInfos[4].name);

	for (let i = 0; i < warehouseData.warehouse.length; i++) {
		const warehouseItem = warehouseData.warehouse[i];
		const matchingBox = boxInfos.find((item) => item.type === warehouseItem.box_type);
		let floor, rack, direction, number;
		let moveX, moveY, moveZ;

		if (matchingBox) {
			const idSplit = warehouseItem.id.split("-");
			floor = idSplit[0];
			rack = idSplit[1];
			direction = idSplit[2];
			number = idSplit[3];
			console.log(floor, rack, direction, number);

			let moveX = (json.width.reduce((a, b) => a + b, 0) / json.width.length) * rack * 0.001;
			let moveY = (json.height.reduce((a, b) => a + b, 0) / json.height.length) * floor - json.height[0];
			let moveZ = direction === "L" ? -((json.depth[0] * 0.001) / 2 + (elevator.width * 0.001) / 2 + boxGap * 2) : (json.depth[0] * 0.001) / 2 + (elevator.width * 0.001) / 2 + boxGap * 2;

			createBox(matchingBox.width * 0.001, matchingBox.height * 0.001, matchingBox.depth * 0.001, moveX + number / 5 + boxGap, moveY * 0.001, moveZ, matchingBox.color, matchingBox.name);
			// if (direction === "L") {
			// 	console.log('left');
			// } else {
			// 	console.log("right");
			// }

			// let spreadZ = matchRack.position.z;

			// const boxMesh = createBox(matchingBox.width / 1000, matchingBox.height / 1000, matchingBox.depth / 1000, 0, moveY, 0, matchingBox.color, matchingBox.name);
			// warehouseBoxes.push(boxMesh);
		}
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
// camera.lookAt(0, 0, 0);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false; // controls off
controls.enableKeys = false;
// controls.minZoom = 0;
// controls.maxZoom = 2;

// Renderer
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
});

labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(sizes.width, sizes.height);
document.body.appendChild(labelRenderer.domElement);

renderer.setSize(sizes.width, sizes.height);
renderer.setClearColor("#d0d0d0");

function animate() {
	requestAnimationFrame(animate);
	// scene.rotation.y += 0.005;

	controls.update();

	renderer.render(scene, camera);
	// labelRenderer.render(scene, camera);
}

requestAnimationFrame(animate);
