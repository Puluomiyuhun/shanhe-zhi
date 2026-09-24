import data from './data.js';
const corridors=data.cities.slice(3).map(c=>{const end=c.z<22?-61-Math.sin(c.x*.035)*3:67-Math.sin(c.x*.04)*4;return{x:c.x,lo:Math.min(c.z,end),hi:Math.max(c.z,end)};});
export function terrainHeight(x,z,{noise2,smooth,cities}){
 const ridge=(d,w)=>Math.exp(-((d/w)**2));
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
 for(const c of corridors){const dx=Math.abs(x-c.x);if(dx>=5.5||dx>=valley)continue;const dz=Math.max(c.lo-z,0,z-c.hi);if(dz<5.5)valley=Math.min(valley,Math.hypot(dx,dz));}
 const blend=smooth(1.8,5.5,valley);base=Math.min(base,1.7)+(base-Math.min(base,1.7))*blend;
 for(const c of cities){const dx=x-c.x,dz=z-c.z;if(Math.abs(dx)>=8||Math.abs(dz)>=8)continue;const d=Math.hypot(dx,dz);if(d<8){const t=smooth(4.7,8,d);base=.5+(base-.5)*t;}}

return base;
}
