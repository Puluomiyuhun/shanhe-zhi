import {scenario} from './runtime.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// One station per city, using the existing camp/work-crew slot. No supply convoys or per-frame scans.
export function createDepots({world,evolution,cities,armies,atWar,position,go,route,returnArmy,emit,stats,turn}){
 Object.assign(stats,{depotRallies:0,depotRests:0,depotRaids:0,depotsDestroyed:0,depotSupplied:0});
 const all=()=>evolution.facilities.filter(f=>f.kind==='camp'&&f.status==='complete');
 const operational=f=>f&&f.status==='complete'&&world.cells[f.cell].owner===f.owner&&cities.some(c=>c.name===f.city&&c.owner===f.owner);
 const enemyNear=f=>armies.some(a=>a.active&&atWar(f.owner,a.owner)&&dist(position(a),f)<6);
 const available=(f,owner)=>operational(f)&&f.owner===owner&&!enemyNear(f);
 const find=id=>all().find(f=>f.id===id);
 function visit(a,f,mode='rest'){
  if(!a.active||a.slot===2||['rest','rally'].includes(a.order)||!available(f,a.owner)||!go(a,f.cell))return false;
  a.resumeOrder=a.order;a.depot=f.id;a.order=mode;a.phase=mode==='rally'?'赴兵站集结':'赴兵站休整';a.restTurns=0;a.lastDepot=turn();a.reason='前往'+f.name+'，补粮整军后继续军令';
  if(mode==='rally')stats.depotRallies++;else stats.depotRests++;emit('depot',a.name+'前往'+f.name+(mode==='rally'?'集结。':'休整。'));return true;
 }
 function stage(a,from,target){const direct=route(from.cell,target.cell);if(!direct)return false;
  const f=all().find(f=>available(f,a.owner)&&f.city===from.name&&(f.stock||0)>=100&&dist(f,target)<dist(from,target)&&(()=>{const r1=route(from.cell,f.cell),r2=route(f.cell,target.cell);return r1&&r2&&r1.cost+r2.cost<=direct.cost*1.45;})());return f?visit(a,f,'rally'):false;
 }
 function rest(a){if(a.slot===2||['rest','rally','return','wander','found'].includes(a.order)||turn()-(a.lastDepot??-100)<14||a.troops<a.initialTroops*.28)return false;
  const choices=all().filter(f=>available(f,a.owner)&&(f.stock||0)>=150&&dist(position(a),f)<22).sort((x,y)=>dist(position(a),x)-dist(position(a),y));return choices.some(f=>visit(a,f));
 }
 function threat(owner){return all().filter(f=>operational(f)&&atWar(owner,f.owner)).map(f=>({f,score:Math.min(...cities.filter(c=>c.owner===owner).map(c=>dist(c,f)))-armies.filter(a=>a.active&&a.owner===f.owner&&dist(position(a),f)<12).length*5})).filter(x=>x.score<30).sort((a,b)=>a.score-b.score)[0]?.f;}
 function resume(a){const order=a.resumeOrder;a.depot=null;if(a.troops<a.initialTroops*.28||a.morale<25){returnArmy(a,'兵力不足，结束休整归城');return;}
  if(order==='raid'){const f=find(a.targetFacility);if(operational(f)&&atWar(a.owner,f.owner)&&go(a,f.cell)){a.order='raid';a.phase='袭兵站';return;}}
  if(order==='attack'){const c=cities.find(c=>c.name===a.destination);if(c&&atWar(a.owner,c.owner)&&go(a,c.cell)){a.order='attack';a.phase='出征';return;}}
  if(order==='defend'){const enemy=armies.find(e=>e.id===a.targetArmy&&e.active&&e.serial===a.targetSerial);if(enemy&&atWar(a.owner,enemy.owner)&&go(a,enemy.cell)){a.order='defend';a.phase='迎战';return;}}
  returnArmy(a,'兵站整备结束，返回城邑');
 }
 function tick(){
  for(const f of all()){f.stock??=0;f.integrity??=100;if(!operational(f)||enemyNear(f))continue;const c=cities.find(c=>c.name===f.city),n=Math.max(0,Math.min(180,1800-f.stock,c.grain-1200));c.grain-=n;f.stock+=n;f.integrity=Math.min(100,f.integrity+2);}
  for(const a of armies.filter(a=>a.active)){
   if(['rest','rally'].includes(a.order)){
    const f=find(a.depot);if(!available(f,a.owner)){returnArmy(a,'兵站失守或敌军逼近');continue;}
    if(a.path.length||a.cell!==f.cell)continue;a.phase=a.order==='rally'?'集结':'休整';a.restTurns++;
    const n=Math.min(f.stock,240,Math.max(0,a.troops*1.5-a.food));f.stock-=n;a.food+=n;stats.depotSupplied+=n;if(a.food>0)a.morale=Math.min(100,a.morale+10);
    if(a.restTurns>=(a.order==='rally'?2:5))resume(a);
   }else if(a.order==='raid'){
    const f=find(a.targetFacility);if(!operational(f)||!atWar(a.owner,f.owner)){returnArmy(a,'敌兵站已毁、易主或停战');continue;}
    if(a.phase==='交战'||dist(position(a),f)>3)continue;a.phase='袭兵站';f.integrity??=100;f.integrity-=Math.max(16,Math.min(38,Math.sqrt(a.troops)*.7));const loss=Math.min(a.troops,12);a.troops-=loss;stats.casualties+=loss;
    if(!a.troops){a.active=false;a.path=[];continue;}
    if(f.integrity<=0){evolution.destroy(f);stats.depotsDestroyed++;emit('depot-destroyed',a.name+'摧毁'+f.name+'，粮储焚毁，敌军失去整备点。');returnArmy(a,'袭击兵站完成');}
   }
  }
  const u=world.unit;if(!u.path.length&&u.morale<100){const f=all().find(f=>available(f,scenario.player.owner)&&dist(world.cells[u.cell],f)<2.8&&f.stock>=60);if(f){f.stock-=60;u.morale=Math.min(100,u.morale+8);stats.depotSupplied+=60;}}
 }
 return{all,find,operational,available,visit,stage,rest,threat,tick};
}
