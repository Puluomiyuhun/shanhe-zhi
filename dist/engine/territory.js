import {scenario} from './runtime.js';
const outline=scenario.map.playableOutline;
export function territoryDistance(x,z){
 if(!outline)return Math.min(scenario.map.extent.x-Math.abs(x),scenario.map.extent.z-Math.abs(z));
 return polygonDistance(outline,x,z);
}
export function polygonDistance(outline,x,z){
 let inside=false,dist=Infinity;
 for(let i=0,j=outline.length-1;i<outline.length;j=i++){
  const a=outline[j],b=outline[i],dx=b[0]-a[0],dz=b[1]-a[1],len=dx*dx+dz*dz,t=len?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/len)):0;
  dist=Math.min(dist,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));
  if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside?dist:-dist;
}
export function inPlayableArea(x,z){return !outline||territoryDistance(x,z)>=0;}
export function territoryOpacity(x,z){const d=territoryDistance(x,z),t=Math.max(0,Math.min(1,d/2.6));return t*t*(3-2*t);}
