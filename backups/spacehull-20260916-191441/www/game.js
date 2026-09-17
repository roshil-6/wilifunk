import { TapFlight } from './tap-flight.js';
import { createTapRenderer, drawSideRocket } from './tap-renderer.js';
import { WIDTH as W, HEIGHT as H, clamp, pilot, steer, sweptDistance, Pool, ZONES, zoneAt } from './flight.js';
const $ = id => document.getElementById(id), canvas = $('universe'), ctx = canvas.getContext('2d', { alpha: false });
const screen = $('screen'), app = $('app');
const read = (k, fallback) => { try { const s = localStorage.getItem(k); return s === null ? fallback : JSON.parse(s); } catch { return fallback; } };
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { $('storageNotice').hidden = false; } }
function legacyString(k, fallback) { try { return localStorage.getItem(k) || fallback; } catch { return fallback; } }
const rockets = [
 { id: 'pioneer', name: 'SCOUT', cost: 0, fin: '#d85a47', agility: 1, description: 'The original explorer. Balanced and reliable.' },
 { id: 'red_fury', name: 'CRIMSON', cost: 150, fin: '#bb3947', agility: 1.22, description: 'Lighter thrusters. More responsive steering.' },
 { id: 'cosmic_pink', name: 'AURORA', cost: 300, fin: '#9385ba', agility: .9, description: 'Armored explorer. Longer collectible shields.' }
];
let settings = { mode: 'slide', sound: legacyString('wilifunkMuted', 'false') !== 'true', music: false, vibration: true, ...read('spacerootSettings', {}) };
if (!['slide','arrows','glide'].includes(settings.mode)) settings.mode = 'slide';
let wallet = Math.max(0, Number(read('wilifunkCoins', 0)) || 0), best = Math.max(0, Number(read('spaceRocketHighScore', 0)) || 0);
let unlocked = read('wilifunkUnlockedRockets', ['pioneer']); if (!Array.isArray(unlocked)) unlocked = ['pioneer'];
let selected = legacyString('wilifunkSelectedRocket', 'pioneer'); if (!rockets.some(r => r.id === selected) || !unlocked.includes(selected)) selected = 'pioneer';
let records = read('spacerootRecords', []); if (!Array.isArray(records)) records = []; records=records.filter(r=>r&&Number.isFinite(r.distance)&&Number.isFinite(r.score)&&r.distance>=0&&r.score>=0);
const badges = read('spaceRocketBadges', []);
// Explore's historical keys stay intact. Tap records never enter the Explore collection.
let activeMode = 'explore', boardMode = 'explore';
let tapBest = Math.max(0, Number(read('spacehullTapBestScore', 0)) || 0);
let tapRecords = read('spacehullTapRecords', []);
if (!Array.isArray(tapRecords)) tapRecords = [];
tapRecords = tapRecords.filter(r => r && Number.isFinite(r.score) && r.score >= 0).sort((a,b) => b.score-a.score).slice(0,50);
const tapFlight = new TapFlight();
let tapBestAnnounced = false;

let state = 'home', page = 'home', ship = pilot(), run, elapsed = 0, launchTime = 0, crashTime = 0, zone = 0, clock = 0, spawnClock = 0, pickupClock = 0, toastTime = 0, preview = 0, tab = 'personal', pausedFrom = 'playing';
let quality = 1, slowFrames = 0, hudClock = 0, pointerId = null;
const input = { mode: settings.mode, active: false, target: W / 2, axis: 0 }, keys = new Set();
const obstacles = new Pool(60), pickups = new Pool(35), particles = new Pool(160);
const motionReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a,b) => a + Math.random() * (b-a);
let audio, hum, humGain;
function unlockAudio() { try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume().catch(()=>{}); if (!hum) { hum = audio.createOscillator(); humGain = audio.createGain(); hum.type = 'sine'; hum.frequency.value = 55; humGain.gain.value = 0; hum.connect(humGain).connect(audio.destination); hum.start(); } } catch {} }
function tone(freq, duration = .1, type = 'sine', volume = .035) { if (!settings.sound || !audio) return; const o = audio.createOscillator(), g = audio.createGain(); o.type = type; o.frequency.setValueAtTime(freq, audio.currentTime); o.frequency.exponentialRampToValueAtTime(Math.max(20,freq / 2),audio.currentTime+duration); g.gain.setValueAtTime(volume,audio.currentTime); g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration); o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime+duration); }
function resetInput() { pointerId = null; input.active = false; input.axis = 0; keys.clear(); }
function notify(text) { $('toast').textContent = text; toastTime = 2.2; $('toast').classList.add('visible'); }
function button(label, action, cls = '') { return `<button class="button ${cls}" data-action="${action}">${label}</button>`; }
function rocketMark(side=false) { return `<span class="mode-art ${side?'side-art':''}"><svg viewBox="0 0 40 48" aria-hidden="true"><path d="M14 22 4 39 5 45 15 35 25 35 35 45 36 39 26 22" fill="#d56556"/><path d="M20 2Q8 15 13 39H27Q32 15 20 2" fill="#dce5ef"/><path d="M20 2 15 13H25Z" fill="#d56556"/><ellipse cx="20" cy="23" rx="4" ry="6" fill="#203e59"/><path d="M17 40H23L20 48Z" fill="#72cbf7"/></svg></span>`; }
function header(title, back = 'home') { return `<header class="page-header"><button class="back" data-action="${back}" aria-label="Back">‹</button><h2>${title}</h2></header>`; }
function show(name) {
 page = name; screen.className = ''; resetInput(); toastTime=0; $('toast').textContent=''; $('toast').classList.remove('visible'); $('hud').hidden = true; $('tapHud').hidden = true; $('arrows').hidden = true; $('steerHint').textContent = '';
 if (name === 'tap-result' || name === 'tap-summary') { showTapResult(name === 'tap-result'); return; }
 if (name === 'tap-tutorial') { showTapTutorial(); return; }
 if (name !== 'crashed' && name !== 'summary' && name !== 'pause') state = 'menu';
 if (name === 'home') {
  state = 'home'; ship = pilot(); zone = 0; particles.clear();
  screen.innerHTML = `<div class="home-heading dual-heading"><div class="eyebrow">A journey beyond the familiar</div><h1>SPACEHULL</h1><p>EXPLORE. SURVIVE. GO FURTHER.</p></div><nav class="home-nav dual-nav">${button(rocketMark()+'<span><strong>EXPLORE MODE</strong><small>Dodge. Survive. Go Further.</small></span><span class="mode-chevron">›</span>','play-explore','mode-choice')}${button(rocketMark(true)+'<span><strong>TAP &amp; FUN MODE</strong><small>Tap. Fly. Have Fun.</small></span><span class="mode-chevron">›</span>','play-tap','mode-choice tap-choice')}${button('<span class="nav-icon">▥</span> LEADERBOARD','leaderboard')}${button('<span class="nav-icon">⚙</span> SETTINGS','settings')}<button class="quiet" data-action="rockets">ROCKET HANGAR &nbsp; / &nbsp; ◉ ${wallet}</button></nav><footer class="home-footer dual-footer">TWO MODES. ONE UNIVERSE.</footer>`;
 } else if (name === 'settings') {
  screen.innerHTML = `${header('SETTINGS')}<div class="page-content">${['sound','music','vibration'].map(k => `<div class="settings-row"><span>${k[0].toUpperCase()+k.slice(1)}</span><button class="toggle ${settings[k]?'on':''}" role="switch" aria-label="${k}" aria-checked="${settings[k]}" data-action="toggle-${k}"><i></i></button></div>`).join('')}<div class="settings-row"><span>Explore controls</span><button class="quiet" data-action="controls">${modeName()} &nbsp; ›</button></div><div class="settings-row"><span>Tap &amp; Fun controls</span><button class="quiet" data-action="tap-help">Tap &nbsp; ›</button></div><p class="small-note">Move. Dodge. Explore.<br>Forward thrust is automatic. You control the flight path.</p><div class="missions"><div class="eyebrow">EXPLORE MISSIONS / EVERY RUN</div><div class="mission-row"><span>Collect 5 stars</span><span>+25 ◉</span></div><div class="mission-row"><span>Make 3 near misses</span><span>+30 ◉</span></div><div class="mission-row"><span>Travel 1,000 meters</span><span>+40 ◉</span></div><p class="small-note">Every 3 stars activates a temporary shield.<br>Collect cyan fuel cells to extend your journey.</p></div></div>`;
 } else if (name === 'controls') {
  const modes = [['slide','↔','Side Slide','Drag left or right in the lower half. Smooth steering with a little inertia.'],['arrows','〈 〉','Arrow Controls','Hold the left or right HUD control to steer. Release to stabilize.'],['glide','◎','Touch & Hold Glide','Hold anywhere to guide the ship toward your finger. Release to stabilize.']];
  screen.innerHTML = `${header('CONTROLS','settings')}${modes.map(([id,icon,title,desc])=>`<button class="control-card ${settings.mode===id?'selected':''}" data-action="mode-${id}"><span class="control-symbol">${icon}</span><span><strong>${title}</strong><p>${desc}</p></span><span class="check">${settings.mode===id?'●':'○'}</span></button>`).join('')}<p class="small-note">Keyboard: ← / → or A / D. Escape pauses.<br>Your control choice is saved automatically.</p>`;
 } else if (name === 'rockets') {
  preview = clamp(preview, 0, rockets.length-1); const r = rockets[preview];
  screen.innerHTML = `${header('ROCKETS')}<div class="eyebrow">HANGAR / ${String(preview+1).padStart(2,'0')} <span style="float:right">◉ ${wallet}</span></div><div class="rocket-space"><button class="quiet" data-action="previous" aria-label="Previous rocket">‹</button><button class="quiet" data-action="next" aria-label="Next rocket">›</button></div><div class="rocket-info"><h3>${r.name}</h3><p>${r.description}</p></div>${button(selected===r.id?'EQUIPPED':unlocked.includes(r.id)?'EQUIP':`UNLOCK / ${r.cost} COINS`,'equip',selected===r.id?'':'primary')}<div class="dots">${rockets.map((r,i)=>`<i class="${i===preview?'on':''}"></i>`).join('')}</div><p class="small-note center">One small craft. An uncharted universe.</p>`;
 } else if (name === 'leaderboard') {
  showLeaderboard();
 } else if (name === 'pause') {
  screen.className = 'overlay-dim'; screen.innerHTML = `<div class="pause-content"><div class="eyebrow">FLIGHT ON HOLD</div><h2>TAKE A BREATH</h2><p>Your spacecraft is waiting.</p>${button('RESUME FLIGHT','resume','primary')}${button('END JOURNEY','end')}${button('MAIN MENU','abandon')}</div>`;
 } else if (name === 'crashed' || name === 'summary') {
  screen.className = 'overlay-dim'; const crashed = name === 'crashed';
  screen.innerHTML = `<div class="crash-title">${crashed?'<h2>CRASHED</h2><p>THE JOURNEY CONTINUES</p>':'<h2 style="color:#dce9ff;font-size:19px">JOURNEY ENDED</h2><p style="color:#98b1d9">KEEP EXPLORING</p>'}</div><div class="summary"><div class="summary-panel">${crashed?`<div class="scores"><div><small>SCORE</small><strong>${run.score}</strong></div><div><small>BEST</small><strong>${best}</strong></div></div>`:`<div class="center"><div class="eyebrow">YOUR SCORE</div><div class="big-score">${run.score}</div><p>BEST SCORE: ${best}</p></div>`}<dl class="stats"><dt>◉ &nbsp; Coins Collected</dt><dd>${run.coins}</dd><dt>✦ &nbsp; Stars Reached</dt><dd>${run.stars} / 5</dd><dt>◇ &nbsp; Near Misses</dt><dd>${run.near} / 3</dd><dt>↟ &nbsp; Distance Travelled</dt><dd>${Math.floor(run.distance).toLocaleString()} m</dd><dt>Mission rewards</dt><dd>+${run.reward} ◉</dd></dl></div><div class="summary-actions">${button(crashed?'↻ &nbsp; TRY AGAIN':'↻ &nbsp; PLAY AGAIN','play',`primary ${crashed?'crash':''}`)}${button('MAIN MENU','home')}<div style="display:flex;justify-content:center;gap:20px">${crashed?'<button class="quiet" data-action="summary">FLIGHT SUMMARY</button>':''}<button class="quiet" data-action="share">↗ SHARE</button></div></div></div>`;
 }
}
function modeName() { return ({slide:'Side Slide',arrows:'Arrow Controls',glide:'Touch & Hold Glide'})[settings.mode]; }
function showTapTutorial() {
  state='menu';
  screen.innerHTML=`${header('HOW TO PLAY')}<div class="tap-tutorial"><div class="tutorial-flight"><svg viewBox="0 0 250 105" aria-hidden="true"><path d="M45 75 Q100 -5 180 37 Q205 49 204 78" fill="none" stroke="#abc1e2" stroke-width="1.5" stroke-dasharray="5 6"/><path d="M40 75 L65 63 L55 83 Z" fill="#e9eff9"/><circle cx="54" cy="72" r="3" fill="#6fbadf"/></svg><span>◎</span></div><h2>TAP TO FLY</h2><p>Tap to rise. Release to fall.</p><div class="eyebrow">AVOID OBSTACLES</div><p>Collect coins and stars.<br>Pass a gap to score a point.</p></div>${button('GOT IT','tap-understood','primary')}<p class="small-note center">Keyboard: Space, ↑ or W. Escape pauses.</p>`;
}

function showLeaderboard() {
  const isTap=boardMode==='tap', rows=isTap?tapRecords:records;
  screen.innerHTML=`${header(isTap?'TAP & FUN LEADERBOARD':'DEEP SPACE RECORDS')}<div class="mode-tabs"><button class="${isTap?'':'active'}" data-action="board-explore">EXPLORE / DISTANCE</button><button class="${isTap?'active':''}" data-action="board-tap">TAP & FUN / SCORE</button></div><div class="tabs">${['global','friends','personal'].map(t=>`<button data-action="tab-${t}" class="${tab===t?'active':''}">${t.toUpperCase()}</button>`).join('')}</div>${tab==='personal'?`<table><thead><tr><th>#</th><th>PILOT</th><th>${isTap?'SCORE':'DISTANCE'}</th></tr></thead><tbody>${rows.slice(0,10).map((r,i)=>`<tr class="${i===0?'you':''}"><td class="rank-${i}">${i<3?['Ⅰ','Ⅱ','Ⅲ'][i]:i+1}</td><td>You</td><td>${Math.floor(isTap?r.score:r.distance).toLocaleString()}${isTap?'':' m'}</td></tr>`).join('')}</tbody></table>${rows.length?'':`<p class="empty">Your ${isTap?'first Tap & Fun score':'next expedition'} starts the record.<br>Launch a flight to make your mark.</p>`}<p class="small-note">${isTap?'Tap & Fun scores':'Explore distances'} saved on this device.<br>Each mode has its own flight log.</p>`:`<div class="empty"><div class="eyebrow">SIGNAL UNAVAILABLE</div><p>${tab==='global'?'Global rankings need an online leaderboard service.':'Friend rankings need connected pilot accounts.'}<br>Your personal flight log is available offline.</p>${button('VIEW PERSONAL RECORDS','tab-personal')}</div>`}`;
}

function startTap() {
  resetInput(); particles.clear(); tapFlight.reset(); tapBestAnnounced=false;
  state='tapready';page='tap-flight';screen.innerHTML='';screen.className='';
  $('hud').hidden=true;$('arrows').hidden=true;$('tapHud').hidden=false;
  $('toast').textContent='';$('toast').classList.remove('visible');
  $('steerHint').textContent='TAP TO FLY';
  updateTapHud();
}

function tapThrust() {
  if (!tapFlight.tap()) return;
  unlockAudio();state='tap';$('steerHint').textContent='';
  tone(160,.055,'sine',.012);
  if(settings.vibration&&navigator.vibrate)navigator.vibrate(7);
}

function updateTapHud() {
  $('tapScore').textContent=tapFlight.score;
  $('tapBest').textContent=`BEST ${Math.max(tapBest,tapFlight.score)}`;
  $('tapCoins').textContent=tapFlight.coins;
}

function finishTap() {
  if(tapFlight.saved)return;
  tapFlight.saved=true;
  wallet+=tapFlight.coins;save('wilifunkCoins',wallet);
  tapBest=Math.max(tapBest,tapFlight.score);save('spacehullTapBestScore',tapBest);
  tapRecords.push({score:tapFlight.score,coins:tapFlight.coins,stars:tapFlight.stars,date:Date.now()});
  tapRecords.sort((a,b)=>b.score-a.score);tapRecords=tapRecords.slice(0,50);save('spacehullTapRecords',tapRecords);
  save('spacehullTapTotalStars',Math.max(0,Number(read('spacehullTapTotalStars',0))||0)+tapFlight.stars);
}

function updateTap(dt) {
  clock+=dt;
  if(state!=='tapover')tapFlight.step(dt,event=>{
    if(event==='score') { tone(510,.07,'sine',.018); if(tapFlight.score>tapBest&&!tapBestAnnounced){tapBestAnnounced=true;tone(980,.2,'sine',.018);} }
    if(event==='coin')tone(780,.07,'sine',.025);
    if(event==='star')tone(1160,.15,'sine',.025);
    if(event==='crash'){state='tapcrashing';tone(80,.3,'triangle',.06);if(settings.vibration&&navigator.vibrate)navigator.vibrate(40);finishTap();}
    if(event==='over'){state='tapover';show('tap-result');}
  });
  updateTapHud();
  if(humGain&&audio)humGain.gain.setTargetAtTime(settings.music?.014:0,audio.currentTime,.3);
}

function endJourney(home=false) {
  finish();
  if(activeMode==='tap'){tapFlight.status='over';tapFlight.crashTime=.85;}
  if(home)show('home');
  else {state=activeMode==='tap'?'tapover':'ended';show(activeMode==='tap'?'tap-summary':'summary');}
}

function showTapResult(crashed) {
  screen.className='overlay-dim tap-result';
  screen.innerHTML=`<div class="crash-title"><h2 ${crashed?'':'style="color:#e3edff;font-size:21px"'}>${crashed?'CRASHED':'RUN COMPLETE'}</h2><p>${crashed?'KEEP TRYING':'NICE FLIGHT!'}</p></div><div class="summary"><div class="summary-panel"><div class="scores"><div><small>SCORE</small><strong>${tapFlight.score}</strong></div><div><small>BEST</small><strong>${tapBest}</strong></div></div><dl class="stats"><dt>◉ &nbsp; Coins Collected</dt><dd>${tapFlight.coins}</dd><dt>✦ &nbsp; Stars Collected</dt><dd>${tapFlight.stars}</dd><dt>◇ &nbsp; Obstacles Passed</dt><dd>${tapFlight.score}</dd></dl></div><div class="summary-actions">${button(crashed?'↻ &nbsp; TRY AGAIN':'↻ &nbsp; PLAY AGAIN','play','primary')}${button('MAIN MENU','home')}<div class="result-links">${crashed?'<button class="quiet" data-action="tap-summary">FLIGHT SUMMARY</button>':''}<button class="quiet" data-action="share">↗ SHARE</button></div></div></div>`;
}
screen.addEventListener('click', async e => {
 const b = e.target.closest('[data-action]'); if (!b) return; unlockAudio(); tone(380,.045); const a=b.dataset.action;
 if (a==='play') start();
 else if (a==='play-explore') { activeMode='explore'; boardMode='explore'; start(); }
 else if (a==='play-tap') { activeMode='tap'; boardMode='tap'; if (!read('spacehullTapTutorialSeen',false)) show('tap-tutorial'); else start(); }
 else if (a==='tap-help') show('tap-tutorial');
 else if (a==='tap-understood') { save('spacehullTapTutorialSeen',true); activeMode='tap'; boardMode='tap'; start(); }
 else if (a==='board-explore' || a==='board-tap') { boardMode=a.slice(6); show('leaderboard'); }
 else if (a==='tap-summary') show('tap-summary');

 else if (a.startsWith('toggle-')) { const k=a.slice(7); settings[k]=!settings[k]; save('spacerootSettings',settings); show('settings'); }
 else if (a.startsWith('mode-')) { settings.mode=a.slice(5); input.mode=settings.mode; save('spacerootSettings',settings); show('controls'); }
 else if (a.startsWith('tab-')) { tab=a.slice(4); show('leaderboard'); }
 else if (a==='previous' || a==='next') { preview=(preview+(a==='next'?1:2))%3; show('rockets'); }
 else if (a==='equip') { const r=rockets[preview]; if (!unlocked.includes(r.id)) { if(wallet<r.cost) {notify('MORE COINS NEEDED');return;} wallet-=r.cost;unlocked.push(r.id);save('wilifunkCoins',wallet);save('wilifunkUnlockedRockets',unlocked); } selected=r.id;try{localStorage.setItem('wilifunkSelectedRocket',selected);}catch{} show('rockets'); }
 else if (a==='resume') resume();
 else if (a==='end' || a==='abandon') endJourney(a==='abandon');
 else if (a==='share') { const text=activeMode==='tap'?`SPACEHULL · Tap & Fun · ${tapFlight.score} obstacles passed · ${tapFlight.coins} coins.`:`SPACEHULL · Explore · ${run.score} points · ${Math.floor(run.distance)} m into deep space.`;try{if(navigator.share)await navigator.share({title:'SPACEHULL',text});else{await navigator.clipboard.writeText(text);notify('FLIGHT RECORD COPIED');}}catch{notify('SHARING UNAVAILABLE');} }
 else show(a);
});
function start() {
 if (activeMode==='tap') { startTap(); return; }
 $('tapHud').hidden=true;
 resetInput(); obstacles.clear();pickups.clear();particles.clear();ship=pilot();zone=0;spawnClock=.4;pickupClock=1.3;
 run={score:0,coins:0,stars:0,near:0,distance:0,fuel:100,reward:0,shield:0,missions:[false,false,false],saved:false};
 state='launch';page='flight';launchTime=0;screen.className='launching';tone(100,.7,'sine',.07);
}
function begin() {state='playing';screen.innerHTML='';screen.className='';$('hud').hidden=false;$('arrows').hidden=settings.mode!=='arrows';$('steerHint').textContent=settings.mode==='slide'?'↔  SLIDE TO STEER':settings.mode==='glide'?'TOUCH & HOLD TO GUIDE':'';}
function pause() {if(!['playing','tap','tapready'].includes(state))return;pausedFrom=state;state='paused';if(humGain&&audio)humGain.gain.setTargetAtTime(0,audio.currentTime,.1);show('pause');}
function resume() {state=pausedFrom;page='flight';screen.innerHTML='';screen.className='';$('hud').hidden=activeMode==='tap';$('tapHud').hidden=activeMode!=='tap';$('arrows').hidden=activeMode==='tap'||settings.mode!=='arrows';resetInput();}
$('pause').onclick=pause; $('tapPause').onclick=pause;
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();resetInput();if(audio)audio.suspend().catch(()=>{});}else if(audio)audio.resume().catch(()=>{});});
window.addEventListener('blur',()=>{pause();resetInput();});
window.addEventListener('keydown',e=>{if(activeMode==='tap'&&['tap','tapready'].includes(state)&&!e.target.closest('button')&&[' ','ArrowUp','w','W'].includes(e.key)){e.preventDefault();if(!e.repeat)tapThrust();return;}if(['ArrowLeft','ArrowRight','a','d','A','D'].includes(e.key)){if(state!=='playing')return;e.preventDefault();keys.add(e.key.toLowerCase());input.axis=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);}if(e.key==='Escape'){if(['playing','tap','tapready'].includes(state))pause();else if(state==='paused')resume();}});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());input.axis=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);});
let dragX=0,dragShip=0;
app.addEventListener('pointerdown',e=>{if(activeMode==='tap'&&['tap','tapready'].includes(state)){if(!e.target.closest('button')){e.preventDefault();tapThrust();}return;}if(state!=='playing'||pointerId!==null)return;const arrow=e.target.closest('[data-direction]');if(e.target.closest('button')&&!arrow)return;const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*W/rect.width,y=(e.clientY-rect.top)*H/rect.height;if(settings.mode==='arrows'&&!arrow)return;if(settings.mode==='slide'&&y<H*.43)return;pointerId=e.pointerId;app.setPointerCapture(e.pointerId);dragX=x;dragShip=ship.x;input.active=true;input.target=settings.mode==='slide'?ship.x:x;if(arrow)input.axis=Number(arrow.dataset.direction);});
app.addEventListener('pointermove',e=>{if(e.pointerId!==pointerId)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width;input.target=clamp(settings.mode==='slide'?dragShip+x-dragX:x,22,W-22);});
for(const type of ['pointerup','pointercancel','lostpointercapture'])app.addEventListener(type,e=>{if(e.pointerId===pointerId)resetInput();});
function finish(){if(activeMode==='tap'){finishTap();return;}if(!run||run.saved)return;run.saved=true;best=Math.max(best,run.score);wallet+=run.coins+run.reward;save('spaceRocketHighScore',best);save('wilifunkCoins',wallet);records.push({distance:Math.floor(run.distance),score:run.score,date:Date.now()});records.sort((a,b)=>b.distance-a.distance);records=records.slice(0,50);save('spacerootRecords',records);if(Array.isArray(badges)){for(const [score,name] of [[10,'Rookie Pilot'],[25,'Space Ranger'],[50,'Galaxy Commander'],[100,'Cosmic Legend'],[200,'Void Walker'],[500,'Star Lord'],[1000,'Universal Entity']])if(run.score>=score&&!badges.includes(name))badges.push(name);save('spaceRocketBadges',badges);}}
function crash(){if(state!=='playing')return;state='crashing';crashTime=0;resetInput();$('arrows').hidden=true;$('steerHint').textContent='';tone(85,.6,'sawtooth',.07);if(settings.vibration&&navigator.vibrate)navigator.vibrate([45,30,70]);for(let i=0;i<42;i++)emit(ship.x,ship.y,rnd(-130,130),rnd(-150,150),rnd(.4,1.7),'#ff9d58',rnd(1,3));finish();}
function emit(x,y,vx,vy,life,color,size){particles.take({x,y,vx,vy,life,maxLife:life,color,size});}
function spawn(){
 const z=ZONES[zone],gap=rnd(85,305),clearance=zone?76:96;
 const count=zone===0?2:3;
 for(let i=0;i<count;i++){let x=rnd(15,W-15),r=rnd(17,zone?37:30);if(Math.abs(x-gap)<clearance+r)x=gap>W/2?rnd(5,Math.max(6,gap-clearance-r)):rnd(Math.min(W-6,gap+clearance+r),W-5);const roll=Math.random(),type=zone===3&&roll<.18?'field':zone===4&&roll<.3?'meteor':zone>=2&&roll<.5?'wreck':zone>=1&&roll<.2?'satellite':'rock';obstacles.take({x,y:-70-i*25,r,angle:rnd(0,6.28),spin:rnd(-.35,.35),speed:z.speed*(type==='meteor'?1.03:1),vx:zone?rnd(-12,12):0,type,texture:Math.floor(rnd(0,8)),passed:false,near:false,closest:Infinity});}
}
function update(dt){
 if(activeMode==='tap'&&['tapready','tap','tapcrashing','tapover'].includes(state)){updateTap(dt);return;}
 clock+=dt;elapsed+=dt;if(toastTime>0){toastTime-=dt;if(toastTime<=0){$('toast').classList.remove('visible');$('toast').textContent='';}}
 if(state==='launch'){launchTime+=dt;if(launchTime>=1.35)begin();}
 if(state==='playing'){
  const oldX=ship.x,oldY=ship.y;steer(ship,input,dt,rockets.find(r=>r.id===selected).agility);
  const z=ZONES[zone];run.distance+=z.speed*dt*.27;run.fuel=Math.max(0,run.fuel-dt*2.1);run.shield=Math.max(0,run.shield-dt);
  const next=zoneAt(run.distance);if(next!==zone){zone=next;notify(ZONES[zone].name);tone(180,.35);}
  spawnClock-=dt;if(spawnClock<=0){spawn();spawnClock=ZONES[zone].interval;}
  pickupClock-=dt;if(pickupClock<=0){const type=run.fuel<50?'fuel':Math.random()<.25?'star':'coin';pickups.take({x:rnd(42,W-42),y:-25,type,r:10});pickupClock=type==='fuel'?2:1.6;}
  for(const o of obstacles.items){if(!o.active)continue;const ax=o.x-oldX,ay=o.y-oldY;o.y+=o.speed*dt;o.x=clamp(o.x+o.vx*dt,5,W-5);o.angle+=o.spin*dt;const distance=sweptDistance(ax,ay,o.x-ship.x,o.y-ship.y);o.closest=Math.min(o.closest,distance);if(distance<o.r*.76+9){if(run.shield>0){o.active=false;for(let i=0;i<10;i++)emit(o.x,o.y,rnd(-50,50),rnd(-50,50),.5,'#a9e8ff',2);}else{crash();break;}}if(!o.passed&&o.y>ship.y+o.r+12){o.passed=true;run.score++;if(o.closest<o.r*.76+27&&o.closest>=o.r*.76+9){run.near++;run.score+=5;notify('NEAR MISS  +5');tone(640,.1);}}if(o.y>H+80)o.active=false;}
  if(state==='playing')for(const p of pickups.items){if(!p.active)continue;p.y+=z.speed*dt;if(Math.hypot(p.x-ship.x,p.y-ship.y)<25){p.active=false;tone(p.type==='coin'?820:1050,.12);if(p.type==='coin')run.coins++;if(p.type==='fuel'){run.fuel=Math.min(100,run.fuel+25);notify('FUEL +25');}if(p.type==='star'){run.stars++;run.score+=3;if(run.stars%3===0){run.shield=selected==='cosmic_pink'?8:5;notify('SHIELD ONLINE');}}}if(p.y>H+25)p.active=false;}
  if(state==='playing'){for(const [i,done,reward] of [[0,run.stars>=5,25],[1,run.near>=3,30],[2,run.distance>=1000,40]])if(done&&!run.missions[i]){run.missions[i]=true;run.reward+=reward;notify(`MISSION COMPLETE  +${reward} COINS`);}if(run.fuel<=0){finish();state='ended';show('summary');}}
  if(run.distance>150)$('steerHint').textContent='';
  hudClock+=dt;if(hudClock>.1){hudClock=0;$('fuelFill').style.width=`${run.fuel}%`;$('fuelFill').style.background=run.fuel<25?'#ee906b':'#57dfb5';$('coins').textContent=run.coins;$('distance').textContent=Math.floor(run.distance).toLocaleString();$('danger').textContent=`0${zone+1} / ${['CALM','ELEVATED','HIGH','SEVERE','EXTREME'][zone]}`;}
 }
 if(state==='crashing'){crashTime+=dt;ship.bank+=dt*1.6;ship.x+=Math.sin(crashTime*2)*dt*14;ship.y+=(180-ship.y)*(1-Math.exp(-dt*2.4));for(const o of obstacles.items)if(o.active)o.y+=o.speed*dt*.12;if(crashTime>1.65){state='crashed';show('crashed');}}
 if(state!=='paused')for(const p of particles.items){if(!p.active)continue;p.life-=dt;if(p.life<=0)p.active=false;else{p.x+=p.vx*dt;p.y+=p.vy*dt;}}
 if(state==='playing'&&Math.random()<quality)emit(ship.x+rnd(-3,3),ship.y+22,-ship.vx*.12,rnd(65,120),.45,'#64bdff',rnd(.6,1.6));
 if(humGain&&audio)humGain.gain.setTargetAtTime(settings.music&&state!=='paused'?.018:0,audio.currentTime,.3);
}
// Artwork is generated once into reusable textures. No downloaded assets or per-frame filters.
function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
let seed=784;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const stars=Array.from({length:165},()=>({x:rand()*W,y:rand()*H,r:.3+rand()*.9,depth:.2+rand()*.8,alpha:.15+rand()*.65}));
const nebula=surface(390,780);{const c=nebula.getContext('2d');for(let i=0;i<38;i++){const x=rand()*W,y=rand()*H,r=rand()*130+40,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%2?'#3a497d0c':'#59417409');g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(0,0,W,H);}}
const rockTextures=Array.from({length:8},(_,index)=>{const c=surface(128,128),g=c.getContext('2d');const vertices=Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2,r=45+rand()*13;return [64+Math.cos(a)*r,64+Math.sin(a)*r];});g.beginPath();vertices.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();const grad=g.createLinearGradient(20,5,105,115);grad.addColorStop(0,index%2?'#9995aa':'#8b98ae');grad.addColorStop(.25,'#54617b');grad.addColorStop(.7,'#222e47');grad.addColorStop(1,'#101a2b');g.fillStyle=grad;g.fill();g.save();g.clip();for(let j=0;j<25;j++){const x=rand()*128,y=rand()*128,r=4+rand()*14;g.beginPath();g.moveTo(x-r,y);g.lineTo(x-r*.5,y-r);g.lineTo(x+r*.65,y-r*.75);g.lineTo(x+r,y+r*.4);g.lineTo(x,y+r);g.closePath();g.fillStyle=j%3?'#111c305e':'#b8b1b123';g.fill();g.beginPath();g.moveTo(x-r,y);g.lineTo(x-r*.5,y-r);g.lineTo(x+r*.65,y-r*.75);g.strokeStyle='#c0c6d030';g.lineWidth=1.3;g.stroke();}g.restore();return c;});
const planet=surface(520,520);{const c=planet.getContext('2d');c.save();c.beginPath();c.arc(260,260,248,0,Math.PI*2);c.clip();const g=c.createLinearGradient(10,30,440,430);g.addColorStop(0,'#758fc6');g.addColorStop(.22,'#4969a4');g.addColorStop(.6,'#253d69');g.addColorStop(1,'#040b18');c.fillStyle=g;c.fillRect(0,0,520,520);for(let i=0;i<1600;i++){const x=rand()*520,y=rand()*520,r=rand()*13+2;c.beginPath();c.ellipse(x,y,r*2,r,rand()*3,0,7);c.fillStyle=i%3?'#07142c25':'#88a5de12';c.fill();}const shadow=c.createRadialGradient(135,100,30,310,300,290);shadow.addColorStop(0,'#00000000');shadow.addColorStop(.6,'#02091412');shadow.addColorStop(1,'#02071190');c.fillStyle=shadow;c.fillRect(0,0,520,520);c.restore();c.beginPath();c.arc(260,260,248,3.65,5.3);c.strokeStyle='#a2bff39c';c.lineWidth=2;c.stroke();}
function drawRocket(x,y,size,bank,engine,fin){ctx.save();ctx.translate(x,y);ctx.rotate(bank);ctx.scale(size,size);if(engine){const length=36+Math.sin(clock*32)*5+Math.abs(ship.vx)*.035;const g=ctx.createLinearGradient(0,16,0,16+length);g.addColorStop(0,'#d4f6ff');g.addColorStop(.2,'#51ccffb0');g.addColorStop(.55,'#256cea65');g.addColorStop(1,'#235cff00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-5,18);ctx.quadraticCurveTo(-9,33,0,18+length);ctx.quadraticCurveTo(9,33,5,18);ctx.fill();ctx.fillStyle='#d4f7ff';ctx.fillRect(-2,17,4,9);}
 ctx.fillStyle=fin;ctx.beginPath();ctx.moveTo(-6,-6);ctx.lineTo(-17,17);ctx.lineTo(-16,25);ctx.lineTo(-6,16);ctx.lineTo(6,16);ctx.lineTo(16,25);ctx.lineTo(17,17);ctx.lineTo(6,-6);ctx.fill();
 const body=ctx.createLinearGradient(-8,0,8,0);body.addColorStop(0,'#7b8ca5');body.addColorStop(.4,'#f5f2e7');body.addColorStop(.7,'#d5dfec');body.addColorStop(1,'#778da9');ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(0,-28);ctx.bezierCurveTo(-8,-17,-10,4,-7,17);ctx.lineTo(7,17);ctx.bezierCurveTo(10,4,8,-17,0,-28);ctx.fill();ctx.fillStyle=fin;ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(-5,-15);ctx.lineTo(5,-15);ctx.fill();ctx.fillStyle='#223a56';ctx.beginPath();ctx.ellipse(0,-5,4.8,6.4,0,0,7);ctx.fill();ctx.strokeStyle='#8ebce1';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#69a9cf';ctx.beginPath();ctx.ellipse(-1.2,-7,1.4,2,0,0,7);ctx.fill();ctx.fillStyle='#172a42';ctx.fillRect(-5,15,10,5);ctx.strokeStyle='#526983';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(0,14);ctx.stroke();ctx.restore();}
function draw(){
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
 if(activeMode==='tap'&&(['tapready','tap','tapcrashing','tapover'].includes(state)||state==='paused')){renderTap(ctx,tapFlight,{stars,nebula,planet},rockets.find(r=>r.id===selected).fin,clock,quality,state==='paused');return;}
 ctx.fillStyle='#030914';ctx.fillRect(0,0,W,H);
 const flying=['playing','launch','paused','crashing','crashed','ended'].includes(state),travel=run&&flying?run.distance:clock*2;
 ctx.save();if(state==='crashing'&&!motionReduced&&crashTime<.4)ctx.translate(rnd(-4,4)*(1-crashTime/.4),rnd(-4,4)*(1-crashTime/.4));
 ctx.drawImage(nebula,0,0);if(zone>=2){ctx.save();ctx.translate(90,125+(travel*.025)%400);ctx.rotate(-.45);const galaxy=ctx.createRadialGradient(0,0,0,0,0,45);galaxy.addColorStop(0,'#c3caf322');galaxy.addColorStop(1,'#6a78bd00');ctx.scale(1,.25);ctx.fillStyle=galaxy;ctx.fillRect(-45,-45,90,90);ctx.restore();}if(zone>=1&&Math.floor(clock/13)%3===1){const cometProgress=clock%13/13;ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle='#93b2e0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(W*cometProgress-45,H*.16+cometProgress*80);ctx.lineTo(W*cometProgress,H*.16+cometProgress*80+22);ctx.stroke();ctx.restore();}if(zone>0){ctx.globalAlpha=zone===3?.18:.065;ctx.fillStyle=ZONES[zone].tint;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
 for(const s of stars){ctx.globalAlpha=s.alpha;ctx.fillStyle=s.depth>.8?'#bfd6ff':'#8297bf';const sy=(s.y+travel*s.depth*.7)%H;ctx.fillRect(s.x-(flying?ship.bank*6*s.depth:0),sy,s.r,s.r);if(s.r>1.1&&s.alpha>.7){ctx.globalAlpha=.13;ctx.fillRect(s.x-3,sy,7,.7);ctx.fillRect(s.x,sy-3,.7,7);}}ctx.globalAlpha=1;
 if(!flying||state==='launch'){ctx.save();const launchBlend=state==='launch'?clamp(launchTime/1.35,0,1):0;ctx.globalAlpha=1-launchBlend;ctx.translate(0,-launchBlend*110);ctx.drawImage(planet,245,-65,265,265);ctx.globalAlpha=.7*(1-launchBlend);ctx.drawImage(planet,-48,420,126,126);ctx.globalAlpha=1-launchBlend;if(page==='home'||state==='launch')ctx.drawImage(planet,-125,525,645,645);ctx.restore();}
 else {const py=-220+(travel*.12)%1450;ctx.globalAlpha=.48;ctx.drawImage(planet,zone%2?-155:235,py,310,310);ctx.globalAlpha=1;if(zone===2||zone===3){ctx.save();ctx.translate(300,py+160);ctx.rotate(-.4);ctx.scale(1,.28);ctx.strokeStyle='#8f9dc828';ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,0,195,0,7);ctx.stroke();ctx.restore();}}
 if(flying){for(const o of obstacles.items){if(!o.active)continue;ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.angle);if(o.type==='field'){ctx.strokeStyle='#a09cea60';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,o.r*.8,0,7);ctx.stroke();ctx.fillStyle='#9d94e81c';ctx.fill();ctx.beginPath();ctx.ellipse(0,0,o.r,o.r*.3,clock,0,7);ctx.stroke();}else if(o.type==='satellite'||o.type==='wreck'){ctx.fillStyle='#21344c';ctx.fillRect(-o.r,-o.r*.35,o.r*2,o.r*.7);ctx.strokeStyle='#78849b';ctx.lineWidth=1;ctx.strokeRect(-o.r,-o.r*.35,o.r*2,o.r*.7);for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*o.r/3,-o.r*.35);ctx.lineTo(i*o.r/3,o.r*.35);ctx.stroke();}ctx.fillStyle=o.type==='wreck'?'#a66c58':'#a6a5a7';ctx.fillRect(-6,-13,12,26);if(o.type==='wreck'){ctx.fillStyle='#050c19';ctx.fillRect(8,-10,20,10);ctx.fillStyle='#e69a6244';ctx.fillRect(-3,6,4,7);}ctx.strokeStyle='#b6c6d3';ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(4,-25);ctx.stroke();}else{if(o.type==='meteor'){const g=ctx.createLinearGradient(0,-120,0,0);g.addColorStop(0,'#ff874000');g.addColorStop(1,'#ff874063');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-120);ctx.lineTo(o.r*.6,0);ctx.lineTo(-o.r*.6,0);ctx.fill();}ctx.drawImage(rockTextures[o.texture],-o.r,-o.r,o.r*2,o.r*2);}ctx.restore();}
 for(const p of pickups.items){if(!p.active)continue;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=p.type==='fuel'?'#77e7de':'#f5cd74';ctx.strokeStyle=p.type==='fuel'?'#a4fff0':'#fff0b4';if(p.type==='coin'){ctx.beginPath();ctx.ellipse(0,0,6+Math.abs(Math.sin(clock*2))*2,9,0,0,7);ctx.fill();ctx.stroke();ctx.strokeStyle='#a96c29';ctx.beginPath();ctx.ellipse(0,0,4,6,0,0,7);ctx.stroke();}else if(p.type==='star'){ctx.beginPath();for(let i=0;i<10;i++){let a=i*Math.PI/5-Math.PI/2,r=i%2?4:10;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();}else{ctx.strokeRect(-7,-10,14,20);ctx.fillRect(-4,-4,8,11);ctx.fillRect(-3,-13,6,3);}ctx.restore();}
 }
 for(const p of particles.items)if(p.active){ctx.globalAlpha=Math.max(0,p.life/p.maxLife);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;
 if(page==='home'||state==='launch'){const t=state==='launch'?clamp(launchTime/1.35,0,1):0;drawRocket(W/2,300+(602-300)*t+Math.sin(clock*1.4)*2,1.03-t*.17,0,true,rockets.find(r=>r.id===selected).fin);}
 else if(page==='rockets'){const el=document.querySelector('.rocket-space'),rect=el?.getBoundingClientRect(),base=canvas.getBoundingClientRect();drawRocket(195,rect?(rect.top-base.top+rect.height/2)*H/base.height:300,2.5,Math.sin(clock*.7)*.025,true,rockets[preview].fin);}
 else if(flying){if(state==='playing'&&toastTime>1.5&&$('toast').textContent.startsWith('NEAR MISS')){ctx.strokeStyle='#a9deef40';ctx.beginPath();ctx.arc(ship.x,ship.y,30+(2.2-toastTime)*45,0,7);ctx.stroke();}if(run?.shield>0){ctx.strokeStyle='#87dffb80';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(ship.x,ship.y,23,35,ship.bank,0,7);ctx.stroke();}drawRocket(ship.x,ship.y,.86,ship.bank,state==='playing'||state==='paused',rockets.find(r=>r.id===selected).fin);}
 // Sparse out-of-focus foreground dust adds another depth plane without hiding the route.
 if(flying&&quality>.6)for(let i=0;i<5;i++){ctx.fillStyle='#8bafe018';ctx.beginPath();ctx.arc((i*97+31)%W,(i*163+travel*2)%H,2,0,7);ctx.fill();}
 ctx.restore();
}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}
const renderTap = createTapRenderer(surface);
window.addEventListener('resize',resize);resize();show('home');let last=performance.now();
function frame(now){const raw=(now-last)/1000;last=now;if(raw>.023)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(slowFrames>90)quality=.5;const dt=Math.min(raw,.033);if(state!=='paused')update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);

