import {faction} from './world.js';
const num=n=>Math.floor(n).toLocaleString();
const tag=(text,type)=>`<span class="diplomacy-tag ${type}">${text}</span>`;
export function realmMarkup(sim,button){
 const c=sim.campaign;
 return `<div class="roster-toolbar"><div><strong>列国政略</strong><span>第 ${c.turn} 旬 · ${c.states.filter(s=>!s.eliminated).length} 国存续</span></div><span>选择国名查看所属城邑</span></div><div class="officer-table-scroll"><table class="officer-table army-ledger state-ledger"><thead><tr><th>国家</th><th>城邑</th><th>府库</th><th>粮草</th><th>总兵力</th><th>国策</th><th>外交</th></tr></thead><tbody>${c.states.map(s=>{
  const towns=c.owned(s.id),ties=[...c.relations.values()].filter(r=>r.a===s.id||r.b===s.id),wars=ties.filter(r=>r.status==='war'),allies=ties.filter(r=>r.status==='alliance');
  return `<tr class="${s.eliminated?'fallen-state':''}"><th><i class="realm-dot" style="background:${faction(s.id).color}"></i>${button('cities-'+s.id,faction(s.id).name,!towns.length)}</th><td>${towns.length}</td><td>${num(towns.reduce((n,t)=>n+t.gold,0))}</td><td>${num(towns.reduce((n,t)=>n+t.grain,0))}</td><td>${num(c.power(s.id))}</td><td>${s.eliminated?'失国':s.policy}</td><td>${wars.length?tag(wars.length+' 战争','war'):tag('无战事','peace')}${allies.length?tag(allies.length+' 盟约','alliance'):''}</td></tr>`;
 }).join('')}</tbody></table></div><p class="intel-note">钱粮来自城邑生产；征募和出征消耗资源。国家自主选择目标，军队沿地形行军，攻克城池后接收辖地。主角本队暂不参与自动交战。</p>`;
}
export function diplomacyMarkup(sim){
 const c=sim.campaign,relations=[...c.relations.values()].filter(r=>r.status!=='peace');
 const titles={war:'交战',alliance:'盟约',truce:'停战'};
 return `<div class="roster-toolbar"><div><strong>盟约与战局</strong><span>第 ${c.turn} 旬 · ${relations.filter(r=>r.status==='war').length} 场战争</span></div><span>各国自主议和与结盟</span></div><div class="officer-table-scroll"><table class="officer-table army-ledger"><thead><tr><th>国家</th><th>对方</th><th>关系</th><th>期限</th><th>执行规则</th></tr></thead><tbody>${relations.map(r=>`<tr><th>${faction(r.a).name}</th><td>${faction(r.b).name}</td><td>${tag(titles[r.status],r.status)}</td><td>${r.until?'剩余 '+Math.max(0,r.until-c.turn)+' 旬':'已交战 '+(c.turn-r.since)+' 旬'}</td><td>${r.status==='alliance'?'互不侵犯 · 可派兵援助':r.status==='truce'?'收兵休战 · 期限内不宣战':'野战与攻城 · 久战议和'}</td></tr>`).join('')||'<tr><td colspan="5">列国尚无盟约或战事，推进时间后形成局势。</td></tr>'}</tbody></table></div><p class="intel-note">这是规则驱动的架空局势，不复演历史事件。盟约不是自动胜利：援军仍需兵粮、空闲部队和可达路线。</p>`;
}
export function cityEconomyMarkup(city){return `<div class="city-economy"><span>府库 <b>${num(city.gold)}</b></span><span>粮草 <b>${num(city.grain)}</b></span><span>守军 <b>${num(city.garrison)}</b></span><span>城防 <b>${num(city.walls)}</b></span><span>民心 <b>${num(city.order)}</b></span><span>内政 <b>${city.project}</b></span></div>`;}
