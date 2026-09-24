import {scenario} from './runtime.js';
import {polygonDistance,territoryDistance} from './territory.js';

// Approximate cultural distribution, independent of ownership and pathfinding.
export const culturalRegions=scenario.map.culturalRegions||[];
const regions=culturalRegions.map(region=>({...region,
 bounds:[Math.min(...region.outline.map(p=>p[0])),Math.max(...region.outline.map(p=>p[0])),Math.min(...region.outline.map(p=>p[1])),Math.max(...region.outline.map(p=>p[1]))]
}));
const smooth=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function culturalTintAt(x,z,shore=100){
 if(shore<=0)return null;
 for(const region of regions){
  const [left,right,top,bottom]=region.bounds;
  if(x<=left||x>=right||z<=top||z>=bottom)continue;
  const d=polygonDistance(region.outline,x,z);
  if(d<=0)continue;
  const alpha=smooth(d/6)*smooth(-territoryDistance(x,z)/3)*smooth(shore/1.5);
  if(alpha>.001)return{region,alpha};
 }
 return null;
}
