import assert from 'node:assert/strict';
import {gridOpacity,hoverDecision} from './dist/engine/view-policy.js';
import {loadScenario} from './dist/engine/catalog.js';
import {validateScenario} from './dist/engine/schema.js';
import {scenario} from './dist/engine/runtime.js';
import {createWorld,cities} from './dist/engine/world.js';
import {createActors} from './dist/engine/actors.js';
const w=createWorld(),bad=cities.filter(c=>!w.route(w.origin.id,w.nearest(c.x,c.z).id)).map(c=>c.name);const sim=createActors(w);for(let i=0;i<1800;i++)sim.advance(100);console.log({id:scenario.id,cells:w.cells.length,cities:cities.length,unreachable:bad,actors:sim.actors.map(a=>[a.name,a.steps])});if(bad.length||sim.actors.some(a=>a.steps===0))process.exitCode=1;

assert.equal(gridOpacity(80),0);assert.equal(gridOpacity(280),0);assert.ok(gridOpacity(45)>0);assert.equal(gridOpacity(45,false),0);
let last=0,visible=false,samples=0;for(let t=100;t<2000;t+=8){const decision=hoverDecision(t,last,0,false);if(decision==='sample'){last=t;visible=true;samples++;}else if(decision==='hide')visible=false;assert.ok(visible,'High-frequency pointer moves must retain hover');}assert.ok(samples<40);assert.equal(hoverDecision(100,96,200,false),'hide');assert.equal(hoverDecision(100,96,0,true),'hide');
await assert.rejects(loadScenario('missing'));
assert.throws(()=>validateScenario({...scenario,player:{...scenario.player,home:'不存在'}}));
assert.ok(cities.every(c=>scenario.officers.some(o=>o.place===c.name)));
console.log('Grid/hover cadence, invalid scenarios and city residents passed');
