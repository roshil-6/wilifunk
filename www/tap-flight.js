import { BALANCE, TAP_CONFIG, ROCKETS } from './config.js?v=four-games-1';
import { createSystems, tickSystems, takeImpact, attractCoin, activateSystem } from './rocket-systems.js?v=four-games-1';
import { Pool, clamp, sweptDistance } from './flight.js?v=four-games-1';

export const TAP = Object.freeze({...TAP_CONFIG,...ROCKETS[0].tapBehavior});

export function tapDifficulty(score, elapsed = 0) {
  const stage = score < TAP_CONFIG.thresholds[0] ? 0 : score < TAP_CONFIG.thresholds[1] ? 1 : score < TAP_CONFIG.thresholds[2] ? 2 : 3;
  const progress=1-Math.exp(-Math.max(0,score/65,elapsed/150));
  return { stage, speed: TAP_CONFIG.speeds[0]+(TAP_CONFIG.speeds.at(-1)-TAP_CONFIG.speeds[0])*progress, gap:TAP_CONFIG.gaps[0]+(TAP_CONFIG.gaps.at(-1)-TAP_CONFIG.gaps[0])*progress, spacing:TAP_CONFIG.spacing };
}

// Separate flight physics and score; shared rocket armor, magnet, phase, shield and overdrive.
export class TapFlight {
  constructor(random = Math.random) {
    this.random = random;
    this.formations = new Pool(8);
    this.collectibles = new Pool(32);
    this.asteroids = new Pool(12);
    this.reset();
  }

  reset(rocketId = 'pioneer') {
    this.systems=createSystems(rocketId); this.perfects=0; this.perfectStreak=0; this.bestStreak=0; this.skims=0; this.obstaclesPassed=0;this.nextUpgrade=25;this.blast=null; this.assisted=false; this.feedbackTime=0; this.feedbackKind='';
    this.ship = { x: 111, y: 378, vy: 0, angle: 0, thrust: 0 };
    this.score = 0;
    this.coins = 0;
    this.stars = 0;
    this.travel = 0;
    this.currentSpeed=TAP_CONFIG.speeds[0];
    this.time = 0;
    this.crashTime = 0;
    this.status = 'ready';
    this.saved = false;
    this.previousGap = 378;
    this.gapSide = 0; this.gapSideCount = 0;
    this.sequence = 0;
    this.formations.clear();
    this.collectibles.clear();
    this.asteroids.clear();
    this.spawn(475);
  }

  tap() {
    if (this.status !== 'ready' && this.status !== 'playing') return false;
    this.status = 'playing';
    this.ship.vy = this.systems.craft.tapBehavior.impulse;
    this.ship.thrust = 1;
    return true;
  }

  spawn(x) {
    // A full pool must not advance the route or consume a formation index.
    if (!this.formations.items.some(f => !f.active)) return;
    const difficulty = tapDifficulty(this.score,this.time);
    let center = 378;
    if (this.sequence > 0) {
      let delta = (this.random() * 2 - 1) * TAP_CONFIG.centerStep;
      // Reflect at the limits instead of repeatedly pinning gaps to an edge.
      if (this.previousGap + delta < TAP_CONFIG.centerMin || this.previousGap + delta > TAP_CONFIG.centerMax) delta = -delta;
      // Break long runs on one side with a reachable step toward the middle.
      if (this.gapSideCount >= 2) delta = clamp(378 - this.previousGap, -TAP_CONFIG.centerStep, TAP_CONFIG.centerStep);
      center = clamp(this.previousGap + delta, TAP_CONFIG.centerMin, TAP_CONFIG.centerMax);
    }
    const side = center < 330 ? -1 : center > 426 ? 1 : 0;
    this.gapSideCount = side && side === this.gapSide ? this.gapSideCount + 1 : side ? 1 : 0;
    this.gapSide = side;
    this.previousGap = center;
    const roll = this.random();
    const variant = this.sequence%3===2?'swarm':difficulty.stage < 2 ? 'rock' : roll < .22 ? 'moving' : roll < .44 ? 'satellite' : roll < .64 ? 'ring' : roll < .8 && difficulty.stage === 3 ? 'narrow' : 'rock';
    const gap = difficulty.gap - (variant === 'narrow' ? 10 : 0) + (this.sequence>0&&this.sequence%6===0?28:0);
    const f = this.formations.take({ x, center, baseCenter: center, gap, width: variant === 'satellite' ? 70 : 62, passed: false, variant, phase: this.random() * 6.28, crossed:false,perfect:false,clearance:Infinity,scraped:false,index: this.sequence++ });
    if (!f) return;
    // Every third formation is an asteroid wave instead of columns.
    if(variant==='swarm'){
      for(const direction of [-1,1]){const baseY=center+direction*88,phase=direction*Math.PI/2;this.asteroids.take({x,y:baseY+Math.sin(phase)*20,baseY,r:27+difficulty.stage,phase,amplitude:20,age:0,angle:0,spin:direction*.9,texture:f.index%3});}
    }else if(f.index%5!==4){const direction=f.index%2?-1:1,baseY=center+direction*18,phase=-direction*.6;this.asteroids.take({x:x-TAP_CONFIG.spacing/2,y:baseY+Math.sin(phase)*40,baseY,r:26+difficulty.stage*1.5,phase,amplitude:40,age:0,angle:0,spin:direction*1.1,texture:f.index%3});}
    if(variant!=='swarm'&&this.sequence>3&&this.random()<.2)this.collectibles.take({x:x+12,y:center+gap*.3,offset:gap*.3,owner:f.index,type:'bomb'});
    // Collectibles follow their formation, including slowly moving openings.
    if (this.random() < .65) {
      const offset = variant==='swarm'?0:(this.random() * 2 - 1) * gap * .17;
      for (let i = 0; i < 3; i++) this.collectibles.take({ x: x + i * 32 - 12, y: center + offset, offset, owner: f.index, type: 'coin' });
    }
    if (this.random() < .16) {
      const offset = variant==='swarm'?0:(this.random() < .5 ? -1 : 1) * gap * .32;
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
    this.time += dt;this.feedbackTime=Math.max(0,this.feedbackTime-dt);
    const p = this.ship;
    if (this.status === 'crashing') {
      this.crashTime += dt;
      p.vy += 95 * dt;
      p.y = Math.min(TAP.floor - 15, p.y + p.vy * dt);
      p.angle += dt * 1.5;
      for (const f of this.formations.items) if (f.active) f.x -= dt * 12;
      for(const rock of this.asteroids.items)if(rock.active){rock.x-=dt*12;rock.angle+=rock.spin*dt*.2;}
      if (this.crashTime >= .55) { this.status = 'over'; event('over'); }
      return;
    }

    const oldX=p.x,oldY=p.y;
    tickSystems(this.systems,dt);
    p.vy = Math.min(300, p.vy + this.systems.craft.tapBehavior.gravity * dt);
    p.y += p.vy * dt;
    p.angle += (clamp(p.vy / 600, -.27, .42) - p.angle) * (1 - Math.exp(-dt * 12));
    p.thrust = Math.max(0, p.thrust - dt * 5);
    const { speed:baseSpeed, spacing } = tapDifficulty(this.score,this.time);const targetSpeed=baseSpeed*(this.systems.overdrive>0?1.15:1);this.currentSpeed+=clamp(targetSpeed-this.currentSpeed,-4*dt,4*dt);const speed=this.currentSpeed;
    this.travel += speed * dt;
    if (p.y - this.systems.craft.tapBehavior.radius < TAP.ceiling || p.y + this.systems.craft.tapBehavior.radius > TAP.floor) { this.crash(); event('crash'); return; }

    let farthest = -Infinity;
    for (const f of this.formations.items) {
      if (!f.active) continue;
      f.x -= speed * dt;
      if (f.variant === 'moving') f.center = f.baseCenter + Math.sin(this.time * .65 + f.phase) * 16;
      farthest = Math.max(farthest, f.x);
      const radius=this.systems.craft.tapBehavior.radius, clearance=f.gap/2-Math.abs(p.y-f.center)-radius;
      if(f.variant!=='swarm'&&Math.abs(f.x-p.x)<f.width/2+17){
        f.clearance=Math.min(f.clearance,clearance);
        if(clearance<0){f.scraped=true;
          const result=takeImpact(this.systems,-clearance,-clearance>BALANCE.lightPenetration);
          if(result==='shielded'){f.active=false;f.scraped=true;event('shield-hit');continue;}
          if(result==='fatal'){this.crash();event('crash');return;}
          if(result==='damaged'){f.scraped=true;p.y=clamp(p.y,f.center-f.gap/2+radius+2,f.center+f.gap/2-radius-2);p.vy*=.4;event('damage');}
        }
      }
      if(!f.crossed&&f.x<=p.x){f.crossed=true;f.perfect=Math.abs(p.y-f.center)<=BALANCE.perfectTolerance;}
      if (!f.passed && f.x + f.width / 2 < p.x - 17) {
        f.passed = true;this.obstaclesPassed++;this.score++;
        if(f.perfect&&!f.scraped){this.perfects++;this.perfectStreak++;this.bestStreak=Math.max(this.bestStreak,this.perfectStreak);this.score+=BALANCE.perfectBonus*(this.systems.overdrive>0?2:1);if(this.systems.craft.ability==='OVERDRIVE')this.systems.energy=Math.min(100,this.systems.energy+25);this.feedbackTime=.65;this.feedbackKind='perfect';event('perfect');}
        else {this.perfectStreak=0;if(f.clearance>=0&&f.clearance<BALANCE.skimTolerance&&!f.scraped){this.skims++;this.score+=BALANCE.skimBonus*(this.systems.overdrive>0?2:1);if(this.systems.craft.ability==='OVERDRIVE')this.systems.energy=Math.min(100,this.systems.energy+20);this.feedbackTime=.65;this.feedbackKind='skim';event('skim');}}
        event('score');if(this.systems.craft.ability==='ADAPTIVE_SYSTEM'&&this.obstaclesPassed>=this.nextUpgrade){this.nextUpgrade+=25;event('upgrade');}
      }
      if (f.x < -80) f.active = false;
    }
    for(const rock of this.asteroids.items){
      if(!rock.active)continue;
      const ax=(rock.x-oldX)*.8,ay=rock.y-oldY;
      rock.x-=speed*dt;rock.age+=dt;rock.angle+=rock.spin*dt;
      rock.y=rock.baseY+Math.sin(rock.age*.95+rock.phase)*(rock.amplitude||18);
      const distance=sweptDistance(ax,ay,(rock.x-p.x)*.8,rock.y-p.y),hitRadius=rock.r*.85+this.systems.craft.tapBehavior.radius;
      if(distance<hitRadius){
        const penetration=hitRadius-distance,result=takeImpact(this.systems,penetration,penetration>BALANCE.lightPenetration);
        if(result==='fatal'){this.crash();event('crash');return;}
        if(result==='shielded'||result==='damaged'){rock.active=false;this.blast={x:rock.x,y:rock.y,time:this.time};event(result==='shielded'?'shield-hit':'damage');}
      }
      if(rock.x < -50)rock.active=false;
    }
    for (const item of this.collectibles.items) {
      if (!item.active) continue;
      item.x -= speed * dt;
      const owner = this.formations.items.find(f => f.active && f.index === item.owner);
      if (owner && !(item.type==='coin'&&Math.hypot(item.x-p.x,item.y-p.y)<this.systems.craft.exploreBehavior.magnet)) item.y = owner.center + item.offset;
      attractCoin(item,p,this.systems,dt);
      if (Math.hypot((item.x - p.x) * .7, item.y - p.y) < 18) {
        item.active = false;
        if(item.type==='bomb'){this.blast={x:item.x,y:item.y,time:this.time};event('mine');if(this.systems.shield>0){this.systems.shield=0;event('shield-hit');}else if(takeImpact(this.systems,999,true)==='fatal'){this.crash();event('crash');return;}continue;}
        if (item.type === 'coin') this.coins++;
        else {this.stars++;if(this.stars%3===0){this.systems.shield=this.systems.id==='cosmic_pink'?8:5;event('shield');}}
        event(item.type);
      }
      if (item.x < -20) item.active = false;
    }
    // Schedule ahead of the viewport: inter-column rocks lead their formation by half a spacing.
    if (farthest < TAP.width + 80) this.spawn(Number.isFinite(farthest)?farthest+spacing:TAP.width+80+spacing/2);
  }
}
