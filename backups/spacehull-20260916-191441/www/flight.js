export const WIDTH = 390, HEIGHT = 780;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const ZONES = [
  { name: 'EARLY SPACE', at: 0, speed: 150, interval: 1.7, tint: '#263d76' },
  { name: 'ASTEROID BELT', at: 650, speed: 185, interval: 1.35, tint: '#39446c' },
  { name: 'DEEP SPACE', at: 1500, speed: 215, interval: 1.15, tint: '#182447' },
  { name: 'NEBULA', at: 2600, speed: 240, interval: 1.05, tint: '#554072' },
  { name: 'DANGER ZONE', at: 4000, speed: 270, interval: .95, tint: '#603c46' }
];
export function zoneAt(distance) { return ZONES.findLastIndex(z => distance >= z.at); }
export function pilot() { return { x: 195, y: 602, vx: 0, bank: 0 }; }
export function steer(p, input, dt, agility = 1) {
  let desired = input.axis * 235;
  if (input.active && input.mode !== 'arrows') desired = clamp((input.target - p.x) * (input.mode === 'slide' ? 7 : 3.2), -250, 250);
  p.vx += (desired - p.vx) * (1 - Math.exp(-dt * (input.active || input.axis ? 7 : 4.5) * agility));
  p.x = clamp(p.x + p.vx * dt, 22, WIDTH - 22);
  if (p.x === 22 || p.x === WIDTH - 22) p.vx = 0;
  p.bank += (p.vx / 250 * .29 - p.bank) * (1 - Math.exp(-dt * 8));
}
export function sweptDistance(ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp(-(ax * dx + ay * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(ax + dx * t, ay + dy * t);
}
export class Pool {
  constructor(size) { this.items = Array.from({ length: size }, () => ({ active: false })); }
  take(data) { const item = this.items.find(o => !o.active); if (item) Object.assign(item, data, { active: true }); return item; }
  clear() { this.items.forEach(o => o.active = false); }
}
