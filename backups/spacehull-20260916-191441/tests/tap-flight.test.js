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
  const obstacle = f.formations.items[0]; obstacle.x = 111 - 31 - 17 - 1;
  f.step(.016); assert.equal(f.score, 1);
  f.step(.016); assert.equal(f.score, 1);
});
test('collision stops scoring, cuts engine, delays result then reset starts clean', () => {
  const f = new TapFlight(() => .5); f.tap();
  Object.assign(f.formations.items[0], { x: 111, center: 620 });
  f.step(.016); assert.equal(f.status, 'crashing'); assert.equal(f.ship.thrust, 0); assert.equal(f.score, 0);
  for (let i = 0; i < 40; i++) f.step(.016);
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
