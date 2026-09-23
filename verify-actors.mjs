import assert from 'node:assert/strict';
import {createWorld,cities} from './dist/lab/world.js';
import {createActors,cityAt} from './dist/lab/actors.js';
import {syncView,projectAnchor} from './dist/lab/label-layout.js';
import * as THREE from './dist/lab/vendor/three.module.js';
const world=createWorld(),events=[],sim=createActors(world,e=>events.push(e)),owners=world.cells.map(c=>c.owner);
assert.equal(cityAt(world.origin.x,world.origin.z)?.name,'襄阳');assert.equal(cityAt(15,0),null);
const initial=JSON.stringify(sim.actors);sim.advance(0);assert.equal(JSON.stringify(sim.actors),initial);
const originalTroops=sim.actors.map(a=>a.troops);let sawOutpost=false,sawReturn=false;
for(let t=0;t<300000;t+=100){
 const before=sim.actors.map(a=>a.cell);sim.advance(100);
 for(const [i,a] of sim.actors.entries()){
  assert(world.cells[a.cell].walkable);assert.equal(a.troops,originalTroops[i]);
  if(a.cell!==before[i])assert(world.neighbors(before[i]).some(n=>n.id===a.cell),'teleport '+a.id);
  const p=sim.position(a);assert(Number.isFinite(p.x)&&Number.isFinite(p.z));
  if(a.phase==='城外观察'){sawOutpost=true;assert.equal(cityAt(p.x,p.z),null);}
  if(a.phase==='返军')sawReturn=true;
 }
}
assert(sawOutpost&&sawReturn);assert(sim.actors.every(a=>a.trips>=2));assert.deepEqual(world.cells.map(c=>c.owner),owners);assert.equal(sim.actors.length,6);assert(sim.actors.filter(a=>a.kind==='traveler').every(a=>a.troops===0));
const snapshots=sim.actors.map(a=>sim.position(a));assert.deepEqual(sim.actors.map(a=>sim.position(a)),snapshots);
const camera=new THREE.PerspectiveCamera(43,1280/720,.3,1000),root=new THREE.Group(),point=new THREE.Vector3(-4,3,32),ray=new THREE.Raycaster();root.scale.y=.76;
for(let i=0;i<120;i++){const a=i*Math.PI/60;camera.position.set(Math.sin(a)*140,120,Math.cos(a)*140);camera.lookAt(0,0,0);syncView(camera,root);const q=projectAnchor(point,camera,root,1280,720);ray.setFromCamera(new THREE.Vector2(q.x/640-1,1-q.y/360),camera);assert(ray.ray.distanceToPoint(point.clone().applyMatrix4(root.matrixWorld))<1e-7,'stale label projection');}
console.log(JSON.stringify({actors:sim.actors.map(a=>({name:a.name,trips:a.trips,steps:a.steps})),expeditionReturn:sawReturn,ownershipUnchanged:true,projectionAngles:120,events:events.length}));
