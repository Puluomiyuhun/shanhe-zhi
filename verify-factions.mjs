import assert from 'node:assert/strict';
import {createWorld,cities,factions} from './dist/lab/world.js';
const w=createWorld();const results=[];
for(const city of cities){const c=w.nearest(city.x,city.z);const t=performance.now(),r=w.route(w.origin.id,c.id);results.push({city:city.name,owner:c.owner,expected:city.owner,terrain:c.terrain,route:r?.path.length,ms:Math.round(performance.now()-t)});assert.equal(c.owner,city.owner);assert(c.walkable);assert(r,city.name+' unreachable');}
assert.equal(factions.length,5);assert.equal(w.cells.length,11648);assert.equal(cities.length,14);console.log(results);
