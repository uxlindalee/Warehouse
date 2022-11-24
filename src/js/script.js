import * as THREE from "../../lib/three.module.js";
import { OrbitControls } from "../../lib/OrbitControls.js";



// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}


// let boxGeometries = [];


// const Trees = new THREE.Group()
// scene.add(Trees)

// const treeGeometry = new THREE.ConeGeometry(0.7, 3, 4)
// const treeMaterial = new THREE.MeshStandardMaterial({ color: "#042d16" });

// for (let i = 0; i < 100; i++){
//   const angle = Math.random() * Math.PI * 2 
//   const radius = 5 + Math.random() * 10
//   const x = Math.sin(angle) * radius
//   const z = Math.cos(angle) * radius

//   const tree = new THREE.Mesh(treeGeometry, treeMaterial)
//     // const tree = tombstone;
//   tree.position.set(x, 0.9, z)
//   tree.rotation.y = (Math.random() - 0.5) * 0.4
//   tree.rotation.z = (Math.random() - 0.5) * 0.4
//   tree.castShadow = true
//   Trees.add(tree)
// }

const boxGroup = new THREE.Group()
scene.add(boxGroup)


// Loader
const loader = new THREE.FileLoader();
loader.load(
    "../src/json/warehouse.json",
    function getData(){
        if(window.warehouseDataGenerator){
            warehouseDataGenerator.getData();
        }
    }
);

window.dataCallback = function (data) {
    if (data) {
        let warehouse = data.warehouse;
        let shuttle = data.shuttle;
    
        console.log(warehouse)

  
        
        for (let i = 0; i < warehouse.length; i++){
            console.log(sizes.width, sizes.height)
            const boxGeometry = new THREE.BoxGeometry((sizes.width * 0.001), (sizes.width * 0.001), (sizes.height * 0.001));
            const boxMaterial = new THREE.MeshBasicMaterial({
                color: '#ffffff',
                wireframe: true,
                opacity: 0.5,
            })
            const box = new THREE.Mesh(boxGeometry, boxMaterial)

            box.position.y = 0.5
            box.opacity = 0.5
            box.castShadow = true
            boxGroup.add(box)
        }
    }
      // setTimeout(getData,50)
}





// Object



// Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)



window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height,0.1,1000)
camera.position.set(10,5,10)


// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true


// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setClearColor('#d0d0d0')


function animate() {

	requestAnimationFrame( animate );

	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();
  renderer.render(scene, camera)

}

	requestAnimationFrame( animate );