import {scenario} from './runtime.js';
import {landRings} from '../geography/east-asia-land.js';
const config=scenario.map.coast;
function interpolate(v,knots){for(let i=1;i<knots.length;i++)if(v<=knots[i][0]){const a=knots[i-1],b=knots[i];return a[1]+(b[1]-a[1])*(v-a[0])/(b[0]-a[0]);}return knots.at(-1)[1];}
export function projectGeo(lon,lat){return [interpolate(lon,config.projectionX)+config.offset[0],interpolate(lat,config.projectionZ)+config.offset[1]];}
export const coastRings=config?landRings.map(r=>r.map(([lon,lat])=>[lon===95?-1000:projectGeo(lon,lat)[0],lat===48?-1000:lat===18?1000:projectGeo(lon,lat)[1]])):[];
// Build a bounded signed coast-distance field once. Per-vertex and per-frame reads are O(1).
const span=360,n=721,step=span*2/(n-1),field=new Float32Array(n*n).fill(-12);
if(config){
 for(let row=0;row<n;row++){const z=-span+row*step,hits=[];for(const ring of coastRings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],b=ring[i];if((a[1]>z)!==(b[1]>z))hits.push(a[0]+(z-a[1])*(b[0]-a[0])/(b[1]-a[1]));}hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2)for(let col=Math.max(0,Math.ceil((hits[i]+span)/step));col<=Math.min(n-1,Math.floor((hits[i+1]+span)/step));col++)field[row*n+col]=12;}
 for(const ring of coastRings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],b=ring[i],dx=b[0]-a[0],dz=b[1]-a[1],len=dx*dx+dz*dz;if(!len)continue;const loX=Math.max(0,Math.floor((Math.min(a[0],b[0])-12+span)/step)),hiX=Math.min(n-1,Math.ceil((Math.max(a[0],b[0])+12+span)/step)),loZ=Math.max(0,Math.floor((Math.min(a[1],b[1])-12+span)/step)),hiZ=Math.min(n-1,Math.ceil((Math.max(a[1],b[1])+12+span)/step));for(let r=loZ;r<=hiZ;r++)for(let c=loX;c<=hiX;c++){const x=-span+c*step,z=-span+r*step,t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/len)),d=Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz),k=r*n+c;if(d<Math.abs(field[k]))field[k]=(field[k]>=0?1:-1)*d;}}
}
export function coastDistance(x,z){if(!config)return 100;const u=Math.max(0,Math.min(n-1.001,(x+span)/step)),v=Math.max(0,Math.min(n-1.001,(z+span)/step)),c=Math.floor(u),r=Math.floor(v),a=u-c,b=v-r;return (field[r*n+c]*(1-a)+field[r*n+c+1]*a)*(1-b)+(field[(r+1)*n+c]*(1-a)+field[(r+1)*n+c+1]*a)*b;}
export const seaLabels=config?[[119.6,39,'渤 海'],[124.5,34,'黄 海'],[125,27.5,'东 海'],[115,20,'南 海']].map(([lon,lat,name])=>{const [x,z]=projectGeo(lon,lat);return{name,x,z,kind:'sea'};}):[];

export function coastTextureData(){return {size:n,span,data:Uint8Array.from(field,d=>Math.round((d+12)/24*255))};}
