import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function fixture(){
 const elements=new Map(),storage=new Map();
 const gradient={addColorStop(){}};
 const context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>o[k]||(()=>{})});
 const element=()=>({style:{},hidden:false,innerHTML:'',textContent:'',className:'',classList:{add(){},remove(){}},addEventListener(){},getContext:()=>context,getBoundingClientRect:()=>({width:390,height:780,left:0,top:0}),setPointerCapture(){}});
 const scope={setTimeout(){},clearTimeout(){},console,Math,Date,Set,Array,JSON,Number,String,Infinity,performance:{now:()=>0},requestAnimationFrame(){},matchMedia:()=>({matches:false}),localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},navigator:{},document:{getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,querySelector:()=>null,addEventListener(){}},window:{devicePixelRatio:1,addEventListener(){}}};
 vm.createContext(scope);
 const flight=fs.readFileSync('www/flight.js','utf8').replace(/^import [^\n]*\n/gm,'').replaceAll('export ','').replace('const WIDTH = 390, HEIGHT = 780;','const W = 390, H = 780;').replaceAll('WIDTH','W').replaceAll('HEIGHT','H');
 const game=fs.readFileSync('www/game.js','utf8').replaceAll('export ','').trimStart().replace(/^import [^\n]*\n/gm,'');
 const config=fs.readFileSync('www/config.js','utf8').replaceAll('export ','');
 const systems=fs.readFileSync('www/rocket-systems.js','utf8').replace(/^import [^\n]*\n/gm,'').replaceAll('export ','');
 const ui=fs.readFileSync('www/progression-ui.js','utf8').replace(/^import [^\n]*\n/gm,'').replaceAll('export ','');
 const expeditionCode=fs.readFileSync('www/expedition.js','utf8').replace(/^import [^\n]*\n/gm,'').replaceAll('export ','');
 const progression=fs.readFileSync('www/progression.js','utf8').replace(/^import [^\n]*\n/gm,'').replaceAll('export ','');
 const tap=fs.readFileSync('www/tap-flight.js','utf8').replace(/^import [^\n]*\n/gm,'').replaceAll('export ','');
 const renderer=fs.readFileSync('www/tap-renderer.js','utf8').replaceAll('export ','');
 const salvage=fs.readFileSync('www/salvage.js','utf8').replaceAll('export ','');
 const blast=fs.readFileSync('www/block-blast.js','utf8').replaceAll('export ','');
 vm.runInContext(blast+'\n'+salvage+'\n'+config+'\n'+systems+'\n'+ui+'\n'+expeditionCode+'\n'+progression+'\n'+flight+'\n'+tap+'\n'+renderer+'\n'+game,scope);
 return code=>vm.runInContext(code,scope);
}
 test('launch remains cinematic for 1.35 seconds and initializes a clean run',()=>{const e=fixture();e('start();update(1);');assert.equal(e('state'),'launch');e('update(.36)');assert.equal(e('state'),'playing');assert.equal(e('ship.y'),602);assert.equal(e('run.saved'),false);});
 test('pause freezes flight; resume clears held input',()=>{const e=fixture();e('start();begin();input.axis=1;pause()');const d=e('run.distance');assert.equal(e('state'),'paused');e('resume()');assert.equal(e('run.distance'),d);assert.equal(e('input.axis'),0);});
 test('fuel exhaustion gives a summary and saves a run only once',()=>{const e=fixture();e('start();begin();run.coins=7;run.fuel=.001;update(.02)');assert.equal(e('state'),'ended');assert.equal(e('wallet'),7);e('finish();finish()');assert.equal(e('wallet'),7);assert.equal(e('records.length'),1);});
 test('actual collision triggers delayed crash and preserves wreck',()=>{const e=fixture();e('start();begin();obstacles.take({x:195,y:602,r:25,speed:0,vx:0,angle:0,spin:0,closest:Infinity});update(.016)');assert.equal(e('state'),'crashing');assert.equal(e('page'),'flight');for(let i=0;i<110;i++)e('update(.016)');assert.equal(e('state'),'crashed');assert(e('ship.y')<300);assert.equal(e('records.length'),1);});
 test('near miss scores once after passing, never on collision',()=>{const e=fixture();e('start();begin();obstacles.take({x:235,y:570,r:25,speed:150,vx:0,angle:0,spin:0,closest:Infinity,passed:false});');for(let i=0;i<50;i++)e('update(.016)');assert.equal(e('run.near'),1);assert.equal(e('run.score'),6);});
 test('star shield blocks collision and three missions award once',()=>{const e=fixture();e('start();begin();run.stars=2;pickups.take({x:195,y:602,type:"star"});update(.016)');assert(e('run.shield')>0);e('obstacles.take({x:195,y:602,r:25,speed:0,vx:0,angle:0,spin:0,closest:Infinity});update(.016)');assert.equal(e('state'),'playing');e('run.stars=5;run.near=3;run.distance=1001;update(.016);update(.016)');assert.equal(e('run.reward'),95);});
 test('all environment hazards enter above the viewport with at least 2 seconds anticipation',()=>{const e=fixture();for(let z=0;z<5;z++){e(`zone=${z};obstacles.clear();spawn()`);assert(e('obstacles.items.filter(o=>o.active).every(o=>(ship.y-o.y-o.r)/o.speed>2)'));}});
 test('all screens render and bounded pools survive repeated restarts',()=>{const e=fixture();for(const page of ['home','settings','controls','rockets','leaderboard']){e(`show('${page}');draw()`);assert(e('screen.innerHTML.length')>100);}for(let i=0;i<20;i++)e('start();begin();spawn();draw();crash();finish()');assert.equal(e('obstacles.items.length'),60);assert.equal(e('particles.items.length'),160);});

test('Tap and Explore scores stay isolated while coins share the same wallet',()=>{
 const e=fixture();
 e('start();begin();run.score=12;run.distance=700;run.coins=4;finish();activeMode="tap";start();tapFlight.score=28;tapFlight.coins=7;tapFlight.stars=2;finish();finish()');
 assert.equal(e('best'),12);assert.equal(e('records.length'),1);assert.equal(e('records[0].distance'),700);
 assert.equal(e('tapBest'),28);assert.equal(e('tapRecords.length'),1);assert.equal(e('wallet'),211); // 11 collected coins + two one-time 100-coin milestones
 assert.equal(e('read("spaceRocketHighScore",0)'),12);assert.equal(e('read("spacehullTapBestScore",0)'),28);
 e('activeMode="explore";start();begin();run.score=40;run.distance=900;finish()');
 assert.equal(e('tapBest'),28);assert.equal(e('tapRecords.length'),1);assert.equal(e('records.length'),2);
});
test('Tap pause and resume keep its own state and HUD; retry has no tutorial or Explore launch',()=>{
 const e=fixture();e('activeMode="tap";start();tapThrust();pause()');assert.equal(e('state'),'paused');
 e('resume()');assert.equal(e('state'),'tap');assert.equal(e('$("hud").hidden'),true);assert.equal(e('$("tapHud").hidden'),false);
 e('tapFlight.score=8;finish();state="tapover";show("tap-result");start()');
 assert.equal(e('state'),'tapready');assert.equal(e('tapFlight.score'),0);assert.equal(e('screen.innerHTML'),'');
});
test('Tap results and score leaderboard never show Explore fuel, distance or near misses',()=>{
 const e=fixture();e('activeMode="tap";start();tapFlight.score=5;finish();state="tapover";show("tap-result");draw()');
 assert(e('screen.innerHTML.includes("Obstacles Passed")'));assert(!e('/Distance|Near Misses|Fuel/.test(screen.innerHTML)'));
 e('boardMode="tap";show("leaderboard");draw()');assert(e('screen.innerHTML.includes("TAP & FUN LEADERBOARD")'));assert(e('screen.innerHTML.includes("<th>SCORE</th>")'));
 e('boardMode="explore";show("leaderboard")');assert(e('screen.innerHTML.includes("<th>DISTANCE</th>")'));
});

test('ending a paused Tap journey freezes the model behind its final summary',()=>{
 const e=fixture();e('activeMode="tap";start();tapThrust();tapFlight.score=3;pause();endJourney()');
 const y=e('tapFlight.ship.y'), travel=e('tapFlight.travel');
 e('update(1);update(1);draw()');
 assert.equal(e('tapFlight.status'),'over');assert.equal(e('state'),'tapover');
 assert.equal(e('tapFlight.ship.y'),y);assert.equal(e('tapFlight.travel'),travel);assert.equal(e('tapFlight.score'),3);
 assert.equal(e('tapRecords.length'),1);
});


test('locked trial is safe and cannot persist scores, coins, equipment or milestones',()=>{const e=fixture();const coins=e('wallet');e('preview=1;handleMetaAction("try-rocket");begin();run.coins=1000;run.score=100;run.distance=20000;finish()');assert.equal(e('wallet'),coins);assert.equal(e('records.length'),0);assert.equal(e('progress.data.equippedRocket'),'pioneer');e('endTrial()');assert.equal(e('selected'),'pioneer');assert.equal(e('page'),'rockets');});
test('all functional progression screens render from real saved data',()=>{const e=fixture();for(const page of ['rockets','rocket-list','space-map','missions','cosmetics','milestone']){e(`show('${page}');draw()`);assert(e('screen.innerHTML.length')>80);}e('missionTab="weekly";show("missions")');assert(!e('screen.innerHTML.includes("Scan a derelict")'));});
test('near-miss chains cap at five and decay; Comet charges a timed vulnerable boost',()=>{const e=fixture();e('start();begin();systems=createSystems("comet");for(let i=0;i<10;i++)nearMiss(run,systems)');assert.equal(e('run.combo'),5);assert.equal(e('systems.energy'),100);e('activateSystem(systems)');assert.equal(e('systems.overdrive'),5);assert.equal(e('takeImpact(systems,100,true)'),'fatal');e('decayCombo(run,5)');assert(e('run.combo')<5);});
test('event cycle keeps recovery and replaces scanning with challenge',()=>{const e=fixture();e('start();begin();exp.time=46;exp.phase="event";exp.cycle=0;exp.event="meteor";updateExpedition(.01)');assert.equal(e('exp.phase'),'recovery');assert.equal(e('progress.data.totals.storms'),1);e('exp.time=58;updateExpedition(.03)');assert.equal(e('exp.phase'),'challenge');assert.equal(e('exp.signal'),null);assert.equal(e('run.discoveries'),0);});
test('Odyssey upgrades are a real single choice and expire on restart',()=>{const e=fixture();e('selected="odyssey";start();begin();run.distance=5001;updateExpedition(.016)');assert.equal(e('state'),'upgrade');e('handleMetaAction("upgrade-armor")');assert.equal(e('systems.armor'),3);assert.equal(e('state'),'playing');e('start();begin()');assert.equal(e('systems.armor'),2);});
test('Classic filters unknown legacy craft and assisted flights',()=>{const e=fixture();e('records=[{distance:300,score:30,rocket:"pioneer",assisted:false},{distance:900,score:90,rocket:"ranger"},{distance:800,score:80,rocket:"pioneer",assisted:true}];boardClass="classic";show("leaderboard")');assert(e('screen.innerHTML.includes("300 m")'));assert(!e('screen.innerHTML.includes("900 m")'));assert(!e('screen.innerHTML.includes("800 m")'));});
test('verified rescue marks records assisted and banks only newly earned coins',async()=>{const e=fixture();e('start();begin();run.coins=5;run.score=2;crash();state="crashed";show("crashed");configureServices({rewardedAds:{showRewarded:async()=>true}})');await e('requestReward("rescue")');assert.equal(e('run.assisted'),true);assert.equal(e('state'),'playing');e('run.coins=7;run.score=4;finish()');assert.equal(e('wallet'),7);assert.equal(e('records.length'),1);assert.equal(e('records[0].assisted'),true);assert.equal(e('records[0].score'),4);});

test('rocket paint and identity persist independently for both flight modes',()=>{
 const e=fixture();e('unlocked.push("ranger");selected="pioneer";progress.data.rocketPaints.pioneer="arctic";persistProfile();');
 const scout=e('shipPaint()');e('selected="ranger";persistProfile();start();begin()');
 assert.notEqual(e('shipPaint()'),scout);assert.equal(e('systems.id'),'ranger');assert.equal(e('$("flightCraft").textContent'),'RANGER');
 assert.equal(e('progress.data.equippedRocket'),'ranger');e('activeMode="tap";start()');assert.equal(e('tapFlight.systems.id'),'ranger');assert.equal(e('shipPaint()'),e('rocketById("ranger").fin'));
});
test('direct trial exit restores equipped rocket without saving the trial craft',()=>{
 const e=fixture();e('preview=1;handleMetaAction("try-rocket");show("home");persistProfile()');assert.equal(e('selected'),'pioneer');assert.equal(e('trial'),null);assert.equal(e('progress.data.equippedRocket'),'pioneer');
});
test('a protected physical contact cannot award a near miss',()=>{
 const e=fixture();e('selected="phantom";start();begin();systems.phase=2;obstacles.take({x:222,y:570,r:25,speed:150,vx:0,angle:0,spin:0,closest:Infinity,passed:false});');for(let i=0;i<50;i++)e('update(.016)');assert.equal(e('run.near'),0);assert.equal(e('state'),'playing');
});
test('coin target includes unbanked earnings once and hides in menus',()=>{
 const e=fixture();e('wallet=750;start();begin();run.coins=25;updateFlightReadout()');assert(e('$("nextMilestone").textContent.includes("225 MORE")'));assert.equal(e('$("journeyFill").style.width'),'77.5%');e('pause()');assert.equal(e('$("flightProgress").hidden'),true);e('resume()');assert.equal(e('$("flightProgress").hidden'),false);e('finish();updateFlightReadout()');assert(e('$("nextMilestone").textContent.includes("225 MORE")'));
});
test('trial missions never announce or accrue spendable rewards',()=>{const e=fixture();e('preview=1;handleMetaAction("try-rocket");begin();run.stars=5;run.near=3;run.distance=1001;update(.016)');assert.equal(e('run.reward'),0);assert(!e('$("toast").textContent.includes("MISSION COMPLETE")'));});
test('rocket unlock target skips owned craft and displays requirements honestly',()=>{const e=fixture();e('wallet=1200;unlocked.push("ranger");activeMode="tap";start();updateFlightReadout()');assert(e('$("flightRegion").textContent.includes("ATLAS")'));assert(e('$("nextMilestone").textContent.includes("1,800 MORE")'));});

test('mine collision follows the normal delayed crash and saves collected coins once',()=>{const e=fixture();e('start();begin();run.coins=9;pickups.take({x:195,y:602,type:"bomb"});update(.016)');assert.equal(e('state'),'crashing');assert.equal(e('wallet'),9);assert.equal(e('records[0].coins'),9);for(let i=0;i<110;i++)e('update(.016)');assert.equal(e('state'),'crashed');assert(e('screen.innerHTML.includes("TRY AGAIN")'));e('finish()');assert.equal(e('wallet'),9);});
test('mine consumes a shield without ending the flight',()=>{const e=fixture();e('start();begin();run.shield=3;pickups.take({x:195,y:602,type:"bomb"});update(.016)');assert.equal(e('state'),'playing');assert.equal(e('run.shield'),0);});
test('Tap always renders scores after viewing Explore coin rankings',()=>{const e=fixture();e('boardMetric="coins";boardMode="tap";tapRecords=[{score:42,coins:7,rocket:"pioneer"}];showLeaderboard()');assert(e('screen.innerHTML.includes("<td>42</td>")'));assert(!e('screen.innerHTML.includes("<td>7</td>")'));});
test('Odyssey Tap upgrade changes Tap systems and resumes its own mode',()=>{const e=fixture();e('selected="odyssey";activeMode="tap";start();tapThrust();show("upgrade");handleMetaAction("upgrade-armor")');assert.equal(e('state'),'tap');assert.equal(e('tapFlight.systems.armor'),3);assert.equal(e('$("tapHud").hidden'),false);});
test('crossing a region boundary does not teleport the visible planet',()=>{const e=fixture();e('start();begin();var planetPositions=[];ctx.drawImage=(image,...coords)=>{if(image===planet)planetPositions.push(coords)};run.distance=1999;zone=0;draw();run.distance=2001;zone=1;draw()');assert.equal(e('planetPositions[0][0]'),e('planetPositions[1][0]'));assert(Math.abs(e('planetPositions[0][1]-planetPositions[1][1]'))<1);});
test('denser Explore waves keep a coin-marked navigation opening',()=>{const e=fixture();e('start();begin();exp.phase="challenge";spawn()');assert(e('obstacles.items.filter(o=>o.active).length')>=4);assert(e('obstacles.items.filter(o=>o.active).every(o=>Math.abs(o.x-exp.safeGap)>o.r+40)'));assert.equal(e('pickups.items.filter(p=>p.active&&p.type==="coin").length'),3);});
test('Explore region entry accelerates smoothly without a sudden speed jump',()=>{const e=fixture();e('start();begin();run.distance=1999;run.speed=150;obstacles.clear();pickups.clear();spawnClock=10;pickupClock=10;update(.016);update(.016)');assert(e('run.speed')>=150);assert(e('run.speed')<150.1);});


test('Explore waves cover both sides without stacking rocks or leaving an edge corridor',()=>{
 const e=fixture();e('start();begin();exp.phase="challenge";zone=1');
 let previous=195;const gaps=[];
 for(let i=0;i<40;i++){
  e('obstacles.clear();pickups.clear();spawn()');const gap=e('exp.safeGap');gaps.push(gap);
  assert(gap>=150&&gap<=240);assert(Math.abs(gap-previous)<40);previous=gap;
  assert(e('obstacles.items.some(o=>o.active&&o.x<exp.safeGap)'));
  assert(e('obstacles.items.some(o=>o.active&&o.x>exp.safeGap)'));
  assert(e('obstacles.items.filter(o=>o.active).every(o=>o.x-o.r>=0&&o.x+o.r<=W&&Math.abs(o.x-exp.safeGap)>o.r+40)'));
  assert(e('obstacles.items.filter(o=>o.active).every((a,i,all)=>all.slice(i+1).every(b=>Math.hypot(a.x-b.x,a.y-b.y)>a.r+b.r))'));
 }
 assert(Math.max(...gaps)-Math.min(...gaps)>80);
});
test('Explore mineral route does not add a separate one-sided obstacle wall',()=>{
 const e=fixture();e('start();begin();obstacles.clear();pickups.clear();exp.time=24;exp.safeGap=180;updateExpedition(.01)');
 assert.equal(e('exp.phase'),'route');assert.equal(e('obstacles.items.filter(o=>o.active).length'),0);
 assert(e('pickups.items.some(p=>p.active&&p.type==="star"&&p.x===180)'));
});
