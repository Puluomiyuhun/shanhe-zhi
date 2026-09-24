import assert from 'node:assert/strict';
import {culturalRegions,culturalTintAt} from './dist/engine/cultural-regions.js';
import {scenario} from './dist/engine/runtime.js';
import {createWorld,cities} from './dist/engine/world.js';
import {waterAt} from './dist/engine/geography.js';
const world=createWorld();
for(const c of world.cells)assert.equal(culturalTintAt(c.x,c.z),null,'族群染色不能覆盖可玩地块');
for(const c of cities)assert.equal(culturalTintAt(c.x,c.z),null,'不能覆盖城邑');
for(const region of culturalRegions){
 const [x,z]=region.label;
 assert.equal(culturalTintAt(x,z,waterAt(x,z).shore)?.region.id,region.id,'标注必须落在本区域陆地');
 assert.equal(culturalTintAt(x,z,-1),null,'不能染到水面');
}
assert.equal(world.cells.length,scenario.map.playableCellCount||scenario.map.cols*scenario.map.rows);
console.log({scenario:scenario.id,regions:culturalRegions.map(r=>r.name),cells:world.cells.length,cities:cities.length});
