import {actorDefinitions,cityAt} from './actors.js';
import {faction,cities} from './world.js';
import {populateOfficers} from './officer-data.js';
// Fictionalized prototype assignments, not historical claims; some actors now have live map behavior.
export const officers=[
 {name:'刘表',side:'刘表军',role:'主君 · 任用与战略',place:'襄阳',work:'决定防守方向、任命职务、分配援军和粮草。',talk:'接受军务、汇报战果、请求增援；提案是否获准取决于功绩、形势与可用资源。',ai:'留守中枢，向带兵武将下达目标；不因玩家闲逛而自动亲征。',hook:'完成北上侦察，获得第一次正式军务。'},
 {name:'蒯良',side:'刘表军',role:'谋臣 · 情报与筹划',place:'襄阳',work:'汇总侦察、判断敌军意图，为进军路线与防御提供建议。',talk:'请教、交换情报、商议提案；带回可靠消息比重复送礼更有用。',ai:'根据侦察报告调整建议；信息不全时只给推测，不透露敌方全图。',hook:'带回宛城出兵迹象，解锁敌军可能路线。'},
 {name:'蒯越',side:'刘表军',role:'政务 · 粮草与征募',place:'襄阳',work:'安排补给、征募与运输，将城市产出送往前线。',talk:'申请粮草、承接护粮、协商兵员；资源不足时会拒绝或要求等待。',ai:'按库存安排运输，路线受阻时请求护送或改道。',hook:'护送一批军粮抵达新野。'},
 {name:'蔡瑁',side:'刘表军',role:'将领 · 渡口防务',place:'汉水渡桥',work:'守卫渡口、巡防后路，维持襄阳至新野的补给。',talk:'协调换防、请求护送、商议夹击；同僚关系影响协作意愿。',ai:'巡防与守桥；接到求援后评估守备压力再决定是否出动。',hook:'争取蔡瑁守住渡桥，让你腾出兵力北上。'},
 {name:'文聘',side:'刘表军',role:'将领 · 前线守备',place:'新野',work:'驻守新野、侦察北方，遇敌时抵御、追击或撤回城下。',talk:'切磋、共同巡防、提议合兵；并肩完成军务提升信任。',ai:'侦察到敌军后判断兵力与补给，可能迎击、等待援军或固守。',hook:'与文聘协同，阻止敌军威胁新野。'},
 {name:'袁术',side:'袁术军',role:'主君 · 敌方战略',place:'宛城',work:'决定南下施压、夺取渡口或收缩防线，分配作战资源。',talk:'初期通过使者传递交涉，普通拜访不开放；后续接入停战与俘虏交换。',ai:'资源充足才下达出击；前线失利时撤回整补，不无限生成军队。',hook:'构成样区长期压力，具体命令由部将执行。'},
 {name:'张勋',side:'袁术军',role:'将领 · 南下先锋',place:'宛城',work:'执行南下侦察、试探进攻和破坏补给的军令。',talk:'先通过遭遇、交战、撤退认识对手；俘虏交涉留到后续阶段。',ai:'从宛城集结后沿可达路线出击，遇优势敌军或缺粮时撤退整补。',hook:'第一支会在地图上实际出击的敌军。'}
];
// Temporary original balance values, not copied from a commercial game's database.
const abilities=[[62,38,76,83],[38,26,91,82],[51,32,87,92],[76,65,68,70],[88,83,68,61],[48,44,58,65],[73,72,48,43]];
officers.forEach((o,i)=>{o.id=i;o.stats=abilities[i];});
const extraStats={xiahou:[86,87,63,65],xushu:[62,52,91,75],huangzhong:[84,93,63,53],pangde:[21,18,88,81]};for(const a of actorDefinitions){if(officers.some(o=>o.name===a.name))continue;officers.push({id:officers.length,name:a.name,side:a.owner?faction(a.owner).name+'军':'在野',role:a.kind==='army'?'将领 · 巡防':'游士 · 周游',place:a.home,stats:extraStats[a.id],work:a.reason,talk:'拜访与任务交互仍在规划中。',ai:a.reason,hook:'可在武将动向侧栏观察实时位置。'});}
populateOfficers(officers);
export function liveOfficer(o,simulation){return simulation?.actors.find(a=>a.name===o.name);}
export function officerPlace(o,simulation){const a=liveOfficer(o,simulation);if(!a)return o.place;const p=simulation.position(a);return cityAt(p.x,p.z)?.name||'赴'+a.destination;}
export function officersInCity(name,simulation){return officers.filter(o=>officerPlace(o,simulation)===name);}
export function officerFace(o,large=false){return o.portrait?`<span class="officer-face portrait-crop ${large?'large':''}"><img src="${o.portrait}" width="96" height="112" loading="lazy" decoding="async" alt="${o.name}"></span>`:`<span class="officer-face monogram ${large?'large':''}" aria-hidden="true">${o.name[0]}</span>`;}
export const abilityNames=['统率','武力','智略','政务'];
export function rosterRows({faction='all',city='all',sort=-1,descending=true}={},simulation=null){
 const rows=officers.filter(o=>(faction==='all'||o.side===faction)&&(city==='all'||officerPlace(o,simulation)===city));
 if(sort>=0)rows.sort((a,b)=>(a.stats[sort]-b.stats[sort])*(descending?-1:1)||a.id-b.id);
 return rows;
}
export function rosterMarkup(selected=0,options={},simulation=null){
 const rows=rosterRows(options,simulation),o=rows.find(x=>x.id===selected)||rows[0];
 const live=o=>liveOfficer(o,simulation),place=o=>officerPlace(o,simulation),face=officerFace;
 const th=abilityNames.map((n,i)=>`<th scope="col" aria-sort="${options.sort===i?(options.descending?'descending':'ascending'):'none'}"><button data-roster-sort="${i}" aria-label="按${n}排序">${n}<span aria-hidden="true">${options.sort===i?(options.descending?'▼':'▲'):'↕'}</span></button></th>`).join('');
 return `<div class="roster-toolbar"><div><strong>战区武将</strong><span>${rows.length} / ${officers.length} 人</span></div><label>势力 <select id="rosterFaction"><option value="all" ${options.faction==='all'?'selected':''}>全部势力</option>${[...new Set(officers.map(o=>o.side))].map(s=>`<option ${options.faction===s?'selected':''}>${s}</option>`).join('')}</select></label><label>驻城 <select id="rosterCity"><option value="all">全部城池</option>${cities.map(c=>`<option ${options.city===c.name?'selected':''}>${c.name}</option>`).join('')}</select></label></div>${!o?'<p class="empty-roster">当前条件下暂无驻留武将，请切换城池或势力。</p>':`<div class="officer-browser"><section class="officer-ledger" aria-label="武将能力列表"><div class="officer-table-scroll"><table class="officer-table"><thead><tr><th scope="col">武将</th><th scope="col">势力</th><th scope="col">所在</th>${th}<th scope="col">职责</th></tr></thead><tbody>${rows.map(x=>`<tr data-officer="${x.id}" class="${x.id===o?.id?'is-selected':''}"><th scope="row"><button data-officer="${x.id}" aria-pressed="${x.id===o?.id}" aria-label="预览${x.name}">${face(x)}<span>${x.name}</span></button></th><td><span class="faction-dot" style="background:${x.owner?faction(x.owner).color:'#c9c8bc'}"></span>${x.side.replace('军','')}</td><td>${place(x)}</td>${x.stats.map(v=>`<td class="ability-value ${v>=85?'excellent':''}">${v}</td>`).join('')}<td class="duty-cell">${x.role.split(' · ')[0]}</td></tr>`).join('')}</tbody></table></div><p class="ledger-hint">点击一行预览武将 · 点击能力列排序</p><p class="ledger-note">能力为本原型暂定值（满值 100），尚未参与战斗结算。角色编组为架空演练。</p></section><section class="officer-preview" aria-label="武将预览"><div class="preview-identity">${face(o,true)}<div><small>${o.side} · ${place(o)}</small><h3>${o.name}</h3><p>${o.role}</p></div></div><div class="ability-bars">${o.stats.map((v,i)=>`<div><span>${abilityNames[i]}</span><b>${v}</b><i><em style="width:${v}%"></em></i></div>`).join('')}</div><dl class="preview-facts">${live(o)?`<dt>当前动向</dt><dd>${live(o).phase} · ${live(o).destination} <button data-action="watch-${live(o).id}">地图观察</button></dd>`:''}<dt>职责</dt><dd>${o.work}</dd><dt>人物交互 · 规划</dt><dd>${o.talk}</dd></dl><details class="preview-more"><summary>自主行动与任务设计</summary><p>${o.ai}</p><p>${o.hook}</p></details><p class="preview-note">拜访与任务尚未接入；驻城名录不自动生成部队。带兵与周游行动可在地图观察。</p></section></div>`}`;
}
