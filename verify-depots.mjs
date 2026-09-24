import assert from 'node:assert/strict';
import {createWorld} from './dist/engine/world.js';
import {createCampaign} from './dist/engine/campaign.js';
import {scenario} from './dist/engine/runtime.js';
const world=createWorld(),sim=createCampaign(world,()=>{},{decisions:false,rareEvents:false});
let f;for(const c of sim.cities){f=sim.evolution.build(c.name,'camp');if(f)break;}
assert.ok(f);assert.equal(sim.depots.operational(f),false);
for(let i=0;i<60&&f.status!=='complete';i++)sim.advance(2000);
assert.equal(f.status,'complete');assert.ok(sim.depots.operational(f));
const home=sim.cities.find(c=>c.name===f.city);home.grain=2000;f.stock=0;
sim.depots.tick();assert.equal(home.grain,1820);assert.equal(f.stock,180);
home.grain=1200;sim.depots.tick();assert.equal(f.stock,180,'城粮保底，不凭空增粮');
home.grain=10000;f.stock=1750;sim.depots.tick();assert.equal(f.stock,1800);assert.equal(home.grain,9950);
let a,target;for(const c of sim.cities.filter(c=>c.owner!==home.owner)){sim.declareWar(home.owner,c.owner);a=sim.dispatch(home.owner,home.name,c.name);if(a){target=c;break;}}
assert.ok(a);if(a.order==='rally'){a.order=a.resumeOrder;a.depot=null;}
assert.ok(sim.depots.visit(a,f));assert.equal(sim.depots.visit(a,f),false,'不可重复覆盖休整前军令');
// Isolate arrival/resource settlement after validating that visit produced a real route.
assert.ok(a.path.length);a.cell=f.cell;a.path=[];a.progress=0;a.food=0;a.morale=40;f.stock=600;home.grain=1200;
const troops=a.troops;sim.depots.tick();assert.equal(a.food,240);assert.equal(f.stock,360);assert.equal(a.morale,50);assert.equal(a.troops,troops);
for(let i=0;i<4;i++)sim.depots.tick();assert.equal(a.order,'attack');assert.equal(a.destination,target.name);assert.ok(a.path.length);
assert.equal(sim.depots.rest(a),false,'休整有冷却，避免来回折返');
// Player recovery uses an owned operational station and consumes stored grain.
const oldOwner=f.owner,oldCityOwner=home.owner;f.owner=home.owner=world.cells[f.cell].owner=scenario.player.owner;
world.unit.cell=f.cell;world.unit.path=[];world.unit.morale=60;f.stock=120;home.grain=1200;
a.active=false;sim.depots.tick();assert.equal(world.unit.morale,68);assert.equal(f.stock,60);
f.stock=0;sim.depots.tick();assert.equal(world.unit.morale,68);
f.owner=home.owner=world.cells[f.cell].owner=oldOwner;home.owner=oldCityOwner;
// Raid uses the same military slot and real route; an arriving force destroys the station.
let raider;for(const c of sim.cities.filter(c=>c.owner!==home.owner)){sim.declareWar(c.owner,home.owner);raider=sim.dispatch(c.owner,c.name,home.name,'raid',null,f);if(raider)break;}
assert.ok(raider);assert.ok(raider.path.length);raider.cell=f.cell;raider.path=[];raider.progress=0;
assert.equal(sim.depots.available(f,home.owner),false,'敌军逼近停止整备');
for(let i=0;i<8&&f.status==='complete';i++)sim.depots.tick();
assert.equal(f.status,'destroyed');assert.ok(!home.facilities.includes(f));assert.ok(!sim.evolution.facilities.includes(f));assert.equal(sim.stats.depotsDestroyed,1);assert.equal(raider.order,'return');assert.equal(sim.evolution.build(home.name,'camp'),null,'被毁后重建冷却');
console.log({scenario:scenario.id,construction:true,finiteStock:true,restAndResume:true,playerRecovery:true,raidAndDestruction:true});
