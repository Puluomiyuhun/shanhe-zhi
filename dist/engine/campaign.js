import {scenario} from './runtime.js';
import {cities as initialCities,factions,faction} from './world.js';

export const CAMPAIGN_TURN_MS=2000;
const pair=(a,b)=>[a,b].sort((x,y)=>x-y).join(':');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

// Pure deterministic simulation; no DOM, timers, or mutations of scenario data.
export function createCampaign(world,onEvent=()=>{},options={}){
 let turn=0,elapsed=0,clock=0,cursor=0,revision=0,serial=0;
 const events=[],relations=new Map(),routeCache=new Map();
 const stats={recruited:0,casualties:0,disbanded:0,battles:0,captures:0,sorties:0,alliances:0,peaces:0,routeQueries:0};
 const cities=initialCities.map((c,i)=>({...c,cell:world.nearest(c.x,c.z).id,gold:1500+i%4*180,grain:4800+i%5*250,garrison:2400+i%6*220,development:35+i%5*4,order:80,walls:75,project:'休养',lastCapture:-100}));
 world.cities=cities;
 const byName=new Map(cities.map(c=>[c.name,c]));
 const states=factions.map(f=>({id:f.id,policy:'休养生息',lastSortie:-20,cooldown:0,eliminated:false}));
 const countries=new Map(states.map(s=>[s.id,s]));
 const owned=id=>cities.filter(c=>c.owner===id);
 const armies=factions.flatMap(f=>[0,1].map(slot=>{
  const officers=scenario.officers.filter(o=>o.owner===f.id&&!scenario.actors.some(a=>a.kind==='traveler'&&a.name===o.name)).sort((a,b)=>b.stats[0]-a.stats[0]||a.id-b.id);
  const leader=officers[slot]||officers[0];const home=owned(f.id)[0];
  return{id:'state-'+f.id+'-'+slot,name:leader?.name||f.ruler,owner:f.id,kind:'army',mission:'campaign',slot,command:leader?.stats[0]||60,active:false,troops:0,cell:home.cell,path:[],progress:0,phase:'整备',home:home.name,destination:home.name,reason:'等待国中军令',trips:0,steps:0,visits:{},morale:100,food:0,initialTroops:0,order:'attack',targetArmy:null,serial:0};
 }));
 // Every province is tied to an initial city. Captures transfer its remaining old-owner land.
 const provinces=new Map(cities.map(c=>[c.name,[]]));
 for(const cell of world.cells){const choices=cities.filter(c=>c.owner===cell.owner);const c=choices.reduce((a,b)=>distance(a,cell)<distance(b,cell)?a:b);provinces.get(c.name).push(cell.id);}
 const initialTroops=cities.reduce((s,c)=>s+c.garrison,0);
 function emit(type,text){const e={turn,type,text};events.push(e);if(events.length>100)events.shift();onEvent('第 '+turn+' 旬 · '+text);}
 function relation(a,b){return a===b?{status:'self'}:relations.get(pair(a,b))||{status:'peace',until:0};}
 const atWar=(a,b)=>a!==b&&relation(a,b).status==='war';
 const active=()=>armies.filter(a=>a.active);
 function power(id){return owned(id).reduce((s,c)=>s+c.garrison,0)+armies.filter(a=>a.active&&a.owner===id).reduce((s,a)=>s+a.troops,0);}
 function route(from,to){const key=from+':'+to;if(routeCache.has(key))return routeCache.get(key);stats.routeQueries++;const result=world.route(from,to);if(routeCache.size>=128)routeCache.delete(routeCache.keys().next().value);routeCache.set(key,result);return result;}
 function position(a){const from=world.cells[a.cell],next=world.cells[a.path[0]];if(!next)return{x:from.x,z:from.z};const t=Math.min(1,a.progress/(next.cost*270));return{x:from.x+(next.x-from.x)*t,z:from.z+(next.z-from.z)*t};}
 function go(a,cell){const r=route(a.cell,cell);if(!r)return false;a.path=r.path.slice(1);a.progress=0;return true;}
 function dismiss(a){stats.disbanded+=a.troops;a.troops=0;a.active=false;a.path=[];a.progress=0;a.phase='解散';}
 function returnArmy(a,reason){if(!a.active||a.order==='return')return;const homes=owned(a.owner).sort((x,y)=>distance(x,world.cells[a.cell])-distance(y,world.cells[a.cell]));for(const c of homes){if(go(a,c.cell)){a.home=c.name;a.destination=c.name;a.order='return';a.phase='撤军';a.reason=reason;emit('retreat',faction(a.owner).name+'军 '+a.name+'撤往'+c.name+'：'+reason);return;}}dismiss(a);}
 function declareWar(a,b,reason='争夺边邑'){
  if(a===b||!owned(a).length||!owned(b).length||['alliance','truce','war'].includes(relation(a,b).status))return false;
  relations.set(pair(a,b),{a,b,status:'war',since:turn,until:0});emit('war',faction(a).name+'向'+faction(b).name+'宣战：'+reason+'。');return true;
 }
 function makeAlliance(a,b){if(a===b||!owned(a).length||!owned(b).length||relation(a,b).status!=='peace')return false;
  const count=id=>[...relations.values()].filter(r=>r.status==='alliance'&&(r.a===id||r.b===id)).length;
  if(count(a)>=2||count(b)>=2)return false;
  relations.set(pair(a,b),{a,b,status:'alliance',since:turn,until:turn+48});stats.alliances++;emit('alliance',faction(a).name+'与'+faction(b).name+'结盟，约定互不侵犯、遇敌援助（48旬）。');return true;
 }
 function makePeace(a,b,reason='久战休兵'){if(!atWar(a,b))return false;relations.set(pair(a,b),{a,b,status:'truce',since:turn,until:turn+18});stats.peaces++;emit('peace',faction(a).name+'与'+faction(b).name+'停战18旬：'+reason+'。');for(const army of active())if((army.owner===a&&byName.get(army.destination)?.owner===b)||(army.owner===b&&byName.get(army.destination)?.owner===a)||army.targetArmy&&((army.owner===a&&armies.find(t=>t.id===army.targetArmy)?.owner===b)||(army.owner===b&&armies.find(t=>t.id===army.targetArmy)?.owner===a)))returnArmy(army,'停战收兵');return true;}
 function dispatch(owner,fromName,targetName,order='attack',targetArmy=null){
  const from=byName.get(fromName),target=byName.get(targetName);
  if(!from||!target||from.owner!==owner||active().length>=18)return null;
  if(order==='attack'&&!atWar(owner,target.owner))return null;
  if(targetArmy&&!atWar(owner,targetArmy.owner))return null;
  const slot=armies.find(a=>a.owner===owner&&!a.active&&a.slot===(order==='attack'?0:1));
  const troops=Math.floor(from.garrison*(order==='attack'?.65:.52));
  if(!slot||troops<650||from.gold<250||from.grain<1000)return null;
  const destination=targetArmy?.cell??target.cell,r=route(from.cell,destination);if(!r)return null;
  from.garrison-=troops;from.gold-=250;const food=Math.min(from.grain*.45,troops*1.5);from.grain-=food;
  Object.assign(slot,{active:true,cell:from.cell,path:r.path.slice(1),progress:0,troops,initialTroops:troops,food,morale:100,order,targetArmy:targetArmy?.id||null,targetSerial:targetArmy?.serial||0,home:from.name,destination:target.name,phase:order==='attack'?'出征':'迎战',reason:order==='attack'?'奉命攻取'+target.name:'出兵拦截来犯部队，保护'+target.name,serial:++serial,trips:slot.trips+1});
  countries.get(owner).lastSortie=turn;stats.sorties++;emit('sortie',faction(owner).name+'军 '+slot.name+'率'+troops+'兵自'+from.name+(order==='attack'?'出征':'出城迎战，驰援')+target.name+'。');return slot;
 }
 function capture(a,city){
  const old=city.owner;city.owner=a.owner;city.walls=25;city.order=45;city.lastCapture=turn;
  for(const id of provinces.get(city.name))if(world.cells[id].owner===old)world.cells[id].owner=a.owner;
  world.cells[city.cell].owner=a.owner;
  const garrison=Math.min(a.troops,Math.max(300,Math.floor(a.troops*.35)));a.troops-=garrison;city.garrison=garrison;
  stats.captures++;revision++;emit('capture',a.name+'攻克'+city.name+'，'+faction(old).name+' → '+faction(a.owner).name+'。');
  if(!owned(old).length){countries.get(old).eliminated=true;for(const b of active().filter(b=>b.owner===old))dismiss(b);for(const r of relations.values())if(r.a===old||r.b===old){r.status='peace';r.until=0;}emit('elimination',faction(old).name+'失去全部城邑，退出本轮角逐。');}
  returnArmy(a,'战后回城休整');
 }
 function domestic(){for(const c of cities){
  const underSiege=active().some(a=>a.order==='attack'&&atWar(a.owner,c.owner)&&distance(position(a),c)<5);
  c.gold=Math.min(30000,c.gold+75+c.development*1.4);
  c.grain=Math.min(60000,Math.max(0,c.grain+160+c.development*3-c.garrison*.022));
  c.order=Math.min(100,c.order+(underSiege?0:1));
  const state=countries.get(c.owner),danger=active().some(a=>a.order==='attack'&&a.destination===c.name&&atWar(a.owner,c.owner));
  if(c.grain<1300){c.project='屯田';c.grain+=250;}
  else if(c.walls<80&&c.gold>=140){c.project='修筑';c.gold-=140;c.walls=Math.min(100,c.walls+5);}
  else if(c.garrison<(danger?4300:3200+c.development*18)&&c.gold>=110&&c.grain>=250&&!underSiege){const n=Math.min(115,Math.floor(c.grain/3));c.project='征募';c.gold-=110;c.grain-=n*2;c.garrison+=n;stats.recruited+=n;}
  else if(c.development<100&&c.gold>=180&&!danger){c.project='兴商';c.gold-=180;c.development=Math.min(100,c.development+1.5);}
  else c.project='休养';
  state.policy=danger?'守土御敌':c.project==='征募'?'练兵备战':c.project==='兴商'?'富国兴商':'休养生息';
 }}
 function decide(state){const homes=owned(state.id);if(!homes.length)return;
  const hostile=active().filter(a=>atWar(state.id,a.owner)&&a.order==='attack'&&homes.some(c=>c.name===a.destination));
  if(hostile.length){const enemy=hostile[0],city=byName.get(enemy.destination);const from=homes.filter(c=>c.garrison>1250).sort((a,b)=>distance(a,position(enemy))-distance(b,position(enemy)))[0];if(from)dispatch(state.id,from.name,city.name,'defend',enemy);}
  // Allies can join a defensive war and send an actual field army. No recursive alliance cascade.
  if(!hostile.length&&!armies.some(a=>a.owner===state.id&&a.active&&a.slot===1)){
   const threatened=active().find(a=>a.order==='attack'&&relation(state.id,byName.get(a.destination)?.owner).status==='alliance'&&relation(state.id,a.owner).status==='peace');
   if(threatened){declareWar(state.id,threatened.owner,'履行盟约援助'+byName.get(threatened.destination).name);dispatch(state.id,homes[0].name,threatened.destination,'defend',threatened);return;}
  }
  const neighbors=cities.filter(c=>c.owner!==state.id).map(c=>({city:c,d:Math.min(...homes.map(h=>distance(h,c)))})).sort((a,b)=>a.d-b.d).slice(0,6);
  if(!neighbors.length)return;
  if(turn>=4&&((state.id+turn)%5===0||hostile.length)){
   const ally=neighbors.find(n=>relation(state.id,n.city.owner).status==='peace'&&power(n.city.owner)<power(state.id)*1.5);
   if(ally&&makeAlliance(state.id,ally.city.owner))return;
  }
  if(hostile.length||turn-state.lastSortie<12||armies.some(a=>a.active&&a.owner===state.id&&a.order==='attack'))return;
  const source=homes.slice().sort((a,b)=>b.garrison-a.garrison)[0];if(source.garrison<2500)return;
  let target=neighbors.find(n=>atWar(state.id,n.city.owner));
  if(!target&&[...relations.values()].filter(r=>r.status==='war').length<8&&turn>=3){
   target=neighbors.filter(n=>relation(state.id,n.city.owner).status==='peace'&&source.garrison*.65>n.city.garrison*.55).sort((a,b)=>(a.city.garrison*.015+a.d)-(b.city.garrison*.015+b.d))[0];
   if(target&&!declareWar(state.id,target.city.owner,'争取边境通道'))target=null;
  }
  if(target)dispatch(state.id,source.name,target.city.name);
 }
 function logistics(){for(const a of active()){
  a.food=Math.max(0,a.food-a.troops*.035);if(!a.food)a.morale=Math.max(0,a.morale-12);
  if(a.order!=='return'&&(a.morale<35||a.troops<a.initialTroops*.28))returnArmy(a,a.food?'兵力损耗，保存余部':'随军粮草不足');
  if(a.order==='attack'){const c=byName.get(a.destination);if(!atWar(a.owner,c.owner))returnArmy(a,'目标已非敌城');}
  if(a.order==='defend'){
   const enemy=armies.find(b=>b.id===a.targetArmy&&b.serial===a.targetSerial&&b.active);
   if(!enemy||!atWar(a.owner,enemy.owner))returnArmy(a,'敌军已退，结束迎击');
   else if(turn%3===0&&distance(position(a),position(enemy))>4)go(a,enemy.cell);
  }
 }}
 function battle(){const list=active(),engaged=new Set();
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   const a=list[i],b=list[j];if(engaged.has(a.id)||engaged.has(b.id)||!atWar(a.owner,b.owner)||distance(position(a),position(b))>4.5)continue;
   const strength=x=>Math.sqrt(x.troops)*(5+x.command/25)*(x.morale/100)*(['山地','林地','关隘'].includes(world.cells[x.cell].terrain)?1.12:1);
   const da=Math.min(a.troops,Math.ceil(strength(b))),db=Math.min(b.troops,Math.ceil(strength(a)));
   a.troops-=da;b.troops-=db;stats.casualties+=da+db;stats.battles++;engaged.add(a.id);engaged.add(b.id);a.phase=b.phase='交战';
   a.morale=Math.max(0,a.morale-7);b.morale=Math.max(0,b.morale-7);
   if(turn%3===0)emit('battle',a.name+'与'+b.name+'野外交战，双方损失'+da+' / '+db+'兵。');
   for(const army of [a,b])if(!army.troops){army.active=false;army.path=[];army.phase='溃散';emit('defeat',faction(army.owner).name+'军 '+army.name+'兵力耗尽。');}
  }
  for(const a of active())if(a.order==='attack'&&!engaged.has(a.id)){
   const c=byName.get(a.destination);if(!atWar(a.owner,c.owner)||distance(position(a),c)>3.5)continue;
   a.phase='攻城';const loss=Math.min(a.troops,Math.ceil(Math.sqrt(c.garrison)*(3+c.walls/40))),defLoss=Math.min(c.garrison,Math.ceil(Math.sqrt(a.troops)*(4+a.command/40)/(1+c.walls/100)));
   a.troops-=loss;c.garrison-=defLoss;c.walls=Math.max(0,c.walls-9);a.morale=Math.max(0,a.morale-3);stats.casualties+=loss+defLoss;
   if(turn%4===0)emit('siege',a.name+'正在攻打'+c.name+'，守军'+c.garrison+'，城防'+c.walls+'。');
   if(!a.troops){a.active=false;a.path=[];a.phase='溃散';}
   else if(!c.garrison)capture(a,c);
  }
 }
 function diplomacy(){for(const r of relations.values()){
  if(r.until&&turn>=r.until){const previous=r.status;r.status='peace';r.until=0;emit('diplomacy',faction(r.a).name+'与'+faction(r.b).name+(previous==='alliance'?'盟约期满。':'停战期结束。'));}
  if(r.status==='war'&&turn-r.since>=36)makePeace(r.a,r.b,'久战疲敝，恢复生产');
 }}
 function tick(){turn++;domestic();diplomacy();logistics();battle();
  if(options.decisions!==false)for(let i=0;i<4;i++){decide(states[cursor%states.length]);cursor++;}
  if(turn%6===0){const c=cities[(turn/6-1)%cities.length];emit('domestic',c.name+'正在'+c.project+'，府库'+Math.floor(c.gold)+'、粮草'+Math.floor(c.grain)+'、守军'+c.garrison+'。');}
 }
 function advance(ms){if(!Number.isFinite(ms)||ms<=0)return;let remaining=ms;while(remaining>0){const dt=Math.min(100,remaining,CAMPAIGN_TURN_MS-elapsed);remaining-=dt;clock+=dt;
  for(const a of active()){
   // Battle locks movement for this turn; retreating armies can disengage next tick.
   if(a.phase==='交战'&&a.order!=='return')continue;
   let budget=dt;while(a.path.length&&budget>0){const next=world.cells[a.path[0]],duration=next.cost*270,used=Math.min(duration-a.progress,budget);a.progress+=used;budget-=used;if(a.progress+1e-6>=duration){a.cell=a.path.shift();a.progress=0;a.steps++;}}
   if(!a.path.length&&a.order==='return'){
    const home=byName.get(a.home);if(home?.owner===a.owner){home.garrison+=a.troops;home.grain+=a.food;a.troops=0;a.active=false;a.phase='休整';a.food=0;}
    else{a.order='attack';returnArmy(a,'归城已失，转往友城');}
   }
  }
  elapsed+=dt;if(elapsed+1e-6>=CAMPAIGN_TURN_MS){elapsed-=CAMPAIGN_TURN_MS;for(const a of active())if(a.phase==='交战')a.phase=a.order==='attack'?'出征':a.order==='return'?'撤军':'迎战';tick();}
 }}
 return{cities,states,armies,relations,events,stats,initialTroops,advance,position,relation,atWar,declareWar,makeAlliance,makePeace,dispatch,owned,power,get turn(){return turn},get time(){return clock},get revision(){return revision}};
}
