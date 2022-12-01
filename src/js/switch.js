import * as THREE from "../../lib/three.module.js";
import { OrbitControls } from "../../lib/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "../../lib/CSS2DRenderer.js";
import warehouseJson from "../json/warehouse.json" assert { type: "json" };

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
let shuttle = json.shuttle;
let elevator = json.elevator;
let boxGap = 50;

let positionX = 0;
let positionY = 0;
let positionZ = 0;

const boxGroup = new THREE.Group();
boxGroup.position.set(-(json.width.reduce((a, b) => a + b, 0) / 2), 0, 0);
scene.add(boxGroup);

const buildWarehouse = function (d, h, w, x, y, z) {
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
	tag.textContent = `${(Math.round(x / json.width[0]) * 100) / 100}`;

	const tagLabel = new CSS2DObject(tag);
	tagLabel.position.set(x, (json.height.length + 2) * json.height[0], z);
	boxGroup.add(tagLabel);

	const liftTag = document.createElement("p");
	liftTag.className = "text-label";
	liftTag.textContent = "Shuttle lift";

	const liftLabel = new CSS2DObject(liftTag);
	liftLabel.position.set(x / x + elevator.width / -2, (json.height.length + 3) * json.height[0], z / z);
	boxGroup.add(liftLabel);

	const leftTag = document.createElement("p");
	leftTag.className = "lr-label";
	leftTag.textContent = "L";

	const leftLabel = new CSS2DObject(leftTag);
	leftLabel.position.set((x / x) * json.width.reduce((a, b) => a + b, 0) + elevator.width / 2, 0, z / z + elevator.width / 2 + json.depth[0] / 2) + boxGap * 4;
	boxGroup.add(leftLabel);

	const rightTag = document.createElement("p");
	rightTag.className = "lr-label";
	rightTag.textContent = "R";

	const rightLabel = new CSS2DObject(rightTag);
	rightLabel.position.set((x / x) * json.width.reduce((a, b) => a + b, 0) + elevator.width / 2, 0, z / z - elevator.width / 2 - json.depth[0] / 2) - boxGap * 4;
	boxGroup.add(rightLabel);

	// const map = new THREE.TextureLoader().load("../src/images/tag.png");
	// const material = new THREE.SpriteMaterial({ map: map });
	// const sprite = new THREE.Sprite(material);

	// sprite.scale.set(500, 500, 500);
	// sprite.position.set(x, (json.height.length + 1) * json.height[0], z);
	// boxGroup.add(sprite);
	// return box;
};

//Elevator
buildWarehouse(elevator.depth, elevator.height, elevator.width, -(elevator.depth / 2), elevator.height / 2, 0);

//Shuttle
buildWarehouse(shuttle.depth, shuttle.height, shuttle.width, -(elevator.depth / 2), shuttle.height / 2, 0);

//Containers in rack
for (let k = 0; k < json.depth.length; k++) {
	for (let j = 0; j < json.height.length; j++) {
		for (let i = 0; i < json.width.length; i++) {
			if (i === 0) positionX = 0;
			if (i !== json.width.length) {
				positionX += json.width[i] + boxGap;
			}
			const boxW = json.width[i];
			const boxH = json.height[j];
			const boxD = json.depth[k];
			const rack = buildWarehouse(boxD, boxH, boxW, positionX - json.width[i] / 2, positionY + json.height[j] / 2, positionZ - json.depth[k] / 2 - elevator.width / 2 - boxGap * 2);
			warehouseRacks.push(rack);
		}
		positionX = 0;
		positionY += json.height[j] + boxGap;
	}
	positionY = 0;
	positionZ += json.depth[k] + elevator.width + boxGap * 4;
}

const getBoxes = function () {
	let boxInfos = warehouseJson.box_infos; //5
	const objs = [];
	const boxes = [];
	const meshes = [];

	let racksWidth = warehouseJson.sizes.width;
	let racksTotalWidth = racksWidth.reduce((a, b) => a + b, 0);
	let racksHeight = warehouseJson.sizes.height;
	let racksDepth = warehouseJson.sizes.depth;
	let elevatorWidth = warehouseJson.sizes.elevator.width;

	for (let i = 0; i < warehouseData.warehouse.length; i++) {
		const warehouseItem = warehouseData.warehouse[i];
		const matchingBox = boxInfos.find((item) => item.type === warehouseItem.box_type);

		let obj = {
			type: warehouseItem.box_type,
			floor: warehouseItem.floor,
			num: warehouseItem.id.split("-")[1],
			dir: warehouseItem.dir,
			cell: warehouseItem.id.split("-")[3],
		};

		objs.push(obj);
	}

	for (let i = 0; i < objs.length; i++) {
		let width, height, depth, color, double, posX, posY, posZ;

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
			posZ = -(elevatorWidth / 2 + boxGap * 2 + racksDepth[0] / 2);
		} else {
			posZ = elevatorWidth / 2 + boxGap * 2 + racksDepth[0] / 2;
		}
		if (double == true) {
			posZ = posZ + depth / 2;
			// posZ[1] = -(posZ + depth / 2);
		}

		if (objs[i].floor === "1") {
			posY = height / 2;
		} else if (objs[i].floor === "2") {
			posY = height / 2 + racksHeight[0] + boxGap;
		} else {
			posY = height / 2 + racksHeight[0] * 2 + boxGap * 2;
		}

		posX = racksWidth[0] * objs[i].num - 1 + (racksWidth[0] / 5 - boxGap) * objs[i].cell - boxGap * 2;

		if (objs[i].type !== "N") {
			let box = {
				geometry: new THREE.BoxGeometry(width, height, depth),
				material: new THREE.MeshStandardMaterial({ color: `#${color}` }),
				posX: posX - (racksWidth[0] - width / 2),
				posY,
				posZ,
			};
			boxes.push(box);
		}
	}

	for (let i = 0; i < boxes.length; i++) {
		let mesh = new THREE.Mesh(boxes[i].geometry, boxes[i].material);
		mesh.position.set(boxes[i].posX, boxes[i].posY, boxes[i].posZ);
		boxGroup.add(mesh);
		meshes.push(mesh);
	}
};

// Camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 10, 1000000);
camera.position.set(20000, 10000, -20000);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false; // controls off
controls.enableKeys = false;
// controls.minZoom = 0;
// controls.maxZoom = 2;

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	labelRenderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

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
	scene.rotation.y += 0.002;

	controls.update();

	renderer.render(scene, camera);
	labelRenderer.render(scene, camera);
}

requestAnimationFrame(animate);
