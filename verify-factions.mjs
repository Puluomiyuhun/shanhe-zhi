import assert from 'node:assert/strict';
import {createWorld,cities,factions,EXTENT} from './dist/lab/world.js';
const w=createWorld();const results=[];assert.equal(new Set(cities.map(c=>c.name)).size,cities.length);for(const c of cities){assert(Math.abs(c.x)<EXTENT.x&&Math.abs(c.z)<EXTENT.z);assert(factions.some(f=>f.id===c.owner));}for(const f of factions)assert(w.cells.some(c=>c.owner===f.id));
for(const city of cities){const c=w.nearest(city.x,city.z);const t=performance.now(),r=w.route(w.origin.id,c.id);results.push({city:city.name,owner:c.owner,expected:city.owner,terrain:c.terrain,route:r?.path.length,ms:Math.round(performance.now()-t)});assert.equal(c.owner,city.owner);assert(c.walkable);assert(r,city.name+' unreachable');}
assert.equal(factions.length,9);assert.equal(w.cells.length,11648);assert.equal(cities.length,35);console.log(results);
