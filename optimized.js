import * as THREE from 'three'
import { InstancedMesh, Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'

const scene = new THREE.Scene();

const GLTFloader = new GLTFLoader();
GLTFloader.setPath('./').load('House.glb',(gltf) => {
    document.getElementById('loading').style.display = 'none';
    scene.add(gltf.scene)

    // 移除 GlB 中的垃圾
    for (const child of gltf.scene.children) {
        if (!child.isMesh) {
            gltf.scene.remove(child);
            continue;
        }
    }

    const geometryMaterialMap = new Map();
    const dummy = new Object3D();

    // 將每個 Mesh 的 geometry 和 material 分組
    for (const child of gltf.scene.children) {
        if (!child.isMesh) continue;

        const key = `${child.geometry.uuid}_${child.material?.name || 'UnnamedMaterial'}`;
        
        if (!geometryMaterialMap.has(key)) {
            geometryMaterialMap.set(key, {
                geometry: child.geometry,
                material: child.material,
                transforms: []
            });
        }

        geometryMaterialMap.get(key).transforms.push(child.matrixWorld);
    }

    // 為每組 geometry 和 material 創建 InstancedMesh
    for (const { geometry, material, transforms } of geometryMaterialMap.values()) {
        const mesh = new InstancedMesh(geometry, material, transforms.length);
        for (let i = 0; i < transforms.length; i++) {
            dummy.matrix.copy(transforms[i]);
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        scene.add(mesh);
    }

    gltf.scene.clear(); // 清除原始的 gltf 容器
    scene.remove(scene.children[0]) // 移除這個奇怪的物件
    scene.remove(gltf.scene); // 清除 gltf 的容器

    // 儲存優化後的模型
    const exporter = new GLTFExporter();
    exporter.parse(scene, (result) => {
        const output = new Blob(
            [result instanceof ArrayBuffer ? result : JSON.stringify(result)],
            { type: result instanceof ArrayBuffer ? 'model/gltf-binary' : 'application/json' }
        );

        document.getElementById('downloadBox').style.display = 'block'; // 顯示下載按鈕
        const link = document.getElementById('downloadGLB');
        document.getElementById('downloadGLB').href = URL.createObjectURL(output);
        link.download = 'optimized.glb';
        
    }, {
        binary: true,
        includeCustomExtensions: true // 🔑 一定要加！
    });

}, (xhr) => {
    if (xhr.lengthComputable) {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        document.getElementById('loading_progress').value = percentComplete;
        document.getElementById('loading_percentage').textContent = percentComplete > 100 ? '完成!' : `${percentComplete.toFixed(2)}%`;
    } else {
        console.log(`已載入 ${xhr.loaded} bytes`);
    }
},(err) => console.error(err))