import * as THREE from './vendor/three.module.js';
import {height,SIZE} from './world.js';
// Active orders have their own layer so inspecting another tile cannot erase them.
export function createOrderRoute(root){
 const group=new THREE.Group();group.name='active-order-route';root.add(group);
 const lineMaterial=new THREE.LineDashedMaterial({color:'#ffe38a',dashSize:.65,gapSize:.25,depthTest:false,transparent:true,opacity:.98});
 const targetMaterial=new THREE.LineBasicMaterial({color:'#fff1b9',depthTest:false});
 let line=null;
 function clear(){for(const object of [...group.children]){group.remove(object);object.geometry.dispose();}line=null;}
 function update(world){
  clear();if(!world.unit.path.length)return;
  const cells=[world.unit.cell,...world.unit.path].map(id=>world.cells[id]);
  line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(cells.map(c=>new THREE.Vector3(c.x,Math.max(.5,c.y)+.3,c.z))),lineMaterial);line.computeLineDistances();line.frustumCulled=false;line.renderOrder=12;group.add(line);
  const target=cells.at(-1),points=[];
  for(let i=0;i<=6;i++){const a=(30+i*60)*Math.PI/180,x=target.x+SIZE*Math.cos(a),z=target.z+SIZE*Math.sin(a);points.push(new THREE.Vector3(x,height(x,z)+.35,z));}
  const ring=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),targetMaterial);ring.renderOrder=13;group.add(ring);
  const diamond=[];for(const [dx,dz] of [[0,-.45],[.45,0],[0,.45],[-.45,0],[0,-.45]])diamond.push(new THREE.Vector3(target.x+dx,Math.max(.5,target.y)+.4,target.z+dz));
  const center=new THREE.Line(new THREE.BufferGeometry().setFromPoints(diamond),targetMaterial);center.renderOrder=13;group.add(center);
 }
 function follow(x,y,z){if(!line)return;line.geometry.attributes.position.setXYZ(0,x,y+.3,z);line.geometry.attributes.position.needsUpdate=true;}
 return{update,clear,follow};
}
