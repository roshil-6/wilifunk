import {BlastPuzzle,BLAST} from './block-blast.js?v=four-games-1';
import {SalvagePuzzle,SALVAGE,SALVAGE_MILESTONES} from './salvage.js?v=four-games-1';
import { EXPLORE_MILESTONES, TAP_MILESTONES, MISSIONS, ROCKETS, COSMETICS, STORE_ITEMS } from './config.js?v=four-games-1';
const finite=n=>Number.isFinite(Number(n))?Math.max(0,Number(n)):0;
const array=v=>Array.isArray(v)?v:[];
export class ProgressStore {
 constructor(storage,now=()=>Date.now()){
  this.storage=storage;this.now=now;this.error=false;
  const read=(key,fallback)=>{try{const value=storage.getItem(key);return value===null?fallback:JSON.parse(value);}catch{return fallback;}};
  const raw=read('spacehullProfile',null)||read('spacehullProfileBackup',null);
  const explore=array(read('spacerootRecords',[])),tap=array(read('spacehullTapRecords',[]));
  let equipped='pioneer';try{equipped=storage.getItem('wilifunkSelectedRocket')||equipped;}catch{}
  this.data={blastRun:null,blastBestScore:0,blastWins:0,blastTutorial:false,salvageCharges:2,salvageBestScore:0,salvageSuccessfulRuns:0,salvageMilestones:[],salvageComponentsEarned:[],salvageCosmeticsEarned:[],salvageRun:null,salvageTutorial:false,version:2,coins:finite(read('wilifunkCoins',0)),ownedRockets:array(read('wilifunkUnlockedRockets',['pioneer'])),equippedRocket:equipped,exploreBestDistance:Math.max(0,...explore.map(r=>finite(r.distance))),exploreBestScore:finite(read('spaceRocketHighScore',0)),tapBestScore:finite(read('spacehullTapBestScore',0)),exploreRecords:explore,tapRecords:tap,cosmetics:[],equippedPaint:'',equippedTrail:'',achievements:array(read('spaceRocketBadges',[])),components:[],discoveries:[],exploreMilestones:[],tapMilestones:[],missionProgress:{},missionClaims:[],totals:{tapStars:finite(read('spacehullTapTotalStars',0))},settings:read('spacerootSettings',{}),profile:{name:'You'},inventory:{},...raw};
  for(const key of ['ownedRockets','cosmetics','achievements','components','discoveries','exploreMilestones','tapMilestones','missionClaims','salvageMilestones','salvageComponentsEarned','salvageCosmeticsEarned'])this.data[key]=array(this.data[key]);
  for(const key of ['salvageCharges','salvageBestScore','salvageSuccessfulRuns','coins','exploreBestDistance','exploreBestScore','tapBestScore'])this.data[key]=finite(this.data[key]);
  this.data.salvageCharges=Math.min(3,Math.floor(this.data.salvageCharges));
  this.data.missionProgress=this.data.missionProgress&&typeof this.data.missionProgress==='object'?this.data.missionProgress:{};
  this.data.totals=this.data.totals&&typeof this.data.totals==='object'?this.data.totals:{};
  this.data.exploreRecords=array(this.data.exploreRecords).filter(r=>r&&Number.isFinite(r.distance)&&Number.isFinite(r.score));
  this.data.tapRecords=array(this.data.tapRecords).filter(r=>r&&Number.isFinite(r.score));
  if(!this.data.ownedRockets.includes('pioneer'))this.data.ownedRockets.push('pioneer');
  if(!ROCKETS.some(r=>r.id===this.data.equippedRocket)||!this.data.ownedRockets.includes(this.data.equippedRocket))this.data.equippedRocket='pioneer';
  this.data.rocketPaints=this.data.rocketPaints&&typeof this.data.rocketPaints==='object'?this.data.rocketPaints:{};
  if(this.data.equippedPaint&&!this.data.rocketPaints[this.data.equippedRocket])this.data.rocketPaints[this.data.equippedRocket]=this.data.equippedPaint;
  this.data.equippedPaint='';
  this.commit();
 }
 commit(){try{const old=this.storage.getItem('spacehullProfile');if(old)this.storage.setItem('spacehullProfileBackup',old);this.storage.setItem('spacehullProfile',JSON.stringify(this.data));return true;}catch{this.error=true;return false;}}
 period(period){return Math.floor(this.now()/(86400000*(period==='weekly'?7:1)));}
 missionKey(m){return `${m.id}:${this.period(m.period)}`;}
 metric(key,amount=1,max=false){
  this.data.totals[key]=max?Math.max(finite(this.data.totals[key]),amount):finite(this.data.totals[key])+amount;
  for(const m of MISSIONS.filter(m=>m.metric===key)){const id=this.missionKey(m);this.data.missionProgress[id]=max?Math.max(finite(this.data.missionProgress[id]),amount):finite(this.data.missionProgress[id])+amount;}
 }
 claimMission(id){const m=MISSIONS.find(m=>m.id===id);if(!m)return false;const key=this.missionKey(m);if(this.data.missionClaims.includes(key)||finite(this.data.missionProgress[key])<m.target)return false;this.data.coins+=m.reward;this.data.missionClaims.push(key);this.data.salvageCharges=Math.min(3,(this.data.salvageCharges||0)+1);this.commit();return true;}
 advance(mode,value){
  const list=mode==='explore'?EXPLORE_MILESTONES:TAP_MILESTONES,key=mode==='explore'?'exploreMilestones':'tapMilestones';
  const rewards=[];
  for(const m of list){if(value<m.at||this.data[key].includes(m.id))continue;this.data[key].push(m.id);rewards.push(m);this.data.salvageCharges=Math.min(3,(this.data.salvageCharges||0)+1);
   if(m.type==='coins')this.data.coins+=m.value;
   if(['trail','paint'].includes(m.type)&&!this.data.cosmetics.includes(m.value))this.data.cosmetics.push(m.value);
   if(m.type==='badge'&&!this.data.achievements.includes(m.value))this.data.achievements.push(m.value);
   if(m.type==='component'&&!this.data.components.includes(m.value))this.data.components.push(m.value);
  }
  if(mode==='tap'&&value>=500&&!this.data.cosmetics.includes('tap-nebula'))this.data.cosmetics.push('tap-nebula');if(rewards.length)this.commit();return rewards;
 }
 salvageTransaction(change){
  // Re-read before economy mutations so a second open tab cannot claim the same run.
  try{const fresh=JSON.parse(this.storage.getItem('spacehullProfile'));if(fresh)this.data=fresh;}catch{}
  const before=JSON.stringify(this.data);const result=change(this.data);
  if(result===false||!this.commit()){this.data=JSON.parse(before);return false;}return result;
 }
 startSalvage(){return this.salvageTransaction(d=>{if(d.salvageRun&&!d.salvageRun.claimed)return d.salvageRun.puzzle;if(!(d.salvageCharges>0))return false;d.salvageCharges--;d.salvageRun={id:`salvage-${this.now()}-${Math.random().toString(36).slice(2)}`,claimed:false,recovered:false,doubled:false,puzzle:new SalvagePuzzle().snapshot()};return d.salvageRun.puzzle;});}
 saveSalvage(puzzle,id){return this.salvageTransaction(d=>{if(!d.salvageRun||d.salvageRun.id!==id||d.salvageRun.claimed||puzzle.moves<d.salvageRun.puzzle.moves)return false;d.salvageRun.puzzle=puzzle;d.salvageBestScore=Math.max(d.salvageBestScore||0,puzzle.score);return true;});}
 restartSalvage(){return this.salvageTransaction(d=>{if(!(d.salvageCharges>0))return false;d.salvageRun=null;return true;});}
 salvageCoins(score){return score>=SALVAGE.target?SALVAGE.baseCoins+(score>=SALVAGE.bonusAt?SALVAGE.bonusCoins:0):Math.min(120,Math.floor(score/20));}
 claimSalvage(id){return this.salvageTransaction(d=>{const r=d.salvageRun;if(!r||r.id!==id||r.claimed)return false;const score=r.puzzle.score;if(score<SALVAGE.target&&r.puzzle.status!=='over')return false;
  r.claimed=true;r.coins=this.salvageCoins(score);d.coins+=r.coins;const rewards=[`+${r.coins} COINS`];d.salvageBestScore=Math.max(d.salvageBestScore||0,score);
  const grant=(kind,value)=>{if(kind==='coins'){d.coins+=value;rewards.push(`+${value} MILESTONE COINS`);return;}const key=kind==='component'?'components':'cosmetics',earned=kind==='component'?'salvageComponentsEarned':'salvageCosmeticsEarned';if(!d[key].includes(value)){d[key].push(value);d[earned].push(value);rewards.push(value.replaceAll('_',' ').toUpperCase());}};
  if(score>=SALVAGE.target){d.salvageSuccessfulRuns++;for(const [at,kind,value] of SALVAGE_MILESTONES){if(d.salvageSuccessfulRuns>=at&&!d.salvageMilestones.includes(at)){d.salvageMilestones.push(at);grant(kind,value);}}
   if(score>=SALVAGE.rareAt){const component=['engine_core','phase_module','navigation_core'].find(c=>!d.components.includes(c));if(component)grant('component',component);}
  }r.receipt=rewards.join(' · ');return r.receipt;});}
 recoverSalvage(id){return this.salvageTransaction(d=>{const r=d.salvageRun;if(!r||r.id!==id||r.claimed||r.recovered||r.puzzle.status!=='over')return false;const p=new SalvagePuzzle(Math.random,r.puzzle);p.status='playing';p.generate();if(p.status!=='playing')return false;r.recovered=true;r.puzzle=p.snapshot();return true;});}
 doubleSalvage(id){return this.salvageTransaction(d=>{const r=d.salvageRun;if(!r||r.id!==id||!r.claimed||r.doubled||r.puzzle.score<SALVAGE.target)return false;r.doubled=true;d.coins+=r.coins;r.receipt+=` · +${r.coins} BONUS COINS`;return true;});}

 startBlast(){return this.salvageTransaction(d=>{if(d.blastRun&&!d.blastRun.claimed)return d.blastRun.puzzle;if(!(d.salvageCharges>0))return false;d.salvageCharges--;d.blastRun={id:`blast-${this.now()}-${Math.random().toString(36).slice(2)}`,claimed:false,puzzle:new BlastPuzzle().snapshot()};return d.blastRun.puzzle;});}
 saveBlast(puzzle,id){return this.salvageTransaction(d=>{const r=d.blastRun;if(!r||r.id!==id||r.claimed||puzzle.turns<=r.puzzle.turns)return false;r.puzzle=puzzle;d.blastBestScore=Math.max(d.blastBestScore||0,puzzle.score);return true;});}
 blastCoins(score){return score>=BLAST.target?BLAST.coins+(score>=BLAST.bonusTarget?BLAST.bonusCoins:0):0;}
 claimBlast(id){return this.salvageTransaction(d=>{const r=d.blastRun;if(!r||r.id!==id||r.claimed||(r.puzzle.status!=='over'&&r.puzzle.score<BLAST.target))return false;r.claimed=true;const coins=this.blastCoins(r.puzzle.score);d.coins+=coins;r.receipt=`+${coins} COINS FOR SPACEHULL`;if(coins){d.blastWins=(d.blastWins||0)+1;if(d.blastWins>=5&&!d.cosmetics.includes('blast-copper')){d.cosmetics.push('blast-copper');r.receipt+=' · COPPER ROCKET PAINT';}}return r.receipt;});}

 requirements(craft){const r=craft.requirements;return [
  ...(r.distance?[{label:`Reach ${(r.distance/1000).toLocaleString()} km`,done:this.data.exploreBestDistance>=r.distance,progress:`${(this.data.exploreBestDistance/1000).toFixed(1)} / ${r.distance/1000} km`}]:[]),
  ...(r.discoveries?[{label:`Complete ${r.discoveries} discoveries`,done:this.data.discoveries.filter(d=>d.deep).length>=r.discoveries,progress:`${this.data.discoveries.filter(d=>d.deep).length} / ${r.discoveries}`}]:[]),
  ...(r.components||[]).map(id=>({label:id.replaceAll('_',' '),done:this.data.components.includes(id)}))];
 }
 purchase(id){const r=ROCKETS.find(r=>r.id===id);if(!r||this.data.ownedRockets.includes(id))return false;if(this.data.coins<r.price||this.requirements(r).some(v=>!v.done))return false;this.data.coins-=r.price;this.data.ownedRockets.push(id);this.commit();return true;}
 cosmetic(id){const c=COSMETICS.find(c=>c.id===id);if(!c)return false;if(!this.data.cosmetics.includes(id)){if(!c.price||this.data.coins<c.price)return false;this.data.coins-=c.price;this.data.cosmetics.push(id);}if(c.kind==='paint')this.data.rocketPaints[this.data.equippedRocket]=id;else this.data[c.kind==='background'?'equippedBackground':'equippedTrail']=id;this.commit();return true;}
 discover(id,label,component,deep=false){if(this.data.discoveries.some(d=>d.id===id))return false;this.data.discoveries.push({id,label,deep,date:this.now()});this.data.coins+=150;this.metric('scans');if(component&&!this.data.components.includes(component))this.data.components.push(component);this.commit();return true;}
 buyItem(id){const item=STORE_ITEMS.find(i=>i.id===id);if(!item)return false;const owned=finite(this.data.inventory[id]||0);if(owned>=item.max||this.data.coins<item.cost)return false;this.data.coins-=item.cost;this.data.inventory[id]=owned+1;this.commit();return true;}
 useItem(id){const owned=finite(this.data.inventory[id]||0);if(owned<=0)return false;this.data.inventory[id]=owned-1;this.commit();return true;}
 addItem(id){const item=STORE_ITEMS.find(i=>i.id===id);if(!item)return false;const owned=finite(this.data.inventory[id]||0);if(owned>=item.max)return false;this.data.inventory[id]=owned+1;this.commit();return true;}
 itemCount(id){return finite(this.data.inventory[id]||0);}
}
// Local-only balancing event buffer. No network or personal profiling.
export class Analytics {
 constructor(){this.events=[];}
 track(name,data={}){this.events.push({name,...data});if(this.events.length>200)this.events.shift();}
}
// Real adapters must resolve true only after a verified provider reward callback.
export class RewardedAds {
 constructor(adapter=null){this.adapter=adapter;this.busy=false;this.claimed=new Set();}
 get available(){return Boolean(this.adapter?.showRewarded);}
 async request(key,placement){if(!this.available||this.busy||this.claimed.has(key))return false;this.busy=true;try{const earned=await this.adapter.showRewarded({placement});if(earned===true){this.claimed.add(key);return true;}return false;}catch{return false;}finally{this.busy=false;}}
}
