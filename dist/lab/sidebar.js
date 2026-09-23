import {faction} from './world.js';
export function createSidebar({getWorld,cities,onInspect,onPlan,onLocate,onUnit}){
 const $=id=>document.getElementById(id);let mode='unit',city=cities[0];
 $('citySelect').innerHTML=cities.map(c=>`<option value="${c.name}">${c.name} · ${faction(c.owner).name}</option>`).join('');
 $('sideUnit').onclick=()=>onUnit();$('sideCity').onclick=()=>onInspect(city);
 $('citySelect').onchange=e=>onInspect(cities.find(c=>c.name===e.target.value));
 $('cityRoute').onclick=()=>onPlan(city);$('cityLocate').onclick=()=>onLocate(city);
 function refresh(){
  $('unitPanel').hidden=mode!=='unit';$('cityPanel').hidden=mode!=='city';
  $('sideUnit').setAttribute('aria-pressed',String(mode==='unit'));$('sideCity').setAttribute('aria-pressed',String(mode==='city'));
  if(mode!=='city')return;
  const w=getWorld(),cell=w.nearest(city.x,city.z),route=w.route(w.unit.cell,cell.id),steps=route?route.path.length-1:null;
  $('cityPanel').style.setProperty('--faction-color',faction(city.owner).color);$('citySelect').value=city.name;$('cityName').textContent=city.name;$('cityFaction').textContent=(faction(city.owner).name)+'军 · '+(city.owner===1?'己方据点':'对方据点');
  $('cityDistance').textContent=steps===null?'不可达':steps===0?'已在此地':steps+' 格';$('cityCost').textContent=route?route.cost.toFixed(1):'—';$('cityTerrain').textContent=cell.terrain;
  $('cityRole').textContent=city.name==='襄阳'?'部队出发地 · 补给源':city.name==='新野'?'汉水以北 · 官道要地':faction(city.owner).region+'据点 · '+faction(city.owner).name+'军';
  $('cityDescription').textContent=city.name==='襄阳'?'先遣部队从此出发。返回城址的行军仍需沿实际通路执行。':city.name==='新野'?'从襄阳北上需经汉水渡桥；注意维持后方通路。':'可查看地形并预览抵近路线。城池攻防尚未接入。';
  $('cityRoute').disabled=!route||steps===0||w.unit.morale<=0;$('cityRoute').textContent=steps===0?'已在此地':'预览行军';
 }
 return{showCity(next){city=next;mode='city';refresh();},showUnit(){mode='unit';refresh();},refresh,get city(){return city;},get mode(){return mode;}};
}
