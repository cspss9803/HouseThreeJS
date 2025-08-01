import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import Stats from 'three/addons/libs/stats.module.js'

let scene, renderer, camera, stats;

let yawObject, pitchObject;
let moveVector = { x: 0, y: 0 };
let rotateVector = { x: 0, y: 0 };

let prevTime = performance.now();


function init() {
    init_scene()
    init_camera()
    init_renderer()
    init_joysticks()
    init_stats()
    init_light()
    window.addEventListener( 'resize', onWindowResize );
    
    const GLTFloader = new GLTFLoader();
    GLTFloader.setPath('./').load('a.glb',(gltf) => {
        document.getElementById('loading').style.display = 'none'; // 隱藏載入畫面
        scene.add(gltf.scene)

        console.log(scene)
    }, (xhr) => {
        if (xhr.lengthComputable) {
            const percentComplete = (xhr.loaded / xhr.total) * 100;
            document.getElementById('loading_progress').value = percentComplete;
            document.getElementById('loading_percentage').textContent = percentComplete > 100 ? '完成!' : `${percentComplete.toFixed(2)}%`;
        } else {
            console.log(`已載入 ${xhr.loaded} bytes`);
        }
    },(err) => console.error(err))
}
function init_scene(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );
}
function init_camera(){
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.set(0, 0, 0); // 交由 Object3D 控制

    // 建立包覆 camera 的巢狀 Object3D
    pitchObject = new THREE.Object3D();
    pitchObject.add(camera);

    yawObject = new THREE.Object3D();
    yawObject.position.set(0, 160, 0); // 相機實際位置
    yawObject.add(pitchObject);

    scene.add(yawObject);
}
function init_light(){
    scene.add( new THREE.HemisphereLight( 0xeeeeff, 0x777788, 2 ) );
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); 
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
}
function init_joysticks() {
    const moveManager = nipplejs.create({
        zone: document.getElementById('joystick-left'),
        mode: 'static',
        position: { left: '50px', bottom: '50px' },
        color: 'blue',
        size: 300
    });
    moveManager.on('move', (evt, data) => {
        if (data.vector) {
            moveVector = data.vector;
        }
    });
    moveManager.on('end', () => {
        moveVector = { x: 0, y: 0 };
    });

    const rotateManager = nipplejs.create({
        zone: document.getElementById('joystick-right'),
        mode: 'static',
        position: { right: '50px', bottom: '50px' },
        color: 'red',
        size: 300
    });
    rotateManager.on('move', (evt, data) => {
        if (data.vector) {
            rotateVector = data.vector;
        }
    });
    rotateManager.on('end', () => {
        rotateVector = { x: 0, y: 0 };
    });
}

const init_stats = () => {
    stats = Stats()
    document.body.appendChild(stats.dom)
}
function init_renderer(){
    renderer = new THREE.WebGLRenderer( { antialias: true } ); // antialias 開啟抗鋸齒效果
    renderer.setPixelRatio( window.devicePixelRatio ); // 將設備的像素比 設置給渲染器。
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = 1 // THREE.PCFSoftShadowMap
    document.body.appendChild(renderer.domElement)
}
function onWindowResize() { 
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    requestAnimationFrame( animate );
    const time = performance.now();
    const delta = ( time - prevTime ) / 1000;

    // 移動速度與旋轉速度
    const speed = 50.0 * delta;
    const rotationSpeed = 0.5 * delta;

    // 移動攝影機（用 yawObject 控制位置）
    if (moveVector.y !== 0 || moveVector.x !== 0) {
        const angle = yawObject.rotation.y;
        const forward = new THREE.Vector3(
            -Math.sin(angle),
            0,
            -Math.cos(angle)
        );
        const right = new THREE.Vector3(
            -forward.z,
            0,
            forward.x
        );
        const move = forward.multiplyScalar(moveVector.y * speed).add(right.multiplyScalar(moveVector.x * speed));
        yawObject.position.add(move);
    }

    // 左右轉動（旋轉 Y 軸）
    if (rotateVector.x !== 0) {
        yawObject.rotation.y -= rotateVector.x * rotationSpeed;
    }

    // 上下轉動（旋轉 X 軸）
    // if (rotateVector.y !== 0) {
    //     pitchObject.rotation.x += rotateVector.y * rotationSpeed;

    //     // 限制俯仰角在 [-π/2, π/2]
    //     const maxPitch = Math.PI / 2;
    //     const minPitch = -Math.PI / 2;
    //     pitchObject.rotation.x = Math.max(minPitch, Math.min(maxPitch, pitchObject.rotation.x));
    // }

    prevTime = time;
    renderer.render( scene, camera );
    stats.update()
}


init();
animate();