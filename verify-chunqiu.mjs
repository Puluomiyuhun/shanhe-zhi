import assert from 'node:assert/strict';
import {createWorld,cities,factions} from './dist/chunqiu/world.js';
import {createActors,actorDefinitions} from './dist/chunqiu/actors.js';
import {officers,officersInCity,rosterMarkup} from './dist/chunqiu/roster.js';
const t=performance.now(),w=createWorld(),sim=createActors(w);
assert.equal(w.cells.length,6708);assert.equal(factions.length,28);assert.equal(cities.length,38);assert.equal(officers.length,146);
assert.equal(new Set(officers.map(o=>o.name)).size,officers.length);
assert.equal(new Set(cities.map(c=>c.name)).size,cities.length);
const failures=[];
for(const city of cities){const target=w.nearest(city.x,city.z),r=w.route(w.origin.id,target.id);if(!target.walkable||!r)failures.push({city:city.name,terrain:target.terrain});assert.ok(factions.some(f=>f.id===city.owner));assert.ok(Math.hypot(target.x-city.x,target.z-city.z)<1.5);}
assert.deepEqual(failures,[],'All cities must be reachable');
const empty=cities.filter(c=>!officersInCity(c.name,sim).length).map(c=>c.name);assert.deepEqual(empty,[],'Every city needs residents');
for(const o of officers){assert.ok(cities.some(c=>c.name===o.place),o.name);assert.ok(o.stats.every(n=>n>=0&&n<=100));}
assert.equal(actorDefinitions.length,10);for(const a of sim.actors){assert.ok(officers.some(o=>o.name===a.name));assert.ok(a.targets.every(name=>cities.some(c=>c.name===name)));}
const snapshot=w.cells.map(c=>c.owner);for(let i=0;i<1800;i++)sim.advance(100);
assert.deepEqual(w.cells.map(c=>c.owner),snapshot,'AI cannot claim land without implemented combat');
assert.ok(sim.actors.every(a=>a.steps>0));
const target=w.nearest(cities[1].x,cities[1].z);w.unit.path=w.route(w.unit.cell,target.id).path.slice(1);while(w.unit.path.length)assert.ok(w.step());assert.ok(w.unit.morale>0);
assert.ok(rosterMarkup(0,{faction:'晋军'},sim).includes('晋文公'));
console.log(JSON.stringify({cells:w.cells.length,factions:factions.length,cities:cities.length,officers:officers.length,activeActors:sim.actors.length,allCitiesReachable:true,minResidents:Math.min(...cities.map(c=>officersInCity(c.name,sim).length)),ai:sim.actors.map(a=>({name:a.name,steps:a.steps,trips:a.trips})),verificationMs:Math.round(performance.now()-t)}));
