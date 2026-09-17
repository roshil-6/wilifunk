import {BALANCE,REGIONS,EVENTS} from './config.js?v=four-games-1';
export function regionIndex(distance){return Math.max(0,REGIONS.findLastIndex(r=>distance>=r.at));}
export function pacing(time){const t=time%BALANCE.cycleSeconds;return t<10?'calm':t<23?'challenge':t<32?'route':t<46?'event':t<57?'recovery':'challenge';}
export function expedition(){return {safeGap:195,wave:0,time:0,cycle:-1,phase:'calm',event:null,eventAnnounced:false,warning:0,routeMade:false,signal:null,discoveryMade:false,nextUpgrade:5000,upgrades:[],eventSurvived:false};}
export function eventFor(region,cycle){const names=REGIONS[region].events;return names[cycle%names.length];}
export function nearMiss(run,systems){run.combo=run.comboTime>0?Math.min(BALANCE.nearMax,run.combo+1):1;run.comboTime=BALANCE.nearWindow;const points=BALANCE.nearPoints*run.combo*(systems.overdrive>0?2:1);run.near++;run.score+=points;if(systems.craft.ability==='OVERDRIVE')systems.energy=Math.min(100,systems.energy+BALANCE.overdriveCharge);return points;}
export function decayCombo(run,dt){run.comboTime=Math.max(0,run.comboTime-dt);if(run.comboTime===0&&run.combo>1){run.combo--;run.comboTime=1.2;}}
