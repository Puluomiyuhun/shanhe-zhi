import {inPlayableArea} from './territory.js';
import {scenario} from './runtime.js';
import {waterAt,crossingAt,passAt,passBlend,hills,roadLinks} from './geography.js';
import {factions,cities} from './scenario.js';
export const SIZE=scenario.map.size,COLS=scenario.map.cols,ROWS=scenario.map.rows,DX=Math.sqrt(3)*SIZE,DZ=1.5*SIZE;
export const EXTENT=scenario.map.extent;
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
export function noise2(x,z){const hash=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n)},ix=Math.floor(x),iz=Math.floor(z);let u=x-ix,v=z-iz;u=u*u*(3-2*u);v=v*v*(3-2*v);const a=hash(ix,iz)*(1-u)+hash(ix+1,iz)*u,b=hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u;return a*(1-v)+b*v;}
// Continuous folded ridges; the central valley remains clear for the road and cities.
export function height(x,z){
 let base=scenario.terrainHeight(x,z,{noise2,smooth,hills,cities});
 // Only named mountain corridors cut the ridges; no blanket city-to-map flattening.
 base+=(Math.min(base,1.6)-base)*passBlend(x,z);
 for(const c of cities){const dx=x-c.x,dz=z-c.z;if(Math.abs(dx)>=7||Math.abs(dz)>=7)continue;const d=Math.hypot(dx,dz);if(d<7)base=.55+(base-.55)*smooth(3.8,7,d);}
 const outside=Math.max(Math.abs(x)-EXTENT.x,Math.abs(z)-EXTENT.z),blend=smooth(0,18,outside);
 const southeast=3.2*Math.exp(-(((x-72)/38)**2)-((z-102)/48)**2),nanling=3*Math.exp(-(((z-130)/13)**2)-((x-15)/65)**2),northern=4*Math.exp(-(((z+105)/24)**2)-((x-35)/100)**2);
 const background=.65+(southeast+nanling+northern)*(0.45+noise2(x*.065,z*.065)*.55)+.35*noise2(x*.2,z*.2);
 base=base*(1-blend)+background*blend;
 const water=waterAt(x,z),bank=water.shore;
 if(water.sea&&bank<0)return -2;
 return bank<.1?.04:base*smooth(.1,2.6,bank);
}
export {factions,cities} from './scenario.js';
export const faction=id=>factions.find(f=>f.id===id)||factions[0];

const territoryWeight=scenario.map.territoryWeights;
export function initialOwner(x,z){let best=Infinity,owner=scenario.player.owner;const wx=x+Math.sin(z*.09)*2,wz=z+Math.sin(x*.08)*2;for(const c of cities){const d=((wx-c.x)**2*(scenario.map.territoryAxes[c.owner]?.[0]??1)+(wz-c.z)**2*(scenario.map.territoryAxes[c.owner]?.[1]??1))*(territoryWeight[c.owner]??1);if(d<best){best=d;owner=c.owner;}}return owner;}
export function createWorld(){const cells=[],lookup=new Map();for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){const r=row-Math.floor(ROWS/2),q=col-Math.floor(COLS/2)-Math.floor(r/2),x=DX*(q+r/2),z=DZ*r;if(!inPlayableArea(x,z))continue;const y=height(x,z),water=waterAt(x,z),river=water.shore<.6,bridge=river&&!water.sea&&!water.lake&&!!crossingAt(x,z);const pass=passAt(x,z),road=!!pass;const terrain=water.sea&&water.shore<.6?'海域':bridge?'津渡':river?(water.lake?'湖泊':'河流'):pass?'关隘':y>5.3?'险山':y>2.5?'山地':water.lake&&water.shore<2.8?'湿地':road?'官道':Math.sin(x*.4+z*.2)>.65&&Math.abs(x)>8?'林地':'平原';const c={id:cells.length,q,r,x,z,y,terrain,feature:bridge?crossingAt(x,z).name:river?water.name:pass?.name||'',walkable:!['河流','湖泊','海域','险山'].includes(terrain),cost:terrain==='湿地'?2.2:terrain==='官道'?.65:terrain==='山地'?2.4:terrain==='林地'?1.8:1,owner:initialOwner(x,z)};cells.push(c);lookup.set(q+','+r,c);}
const neighbors=id=>{const c=cells[id];return[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]].map(([q,r])=>lookup.get((c.q+q)+','+(c.r+r))).filter(Boolean)};
const nearest=(x,z)=>{const rf=z/DZ,qf=x/DX-rf/2,sf=-qf-rf;let q=Math.round(qf),r=Math.round(rf),s=Math.round(sf);const dq=Math.abs(q-qf),dr=Math.abs(r-rf),ds=Math.abs(s-sf);if(dq>dr&&dq>ds)q=-r-s;else if(dr>ds)r=-q-s;const c=lookup.get(q+','+r);if(c)return c;return cells.reduce((a,c)=>(c.x-x)**2+(c.z-z)**2<(a.x-x)**2+(a.z-z)**2?c:a,cells[0]);};const home=cities.find(c=>c.name===scenario.player.home),origin=nearest(home.x,home.z);const unit={cell:origin.id,path:[],progress:0,morale:100,steps:0};
function route(from,to){if(!cells[to]?.walkable)return null;const g=new Float64Array(cells.length).fill(Infinity),prev=new Int32Array(cells.length).fill(-1),open=new Set([from]);g[from]=0;const target=cells[to],heuristic=c=>Math.hypot(c.x-target.x,c.z-target.z)/DX*.65;while(open.size){let u=-1,best=Infinity;for(const i of open){const f=g[i]+heuristic(cells[i]);if(f<best){best=f;u=i}}if(u===to){const path=[u];while(path[0]!==from)path.unshift(prev[path[0]]);return{path,cost:g[to]};}open.delete(u);for(const n of neighbors(u)){if(!n.walkable)continue;const score=g[u]+n.cost;if(score<g[n.id]){g[n.id]=score;prev[n.id]=u;open.add(n.id)}}}return null;}
// Roads are derived from valid routes before discounts, so they cannot carve through water or cliffs.
const roads=[];for(const link of roadLinks){const a=cities.find(c=>c.name===link.from),b=cities.find(c=>c.name===link.to),r=route(nearest(a.x,a.z).id,nearest(b.x,b.z).id);if(!r)throw new Error('Unreachable road: '+link.name);roads.push({...link,path:r.path});}
for(const road of roads)for(const id of road.path){const c=cells[id];if(['河流','湖泊','津渡','险山','关隘','湿地'].includes(c.terrain))continue;c.road=road.name;c.feature=road.name;c.cost=Math.min(c.cost,c.terrain==='山地'?1.6:.75);if(c.terrain!=='山地')c.terrain='官道';}
function supplied(){const seen=new Set([origin.id]),queue=[origin.id];if(origin.owner!==scenario.player.owner)return false;for(let i=0;i<queue.length;i++){if(queue[i]===unit.cell)return true;for(const n of neighbors(queue[i]))if(n.walkable&&n.owner===scenario.player.owner&&!seen.has(n.id)){seen.add(n.id);queue.push(n.id)}}return false;}
let blocked=false;const band=cells.filter(c=>c.walkable&&c.z>scenario.map.blockade[0]&&c.z<scenario.map.blockade[1]).map(c=>({id:c.id,owner:c.owner}));function blockade(){blocked=!blocked;for(const b of band)cells[b.id].owner=blocked?(factions.find(f=>f.id!==scenario.player.owner)?.id??b.owner):b.owner;return blocked;}
function step(){if(!unit.path.length)return false;const next=unit.path.shift();unit.cell=next;cells[next].owner=scenario.player.owner;unit.steps++;unit.morale=Math.max(0,Math.min(100,unit.morale+(supplied()?1:-8)));return true;}
return{cells,roads,neighbors,nearest,route,supplied,blockade,step,unit,origin,get blocked(){return blocked}};
}



