// Side-profile artwork and horizontal parallax, independent from Explore's camera.
export function drawSideRocket(c, x, y, angle, fin, thrust = 0, engine = true, scale = 1, model = 'pioneer') {
  c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale);if(model==='atlas')c.scale(.96,1.15);if(model==='comet')c.scale(1.12,.88);
  if (engine) {
    const length = 20 + thrust * 16;
    const flame = c.createLinearGradient(-18, 0, -18 - length, 0);
    flame.addColorStop(0, '#d7faff'); flame.addColorStop(.35, thrust > .2 ? '#ffc770c0' : '#5ec7ffd0'); flame.addColorStop(1, '#4288ff00');
    c.fillStyle = flame; c.beginPath(); c.moveTo(-17, -5); c.quadraticCurveTo(-27, -8, -18 - length, 0); c.quadraticCurveTo(-27, 8, -17, 5); c.fill();
  }
  c.fillStyle = fin;
  c.beginPath(); c.moveTo(-11, -7); c.lineTo(-23, -16); c.lineTo(-18, -2); c.lineTo(-21, 15); c.lineTo(-4, 7); c.fill();
  const body = c.createLinearGradient(0, -10, 0, 10);
  body.addColorStop(0, '#f0f3ec'); body.addColorStop(.55, '#cfdae7'); body.addColorStop(1, '#7187a2');
  c.fillStyle = body; c.beginPath(); c.moveTo(24, 0); c.bezierCurveTo(9, -13, -8, -12, -17, -6); c.lineTo(-17, 6); c.bezierCurveTo(-8, 12, 9, 13, 24, 0); c.fill();
  c.fillStyle = fin; c.beginPath(); c.moveTo(24, 0); c.quadraticCurveTo(18, -5, 13, -7); c.lineTo(13, 7); c.closePath(); c.fill();
  c.fillStyle = '#142d4a'; c.beginPath(); c.ellipse(4, -1, 5, 6, -.12, 0, 7); c.fill(); c.strokeStyle = '#9dc6df'; c.lineWidth = 1; c.stroke();
  c.fillStyle = '#71b6d5'; c.beginPath(); c.ellipse(3, -3, 1.4, 2, 0, 0, 7); c.fill();
  c.fillStyle=fin;c.fillRect(-8,-8,3,16);if(['ranger','atlas','odyssey'].includes(model)){c.fillStyle='#9cafc7';c.fillRect(-14,-10,15,2);c.fillRect(-14,8,15,2);}c.fillStyle = '#344b66'; c.fillRect(-19, -4, 3, 8);
  c.restore();
}

export function createTapRenderer(createSurface) {
  const column = createSurface(96, 800), g = column.getContext('2d');
  let seed = 192;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  g.beginPath(); g.moveTo(12, 0);
  for (let y = 0; y < 755; y += 24) g.lineTo(8 + random() * 10, y);
  g.lineTo(22, 778); g.lineTo(44, 800); g.lineTo(73, 790); g.lineTo(84, 770);
  for (let y = 750; y >= 0; y -= 24) g.lineTo(83 + random() * 8, y);
  g.closePath();
  const rock = g.createLinearGradient(0, 0, 96, 0);
  rock.addColorStop(0, '#8b8ba8'); rock.addColorStop(.24, '#546482'); rock.addColorStop(.45, '#344565'); rock.addColorStop(1, '#17233d');
  g.fillStyle = rock; g.fill(); g.save(); g.clip();
  for (let i = 0; i < 140; i++) {
    const x = random() * 96, y = random() * 800, r = 4 + random() * 15;
    g.fillStyle = i % 3 ? '#07152e50' : '#b3bbd126'; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x, y - r); g.lineTo(x + r, y - r * .3); g.lineTo(x + r * .7, y + r); g.lineTo(x - r * .6, y + r * .5); g.closePath(); g.fill();
  }
  g.restore();

  const flyingRocks=Array.from({length:3},(_,index)=>{
    const image=createSurface(80,80),r=image.getContext('2d');r.beginPath();
    for(let i=0;i<11;i++){const a=i*Math.PI*2/11,rad=27+random()*10,x=40+Math.cos(a)*rad,y=40+Math.sin(a)*rad;i?r.lineTo(x,y):r.moveTo(x,y);}r.closePath();
    const light=r.createLinearGradient(6,6,70,70);light.addColorStop(0,index%2?'#e3b49a':'#cbd9ed');light.addColorStop(.35,'#8090ab');light.addColorStop(1,'#19263d');r.fillStyle=light;r.fill();r.save();r.clip();
    for(let i=0;i<22;i++){const x=random()*80,y=random()*80,z=3+random()*9;r.fillStyle=i%3?'#0b183652':'#d7c4b934';r.beginPath();r.moveTo(x-z,y);r.lineTo(x,y-z);r.lineTo(x+z,y+z*.3);r.lineTo(x,y+z);r.closePath();r.fill();}r.restore();return image;
  });

  function pillar(c, x, end, bottom, variant, width) {
    const length = bottom ? 780 - end : end;
    if (length <= 0) return;
    c.save(); c.translate(x - width / 2, bottom ? 780 : 0); if (bottom) c.scale(1, -1);
    c.drawImage(column, 0, 800 - length, 96, length, 0, 0, width, length);
    if (variant === 'satellite') {
      c.fillStyle = '#40506c'; c.fillRect(8, length - 73, width - 14, 54);
      c.strokeStyle = '#9aa9bd65'; c.lineWidth = 1;
      for (let y = length - 68; y < length - 15; y += 12) { c.beginPath(); c.moveTo(8, y); c.lineTo(width - 6, y); c.stroke(); }
      c.fillStyle = '#c8936760'; c.fillRect(17, length - 36, 6, 4);
    }
    if (variant === 'ring') { c.strokeStyle = '#b8b1d34a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, length - 40); c.lineTo(width, length - 24); c.stroke(); }
    c.restore();
  }

  return function renderTap(c, flight, art, fin, time, quality = 1, paused = false, trail = null) {
    const travel = flight.travel;
    c.fillStyle = '#030914'; c.fillRect(0, 0, 390, 780);
    if(art.deepSky?.complete&&art.deepSky.naturalWidth){c.globalAlpha=.27;c.drawImage(art.deepSky,0,art.deepSky.naturalHeight*.27,art.deepSky.naturalWidth,art.deepSky.naturalHeight*.38,-17-Math.sin(travel*.0002)*17,0,425,780);c.globalAlpha=1;}
    c.globalAlpha = .6; c.drawImage(art.nebula, -travel * .015 % 390, 0); c.drawImage(art.nebula, 390 - travel * .015 % 390, 0); c.globalAlpha = 1;
    for (const star of art.stars) {
      c.fillStyle = '#bdcfea'; c.globalAlpha = star.alpha * .8;
      c.fillRect(((star.x - travel * star.depth * .075) % 390 + 390) % 390, star.y, star.r, star.r);
    }
    c.globalAlpha = .5; c.drawImage(art.planet, 470 - travel * .03 % 980, 220, 180, 180);
    c.globalAlpha = .55; c.drawImage(art.planet, -130-Math.sin(travel*.0001)*30, 663, 590, 590); c.globalAlpha = 1;
    // Distant silhouettes stay below the playable region; they are scenery, never hazards.
    for (let i = 0; i < 12; i++) {
      const x = ((i * 48 - travel * .2) % 570 + 570) % 570 - 90;
      c.fillStyle = i % 2 ? '#0a172a' : '#0d1d33'; c.beginPath(); c.moveTo(x, 780); c.lineTo(x + 25, 749 + i % 3 * 9); c.lineTo(x + 53, 780); c.fill();
    }
    const p = flight.ship, alive = flight.status === 'ready' || flight.status === 'playing';
    // Follow the falling wreck into the open space above the result UI.
    const cameraBlend = Math.max(0, Math.min(1, (flight.crashTime - .1) / .45));
    c.save(); c.translate(0, alive ? 0 : Math.min(0, 230 - p.y) * cameraBlend);
    for (const f of flight.formations.items) if (f.active && f.variant!=='swarm') {
      pillar(c, f.x, f.center - f.gap / 2, false, f.variant, f.width);
      pillar(c, f.x, f.center + f.gap / 2, true, f.variant, f.width);
    }
    for(const rock of flight.asteroids.items)if(rock.active){c.save();c.translate(rock.x,rock.y);c.rotate(rock.angle);c.strokeStyle='#cbb5aa44';c.lineWidth=1;c.beginPath();c.arc(0,0,rock.r*.93,3.5,5.4);c.stroke();c.drawImage(flyingRocks[rock.texture%3],-rock.r,-rock.r,rock.r*2,rock.r*2);c.restore();}
    for (const item of flight.collectibles.items) if (item.active) {
      c.save(); c.translate(item.x, item.y); c.fillStyle = '#f8ca63'; c.strokeStyle = '#ffdf99'; c.lineWidth = 1;
      if(item.type==='bomb'){drawMine(c,0,0,time);}else if (item.type === 'coin') { c.beginPath(); c.ellipse(0, 0, 6.4, 8.5, 0, 0, 7); c.fill(); c.stroke(); c.strokeStyle = '#bc873b'; c.beginPath(); c.ellipse(0, 0, 3.5, 5.5, 0, 0, 7); c.stroke(); }
      else { c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 4 : 10; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); }
      c.restore();
    }
    drawSystemAura(c,p.x,p.y,flight.systems,time);
    if(flight.blast){const t=flight.time-flight.blast.time;if(t<.7){c.strokeStyle=`rgba(255,130,75,${1-t/.7})`;c.lineWidth=2;c.beginPath();c.arc(flight.blast.x,flight.blast.y,12+t*110,0,7);c.stroke();}}
    drawSideRocket(c, p.x, p.y, p.angle, fin, p.thrust, alive, .9*(flight.systems.craft.tapBehavior.radius/9)**.35,flight.systems.id);
    if(flight.systems.damage){c.fillStyle="#1d2434";c.fillRect(p.x-19,p.y-11,7,7);for(let i=0;i<4;i++){c.fillStyle=i%2?"#ed9e7290":"#7a879755";c.beginPath();c.arc(p.x-23-i*9,p.y+Math.sin(time*3+i)*5,2+i*.5,0,7);c.fill();}}
    if(flight.systems.phase>0){c.strokeStyle="#a9a2e4";c.beginPath();c.ellipse(p.x,p.y,30,19,0,0,7);c.stroke();}
    if(trail&&alive){c.strokeStyle=trail;c.globalAlpha=.45;c.beginPath();c.moveTo(p.x-25,p.y);c.lineTo(p.x-56,p.y);c.stroke();c.globalAlpha=1;}
    if (!alive && flight.crashTime < .85) {
      const t = flight.crashTime;
      if (t < .09) { c.fillStyle = `rgba(255,198,124,${.14 * (1 - t / .09)})`; c.fillRect(0, 0, 390, 780); }
      c.globalAlpha = Math.max(0, 1 - t / .85);
      for (let i = 0; i < (quality > .6 ? 20 : 10); i++) { const a = i * 2.4; c.fillStyle = i % 2 ? '#ffb467' : '#9aa8bf'; c.fillRect(p.x + Math.cos(a) * t * 105, p.y + Math.sin(a) * t * 70, 2, 2); }
      c.globalAlpha = 1;
    }
    if (alive && p.thrust > 0 && !paused) { c.fillStyle = '#91daff'; c.globalAlpha = p.thrust * .6; c.fillRect(p.x - 40 - (1 - p.thrust) * 20, p.y + 2, 2, 1); c.globalAlpha = 1; }
    if(alive&&flight.feedbackTime>0){c.strokeStyle=flight.feedbackKind==='perfect'?'#8de4d0':'#eec492';c.globalAlpha=flight.feedbackTime;c.beginPath();c.arc(p.x,p.y,24+(1-flight.feedbackTime/.65)*24,0,7);c.stroke();c.globalAlpha=1;}
    c.restore();
    // Only a small boundary cue; no UI bars or floor blocking the view.
    if (alive && (p.y < 100 || p.y > 690)) { c.strokeStyle = '#d6996e45'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, p.y < 100 ? 62 : 740); c.lineTo(390, p.y < 100 ? 62 : 740); c.stroke(); }
  };
}

export function drawMine(c,x,y,time){
 c.save();c.translate(x,y);c.rotate(time*.35);
 const halo=c.createRadialGradient(0,0,4,0,0,26);halo.addColorStop(0,'#ff334f55');halo.addColorStop(1,'#ff334f00');c.fillStyle=halo;c.fillRect(-26,-26,52,52);
 for(let i=0;i<6;i++){c.save();c.rotate(i*Math.PI/3);c.fillStyle='#8796aa';c.beginPath();c.moveTo(-3,-9);c.lineTo(0,-17);c.lineTo(3,-9);c.fill();c.restore();}
 const shell=c.createLinearGradient(-10,-10,10,10);shell.addColorStop(0,'#67798e');shell.addColorStop(.4,'#182336');shell.addColorStop(1,'#090e19');c.fillStyle=shell;c.strokeStyle='#c7858b';c.lineWidth=1;c.beginPath();c.arc(0,0,10,0,7);c.fill();c.stroke();
 c.fillStyle=Math.sin(time*7)>0?'#ffb0a0':'#f34c64';c.beginPath();c.arc(0,0,4,0,7);c.fill();c.strokeStyle='#f4738160';c.beginPath();c.arc(0,0,19+Math.sin(time*4)*2,0,7);c.stroke();c.restore();
}
export function drawSystemAura(c,x,y,s,time,shield=s.shield||0){
 c.save();c.translate(x,y);if(shield>0){c.strokeStyle='#8bedf2a0';c.fillStyle='#54bde914';c.lineWidth=1.5;c.beginPath();c.arc(0,0,28,0,7);c.fill();c.stroke();}
 if(s.craft.exploreBehavior.magnet+s.magnetBonus>0){c.strokeStyle='#e7c27340';c.lineWidth=1;for(let i=0;i<2;i++){const r=22+((time*12+i*15)%30);c.beginPath();c.arc(0,0,r,.4+i*3,2.2+i*3);c.stroke();}}
 if(s.overdrive>0){c.strokeStyle='#c69affb0';c.beginPath();c.arc(0,0,32,time*2,time*2+4);c.stroke();}c.restore();
}
