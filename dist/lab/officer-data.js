import {cities,faction,factions} from './world.js';
import {portraits} from './portrait-data.js';
// Mixed-era regional cast for this sandbox, NOT a historical garrison reconstruction.
// Each row: city, military role, civil/support role; numbers are original prototype balance.
const cityCast=[
 ['襄阳','刘琦','伊籍'],['新野','魏延','刘磐'],['宛城','纪灵','杨弘'],
 ['汉中','张鲁','阎圃'],['西城','杨任','申耽'],['上庸','申仪','杨昂'],
 ['房陵','邓龙','刘先'],['宜城','蔡瑁','韩嵩'],['江陵','张允','王粲'],
 ['鲁阳','桥蕤','阎象'],['许昌','曹操','荀彧'],['汝南','曹仁','满宠'],
 ['随县','程普','黄盖'],['安陆','韩当','朱治'],['武都','马腾','马超'],
 ['阴平','庞德','马岱'],['成都','刘焉','张松'],['梓潼','吴懿','黄权'],
 ['巴西','严颜','王累'],['江州','甘宁','董和'],['长安','董卓','李儒'],
 ['弘农','李傕','贾诩'],['洛阳','吕布','华雄'],['秣陵','刘繇','许劭'],
 ['丹阳','太史慈','笮融'],['芜湖','张英','樊能'],['沔阳','张卫','杨柏'],
 ['成固','杨松','杨白'],['堵阳','李丰','韩胤'],['博望','陈兰','雷薄'],
 ['陈留','夏侯渊','陈宫'],['陈县','乐进','荀攸'],['谯县','许褚','曹洪'],
 ['秭归','黄祖','祢衡'],['江夏','孙坚','孙策']
];
const reinforcements=[['陈县','张郃','将领'],['许昌','郭嘉','谋臣'],['汝南','徐晃','将领'],['洛阳','张辽','将领'],['成都','法正','谋臣'],['江夏','周瑜','谋臣'],['芜湖','周泰','将领'],['秣陵','张昭','政务'],['丹阳','张纮','政务']];
const knownStats={曹操:[94,71,92,91],荀彧:[48,24,94,97],马超:[88,96,48,39],庞德:[84,93,61,45],吕布:[91,99,32,23],孙坚:[91,91, 73, 64],孙策:[93,94, 73, 64],周瑜:[95, 73,95, 82],太史慈:[87,94, 64, 53],郭嘉:[ 53, 24,96, 73],法正:[ 64, 32,94, 82]};
export function populateOfficers(existing){
 const result=existing;
 const add=(name,city,role)=>{
  if(['马超','马岱','孙策','黄盖','朱治','华雄','张允','杨昂','杨任','申耽','申仪','杨柏','杨白','雷薄','樊能','曹洪'].includes(name))role='将领';
  const current=result.find(o=>o.name===name);if(current){current.place=city.name;return;}
  const seed=[...name].reduce((a,c)=>a+c.charCodeAt(0),0),civil=role!=='将领';
  const stats=knownStats[name]||(civil?[38+seed%28,24+seed%26,65+seed%24,67+seed%24]:[65+seed%25,65+(seed*3)%27, (42+seed%29), (42+(seed*2)%29)]);
  result.push({id:result.length,name,side:faction(city.owner).name+'军',role:role+' · 驻城',place:city.name,stats,work:city.name+'驻留名录。'+(civil?'政务、筹谋职责待后续任务系统接入。':'守备、出征职责待后续军务系统接入。'),talk:'拜访、委托与关系尚未接入。',ai:'当前驻城，不参与逐帧寻路；只有行动名录中的武将会出征或周游。',hook:'为后续城市人物与军务提供角色。'});
 };
 for(const [cityName,...names] of cityCast){const city=cities.find(c=>c.name===cityName);names.forEach((name,i)=>add(name,city,i?'政务':'将领'));}
 for(const [cityName,name,role] of reinforcements)add(name,cities.find(c=>c.name===cityName),role);
 for(const o of result){o.owner=factions.find(f=>f.name+'军'===o.side)?.id||0;o.portrait=portraits[o.name]?.src||null;if(['曹操','孙坚','刘焉','刘繇','董卓','张鲁','马腾'].includes(o.name))o.role='主君 · 驻城';}
 return result;
}
