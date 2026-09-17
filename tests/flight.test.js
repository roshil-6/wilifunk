import test from 'node:test';
import assert from 'node:assert/strict';
import { pilot, steer, sweptDistance, Pool, zoneAt } from '../www/flight.js';
for (const mode of ['slide', 'arrows', 'glide']) test(`${mode}: smooth portrait steering, banking, bounds and release`, () => {
  const p = pilot(), input = { mode, active: true, target: 330, axis: mode === 'arrows' ? 1 : 0 };
  steer(p, input, 1 / 60);
  assert(p.x > 195 && p.x < 200); assert(p.bank > 0); assert.equal(p.y, 602);
  for (let i = 0; i < 120; i++) steer(p, input, 1 / 60);
  assert(p.x <= 368 && p.x > 300);
  input.active = false; input.axis = 0;
  for (let i = 0; i < 120; i++) steer(p, input, 1 / 60);
  assert(Math.abs(p.vx) < .1); assert(Math.abs(p.bank) < .01);
});
test('collision sweep catches objects crossing the rocket between frames', () => assert.equal(sweptDistance(0, -30, 0, 30), 0));
test('pool remains bounded and recycles inactive objects', () => { const p = new Pool(1); const a = p.take({ x: 1 }); assert.equal(p.take({}), undefined); a.active = false; assert.equal(p.take({ x: 2 }), a); });
test('distance advances through all five environments', () => assert.deepEqual([0, 2000, 5000, 10000, 15000,25000,35000,50000].map(zoneAt), [0, 1, 2, 3, 4,5,6,7]));
