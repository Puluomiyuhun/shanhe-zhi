import * as THREE from '../lab/vendor/three.module.js';
import {height,faction} from './world.js';
import {makeCity,makeSettlement,materials} from './art.js';
import {FACILITY_TYPES} from './evolution.js';

// Rebuild only on construction/ownership events, never per animation frame.
function batch(groups){
 const byMaterial=new Map(),result=new THREE.Group();
 for(const group of groups){group.updateMatrixWorld(true);group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);let b=byMaterial.get(o.material);if(!b){b={p:[],n:[],uv:[]};byMaterial.set(o.material,b);}b.p.push(...g.attributes.position.array);b.n.push(...g.attributes.normal.array);b.uv.push(...(g.attributes.uv?.array||new Float32Array(g.attributes.position.count*2)));g.dispose();o.geometry.dispose();});}
 for(const [material,b]of byMaterial){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));const m=new THREE.Mesh(g,material);m.castShadow=m.receiveShadow=true;result.add(m);}return result;
}
const cropMaterial=new THREE.MeshStandardMaterial({color:'#87924b',roughness:1});
function facilityModel(f){
 if(f.status==='complete'&&f.kind!=='farm')return makeSettlement(f);
 const g=new THREE.Group();
 function box(w,h,d,x,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,height(x,z)+h/2+.035,z);g.add(m);}
 if(f.status==='building'){
  for(const dx of [-1.1,1.1])for(const dz of [-.8,.8])box(.09,.7,.09,f.x+dx,f.z+dz,materials.wood);
  for(let i=0;i<3;i++)box(.9,.12,.14,f.x-.3,f.z-.4+i*.2,materials.wood);
 }else{
  // Narrow broken rows follow the terrain; no floating rectangular foundation.
  for(let row=0;row<6;row++)for(let part=0;part<5;part++){const x=f.x-1.25+part*.52,z=f.z-.95+row*.38;box(.46,.075,.16,x,z,(row+part)%4?cropMaterial:materials.earth);}
  box(.5,.22,.45,f.x+1.3,f.z+1.15,materials.wood);
 }return g;
}
export function createEvolutionView({root,getSimulation,cityLabels,regionLabels,label,onCity,onMove,landscape,onChange}){
 let current=null,revision=-1,cityLayer=null,facilityLayer=null,facilityLabels=[];
 const initialCityCount=cityLabels.length,initialRealmCount=regionLabels.length;
 function remove(layer){if(!layer)return;root.remove(layer);layer.traverse(o=>o.geometry?.dispose());}
 function clearTrees(points){for(const mesh of landscape){const data=mesh.userData;if(!data.treePoints)continue;mesh.instanceMatrix.array.set(data.originalMatrices);for(let i=0;i<data.treePoints.length;i++){const p=data.treePoints[i];if(points.some(s=>Math.hypot(s.x-p.x,s.z-p.z)<(s.dynamic?4.5:2.6)))mesh.instanceMatrix.array.fill(0,i*16,i*16+16);}mesh.instanceMatrix.needsUpdate=true;}}
 function sync(){const c=getSimulation().campaign;
  if(current!==c){current=c;revision=-1;for(const l of cityLabels.splice(initialCityCount))l.el.remove();for(const l of regionLabels.splice(initialRealmCount))l.el.remove();for(const l of cityLabels)l.city=c.cities.find(t=>t.name===l.city.name);}
  if(revision===c.evolution.visualRevision&&cityLabels.length===c.cities.length&&regionLabels.filter(r=>r.factionId).length===c.factions.filter(f=>f.showLabel!==false).length)return;
  revision=c.evolution.visualRevision;
  for(const city of c.cities)if(!cityLabels.some(l=>l.city.name===city.name)){
   const el=document.createElement('button');el.className='city-label map-object';el.setAttribute('aria-label',city.name+'情报');el.innerHTML='<i class="city-standard"></i><div class="city-plate"><div class="city-plate-title">'+city.name+'<small>新筑</small></div><div class="city-plate-detail"></div></div>';el.onclick=()=>onCity(city);el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();onMove(city);};
   const badge=document.createElement('span');badge.className='hero-city-badge';badge.textContent='主';el.appendChild(badge);document.getElementById('labels').appendChild(el);cityLabels.push({city,el,badge,point:new THREE.Vector3(city.x,height(city.x,city.z)+2.5,city.z)});
  }
  for(const f of c.factions)if(f.showLabel!==false&&!regionLabels.some(r=>r.factionId===f.id)){const el=document.createElement('div');el.className='realm-label';el.style.setProperty('--faction-color',f.color);el.innerHTML=f.name+'<span>新立</span>';document.getElementById('realmLabels').appendChild(el);regionLabels.push({el,factionId:f.id,point:new THREE.Vector3(...[f.label[0],1,f.label[1]])});}
  remove(cityLayer);remove(facilityLayer);cityLayer=batch(c.cities.filter(t=>t.dynamic).map(makeCity));facilityLayer=batch(c.evolution.facilities.map(facilityModel));root.add(cityLayer,facilityLayer);
  for(const l of facilityLabels)l.el.remove();facilityLabels=c.evolution.facilities.map(f=>{const el=document.createElement('div');el.className='geography-label settlement facility-label';el.style.setProperty('--faction-color',faction(f.owner).color);document.getElementById('labels').appendChild(el);return{f,el,point:new THREE.Vector3(f.x,f.y+1.1,f.z)};});
  clearTrees([...c.evolution.facilities,...c.cities.filter(t=>t.dynamic)]);onChange();
 }
 return{sync,update(distance,overview){if(cityLayer)cityLayer.visible=overview<.95;if(facilityLayer)facilityLayer.visible=distance<190;for(const l of facilityLabels){const f=l.f;textContent(l.el,FACILITY_TYPES[f.kind].name+(f.status==='building'?' · '+(f.progress?f.progress+'/'+f.required:'赴工'):''));label(l.el,l.point);if(distance>105)l.el.hidden=true;}}};
}
function textContent(el,value){if(el.textContent!==value)el.textContent=value;}
