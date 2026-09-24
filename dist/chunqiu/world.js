import {factions,cities} from './scenario.js';
export const SIZE=1.2,COLS=78,ROWS=86,DX=Math.sqrt(3)*SIZE,DZ=1.5*SIZE;
export const EXTENT={x:81,z:77};
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
export const riverZ=x=>-14+Math.sin(x*.055)*5+smooth(20,80,x)*7;
export const riverWidth=x=>1.12+smooth(25,110,Math.abs(x))*1.7;
export const roadX=z=>-3+Math.sin(z*.055)*4;
export function noise2(x,z){const hash=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n)},ix=Math.floor(x),iz=Math.floor(z);let u=x-ix,v=z-iz;u=u*u*(3-2*u);v=v*v*(3-2*v);const a=hash(ix,iz)*(1-u)+hash(ix+1,iz)*u,b=hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u;return a*(1-v)+b*v;}
// Continuous folded ridges; the central valley remains clear for the road and cities.
export function height(x,z){
 const river=Math.abs(z-riverZ(x)), ridge=(d,w)=>Math.exp(-((d/w)**2));
 const west=ridge(x+27+Math.sin(z*.075)*5,8)*(7+3*Math.sin(z*.17)**2);
 const east=ridge(x-30-Math.sin(z*.07)*7,8)*(6+3*Math.sin(z*.12)**2);
 const outerWest=ridge(x+73+z*.22+Math.sin(z*.047)*9,15)*(15+6*Math.sin(z*.056)**2);
 const outerEast=ridge(x-83+z*.3-Math.sin(z*.05)*11,12)*(13+7*Math.sin(z*.073)**2);
 const southern=ridge(z-81+Math.sin(x*.046)*13,11)*smooth(14,55,Math.abs(x))*10;
 const spurs=ridge(x+57+Math.sin(z*.085)*14,19)*smooth(28,55,Math.abs(x))*5;
 const mountain=west*.55+east*.25+outerWest+outerEast*.45+southern*.7+spurs*.55;
 const warpX=x+(noise2(x*.035,z*.035)-.5)*13,warpZ=z+(noise2(x*.04+27,z*.04)-.5)*11;
 const fold=(f)=>1-Math.abs(noise2(warpX*f,warpZ*f)*2-1);
 const folds=.32+.37*fold(.12)+.2*fold(.27)+.11*fold(.57);
 const foothills=Math.min(1,mountain/3)*(.22*Math.sin(x*1.8+z*.9)+.15*Math.cos(z*1.5-x*.6));
 let base=.5+mountain*folds+foothills+.28*(noise2(x*.13,z*.13)-.5);
 // Broad passes connect the expanded valleys; level ground supports each city model.
 const pass=Math.min(Math.abs(z+48),Math.abs(z-53));
 let valley=pass;
 for(const c of corridors){const dx=Math.abs(x-c.x);if(dx>=5.5||dx>=valley)continue;const dz=Math.max(c.lo-z,0,z-c.hi);if(dz<5.5)valley=Math.min(valley,Math.hypot(dx,dz));}
 const blend=smooth(1.8,5.5,valley);base=Math.min(base,1.7)+(base-Math.min(base,1.7))*blend;
 for(const c of cities){const dx=x-c.x,dz=z-c.z;if(Math.abs(dx)>=8||Math.abs(dz)>=8)continue;const d=Math.hypot(dx,dz);if(d<8){const t=smooth(4.7,8,d);base=.5+(base-.5)*t;}}

 const width=riverWidth(x);
 return river<width+.08?.04:base*Math.min(1,(river-width-.08)/2.6);
}
export {factions,cities} from './scenario.js';
export const faction=id=>factions.find(f=>f.id===id)||factions[0];
const corridors=cities.map(c=>({x:c.x,lo:Math.min(c.z,-48),hi:Math.max(c.z,53)}));
const territoryWeight={1:.8,2:.55,3:.72,4:.7,5:1.4,6:.9,7:1.1,8:1.2,9:1.2,10:1.3,11:1.4,12:1.5,13:1.7,14:1,15:.7,16:.85,17:1.4,18:1.7,19:1.8,20:1.7,21:1.7,22:1.2,23:1.4,24:1.2,25:1.2,26:1.8,27:1.8,28:1.6};
export function initialOwner(x,z){let best=Infinity,owner=1;const wx=x+Math.sin(z*.09)*2,wz=z+Math.sin(x*.08)*2;for(const c of cities){const d=((wx-c.x)**2+(wz-c.z)**2)*territoryWeight[c.owner];if(d<best){best=d;owner=c.owner;}}return owner;}
export function createWorld(){const cells=[],lookup=new Map();for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){const r=row-Math.floor(ROWS/2),q=col-Math.floor(COLS/2)-Math.floor(r/2),x=DX*(q+r/2),z=DZ*r,y=height(x,z),river=Math.abs(z-riverZ(x))<riverWidth(x)+.53,bridge=river&&[-61,-36,-9,14,37,61].some(b=>Math.abs(x-b)<1.45);const road=Math.abs(x-roadX(z))<1.7;const terrain=bridge?'津渡':river?'河流':y>5.3?'险山':y>2.5?'山地':road?'官道':Math.sin(x*.4+z*.2)>.65&&Math.abs(x)>8?'林地':'平原';const c={id:cells.length,q,r,x,z,y,terrain,walkable:!['河流','险山'].includes(terrain),cost:terrain==='官道'?.65:terrain==='山地'?2.4:terrain==='林地'?1.8:1,owner:initialOwner(x,z)};cells.push(c);lookup.set(q+','+r,c);}
const neighbors=id=>{const c=cells[id];return[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]].map(([q,r])=>lookup.get((c.q+q)+','+(c.r+r))).filter(Boolean)};
const nearest=(x,z)=>{const rf=z/DZ,qf=x/DX-rf/2,sf=-qf-rf;let q=Math.round(qf),r=Math.round(rf),s=Math.round(sf);const dq=Math.abs(q-qf),dr=Math.abs(r-rf),ds=Math.abs(s-sf);if(dq>dr&&dq>ds)q=-r-s;else if(dr>ds)r=-q-s;const c=lookup.get(q+','+r);if(c)return c;return cells.reduce((a,c)=>(c.x-x)**2+(c.z-z)**2<(a.x-x)**2+(a.z-z)**2?c:a,cells[0]);};const origin=nearest(cities[0].x,cities[0].z);const unit={cell:origin.id,path:[],progress:0,morale:100,steps:0};
function route(from,to){if(!cells[to]?.walkable)return null;const g=new Float64Array(cells.length).fill(Infinity),prev=new Int32Array(cells.length).fill(-1),open=new Set([from]);g[from]=0;const target=cells[to],heuristic=c=>Math.hypot(c.x-target.x,c.z-target.z)/DX*.65;while(open.size){let u=-1,best=Infinity;for(const i of open){const f=g[i]+heuristic(cells[i]);if(f<best){best=f;u=i}}if(u===to){const path=[u];while(path[0]!==from)path.unshift(prev[path[0]]);return{path,cost:g[to]};}open.delete(u);for(const n of neighbors(u)){if(!n.walkable)continue;const score=g[u]+n.cost;if(score<g[n.id]){g[n.id]=score;prev[n.id]=u;open.add(n.id)}}}return null;}
function supplied(){const seen=new Set([origin.id]),queue=[origin.id];if(origin.owner!==1)return false;for(let i=0;i<queue.length;i++){if(queue[i]===unit.cell)return true;for(const n of neighbors(queue[i]))if(n.walkable&&n.owner===1&&!seen.has(n.id)){seen.add(n.id);queue.push(n.id)}}return false;}
let blocked=false;const band=cells.filter(c=>c.walkable&&c.z>-39&&c.z<-36).map(c=>({id:c.id,owner:c.owner}));function blockade(){blocked=!blocked;for(const b of band)cells[b.id].owner=blocked?2:b.owner;return blocked;}
function step(){if(!unit.path.length)return false;const next=unit.path.shift();unit.cell=next;cells[next].owner=1;unit.steps++;unit.morale=Math.max(0,Math.min(100,unit.morale+(supplied()?1:-8)));return true;}
return{cells,neighbors,nearest,route,supplied,blockade,step,unit,origin,get blocked(){return blocked}};
}


