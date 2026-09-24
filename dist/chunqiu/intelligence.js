import {factions,faction} from './world.js';
import {rosterMarkup,rosterRows,officersInCity} from './roster.js';
// Object-focused information and orders share the live map state.
export function createIntelligence({getWorld,getSimulation,inspectActor,cities,pause,focusCity,focusUnit,plan,standby}){
 const dialog=document.getElementById('intelligence'),content=document.getElementById('intelContent');
 const tabs=[['realm','势力'],['cities','城市'],['officer','人物'],['roster','卿士'],['unit','部队'],['journal','军情']];
 let cachedWorld=null,cachedCell=-1,cachedBlocked=null,routeCache=new Map();
 function routeTo(w,city){if(w!==cachedWorld||w.unit.cell!==cachedCell||w.blocked!==cachedBlocked){cachedWorld=w;cachedCell=w.unit.cell;cachedBlocked=w.blocked;routeCache.clear();}if(!routeCache.has(city.name))routeCache.set(city.name,w.route(w.unit.cell,w.nearest(city.x,city.z).id));return routeCache.get(city.name);}
 let cityFaction='all';
 let view='realm',cityName=cities[0].name,entries=[],selectedOfficer=0;const rosterOptions={city:"all",faction:"all",sort:-1,descending:true};
 const owner=id=>faction(id).name;
 const button=(action,text,disabled=false)=>`<button data-action="${action}" ${disabled?'disabled':''}>${text}</button>`;
 const datum=(label,value)=>`<div><dt>${label}</dt><dd>${value}</dd></div>`;
 const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function unitState(w){return w.unit.path.length?'军令已下 · 剩余 '+w.unit.path.length+' 格':'原地待命';}
 function render(){
  if(!dialog.open)return;
  dialog.classList.toggle('roster-view',['roster','cities','unit','realm'].includes(view));
  const w=getWorld(),c=w.cells[w.unit.cell],supply=w.supplied();
  document.getElementById('intelTitle').textContent={realm:'势力情报',cities:'城市情报',officer:'人物与指令',roster:'卿士名录',unit:'部队情报',journal:'军情簿'}[view];
  for(const b of dialog.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===view));
  let html='';
  if(view==='realm'){
   html='<div class="roster-toolbar"><div><strong>天下势力</strong><span>二十八方势力 · 演练配置</span></div><span>选择势力，查阅所属城市</span></div><div class="officer-table-scroll"><table class="officer-table army-ledger"><thead><tr><th>势力</th><th>主政人物</th><th>区域</th><th>控制土地</th><th>城池</th><th>情报</th></tr></thead><tbody>';
   for(const f of factions){const count=w.cells.filter(c=>c.owner===f.id).length,controlled=cities.filter(c=>c.owner===f.id);html+=`<tr><th><i class="realm-dot" style="background:${f.color}"></i>${button('cities-'+f.id,f.name+(f.id===1?' · 所属':''))}</th><td>${f.ruler}</td><td>${f.region}</td><td>${count.toLocaleString()} 格</td><td>${controlled.length} 城</td><td>${button('cities-'+f.id,'所属城市 ›')}</td></tr>`;}
   html+='</tbody></table></div><p class="intel-note">归属为地图演练配置，非历史复原。土地随占领变化；城市归属固定，财政、外交和攻防尚未接入。</p>';
  }else if(view==='cities'){
   const city=cities.find(x=>x.name===cityName)||cities[0],target=w.nearest(city.x,city.z),route=routeTo(w,city),steps=route?route.path.length-1:null;
   html=`<div class="roster-toolbar"><div><strong>城市一览</strong><span>${cities.filter(c=>cityFaction==='all'||String(c.owner)===cityFaction).length} / ${cities.length} 城</span></div><label>势力 <select id="cityFactionFilter"><option value="all">全部势力</option>${factions.map(f=>`<option value="${f.id}" ${cityFaction===String(f.id)?'selected':''}>${f.name}</option>`).join('')}</select></label></div><div class="city-intel-layout"><div class="city-list officer-table-scroll"><table class="officer-table"><thead><tr><th>城市</th><th>势力</th><th>地形</th><th>驻将</th><th>距本队</th></tr></thead><tbody>`;
   for(const item of cities.filter(c=>cityFaction==='all'||String(c.owner)===cityFaction)){const r=routeTo(w,item);html+=`<tr data-city="${item.name}" class="${city.name===item.name?'is-selected':''}"><th><button data-city="${item.name}" aria-pressed="${city.name===item.name}">${item.name}</button></th><td><i class="realm-dot" style="background:${faction(item.owner).color}"></i>${owner(item.owner)}</td><td>${w.nearest(item.x,item.z).terrain}</td><td>${officersInCity(item.name,getSimulation()).length}</td><td>${r?r.path.length-1+' 格':'不可达'}</td></tr>`;}
   html+='</tbody></table>';
   html+=`</div><section class="intel-card city-dossier"><div class="dossier-top"><span class="city-emblem" aria-hidden="true">城</span><div><small>${city.owner===1?'己方据点':'对方据点'}</small><h3>${city.name}</h3><p>${owner(city.owner)}军</p></div></div><dl class="intel-stats">${datum('行军距离',steps===null?'无可达路线':steps===0?'已在城址':steps+' 格')}${datum('预计成本',route?route.cost.toFixed(1):'—')}${datum('城址地形',target.terrain)}${datum('出发部队','姬衡 · 1,200')}</dl><p class="intel-note">${city.name==='绛'?'晋国先遣旅的出发地与补给源。':city.name==='曲沃'?'沿河汾通路巡行，可返回绛城整备。':'本轮演练据点，可查看地形与抵近路线，暂不进行攻城。'}</p><div class="intel-actions">${button('city-officers','驻将名录 · '+officersInCity(city.name,getSimulation()).length)}${button('locate-city','地图定位')}${button('plan-city',steps===0?'已在此地':'移动至此',!route||steps===0||w.unit.morale<=0)}</div></section></div>`;
  }else if(view==='officer'){
   html=`<div class="personal-banner"><div class="dossier-portrait"><img src="assets/shi.svg" alt="原创士人纹章"></div><div><small>你扮演的卿士</small><h3>姬衡</h3><p>晋文公麾下 · 先遣旅指挥</p></div><span class="mode-tag">单卿士模式</span></div><dl class="intel-stats four">${datum('可指挥兵力','1,200')}${datum('所在位置',c.terrain+' · '+c.q+','+c.r)}${datum('部队士气',w.unit.morale)}${datum('补给状态',supply?'连通':'中断')}</dl><h4>当前可下达的指令</h4><div class="personal-orders"><button data-action="choose-march"><b>行 军</b><span>右键地图目的地，立即下令并开始移动。</span></button><button data-action="standby"><b>原地待命</b><span>停止推进，撤销本队尚未完成的路线。</span></button><button data-action="return" ${w.unit.cell===w.origin.id||w.unit.morale<=0?'disabled':''}><b>返回绛</b><span>立即沿可达路线返回绛。</span></button></div><p class="intel-note">当前身份可指挥本队；城市任免、全势力外交不属于本队指令。姬衡为原创晋国士人。</p><details class="future-roles"><summary>后续角色玩法方向</summary><p>拟接入：交游拜访、修习能力、接受任务、仕官与升迁；获得职位后逐步开放内政与提案。这些玩法尚未接入三维样区。</p></details>`;
  }else if(view==='roster'){
   html=rosterMarkup(selectedOfficer,rosterOptions,getSimulation());
  }else if(view==='unit'){
   const armies=getSimulation().actors.filter(a=>a.kind==='army');
   html=`<div class="roster-toolbar"><div><strong>在编部队</strong><span>${armies.length+1} 队</span></div><span>点击部队，定位查看军情</span></div><div class="officer-table-scroll"><table class="officer-table army-ledger"><thead><tr><th>主将</th><th>势力</th><th>兵力</th><th>军令</th><th>目标 / 路程</th><th>查看</th></tr></thead><tbody><tr><th>${button('locate-unit','姬衡 · 本队')}</th><td>晋</td><td>1,200</td><td>${w.unit.path.length?'行军':'待命'}</td><td>${w.unit.path.length?'剩余 '+w.unit.path.length+' 格':'原地驻守'}</td><td>${button('locate-unit','定位')}</td></tr>${armies.map(a=>`<tr><th>${button('watch-'+a.id,a.name)}</th><td><i class="realm-dot" style="background:${faction(a.owner).color}"></i>${owner(a.owner)}</td><td>${a.troops.toLocaleString()}</td><td>${a.phase}</td><td>${a.destination} · ${a.path.length} 格</td><td>${button('watch-'+a.id,'观察')}</td></tr>`).join('')}</tbody></table></div><p class="intel-note">独自游历的卿士请查阅「卿士」。当前出征仅执行抵近侦察，尚未结算交战。</p>`;
  }else{
   html='<p class="intel-lead">行军纪事 <span>最近 40 条 · 重置演练后清空</span></p><ol class="journal-list">'+entries.slice().reverse().map(e=>`<li><span>行军 ${e.step} 格</span><p>${escape(e.text)}</p></li>`).join('')+'</ol>';
  }
  content.innerHTML=html;
 }
 function open(next='realm',selectedCity){pause();view=next;if(selectedCity)cityName=selectedCity;if(!dialog.open)dialog.showModal();render();}
 function close(){dialog.close();}
 dialog.addEventListener('change',e=>{if(e.target.id==='cityFactionFilter'){cityFaction=e.target.value;cityName=cities.find(c=>cityFaction==='all'||String(c.owner)===cityFaction).name;render();content.querySelector('#cityFactionFilter').focus();return;}if(['rosterFaction','rosterCity'].includes(e.target.id)){const key=e.target.id;rosterOptions[key==='rosterCity'?'city':'faction']=e.target.value;const rows=rosterRows(rosterOptions,getSimulation());if(!rows.some(o=>o.id===selectedOfficer))selectedOfficer=rows[0]?.id??-1;render();content.querySelector('#'+key).focus({preventScroll:true});}});
 document.getElementById('closeIntel').onclick=close;
 document.getElementById('intelTabs').innerHTML=tabs.map(([key,name])=>`<button data-view="${key}" aria-pressed="false">${name}</button>`).join('');
 dialog.addEventListener('click',e=>{
  const sortButton=e.target.closest('[data-roster-sort]');if(sortButton){const i=Number(sortButton.dataset.rosterSort);rosterOptions.descending=rosterOptions.sort===i?!rosterOptions.descending:true;rosterOptions.sort=i;render();content.querySelector('[data-roster-sort="'+i+'"]').focus({preventScroll:true});return;}
  const officerButton=e.target.closest('[data-officer]');if(officerButton){const scroll=content.querySelector('.officer-table-scroll')?.scrollTop||0;selectedOfficer=Number(officerButton.dataset.officer);render();content.querySelector('.officer-table-scroll').scrollTop=scroll;content.querySelector('button[data-officer="'+selectedOfficer+'"]').focus({preventScroll:true});return;}
  const viewButton=e.target.closest('[data-view]');if(viewButton){view=viewButton.dataset.view;render();return;}
  const cityButton=e.target.closest('[data-city]');if(cityButton){cityName=cityButton.dataset.city;const scroll=content.querySelector('.city-list').scrollTop;render();content.querySelector('.city-list').scrollTop=scroll;content.querySelector('button[data-city="'+cityName+'"]').focus({preventScroll:true});return;}
  const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
  const city=cities.find(c=>c.name===cityName)||cities[0];
  if(action.startsWith('watch-')){close();inspectActor(action.slice(6));}
  else if(action.startsWith('cities-')){cityFaction=action.split('-')[1];cityName=cities.find(c=>c.owner===Number(cityFaction)).name;view='cities';render();}
  else if(action==='city-officers'){rosterOptions.city=city.name;rosterOptions.faction='all';selectedOfficer=officersInCity(city.name,getSimulation())[0]?.id??-1;view='roster';render();}
  else if(action==='locate-city'){close();focusCity(city);}
  else if(action==='plan-city'){close();plan(city);}
  else if(action==='locate-unit'){close();focusUnit();}
  else if(action==='choose-march'){close();focusUnit();document.getElementById('event').textContent='请右键地图目的地，直接下令移动；左键查看情报。';}
  else if(action==='standby'){standby();render();}
  else if(action==='return'){close();plan(cities[0]);}
 });
 return{open,openOfficer(id){rosterOptions.city='all';rosterOptions.faction='all';selectedOfficer=id;open('roster');content.querySelector('tr.is-selected')?.scrollIntoView({block:'nearest'});},refresh:render,record(text){entries.push({step:getWorld().unit.steps,text});entries=entries.slice(-40);render();},reset(){entries=[];render();}};
}
