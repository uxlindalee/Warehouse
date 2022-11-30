import * as THREE from "../../lib/three.module.js";
import { OrbitControls } from "../../lib/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "../../lib/CSS2DRenderer.js";
import warehouseJson from "../../src/json/warehouse.json" assert { type: "json" };

// Loader
let warehouseData;
let warehouseRacks = [];
let warehouseBoxes = [];
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
	// setTimeout(getData, 50);
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
const axesHelper = new THREE.AxesHelper(5000);
scene.add(axesHelper);

// Object
let json = warehouseJson.sizes;
let boxRacks = warehouseJson.racks;
let shuttle = json.shuttle;
let elevator = json.elevator;
let boxGap = 50;

let positionX = 0;
let positionY = 0;
let positionZ = 0;

const buildWarehouse = function (d, h, w, x, y, z) {
	const boxGroup = new THREE.Group();
	// boxGroup.position.set(json.width.length * -1, 0, (json.depth.length + elevator.width / 2) * -0.3);
	boxGroup.position.set(0, 0, 0);
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
	// }

	const tagLabel = new CSS2DObject(tag);
	tagLabel.position.set(0, json.height.length, 0);
	boxGroup.add(tagLabel);

	const map = new THREE.TextureLoader().load("../src/images/tag.png");
	const material = new THREE.SpriteMaterial({ map: map });
	const sprite = new THREE.Sprite(material);

	sprite.scale.set(0.5, 0.5, 0.5);
	sprite.position.set(x, json.height.length, z);
	boxGroup.add(sprite);
	return box;
};

//Elevator
buildWarehouse(elevator.depth, elevator.height, elevator.width, -(json.width[0] + elevator.depth / 2), elevator.height / 2, elevator.width / 2 + boxGap * 2);

//Shuttle
buildWarehouse(shuttle.depth, shuttle.height, shuttle.width, -(json.width[0] + elevator.depth / 2), shuttle.height / 2, elevator.width / 2);

//Containers in rack
for (let k = 0; k < json.depth.length; k++) {
	for (let j = 0; j < json.height.length; j++) {
		for (let i = 0; i < json.width.length; i++) {
			if (i !== 0) {
				positionX += json.width[i] + boxGap;
			}
			const boxW = json.width[i];
			const boxH = json.height[j];
			const boxD = json.depth[k];
			const rack = buildWarehouse(boxD, boxH, boxW, positionX - json.width[i] / 2, positionY + json.height[j] / 2, positionZ - json.depth[k] / 2);
			warehouseRacks.push(rack);
		}
		positionX = 0;
		positionY += json.height[j] + boxGap;
	}
	positionY = 0;
	positionZ += json.depth[k] + elevator.width + boxGap * 4;
}

//Colored Boxes
const createBox = function (w, h, d, x, y, z, color, name) {
	const colorBoxes = new THREE.Group();
	// colorBoxes.position.set(x, y / json.height[0] + h / 2, 0);
	colorBoxes.position.set(0, 0, 0);
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
	const objs = [];
	const boxes = [];
	const meshes = [];

	for (let i = 0; i < warehouseData.warehouse.length; i++) {
		console.log(i);
		const warehouseItem = warehouseData.warehouse[i];
		const matchingBox = boxInfos.find((item) => item.type === warehouseItem.box_type);
		// let rackX = warehouseRacks[i].position.x;
		// let rackY = warehouseRacks[i].position.y;
		// let rackZ = warehouseRacks[i].position.z;

		let obj = {
			type: warehouseItem.box_type,
			floor: warehouseItem.floor,
			num: warehouseItem.id.split("-")[1],
			dir: warehouseItem.dir,
			cell: warehouseItem.id.split("-")[3],
		};

		objs.push(obj);

		// if (matchingBox) {
		// 	const idSplit = warehouseItem.id.split("-");
		// 	let floor = idSplit[0];
		// 	let rack = idSplit[1];
		// 	let direction = idSplit[2];
		//     let number = idSplit[3];

		// 	console.log(number);
		// 	if (matchingBox.type === "BLUE") {
		// 		[
		// 			createBox(
		// 				matchingBox.width,
		// 				matchingBox.height,
		// 				matchingBox.depth,
		// 				rackX - (json.width[5] / 2 - matchingBox.width / 2),
		// 				rackY - (json.height[0] / 2 - matchingBox.height / 2),
		// 				rackZ - (json.depth[0] / 2 - matchingBox.depth / 2) + boxGap * 1.5,
		// 				matchingBox.color,
		// 				matchingBox.name
		// 			),
		// 			createBox(
		// 				matchingBox.width,
		// 				matchingBox.height,
		// 				matchingBox.depth,
		// 				rackX - (json.width[5] / 2 - matchingBox.width / 2),
		// 				rackY - (json.height[0] / 2 - matchingBox.height / 2),
		// 				rackZ + (json.depth[0] / 2 - matchingBox.depth / 2) - boxGap * 1.5,
		// 				matchingBox.color,
		// 				matchingBox.name
		// 			),
		// 		];
		// 	} else {
		// 		createBox(
		// 			matchingBox.width,
		// 			matchingBox.height,
		// 			matchingBox.depth,
		// 			// rackX - (json.width[5] / 2 - matchingBox.width / 2) + (json.width[5] / 5 / 2) * number,
		// 			rackX - (json.width[5] / 2 - matchingBox.width / 2),
		// 			rackY - (json.height[0] / 2 - matchingBox.height / 2),
		// 			rackZ,
		// 			matchingBox.color,
		// 			matchingBox.name
		// 		);
		// 	}
		// }
	}

	for (let i = 0; i < objs.length; i++) {
		let width, height, depth, color, double, posZ, posY;

		switch (objs[i].type) {
			case boxInfos[0].type:
				width = boxInfos[0].width;
				height = boxInfos[0].height;
				depth = boxInfos[0].depth;
				color = boxInfos[0].color;
				double = boxInfos[0].double;
				break;
			case boxInfos[1].type:
				width = boxInfos[1].width;
				height = boxInfos[1].height;
				depth = boxInfos[1].depth;
				color = boxInfos[1].color;
				double = boxInfos[1].double;
				break;
			case boxInfos[2].type:
				width = boxInfos[2].width;
				height = boxInfos[2].height;
				depth = boxInfos[2].depth;
				color = boxInfos[2].color;
				double = boxInfos[2].double;
				break;
			case boxInfos[3].type:
				width = boxInfos[3].width;
				height = boxInfos[3].height;
				depth = boxInfos[3].depth;
				color = boxInfos[3].color;
				double = boxInfos[3].double;
				break;
			case boxInfos[4].type:
				width = boxInfos[4].width;
				height = boxInfos[4].height;
				depth = boxInfos[4].depth;
				color = boxInfos[4].color;
				double = boxInfos[4].double;
				break;

			default:
				color = `fff`;
		}

		if (objs[i].dir === "L") {
			posZ = 0; //박스 중간점===depth
		} else {
			posZ = 0;
		}

		if (objs[i].floor === 1) {
			posY = height / 2;
		} else if (objs[i] === 2) {
			posY = height / 2 + 500 + 100;
		} else {
			posY = height / 2 + 500 * 2 + 100 * 2;
		}

		// let posX = (racksDepth[objs[i].rackNum - 1] / rackCell) * objs[i].array - (racksDepth[objs[i].rackNum - 1] / rackCell) * 0.5 + racksDepth[0] * (objs[i].rackNum - 1) + racksGap * objs[i].rackNum;
		let posX = 0;
		if (objs[i].type !== "N") {
			let box = {
				geometry: new THREE.BoxGeometry(width, height, depth),
				material: new THREE.MeshStandardMaterial({ color: `#${color}` }),
				posX,
				posY,
				posZ,
			};
			boxes.push(box);
		}
	}

	for (let i = 0; i < boxes.length; i++) {
		let mesh = new THREE.Mesh(boxes[i].geometry, boxes[i].material);
		scene.add(mesh);
		meshes.push(mesh);
	}
};

// let moveX = (json.width.reduce((a, b) => a + b, 0) / json.width.length) * rack * 0.001 + boxGap;

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
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 10, 1000000);
camera.position.set(20000, 10000, -20000);
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
