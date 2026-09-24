import assert from 'node:assert/strict';
import {scenario} from './dist/engine/runtime.js';
import {coastDistance,projectGeo,seaLabels} from './dist/engine/coast.js';
import {createWorld,cities,height} from './dist/engine/world.js';
const w=createWorld();
for(const c of cities){assert.ok(coastDistance(c.x,c.z)>3,c.name+' must stay inland');assert.ok(w.route(w.origin.id,w.nearest(c.x,c.z).id),c.name+' must stay reachable');}
for(const label of seaLabels){assert.ok(coastDistance(label.x,label.z)<0,label.name+' label must sit over water');assert.ok(height(label.x,label.z)<.13);}
for(const [lon,lat] of [[110.3,19.2],[121,23.7],[117,36],[112,30]]){const p=projectGeo(lon,lat);assert.ok(coastDistance(...p)>0,'Reference land '+lon+','+lat);}
const sea=w.cells.filter(c=>c.terrain==='海域');for(const c of sea){assert.equal(c.walkable,false);assert.equal(w.route(w.origin.id,c.id),null);}
assert.equal(w.cells.length,scenario.map.cols*scenario.map.rows);
console.log({scenario:scenario.id,seaCells:sea.length,cells:w.cells.length,cities:cities.length,seaLabels:seaLabels.map(l=>l.name),allCitiesInlandAndReachable:true});
