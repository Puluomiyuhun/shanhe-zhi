import assert from 'node:assert/strict';
import {createWorld} from './dist/engine/world.js';
import {createCampaign} from './dist/engine/campaign.js';
import {createSimulation} from './dist/engine/simulation.js';
import {FACILITY_TYPES} from './dist/engine/evolution.js';
import {scenario} from './dist/engine/runtime.js';
import {currentOfficers,officerPlace} from './dist/engine/roster.js';
const fresh=()=>{const world=createWorld();return {world,sim:createCampaign(world,()=>{},{decisions:false,rareEvents:false})};};
const total=s=>s.cities.reduce((n,c)=>n+c.garrison,0)+s.armies.filter(a=>a.active).reduce((n,a)=>n+a.troops,0)+s.stats.casualties+s.stats.disbanded;
const conserved=s=>assert.equal(total(s),s.initialTroops+s.stats.recruited);
const {world,sim}=fresh();let facility;
for(const city of sim.cities){facility=sim.evolution.build(city.name,'farm');if(facility)break;}
assert.ok(facility,'可达的城外工地');const source=sim.cities.find(c=>c.name===facility.city),crew=sim.armies.find(a=>a.id===facility.crew);
assert.equal(crew.cell,source.cell);assert.ok(crew.path.length);assert.equal(crew.troops,280);assert.equal(sim.evolution.bonus(source).grain,0,'施工不提前产出');
assert.equal(sim.evolution.build(source.name,'farm'),null,'同城同设施不能重复修建');conserved(sim);
for(let n=0;n<40&&facility.status!=='complete';n++){sim.advance(2000);conserved(sim);}
assert.equal(facility.status,'complete');assert.equal(sim.evolution.bonus(source).grain,FACILITY_TYPES.farm.grainBonus);
for(let n=0;n<30&&crew.active;n++)sim.advance(2000);assert.equal(crew.active,false);conserved(sim);
const enemy=sim.cities.find(c=>c.owner!==source.owner).owner;
assert.ok(sim.evolution.defect(source.name,enemy));assert.equal(facility.owner,enemy);assert.equal(world.cells[source.cell].owner,enemy);assert.equal(sim.evolution.bonus(source).grain,100);conserved(sim);
assert.equal(sim.evolution.defect(source.name),false,'政治事件冷却保护');
const independent=sim.cities.find(c=>c.name!==source.name&&!scenario.actors.some(a=>a.kind==='traveler'&&a.name===c.governor));const oldOwner=independent.owner,leader=independent.governor,count=sim.factions.length;
assert.ok(sim.evolution.defect(independent.name));assert.equal(sim.factions.length,count+1);assert.notEqual(independent.owner,oldOwner);assert.equal(sim.evolution.officerAllegiances.get(leader),independent.owner);conserved(sim);
const next=sim.evolution.build(independent.name,'market');if(next){const target=sim.cities.find(c=>c.owner!==independent.owner);independent.lastPolitics=-100;assert.ok(sim.evolution.defect(independent.name,target.owner));assert.ok(!sim.evolution.facilities.includes(next),'易主取消未完成工程');conserved(sim);}
const original=JSON.stringify(scenario);
const failure=fresh();failure.world.route=()=>null;const untouched=failure.sim.cities.map(c=>[c.gold,c.grain,c.garrison]);for(const c of failure.sim.cities)assert.equal(failure.sim.evolution.build(c.name,'farm'),null);assert.deepEqual(failure.sim.cities.map(c=>[c.gold,c.grain,c.garrison]),untouched,'不可达工地不得扣除资源');
// Rare events exercised directly, while the clock and route remain the production implementation.
const rogueCase=fresh(),r=rogueCase.sim;let rogue;
for(const from of r.cities){const to=r.cities.find(c=>c.owner!==from.owner);r.declareWar(from.owner,to.owner);const army=r.dispatch(from.owner,from.name,to.name);if(army){rogue=r.evolution.wander(army.id);if(rogue)break;}}
assert.ok(rogue,'存在可筑城的边地');const newOwner=rogue.owner,foundCell=rogue.foundCell,initialCityCount=r.cities.length;
assert.equal(r.owned(newOwner).length,0);assert.ok(rogue.path.length,'流浪军需实际走到边地');conserved(r);
for(let n=0;n<70&&!r.stats.founded;n++){r.advance(2000);conserved(r);}
assert.equal(r.stats.founded,1);assert.equal(r.cities.length,initialCityCount+1);const founded=r.owned(newOwner)[0];assert.equal(founded.cell,foundCell);assert.equal(rogueCase.world.cells[foundCell].owner,newOwner);assert.ok(founded.garrison>0);assert.equal(rogue.active,false);assert.equal(r.states.find(s=>s.id===newOwner).wandering,false);
const newBuild=r.evolution.build(founded.name,'farm'); // Starting resources may legitimately be insufficient.
if(!newBuild){founded.gold=2000;founded.grain=3000;founded.garrison+=1000;r.stats.recruited+=1000;assert.ok(r.evolution.build(founded.name,'farm'),'新城能继续参与建设');}
const combined=createSimulation(createWorld());for(let n=0;n<500;n++)combined.advance(2000);assert.equal(combined.actors.filter(a=>a.mission==='campaign').length,combined.campaign.armies.length,'新增国家军队进入实时显示集合');
const c=combined.campaign;for(const o of currentOfficers(combined)){const changed=c.evolution.officerAllegiances.get(o.name);if(changed!==undefined)assert.equal(o.owner,changed);assert.ok(officerPlace(o,combined));}
const reset=createSimulation(createWorld());assert.equal(reset.campaign.evolution.facilities.length,0);assert.equal(reset.campaign.factions.length,scenario.factions.length);assert.equal(reset.campaign.cities.length,scenario.cities.length);assert.equal(JSON.stringify(scenario),original);
console.log({scenario:scenario.id,construction:true,politicalTransfers:true,wanderingFounding:true,failedRoutes:true,reset:true,scenery:reset.campaign.scenery.length,events:c.events.filter(e=>['independence','defection','wander','founding'].includes(e.type)),stats:c.stats});
