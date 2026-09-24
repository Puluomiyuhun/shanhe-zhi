import {scenario} from './runtime.js';
import {height} from './world.js';
import {waterAt,passes,crossings} from './geography.js';

export const FACILITY_TYPES={
 farm:{name:'屯田',cost:500,grain:450,turns:5,effect:'每旬粮草 +100',goldBonus:0,grainBonus:100,recruitBonus:0},
 market:{name:'市集',cost:650,grain:350,turns:6,effect:'每旬府库 +65',goldBonus:65,grainBonus:0,recruitBonus:0},
 camp:{name:'兵站',cost:600,grain:550,turns:6,effect:'集结补粮与休整 · 征募 +30 · 守城 +10%',goldBonus:0,grainBonus:0,recruitBonus:30}
};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createEvolution(ctx){
 const {world,cities,factions,states,armies,byName,countries,provinces,owned,active,position,go,returnArmy,emit,stats,transfer,makeSlots,bump,turn:now,options}=ctx;
 const facilities=[],officerAllegiances=new Map(),officerHomes=new Map(),siteCache=new Map();
 const seed=Number(options.seed??(scenario.id==='chunqiu'?9173:3191))>>>0;let rng=seed||1,visualRevision=0,lastPolitics=-100,lastRogue=-100,newStates=0,newCities=0,facilitySerial=0;
 const random=()=>{rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;return(rng>>>0)/4294967296;};
 const faction=id=>factions.find(f=>f.id===id);
 Object.assign(stats,{defections:0,independences:0,wanderers:0,founded:0,built:0,abandoned:0});
 for(const [i,c]of cities.entries()){
  const governor=scenario.officers.filter(o=>o.place===c.name&&o.name!==faction(c.owner).ruler&&!scenario.actors.some(a=>a.kind==='traveler'&&a.name===o.name)).sort((a,b)=>b.stats[3]-a.stats[3])[0];
  c.governor=governor?.name||faction(c.owner).ruler;c.loyalty=62+(i*17%34);c.lastPolitics=-100;c.facilities=[];
 }
 const flat=(x,z,r=1.7)=>waterAt(x,z).shore>2.4&&[[r,0],[-r,0],[0,r],[r,r],[-r,-r],[0,-r]].every(([dx,dz])=>waterAt(x+dx,z+dz).shore>1&&Math.abs(height(x+dx,z+dz)-height(x,z))<.38);
 const military=a=>a.slot!==2;
 function bonus(city){return city.facilities.filter(f=>f.status==='complete'&&world.cells[f.cell].owner===city.owner).reduce((n,f)=>{const d=FACILITY_TYPES[f.kind];n.gold+=d.goldBonus;n.grain+=d.grainBonus;n.recruit+=d.recruitBonus;n.defense+=f.kind==='camp'?.1:0;return n;},{gold:0,grain:0,recruit:0,defense:0});}
 function plots(city){if(siteCache.has(city.name))return siteCache.get(city.name);
  const points=world.cells.filter(c=>c.walkable&&!c.road&&!c.feature&&c.y<2.7&&dist(c,city)>6&&dist(c,city)<12&&cities.every(t=>dist(t,c)>5.5)&&passes.every(p=>dist(p,c)>4)&&crossings.every(p=>dist(p,c)>4)).sort((a,b)=>Math.abs(dist(a,city)-8.5)-Math.abs(dist(b,city)-8.5)||a.id-b.id).filter(c=>flat(c.x,c.z));
  siteCache.set(city.name,points);return points;
 }
 function build(cityName,kind){const city=byName.get(cityName),type=FACILITY_TYPES[kind];if(!city||!type||kind==='camp'&&now()-(city.lastDepotLoss??-100)<24||city.facilities.some(f=>f.kind===kind)||city.facilities.length>=3||city.gold<type.cost||city.grain<type.grain+450||city.garrison<900||active().filter(a=>a.slot===2).length>=8)return null;
  const a=armies.find(a=>a.owner===city.owner&&a.slot===2&&!a.active);if(!a)return null;
  const site=plots(city).find(c=>c.owner===city.owner&&facilities.every(f=>dist(f,c)>4.5)&&ctx.scenery.every(f=>dist(f,c)>4));if(!site)return null;const route=ctx.route(city.cell,site.id);if(!route)return null;
  // Start at the source city before routing; stale idle positions must not teleport a work crew.
  a.cell=city.cell;a.path=route.path.slice(1);a.progress=0;
  city.gold-=type.cost;city.grain-=type.grain+450;city.garrison-=280;
  const f={id:'facility-'+(++facilitySerial),kind,name:city.name+'·'+type.name,city:city.name,owner:city.owner,cell:site.id,x:site.x,z:site.z,y:height(site.x,site.z),angle:0,status:'building',progress:0,required:type.turns,crew:a.id,basis:'国家建设',description:type.effect};
  city.facilities.push(f);facilities.push(f);Object.assign(a,{name:faction(city.owner).name+'工役队',active:true,troops:280,initialTroops:280,food:450,morale:100,order:'build',phase:'赴工地',home:city.name,destination:city.name,reason:'赴城外修建'+type.name+'；'+type.effect,job:f.id,targetArmy:null,trips:a.trips+1});visualRevision++;
  emit('construction',city.governor+'派280人工役队在'+city.name+'城外营建'+type.name+'。');return f;
 }
 function cancel(f){if(f.status!=='building')return;f.status='abandoned';facilities.splice(facilities.indexOf(f),1);const city=byName.get(f.city);city.facilities.splice(city.facilities.indexOf(f),1);stats.abandoned++;visualRevision++;const a=armies.find(a=>a.id===f.crew);if(a?.active&&a.job===f.id)returnArmy(a,'工地失守或军情紧急，撤回余部');}
 function construction(){for(const f of [...facilities])if(f.status==='building'){
  const c=byName.get(f.city),a=armies.find(a=>a.id===f.crew);
  if(!a?.active||a.order!=='build'||c.owner!==f.owner||world.cells[f.cell].owner!==f.owner){cancel(f);continue;}
  if(active().some(b=>ctx.atWar(a.owner,b.owner)&&military(b)&&dist(position(b),f)<7)){cancel(f);continue;}
  if(!a.path.length&&a.cell===f.cell){a.phase='施工';f.progress++;if(f.progress>=f.required){f.status='complete';stats.built++;visualRevision++;emit('built',f.name+'建成，'+FACILITY_TYPES[f.kind].effect+'。');returnArmy(a,'设施竣工，工役归营');}}
 }}
 function plan(state){if(now()<3||now()%2!==state.id%2||active().some(a=>a.owner===state.id&&a.slot===2))return;
  for(const city of owned(state.id).sort((a,b)=>a.facilities.length-b.facilities.length)){
   if(active().some(a=>['attack','raid','rally'].includes(a.order)&&a.destination===city.name&&ctx.atWar(a.owner,city.owner)))continue;
   const border=cities.some(c=>c.owner!==city.owner&&dist(c,city)<35);const order=city.grain<2000?['farm','camp','market']:border?['camp','farm','market']:['farm','market','camp'];
   for(const kind of order)if(!city.facilities.some(f=>f.kind===kind)&&build(city.name,kind))return;
  }
 }
 const palette=['#b6668b','#70aeb2','#ab8650','#8679b2','#ba7152','#629b75','#7394bd','#ae9c56'];
 function newState(name,ruler,home,wandering=false){if(newStates>=8)return null;const id=Math.max(...factions.map(f=>f.id))+1,color=palette[newStates++];let title=name;while(factions.some(f=>f.name===title))title='新'+title;
  const f={id,name:title,ruler,color,region:wandering?'流浪军':home.name+'新立',label:[home.x,home.z],showLabel:true,dynamic:true};factions.push(f);
  const state={id,policy:wandering?'流浪择地':'立国整备',lastSortie:now(),cooldown:0,eliminated:false,wandering};states.push(state);countries.set(id,state);armies.push(...makeSlots(f,home));bump();return f;
 }
 function defect(cityName,targetId=null){const city=byName.get(cityName);if(!city||now()-city.lastPolitics<60||active().some(a=>a.name===city.governor)||scenario.actors.some(a=>a.kind==='traveler'&&a.name===city.governor))return false;
  const old=city.owner,leader=city.governor;
  if(targetId!==null&&(targetId===old||!owned(targetId).length))return false;
  const target=targetId===null?newState(city.name+'国',leader,city):faction(targetId);if(!target)return false;
  transfer(city,target.id);city.governor=leader;city.loyalty=targetId===null?95:76;city.order=Math.max(45,city.order-12);city.lastPolitics=now();officerAllegiances.set(leader,target.id);officerHomes.set(leader,city.name);
  if(targetId===null){stats.independences++;emit('independence',leader+'据'+city.name+'自立，建立'+target.name+'！');}else{stats.defections++;emit('defection',city.name+'首领'+leader+'率城归附'+target.name+'，脱离'+faction(old).name+'。');}
  // The former sovereign can respond after the political event, without an instant teleporting army.
  if(owned(old).length)ctx.declareWar(old,target.id,'讨伐叛离城邑');lastPolitics=now();return true;
 }
 function frontier(a){const from=world.cells[a.cell];return world.cells.filter(c=>c.walkable&&!c.road&&!c.feature&&c.y<2&&cities.every(t=>dist(t,c)>17)&&facilities.every(f=>dist(f,c)>5)&&dist(from,c)>13&&dist(from,c)<65).sort((a,b)=>dist(a,from)-dist(b,from)||a.id-b.id).find(c=>flat(c.x,c.z,4)&&world.neighbors(c.id).every(n=>n.walkable)&&world.route(a.cell,c.id));}
 function wander(id){const a=armies.find(a=>a.id===id);if(!a?.active||!military(a)||a.troops<900||a.order==='wander'||a.order==='found'||newCities>=6||states.filter(s=>s.wandering&&!s.eliminated).length>=2)return false;
  const site=frontier(a);if(!site)return false;const old=a.owner,home=byName.get(a.home)||{name:'边地',...world.cells[a.cell],cell:a.cell};
  const country=newState(a.name.slice(0,1)+'氏',a.name,home,true);if(!country)return false;
  // Move the existing force into the new country's idle military slot, preserving all soldiers.
  const rogue=armies.find(b=>b.owner===country.id&&b.slot===0);Object.assign(rogue,{...a,id:rogue.id,owner:country.id,slot:0,order:'wander',phase:'流浪',targetArmy:null,job:null,foundCell:site.id,foundProgress:0,departed:now(),destination:'边地新邑',reason:'脱离'+faction(old).name+'，寻找边地建立新城'});
  a.active=false;a.troops=0;a.path=[];a.progress=0;a.phase='离队';go(rogue,site.id);officerAllegiances.set(rogue.name,country.id);officerHomes.set(rogue.name,'流浪');stats.wanderers++;lastRogue=now();emit('wander',rogue.name+'率'+rogue.troops+'兵脱离'+faction(old).name+'，成为流浪军。');return rogue;
 }
 function found(a){if(newCities>=6||cities.some(c=>dist(c,world.cells[a.foundCell])<14)){ctx.dismiss(a);countries.get(a.owner).eliminated=true;return;}
  const p=world.cells[a.foundCell],name=faction(a.owner).name+'新邑'+(++newCities),previous=p.owner;
  const c={name,x:p.x,z:p.z,cell:p.id,owner:a.owner,gold:300,grain:a.food,garrison:a.troops,development:12,order:65,walls:25,project:'开荒',lastCapture:now(),governor:a.name,loyalty:95,lastPolitics:now(),facilities:[],dynamic:true};cities.push(c);byName.set(name,c);
  const land=world.cells.filter(t=>dist(t,p)<7&&cities.every(other=>other===c||dist(other,t)>10)).map(t=>t.id);for(const ids of provinces.values())for(let i=ids.length-1;i>=0;i--)if(land.includes(ids[i]))ids.splice(i,1);provinces.set(name,land);for(const id of land)world.cells[id].owner=a.owner;world.cells[p.id].owner=a.owner;
  a.troops=0;a.food=0;a.active=false;a.path=[];a.phase='立邑';a.destination=c.name;officerHomes.set(a.name,c.name);countries.get(a.owner).wandering=false;faction(a.owner).region=c.name+'新立';faction(a.owner).label=[p.x,p.z];stats.founded++;siteCache.clear();visualRevision++;bump();
  emit('founding',a.name+'在边地筑成'+name+'，建立新的城邑与辖地！');if(owned(previous).length)ctx.declareWar(previous,a.owner,'边地筑城引发领土争议');
 }
 function wandering(){for(const a of active().filter(a=>a.order==='wander'||a.order==='found')){
  if(!a.path.length){a.order='found';a.phase='筑城';a.foundProgress++;if(a.foundProgress>=8){found(a);continue;}}
  if(!a.food){const lost=Math.min(a.troops,Math.ceil(a.troops*.02));a.troops-=lost;stats.casualties+=lost;}
  if(a.troops<250||now()-a.departed>70){ctx.dismiss(a);countries.get(a.owner).eliminated=true;emit('wander-failed',a.name+'的流浪军未能立足，余部解散。');}
 }}
 function politics(){
  for(const c of cities){const war=[...ctx.relations.values()].some(r=>r.status==='war'&&(r.a===c.owner||r.b===c.owner));c.loyalty=Math.max(10,Math.min(100,c.loyalty+(war?-.18:.07)+(c.order<60?-.22:0)));}
  if(options.rareEvents===false||now()<48)return;
  if(now()%8===0&&now()-lastPolitics>=48&&random()<.07){const candidates=cities.filter(c=>c.loyalty<90&&now()-c.lastPolitics>=60&&!active().some(a=>a.name===c.governor));if(candidates.length){const c=candidates[Math.floor(random()*candidates.length)];const targets=cities.filter(t=>t.owner!==c.owner).sort((a,b)=>dist(a,c)-dist(b,c));if(random()<.45||!targets.length)defect(c.name);else defect(c.name,targets[0].owner);}}
  if(now()%12===0&&now()-lastRogue>=72&&random()<.05){const candidates=active().filter(a=>military(a)&&a.troops>=900&&a.food>450&&!['wander','found','return'].includes(a.order));if(candidates.length)wander(candidates[Math.floor(random()*candidates.length)].id);}
 }
 function transferFacilities(city,owner){for(const f of [...city.facilities]){if(f.status==='building')cancel(f);else f.owner=owner;}city.loyalty=45;city.lastPolitics=now();visualRevision++;}
 function destroy(f){if(!facilities.includes(f))return;const city=byName.get(f.city);city.facilities.splice(city.facilities.indexOf(f),1);facilities.splice(facilities.indexOf(f),1);f.status='destroyed';f.stock=0;city.lastDepotLoss=now();visualRevision++;}
 return{destroy,facilities,officerAllegiances,officerHomes,bonus,build,plan,defect,wander,flat,transferFacilities,tick(){construction();wandering();politics();},get visualRevision(){return visualRevision},get seed(){return seed},get newStates(){return newStates},get newCities(){return newCities}};
}
