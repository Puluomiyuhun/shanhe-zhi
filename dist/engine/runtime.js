import {loadScenario} from './catalog.js';
import {validateScenario} from './schema.js';
const id=typeof location!=='undefined'?new URLSearchParams(location.search).get('scenario')||'chunqiu':globalThis.process?.env?.SCENARIO||'chunqiu';
export const scenario=validateScenario(await loadScenario(id));
const player=scenario.player,side=scenario.factions.find(f=>f.id===player.owner);
const values={title:scenario.title,subtitle:scenario.subtitle,hero:player.name,ruler:side.ruler,rulerTitle:'所属势力',side:side.name,faction:side.name,army:side.name+'军',home:player.home,target:player.target,troops:player.troops.toLocaleString(),officer:scenario.terms.officer,factionCount:scenario.factions.length,cityCount:scenario.cities.length,officerCount:scenario.officers.length,actorCount:scenario.actors.length,cellCount:(scenario.map.cols*scenario.map.rows).toLocaleString(),portrait:player.portrait};
export function format(text){return text.replace(/\{([a-zA-Z]+)\}/g,(all,key)=>Object.hasOwn(values,key)?String(values[key]):all);}
