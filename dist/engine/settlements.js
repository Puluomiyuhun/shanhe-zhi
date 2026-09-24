import {scenario} from './runtime.js';
import {height,cities} from './world.js';
import {waterAt,passes,crossings} from './geography.js';
const types=['village','market','camp','workshop'];
const titles={village:'郊外聚落',market:'道旁市集',camp:'郊外哨营',workshop:'手工作坊'};
export function createSettlements(world){
 const sites=[];
 for(const [index,city] of cities.entries())for(let slot=0;slot<2;slot++){
  let chosen=null;
  for(let k=0;k<48;k++){const angle=index*2.399+slot*2.6+k*.43,r=6.5+(k%4)*1.15,x=city.x+Math.cos(angle)*r,z=city.z+Math.sin(angle)*r,y=height(x,z),cell=world.nearest(x,z);
   if(Math.hypot(cell.x-x,cell.z-z)>1.4||!cell.walkable||cell.road||y>3||waterAt(x,z).shore<2.3||cities.some(c=>Math.hypot(c.x-x,c.z-z)<5.5)||sites.some(c=>Math.hypot(c.x-x,c.z-z)<4.5)||passes.some(c=>Math.hypot(c.x-x,c.z-z)<4)||crossings.some(c=>Math.hypot(c.x-x,c.z-z)<4))continue;
   if([[1.6,0],[-1.6,0],[0,1.6],[0,-1.6]].some(([dx,dz])=>waterAt(x+dx,z+dz).shore<.6||Math.abs(height(x+dx,z+dz)-y)>.38))continue;
   chosen={x,z,y,cell:cell.id,angle};break;
  }
  if(!chosen)continue;
  const override=slot===1?scenario.map.settlementThemes?.[city.name]:null,kind=override?.kind||(slot===0?'village':types[1+index%3]);
  sites.push({...chosen,id:city.name+'-'+slot,city:city.name,kind,name:override?.name||city.name+'·'+titles[kind],basis:override?.basis||'演练布置',description:override?.description||'依地形布置的城郊设施，名称为泛称，不代表已考证的遗址坐标。',source:override?.source||null});
 }
 return sites;
}
export function settlementAt(sites,x,z){return sites.find(s=>Math.hypot(s.x-x,s.z-z)<2.6);}
