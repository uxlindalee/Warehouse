import * as THREE from "/public/resources/three.module.js";
import { OrbitControls } from '/public/resources/OrbitControls.js';
import warehouseJson from '/public/data/warehouse.json' assert { type: "json" };

const App = function () {
    const container = document.querySelector('.container');
    let canvas, renderer, scene, camera, light, controls;
    let ww, wh;
    let isRequsetRender;
    let warehouseData;
    let warehouseRacks = [];
    let warehouseBoxs = [];


    function getData () {
        if ( window.warehouseDataGenerator ) {
            warehouseDataGenerator.getDate();
        }
    }

    window.dataCallback = function (data) {
        if ( data ) {
            warehouseData = data;
            setBoxs();
            update(data);
        }
        setTimeout(getData, 50);
    }

    window.warehouseDataGenerator.getData();


    const init = function () {
        ww = window.innerWidth;
        wh = window.innerHeight;

        // Scene
        scene = new THREE.Scene();

        // Renderer
        renderer = new THREE.WebGL1Renderer();
        renderer.setClearColor('#d7d6d7', 1.0);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(ww, wh);
        canvas = renderer.domElement;
        container.appendChild(canvas);

        // Light
        light = new THREE.AmbientLight('#fff', 1);
        scene.add(light);

        // Camera
        camera = new THREE.PerspectiveCamera(70, ww/wh, 0.1, 1000);
        camera.position.set(20, 10, -6);
        camera.lookAt(0, 0, 0);

        // Controls
        controls = new OrbitControls( camera, canvas );

        setModels();
        setEvent();

        renderrequest();
        render();

        // ~~~~~~~~~~~~~~~~~~~~ 나중에 바꾸기 
        setTimeout(function () {
            renderrequest();
        }, 100);
    }

    const resize = function () {
        ww = window.innerWidth;
        wh = window.innerHeight;

        camera.aspect = ww / wh;
        camera.updateProjectionMatrix();

        renderer.setSize(ww, wh);
        renderer.render(scene, camera);
    }






    // Setting --------------------------------------------------------------------------------------------------------------
    const setModels = function () {
        let sizes = warehouseJson.sizes;
        let boxX = 0;
        let boxY = 0;
        let boxZ = 0;

        // warehouseCenter
        let warehouseCenterX = 0;
        warehouseCenterX += sizes.elevator.width;
        for (let i = 0; i < sizes.width.length; i++) {
            warehouseCenterX += sizes.width[i];
        }
        warehouseCenterX = warehouseCenterX/2/1000;
        controls.target = new THREE.Vector3(warehouseCenterX, 0, 0);
        
        // Racks
        for (let k = 0; k < sizes.depth.length; k++) {
            boxZ = k > 0  ? boxZ = sizes.shuttle.width + sizes.depth[k] / 2 : -(sizes.shuttle.width + sizes.depth[k] / 2);
            for (let i = 0; i < sizes.height.length; i++) {
                if ( i === 0 ) boxY = 0;
                if ( i <  sizes.height.length ){
                    boxY += sizes.height[i] + 30;
                }
                for (let j = 0; j < sizes.width.length; j++) {
                    if ( j === 0 ) boxX = 0;
                    if ( j <  sizes.width.length ){
                        boxX += sizes.width[j] + 30;
                    }
                    const float = boxZ > 0 ? 'R' : 'L';
                    const rack = createWarehouse(
                        sizes.width[j] /1000, 
                        sizes.height[i]/1000,
                        sizes.depth[k] /1000,
                        boxX/1000 - sizes.width[j]/1000 / 2 ,
                        boxY/1000 - sizes.height[i]/1000 / 2 ,
                        boxZ/1000,
                        `rack_${j + 1}`,
                        ${i + 1}-${j+ 1}-${float}
                    );
                    warehouseRacks.push(rack);
                }
            }
        }

        // Lift
        createWarehouse(
            sizes.elevator.width/1000,
            sizes.elevator.height/1000,
            sizes.elevator.depth/1000,
            -sizes.elevator.width/1000 / 2, 
            sizes.elevator.height/1000 / 2, 
            0, 
            'lift'
        );

        // Shuttle
        createWarehouse(
            sizes.shuttle.width/1000,
            sizes.shuttle.height/1000,
            sizes.shuttle.depth/1000,
            // -sizes.shuttle.width/1000 / 2, 
            sizes.elevator.width/1000 / 2,
            sizes.shuttle.height/1000 / 2, 
            0, 
            'shuttle'
        );
    }

    const setBoxs = function () {
        let boxInfos = warehouseJson.box_infos;

        for (let i = 0; i < warehouseData.warehouse.length; i++) {
            const box = warehouseData.warehouse[i];
            const boxInfo = boxInfos.find(item => item.type === box.box_type);
            const boxIdArr = box.id.split('-');
            const matchRack = warehouseRacks.find(item => item.ids === box.id.substring(0, 5));
            
            if ( boxInfo ) {
                // ~~~~~~~~~~~~~~~~~~~ 이거 맞을까.......?............. 
                if ( 'double' in boxInfo ) {
                    const boxMesh = [
                        createBox(
                            boxInfo.width/1000,
                            boxInfo.height/1000,
                            boxInfo.depth/1000,
                            matchRack.position.x - matchRack.geometry.parameters.width/2 + boxInfo.width/1000/2 + 0.15 + (boxIdArr[3]-1)*0.5, 
                            matchRack.position.y - matchRack.geometry.parameters.height/2 + boxInfo.height/1000/2,
                            matchRack.position.z - boxInfo.depth/1000/2 - 0.04,
                            boxInfo.color,
                            boxInfo.name,
                        ),
                        createBox(
                            boxInfo.width/1000,
                            boxInfo.height/1000,
                            boxInfo.depth/1000,
                            matchRack.position.x - matchRack.geometry.parameters.width/2 + boxInfo.width/1000/2 + 0.15 + (boxIdArr[3]-1)*0.5, 
                            matchRack.position.y - matchRack.geometry.parameters.height/2 + boxInfo.height/1000/2,
                            matchRack.position.z + boxInfo.depth/1000/2 + 0.04,
                            boxInfo.color,
                            boxInfo.name,
                        )
                    ]
                    warehouseBoxs.push(boxMesh);
                } else {
                    const boxMesh = createBox(
                        boxInfo.width/1000,
                        boxInfo.height/1000,
                        boxInfo.depth/1000,
                        matchRack.position.x - matchRack.geometry.parameters.width/2 + boxInfo.width/1000/2 + 0.15 + (boxIdArr[3]-1)*0.5, 
                        matchRack.position.y - matchRack.geometry.parameters.height/2 + boxInfo.height/1000/2,
                        matchRack.position.z,
                        boxInfo.color,
                        boxInfo.name,
                    )
                    warehouseBoxs.push(boxMesh);
                }
            }
        }
    }

    const setEvent = function () {
        window.addEventListener('resize', resize);
        controls.addEventListener('change', renderrequest);
    }





    // Create --------------------------------------------------------------------------------------------------------------
    const createWarehouse = function (w, h, d, x, y, z, name, id) {
        const item = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                opacity: 0.2,
                transparent: true,
                flatShading: true,
            })
        )
        const wireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(item.geometry), 
            new THREE.LineBasicMaterial({ color: "#bbb", linewidth: 10 })
        );
        wireframe.renderOrder = 1; 
        item.add(wireframe);

        if ( id ) {
            const idSplit = id.split('-');
            item.line = idSplit[0];
            item.floor = idSplit[1];
            item.float = idSplit[2];
            item.ids = id;
        }
        item.name = name;
        item.position.set(x, y, z);
        scene.add(item);

        if ( Math.round(y - h/2) === 0 ) {
            const bubbleMap = new THREE.TextureLoader().load( ../../public/images/bubble_${name}.png );
            const bubbleMaterial = new THREE.SpriteMaterial( { map: bubbleMap } );
            const bubbleSprite = new THREE.Sprite( bubbleMaterial );
            const bubbleScaleX = name.indexOf('rack') < 0 ? 0.6 : 0.4;
            const bubbleY = name.indexOf('rack') < 0 ? 3.5 : 2.5;
            bubbleSprite.scale.set(bubbleScaleX, 0.4, 0.4);
            bubbleSprite.position.set(x, bubbleY, z);
            scene.add( bubbleSprite );
        }

        return item;
    } 

    const createBox = function (w, h, d, x, y, z, color, name) {
        const item = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshStandardMaterial({
                color: `#${color}`,
            })
        )
        item.position.set(x, y, z);
        item.name = name;
        scene.add(item);

        return item;
    }



    // Render --------------------------------------------------------------------------------------------------------------
    const renderrequest = function () {
        isRequsetRender = true;
    }
    const render = function () {
        if ( isRequsetRender ) {
            controls.update();

            renderer.render(scene, camera);
            isRequsetRender = false;
        }
        requestAnimationFrame(render);
    }

    init();
}

window.onload = () => {
    App();
}