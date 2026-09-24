import {createActors} from './actors.js';
import {createCampaign} from './campaign.js';
export function createSimulation(world,onEvent=()=>{}){
 const travelers=createActors(world,onEvent,{travelersOnly:true});
 const campaign=createCampaign(world,onEvent);
 return{campaign,actors:[...travelers.actors,...campaign.armies],advance(ms){travelers.advance(ms);campaign.advance(ms);},position(a){return a.mission==='campaign'?campaign.position(a):travelers.position(a);},get time(){return campaign.time}};
}
