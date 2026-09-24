import {DX} from './world.js';
// One clock drives both the visible segment and the per-cell simulation settlement.
export function createMarchMotion(world,settle){
 let x=world.cells[world.unit.cell].x,z=world.cells[world.unit.cell].z,segment=null;
 function retarget(){segment=null;}
 function prepare(){
  const next=world.cells[world.unit.path[0]];if(!next)return null;
  if(!segment||segment.id!==next.id)segment={id:next.id,x,z,elapsed:0,duration:Math.max(1,Math.hypot(next.x-x,next.z-z)/DX*next.cost*480)};
  return next;
 }
 function advance(ms){
  if(!Number.isFinite(ms)||ms<=0)return;
  let remaining=ms;
  while(remaining>0&&world.unit.path.length&&world.unit.morale>0){
   const next=prepare(),used=Math.min(remaining,segment.duration-segment.elapsed);segment.elapsed+=used;remaining-=used;
   const t=Math.min(1,segment.elapsed/segment.duration);x=segment.x+(next.x-segment.x)*t;z=segment.z+(next.z-segment.z)*t;
   if(t<1)break;
   segment=null;if(settle()===false)break;
  }
 }
 function finishStep(){if(!world.unit.path.length||world.unit.morale<=0)return;const next=prepare();x=next.x;z=next.z;segment=null;settle();}
 return{advance,finishStep,retarget,position:()=>({x,z})};
}
