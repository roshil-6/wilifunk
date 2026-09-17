import { ROCKETS, BALANCE } from './config.js?v=explore-waves-4';
export const rocketById=id=>ROCKETS.find(r=>r.id===id)||ROCKETS[0];
export function createSystems(id='pioneer') {
 const craft=rocketById(id);
 return {id,craft,shield:0,armor:craft.exploreBehavior.armor,damage:0,grace:0,phase:0,phaseUsed:false,energy:0,overdrive:0,magnetBonus:0,efficiencyBonus:1};
}
export function tickSystems(s,dt){s.shield=Math.max(0,s.shield-dt);s.grace=Math.max(0,s.grace-dt);s.phase=Math.max(0,s.phase-dt);s.overdrive=Math.max(0,s.overdrive-dt);}
export function takeImpact(s,penetration,major=false){
 if(s.shield>0)return 'shielded';
 if(s.phase>0||s.grace>0)return 'protected';
 if(!major&&penetration<=BALANCE.lightPenetration&&s.armor>0){s.armor--;s.damage++;s.grace=BALANCE.damageGrace;return 'damaged';}
 return 'fatal';
}
export function activateSystem(s){
 if(s.craft.ability==='PHASE'&&!s.phaseUsed){s.phaseUsed=true;s.phase=BALANCE.phaseSeconds;return true;}
 if(s.craft.ability==='OVERDRIVE'&&s.energy>=100){s.energy=0;s.overdrive=BALANCE.overdriveSeconds;return true;}
 return false;
}
export function attractCoin(item,ship,s,dt){
 if(item.type!=='coin')return;
 const radius=s.craft.exploreBehavior.magnet+s.magnetBonus,dx=ship.x-item.x,dy=ship.y-item.y,d=Math.hypot(dx,dy);
 if(d<radius&&d>1){const strength=(1-d/radius)*6+1;item.x+=dx*strength*dt;item.y+=dy*strength*dt;}
}
