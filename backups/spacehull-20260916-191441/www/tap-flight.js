import { Pool, clamp } from './flight.js';

export const TAP = Object.freeze({ width: 390, height: 780, gravity: 390, impulse: -195, ceiling: 62, floor: 740 });

export function tapDifficulty(score) {
  const stage = score < 10 ? 0 : score < 25 ? 1 : score < 50 ? 2 : 3;
  return { stage, speed: [94, 105, 116, 126][stage], gap: [230, 216, 202, 190][stage], spacing: 244 };
}

// Independent from Explore: one score per formation, no fuel, shields or distance scoring.
export class TapFlight {
  constructor(random = Math.random) {
    this.random = random;
    this.formations = new Pool(8);
    this.collectibles = new Pool(32);
    this.reset();
  }

  reset() {
    this.ship = { x: 111, y: 378, vy: 0, angle: 0, thrust: 0 };
    this.score = 0;
    this.coins = 0;
    this.stars = 0;
    this.travel = 0;
    this.time = 0;
    this.crashTime = 0;
    this.status = 'ready';
    this.saved = false;
    this.previousGap = 378;
    this.sequence = 0;
    this.formations.clear();
    this.collectibles.clear();
    this.spawn(475);
  }

  tap() {
    if (this.status !== 'ready' && this.status !== 'playing') return false;
    this.status = 'playing';
    this.ship.vy = TAP.impulse;
    this.ship.thrust = 1;
    return true;
  }

  spawn(x) {
    const difficulty = tapDifficulty(this.score);
    const center = this.sequence === 0 ? 378 : clamp(this.previousGap + (this.random() * 2 - 1) * 85, 230, 570);
    this.previousGap = center;
    const roll = this.random();
    const variant = difficulty.stage < 2 ? 'rock' : roll < .22 ? 'moving' : roll < .44 ? 'satellite' : roll < .64 ? 'ring' : roll < .8 && difficulty.stage === 3 ? 'narrow' : 'rock';
    const gap = difficulty.gap - (variant === 'narrow' ? 10 : 0);
    const f = this.formations.take({ x, center, baseCenter: center, gap, width: variant === 'satellite' ? 70 : 62, passed: false, variant, phase: this.random() * 6.28, index: this.sequence++ });
    if (!f) return;
    // Collectibles follow their formation, including slowly moving openings.
    if (this.random() < .65) {
      const offset = (this.random() * 2 - 1) * gap * .17;
      for (let i = 0; i < 3; i++) this.collectibles.take({ x: x + i * 32 - 12, y: center + offset, offset, owner: f.index, type: 'coin' });
    }
    if (this.random() < .16) {
      const offset = (this.random() < .5 ? -1 : 1) * gap * .32;
      this.collectibles.take({ x: x + 24, y: center + offset, offset, owner: f.index, type: 'star' });
    }
    return f;
  }

  crash() {
    if (this.status !== 'playing') return;
    this.status = 'crashing';
    this.crashTime = 0;
    this.ship.thrust = 0;
    this.ship.vy = 25;
  }

  step(dt, event = () => {}) {
    // Substeps keep collision and tap feel stable during a dropped frame.
    let remaining = Math.min(dt, .1);
    while (remaining > .000001) {
      const step = Math.min(remaining, 1 / 120);
      this.advance(step, event);
      remaining -= step;
    }
  }

  advance(dt, event) {
    if (this.status === 'ready' || this.status === 'over') return;
    this.time += dt;
    const p = this.ship;
    if (this.status === 'crashing') {
      this.crashTime += dt;
      p.vy += 95 * dt;
      p.y = Math.min(TAP.floor - 15, p.y + p.vy * dt);
      p.angle += dt * 1.5;
      for (const f of this.formations.items) if (f.active) f.x -= dt * 12;
      if (this.crashTime >= .85) { this.status = 'over'; event('over'); }
      return;
    }

    p.vy = Math.min(300, p.vy + TAP.gravity * dt);
    p.y += p.vy * dt;
    p.angle += (clamp(p.vy / 600, -.27, .42) - p.angle) * (1 - Math.exp(-dt * 12));
    p.thrust = Math.max(0, p.thrust - dt * 5);
    const { speed, spacing } = tapDifficulty(this.score);
    this.travel += speed * dt;
    if (p.y - 9 < TAP.ceiling || p.y + 9 > TAP.floor) { this.crash(); event('crash'); return; }

    let farthest = -Infinity;
    for (const f of this.formations.items) {
      if (!f.active) continue;
      f.x -= speed * dt;
      if (f.variant === 'moving') f.center = f.baseCenter + Math.sin(this.time * .65 + f.phase) * 16;
      farthest = Math.max(farthest, f.x);
      if (Math.abs(f.x - p.x) < f.width / 2 + 17 && (p.y - 9 < f.center - f.gap / 2 || p.y + 9 > f.center + f.gap / 2)) {
        this.crash(); event('crash'); return;
      }
      if (!f.passed && f.x + f.width / 2 < p.x - 17) {
        f.passed = true;
        this.score++;
        event('score');
      }
      if (f.x < -80) f.active = false;
    }
    for (const item of this.collectibles.items) {
      if (!item.active) continue;
      item.x -= speed * dt;
      const owner = this.formations.items.find(f => f.active && f.index === item.owner);
      if (owner) item.y = owner.center + item.offset;
      if (Math.hypot((item.x - p.x) * .7, item.y - p.y) < 18) {
        item.active = false;
        if (item.type === 'coin') this.coins++;
        else this.stars++;
        event(item.type);
      }
      if (item.x < -20) item.active = false;
    }
    if (farthest < TAP.width + 80 - spacing) this.spawn(farthest + spacing);
  }
}
