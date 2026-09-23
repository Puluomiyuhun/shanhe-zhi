import assert from 'node:assert/strict';
import {createWorld,cities,height} from './dist/lab/world.js';
const w=createWorld(); assert.equal(w.cells.length,11648);
for(const c of w.cells) assert.equal(w.nearest(c.x,c.z).id,c.id);
for(const c of cities) assert(w.nearest(c.x,c.z).walkable);
const r=w.route(w.origin.id,w.nearest(cities[1].x,cities[1].z).id);assert(r);assert(r.path.some(id=>w.cells[id].terrain==='渡桥'));w.unit.path=r.path.slice(1);while(w.step()){}assert(w.supplied());w.blockade();assert(!w.supplied());w.blockade();assert(w.supplied());assert(w.route(w.unit.cell,w.nearest(cities[2].x,cities[2].z).id));
for(const c of w.cells) assert(Number.isFinite(height(c.x,c.z)));
console.log(JSON.stringify({cells:w.cells.length,routeSteps:r.path.length-1,bridge:true,supplyRestored:true,nearestAllCells:true}));
