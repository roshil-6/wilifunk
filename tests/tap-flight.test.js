import test from 'node:test';
import assert from 'node:assert/strict';
import { TapFlight, TAP, tapDifficulty } from '../www/tap-flight.js';

test('Tap starts ready; tap rises smoothly, release falls, x stays fixed', () => {
  const f = new TapFlight(() => .5), y = f.ship.y;
  f.step(1); assert.equal(f.ship.y, y);
  f.tap(); f.step(.016); assert(f.ship.y < y && f.ship.y > y - 4);
  for (let i = 0; i < 40; i++) f.step(.016);
  assert(f.ship.vy > 0); assert.equal(f.ship.x, 111);
  assert.equal('fuel' in f, false);
});
test('repeated taps cannot stack into violent velocity', () => {
  const f = new TapFlight(); for (let i = 0; i < 100; i++) f.tap();
  assert.equal(f.ship.vy, TAP.impulse);
});
test('a gap awards exactly one point after the entire rocket passes', () => {
  const f = new TapFlight(() => .5); f.tap();
  const obstacle = f.formations.items[0]; obstacle.x = 111 - 31 - 17 - 1; obstacle.center += 35;
  f.step(.016); assert.equal(f.score, 1);
  f.step(.016); assert.equal(f.score, 1);
});
test('collision stops scoring, cuts engine, delays result then reset starts clean', () => {
  const f = new TapFlight(() => .5); f.tap();
  Object.assign(f.formations.items[0], { x: 111, center: 620 });
  f.step(.016); assert.equal(f.status, 'crashing'); assert.equal(f.ship.thrust, 0); assert.equal(f.score, 0);
  for (let i = 0; i < 20; i++) f.step(.016);
  assert.equal(f.status, 'crashing');
  for (let i = 0; i < 20; i++) f.step(.016);
  assert.equal(f.status, 'over'); f.reset(); assert.equal(f.status, 'ready'); assert.equal(f.score, 0);
});
test('gaps remain reachable with gradual difficulty and generous reaction time', () => {
  const f = new TapFlight();
  for (const score of [0, 10, 25, 50, 1000]) {
    f.score = score;
    for (let i = 0; i < 100; i++) {
      const previous = f.previousGap; f.formations.clear(); const o = f.spawn(475);
      assert(Math.abs(o.center - previous) <= 85.001); assert(o.gap >= 180);
      assert(o.center - o.gap / 2 > TAP.ceiling + 18);
      assert(o.center + o.gap / 2 < TAP.floor - 18);
      assert((o.x - f.ship.x - o.width / 2) / tapDifficulty(score).speed > 2.5);
    }
  }
});
test('coins and rare stars collect independently from the obstacle score', () => {
  const f = new TapFlight(() => .8); f.tap();
  f.collectibles.take({x:111,y:378,owner:-1,offset:0,type:'coin'});
  f.collectibles.take({x:111,y:378,owner:-1,offset:0,type:'star'});
  f.step(.016); assert.equal(f.coins,1); assert.equal(f.stars,1); assert.equal(f.score,0);
  f.step(.016); assert.equal(f.coins,1); assert.equal(f.stars,1);
});
test('collectibles stay inside reachable gaps and advanced variants have bounded motion', () => {
  const variants = new Set();
  let seed=51; const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const f = new TapFlight(random); f.score=60;
  for(let i=0;i<200;i++) {
    f.formations.clear(); f.collectibles.clear(); const o=f.spawn(475); variants.add(o.variant);
    for(const item of f.collectibles.items.filter(c=>c.active)) assert(Math.abs(item.y-o.center)<o.gap/2-20);
    if(o.variant==='moving') { f.tap(); f.step(.016); assert(Math.abs(o.center-o.baseCenter)<=16); }
  }
  for(const kind of ['moving','satellite','ring','narrow','rock']) assert(variants.has(kind));
  assert.equal(f.collectibles.items.length,32); assert.equal(f.formations.items.length,8);
});
test('Ranger Tap survives a shallow scrape, but a head-on column collision is fatal',()=>{
 const f=new TapFlight(()=>.5);f.reset('ranger');f.tap();f.ship.y=270;f.formations.items[0].x=111;f.step(.016);assert.equal(f.status,'playing');assert.equal(f.systems.damage,1);assert.equal(f.systems.armor,0);
 const direct=new TapFlight(()=>.5);direct.reset('ranger');direct.tap();direct.ship.y=200;direct.formations.items[0].x=111;direct.step(.016);assert.equal(direct.status,'crashing');
});
test('accurate passes build a Perfect streak; ordinary passes break it',()=>{const f=new TapFlight(()=>.5);f.tap();f.formations.clear();for(let i=0;i<2;i++){const o=f.spawn(60);f.ship.y=o.center;f.ship.vy=0;f.step(.016);}assert.equal(f.perfects,2);assert.equal(f.perfectStreak,2);assert.equal(f.score,4);const o=f.spawn(60);f.ship.y=o.center+40;f.ship.vy=0;f.step(.016);assert.equal(f.perfectStreak,0);assert.equal(f.score,5);});
test('Tap third star activates the shared Aurora shield duration',()=>{const f=new TapFlight(()=>.5);f.reset('cosmic_pink');f.stars=2;f.tap();f.collectibles.clear();f.collectibles.take({x:f.ship.x,y:f.ship.y,owner:-1,type:'star'});f.step(.008);assert.equal(f.stars,3);assert(f.systems.shield>7.9);});
test('Tap mine consumes shield and never counts as a star or coin',()=>{const f=new TapFlight(()=>.5);f.tap();f.systems.shield=3;f.collectibles.clear();f.collectibles.take({x:f.ship.x,y:f.ship.y,owner:-1,type:'bomb'});f.step(.008);assert.equal(f.status,'playing');assert.equal(f.systems.shield,0);assert.equal(f.stars,0);assert.equal(f.coins,0);});
test('unprotected Tap mine causes the normal crash',()=>{const f=new TapFlight(()=>.5);f.tap();f.collectibles.clear();f.collectibles.take({x:f.ship.x,y:f.ship.y,owner:-1,type:'bomb'});f.step(.008);assert.equal(f.status,'crashing');});
test('Comet Perfect passes charge its shared overdrive system',()=>{const f=new TapFlight(()=>.5);f.reset('comet');f.tap();f.formations.clear();for(let i=0;i<4;i++){const o=f.spawn(60);f.ship.y=o.center;f.ship.vy=0;f.step(.016);}assert.equal(f.systems.energy,100);});
test('Magnetar attracts coins in Tap but never attracts mines',()=>{const f=new TapFlight(()=>.5);f.reset('magnetar');f.tap();f.formations.clear();f.collectibles.clear();const coin=f.collectibles.take({x:180,y:378,type:'coin',owner:-1}),mine=f.collectibles.take({x:180,y:378,type:'bomb',owner:-1});f.step(.016);assert(coin.x<mine.x);assert.equal(f.status,'playing');});
test('an opening asteroid threatens the center with more than two seconds to react',()=>{const f=new TapFlight(()=>.5);const rock=f.asteroids.items.find(r=>r.active);assert(rock);assert.equal(rock.x,475-TAP.spacing/2);assert((rock.x-f.ship.x-rock.r)/f.currentSpeed>2);assert(Math.abs(rock.y-f.ship.y)<30);assert(rock.amplitude>Math.abs(rock.baseY-378));});
test('flying asteroids drift, rotate and recycle in a bounded pool',()=>{const f=new TapFlight(()=>.5);f.spawn(475);f.tap();const rock=f.asteroids.items.find(r=>r.active),x=rock.x;f.step(.016);assert(rock.x<x);assert.notEqual(rock.angle,0);rock.x=-60;f.step(.016);assert.equal(rock.active,false);f.reset();assert.equal(f.asteroids.items.length,12);assert.equal(f.asteroids.items.filter(r=>r.active).length,1);});
test('flying asteroid direct hit crashes Scout while shield clears it',()=>{for(const shield of [0,2]){const f=new TapFlight(()=>.5);f.tap();const rock=f.asteroids.take({x:111,y:378,baseY:378,r:19,phase:0,age:0,angle:0,spin:1,texture:0});f.systems.shield=shield;f.step(.008);assert.equal(f.status,shield?'playing':'crashing');if(shield)assert.equal(rock.active,false);}});
test('flying asteroid respects Ranger armour and Phantom phase',()=>{const f=new TapFlight(()=>.5);f.reset('ranger');f.tap();f.asteroids.take({x:111,y:400,baseY:400,r:19,phase:0,age:0,angle:0,spin:1,texture:0});f.step(.008);assert.equal(f.status,'playing');assert.equal(f.systems.armor,0);const p=new TapFlight(()=>.5);p.reset('phantom');p.tap();p.systems.phase=1;p.asteroids.take({x:111,y:378,baseY:378,r:19,phase:0,age:0,angle:0,spin:1,texture:0});p.step(.008);assert.equal(p.status,'playing');});

test('Tap speed grows continuously and never exceeds its normal cap',()=>{let previous=tapDifficulty(0,0).speed;for(let t=1;t<=900;t++){const d=tapDifficulty(t/3,t);assert(d.speed>=previous);assert(d.speed-previous<.25);assert(d.speed<=126);assert(d.gap>=190);previous=d.speed;}for(const boundary of [10,25,50])assert(Math.abs(tapDifficulty(boundary+.001).speed-tapDifficulty(boundary-.001).speed)<.01);});
test('bonus-score jumps cannot suddenly accelerate Tap flight',()=>{const f=new TapFlight(()=>.5);f.tap();f.score=500;const before=f.currentSpeed;f.step(.016);assert(f.currentSpeed-before<=4*.016+.000001);});
test('asteroid pressure includes paired waves and a predictable recovery gap',()=>{const f=new TapFlight(()=>.5);f.formations.clear();f.asteroids.clear();for(let i=1;i<=4;i++)f.spawn(475+i*TAP.spacing);assert.equal(f.asteroids.items.filter(r=>r.active).length,4);});

test('every third formation uses real paired asteroids with an open central route',()=>{const f=new TapFlight(()=>.5);f.spawn(475);const wave=f.spawn(719);assert.equal(wave.variant,'swarm');const pair=f.asteroids.items.filter(r=>r.active&&r.x===719);assert.equal(pair.length,2);assert(pair.every(r=>Math.abs(r.baseY-wave.center)-r.amplitude-r.r>30));});
test('asteroid-wave formations have no invisible column collision',()=>{const f=new TapFlight(()=>.5);f.tap();f.formations.clear();f.asteroids.clear();f.collectibles.clear();f.formations.take({x:111,center:378,baseCenter:378,gap:230,width:62,variant:'swarm',phase:0,clearance:Infinity,index:99});f.ship.y=180;f.ship.vy=0;f.step(.008);assert.equal(f.status,'playing');});


test('new Tap hazards enter from offscreen during normal spawning and empty-pool recovery',()=>{
 for(const empty of [false,true]){
  const f=new TapFlight(()=>.5);f.tap();f.asteroids.clear();f.collectibles.clear();
  if(empty)f.formations.clear();else f.formations.items.find(o=>o.active).x=TAP.width+79;
  const sequence=f.sequence;f.step(.008);
  assert(f.sequence>sequence,'next section must spawn before the leading rock reaches the viewport');
  const rocks=f.asteroids.items.filter(r=>r.active);assert(rocks.length>0);
  for(const rock of rocks){assert(rock.x-rock.r>TAP.width,'entire rock starts outside the screen');assert((rock.x-rock.r-f.ship.x)/126>2,'at least two seconds of approach at maximum normal speed');}
 }
});


test('repeated random rolls cannot pin Tap gaps to one side',()=>{
 for(const roll of [0,.05,.95,1]){
  const f=new TapFlight(()=>roll);let repeated=0,previous=f.previousGap,sideRun=0,lastSide=0;
  for(let i=0;i<100;i++){
   f.formations.clear();f.asteroids.clear();f.collectibles.clear();const o=f.spawn(700);
   assert(Math.abs(o.center-previous)<=TAP.centerStep+.001);
   repeated=o.center===previous?repeated+1:0;assert(repeated<2,'gap must not stick to a boundary');
   const side=o.center<330?-1:o.center>426?1:0;
   sideRun=side&&side===lastSide?sideRun+1:side?1:0;
   assert(sideRun<=3,'route must return toward the middle');lastSide=side;previous=o.center;
  }
 }
});
test('a saturated formation pool does not skip or drift the planned route',()=>{
 const f=new TapFlight(()=>.9);while(f.formations.items.some(o=>!o.active))f.spawn(900);
 const snapshot=[f.sequence,f.previousGap,f.gapSide,f.gapSideCount];assert.equal(f.spawn(1144),undefined);
 assert.deepEqual([f.sequence,f.previousGap,f.gapSide,f.gapSideCount],snapshot);
});
