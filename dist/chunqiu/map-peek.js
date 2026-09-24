import {officers,officerFace} from './roster.js';
import {faction} from './world.js';
// One floating card: never change the projected marker's dimensions.
export function createMapPeek({getWorld,getSimulation}){
 const card=document.createElement('section');card.id='mapOfficerPeek';card.className='map-officer-peek';card.setAttribute('role','tooltip');card.hidden=true;document.body.append(card);
 let anchor=null,last=0,stamp='';
 function hide(){anchor?.removeAttribute('aria-describedby');anchor=null;card.hidden=true;}
 function show(el){if(!el||el===anchor)return;hide();anchor=el;anchor.setAttribute('aria-describedby',card.id);last=0;stamp='';}
 const labels=document.getElementById('labels');
 labels.addEventListener('pointerover',e=>show(e.target.closest('[data-map-officer]')));
 labels.addEventListener('pointerout',e=>{if(anchor&&!anchor.contains(e.relatedTarget))hide();});
 labels.addEventListener('focusin',e=>show(e.target.closest('[data-map-officer]')));
 labels.addEventListener('focusout',hide);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
 return{update(now){
  if(!anchor)return;
  if(anchor.hidden||document.querySelector('dialog[open]')){hide();return;}
  if(now-last>180||!last){last=now;const w=getWorld(),hero=anchor.dataset.mapOfficer==='hero',a=hero?null:getSimulation().actors.find(a=>a.id===anchor.dataset.mapOfficer);if(!hero&&!a){hide();return;}
   const name=hero?'姬衡':a.name,side=hero?'晋军':a.owner?faction(a.owner).name+'军':'在野',phase=hero?(w.unit.path.length?'行军':'待命'):a.phase;
   const html=`<div class="peek-heading">${!hero&&officers.find(o=>o.name===name)?.portrait?officerFace(officers.find(o=>o.name===name)):`<span class="peek-seal">${name[0]}</span>`}<div><small>${side} · ${hero?'本队':a.kind==='army'?'带兵卿士':'独自游历'}</small><h3>${name}</h3></div><em>${phase}</em></div><dl><div><dt>兵力</dt><dd>${hero?'1,200':a.troops?a.troops.toLocaleString():'未带兵'}</dd></div><div><dt>${hero?'士气':'前往'}</dt><dd>${hero?w.unit.morale:a.destination}</dd></div><div><dt>路程</dt><dd>${hero?w.unit.path.length:a.path.length} 格</dd></div></dl><p>${hero?'补给'+(w.supplied()?'连通':'中断')+' · 金色路线为当前军令':a.reason}</p><footer>点击固定至侧栏</footer>`;
   if(html!==stamp){card.innerHTML=html;stamp=html;}card.hidden=false;
  }
  const r=anchor.getBoundingClientRect(),width=card.offsetWidth,height=card.offsetHeight;
  let x=r.left+Math.min(r.width,30),y=r.bottom+7;if(y+height>innerHeight-12)y=r.top-height-7;
  card.style.left=Math.max(12,Math.min(innerWidth-width-12,x))+'px';card.style.top=Math.max(12,y)+'px';
 }};
}
