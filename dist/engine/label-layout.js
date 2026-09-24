import * as THREE from '../lab/vendor/three.module.js';
const p=new THREE.Vector3();
// Labels and WebGL must consume exactly the same world/camera matrices in each frame.
export function syncView(camera,root){root.updateWorldMatrix(true,false);camera.updateMatrixWorld(true);}
export function projectAnchor(point,camera,root,width,height){p.copy(point).applyMatrix4(root.matrixWorld).project(camera);return{x:(p.x*.5+.5)*width,y:(-.5*p.y+.5)*height,depth:p.z};}
