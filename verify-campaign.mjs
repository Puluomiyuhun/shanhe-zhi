import assert from 'node:assert/strict';
import {createWorld,cities as initialCities} from './dist/engine/world.js';
import {createCampaign,CAMPAIGN_TURN_MS} from './dist/engine/campaign.js';
import {createSimulation} from './dist/engine/simulation.js';
import {scenario} from './dist/engine/runtime.js';

const before=JSON.stringify(scenario),world=createWorld(),sim=createCampaign(world);
const started=performance.now();let maxActive=0;
for(let t=0;t<500;t++){
 sim.advance(CAMPAIGN_TURN_MS);
 const active=sim.armies.filter(a=>a.active);maxActive=Math.max(maxActive,active.length);assert.ok(active.length<=18);
 for(const c of sim.cities){for(const k of ['gold','grain','garrison','development','order','walls'])assert.ok(Number.isFinite(c[k])&&c[k]>=0,c.name+' '+k);assert.equal(world.cells[c.cell].owner,c.owner,'城旗与城址归属一致');}
 for(const a of active){assert.ok(a.troops>0);assert.ok(a.path.every(id=>world.cells[id]?.walkable));}
 const living=sim.cities.reduce((n,c)=>n+c.garrison,0)+active.reduce((n,a)=>n+a.troops,0);
 assert.equal(living+sim.stats.casualties+sim.stats.disbanded,sim.initialTroops+sim.stats.recruited,'兵力守恒：不可重复归营或凭空刷兵');
}
const elapsed=Math.round(performance.now()-started);
assert.ok(sim.stats.sorties>0&&sim.stats.battles>0&&sim.stats.captures>0&&sim.stats.alliances>0&&sim.stats.peaces>0);
assert.equal(JSON.stringify(scenario),before,'不能污染剧本初始数据');
const reset=createCampaign(createWorld());assert.equal(reset.turn,0);assert.deepEqual(reset.cities.map(c=>c.owner),initialCities.map(c=>c.owner));

// Deterministic clock subdivision, pause/no-op, alliance and ceasefire enforcement.
const w1=createWorld(),w2=createWorld(),s1=createCampaign(w1),s2=createCampaign(w2);
s1.advance(20000);for(let i=0;i<200;i++)s2.advance(100);
assert.deepEqual(s1.cities,s2.cities);assert.deepEqual(s1.armies,s2.armies);assert.deepEqual(s1.stats,s2.stats);
const state=JSON.stringify(s1.cities);s1.advance(0);s1.advance(-1);s1.advance(NaN);assert.equal(JSON.stringify(s1.cities),state);
const quiet=createCampaign(createWorld(),()=>{},{decisions:false});const [a,b]=quiet.states;
assert.ok(quiet.makeAlliance(a.id,b.id));assert.equal(quiet.declareWar(a.id,b.id),false);quiet.advance(48*CAMPAIGN_TURN_MS);assert.equal(quiet.relation(a.id,b.id).status,'peace');
assert.ok(quiet.declareWar(a.id,b.id));const from=quiet.owned(a.id)[0],target=quiet.owned(b.id)[0];
const garrison=from.garrison,army=quiet.dispatch(a.id,from.name,target.name);assert.ok(army);assert.equal(from.garrison+army.troops,garrison);
assert.ok(quiet.makePeace(a.id,b.id));assert.equal(army.order,'return');assert.equal(quiet.declareWar(a.id,b.id),false);quiet.advance(200);assert.equal(army.active,false);assert.equal(from.garrison,garrison);
const combined=createSimulation(createWorld());assert.ok(combined.actors.some(a=>a.kind==='traveler'));assert.ok(combined.actors.filter(a=>a.kind==='army').every(a=>a.mission==='campaign'));combined.advance(10000);assert.equal(combined.campaign.turn,5);
const guardedWorld=createWorld(),guarded=createCampaign(guardedWorld,()=>{},{decisions:false});
const enemyCity=guarded.cities.find(c=>c.owner!==scenario.player.owner);
guardedWorld.unit.path=[enemyCity.cell];guardedWorld.step();assert.equal(guardedWorld.cells[enemyCity.cell].owner,enemyCity.owner,'玩家路过不能无战斗占城');
guardedWorld.blockade();for(const c of guarded.cities)assert.equal(guardedWorld.cells[c.cell].owner,c.owner,'封锁演练不改城池归属');
const poor=guarded.owned(scenario.player.owner)[0];poor.gold=0;guarded.declareWar(poor.owner,enemyCity.owner);const unchanged=poor.garrison;
assert.equal(guarded.dispatch(poor.owner,poor.name,enemyCity.name),null);assert.equal(poor.garrison,unchanged,'兵粮不足不得扣兵或出征');
console.log({scenario:scenario.id,turns:sim.turn,maxActive,simulationMs:elapsed,...sim.stats});
