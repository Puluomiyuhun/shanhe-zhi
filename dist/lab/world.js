export const SIZE=1.2,COLS=104,ROWS=112,DX=Math.sqrt(3)*SIZE,DZ=1.5*SIZE;
export const EXTENT={x:108,z:101};
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
export const riverZ=x=>22+Math.sin(x*.105)*3+smooth(25,130,x)*39-smooth(45,140,-x)*16;
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
 const mountain=west+east+outerWest+outerEast+southern+spurs;
 const warpX=x+(noise2(x*.035,z*.035)-.5)*13,warpZ=z+(noise2(x*.04+27,z*.04)-.5)*11;
 const fold=(f)=>1-Math.abs(noise2(warpX*f,warpZ*f)*2-1);
 const folds=.32+.37*fold(.12)+.2*fold(.27)+.11*fold(.57);
 const foothills=Math.min(1,mountain/3)*(.22*Math.sin(x*1.8+z*.9)+.15*Math.cos(z*1.5-x*.6));
 let base=.5+mountain*folds+foothills+.28*(noise2(x*.13,z*.13)-.5);
 // Broad passes connect the expanded valleys; level ground supports each city model.
 const pass=Math.min(Math.abs(z+61+Math.sin(x*.035)*3),Math.abs(z-67+Math.sin(x*.04)*4));
 let valley=pass;
 for(const c of cities){if(c.name==='襄阳'||c.name==='新野'||c.name==='宛城')continue;const end=c.z<22?-61-Math.sin(c.x*.035)*3:67-Math.sin(c.x*.04)*4;const dz=Math.max(Math.min(c.z,end)-z,0,z-Math.max(c.z,end));valley=Math.min(valley,Math.hypot(x-c.x,dz));}
 const blend=smooth(1.8,5.5,valley);base=Math.min(base,1.7)+(base-Math.min(base,1.7))*blend;
 for(const c of cities){const d=Math.hypot(x-c.x,z-c.z);if(d<8){const t=smooth(4.7,8,d);base=.5+(base-.5)*t;}}

 const width=riverWidth(x);
 return river<width+.08?.04:base*Math.min(1,(river-width-.08)/2.6);
}
// Schematic scenario placements and affiliations, not a historical-year reconstruction.
export const factions=[
 {id:1,name:'刘表',region:'荆州',color:'#e2b33b',label:[-14,64]},
 {id:2,name:'袁术',region:'南阳',color:'#df5b46',label:[-5,-56]},
 {id:3,name:'张鲁',region:'汉中',color:'#629be4',label:[-70,-14]},
 {id:4,name:'曹操',region:'颍川',color:'#ab7ddd',label:[58,-49]},
 {id:5,name:'孙坚',region:'江汉',color:'#36b79a',label:[57,43]}
];
export const faction=id=>factions.find(f=>f.id===id)||factions[0];
export const cities=[
 {name:'襄阳',x:-4,z:32,owner:1},{name:'新野',x:-3,z:0,owner:1},{name:'宛城',x:1,z:-31,owner:2},
 {name:'汉中',x:-88,z:-70,owner:3},{name:'西城',x:-60,z:-34,owner:3},{name:'上庸',x:-53,z:0,owner:3},
 {name:'房陵',x:-53,z:49,owner:1},{name:'宜城',x:-5,z:57,owner:1},{name:'江陵',x:-1,z:87,owner:1},
 {name:'鲁阳',x:0,z:-75,owner:2},{name:'许昌',x:57,z:-72,owner:4},{name:'汝南',x:64,z:-28,owner:4},
 {name:'随县',x:50,z:7,owner:5},{name:'安陆',x:60,z:61,owner:5}
];
export function initialOwner(x,z){let best=Infinity,owner=1;const wx=x+Math.sin(z*.09)*2,wz=z+Math.sin(x*.08)*2;for(const c of cities){const d=(wx-c.x)**2+(wz-c.z)**2;if(d<best){best=d;owner=c.owner;}}return owner;}
export function createWorld(){const cells=[],lookup=new Map();for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++){const r=row-Math.floor(ROWS/2),q=col-Math.floor(COLS/2)-Math.floor(r/2),x=DX*(q+r/2),z=DZ*r,y=height(x,z),river=Math.abs(z-riverZ(x))<riverWidth(x)+.53,bridge=river&&Math.abs(x-roadX(22))<1.05;const road=Math.abs(x-roadX(z))<1.7;const terrain=bridge?'渡桥':river?'河流':y>5.3?'险山':y>2.5?'山地':road?'官道':Math.sin(x*.4+z*.2)>.65&&Math.abs(x)>8?'林地':'平原';const c={id:cells.length,q,r,x,z,y,terrain,walkable:!['河流','险山'].includes(terrain),cost:terrain==='官道'?.65:terrain==='山地'?2.4:terrain==='林地'?1.8:1,owner:initialOwner(x,z)};cells.push(c);lookup.set(q+','+r,c);}
const neighbors=id=>{const c=cells[id];return[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]].map(([q,r])=>lookup.get((c.q+q)+','+(c.r+r))).filter(Boolean)};
const nearest=(x,z)=>{const rf=z/DZ,qf=x/DX-rf/2,sf=-qf-rf;let q=Math.round(qf),r=Math.round(rf),s=Math.round(sf);const dq=Math.abs(q-qf),dr=Math.abs(r-rf),ds=Math.abs(s-sf);if(dq>dr&&dq>ds)q=-r-s;else if(dr>ds)r=-q-s;const c=lookup.get(q+','+r);if(c)return c;return cells.reduce((a,c)=>(c.x-x)**2+(c.z-z)**2<(a.x-x)**2+(a.z-z)**2?c:a,cells[0]);};const origin=nearest(cities[0].x,cities[0].z);const unit={cell:origin.id,path:[],progress:0,morale:100,steps:0};
function route(from,to){if(!cells[to]?.walkable)return null;const g=new Float64Array(cells.length).fill(Infinity),prev=new Int32Array(cells.length).fill(-1),open=new Set([from]);g[from]=0;const target=cells[to],heuristic=c=>Math.hypot(c.x-target.x,c.z-target.z)/DX*.65;while(open.size){let u=-1,best=Infinity;for(const i of open){const f=g[i]+heuristic(cells[i]);if(f<best){best=f;u=i}}if(u===to){const path=[u];while(path[0]!==from)path.unshift(prev[path[0]]);return{path,cost:g[to]};}open.delete(u);for(const n of neighbors(u)){if(!n.walkable)continue;const score=g[u]+n.cost;if(score<g[n.id]){g[n.id]=score;prev[n.id]=u;open.add(n.id)}}}return null;}
function supplied(){const seen=new Set([origin.id]),queue=[origin.id];if(origin.owner!==1)return false;for(let i=0;i<queue.length;i++){if(queue[i]===unit.cell)return true;for(const n of neighbors(queue[i]))if(n.walkable&&n.owner===1&&!seen.has(n.id)){seen.add(n.id);queue.push(n.id)}}return false;}
let blocked=false;const band=cells.filter(c=>c.walkable&&c.z>10&&c.z<15).map(c=>({id:c.id,owner:c.owner}));function blockade(){blocked=!blocked;for(const b of band)cells[b.id].owner=blocked?2:b.owner;return blocked;}
function step(){if(!unit.path.length)return false;const next=unit.path.shift();unit.cell=next;cells[next].owner=1;unit.steps++;unit.morale=Math.max(0,Math.min(100,unit.morale+(supplied()?1:-8)));return true;}
return{cells,neighbors,nearest,route,supplied,blockade,step,unit,origin,get blocked(){return blocked}};
}


