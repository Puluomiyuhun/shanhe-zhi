import assert from 'node:assert/strict';
import {createWorld,cities} from './dist/lab/world.js';
import {createMarchMotion} from './dist/lab/march-motion.js';
function setup(){const w=createWorld();w.unit.path=w.route(w.unit.cell,w.nearest(cities[1].x,cities[1].z).id).path.slice(1);return{w,m:createMarchMotion(w,()=>w.step())};}
const {w,m}=setup();const origin=w.unit.cell;const start=m.position();m.advance(100);assert.equal(w.unit.cell,origin);assert.notDeepEqual(m.position(),start);
const paused=m.position();m.advance(0);assert.deepEqual(m.position(),paused);
let samples=0;while(w.unit.path.length){const before=m.position();m.advance(16);const after=m.position();assert(Math.hypot(after.x-before.x,after.z-before.z)>1e-8,'stationary frame while marching');samples++;assert(samples<2000);}
assert.equal(w.unit.steps,18);const end=w.cells[w.unit.cell];assert.deepEqual(m.position(),{x:end.x,z:end.z});
const a=setup(),b=setup();a.m.advance(4200);for(let i=0;i<420;i++)b.m.advance(10);assert.equal(a.w.unit.steps,b.w.unit.steps);assert(Math.hypot(a.m.position().x-b.m.position().x,a.m.position().z-b.m.position().z)<1e-8);
const c=setup();c.m.advance(150);const p=c.m.position();c.w.unit.path=c.w.route(c.w.unit.cell,c.w.nearest(cities[7].x,cities[7].z).id).path.slice(1);c.m.retarget();assert.deepEqual(c.m.position(),p);c.m.advance(16);assert(Math.hypot(c.m.position().x-p.x,c.m.position().z-p.z)<.3);
c.w.unit.path=[];c.m.retarget();const stopped=c.m.position();c.m.advance(1000);assert.deepEqual(c.m.position(),stopped);
const d=setup();d.m.advance(50);d.m.finishStep();assert.equal(d.w.unit.steps,1);assert.deepEqual(d.m.position(),{x:d.w.cells[d.w.unit.cell].x,z:d.w.cells[d.w.unit.cell].z});
console.log(JSON.stringify({continuousSamples:samples,settledTiles:w.unit.steps,pauseStable:true,framePartitionInvariant:true,retargetNoSnap:true,cancelStable:true,manualStep:true}));
