import {createActors} from './actors.js';
import {createCampaign} from './campaign.js';
export function createSimulation(world,onEvent=()=>{},options={}){
 const travelers=createActors(world,onEvent,{travelersOnly:true});
 const campaign=createCampaign(world,onEvent,options);
 const actors=[...travelers.actors,...campaign.armies];
 return{campaign,actors,advance(ms){travelers.advance(ms);campaign.advance(ms);if(actors.length!==travelers.actors.length+campaign.armies.length)actors.splice(0,actors.length,...travelers.actors,...campaign.armies);},position(a){return a.mission==='campaign'?campaign.position(a):travelers.position(a);},get time(){return campaign.time}};
}
