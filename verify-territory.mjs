import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createWorld,cities} from './dist/engine/world.js';
import {inPlayableArea,territoryDistance,territoryOpacity} from './dist/engine/territory.js';
const start=performance.now(),w=createWorld(),buildMs=performance.now()-start;
assert.equal(w.cells.length,13011);assert.ok(w.cells.every(c=>inPlayableArea(c.x,c.z)));
assert.equal(new Set(w.cells.map(c=>c.q+','+c.r)).size,w.cells.length);
assert.equal(inPlayableArea(-135,-120),false);assert.equal(territoryOpacity(-135,-120),0);
const seen=new Set([w.origin.id]),queue=[w.origin.id];for(let i=0;i<queue.length;i++)for(const n of w.neighbors(queue[i]))if(n.walkable&&!seen.has(n.id)){seen.add(n.id);queue.push(n.id);}
const outer=w.cells.filter(c=>Math.abs(c.x)>81||Math.abs(c.z)>77),counts={};
for(const owner of [2,3,4,14,15,16,24,25]){const candidates=outer.filter(c=>c.owner===owner&&c.walkable&&seen.has(c.id)&&territoryDistance(c.x,c.z)>3);assert.ok(candidates.length>0,'Edge faction must gain reachable territory: '+owner);counts[owner]=candidates.length;}
for(const c of cities){const cell=w.nearest(c.x,c.z);assert.ok(seen.has(cell.id));assert.equal(cell.owner,c.owner,'City retains its faction');}
for(const c of w.cells)for(const n of w.neighbors(c.id))assert.ok(w.neighbors(n.id).some(n=>n.id===c.id));
console.log({cells:w.cells.length,outerCells:outer.length,reachableOuter:outer.filter(c=>seen.has(c.id)).length,edgeFactionReachable:counts,buildMs:Math.round(buildMs)});
