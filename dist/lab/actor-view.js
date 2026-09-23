import * as THREE from './vendor/three.module.js';
import {faction,height} from './world.js';
import {actorDefinitions,cityAt} from './actors.js';
export const actorSide=a=>a.owner?faction(a.owner).name+'军':'在野';
export const actorColor=a=>a.owner?faction(a.owner).color:'#c9c8bc';
export function createActorView({root,getSimulation,label,onInspect}){
 const body=new THREE.CylinderGeometry(.13,.19,.55,6),head=new THREE.SphereGeometry(.12,6,5),pole=new THREE.CylinderGeometry(.025,.025,1.8,4),flag=new THREE.PlaneGeometry(.7,.45);
 const entries=actorDefinitions.map(a=>{
  const model=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:actorColor(a),roughness:.9});
  for(let i=0;i<(a.kind==='army'?3:1);i++){const x=(i-1)*.4;const b=new THREE.Mesh(body,mat);b.position.set(a.kind==='army'?x:0,.38,0);const h=new THREE.Mesh(head,mat);h.position.set(a.kind==='army'?x:0,.79,0);model.add(b,h);}
  if(a.kind==='army'){const p=new THREE.Mesh(pole,mat),f=new THREE.Mesh(flag,mat);p.position.set(.55,.95,0);f.position.set(.88,1.6,0);mat.side=THREE.DoubleSide;model.add(p,f);}
  model.traverse(o=>{if(o.isMesh)o.castShadow=true});root.add(model);
  const el=document.createElement('button');el.className='npc-marker '+a.kind;el.style.setProperty('--faction-color',actorColor(a));el.setAttribute('aria-label',a.name+'动向');el.title=a.name+' · '+(a.kind==='army'?'带兵行动':'独自周游');el.innerHTML='<i aria-hidden="true">'+(a.kind==='army'?'旗':'游')+'</i><span>'+a.name+'</span>'+(a.kind==='army'?'<b>'+a.troops.toLocaleString()+'</b>':'');el.onclick=()=>onInspect(a.id);document.getElementById('labels').appendChild(el);
  return{id:a.id,model,el,point:new THREE.Vector3()};
 });
 return{update(){const sim=getSimulation();for(const e of entries){const a=sim.actors.find(a=>a.id===e.id),p=sim.position(a),inside=cityAt(p.x,p.z);e.model.visible=!inside;e.model.position.set(p.x,Math.max(.48,height(p.x,p.z)),p.z);if(a.path.length){const next=sim.position({...a,progress:a.progress+1});e.model.rotation.y=Math.atan2(next.x-p.x,next.z-p.z);}
  if(inside)e.el.hidden=true;else{e.point.set(p.x,e.model.position.y+1.5,p.z);label(e.el,e.point);}
  e.el.dataset.phase=a.phase;
 }}};
}
