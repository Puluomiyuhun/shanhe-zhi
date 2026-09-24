import {catalog} from './catalog.js';
const id=new URLSearchParams(location.search).get('scenario');
if(!id){
 document.title='山河志 · 剧本选择';document.body.className='scenario-picker';
 document.body.innerHTML='<main><small>山 河 志 · SCENARIOS</small><h1>选择一段山河</h1><p>同一套行军与情报系统，不同的时代、人物和沙盘。</p><div class="scenario-cards">'+catalog.map(s=>`<a href="?scenario=${s.id}"><small>${s.subtitle}</small><h2>${s.title}</h2><p>${s.description}</p><b>进入剧本 →</b></a>`).join('')+'</div><p class="scenario-note">战国七雄、秦楚汉可通过新增剧本包接入，尚未制作。切换剧本会重新开始演练；当前未实现存档。</p><a href="../lab/">原三国独立版</a></main>';
}else{
 try{
  const {scenario,format}=await import('./runtime.js');
  const response=await fetch(new URL('./template.html',import.meta.url));if(!response.ok)throw new Error('界面模板加载失败');
  const html=format(await response.text()),doc=new DOMParser().parseFromString(html,'text/html');
  document.title='山河志 · '+scenario.title;document.body.replaceChildren(...doc.body.childNodes);
  await Promise.all([...doc.querySelectorAll('link[rel=stylesheet]')].map(link=>new Promise((resolve,reject)=>{const el=document.createElement('link');el.rel='stylesheet';el.href=link.getAttribute('href');el.onload=resolve;el.onerror=()=>reject(new Error('样式加载失败'));document.head.append(el);}))); 
  const note=document.querySelector('#guide details p');if(note)note.textContent=scenario.description+' '+scenario.factions.length+'方势力、'+scenario.cities.length+'城、'+scenario.officers.length+'名人物。湖泊、海域与险山不可走，河流经津渡通行。沿海为现代轮廓适配的地理背景，并非古海岸精确复原；疆域以外的背景区域尚不可行军。国家会派工役队建设屯田、市集、军营；首领偶尔叛变或自立，流浪军可择地筑城。城市情报显示忠诚与营建收益，军情记录事件。新国、新城为架空演进，不代表史实。主角战斗、人物成长和存档尚未接入。';
  document.querySelectorAll('#guide details p').forEach((p,i)=>{if(i>0)p.remove();});
  document.querySelector('.chapter b').textContent=scenario.subtitle;
  await import('./main.js');
 }catch(error){document.body.replaceChildren();const box=document.createElement('main');box.className='scenario-error';const h=document.createElement('h1');h.textContent='无法载入剧本';const p=document.createElement('p');p.textContent=error.message;const a=document.createElement('a');a.href='./';a.textContent='返回剧本选择';box.append(h,p,a);document.body.append(box);console.error(error);}
}
