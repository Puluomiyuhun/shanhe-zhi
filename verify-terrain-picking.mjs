import assert from 'node:assert/strict';
import * as THREE from './dist/lab/vendor/three.module.js';
import {height,cities,createWorld} from './dist/lab/world.js';
import {createTerrainPicker} from './dist/lab/terrain-picking.js';
const geometry=new THREE.PlaneGeometry(460,460,640,640);geometry.rotateX(-Math.PI/2);
const p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,height(p.getX(i),p.getZ(i)));
const terrain=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial()),picker=createTerrainPicker(geometry),world=createWorld(),ray=new THREE.Raycaster();
let naive=[],chunked=[];
const probes=[...cities.map(c=>[c.x,c.z]),[-29,-20],[31,40],[94,-82],[-78,65]];
for(const scale of [1,.76]){
 terrain.scale.y=scale;terrain.updateMatrixWorld(true);
 for(const [x,z] of probes){const aim=new THREE.Vector3(x,height(x,z)*scale,z),origin=aim.clone().add(new THREE.Vector3(25,85,35));ray.set(origin,aim.clone().sub(origin).normalize());
  let t=performance.now();const expected=ray.intersectObject(terrain,false)[0];naive.push(performance.now()-t);
  t=performance.now();const actual=picker.pick(ray,terrain.matrixWorld);chunked.push(performance.now()-t);
  assert.equal(!!actual,!!expected);if(actual){assert.ok(actual.point.distanceTo(expected.point)<1e-5);assert.equal(world.nearest(actual.point.x,actual.point.z).id,world.nearest(expected.point.x,expected.point.z).id);}
 }
}
const stats=a=>({mean:+(a.reduce((n,x)=>n+x,0)/a.length).toFixed(3),p95:+a.slice().sort((x,y)=>x-y)[Math.floor(a.length*.95)].toFixed(3)});
console.log(JSON.stringify({rays:naive.length,chunks:picker.count,fullMeshMs:stats(naive),chunkedMs:stats(chunked),identicalHits:true}));
