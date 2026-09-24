import * as THREE from '../lab/vendor/three.module.js';
import {height,riverZ,riverWidth,roadX,cities} from './world.js';

// Deterministic material maps and instanced geometry keep the sample self-contained.
let seed=92317;
const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
function texture(kind){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle=kind==='roof'?'#645d4d':kind==='wall'?'#a39370':'#b4b4a3';ctx.fillRect(0,0,256,256);
  for(let i=0;i<10000;i++){const v=Math.floor(100+random()*110);ctx.fillStyle=`rgba(${v},${v},${v},.16)`;ctx.fillRect(random()*256,random()*256,1+random()*3,1+random()*3);}
  if(kind==='roof'){for(let x=0;x<256;x+=12){ctx.fillStyle='rgba(30,40,36,.28)';ctx.fillRect(x,0,3,256);ctx.fillStyle='rgba(225,223,198,.18)';ctx.fillRect(x+3,0,2,256);}for(let y=0;y<256;y+=32){ctx.fillStyle='rgba(25,30,27,.22)';ctx.fillRect(0,y,256,2);}}
  if(kind==='wall'){ctx.strokeStyle='rgba(41,42,37,.28)';ctx.lineWidth=2;for(let y=0;y<256;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();for(let x=(y/32%2)*32;x<256;x+=64){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+32);ctx.stroke();}}}
  const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
const soil=texture('soil');soil.repeat.set(72,72);
export const terrainMaterial=new THREE.MeshStandardMaterial({map:soil,vertexColors:true,roughness:1,bumpMap:soil,bumpScale:.085});
const roofMap=texture('roof'),wallMap=texture('wall');
export const materials={
 wall:new THREE.MeshStandardMaterial({color:'#a8a69a',map:wallMap,bumpMap:wallMap,bumpScale:.025,roughness:1}),
 roof:new THREE.MeshStandardMaterial({color:'#59635c',map:roofMap,bumpMap:roofMap,bumpScale:.035,roughness:.9}),
 wood:new THREE.MeshStandardMaterial({color:'#635240',roughness:1}),
 house:new THREE.MeshStandardMaterial({color:'#ccb990',roughness:1}),
 red:new THREE.MeshStandardMaterial({color:'#a54e3b',roughness:.9}),
 green:new THREE.MeshStandardMaterial({color:'#39735f',roughness:.9}),
 dark:new THREE.MeshStandardMaterial({color:'#31372f',roughness:1}),
 earth:new THREE.MeshStandardMaterial({color:'#95876b',roughness:1})
};
function cube(group,w,h,d,x,y,z,mat){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;}
// Pitched tiles with a lifted eave profile, instead of four-sided cone roofs.
function roof(group,w,d,h,x,y,z){
 const p=[],uv=[];const profile=[[-.56,.08],[-.4,.1],[0,1],[.4,.1],[.56,.08]];
 for(let i=0;i<4;i++){const[a,b]=[profile[i],profile[i+1]];const vertices=[[-w*.56,a[1]*h,a[0]*d],[w*.56,a[1]*h,a[0]*d],[-w*.56,b[1]*h,b[0]*d],[-w*.56,b[1]*h,b[0]*d],[w*.56,a[1]*h,a[0]*d],[w*.56,b[1]*h,b[0]*d]];vertices.forEach((v,j)=>{p.push(...v);uv.push(j===1||j===4||j===5?1:0,j===0||j===1||j===4?i/4:(i+1)/4);});}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();const mesh=new THREE.Mesh(g,materials.roof);mesh.material.side=THREE.DoubleSide;mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);cube(group,w*1.15,.045,.055,x,y+h,z,materials.roof);
}
function building(g,x,z,w,d,h,base=.23){cube(g,w,h,d,x,base+h/2,z,materials.house);roof(g,w,d,.37,x,base+h,z);for(const sign of [-1,1]){cube(g,.045,h+.07,.05,x+sign*w*.4,base+h/2,z+d*.51,materials.wood);}cube(g,w*.2,h*.65,.025,x,base+h*.325,z+d*.51,materials.dark);}
export function makeCity(city){
 const g=new THREE.Group();g.position.set(city.x,height(city.x,city.z),city.z);g.scale.setScalar(city.name==='曲沃'?.9:1.1);
 cube(g,5.2,.22,4.8,0,.1,0,materials.earth);
 // Cross streets, blocks of dwellings and a northern administrative courtyard.
 cube(g,.48,.035,4.5,0,.23,0,materials.wall);cube(g,4.9,.035,.35,0,.23,.3,materials.wall);
 for(const x of [-1.65,-.8,.8,1.65])for(const z of [.85,1.55])building(g,x,z,.6,.49,.38);
 for(const x of [-1.6,1.6])for(const z of [-1.25,-.45])building(g,x,z,.62,.63,.44);
 building(g,0,-1.15,1.6,.85,.72);cube(g,1.9,.12,.25,0,.28,-.5,materials.wall);
 for(const x of [-.95,.95])cube(g,.09,.35,1.7,x,.43,-1.15,materials.wall);
 // The southern gate is an opening, with two piers and a pavilion overhead.
 cube(g,5.2,.72,.24,0,.56,-2.3,materials.wall);
 for(const sign of [-1,1]){cube(g,2.03,.72,.24,sign*1.585,.56,2.3,materials.wall);cube(g,.24,.72,4.6,sign*2.48,.56,0,materials.wall);cube(g,.23,1,.4,sign*.57,.7,2.3,materials.wall);}
 for(let x=-2.4;x<=2.4;x+=.33)for(const z of [-2.3,2.3]){if(z>0&&Math.abs(x)<.8)continue;cube(g,.18,.19,.26,x,1.01,z,materials.wall);}
 for(let z=-2.15;z<2.2;z+=.33)for(const x of [-2.48,2.48])cube(g,.26,.19,.18,x,1.01,z,materials.wall);
 for(const x of [-2.48,2.48])for(const z of [-2.3,2.3]){cube(g,.53,1.04,.53,x,.7,z,materials.wall);cube(g,.44,.36,.43,x,1.38,z,materials.wood);roof(g,.76,.72,.32,x,1.57,z);}
 cube(g,1.5,.14,.66,0,1.14,2.3,materials.wood);cube(g,1.17,.5,.5,0,1.45,2.3,materials.house);roof(g,1.75,.95,.45,0,1.7,2.3);
 for(const x of [-.43,0,.43])cube(g,.16,.3,.02,x,1.43,2.56,materials.dark);
 return g;
}
function mergeGeometry(parts){const positions=[],normals=[],uv=[];for(const {g,matrix} of parts){const a=g.index?g.toNonIndexed():g;a.applyMatrix4(matrix);positions.push(...a.attributes.position.array);normals.push(...a.attributes.normal.array);uv.push(...a.attributes.uv.array);a.dispose();}const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));result.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));result.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return result;}
export function addLandscape(scene){
 const dummy=new THREE.Object3D(),parts=[];
 for(const [x,y,z,s] of [[0,1.15,0,.49],[-.31,.93,.04,.34],[.3,1.01,.11,.36],[.07,.95,-.3,.35],[.02,1.45,.01,.3]]){const g=new THREE.IcosahedronGeometry(s,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.13*Math.sin(x*44+y*29)*Math.cos(z*38-x*19);p.setXYZ(i,x*r,y*r,z*r);}g.computeVertexNormals();dummy.position.set(x,y,z);dummy.scale.set(1,1.05,.95);dummy.rotation.set(.1,random()*3,.15);dummy.updateMatrix();parts.push({g,matrix:dummy.matrix.clone()});}
 const crownGeo=mergeGeometry(parts),treePoints=[];
 for(let i=0;i<17000;i++){const x=(random()-.5)*167,z=(random()-.5)*155,y=height(x,z),slope=Math.hypot(height(x+.3,z)-height(x-.3,z),height(x,z+.3)-height(x,z-.3));if(y>11.2||y<.3||slope>1.05||Math.abs(x-roadX(z))<2.4||cities.some(c=>Math.hypot(c.x-x,c.z-z)<4.4)||Math.abs(z-riverZ(x))<riverWidth(x)+1.08)continue;if(Math.sin(x*.27+z*.16)+Math.cos(z*.28-x*.13)<.5)continue;treePoints.push({x,y,z,s:.48+random()*.65});}
 const leafMap=texture('soil');leafMap.repeat.set(3,3);const leaves=new THREE.InstancedMesh(crownGeo,new THREE.MeshStandardMaterial({color:'#c6d1b2',map:leafMap,bumpMap:leafMap,bumpScale:.045,roughness:1}),treePoints.length);
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.055,.08,.9,5),materials.wood,treePoints.length);
 treePoints.forEach((t,i)=>{dummy.position.set(t.x,t.y,t.z);dummy.rotation.set(0,random()*6.28,0);dummy.scale.set(t.s,t.s*(.85+random()*.3),t.s);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new THREE.Color().setHSL(.205+random()*.08,.22+random()*.13,.22+random()*.12));dummy.position.y=t.y+.42*t.s;dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);});leaves.castShadow=leaves.receiveShadow=true;trunks.castShadow=true;trunks.userData.smallDetail=true;scene.add(leaves,trunks);
 const rockPoints=[];for(let i=0;i<2400;i++){const x=(random()-.5)*163,z=(random()-.5)*153,y=height(x,z);const bank=Math.abs(z-riverZ(x));if((y>3.8&&random()>.48)||(bank>riverWidth(x)+.53&&bank<riverWidth(x)+1.68&&Math.abs(x-roadX(z))>3))rockPoints.push({x,y,z,s:y>3.8?.3+random()*.75:.1+random()*.22});}
 const rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:'#a19e88',roughness:1,flatShading:true}),rockPoints.length);
 rockPoints.forEach((p,i)=>{dummy.position.set(p.x,p.y+.08,p.z);dummy.rotation.set(random()*.8,random()*6,random()*.6);dummy.scale.set(p.s,p.s*.55,p.s*.7);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);rocks.setColorAt(i,new THREE.Color().setScalar(.7+random()*.3));});rocks.castShadow=rocks.receiveShadow=true;rocks.userData.smallDetail=true;scene.add(rocks);
 // Low reed clumps mark the wet banks without obscuring the crossing.
 const reedGeo=new THREE.BufferGeometry(),blades=[];for(let j=0;j<7;j++){const a=j*2.4,x=Math.cos(a)*.12,z=Math.sin(a)*.12,h=.2+random()*.25;blades.push(x-.02,0,z,x+.02,0,z,x+.08,h,z+.06);}reedGeo.setAttribute('position',new THREE.Float32BufferAttribute(blades,3));reedGeo.computeVertexNormals();const reedPoints=[];for(let i=0;i<420;i++){const x=(random()-.5)*216,z=riverZ(x)+(random()>.5?1:-1)*(riverWidth(x)+.58+random()*.55);if(Math.abs(x-roadX(z))<2.7||random()<.2)continue;reedPoints.push({x,z});}const reeds=new THREE.InstancedMesh(reedGeo,new THREE.MeshStandardMaterial({color:'#7c8755',roughness:1,side:THREE.DoubleSide}),reedPoints.length);reedPoints.forEach((p,i)=>{dummy.position.set(p.x,height(p.x,p.z),p.z);dummy.rotation.set(0,random()*6,0);dummy.scale.setScalar(.8+random()*.5);dummy.updateMatrix();reeds.setMatrixAt(i,dummy.matrix);});reeds.userData.smallDetail=true;scene.add(reeds);
 const ripples=[];for(let i=0;i<190;i++){const x=(random()-.5)*86,z=riverZ(x)+(random()-.5)*1.8;for(let j=0;j<3;j++){const px=x+j*.18,qx=px+.18;ripples.push(px,.192,z+(riverZ(px)-riverZ(x)),qx,.192,z+(riverZ(qx)-riverZ(x)));}}const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.Float32BufferAttribute(ripples,3));scene.add(new THREE.LineSegments(lineGeo,new THREE.LineBasicMaterial({color:'#b4c8b4',transparent:true,opacity:.16,depthWrite:false})));

}
export function makeWater(geometry){
 const map=texture('soil');map.colorSpace=THREE.NoColorSpace;map.repeat.set(8,2);
 // World-space UVs let the tiny surface ripple move continuously along the river.
 const p=geometry.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)/10,p.getZ(i)/4);geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 const material=new THREE.MeshStandardMaterial({color:'#587f78',roughness:.32,metalness:.2,bumpMap:map,bumpScale:.035,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;return {mesh,animate:time=>{map.offset.x=time*.000012;map.offset.y=time*.000005}};
}
