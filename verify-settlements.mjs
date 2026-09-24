import assert from 'node:assert/strict';
import {createWorld,cities,height} from './dist/engine/world.js';
import {waterAt} from './dist/engine/geography.js';
import {createSettlements} from './dist/engine/settlements.js';
const w=createWorld(),before=w.cells.map(c=>[c.walkable,c.cost,c.owner]),sites=createSettlements(w);
assert.ok(sites.length>=cities.length);
assert.deepEqual(createSettlements(w),sites,'Deterministic placement');
assert.deepEqual(w.cells.map(c=>[c.walkable,c.cost,c.owner]),before,'Scenery cannot change simulation');
for(const s of sites){assert.ok(w.cells[s.cell].walkable);assert.ok(waterAt(s.x,s.z).shore>2.3);assert.ok(cities.every(c=>Math.hypot(c.x-s.x,c.z-s.z)>=5.5));assert.ok(w.route(w.origin.id,s.cell),s.name);for(const [dx,dz]of [[1.6,0],[-1.6,0],[0,1.6],[0,-1.6]])assert.ok(Math.abs(height(s.x+dx,s.z+dz)-s.y)<=.38);}
console.log({sites:sites.length,types:[...new Set(sites.map(s=>s.kind))],themes:sites.filter(s=>s.source).map(s=>s.name),allReachable:true});
