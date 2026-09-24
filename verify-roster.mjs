import assert from 'node:assert/strict';
import {officers,officersInCity,rosterRows,rosterMarkup} from './dist/lab/roster.js';
import {cities,createWorld} from './dist/lab/world.js';
import {createActors} from './dist/lab/actors.js';
import {existsSync,statSync} from 'node:fs';
const sim=createActors(createWorld());
assert.equal(new Set(officers.map(o=>o.name)).size,officers.length);
assert.equal(new Set(officers.map(o=>o.id)).size,officers.length);
for(const c of cities)assert.ok(officersInCity(c.name,sim).length>=2,c.name+' needs a garrison');
for(const o of officers){assert.ok(cities.some(c=>c.name===o.place),o.name+' valid city');assert.equal(o.stats.length,4);assert.ok(o.stats.every(n=>Number.isFinite(n)&&n>=0&&n<=100));if(o.portrait)assert.ok(existsSync('dist/lab/'+o.portrait));}
assert.equal(sim.actors.length,6,'Resident expansion must not add simulation agents');
const empty={city:'成都',faction:'曹操军'};assert.equal(rosterRows(empty,sim).length,0);assert.ok(rosterMarkup(-1,empty,sim).includes('暂无驻留'));
const before=officersInCity('新野',sim).some(o=>o.name==='文聘');sim.advance(10000);assert.ok(before);assert.equal(officersInCity('新野',sim).some(o=>o.name==='文聘'),false,'A departed actor must not remain in the home garrison');
const paths=[...new Set(officers.map(o=>o.portrait).filter(Boolean))];
console.log(JSON.stringify({officers:officers.length,cities:cities.length,minResidents:Math.min(...cities.map(c=>officersInCity(c.name,sim).length)),portraits:paths.length,portraitBytes:paths.reduce((n,p)=>n+statSync('dist/lab/'+p).size,0),activeAgents:sim.actors.length}));
