export const catalog=[
 {id:'chunqiu',title:'春秋群英',subtitle:'列国并立 · 跨时代群英',description:'28方势力，38座城邑；细化河湖、谷道与列国人物。'},
 {id:'sanguo',title:'三国群英',subtitle:'荆襄起行 · 天下逐鹿',description:'9方势力，35座城邑；沿用原三国人物与区域地图。'}
];
export async function loadScenario(id){if(!catalog.some(s=>s.id===id))throw new Error('未找到剧本：'+id);return (await import('../scenarios/'+id+'/manifest.js')).default;}
