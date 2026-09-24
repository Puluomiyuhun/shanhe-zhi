import {scenario} from './runtime.js';
import {gridOpacity} from './view-policy.js';
import {waterAt} from './geography.js';
import * as THREE from '../lab/vendor/three.module.js';
import {height} from './world.js';

// Both zoom levels share the same geometry, city positions and ownership buffers.
export function createOverview({scene,root,terrain,details,ownerMaterial,gridMaterial,light,water}){
 const mix={value:0};
 terrain.material.onBeforeCompile=shader=>{
  shader.uniforms.uOverview=mix;
  shader.vertexShader='attribute vec3 overviewColor;\nuniform float uOverview;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <color_vertex>','#include <color_vertex>\nvColor.xyz = mix(vColor.xyz, overviewColor, uOverview);');
 };
 terrain.material.customProgramCacheKey=()=> 'terrain-overview-v1';
 // Mask ownership in fragment space so coarse hex triangles never paint over narrow rivers.
 const span=Math.max(scenario.map.extent.x,scenario.map.extent.z)+12;
 const size=512,mask=new Uint8Array(size*size);
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){const shore=waterAt(-span+(x+.5)*span*2/size,-span+(z+.5)*span*2/size).shore;mask[z*size+x]=Math.round(255*THREE.MathUtils.smoothstep(shore,.15,.9));}
 const riverMask=new THREE.DataTexture(mask,size,size,THREE.RedFormat);riverMask.minFilter=riverMask.magFilter=THREE.LinearFilter;riverMask.needsUpdate=true;
 ownerMaterial.onBeforeCompile=shader=>{
  shader.uniforms.uOverview=mix;shader.uniforms.uRiverMask={value:riverMask};shader.uniforms.uMapSpan={value:span};
  shader.vertexShader='varying vec2 vMapXZ;\nattribute float edgeOpacity;\nvarying float vEdgeOpacity;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvEdgeOpacity=edgeOpacity;vMapXZ=position.xz;');
  shader.fragmentShader='uniform float uMapSpan;\nuniform sampler2D uRiverMask;\nvarying vec2 vMapXZ;\nvarying float vEdgeOpacity;\nuniform float uOverview;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= mix(1.0,vEdgeOpacity,uOverview)*texture2D(uRiverMask,(vMapXZ+uMapSpan)/(uMapSpan*2.0)).r;');
 };
 ownerMaterial.customProgramCacheKey=()=> 'ownership-river-mask-v2';
 // Fine relief contours preserve terrain information after the mountain heights compress.
 const contours=[];
 for(let x=-108;x<108;x+=2)for(let z=-101;z<101;z+=2){
  const corners=[[x,z],[x+2,z],[x+2,z+2],[x,z+2]],h=corners.map(p=>height(...p));
  for(const level of [4,8,12,16]){const hits=[];for(let i=0;i<4;i++){const j=(i+1)%4;if((h[i]<level)===(h[j]<level))continue;const t=(level-h[i])/(h[j]-h[i]);hits.push([corners[i][0]+(corners[j][0]-corners[i][0])*t,level+.12,corners[i][1]+(corners[j][1]-corners[i][1])*t]);}for(let i=0;i+1<hits.length;i+=2)contours.push(...hits[i],...hits[i+1]);}
 }
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(contours,3));
 const relief=new THREE.LineSegments(cg,new THREE.LineBasicMaterial({color:'#5b7b75',transparent:true,opacity:0,depthWrite:false,depthTest:false}));relief.renderOrder=5;root.add(relief);
 const nearColor=new THREE.Color('#bfc4bb'),farColor=new THREE.Color('#c2c5ba');
 let previousMode=null;
 return{
  amount:0,
  update(distance,showGrid,showOwner,border){
   const amount=THREE.MathUtils.smoothstep(distance,160,310);this.amount=amount;mix.value=amount;
   root.scale.y=THREE.MathUtils.lerp(1,.76,amount);
   terrain.material.bumpScale=.085*(1-amount);
   ownerMaterial.opacity=THREE.MathUtils.lerp(.30,.56,amount);
   relief.material.opacity=amount*.075;
   terrain.material.emissive.set('#b8b5a0');terrain.material.emissiveIntensity=amount*.025;
   gridMaterial.opacity=gridOpacity(distance,showGrid);
   light.intensity=THREE.MathUtils.lerp(2.5,2.2,amount);light.shadow.intensity=1-THREE.MathUtils.smoothstep(amount,.72,1);water.material.bumpScale=.035*(1-amount);water.material.metalness=.2*(1-amount);water.material.roughness=.32+.5*amount;
   scene.background.copy(nearColor).lerp(farColor,amount);scene.fog.color.copy(scene.background);
   scene.fog.near=THREE.MathUtils.lerp(230,450,amount);scene.fog.far=THREE.MathUtils.lerp(470,850,amount);
   if(border){border.material.color.set(amount>.6?'#b9a36e':'#eed591');border.material.opacity=.85;border.renderOrder=6;}
   const strategic=amount>.75;
   for(const obj of details)obj.visible=!obj.userData.smallDetail||amount<.88;
   if(previousMode!==strategic){document.body.classList.toggle('strategic-view',strategic);document.getElementById('viewMode').textContent=strategic?'战略总览':'地形近览';previousMode=strategic;}
   document.getElementById('realmLabels').hidden=!strategic||!showOwner;
   return amount;
  }
 };
}
