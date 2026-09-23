import {faction} from './world.js';
import {cityAt} from './actors.js';
import {actorSide,actorColor} from './actor-view.js';
export function createSidebar({getWorld,getSimulation,cities,onInspect,onPlan,onLocate,onUnit,onActor,onLocateActor}){
 const $=id=>document.getElementById(id);let mode='unit',city=cities[0],actorId=getSimulation().actors[0].id;
 $('citySelect').innerHTML=cities.map(c=>`<option value="${c.name}">${c.name} · ${faction(c.owner).name}</option>`).join('');
 $('npcSelect').innerHTML=getSimulation().actors.map(a=>`<option value="${a.id}">${a.name} · ${a.kind==='army'?'带兵':'独行'}</option>`).join('');
 $('sideUnit').onclick=()=>onUnit();$('sideCity').onclick=()=>onInspect(city);$('sideAI').onclick=()=>onActor(actorId);
 $('citySelect').onchange=e=>onInspect(cities.find(c=>c.name===e.target.value));$('npcSelect').onchange=e=>onActor(e.target.value);
 $('cityRoute').onclick=()=>onPlan(city);$('cityLocate').onclick=()=>onLocate(city);$('npcLocate').onclick=()=>onLocateActor(actorId);
 $('cityResidents').onclick=e=>{const id=e.target.closest('[data-actor]')?.dataset.actor;if(id)onActor(id);};
 function refresh(){
  $('unitPanel').hidden=mode!=='unit';$('cityPanel').hidden=mode!=='city';$('npcPanel').hidden=mode!=='actor';
  $('sideUnit').setAttribute('aria-pressed',String(mode==='unit'));$('sideCity').setAttribute('aria-pressed',String(mode==='city'));$('sideAI').setAttribute('aria-pressed',String(mode==='actor'));
  $('citiesInfo').classList.toggle('command-active',mode==='city');$('unitsInfo').classList.toggle('command-active',mode==='unit');
  const sim=getSimulation();
  if(mode==='actor'){
   const a=sim.actors.find(a=>a.id===actorId),p=sim.position(a),inside=cityAt(p.x,p.z);
   $('npcSelect').value=a.id;$('npcPanel').style.setProperty('--faction-color',actorColor(a));$('npcSeal').textContent=a.kind==='army'?'将':'游';$('npcName').textContent=a.name;$('npcFaction').textContent=actorSide(a);$('npcPhase').textContent=a.phase;$('npcKind').textContent=a.kind==='army'?'带兵武将 · '+(a.mission==='expedition'?'抵近侦察':'往返巡防'):'独自周游 · 不带兵';$('npcTroops').textContent=a.troops?a.troops.toLocaleString():'无';$('npcDistance').textContent=a.path.length+' 格';$('npcTrips').textContent=a.trips+' 次';$('npcDestination').textContent='目的地 · '+a.destination;$('npcReason').textContent=a.reason;$('npcPosition').textContent=inside?'当前驻留 · '+inside.name:'当前地形 · '+getWorld().nearest(p.x,p.z).terrain;return;
  }
  if(mode!=='city')return;
  const w=getWorld(),cell=w.nearest(city.x,city.z),route=w.route(w.unit.cell,cell.id),steps=route?route.path.length-1:null;
  $('cityPanel').style.setProperty('--faction-color',faction(city.owner).color);const surrounding=w.cells.filter(c=>Math.hypot(c.x-city.x,c.z-city.z)<=8),held=surrounding.filter(c=>c.owner===city.owner).length,ratio=Math.round(held/surrounding.length*100);$('cityControl').textContent=ratio+'%';$('cityAccess').textContent=surrounding.filter(c=>c.walkable).length+' / '+surrounding.length;$('cityControlFill').style.width=ratio+'%';$('citySelect').value=city.name;$('cityName').textContent=city.name;$('cityFaction').textContent=faction(city.owner).name+'军 · '+(city.owner===1?'己方据点':'对方据点');
  $('cityDistance').textContent=steps===null?'不可达':steps===0?'已在此地':steps+' 格';$('cityCost').textContent=route?route.cost.toFixed(1):'—';$('cityTerrain').textContent=cell.terrain;
  $('cityRole').textContent=city.name==='襄阳'?'部队出发地 · 补给源':city.name==='新野'?'汉水以北 · 官道要地':faction(city.owner).region+'据点 · '+faction(city.owner).name+'军';
  $('cityDescription').textContent=city.name==='襄阳'?'先遣部队从此出发。返回城址的行军仍需沿实际通路执行。':city.name==='新野'?'从襄阳北上需经汉水渡桥；注意维持后方通路。':'可查看地形并预览抵近路线。城池攻防尚未接入。';
  const resident=sim.actors.filter(a=>{const p=sim.position(a);return cityAt(p.x,p.z)?.name===city.name});const current=w.cells[w.unit.cell],hero=cityAt(current.x,current.z)?.name===city.name;
  $('cityResidents').innerHTML='<small>城内人物</small>'+(hero?'<span class="resident-hero">主角 · 沈行舟</span>':'')+resident.map(a=>'<button data-actor="'+a.id+'">'+a.name+' · '+a.phase+'</button>').join('')+(!hero&&!resident.length?'<span>暂无观察对象</span>':'');
  $('cityRoute').disabled=!route||steps===0||w.unit.morale<=0;$('cityRoute').textContent=steps===0?'已在此地':'预览行军';
 }
 return{showCity(next){city=next;mode='city';refresh();},showUnit(){mode='unit';refresh();},showActor(id){actorId=id;mode='actor';refresh();},refresh,get city(){return city;},get mode(){return mode;}};
}
