import {factions,faction} from './world.js';
import {rosterMarkup,rosterRows} from './roster.js';
// Object-focused information and orders share the live map state.
export function createIntelligence({getWorld,getSimulation,inspectActor,cities,pause,focusCity,focusUnit,plan,standby}){
 const dialog=document.getElementById('intelligence'),content=document.getElementById('intelContent');
 const tabs=[['realm','势力'],['cities','城市'],['officer','人物'],['roster','武将'],['unit','部队'],['journal','军情']];
 let view='realm',cityName=cities[0].name,entries=[],selectedOfficer=0;const rosterOptions={faction:"all",sort:-1,descending:true};
 const owner=id=>faction(id).name;
 const button=(action,text,disabled=false)=>`<button data-action="${action}" ${disabled?'disabled':''}>${text}</button>`;
 const datum=(label,value)=>`<div><dt>${label}</dt><dd>${value}</dd></div>`;
 const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function unitState(w){return w.unit.path.length?'军令已下 · 剩余 '+w.unit.path.length+' 格':'原地待命';}
 function render(){
  if(!dialog.open)return;
  dialog.classList.toggle('roster-view',view==='roster');
  const w=getWorld(),c=w.cells[w.unit.cell],supply=w.supplied();
  document.getElementById('intelTitle').textContent={realm:'势力情报',cities:'城市情报',officer:'人物与指令',roster:'武将名录',unit:'部队情报',journal:'军情簿'}[view];
  for(const b of dialog.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===view));
  let html='';
  if(view==='realm'){
   html='<p class="intel-lead">荆襄局势 <span>演练配置 · 九方势力</span></p><div class="faction-cards">';
   for(const {id} of factions){const count=w.cells.filter(c=>c.owner===id).length,controlled=cities.filter(c=>c.owner===id);html+=`<section class="intel-card" style="--faction-color:${faction(id).color}"><div class="faction-name"><span class="seal ${id===2?'enemy-seal':''}">${owner(id).slice(0,1)}</span><div><small>${id===1?'所属势力':'其他势力'} · ${faction(id).region}</small><h3>${owner(id)}</h3></div></div><dl class="intel-stats">${datum('控制土地',count+' 格')}${datum('样区城市',controlled.length+' 座')}</dl><div class="land-track"><span style="width:${count/w.cells.length*100}%;background:${faction(id).color}"></span></div><p>${controlled.map(c=>c.name).join(' · ')}</p>${button('cities-'+id,'查看所属城市')}</section>`;}
   html+='</div><p class="intel-note">九方归属为地图演练配置，非初平元年历史复原。控制土地随占领与封锁变化。城市归属在本轮演练中固定；财政、外交与城池攻防尚未接入。</p>';
  }else if(view==='cities'){
   const city=cities.find(x=>x.name===cityName)||cities[0],target=w.nearest(city.x,city.z),route=w.route(w.unit.cell,target.id),steps=route?route.path.length-1:null;
   html='<p class="intel-lead">据点一览 <span>选择城市查看情报与行军路线</span></p><div class="city-intel-layout"><div class="city-list">';
   for(const item of cities){const r=w.route(w.unit.cell,w.nearest(item.x,item.z).id);html+=`<button data-city="${item.name}" aria-pressed="${city.name===item.name}"><b>${item.name}</b><span>${owner(item.owner)}军 · ${r?r.path.length-1+' 格':'不可达'}</span></button>`;}
   html+=`</div><section class="intel-card city-dossier"><div class="dossier-top"><span class="city-emblem" aria-hidden="true">城</span><div><small>${city.owner===1?'己方据点':'对方据点'}</small><h3>${city.name}</h3><p>${owner(city.owner)}军</p></div></div><dl class="intel-stats">${datum('行军距离',steps===null?'无可达路线':steps===0?'已在城址':steps+' 格')}${datum('预计成本',route?route.cost.toFixed(1):'—')}${datum('城址地形',target.terrain)}${datum('出发部队','沈行舟 · 1,200')}</dl><p class="intel-note">${city.name==='襄阳'?'汉水以南，先遣部队的出发地与补给源。':city.name==='新野'?'沿官道北上，途中须经汉水渡桥。':'本轮演练据点，可查看地形与抵近路线，暂不进行攻城。'}</p><div class="intel-actions">${button('locate-city','地图定位')}${button('plan-city',steps===0?'已在此地':'移动至此',!route||steps===0||w.unit.morale<=0)}</div></section></div>`;
  }else if(view==='officer'){
   html=`<div class="personal-banner"><div class="dossier-portrait"><img src="assets/zhao-yun.png" alt="赵云立绘暂代沈行舟"></div><div><small>你扮演的武将</small><h3>沈行舟</h3><p>刘表麾下 · 先遣部队指挥</p></div><span class="mode-tag">单武将模式</span></div><dl class="intel-stats four">${datum('可指挥兵力','1,200')}${datum('所在位置',c.terrain+' · '+c.q+','+c.r)}${datum('部队士气',w.unit.morale)}${datum('补给状态',supply?'连通':'中断')}</dl><h4>当前可下达的指令</h4><div class="personal-orders"><button data-action="choose-march"><b>行 军</b><span>右键地图目的地，立即下令并开始移动。</span></button><button data-action="standby"><b>原地待命</b><span>停止推进，撤销本队尚未完成的路线。</span></button><button data-action="return" ${w.unit.cell===w.origin.id||w.unit.morale<=0?'disabled':''}><b>返回襄阳</b><span>立即沿可达路线返回襄阳。</span></button></div><p class="intel-note">当前身份可指挥本队；城市任免、全势力外交不属于本队指令。演练头像暂借赵云立绘。</p><details class="future-roles"><summary>后续角色玩法方向</summary><p>拟接入：交游拜访、修习能力、接受任务、仕官与升迁；获得职位后逐步开放内政与提案。这些玩法尚未接入三维样区。</p></details>`;
  }else if(view==='roster'){
   html=rosterMarkup(selectedOfficer,rosterOptions,getSimulation());
  }else if(view==='unit'){
   const destination=w.unit.path.length?w.cells[w.unit.path.at(-1)]:null;
   html=`<div class="personal-banner"><div class="dossier-portrait"><img src="assets/zhao-yun.png" alt=""></div><div><small>先遣部队 · 指挥武将</small><h3>沈行舟</h3><p>${unitState(w)}</p></div></div><dl class="intel-stats four">${datum('兵力','1,200')}${datum('士气',w.unit.morale+' / 100')}${datum('补给',supply?'通路连通':'后方中断')}${datum('累计行军',w.unit.steps+' 格')}</dl><section class="intel-card"><h4>军令详情</h4><p>当前位置：${c.terrain} · ${c.q},${c.r}</p><p>行军目标：${destination?destination.terrain+' · '+destination.q+','+destination.r:'未下达'}</p><p>剩余路程：${w.unit.path.length} 格</p><p class="intel-note">${supply?'通路连通，行军每格恢复 1 点士气，上限 100。':'补给中断，继续行军每格损失 8 点士气。'}</p></section><div class="intel-actions">${button('locate-unit','地图定位')}${button('choose-march','设置行军')}${button('standby','原地待命',!w.unit.path.length)}</div>`;
  }else{
   html='<p class="intel-lead">行军纪事 <span>最近 40 条 · 重置演练后清空</span></p><ol class="journal-list">'+entries.slice().reverse().map(e=>`<li><span>行军 ${e.step} 格</span><p>${escape(e.text)}</p></li>`).join('')+'</ol>';
  }
  content.innerHTML=html;
 }
 function open(next='realm',selectedCity){pause();view=next;if(selectedCity)cityName=selectedCity;if(!dialog.open)dialog.showModal();render();}
 function close(){dialog.close();}
 dialog.addEventListener('change',e=>{if(e.target.id==='rosterFaction'){rosterOptions.faction=e.target.value;const rows=rosterRows(rosterOptions);if(!rows.some(o=>o.id===selectedOfficer))selectedOfficer=rows[0].id;render();content.querySelector('#rosterFaction').focus({preventScroll:true});}});
 document.getElementById('closeIntel').onclick=close;
 document.getElementById('intelTabs').innerHTML=tabs.map(([key,name])=>`<button data-view="${key}" aria-pressed="false">${name}</button>`).join('');
 dialog.addEventListener('click',e=>{
  const sortButton=e.target.closest('[data-roster-sort]');if(sortButton){const i=Number(sortButton.dataset.rosterSort);rosterOptions.descending=rosterOptions.sort===i?!rosterOptions.descending:true;rosterOptions.sort=i;render();content.querySelector('[data-roster-sort="'+i+'"]').focus({preventScroll:true});return;}
  const officerButton=e.target.closest('[data-officer]');if(officerButton){selectedOfficer=Number(officerButton.dataset.officer);render();content.querySelector('button[data-officer="'+selectedOfficer+'"]').focus({preventScroll:true});return;}
  const viewButton=e.target.closest('[data-view]');if(viewButton){view=viewButton.dataset.view;render();return;}
  const cityButton=e.target.closest('[data-city]');if(cityButton){cityName=cityButton.dataset.city;render();return;}
  const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
  const city=cities.find(c=>c.name===cityName)||cities[0];
  if(action.startsWith('watch-')){close();inspectActor(action.slice(6));}
  else if(action.startsWith('cities-')){cityName=cities.find(c=>c.owner===Number(action.split('-')[1])).name;view='cities';render();}
  else if(action==='locate-city'){close();focusCity(city);}
  else if(action==='plan-city'){close();plan(city);}
  else if(action==='locate-unit'){close();focusUnit();}
  else if(action==='choose-march'){close();focusUnit();document.getElementById('event').textContent='请右键地图目的地，直接下令移动；左键查看情报。';}
  else if(action==='standby'){standby();render();}
  else if(action==='return'){close();plan(cities[0]);}
 });
 return{open,refresh:render,record(text){entries.push({step:getWorld().unit.steps,text});entries=entries.slice(-40);render();},reset(){entries=[];render();}};
}
