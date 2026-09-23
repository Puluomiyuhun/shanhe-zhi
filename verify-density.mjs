import assert from 'node:assert/strict';
import {createWorld,cities,factions,height} from './dist/lab/world.js';
const builds=[];let world;
for(let i=0;i<4;i++){const t=performance.now();world=createWorld();if(i)builds.push(performance.now()-t);}
const routes=[];
for(const city of cities){const start=performance.now(),route=world.route(world.origin.id,world.nearest(city.x,city.z).id);assert(route,city.name+' unreachable');routes.push({city:city.name,ms:performance.now()-start,steps:route.path.length-1});}
const start=performance.now();let checksum=0;for(let i=0;i<100000;i++)checksum+=height(i%500*.92-230,Math.floor(i/500)*2.3-230);
console.log(JSON.stringify({cities:cities.length,factions:factions.length,cells:world.cells.length,buildMs:builds.map(Math.round),height100kMs:Math.round(performance.now()-start),allRoutesMs:Math.round(routes.reduce((s,r)=>s+r.ms,0)),slowestRoutes:routes.sort((a,b)=>b.ms-a.ms).slice(0,5),checksum},null,2));
// Timings are observations on the current host, not portable pass/fail thresholds.
