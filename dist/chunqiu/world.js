import {waterAt,crossingAt,passAt,passBlend,hills,roadLinks} from './geography.js';
import {factions,cities} from './scenario.js';
export const SIZE=1.2,COLS=78,ROWS=86,DX=Math.sqrt(3)*SIZE,DZ=1.5*SIZE;
export const EXTENT={x:81,z:77};
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
export function noise2(x,z){const hash=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n)},ix=Math.floor(x),iz=Math.floor(z);let u=x-ix,v=z-iz;u=u*u*(3-2*u);v=v*v*(3-2*v);const a=hash(ix,iz)*(1-u)+hash(ix+1,iz)*u,b=hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u;return a*(1-v)+b*v;}
// Continuous folded ridges; the central valley remains clear for the road and cities.
export function height(x,z){
 const ridge=(d,w)=>Math.exp(-((d/w)**2));
 const qinling=ridge(z-6-Math.sin(x*.07)*2,6)*smooth(-98,-70,x)*(1-smooth(-32,-17,x))*13;
 const taihang=ridge(x+13+Math.sin(z*.08)*3,5)*smooth(-85,-60,z)*(1-smooth(-24,-12,z))*12;
 const yanshan=ridge(z+78-Math.sin(x*.045)*3,6)*smooth(-8,16,x)*(1-smooth(78,98,x))*12;
 const sichuan=ridge(x+87+Math.sin(z*.07)*4,10)*smooth(17,40,z)*24;
 const daba=ridge(z-39-Math.sin(x*.07)*3,6)*smooth(-84,-68,x)*(1-smooth(-30,-18,x))*13;
 const wushan=ridge(x+31+Math.sin(z*.12)*3,5)*smooth(35,48,z)*(1-smooth(69,80,z))*11;
 const longshan=ridge(x+83+Math.sin(z*.08)*2,7)*(1-smooth(-3,18,z))*10;
 const fangcheng=ridge(z-23+x*.22,4)*smooth(-29,-17,x)*(1-smooth(8,20,x))*7;
 const hill=hills.reduce((n,h)=>n+h.peak*Math.exp(-(((x-h.x)/h.rx)**2+((z-h.z)/h.rz)**2)),0);
 const mountain=hill+qinling+taihang+yanshan+sichuan+daba+wushan+longshan+fangcheng;
 const wx=x+(noise2(x*.035,z*.035)-.5)*6,wz=z+(noise2(x*.04+27,z*.04)-.5)*6;
 const fold=f=>1-Math.abs(noise2(wx*f,wz*f)*2-1);
 let base=.55+mountain*(.48+.3*fold(.13)+.15*fold(.29)+.07*fold(.6))+.22*(noise2(x*.13,z*.13)-.5);
 // Only named mountain corridors cut the ridges; no blanket city-to-map flattening.
 base+=(Math.min(base,1.6)-base)*passBlend(x,z);
 for(const c of cities){const dx=x-c.x,dz=z-c.z;if(Math.abs(dx)>=7||Math.abs(dz)>=7)continue;const d=Math.hypot(dx,dz);if(d<7)base=.55+(base-.55)*smooth(3.8,7,d);}
 const bank=waterAt(x,z).shore;
 return bank<.1?.04:base*smooth(.1,2.6,bank);
}
export {factions,cities} from './scenario.js';
export const faction=id=>factions.find(f=>f.id===id)||factions[0];

const territoryWeight={1:.8,2:.55,3:.72,4:.7,5:1.4,6:.9,7:1.1,8:1.2,9:1.2,10:1.3,11:1.4,12:1.5,13:1.7,14:1,15:.7,16:.85,17:1.4,18:1.7,19:1.8,20:1.7,21:1.7,22:1.2,23:1.4,24:1.2,25:1.2,26:1.8,27:1.8,28:1.6};
export function initialOwner(x,z){let best=Infinity,owner=1;const wx=x+Math.sin(z*.09)*2,wz=z+Math.sin(x*.08)*2;for(const c of cities){const d=((wx-c.x)**2*(c.owner===4?.65:c.owner===14?.8:1)+(wz-c.z)**2*(c.owner===4?1.5:c.owner===14?1.7:1))*territoryWeight[c.owner];if(d<best){best=d;owner=c.owner;}}return owner;}
export function createWorld(){const cells=[],lookup=new Map();for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){const r=row-Math.floor(ROWS/2),q=col-Math.floor(COLS/2)-Math.floor(r/2),x=DX*(q+r/2),z=DZ*r,y=height(x,z),water=waterAt(x,z),river=water.shore<.6,bridge=river&&!water.lake&&!!crossingAt(x,z);const pass=passAt(x,z),road=!!pass;const terrain=bridge?'津渡':river?(water.lake?'湖泊':'河流'):pass?'关隘':y>5.3?'险山':y>2.5?'山地':water.lake&&water.shore<2.8?'湿地':road?'官道':Math.sin(x*.4+z*.2)>.65&&Math.abs(x)>8?'林地':'平原';const c={id:cells.length,q,r,x,z,y,terrain,feature:bridge?crossingAt(x,z).name:river?water.name:pass?.name||'',walkable:!['河流','湖泊','险山'].includes(terrain),cost:terrain==='湿地'?2.2:terrain==='官道'?.65:terrain==='山地'?2.4:terrain==='林地'?1.8:1,owner:initialOwner(x,z)};cells.push(c);lookup.set(q+','+r,c);}
const neighbors=id=>{const c=cells[id];return[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]].map(([q,r])=>lookup.get((c.q+q)+','+(c.r+r))).filter(Boolean)};
const nearest=(x,z)=>{const rf=z/DZ,qf=x/DX-rf/2,sf=-qf-rf;let q=Math.round(qf),r=Math.round(rf),s=Math.round(sf);const dq=Math.abs(q-qf),dr=Math.abs(r-rf),ds=Math.abs(s-sf);if(dq>dr&&dq>ds)q=-r-s;else if(dr>ds)r=-q-s;const c=lookup.get(q+','+r);if(c)return c;return cells.reduce((a,c)=>(c.x-x)**2+(c.z-z)**2<(a.x-x)**2+(a.z-z)**2?c:a,cells[0]);};const origin=nearest(cities[0].x,cities[0].z);const unit={cell:origin.id,path:[],progress:0,morale:100,steps:0};
function route(from,to){if(!cells[to]?.walkable)return null;const g=new Float64Array(cells.length).fill(Infinity),prev=new Int32Array(cells.length).fill(-1),open=new Set([from]);g[from]=0;const target=cells[to],heuristic=c=>Math.hypot(c.x-target.x,c.z-target.z)/DX*.65;while(open.size){let u=-1,best=Infinity;for(const i of open){const f=g[i]+heuristic(cells[i]);if(f<best){best=f;u=i}}if(u===to){const path=[u];while(path[0]!==from)path.unshift(prev[path[0]]);return{path,cost:g[to]};}open.delete(u);for(const n of neighbors(u)){if(!n.walkable)continue;const score=g[u]+n.cost;if(score<g[n.id]){g[n.id]=score;prev[n.id]=u;open.add(n.id)}}}return null;}
// Roads are derived from valid routes before discounts, so they cannot carve through water or cliffs.
const roads=[];for(const link of roadLinks){const a=cities.find(c=>c.name===link.from),b=cities.find(c=>c.name===link.to),r=route(nearest(a.x,a.z).id,nearest(b.x,b.z).id);if(!r)throw new Error('Unreachable road: '+link.name);roads.push({...link,path:r.path});}
for(const road of roads)for(const id of road.path){const c=cells[id];if(['河流','湖泊','津渡','险山','关隘','湿地'].includes(c.terrain))continue;c.road=road.name;c.feature=road.name;c.cost=Math.min(c.cost,c.terrain==='山地'?1.6:.75);if(c.terrain!=='山地')c.terrain='官道';}
function supplied(){const seen=new Set([origin.id]),queue=[origin.id];if(origin.owner!==1)return false;for(let i=0;i<queue.length;i++){if(queue[i]===unit.cell)return true;for(const n of neighbors(queue[i]))if(n.walkable&&n.owner===1&&!seen.has(n.id)){seen.add(n.id);queue.push(n.id)}}return false;}
let blocked=false;const band=cells.filter(c=>c.walkable&&c.z>-39&&c.z<-36).map(c=>({id:c.id,owner:c.owner}));function blockade(){blocked=!blocked;for(const b of band)cells[b.id].owner=blocked?2:b.owner;return blocked;}
function step(){if(!unit.path.length)return false;const next=unit.path.shift();unit.cell=next;cells[next].owner=1;unit.steps++;unit.morale=Math.max(0,Math.min(100,unit.morale+(supplied()?1:-8)));return true;}
return{cells,roads,neighbors,nearest,route,supplied,blockade,step,unit,origin,get blocked(){return blocked}};
}


