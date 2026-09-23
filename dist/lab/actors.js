import {cities} from './world.js';

// Scenario actors: finite forces, no spawning, no battle resolution or automatic conquest.
export const actorDefinitions=[
 {id:'wenpin',name:'文聘',owner:1,kind:'army',troops:1500,home:'新野',mission:'patrol',targets:['襄阳','新野'],reason:'往返新野与襄阳，巡查官道和渡桥。'},
 {id:'zhangxun',name:'张勋',owner:2,kind:'army',troops:2400,home:'宛城',mission:'expedition',targets:['新野'],reason:'从宛城南下抵近新野，观察城外形势后返回整备。'},
 {id:'xiahou',name:'夏侯惇',owner:4,kind:'army',troops:1800,home:'许昌',mission:'patrol',targets:['汝南','许昌'],reason:'巡防许昌与汝南之间的通路，到城后休整再出发。'},
 {id:'xushu',name:'徐庶',owner:0,kind:'traveler',troops:0,home:'新野',mission:'travel',targets:['襄阳','宜城','房陵','新野'],reason:'独自游历各城，优先拜访近期没有停留过的地方。'},
 {id:'huangzhong',name:'黄忠',owner:1,kind:'traveler',troops:0,home:'宜城',mission:'travel',targets:['襄阳','江陵','房陵','宜城'],reason:'轻装往来荆州城镇，拜访同僚后继续周游。'},
 {id:'pangde',name:'庞德公',owner:0,kind:'traveler',troops:0,home:'襄阳',mission:'travel',targets:['房陵','宜城','新野','襄阳'],reason:'不带兵出行，择城访友，在目的地停留后另择去处。'}
];
export function cityAt(x,z){return cities.find(c=>Math.hypot(c.x-x,c.z-z)<2.8)||null;}
export function createActors(world,onEvent=()=>{}){
 let time=0;
 const cityByName=name=>cities.find(c=>c.name===name);
 const cellAt=name=>{const c=cityByName(name);return world.nearest(c.x,c.z).id;};
 const actors=actorDefinitions.map((d,i)=>({...d,cell:cellAt(d.home),path:[],progress:0,wait:1000+i*550,phase:d.kind==='army'?'整备':'访友',destination:d.home,returning:false,visits:{[d.home]:1},trips:0,steps:0,cycle:0,reason:d.reason}));
 function plan(a){
  let target;
  if(a.mission==='expedition')target=a.returning?a.home:a.targets[0];
  else if(a.mission==='patrol'){target=a.targets[a.cycle%a.targets.length];a.cycle++;}
  else {const candidates=a.targets.filter(name=>cellAt(name)!==a.cell);candidates.sort((x,y)=>(a.visits[x]||0)-(a.visits[y]||0)||Math.hypot(world.cells[cellAt(x)].x-world.cells[a.cell].x,world.cells[cellAt(x)].z-world.cells[a.cell].z)-Math.hypot(world.cells[cellAt(y)].x-world.cells[a.cell].x,world.cells[cellAt(y)].z-world.cells[a.cell].z));target=candidates[0];}
  let destination=cellAt(target);
  if(a.mission==='expedition'&&!a.returning){
   const c=cityByName(target),origin=world.cells[a.cell];
   // Stop outside the city wall rather than pretending that an assault was resolved.
   const candidates=world.cells.filter(t=>t.walkable&&Math.hypot(t.x-c.x,t.z-c.z)>=5&&Math.hypot(t.x-c.x,t.z-c.z)<=8).sort((u,v)=>Math.hypot(u.x-origin.x,u.z-origin.z)-Math.hypot(v.x-origin.x,v.z-origin.z));
   destination=candidates.find(t=>world.route(a.cell,t.id))?.id??destination;
  }
  const route=world.route(a.cell,destination);
  if(!route||route.path.length<2){a.phase='等候通路';a.wait=5000;return;}
  a.path=route.path.slice(1);a.progress=0;a.destination=target;
  a.phase=a.kind==='traveler'?'周游':a.mission==='expedition'?(a.returning?'返军':'出征'):'巡防';
  onEvent(a.name+(a.kind==='traveler'?'独自前往':'率 '+a.troops.toLocaleString()+' 兵前往')+target+(a.mission==='expedition'&&!a.returning?'城外侦察。':'。'));
 }
 function arrive(a){
  a.trips++;a.visits[a.destination]=(a.visits[a.destination]||0)+1;
  if(a.mission==='expedition'){const outbound=!a.returning;a.phase=outbound?'城外观察':'整备';a.returning=outbound;a.wait=outbound?6500:8500;}
  else {a.phase=a.kind==='traveler'?'访友':'驻守';a.wait=a.kind==='traveler'?4500:6000;}
  onEvent(a.name+(a.phase==='城外观察'?'抵达'+a.destination+'城外，暂驻观察。':'抵达'+a.destination+'，'+(a.kind==='traveler'?'入城访友。':'驻城休整。')));
 }
 function advance(ms){
  if(!Number.isFinite(ms)||ms<=0)return;
  time+=ms;
  for(const a of actors){let budget=ms,guard=0;while(budget>0&&guard++<2000){
   if(!a.path.length){const used=Math.min(a.wait,budget);a.wait-=used;budget-=used;if(a.wait>0)break;plan(a);if(!a.path.length)continue;}
   const next=world.cells[a.path[0]],duration=next.cost*(a.kind==='traveler'?500:780),used=Math.min(duration-a.progress,budget);a.progress+=used;budget-=used;
   if(a.progress+1e-6>=duration){a.cell=a.path.shift();a.steps++;a.progress=0;if(!a.path.length)arrive(a);}
  }}
 }
 function position(a){const from=world.cells[a.cell],next=world.cells[a.path[0]];if(!next)return{x:from.x,z:from.z};const t=Math.min(1,a.progress/(next.cost*(a.kind==='traveler'?500:780)));return{x:from.x+(next.x-from.x)*t,z:from.z+(next.z-from.z)*t};}
 return{actors,advance,position,get time(){return time}};
}
