// Compressed historical-geography sketch, not a dated reconstruction.
// Shared centerlines drive rendering, banks, water obstacles and ferry locations.
export const rivers=[
 {name:'黄河',width:1.55,points:[[-92,-74],[-72,-83],[-50,-80],[-48,-62],[-49,-43],[-47,-22],[-41,-15],[-25,-13],[-8,-14],[3,-20],[0,-35],[16,-47],[29,-55],[53,-57],[93,-52]]},
 {name:'长江',width:1.9,points:[[-103,88],[-81,80],[-60,74],[-49,68],[-40,59],[-27,56],[-14,58],[0,62],[17,57],[32,47],[44,35],[60,29],[79,23],[99,11]]},
 {name:'渭水',width:.8,points:[[-95,-12],[-78,-15],[-64,-12],[-52,-15],[-41,-15]]},
 {name:'汉水',width:1,points:[[-60,25],[-44,27],[-32,33],[-17,36],[-3,49],[0,62]]}
];
rivers.push(
 {name:'汾水',width:.7,points:[[-25,-75],[-26,-57],[-24,-44],[-31,-30],[-44,-26],[-47,-22]]},
 {name:'泾水',width:.6,points:[[-70,-68],[-65,-50],[-58,-38],[-56,-23],[-52,-15]]},
 {name:'洛水',width:.6,points:[[-34,13],[-23,9],[-12,6],[-3,-1],[-8,-14]]},
 {name:'淮水',width:.9,points:[[8,31],[18,34],[34,29],[46,25],[55,23],[57,8],[70,2],[88,5]]},
 {name:'泗水',width:.6,points:[[36,-25],[34,-5],[33,12],[41,20],[46,25]]},
 {name:'岷水',width:.75,points:[[-78,38],[-79,53],[-80,67],[-76,78],[-60,74]]}
);
// Irregular lake outlines are schematic ancient water landscapes, not modern coastlines.
export const lakes=[
 {name:'震泽',x:59,z:55,rx:6,rz:8,phase:.5},
 {name:'大野泽',x:32,z:-29,rx:4,rz:5,phase:1.7},
 {name:'云梦湖沼',x:-9,z:54,rx:4.5,rz:2.6,phase:2.8}
];
export function lakeRadius(lake,a){return 1+.12*Math.sin(3*a+lake.phase)+.07*Math.sin(5*a-lake.phase);}
export function lakeBoundary(lake,a){const r=lakeRadius(lake,a);return [lake.x+Math.cos(a)*lake.rx*r,lake.z+Math.sin(a)*lake.rz*r];}
export const hills=[
 {name:'嵩山',x:-11,z:11,rx:8,rz:5,peak:5.8},
 {name:'桐柏山',x:7,z:27,rx:9,rz:4,peak:4.8},
 {name:'泰沂丘陵',x:59,z:-17,rx:10,rz:6,peak:5.2},
 {name:'会稽山地',x:77,z:72,rx:7,rz:10,peak:6.5},
 {name:'巴蜀丘陵',x:-60,z:54,rx:9,rz:9,peak:3.2}
];
export const roadLinks=[
 ['河汾道','汾邑','绛'],['曲沃道','绛','曲沃'],['关陇道','汧邑','雍'],
 ['崤函道','雍','王城'],['王畿道','王城','成周'],['郑宋道','新郑','商丘'],
 ['齐鲁道','临淄','曲阜'],['泗上道','曲阜','彭城'],['江汉道','宛','郢'],
 ['吴地道','延陵','姑苏'],['吴越道','姑苏','会稽'],['巴蜀道','蜀','巴'],
 ['秦蜀谷道','雍','蜀'],['燕南道','蓟','邢']
].map(([name,from,to])=>({name,from,to}));

function curve(points){const out=[];for(let i=0;i<points.length-1;i++){const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];const steps=Math.max(4,Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/2));for(let j=0;j<steps;j++){const t=j/steps;out.push([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)));}}out.push(points.at(-1));return out;}
const buckets=new Map(),bucketSize=12;
for(const river of rivers){river.line=curve(river.points);for(let i=0;i<river.line.length-1;i++){const a=river.line[i],b=river.line[i+1],dx=b[0]-a[0],dz=b[1]-a[1];const s={a,b,dx,dz,len2:dx*dx+dz*dz,river};const margin=river.width+5;for(let bx=Math.floor((Math.min(a[0],b[0])-margin)/bucketSize);bx<=Math.floor((Math.max(a[0],b[0])+margin)/bucketSize);bx++)for(let bz=Math.floor((Math.min(a[1],b[1])-margin)/bucketSize);bz<=Math.floor((Math.max(a[1],b[1])+margin)/bucketSize);bz++){const key=bx+','+bz;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(s);}}}
export function waterAt(x,z,includeLakes=true){let shore=10,result=null;for(const s of buckets.get(Math.floor(x/bucketSize)+','+Math.floor(z/bucketSize))||[]){const t=Math.max(0,Math.min(1,((x-s.a[0])*s.dx+(z-s.a[1])*s.dz)/s.len2)),px=s.a[0]+t*s.dx,pz=s.a[1]+t*s.dz,d=Math.hypot(x-px,z-pz)-s.river.width;if(d<shore){shore=d;result={name:s.river.name,width:s.river.width,x:px,z:pz,dx:s.dx/Math.sqrt(s.len2),dz:s.dz/Math.sqrt(s.len2)};}}for(const lake of includeLakes?lakes:[]){const u=(x-lake.x)/lake.rx,v=(z-lake.z)/lake.rz;if(Math.abs(u)>2||Math.abs(v)>3)continue;const a=Math.atan2(v,u),d=(Math.hypot(u,v)-lakeRadius(lake,a))*Math.min(lake.rx,lake.rz);if(d<shore){shore=d;result={name:lake.name,lake:true};}}return {shore,...result};}
export const passes=[
 {name:'崤函通道',x:-37,z:-3,kind:'关隘',axis:'x'},
 {name:'秦岭谷道',x:-60,z:6,kind:'关隘',axis:'z'},
 {name:'方城隘口',x:-5,z:23,kind:'关隘',axis:'z'},
 {name:'太行陉道',x:-13,z:-48,kind:'关隘',axis:'x'},
 {name:'巴蜀山道',x:-58,z:39,kind:'关隘',axis:'z'},
 {name:'轘辕山道',x:-12,z:13,kind:'关隘',axis:'z'},
 {name:'鲁南谷道',x:56,z:-13,kind:'关隘',axis:'z'}
];
export const crossings=[[-48,-45],[-28,-13],[2,-20], [15,-47], [60,-56], [-70,-13],[-33,32],[-12,50],[-60,74],[-27,56],[17,57],[60,29],[-25,-50],[-33,-29],[-57,-30],[-18,7],[26,32],[61,18],[34,1],[-80,67]].map(([x,z],i)=>{const p=waterAt(x,z,false);return {name:p.name+'渡'+(i+1),x:p.x,z:p.z,dx:p.dx,dz:p.dz,width:p.width,kind:'津渡'};});
export function crossingAt(x,z){return crossings.find(p=>{const dx=x-p.x,dz=z-p.z;return Math.abs(dx*p.dx+dz*p.dz)<2.1&&Math.abs(-dx*p.dz+dz*p.dx)<p.width+2.8;});}
export function passAt(x,z){return passes.find(p=>Math.abs(x-p.x)<(p.axis==='x'?7:2.5)&&Math.abs(z-p.z)<(p.axis==='z'?8:2.5));}
export const landmarks=[
 ...lakes.map(l=>({name:l.name,x:l.x,z:l.z,kind:'lake'})),
 ...hills.map(h=>({name:h.name,x:h.x,z:h.z,kind:'mountain'})),
 ...rivers.slice(4).map(r=>({name:r.name,x:r.points[1][0],z:r.points[1][1],kind:'river'})),
 {name:'黄 河',x:-48,z:-58,kind:'river'},{name:'黄河古下游',x:42,z:-55,kind:'river'},
 {name:'长 江',x:19,z:56,kind:'river'},{name:'三 峡',x:-29,z:54,kind:'river'},
 {name:'渭 水',x:-60,z:-12,kind:'river'},{name:'汉 水',x:-35,z:31,kind:'river'},
 {name:'秦 岭',x:-51,z:7,kind:'mountain'},{name:'太 行',x:-13,z:-60,kind:'mountain'},
 {name:'燕 山',x:39,z:-76,kind:'mountain'},{name:'川西群山',x:-85,z:48,kind:'mountain'},
 {name:'大 巴 山',x:-46,z:39,kind:'mountain'}
];

export function passBlend(x,z){let blend=0;for(const p of passes){const a=Math.abs(x-p.x)/(p.axis==='x'?7:2.5),b=Math.abs(z-p.z)/(p.axis==='z'?8:2.5);const t=Math.max(0,Math.min(1,(Math.max(a,b)-1)/.7));blend=Math.max(blend,1-t*t*(3-2*t));}return blend;}
