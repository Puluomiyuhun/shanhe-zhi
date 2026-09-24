import {cityEconomyMarkup} from './campaign-ui.js';
import {scenario,format} from './runtime.js';
import {officers,officersInCity,officerFace,liveOfficer} from './roster.js';
import {faction} from './world.js';
import {cityAt} from './actors.js';
import {actorSide,actorColor} from './actor-view.js';
export function createSidebar({getWorld,getSimulation,cities,onInspect,onPlan,onLocate,onUnit,onActor,onLocateActor,onOfficer}){
 const $=id=>document.getElementById(id);let mode='unit',city=cities.find(c=>c.name===scenario.player.home),actorId=getSimulation().actors.find(a=>a.active!==false)?.id,cityCache=null;
 $('citySelect').innerHTML=cities.map(c=>`<option value="${c.name}">${c.name} · ${faction(c.owner).name}</option>`).join('');
 $('npcSelect').innerHTML=getSimulation().actors.filter(a=>a.active!==false).map(a=>`<option value="${a.id}">${a.name} · ${a.kind==='army'?'带兵':'独行'}</option>`).join('');
 $('sideUnit').onclick=()=>onUnit();$('sideCity').onclick=()=>onInspect(city);$('sideAI').disabled=!actorId;$('sideAI').onclick=()=>actorId&&onActor(actorId);
 $('citySelect').onchange=e=>onInspect(getSimulation().campaign.cities.find(c=>c.name===e.target.value));$('npcSelect').onchange=e=>onActor(e.target.value);
 $('cityRoute').onclick=()=>onPlan(city);$('cityLocate').onclick=()=>onLocate(city);$('npcLocate').onclick=()=>onLocateActor(actorId);
 $('cityResidents').onclick=e=>{const officer=e.target.closest('[data-resident-officer]');if(officer){onOfficer(Number(officer.dataset.residentOfficer));return;}const id=e.target.closest('[data-actor]')?.dataset.actor;if(id)onActor(id);};
 function refresh(){
  $('unitPanel').hidden=mode!=='unit';$('cityPanel').hidden=mode!=='city';$('npcPanel').hidden=mode!=='actor';
  $('sideUnit').setAttribute('aria-pressed',String(mode==='unit'));$('sideCity').setAttribute('aria-pressed',String(mode==='city'));$('sideAI').setAttribute('aria-pressed',String(mode==='actor'));
  $('citiesInfo').classList.toggle('command-active',mode==='city');$('unitsInfo').classList.toggle('command-active',mode==='unit');
  const sim=getSimulation();cities=sim.campaign.cities;city=cities.find(c=>c.name===city.name)||cities[0];const cityOptions=cities.map(c=>`<option value="${c.name}">${c.name} · ${faction(c.owner).name}</option>`).join('');if($('citySelect').innerHTML!==cityOptions)$('citySelect').innerHTML=cityOptions;const choices=sim.actors.filter(a=>a.active!==false);const optionHTML=choices.map(a=>`<option value="${a.id}">${a.name} · ${a.kind==='army'?'带兵':'独行'}</option>`).join('');if($('npcSelect').innerHTML!==optionHTML)$('npcSelect').innerHTML=optionHTML;if(mode==='actor'&&!choices.some(a=>a.id===actorId)){actorId=choices[0]?.id;if(!actorId){mode='unit';refresh();return;}}
  if(mode==='actor'){
   const a=sim.actors.find(a=>a.id===actorId),p=sim.position(a),inside=cityAt(p.x,p.z,sim.campaign.cities);
   $('npcSelect').value=a.id;$('npcPanel').style.setProperty('--faction-color',actorColor(a));const portrait=officers.find(o=>o.name===a.name);const face=portrait?officerFace(portrait):a.kind==='army'?'将':'游';if($('npcSeal').innerHTML!==face)$('npcSeal').innerHTML=face;$('npcName').textContent=a.name;$('npcFaction').textContent=actorSide(a);$('npcPhase').textContent=a.phase;$('npcKind').textContent=a.kind==='army'?format('带兵{officer} · ')+(a.mission==='campaign'?'国家军令':a.mission==='expedition'?'抵近侦察':'往返巡防'):'独自游历 · 不带兵';$('npcTroops').textContent=a.troops?a.troops.toLocaleString():'无';$('npcDistance').textContent=a.path.length+' 格';$('npcTrips').textContent=a.trips+' 次';$('npcDestination').textContent='目的地 · '+a.destination;$('npcReason').textContent=a.reason;$('npcPosition').textContent=inside?'当前驻留 · '+inside.name:'当前地形 · '+getWorld().nearest(p.x,p.z).terrain;return;
  }
  if(mode!=='city')return;city=sim.campaign?.cities.find(c=>c.name===city.name)||city;for(const option of $('citySelect').options){const c=sim.campaign?.cities.find(c=>c.name===option.value);if(c)option.textContent=c.name+' · '+faction(c.owner).name;}
  const w=getWorld(),cell=w.nearest(city.x,city.z);
  // Terrain/costs are immutable within a world; ownership changes do not affect routes.
  if(!cityCache||cityCache.world!==w||cityCache.city!==city)cityCache={world:w,city,from:-1,surrounding:w.cells.filter(c=>(c.x-city.x)**2+(c.z-city.z)**2<=64)};
  if(cityCache.from!==w.unit.cell){cityCache.from=w.unit.cell;cityCache.route=w.route(w.unit.cell,cell.id);}
  const route=cityCache.route,steps=route?route.path.length-1:null;
  $('cityPanel').style.setProperty('--faction-color',faction(city.owner).color);const surrounding=cityCache.surrounding,held=surrounding.filter(c=>c.owner===city.owner).length,ratio=Math.round(held/surrounding.length*100);$('cityControl').textContent=ratio+'%';$('cityAccess').textContent=surrounding.filter(c=>c.walkable).length+' / '+surrounding.length;$('cityControlFill').style.width=ratio+'%';$('citySelect').value=city.name;$('cityName').textContent=city.name;$('cityFaction').textContent=faction(city.owner).name+'军 · '+(city.owner===scenario.player.owner?'己方据点':'对方据点');
  $('cityDistance').textContent=steps===null?'不可达':steps===0?'已在此地':steps+' 格';$('cityCost').textContent=route?route.cost.toFixed(1):'—';$('cityTerrain').textContent=cell.terrain;
  $('cityRole').textContent=city.name===format('{home}')?'部队出发地 · 补给源':city.name===format('{target}')?format('本势力腹地 · {side}城邑'):faction(city.owner).region+'据点 · '+faction(city.owner).name+'军';
  $('cityDescription').textContent=city.name===format('{home}')?'先遣旅从此出发。返回城址的行军仍需沿实际通路执行。':city.name===format('{target}')?format('{home}与{target}之间可沿平原通行；远行时注意维持补给。'):'国家会自主生产、征募与修筑城防；遭到进攻时出兵迎战。';
  if(sim.campaign){let economy=document.getElementById('cityEconomy');if(!economy){economy=document.createElement('div');economy.id='cityEconomy';$('cityDescription').after(economy);}const html=cityEconomyMarkup(city);if(economy.innerHTML!==html)economy.innerHTML=html;}
  const resident=officersInCity(city.name,sim),current=w.cells[w.unit.cell],hero=cityAt(current.x,current.z,sim.campaign.cities)?.name===city.name;
  const residentHTML='<small>城内人物 · '+resident.length+' 位</small>'+(hero?format('<span class="resident-hero">主角 · {hero}</span>'):'')+'<div class="resident-roster">'+resident.map(o=>'<button data-resident-officer="'+o.id+'" title="查看'+o.name+'">'+officerFace(o)+'<span>'+o.name+'<small>'+(liveOfficer(o,sim)?.phase||o.role.split(' · ')[0])+'</small></span></button>').join('')+'</div>';
  if($('cityResidents').innerHTML!==residentHTML)$('cityResidents').innerHTML=residentHTML;
  $('cityRoute').disabled=!route||steps===0||w.unit.morale<=0;$('cityRoute').textContent=steps===0?'已在此地':'移动至此';
 }
 return{showCity(next){city=next;mode='city';refresh();},showUnit(){mode='unit';refresh();},showActor(id){actorId=id;mode='actor';refresh();},refresh,get city(){return city;},get mode(){return mode;}};
}
