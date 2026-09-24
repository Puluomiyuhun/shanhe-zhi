import assert from 'node:assert/strict';
import {createWorld,cities,height} from './dist/chunqiu/world.js';
import {rivers,lakes,waterAt,crossings,passes} from './dist/chunqiu/geography.js';
const w=createWorld();
assert.equal(rivers.length,10);
assert.equal(lakes.length,3);
for(const lake of lakes){const c=w.nearest(lake.x,lake.z);assert.equal(c.terrain,"湖泊");assert.equal(c.walkable,false);assert.ok(height(lake.x,lake.z)<.1);}
assert.equal(w.roads.length,14);
for(const road of w.roads){assert.ok(road.path.every(id=>w.cells[id].walkable));for(let i=1;i<road.path.length;i++)assert.ok(w.neighbors(road.path[i-1]).some(c=>c.id===road.path[i]));}
assert.ok(w.cells.some(c=>c.terrain==="官道"&&c.cost<1));
assert.ok(w.cells.some(c=>c.terrain==="湿地"&&c.cost>1));
for(const river of rivers)for(const [x,z] of river.line){assert.ok(waterAt(x,z).shore<0);assert.ok(height(x,z)<.1,'Riverbed must be below rendered water');}
for(const c of cities)assert.ok(waterAt(c.x,c.z).shore>3,`${c.name}: city footprint must clear water`);
for(const p of crossings){const c=w.nearest(p.x,p.z);assert.equal(c.terrain,'津渡',p.name);assert.ok(w.route(w.origin.id,c.id),p.name);}
for(const p of passes){const c=w.nearest(p.x,p.z);assert.equal(c.terrain,'关隘',p.name);assert.ok(w.route(w.origin.id,c.id),p.name);}
assert.ok(w.cells.filter(c=>c.terrain==='河流').every(c=>!c.walkable));
const cityId=name=>{const c=cities.find(c=>c.name===name);return w.nearest(c.x,c.z).id};
const qin=cityId('雍'),shu=cityId('蜀'),route=w.route(qin,shu);
assert.ok(route.path.some(id=>w.cells[id].feature==='秦岭谷道'));
assert.ok(route.path.some(id=>w.cells[id].feature==='巴蜀山道'));
for(const c of w.cells)if(c.terrain==='关隘')c.walkable=false;
const detour=w.route(qin,shu);assert.ok(!detour||detour.cost>route.cost,'Closing passes must affect Qin–Shu travel');
for(const c of w.cells)if(c.terrain==='津渡')c.walkable=false;
assert.equal(w.route(qin,w.origin.id),null,'Qin–Jin travel requires a river crossing');
console.log(JSON.stringify({riverSystems:rivers.length,lakes:lakes.length,roads:w.roads.length,ferries:crossings.length,passes:passes.length,riverCells:w.cells.filter(c=>c.terrain==='河流').length,qinShuSteps:route.path.length-1,closedPassDetour:detour?.path.length-1||null,closedFerriesBlockQinJin:true}));
