import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function fixture(){
 const elements=new Map(),storage=new Map();
 const gradient={addColorStop(){}};
 const context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>o[k]||(()=>{})});
 const element=()=>({style:{},hidden:false,innerHTML:'',textContent:'',className:'',classList:{add(){},remove(){}},addEventListener(){},getContext:()=>context,getBoundingClientRect:()=>({width:390,height:780,left:0,top:0}),setPointerCapture(){}});
 const scope={console,Math,Date,Set,Array,JSON,Number,String,Infinity,performance:{now:()=>0},requestAnimationFrame(){},matchMedia:()=>({matches:false}),localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},navigator:{},document:{getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,querySelector:()=>null,addEventListener(){}},window:{devicePixelRatio:1,addEventListener(){}}};
 vm.createContext(scope);
 const flight=fs.readFileSync('www/flight.js','utf8').replaceAll('export ','').replace('const WIDTH = 390, HEIGHT = 780;','const W = 390, H = 780;').replaceAll('WIDTH','W').replaceAll('HEIGHT','H');
 const game=fs.readFileSync('www/game.js','utf8').trimStart().replace(/^import [^\n]*\n/gm,'');
 const tap=fs.readFileSync('www/tap-flight.js','utf8').replace(/^import [^\n]*\n/gm,'').replaceAll('export ','');
 const renderer=fs.readFileSync('www/tap-renderer.js','utf8').replaceAll('export ','');
 vm.runInContext(flight+'\n'+tap+'\n'+renderer+'\n'+game,scope);
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
 assert.equal(e('tapBest'),28);assert.equal(e('tapRecords.length'),1);assert.equal(e('wallet'),11);
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


