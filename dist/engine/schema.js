export function validateScenario(s){
 const need=(ok,msg)=>{if(!ok)throw new Error('剧本配置错误：'+msg);};
 const finite=Number.isFinite;
 need(s?.schemaVersion===1,'不支持的数据版本');need(typeof s.id==='string'&&typeof s.title==='string','缺少名称');need(typeof s.terrainHeight==='function','缺少地形提供器');
 need(s.map&&Number.isInteger(s.map.cols)&&s.map.cols>1&&Number.isInteger(s.map.rows)&&s.map.rows>1&&s.map.size>0,'无效地图尺寸');need(s.map.extent.x>0&&s.map.extent.z>0,'地图边界');
 for(const k of ['factions','cities','officers','actors'])need(Array.isArray(s[k]),k+'必须是数组');
 need(s.factions.length&&s.cities.length,'势力和城邑不能为空');
 const owners=new Set(s.factions.map(f=>f.id)),towns=new Set(s.cities.map(c=>c.name));need(owners.size===s.factions.length,'重复势力ID');need(towns.size===s.cities.length,'重复城名');
 for(const c of s.cities)need(owners.has(c.owner)&&finite(c.x)&&finite(c.z)&&Math.abs(c.x)<=s.map.extent.x&&Math.abs(c.z)<=s.map.extent.z,'城邑坐标或归属：'+c.name);
 for(const f of s.factions)need(/^#[0-9a-f]{6}$/i.test(f.color)&&f.label?.length===2&&f.label.every(finite),'势力颜色/标注：'+f.name);
 need(s.player&&owners.has(s.player.owner)&&towns.has(s.player.home)&&towns.has(s.player.target)&&s.player.troops>0,'主角或起点/目标');
 need(new Set(s.officers.map(o=>o.id)).size===s.officers.length,'重复人物ID');
 for(const o of s.officers)need(towns.has(o.place)&&(!o.owner||owners.has(o.owner))&&o.stats?.length===4&&o.stats.every(v=>finite(v)&&v>=0&&v<=100),'人物：'+o.name);
 need(new Set(s.actors.map(a=>a.id)).size===s.actors.length,'重复行动ID');
 for(const a of s.actors)need(towns.has(a.home)&&a.targets?.length&&a.targets.every(x=>towns.has(x))&&(!a.owner||owners.has(a.owner))&&['army','traveler'].includes(a.kind),'行动角色：'+a.name);
 for(const k of ['rivers','lakes','hills','passes','crossings','landmarks','roadLinks'])need(Array.isArray(s.map[k]),'地图层：'+k);
 for(const r of s.map.rivers)need(r.width>0&&r.points.length>1&&r.points.every(p=>p.length===2&&p.every(finite)),'河流：'+r.name);
 for(const l of s.map.lakes)need([l.x,l.z,l.rx,l.rz,l.phase].every(finite)&&l.rx>0&&l.rz>0,'湖泊：'+l.name);
 for(const p of s.map.crossings)need([p.x,p.z,p.dx,p.dz,p.width].every(finite)&&p.width>0,'渡口：'+p.name);
 for(const r of s.map.roadLinks)need(towns.has(r.from)&&towns.has(r.to),'道路端点：'+r.name);
 if(s.map.coast){for(const axis of ['projectionX','projectionZ']){const k=s.map.coast[axis];need(k?.length>1&&k.every((p,i)=>p.length===2&&p.every(finite)&&(!i||p[0]>k[i-1][0])),axis+'映射无效');}need(s.map.coast.offset?.length===2&&s.map.coast.offset.every(finite),'海岸偏移');}
 return s;
}
