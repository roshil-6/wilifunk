import { hangarUI, rocketListUI, mapUI, missionsUI, cosmeticsUI, storeUI } from './progression-ui.js?v=explore-waves-4';
import { expedition, pacing, eventFor, nearMiss, decayCombo } from './expedition.js?v=explore-waves-4';
import { ROCKETS, EXPLORE_BADGES, BALANCE, REGIONS, EVENTS, EXPLORE_MILESTONES, TAP_MILESTONES, COSMETICS, MISSIONS, STORE_ITEMS } from './config.js?v=explore-waves-4';
import { createSystems, tickSystems, takeImpact, activateSystem, attractCoin, rocketById } from './rocket-systems.js?v=explore-waves-4';
import { ProgressStore, Analytics, RewardedAds } from './progression.js?v=explore-waves-4';
import { TapFlight } from './tap-flight.js?v=explore-waves-4';
import { createTapRenderer, drawSideRocket, drawMine, drawSystemAura } from './tap-renderer.js?v=explore-waves-4';
import { WIDTH as W, HEIGHT as H, clamp, pilot, steer, sweptDistance, Pool, ZONES, zoneAt } from './flight.js?v=explore-waves-4';
const $ = id => document.getElementById(id), canvas = $('universe'), ctx = canvas.getContext('2d', { alpha: false });
const screen = $('screen'), app = $('app');
const menuArt = typeof Image !== 'undefined' ? new Image() : null;
if(menuArt) menuArt.src = './art/spacehull-cinematic.png';
const read = (k, fallback) => { try { const s = localStorage.getItem(k); return s === null ? fallback : JSON.parse(s); } catch { return fallback; } };
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { $('storageNotice').hidden = false; } }
function legacyString(k, fallback) { try { return localStorage.getItem(k) || fallback; } catch { return fallback; } }
const rockets = ROCKETS;
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
const progress = new ProgressStore(localStorage), analytics=new Analytics(), ads=new RewardedAds();
wallet=progress.data.coins;unlocked=progress.data.ownedRockets;selected=progress.data.equippedRocket;best=progress.data.exploreBestScore;records=progress.data.exploreRecords;tapBest=progress.data.tapBestScore;tapRecords=progress.data.tapRecords;settings={...settings,...progress.data.settings};
let bestDistance=progress.data.exploreBestDistance,trial=null,exp=expedition(),missionTab='daily',mapMode='explore',boardClass='open',boardMetric='distance',rewardQueue=[],rewardReturn='home',runSequence=0;
rewardQueue.push(...progress.advance('explore',bestDistance),...progress.advance('tap',tapBest));wallet=progress.data.coins;
const tapFlight = new TapFlight();
let tapBestAnnounced = false, lastTapTime = 0, activeMagnetTime = 0;

let state = 'home', page = 'home', ship = pilot(), run, elapsed = 0, launchTime = 0, crashTime = 0, zone = 0, clock = 0, spawnClock = 0, pickupClock = 0, toastTime = 0, preview = 0, tab = 'personal', pausedFrom = 'playing';
let systems=createSystems(selected);
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
function updateItemHud(){
 const m=progress.itemCount('magnet'),k=progress.itemCount('key'),s=progress.itemCount('shield_pack'),f=progress.itemCount('fuel_tank');
 const html=`${m?`🧲${m} `:''}${k?`🔑${k} `:''}${s?`🛡️${s} `:''}${f?`⛽${f}`:''}`;
 if($('exploreItemHud'))$('exploreItemHud').innerHTML=html;
 if($('tapItemHud'))$('tapItemHud').innerHTML=html;
}
function triggerDoubleTapConsumable(){
 const now=performance.now();
 if(now-lastTapTime<320){
  lastTapTime=0;
  if(progress.itemCount('magnet')>0&&activeMagnetTime<=0){
   progress.useItem('magnet');activeMagnetTime=8;notify('MAGNET ACTIVATED (8s)');tone(950,.18);
  }else if(progress.itemCount('shield_pack')>0){
   progress.useItem('shield_pack');
   const s=activeMode==='tap'?tapFlight.systems:systems;
   if(activeMode==='tap')s.shield=Math.max(s.shield,6);
   else run.shield=Math.max(run.shield,6);
   notify('SHIELD PACK ACTIVATED');tone(980,.18);
  }
  updateItemHud();
 }else lastTapTime=now;
}
function show(name) {
 $('flightProgress').hidden=true;page = name; screen.className = ''; resetInput(); toastTime=0; $('toast').textContent=''; $('toast').classList.remove('visible'); $('hud').hidden = true; $('tapHud').hidden = true; $('arrows').hidden = true; $('steerHint').textContent = ''; $('abilityButton').hidden=true; $('eventBanner').textContent='';
 if(['space-map','missions','rocket-list','cosmetics','store','milestone','upgrade','reset-confirm'].includes(name)){showMeta(name);return;}
 if (name === 'tap-result' || name === 'tap-summary') { state='tapover'; showTapResult(name === 'tap-result'); return; }
 if (name === 'tap-tutorial') { showTapTutorial(); return; }
 if (name !== 'crashed' && name !== 'summary' && name !== 'pause') state = 'menu';
 if (name === 'home') {
  if(trial){selected=trial.previous;trial=null;}
  state = 'home'; ship = pilot(); zone = 0; particles.clear();
  screen.className = 'open-home';
  screen.innerHTML = `<div class="home-utility"><button class="quiet" data-action="space-map" aria-label="Space Map">◎</button><span class="home-wallet">◉ ${wallet}</span><button class="quiet" data-action="store" aria-label="Store" style="font-size:18px">🛒</button><button class="quiet" data-action="settings" aria-label="Settings">⚙</button></div><div class="home-heading"><h1>SPACEHULL</h1><p>EXPLORE. SURVIVE. GO FURTHER.</p></div><nav class="home-nav"><div class="flight-choices">${button('<span class="play-glyph">▶</span><span><strong>EXPLORE</strong><small>Dodge. Survive. Go further.</small></span>','play-explore','flight-choice')}${button('<span class="play-glyph">✦</span><span><strong>TAP &amp; FUN</strong><small>Tap. Fly. Find your rhythm.</small></span>','play-tap','flight-choice')}</div><div class="home-dock">${button(rocketMark()+'<span>ROCKETS</span>','rockets')}${button('<span class="dock-glyph" aria-hidden="true">🛒</span><span>STORE</span>','store')}${button('<span class="dock-glyph" aria-hidden="true">▥</span><span>LEADERBOARDS</span>','leaderboard')}${button('<span class="dock-glyph" aria-hidden="true">✧</span><span>MISSIONS</span>','missions')}</div></nav><footer class="cinema-footer">A SMALL ROCKET. A LARGER UNIVERSE.</footer>`;
 } else if (name === 'settings') {
  screen.innerHTML = `${header('SETTINGS')}<div class="page-content">${['sound','music','vibration'].map(k => `<div class="settings-row"><span>${k[0].toUpperCase()+k.slice(1)}</span><button class="toggle ${settings[k]?'on':''}" role="switch" aria-label="${k}" aria-checked="${settings[k]}" data-action="toggle-${k}"><i></i></button></div>`).join('')}<div class="settings-row"><span>Explore controls</span><button class="quiet" data-action="controls">${modeName()} &nbsp; ›</button></div><div class="settings-row"><span>Tap &amp; Fun controls</span><button class="quiet" data-action="tap-help">Tap &nbsp; ›</button></div><p class="small-note">Move. Dodge. Explore.<br>Forward thrust is automatic. You control the flight path.</p><div class="settings-row"><span>Graphics</span><button class="quiet" data-action="graphics">${settings.graphics||'AUTO'} ›</button></div><div class="settings-row"><span>Progress</span><button class="quiet" data-action="reset-confirm">Reset progress ›</button></div><div class="missions"><div class="eyebrow">EXPLORE MISSIONS / EVERY RUN</div><div class="mission-row"><span>Collect 5 stars</span><span>+25 ◉</span></div><div class="mission-row"><span>Make 3 near misses</span><span>+30 ◉</span></div><div class="mission-row"><span>Travel 1,000 meters</span><span>+40 ◉</span></div><p class="small-note">Every 3 stars activates a temporary shield.<br>Collect cyan fuel cells to extend your journey.</p></div></div>`;
 } else if (name === 'controls') {
  const modes = [['slide','↔','Side Slide','Drag left or right in the lower half. Smooth steering with a little inertia.'],['arrows','〈 〉','Arrow Controls','Hold the left or right HUD control to steer. Release to stabilize.'],['glide','◎','Touch & Hold Glide','Hold anywhere to guide the ship toward your finger. Release to stabilize.']];
  screen.innerHTML = `${header('CONTROLS','settings')}${modes.map(([id,icon,title,desc])=>`<button class="control-card ${settings.mode===id?'selected':''}" data-action="mode-${id}"><span class="control-symbol">${icon}</span><span><strong>${title}</strong><p>${desc}</p></span><span class="check">${settings.mode===id?'●':'○'}</span></button>`).join('')}<p class="small-note">Keyboard: ← / → or A / D. Escape pauses.<br>Your control choice is saved automatically.</p>`;
 } else if (name === 'rockets') {
  screen.innerHTML=hangarUI(progress,preview);
 } else if (name === 'leaderboard') {
  showLeaderboard();
 } else if (name === 'pause') {
  screen.className = 'overlay-dim open-pause'; screen.innerHTML = `<div class="pause-content"><h2>PAUSED</h2><i class="title-rule"></i>${button('RESUME','resume','primary')}${button('END JOURNEY','end')}${button('EXIT RUN','abandon','exit-run')}</div><div class="pause-tip"><span>TIP</span><i class="title-rule"></i><p>${activeMode==='tap'?'Center your flight through gaps<br>to build a Perfect Pass streak.':'Near misses increase<br>your score multiplier.'}</p></div>`;
 } else if (name === 'crashed' || name === 'summary') {
  state=name==='crashed'?'crashed':'ended';
  const crashed = name === 'crashed'; screen.className = 'overlay-dim open-result ' + (crashed?'impact-result':'complete-result');
  screen.innerHTML = `<div class="crash-title">${crashed?'<h2>CRASHED</h2><p>THE JOURNEY CONTINUES</p>':'<h2 style="color:#dce9ff;font-size:19px">JOURNEY ENDED</h2><p style="color:#98b1d9">KEEP EXPLORING</p>'}</div><div class="summary"><div class="summary-panel"><div class="record-duo"><div><small>DISTANCE</small><strong>${Math.floor(run.distance).toLocaleString()} m</strong></div><div><small>BEST DISTANCE</small><strong>${Math.floor(bestDistance).toLocaleString()} m</strong></div></div>${crashed?`<div class="scores"><div><small>SCORE</small><strong>${run.score}</strong></div><div><small>BEST</small><strong>${best}</strong></div></div>`:`<div class="center"><div class="eyebrow">YOUR SCORE</div><div class="big-score">${run.score}</div><p>BEST SCORE: ${best}</p></div>`}<dl class="stats"><dt>◉ &nbsp; Coins Collected</dt><dd>${run.coins}</dd><dt>✦ &nbsp; Stars Reached</dt><dd>${run.stars}</dd><dt>◇ &nbsp; Near Misses</dt><dd>${run.near}</dd><dt>Mission rewards</dt><dd>+${run.reward} ◉</dd></dl></div><div class="summary-actions">${button(crashed?'↻ &nbsp; TRY AGAIN':'↻ &nbsp; PLAY AGAIN','play',`primary ${crashed?'crash':''}`)}${button('MAIN MENU','home')}${adActions()}${rewardQueue.length?button('NEW REWARDS','view-rewards'):''}<div style="display:flex;justify-content:center;gap:20px">${crashed?'<button class="quiet" data-action="summary">FLIGHT SUMMARY</button>':''}<button class="quiet" data-action="share">↗ SHARE</button></div></div></div>`;
 }
}
function modeName() { return ({slide:'Side Slide',arrows:'Arrow Controls',glide:'Touch & Hold Glide'})[settings.mode]; }
function showTapTutorial() {
  state='menu';
  screen.innerHTML=`${header('HOW TO PLAY')}<div class="tap-tutorial"><div class="tutorial-flight"><svg viewBox="0 0 250 105" aria-hidden="true"><path d="M45 75 Q100 -5 180 37 Q205 49 204 78" fill="none" stroke="#abc1e2" stroke-width="1.5" stroke-dasharray="5 6"/><path d="M40 75 L65 63 L55 83 Z" fill="#e9eff9"/><circle cx="54" cy="72" r="3" fill="#6fbadf"/></svg><span>◎</span></div><h2>TAP TO FLY</h2><p>Tap to rise. Release to fall.</p><div class="eyebrow">AVOID OBSTACLES</div><p>Collect coins and stars.<br>Pass a gap to score a point.</p></div>${button('GOT IT','tap-understood','primary')}<p class="small-note center">Keyboard: Space, ↑ or W. Escape pauses.</p>`;
}

function showLeaderboard() {
 const isTap=boardMode==='tap';let rows=[...(isTap?tapRecords:records)];if(boardClass==='classic')rows=rows.filter(r=>r.rocket==='pioneer'&&!r.assisted);rows.sort((a,b)=>isTap||boardMetric==='score'?b.score-a.score:boardMetric==='coins'?(b.coins||0)-(a.coins||0):b.distance-a.distance);
 screen.innerHTML=`${header(isTap?'TAP & FUN LEADERBOARD':'DEEP SPACE RECORDS')}<div class="mode-tabs"><button class="${isTap?'':'active'}" data-action="board-explore">EXPLORE</button><button class="${isTap?'active':''}" data-action="board-tap">TAP & FUN</button></div><div class="tabs"><button data-action="class-open" class="${boardClass==='open'?'active':''}">OPEN CLASS</button><button data-action="class-classic" class="${boardClass==='classic'?'active':''}">CLASSIC · SCOUT</button></div>${isTap?'':`<div class="mode-tabs"><button data-action="metric-distance" class="${boardMetric==='distance'?'active':''}">DISTANCE</button><button data-action="metric-coins" class="${boardMetric==='coins'?'active':''}">COINS COLLECTED</button></div>`}<div class="eyebrow">PERSONAL FLIGHT LOG</div><table><thead><tr><th>#</th><th>PILOT / CRAFT</th><th>${isTap?'SCORE':boardMetric==='coins'?'COINS':'DISTANCE'}</th></tr></thead><tbody>${rows.slice(0,10).map((r,i)=>`<tr class="${i===0?'you':''}"><td class="rank-${i}">${i+1}</td><td>You <small>${r.rocket?rocketById(r.rocket).name:'LEGACY'}${r.assisted?' · ASSISTED':''}</small></td><td>${!isTap&&boardMetric==='coins'?(r.coins||0).toLocaleString():Math.floor(isTap||boardMetric==='score'?r.score:r.distance).toLocaleString()}${isTap||boardMetric==='score'||boardMetric==='coins'?'':' m'}</td></tr>`).join('')}</tbody></table>${rows.length?'':'<p class="empty">No qualifying flights yet.</p>'}<p class="small-note">On-device records. Classic requires Scout and an unassisted run. Older records with unknown craft stay in Open.</p>`;
}

function startTap() {
 tapFlight.id=`${Date.now()}-${++runSequence}`;
  resetInput(); particles.clear(); tapFlight.reset(selected); tapBestAnnounced=false;
  state='tapready';page='tap-flight';screen.innerHTML='';screen.className='';
  $('hud').hidden=true;$('arrows').hidden=true;$('tapHud').hidden=false;
  $('toast').textContent='';$('toast').classList.remove('visible');
  $('steerHint').textContent='TAP TO FLY';
  updateTapHud(); updateItemHud();
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
  $('tapCoins').textContent=tapFlight.coins;updateFlightReadout();
}

function finishTap() {
 if(trial||tapFlight.saved)return;tapFlight.saved=true;
 wallet+=tapFlight.coins;tapBest=Math.max(tapBest,tapFlight.score);
 tapRecords.push({score:tapFlight.score,coins:tapFlight.coins,stars:tapFlight.stars,perfects:tapFlight.perfects,date:Date.now(),rocket:tapFlight.systems.id,assisted:tapFlight.assisted});tapRecords.sort((a,b)=>b.score-a.score);tapRecords=tapRecords.slice(0,100);
 progress.metric('tapStars',tapFlight.stars);save('spacehullTapTotalStars',progress.data.totals.tapStars);persistProfile();rewardQueue.push(...progress.advance('tap',tapBest));pullProfile();persistProfile();analytics.track('run_ended',{mode:'tap',score:tapFlight.score,perfects:tapFlight.perfects});
}

function updateTap(dt) {
  clock+=dt;tickToast(dt);updateAbility(tapFlight.systems);
  if(state!=='tapover')tapFlight.step(dt,event=>{
    if(event==='score') { analytics.track('tap_score_reached',{score:tapFlight.score});tone(510,.07,'sine',.018); if(tapFlight.score>tapBest&&!tapBestAnnounced){tapBestAnnounced=true;tone(980,.2,'sine',.018);} }
    if(event==='perfect'){notify(`PERFECT ×${tapFlight.perfectStreak}`);progress.metric('perfectStreak',tapFlight.perfectStreak,true);analytics.track('perfect_pass',{streak:tapFlight.perfectStreak});tone(1050,.1);}
    if(event==='skim'){notify('SKIM +1');tone(700,.08);}
    if(event==='shield'){notify('SHIELD ONLINE');tone(960,.16);}
    if(event==='shield-hit'){notify('SHIELD CLEARED THE WAY');tone(320,.1);}
    if(event==='mine'){tone(90,.25,'sawtooth');}
    if(event==='upgrade')show('upgrade');
    if(event==='damage'){notify('ARMOUR BROKEN');tone(130,.15,'triangle');}
    if(event==='coin')tone(780,.07,'sine',.025);
    if(event==='star')tone(1160,.15,'sine',.025);
    if(event==='crash'){
      if(progress.itemCount('key')>0){
        progress.useItem('key');tapFlight.status='playing';tapFlight.systems.shield=4;
        notify('🔑 REVIVED BY KEY!');tone(1100,.3);updateItemHud();return;
      }
      analytics.track('crash_reason',{mode:'tap',reason:'impact'});state='tapcrashing';tone(80,.3,'triangle',.06);if(settings.vibration&&navigator.vibrate)navigator.vibrate(40);finishTap();
    }
    if(event==='over'){state='tapover';show('tap-result');}
  });
  updateTapHud();
  if(humGain&&audio)humGain.gain.setTargetAtTime(settings.music?.014:0,audio.currentTime,.3);
}

function endJourney(home=false) {
 if(trial){endTrial();return;}
  finish();
  if(activeMode==='tap'){tapFlight.status='over';tapFlight.crashTime=.85;}
  if(home)show('home');
  else {state=activeMode==='tap'?'tapover':'ended';show(activeMode==='tap'?'tap-summary':'summary');}
}

function showTapResult(crashed) {
  screen.className='overlay-dim tap-result open-result '+(crashed?'impact-result':'complete-result');
  screen.innerHTML=`<div class="crash-title"><h2 ${crashed?'':'style="color:#e3edff;font-size:21px"'}>${crashed?'CRASHED':'RUN COMPLETE'}</h2><p>${crashed?'KEEP TRYING':'NICE FLIGHT!'}</p></div><div class="summary"><div class="summary-panel"><div class="scores"><div><small>SCORE</small><strong>${tapFlight.score}</strong></div><div><small>BEST</small><strong>${tapBest}</strong></div></div><dl class="stats"><dt>◉ &nbsp; Coins Collected</dt><dd>${tapFlight.coins}</dd><dt>✦ &nbsp; Stars Collected</dt><dd>${tapFlight.stars}</dd><dt>◇ &nbsp; Obstacles Passed</dt><dd>${tapFlight.obstaclesPassed}</dd><dt>◎ &nbsp; Perfect Passes</dt><dd>${tapFlight.perfects}</dd></dl></div><div class="summary-actions">${button(crashed?'↻ &nbsp; TRY AGAIN':'↻ &nbsp; PLAY AGAIN','play','primary')}${button('MAIN MENU','home')}${adActions()}${rewardQueue.length?button('NEW REWARDS','view-rewards'):''}<div class="result-links">${crashed?'<button class="quiet" data-action="tap-summary">FLIGHT SUMMARY</button>':''}<button class="quiet" data-action="share">↗ SHARE</button></div></div></div>`;
}
screen.addEventListener('click', async e => {
 const b = e.target.closest('[data-action]'); if (!b) return; unlockAudio(); tone(380,.045); const a=b.dataset.action;
 if(handleMetaAction(a))return;
 if (a==='play') start();
 else if (a==='play-explore') { activeMode='explore'; boardMode='explore';analytics.track('mode_selected',{mode:activeMode});start(); }
 else if (a==='play-tap') { activeMode='tap'; boardMode='tap';analytics.track('mode_selected',{mode:activeMode});if (!read('spacehullTapTutorialSeen',false)) show('tap-tutorial'); else start(); }
 else if (a==='tap-help') show('tap-tutorial');
 else if (a==='tap-understood') { save('spacehullTapTutorialSeen',true); activeMode='tap'; boardMode='tap'; start(); }
 else if (a==='board-explore' || a==='board-tap') { boardMode=a.slice(6); show('leaderboard'); }
 else if (a==='tap-summary') show('tap-summary');

 else if (a.startsWith('toggle-')) { const k=a.slice(7); settings[k]=!settings[k]; save('spacerootSettings',settings);persistProfile();show('settings'); }
 else if (a.startsWith('mode-')) { settings.mode=a.slice(5); input.mode=settings.mode; save('spacerootSettings',settings);persistProfile();show('controls'); }
 else if (a.startsWith('tab-')) { tab=a.slice(4); show('leaderboard'); }
 else if (a==='previous' || a==='next') { preview=(preview+(a==='next'?1:rockets.length-1))%rockets.length; show('rockets'); }
 else if (a==='equip') { const r=rockets[preview];if(!unlocked.includes(r.id)){if(!progress.purchase(r.id)){notify('REQUIREMENTS NOT YET MET');return;}analytics.track('rocket_purchased',{id:r.id});pullProfile();}selected=r.id;persistProfile();analytics.track('rocket_equipped',{id:r.id});show('rockets');}
 else if (a==='resume') resume();
 else if (a==='end' || a==='abandon') endJourney(a==='abandon');
 else if (a==='share') { const text=activeMode==='tap'?`SPACEHULL · Tap & Fun · ${tapFlight.score} obstacles passed · ${tapFlight.coins} coins.`:`SPACEHULL · Explore · ${run.score} points · ${Math.floor(run.distance)} m into deep space.`;try{if(navigator.share)await navigator.share({title:'SPACEHULL',text});else{await navigator.clipboard.writeText(text);notify('FLIGHT RECORD COPIED');}}catch{notify('SHARING UNAVAILABLE');} }
 else show(a);
});
function start() {
 analytics.track('run_started',{mode:activeMode,rocket:selected,trial:Boolean(trial)});
 if (activeMode==='tap') { startTap(); return; }
 $('tapHud').hidden=true;
 resetInput(); obstacles.clear();pickups.clear();particles.clear();ship=pilot();zone=0;systems=createSystems(selected);exp=expedition();spawnClock=.4;pickupClock=1.3;
 run={id:`${Date.now()}-${++runSequence}`,rocket:selected,assisted:false,discoveries:0,combo:1,comboTime:0,score:0,coins:0,stars:0,near:0,distance:0,fuel:100,reward:0,shield:0,speed:REGIONS[0].speed,missions:[false,false,false],saved:false};
 if(trial){run.shield=2;if(systems.craft.ability==='OVERDRIVE')systems.energy=100;}run.checkpoint=0;state='launch';page='flight';launchTime=0;screen.className='launching';tone(100,.7,'sine',.07);
}
function begin() {state='playing';hudClock=1;updateFlightReadout();updateItemHud();screen.innerHTML='';screen.className='';$('hud').hidden=false;$('arrows').hidden=settings.mode!=='arrows';$('steerHint').textContent=settings.mode==='slide'?'↔  SLIDE TO STEER':settings.mode==='glide'?'TOUCH & HOLD TO GUIDE':'';}
function pause() {if(!['playing','tap','tapready'].includes(state))return;pausedFrom=state;state='paused';if(humGain&&audio)humGain.gain.setTargetAtTime(0,audio.currentTime,.1);show('pause');}
function resume() {state=pausedFrom;page='flight';screen.innerHTML='';screen.className='';$('hud').hidden=activeMode==='tap';$('tapHud').hidden=activeMode!=='tap';$('arrows').hidden=activeMode==='tap'||settings.mode!=='arrows';resetInput();updateFlightReadout();}
$('pause').onclick=pause; $('tapPause').onclick=pause;
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();resetInput();if(audio)audio.suspend().catch(()=>{});}else if(audio)audio.resume().catch(()=>{});});
window.addEventListener('blur',()=>{pause();resetInput();});
window.addEventListener('keydown',e=>{if(activeMode==='tap'&&['tap','tapready'].includes(state)&&!e.target.closest('button')&&[' ','ArrowUp','w','W'].includes(e.key)){e.preventDefault();if(!e.repeat)tapThrust();return;}if(['ArrowLeft','ArrowRight','a','d','A','D'].includes(e.key)){if(state!=='playing')return;e.preventDefault();keys.add(e.key.toLowerCase());input.axis=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);}if(e.key==='Escape'){if(['playing','tap','tapready'].includes(state))pause();else if(state==='paused')resume();}});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());input.axis=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);});
let dragX=0,dragShip=0;
app.addEventListener('pointerdown',e=>{
 if(activeMode==='tap'&&['tap','tapready'].includes(state)){
  if(!e.target.closest('button')){
   e.preventDefault();
   triggerDoubleTapConsumable();
   tapThrust();
  }
  return;
 }
 if(state==='playing'&&!e.target.closest('button')){
  triggerDoubleTapConsumable();
 }
 if(state!=='playing'||pointerId!==null)return;
 const arrow=e.target.closest('[data-direction]');if(e.target.closest('button')&&!arrow)return;
 const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*W/rect.width,y=(e.clientY-rect.top)*H/rect.height;
 if(settings.mode==='arrows'&&!arrow)return;
 if(settings.mode==='slide'&&y<H*.43)return;
 pointerId=e.pointerId;app.setPointerCapture(e.pointerId);dragX=x;dragShip=ship.x;input.active=true;input.target=settings.mode==='slide'?ship.x:x;
 if(arrow)input.axis=Number(arrow.dataset.direction);
});
app.addEventListener('pointermove',e=>{if(e.pointerId!==pointerId)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width;input.target=clamp(settings.mode==='slide'?dragShip+x-dragX:x,22,W-22);});
for(const type of ['pointerup','pointercancel','lostpointercapture'])app.addEventListener(type,e=>{if(e.pointerId===pointerId)resetInput();});
function finish(){
 if(trial)return;
 if(activeMode==='tap'){finishTap();return;}
 if(!run||run.saved)return;run.saved=true;best=Math.max(best,run.score);bestDistance=Math.max(bestDistance,run.distance);wallet+=Math.max(0,run.coins+run.reward-(run.paidCoins||0));run.paidCoins=run.coins+run.reward;
 records=records.filter(r=>r.id!==run.id);records.push({id:run.id,distance:Math.floor(run.distance),score:run.score,coins:run.coins,date:Date.now(),rocket:run.rocket,assisted:run.assisted});records.sort((a,b)=>b.distance-a.distance);records=records.slice(0,100);
 for(const [target,badge] of EXPLORE_BADGES)if(best>=target&&!progress.data.achievements.includes(badge))progress.data.achievements.push(badge);
 persistProfile();rewardQueue.push(...progress.advance('explore',bestDistance));pullProfile();persistProfile();analytics.track('run_ended',{mode:'explore',distance:Math.floor(run.distance),score:run.score});
}
function crash(){
 if(state!=='playing')return;
 if(trial){systems=createSystems(selected);ship=pilot();run.shield=1;notify('TEST FLIGHT · HULL RESTORED');return;}
 if(progress.itemCount('key')>0){
  progress.useItem('key');
  run.shield=4;ship=pilot();obstacles.clear();pickups.clear();particles.clear();
  notify('🔑 REVIVED BY KEY!');tone(1100,.3);updateItemHud();return;
 }
 analytics.track('crash_reason',{mode:'explore',reason:run.fuel<=0?'fuel':'impact'});state='crashing';crashTime=0;resetInput();$('arrows').hidden=true;$('steerHint').textContent='';tone(85,.6,'sawtooth',.07);if(settings.vibration&&navigator.vibrate)navigator.vibrate([45,30,70]);for(let i=0;i<42;i++)emit(ship.x,ship.y,rnd(-130,130),rnd(-150,150),rnd(.4,1.7),'#ff9d58',rnd(1,3));finish();
}
function emit(x,y,vx,vy,life,color,size){particles.take({x,y,vx,vy,life,maxLife:life,color,size});}
function spawn(){
 const z=ZONES[zone],phase=exp.phase,active=phase==='event'&&exp.warning===0,event=active?exp.event:zone===2&&phase==='challenge'?'rings':null;
 const wave=exp.wave||0;exp.wave=wave+1;
 const calm=['calm','recovery','discovery'].includes(phase);
 const shipGap=52; // just wide enough for the ship to squeeze through
 const count=calm?3:event==='rings'?3:zone>=2?6:5;

 // 1. Generate random obstacle positions across the FULL width
 const rocks=[];
 for(let i=0;i<count;i++){
  const r=rnd(17,calm?25:34);
  rocks.push({x:rnd(r+5,W-r-5),y:-55-rnd(0,count*25),r});
 }

 // 2. Sort by x, find the widest natural gap
 rocks.sort((a,b)=>a.x-b.x);
 let bestGapIdx=-1, bestGapSize=0;
 // Check gap before first rock
 let leftEdge=rocks[0].x-rocks[0].r;
 if(leftEdge>bestGapSize){bestGapSize=leftEdge;bestGapIdx=-1;}
 // Check gaps between rocks
 for(let i=1;i<rocks.length;i++){
  const gapSize=(rocks[i].x-rocks[i].r)-(rocks[i-1].x+rocks[i-1].r);
  if(gapSize>bestGapSize){bestGapSize=gapSize;bestGapIdx=i-1;}
 }
 // Check gap after last rock
 let rightEdge=W-(rocks[rocks.length-1].x+rocks[rocks.length-1].r);
 if(rightEdge>bestGapSize){bestGapSize=rightEdge;bestGapIdx=rocks.length;}

 // 3. If the biggest gap is too narrow, remove one rock to widen it
 if(bestGapSize<shipGap){
  // Pick a random rock to remove (not always the same one)
  const removeIdx=Math.floor(rnd(0,rocks.length));
  const removed=rocks.splice(removeIdx,1)[0];
  // Place coins where the removed rock was
  if(phase!=='discovery')for(let j=0;j<3;j++)pickups.take({x:removed.x,y:removed.y-j*38,type:'coin',r:10});
 }else{
  // Place coins in the biggest natural gap
  let coinX;
  if(bestGapIdx===-1)coinX=leftEdge/2;
  else if(bestGapIdx===rocks.length)coinX=W-rightEdge/2;
  else coinX=(rocks[bestGapIdx].x+rocks[bestGapIdx].r+rocks[bestGapIdx+1].x-rocks[bestGapIdx+1].r)/2;
  coinX=clamp(coinX,20,W-20);
  if(phase!=='discovery')for(let j=0;j<3;j++)pickups.take({x:coinX,y:-70-j*38,type:'coin',r:10});
 }

 // 4. Spawn all remaining rocks as obstacles
 for(const rock of rocks){
  const isHunter=!calm&&Math.random()<.2;
  let type=isHunter?'meteor':event==='meteor'||event==='comet'?'meteor':event==='debris'?'wreck':Math.random()<.18?'satellite':Math.random()<.16?'wreck':'rock';
  const vx=event==='meteor'?(exp.cycle%2?24:-24):event==='comet'?30:0;
  obstacles.take({x:rock.x,y:rock.y,r:rock.r,angle:rnd(0,6.28),spin:rnd(-.35,.35),speed:Math.min(260,z.speed*(event==='meteor'?1.12:1)),vx,type,texture:Math.floor(rnd(0,8)),passed:false,near:false,closest:Infinity,contacted:false,homing:isHunter,homingStr:rnd(40,80)});
  if(event==='comet')pickups.take({x:rock.x-30,y:rock.y-70,type:'coin',r:10});
 }
}
function update(dt){
 if(activeMode==='tap'&&['tapready','tap','tapcrashing','tapover'].includes(state)){
  if(activeMagnetTime>0){activeMagnetTime-=dt;systems.exploreBehavior.magnet=Math.max(systems.exploreBehavior.magnet,140);}
  updateTap(dt);return;
 }
 clock+=dt;elapsed+=dt;if(toastTime>0){toastTime-=dt;if(toastTime<=0){$('toast').classList.remove('visible');$('toast').textContent='';}}
 if(state==='launch'){launchTime+=dt;if(launchTime>=1.35)begin();}
 if(state==='playing'){
  if(!updateExpedition(dt))return;
  if(activeMagnetTime>0){activeMagnetTime-=dt;systems.craft.exploreBehavior.magnet=Math.max(systems.craft.exploreBehavior.magnet,140);}
  if(run.fuel<10&&progress.itemCount('fuel_tank')>0){
   progress.useItem('fuel_tank');run.fuel=Math.min(100,run.fuel+50);notify('⛽ FUEL TANK AUTO-REFILLED (+50%)');tone(880,.2);updateItemHud();
  }
  const oldX=ship.x,oldY=ship.y;tickSystems(systems,dt);steer(ship,input,dt,systems.craft.agility);
  const z=ZONES[zone];run.speed+=clamp(z.speed-run.speed,-3*dt,3*dt);run.distance+=run.speed*dt*BALANCE.metersPerPixel*(systems.overdrive>0?1.25:1);run.fuel=Math.max(0,run.fuel-dt*2.1*systems.craft.exploreBehavior.fuel*systems.efficiencyBonus);run.shield=Math.max(0,run.shield-dt);
  const next=zoneAt(run.distance);if(next!==zone){zone=next;analytics.track('region_reached',{region:zone});notify(ZONES[zone].name);tone(180,.35);}
  spawnClock-=dt;if(spawnClock<=0){spawn();spawnClock=ZONES[zone].interval*(['calm','recovery','discovery'].includes(exp.phase)?1.2:exp.phase==='event'?.8:.9);}
  pickupClock-=dt;if(pickupClock<=0){const type=run.fuel<50?'fuel':Math.random()<.2?'bomb':Math.random()<.25?'star':'coin';pickups.take({x:rnd(42,W-42),y:-25,type,r:type==='bomb'?14:10});pickupClock=type==='fuel'?2:1.6;}
  for(const o of obstacles.items){if(!o.active)continue;const ax=o.x-oldX,ay=o.y-oldY;if(o.speed>0)o.speed+=clamp(run.speed*(o.type==='meteor'?1.12:1)-o.speed,-3*dt,3*dt);if(o.homing&&o.y<ship.y-30){const dx=ship.x-o.x;o.vx+=(dx>0?1:-1)*o.homingStr*dt;}o.y+=o.speed*dt*(systems.overdrive>0?1.25:1);o.x=clamp(o.x+o.vx*dt,5,W-5);o.angle+=o.spin*dt;const distance=sweptDistance(ax,ay,o.x-ship.x,o.y-ship.y);o.closest=Math.min(o.closest,distance);if(distance<o.r*.76+systems.craft.exploreBehavior.radius){o.contacted=true;if(run.shield>0){o.active=false;for(let i=0;i<10;i++)emit(o.x,o.y,rnd(-50,50),rnd(-50,50),.5,'#a9e8ff',2);}else{const hit=takeImpact(systems,o.r*.76+systems.craft.exploreBehavior.radius-distance,Math.abs(o.x-ship.x)<o.r*.65||o.type==='meteor');if(hit==='fatal'){crash();break;}if(hit==='damaged'){o.active=false;notify('HULL DAMAGED');tone(140,.16,'triangle');}}}if(!o.passed&&o.y>ship.y+o.r+12){o.passed=true;run.score++;if(o.closest<o.r*.76+27&&o.closest>=o.r*.76+systems.craft.exploreBehavior.radius&&!o.contacted){const bonus=nearMiss(run,systems);notify(`NEAR MISS ×${run.combo}  +${bonus}`);if(!trial)progress.metric('near');analytics.track('near_miss',{combo:run.combo});tone(640,.1);}}if(o.y>H+80)o.active=false;}
  if(state==='playing')for(const p of pickups.items){if(!p.active)continue;p.y+=run.speed*dt*(systems.overdrive>0?1.25:1);attractCoin(p,ship,systems,dt);if(Math.hypot(p.x-ship.x,p.y-ship.y)<25){p.active=false;if(p.type==='bomb'){detonateMine(p.x,p.y);if(run.shield>0){run.shield=0;notify('SHIELD ABSORBED MINE');}else if(takeImpact(systems,999,true)==='fatal'){crash();break;}else notify('MINE DEFLECTED');}else{tone(p.type==='coin'?820:1050,.12);if(p.type==='coin')run.coins++;if(p.type==='fuel'){run.fuel=Math.min(100,run.fuel+25);notify('FUEL +25');}if(p.type==='star'){if(!trial&&run.combo>=2)progress.metric('chainStars');run.stars++;run.score+=3;if(run.stars%3===0){run.shield=selected==='cosmic_pink'?8:5;notify('SHIELD ONLINE');}}}}if(p.y>H+25)p.active=false;}
  if(state==='playing'){for(const [i,done,reward] of [[0,run.stars>=5,25],[1,run.near>=3,30],[2,run.distance>=1000,40]])if(done&&!run.missions[i]&&!trial){run.missions[i]=true;run.reward+=reward;notify(`MISSION COMPLETE  +${reward} COINS`);}if(run.fuel<=0){finish();state='ended';show('summary');}}
  if(run.distance>150)$('steerHint').textContent='';
  hudClock+=dt;if(hudClock>.1){hudClock=0;$('fuelFill').style.width=`${run.fuel}%`;$('fuelFill').style.background=run.fuel<25?'#ee906b':'#57dfb5';$('coins').textContent=run.coins;$('distance').textContent=Math.floor(run.distance).toLocaleString();$('danger').textContent=REGIONS[zone].name;$('skillScore').textContent=run.score;$('multiplier').textContent=run.combo>1?`×${run.combo}`:'';updateFlightReadout();}
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
const nebula=surface(390,780);{const c=nebula.getContext('2d');for(let i=0;i<38;i++){const x=rand()*W,y=rand()*H,r=rand()*130+40,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%2?'#3a497d19':'#59417415');g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(0,0,W,H);}}
const rockTextures=Array.from({length:8},(_,index)=>{const c=surface(128,128),g=c.getContext('2d');const vertices=Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2,r=45+rand()*13;return [64+Math.cos(a)*r,64+Math.sin(a)*r];});g.beginPath();vertices.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();const grad=g.createLinearGradient(20,5,105,115);grad.addColorStop(0,index%2?'#bd9d8f':'#a1b6d1');grad.addColorStop(.25,'#54617b');grad.addColorStop(.7,'#222e47');grad.addColorStop(1,'#101a2b');g.fillStyle=grad;g.fill();g.save();g.clip();for(let j=0;j<25;j++){const x=rand()*128,y=rand()*128,r=4+rand()*14;g.beginPath();g.moveTo(x-r,y);g.lineTo(x-r*.5,y-r);g.lineTo(x+r*.65,y-r*.75);g.lineTo(x+r,y+r*.4);g.lineTo(x,y+r);g.closePath();g.fillStyle=j%3?'#111c305e':'#b8b1b123';g.fill();g.beginPath();g.moveTo(x-r,y);g.lineTo(x-r*.5,y-r);g.lineTo(x+r*.65,y-r*.75);g.strokeStyle='#d2bbad55';g.lineWidth=1.3;g.stroke();}g.restore();return c;});
const planet=surface(520,520);{const c=planet.getContext('2d');c.save();c.beginPath();c.arc(260,260,248,0,Math.PI*2);c.clip();const g=c.createLinearGradient(10,30,440,430);g.addColorStop(0,'#758fc6');g.addColorStop(.22,'#4969a4');g.addColorStop(.6,'#253d69');g.addColorStop(1,'#040b18');c.fillStyle=g;c.fillRect(0,0,520,520);for(let i=0;i<1600;i++){const x=rand()*520,y=rand()*520,r=rand()*13+2;c.beginPath();c.ellipse(x,y,r*2,r,rand()*3,0,7);c.fillStyle=i%3?'#07142c25':'#88a5de12';c.fill();}const shadow=c.createRadialGradient(135,100,30,310,300,290);shadow.addColorStop(0,'#00000000');shadow.addColorStop(.6,'#02091412');shadow.addColorStop(1,'#02071190');c.fillStyle=shadow;c.fillRect(0,0,520,520);c.restore();c.beginPath();c.arc(260,260,248,3.65,5.3);c.strokeStyle='#a2bff39c';c.lineWidth=2;c.stroke();}
function drawRocket(x,y,size,bank,engine,fin,id=selected){ctx.save();ctx.translate(x,y);ctx.rotate(bank);ctx.scale(size,size);if(id==='atlas')ctx.scale(1.15,.96);if(id==='comet')ctx.scale(.88,1.12);if(engine){const length=36+Math.sin(clock*32)*5+Math.abs(ship.vx)*.035;const g=ctx.createLinearGradient(0,16,0,16+length);g.addColorStop(0,'#d4f6ff');g.addColorStop(.2,'#51ccffb0');g.addColorStop(.55,'#256cea65');g.addColorStop(1,'#235cff00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-5,18);ctx.quadraticCurveTo(-9,33,0,18+length);ctx.quadraticCurveTo(9,33,5,18);ctx.fill();ctx.fillStyle='#d4f7ff';ctx.fillRect(-2,17,4,9);}
 ctx.fillStyle=fin;ctx.beginPath();ctx.moveTo(-6,-6);ctx.lineTo(-17,17);ctx.lineTo(-16,25);ctx.lineTo(-6,16);ctx.lineTo(6,16);ctx.lineTo(16,25);ctx.lineTo(17,17);ctx.lineTo(6,-6);ctx.fill();
 const body=ctx.createLinearGradient(-8,0,8,0);body.addColorStop(0,'#7b8ca5');body.addColorStop(.4,'#f5f2e7');body.addColorStop(.7,'#d5dfec');body.addColorStop(1,'#778da9');ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(0,-28);ctx.bezierCurveTo(-8,-17,-10,4,-7,17);ctx.lineTo(7,17);ctx.bezierCurveTo(10,4,8,-17,0,-28);ctx.fill();ctx.fillStyle=fin;ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(-5,-15);ctx.lineTo(5,-15);ctx.fill();ctx.fillStyle='#223a56';ctx.beginPath();ctx.ellipse(0,-5,4.8,6.4,0,0,7);ctx.fill();ctx.strokeStyle='#8ebce1';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#69a9cf';ctx.beginPath();ctx.ellipse(-1.2,-7,1.4,2,0,0,7);ctx.fill();ctx.fillStyle=fin;ctx.fillRect(-6,4,12,3);if(['ranger','atlas','odyssey'].includes(id)){ctx.fillStyle='#93a8c2';ctx.fillRect(-9,1,3,14);ctx.fillRect(6,1,3,14);}if(['magnetar','voyager','phantom'].includes(id)){ctx.strokeStyle=fin;ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(0,8,12,4,0,0,7);ctx.stroke();}ctx.fillStyle='#172a42';ctx.fillRect(-5,15,10,5);ctx.strokeStyle='#526983';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(0,14);ctx.stroke();ctx.restore();}
function draw(){
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
 if(activeMode==='tap'&&(['tapready','tap','tapcrashing','tapover'].includes(state)||['paused','upgrade'].includes(state))){renderTap(ctx,tapFlight,{stars,nebula,planet,deepSky:menuArt,background:'default'},shipPaint(),clock,quality,state==='paused',COSMETICS.find(c=>c.id===progress.data.equippedTrail)?.color);return;}
 ctx.fillStyle='#030914';ctx.fillRect(0,0,W,H);
 const flying=['playing','launch','paused','crashing','crashed','ended','upgrade'].includes(state),travel=run&&flying?run.distance:clock*2;
 ctx.save();if(state==='crashing'&&!motionReduced&&crashTime<.4)ctx.translate(rnd(-4,4)*(1-crashTime/.4),rnd(-4,4)*(1-crashTime/.4));
 if(flying&&menuArt?.complete&&menuArt.naturalWidth){ctx.globalAlpha=.3;ctx.drawImage(menuArt,0,menuArt.naturalHeight*.27,menuArt.naturalWidth,menuArt.naturalHeight*.38,0,-40-Math.sin(travel*.0002)*40,W,H+80);ctx.globalAlpha=1;}ctx.drawImage(nebula,0,0);
 for(const s of stars){ctx.globalAlpha=s.alpha;ctx.fillStyle=s.depth>.8?'#bfd6ff':'#8297bf';const sy=(s.y+travel*s.depth*.7)%H;ctx.fillRect(s.x-(flying?ship.bank*6*s.depth:0),sy,s.r,s.r);if(s.r>1.1&&s.alpha>.7){ctx.globalAlpha=.13;ctx.fillRect(s.x-3,sy,7,.7);ctx.fillRect(s.x,sy-3,.7,7);}}ctx.globalAlpha=1;
 if(!flying||state==='launch'){ctx.save();const launchBlend=state==='launch'?clamp(launchTime/1.35,0,1):0;ctx.globalAlpha=1-launchBlend;ctx.translate(0,-launchBlend*110);ctx.drawImage(planet,245,-65,265,265);ctx.globalAlpha=.7*(1-launchBlend);ctx.drawImage(planet,-48,420,126,126);ctx.globalAlpha=1-launchBlend;if(page==='home'||state==='launch')ctx.drawImage(planet,-125,525,645,645);ctx.restore();}
 else {const landmark=Math.floor(travel*.12/1450),py=-420+(travel*.12)%1450;ctx.globalAlpha=.72;ctx.drawImage(planet,landmark%2?-155:235,py,310,310);ctx.globalAlpha=1;}
 if(flying){for(const o of obstacles.items){if(!o.active)continue;ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.angle);if(o.type==='field'){ctx.strokeStyle='#a09cea60';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,o.r*.8,0,7);ctx.stroke();ctx.fillStyle='#9d94e81c';ctx.fill();ctx.beginPath();ctx.ellipse(0,0,o.r,o.r*.3,clock,0,7);ctx.stroke();}else if(o.type==='satellite'||o.type==='wreck'){ctx.fillStyle='#21344c';ctx.fillRect(-o.r,-o.r*.35,o.r*2,o.r*.7);ctx.strokeStyle='#78849b';ctx.lineWidth=1;ctx.strokeRect(-o.r,-o.r*.35,o.r*2,o.r*.7);for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*o.r/3,-o.r*.35);ctx.lineTo(i*o.r/3,o.r*.35);ctx.stroke();}ctx.fillStyle=o.type==='wreck'?'#a66c58':'#a6a5a7';ctx.fillRect(-6,-13,12,26);if(o.type==='wreck'){ctx.fillStyle='#050c19';ctx.fillRect(8,-10,20,10);ctx.fillStyle='#e69a6244';ctx.fillRect(-3,6,4,7);}ctx.strokeStyle='#b6c6d3';ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(4,-25);ctx.stroke();}else{if(o.type==='meteor'){const g=ctx.createLinearGradient(0,-120,0,0);g.addColorStop(0,'#ff874000');g.addColorStop(1,'#ff874063');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-120);ctx.lineTo(o.r*.6,0);ctx.lineTo(-o.r*.6,0);ctx.fill();}ctx.drawImage(rockTextures[o.texture],-o.r,-o.r,o.r*2,o.r*2);}ctx.restore();}
 for(const p of pickups.items){if(!p.active)continue;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=p.type==='fuel'?'#77e7de':'#f5cd74';ctx.strokeStyle=p.type==='fuel'?'#a4fff0':'#fff0b4';if(p.type==='coin'){ctx.beginPath();ctx.ellipse(0,0,6+Math.abs(Math.sin(clock*2))*2,9,0,0,7);ctx.fill();ctx.stroke();ctx.strokeStyle='#a96c29';ctx.beginPath();ctx.ellipse(0,0,4,6,0,0,7);ctx.stroke();}else if(p.type==='star'){ctx.beginPath();for(let i=0;i<10;i++){let a=i*Math.PI/5-Math.PI/2,r=i%2?4:10;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();}else if(p.type==='bomb'){drawMine(ctx,0,0,clock);}else{ctx.strokeRect(-7,-10,14,20);ctx.fillRect(-4,-4,8,11);ctx.fillRect(-3,-13,6,3);}ctx.restore();}
 }
 for(const p of particles.items)if(p.active){ctx.globalAlpha=Math.max(0,p.life/p.maxLife);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;
 if(page==='home'||state==='launch'){if(menuArt?.complete&&menuArt.naturalWidth){ctx.save();ctx.globalAlpha=state==='launch'?1-clamp(launchTime/1.35,0,1):1;ctx.drawImage(menuArt,0,0,W,H);ctx.restore();}const t=state==='launch'?clamp(launchTime/1.35,0,1):0;drawRocket(W/2,335+(602-335)*t+Math.sin(clock*1.4)*2,1.3-t*.44,0,true,shipPaint());}
 else if(page==='rockets'){const el=document.querySelector('.rocket-space'),rect=el?.getBoundingClientRect(),base=canvas.getBoundingClientRect();drawRocket(195,rect?(rect.top-base.top+rect.height/2)*H/base.height:300,1.9,Math.sin(clock*.7)*.025,true,shipPaint(rockets[preview].id),rockets[preview].id);}
 else if(flying){drawSystemAura(ctx,ship.x,ship.y,systems,clock,run?.shield||0);if(state==='playing'&&toastTime>1.5&&$('toast').textContent.startsWith('NEAR MISS')){ctx.strokeStyle='#a9deef40';ctx.beginPath();ctx.arc(ship.x,ship.y,30+(2.2-toastTime)*45,0,7);ctx.stroke();}if(run?.shield>0){ctx.strokeStyle='#87dffb80';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(ship.x,ship.y,23,35,ship.bank,0,7);ctx.stroke();}drawRocket(ship.x,ship.y,.86*(systems.craft.exploreBehavior.radius/9)**.35,ship.bank,state==='playing'||state==='paused',shipPaint());}
 // Sparse out-of-focus foreground dust adds another depth plane without hiding the route.
 if(flying&&quality>.6)for(let i=0;i<5;i++){ctx.fillStyle='#8bafe018';ctx.beginPath();ctx.arc((i*97+31)%W,(i*163+travel*2)%H,2,0,7);ctx.fill();}
 drawExpedition();ctx.restore();
}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}
const renderTap = createTapRenderer(surface);
function playStudioIntro(){
 const el=$('studioIntro');
 if(!el)return;
 setTimeout(()=>{
  el.classList.add('fade-out');
  setTimeout(()=>{el.hidden=true;},600);
 },2200);
}
window.addEventListener('resize',resize);resize();persistProfile();show('home');playStudioIntro();let last=performance.now();
function frame(now){if(document.hidden){last=now;requestAnimationFrame(frame);return;}const raw=(now-last)/1000;last=now;if(raw>.023)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(settings.graphics==='LOW')quality=.45;else if(settings.graphics==='HIGH')quality=1;else if(slowFrames>90)quality=.5;const dt=Math.min(raw,.033);if(state!=='paused')update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);


// Shared progression adapters. Legacy keys remain mirrors for existing installations.
function persistProfile(){Object.assign(progress.data,{coins:wallet,ownedRockets:unlocked,equippedRocket:selected,exploreBestDistance:bestDistance,exploreBestScore:best,tapBestScore:tapBest,exploreRecords:records,tapRecords,settings});progress.commit();if(progress.error)$('storageNotice').hidden=false;save('wilifunkCoins',wallet);save('wilifunkUnlockedRockets',unlocked);save('spaceRocketHighScore',best);save('spacerootRecords',records);save('spacehullTapBestScore',tapBest);save('spacehullTapRecords',tapRecords);save('spacerootSettings',settings);try{localStorage.setItem('wilifunkSelectedRocket',selected);}catch{}}
function pullProfile(){wallet=progress.data.coins;unlocked=progress.data.ownedRockets;bestDistance=progress.data.exploreBestDistance;}
function shipPaint(id=selected){const c=COSMETICS.find(c=>c.id===progress.data.rocketPaints?.[id]);return c?.color||rocketById(id).fin;}
function tickToast(dt){if(toastTime>0){toastTime-=dt;if(toastTime<=0){$('toast').textContent='';$('toast').classList.remove('visible');}}}
function showMeta(name){
 if(name!=='upgrade')state='menu';
 if(name==='space-map')screen.innerHTML=mapUI(progress,mapMode);
 if(name==='missions')screen.innerHTML=missionsUI(progress,missionTab);
 if(name==='rocket-list')screen.innerHTML=rocketListUI(progress);
 if(name==='cosmetics')screen.innerHTML=cosmeticsUI(progress);
 if(name==='store')screen.innerHTML=storeUI(progress,ads);
 if(name==='milestone'){const m=rewardQueue[0];screen.innerHTML=`${header('MILESTONE REWARD',rewardReturn)}<div class="milestone-art">✦</div><div class="center"><div class="eyebrow">YOUR JOURNEY GROWS</div><h2>${m?.label||'ALL REWARDS CLAIMED'}</h2><p>${m?'Permanently added to your collection.':'Your next discovery is out there.'}</p></div><div style="margin-top:auto">${button('CONTINUE','next-reward','primary')}</div>`;}
 if(name==='upgrade'){state='upgrade';screen.innerHTML=`<header><h2>CHOOSE SYSTEM</h2></header><p>One temporary expedition upgrade. It expires when this run ends.</p>${button('REINFORCED HULL · +1 light impact','upgrade-armor')}${button('GRAVITY ARRAY · stronger coin attraction','upgrade-magnet')}${button(activeMode==='tap'?'SHIELD · 8 seconds protection':'ION DRIVE · improved fuel efficiency','upgrade-efficiency')}`;}
 if(name==='reset-confirm')screen.innerHTML=`${header('RESET PROGRESS','settings')}<p>This resets this device’s coins, records, unlocks and settings. A local recovery copy is retained.</p>${button('RESET LOCAL PROGRESS','reset-now')}${button('KEEP MY PROGRESS','settings','primary')}`;
}
function handleMetaAction(a){
 if(a==='ad-rescue'||a==='ad-double'){void requestReward(a.slice(3));return true;}
 if(a.startsWith('buy-item-')){const id=a.slice(9);if(progress.buyItem(id)){pullProfile();persistProfile();tone(960,.12);notify('ITEM PURCHASED');}else notify('CANNOT PURCHASE ITEM');show('store');return true;}
 if(a.startsWith('ad-item-')){const id=a.slice(8);void requestRewardItem(id);return true;}
 if(a.startsWith('rocket-')&&/^rocket-\d+$/.test(a)){preview=Number(a.slice(7));analytics.track('rocket_previewed',{id:rockets[preview].id});show('rockets');return true;}
 if(a==='try-rocket'){trial={remaining:BALANCE.trialSeconds,previous:selected};selected=rockets[preview].id;activeMode='explore';start();return true;}
 if(a==='map-explore'||a==='map-tap'){mapMode=a.slice(4);show('space-map');return true;}
 if(a.startsWith('mission-tab-')){missionTab=a.slice(12);show('missions');return true;}
 if(a.startsWith('claim-mission-')){if(progress.claimMission(a.slice(14))){pullProfile();persistProfile();tone(900,.15);}show('missions');return true;}
 if(a.startsWith('cosmetic-')){const id=a.slice(9);if(id==='default'){delete progress.data.rocketPaints[selected];progress.data.equippedPaint='';progress.data.equippedTrail='';progress.data.equippedBackground='';progress.commit();}else if(!progress.cosmetic(id))notify('UNLOCK THIS REWARD FIRST');pullProfile();persistProfile();show('cosmetics');return true;}
 if(a==='graphics'){settings.graphics=({AUTO:'LOW',LOW:'HIGH',HIGH:'AUTO'})[settings.graphics||'AUTO'];persistProfile();show('settings');return true;}
 if(a==='view-rewards'){rewardReturn=page;show('milestone');return true;}
 if(a==='next-reward'){rewardQueue.shift();show(rewardQueue.length?'milestone':rewardReturn);return true;}
 if(a.startsWith('upgrade-')){const type=a.slice(8),s=activeMode==='tap'?tapFlight.systems:systems;if(type==='armor')s.armor++;if(type==='magnet')s.magnetBonus+=25;if(type==='efficiency'){s.efficiencyBonus*=.85;if(activeMode==='tap')s.shield=8;}if(activeMode==='tap'){state='tap';page='tap-flight';$('tapHud').hidden=false;}else{exp.upgrades.push(type);state='playing';page='flight';$('hud').hidden=false;$('arrows').hidden=settings.mode!=='arrows';}screen.innerHTML='';updateFlightReadout();return true;}
 if(a==='class-open'||a==='class-classic'){boardClass=a.slice(6);show('leaderboard');return true;}
 if(a==='metric-coins'||a==='metric-distance'){boardMetric=a.slice(7);show('leaderboard');return true;}
 if(a==='reset-now'){try{localStorage.setItem('spacehullResetBackup',JSON.stringify(progress.data));for(const key of ['spacehullProfile','spacehullProfileBackup','wilifunkCoins','wilifunkUnlockedRockets','wilifunkSelectedRocket','spaceRocketHighScore','spacerootRecords','spacehullTapBestScore','spacehullTapRecords','spaceRocketBadges','spacerootSettings'])localStorage.removeItem(key);location.reload();}catch{notify('RESET UNAVAILABLE');}return true;}
 return false;
}
async function requestRewardItem(itemId){
 if(!ads.available)return;
 analytics.track('rewarded_ad_accepted',{placement:`store_${itemId}`});
 const earned=await ads.request(`store:${itemId}:${Date.now()}`,`store_${itemId}`);
 if(!earned){notify('REWARD NOT COMPLETED');return;}
 analytics.track('rewarded_ad_completed',{placement:`store_${itemId}`});
 progress.addItem(itemId);pullProfile();persistProfile();notify('FREE ITEM CLAIMED');show('store');
}
function endTrial(){if(!trial)return;selected=trial.previous;trial=null;systems=createSystems(selected);show('rockets');}
function updateAbility(s){const phase=s.craft.ability==='PHASE',boost=s.craft.ability==='OVERDRIVE';const ready=phase?!s.phaseUsed:boost&&s.energy>=100;const b=$('abilityButton');b.hidden=!(phase||boost)||!['playing','tap','tapready'].includes(state);b.disabled=!ready;b.textContent=phase?(s.phaseUsed?'PHASE USED':'PHASE'):ready?'OVERDRIVE':`DRIVE ${Math.floor(s.energy)}%`;}
$('abilityButton').onclick=()=>{const s=activeMode==='tap'?tapFlight.systems:systems;if(activateSystem(s)){tone(350,.2);analytics.track('ability_activated',{rocket:s.id});}};
function updateExpedition(dt){
 exp.time+=dt;decayCombo(run,dt);updateAbility(systems);
 if(trial){trial.remaining-=dt;$('eventBanner').textContent=`TEST FLIGHT · ${Math.ceil(trial.remaining)}s · NO REWARDS`;if(trial.remaining<=0){endTrial();return false;}return true;}
 const cycle=Math.floor(exp.time/BALANCE.cycleSeconds),phase=pacing(exp.time);
 if(cycle!==exp.cycle){Object.assign(exp,{cycle,routeMade:false,discoveryMade:false,eventSurvived:false,event:eventFor(zone,cycle)});}
 if(phase!==exp.phase){exp.phase=phase;if(phase==='event'){exp.event=run.distance>=35000&&!progress.data.components.includes('engine_core')?'flare':eventFor(zone,cycle);exp.warning=2;notify(`${EVENTS[exp.event]} · INCOMING`);analytics.track('event_started',{event:exp.event});}if(phase==='recovery'){exp.eventSurvived=true;if(exp.event==='meteor')progress.metric('storms');if(exp.event==='flare'&&run.distance>=35000&&!progress.data.components.includes('engine_core')){progress.data.components.push('engine_core');notify('ENGINE CORE RECOVERED');progress.commit();}run.fuel=Math.min(100,run.fuel+12);}}
 exp.warning=Math.max(0,exp.warning-dt);
 if(phase==='event'&&exp.warning===0&&exp.event==='gravity'){ship.x=clamp(ship.x+(cycle%2?1:-1)*42*(1-(systems.craft.exploreBehavior.resistance||0))*dt,22,W-22);}
 if(phase==='route'&&!exp.routeMade){exp.routeMade=true;pickups.take({x:exp.safeGap||195,y:-150,type:'star',r:10});notify('MINERAL ROUTE · FOLLOW THE COINS');}
 const checkpoint=Math.floor(run.distance/500);if(checkpoint>run.checkpoint){run.checkpoint=checkpoint;bestDistance=Math.max(bestDistance,run.distance);progress.metric('distance',run.distance,true);persistProfile();const rewards=progress.advance('explore',run.distance);if(rewards.length){for(const reward of rewards)analytics.track('milestone_claimed',{id:reward.id});rewardQueue.push(...rewards);pullProfile();notify(`MILESTONE · ${rewards.at(-1).label}`);}analytics.track('distance_reached',{distance:checkpoint*500});}
 if(systems.craft.ability==='ADAPTIVE_SYSTEM'&&run.distance>=exp.nextUpgrade){exp.nextUpgrade+=5000;show('upgrade');return false;}
 if(phase==='event'&&exp.event==='flare')run.fuel=Math.max(0,run.fuel-dt*.8*(1-(systems.craft.exploreBehavior.resistance||0)));
 const ahead=bestDistance-run.distance;
 $('eventBanner').className=phase==='event'?'event-active':'';$('eventBanner').textContent=phase==='event'?`${EVENTS[exp.event]}${exp.warning>0?' · INCOMING':''}`:ahead>0&&ahead<600?`BEST DISTANCE · ${Math.ceil(ahead)} m AHEAD`:phase==='recovery'?'RECOVERY · CLEAR SPACE':'';
 return true;
}
function drawExpedition(){
 if(!['playing','paused','crashing','crashed','ended','upgrade'].includes(state)||activeMode!=='explore')return;
 if(systems.phase>0){ctx.strokeStyle='#b6b2ee';ctx.beginPath();ctx.ellipse(ship.x,ship.y,24,35,0,0,7);ctx.stroke();}
 if(systems.damage>0){ctx.fillStyle='#111825';ctx.fillRect(ship.x-13,ship.y+8,7,9);for(let i=0;i<systems.damage*3;i++){ctx.fillStyle=i%2?'#ffa660a0':'#8493a83a';ctx.beginPath();ctx.arc(ship.x+Math.sin(i+clock*3)*6,ship.y+25+(clock*25+i*13)%55,2+i*.4,0,7);ctx.fill();}ctx.fillStyle='#e6a17b';ctx.font='8px sans-serif';ctx.fillText(systems.armor?'HULL DAMAGED':'HULL CRITICAL',ship.x-28,ship.y-40);}
 const trail=COSMETICS.find(c=>c.id===progress.data.equippedTrail);if(trail||systems.overdrive>0){ctx.strokeStyle=trail?.color||'#eee0ff';ctx.globalAlpha=.35;ctx.lineWidth=systems.overdrive>0?4:2;ctx.beginPath();ctx.moveTo(ship.x,ship.y+23);ctx.lineTo(ship.x,ship.y+75);ctx.stroke();ctx.globalAlpha=1;}
}
// Provider integration point: no ads or online-looking buttons without a real adapter.
export function configureServices(services={}){ads.adapter=services.rewardedAds||null;if(['home','crashed','ended','tapover'].includes(state))show(page);}
export function getBalanceEvents(){return analytics.events.map(event=>({...event}));}
function adActions(){if(!ads.available||trial)return '';const id=activeMode==='tap'?tapFlight.id:run?.id;const rescueUsed=activeMode==='tap'?tapFlight.rescueUsed:run?.rescueUsed;const doubled=ads.claimed.has(`${id}:double`);return `<div class="optional-rewards">${!rescueUsed?button('🎬 WATCH AD TO REVIVE (KEY)','ad-rescue'):''}${!doubled?button('🎬 WATCH AD TO DOUBLE COINS','ad-double'):''}</div>`;}
async function requestReward(kind){
 if(!ads.available||['playing','tap','tapready','launch'].includes(state))return;
 const id=activeMode==='tap'?tapFlight.id:run?.id;
 const rescueUsed=activeMode==='tap'?tapFlight.rescueUsed:run?.rescueUsed;
 if(kind==='rescue'&&rescueUsed)return;
 analytics.track('rewarded_ad_accepted',{placement:kind});
 const earned=await ads.request(`${id}:${kind}`,kind);if(!earned){notify('REWARD NOT COMPLETED');return;}
 analytics.track('rewarded_ad_completed',{placement:kind});
 if(kind==='double'){wallet+=activeMode==='tap'?tapFlight.coins:run.coins;persistProfile();show(page);notify('BONUS COINS CLAIMED');}
 if(kind==='rescue'){
  if(activeMode==='tap'){
   tapFlight.rescueUsed=true;tapFlight.assisted=true;tapFlight.saved=false;tapFlight.status='playing';tapFlight.systems.shield=4;
   state='tap';page='tap-flight';screen.innerHTML='';screen.className='';$('tapHud').hidden=false;resetInput();notify('🔑 AD REVIVE ACTIVATED!');tone(1100,.3);updateItemHud();
  }else{
   run.rescueUsed=true;run.assisted=true;run.saved=false;run.fuel=Math.max(35,run.fuel);run.shield=4;ship=pilot();obstacles.clear();pickups.clear();particles.clear();
   state='playing';page='flight';screen.innerHTML='';screen.className='';$('hud').hidden=false;$('arrows').hidden=settings.mode!=='arrows';resetInput();records=records.map(r=>r.id===run.id?{...r,assisted:true}:r);persistProfile();notify('🔑 AD REVIVE ACTIVATED!');tone(1100,.3);updateItemHud();
  }
 }
}

function updateFlightReadout(){
 const tap=activeMode==='tap',s=tap?tapFlight.systems:systems,value=tap?tapFlight.score:run?.distance||0;
 const pending=trial?0:tap?(tapFlight.saved?0:tapFlight.coins):Math.max(0,(run?.coins||0)+(run?.reward||0)-(run?.paidCoins||0));
 const balance=wallet+pending,choices=ROCKETS.slice(0,8).filter(r=>!unlocked.includes(r.id)),target=choices.find(r=>progress.requirements(r).every(q=>q.done))||choices[0];
 $('flightProgress').hidden=!['playing','tap','tapready','launch'].includes(state);
 $('flightProgress').style.opacity=tap&&tapFlight.ship.y>640?'.12':'1';
 $('flightCraft').textContent=trial?`TRIAL · ${s.craft.name}`:s.craft.name;$('flightCraft').style.color=shipPaint(s.craft.id);
 $('flightRegion').textContent=target?`NEXT CRAFT · ${target.name}`:'COLLECTION COMPLETE';
 const remaining=target?Math.max(0,target.price-balance):0,gate=target?progress.requirements(target).find(q=>!q.done):null;
 
 const noteText=trial?'TEST FLIGHT · NO REWARDS BANKED':!target?`◉ ${balance.toLocaleString()} IN WALLET`:remaining?`<span style="color:#fbbf24;font-weight:700">◉ ${remaining.toLocaleString()} NEEDED</span> · ${balance.toLocaleString()} / ${target.price.toLocaleString()}`:gate?`<span style="color:#38bdf8;font-weight:700">COINS READY</span> · ${gate.label}`:pending?'<span style="color:#34d399;font-weight:700">COINS READY</span> · FINISH RUN':'READY IN HANGAR';
 $('nextMilestone').innerHTML=noteText;
 $('journeyFill').style.width=target?`${clamp(balance/target.price*100,0,100)}%`:'100%';
 const stars=tap?tapFlight.stars:run?.stars||0;
 $(tap?'tapFlightStatus':'flightStatus').textContent=`✦ ${stars}   ${(tap?s.shield:run?.shield)>0?'SHIELD '+Math.ceil(tap?s.shield:run.shield)+'s':s.armor?'◇ '+s.armor+' HULL':'◇ NO ARMOUR'}`;
 if(!tap)$('fuelValue').textContent=`${Math.ceil(run?.fuel||0)}%`;
}

function detonateMine(x,y){for(let i=0;i<24;i++){const a=i*Math.PI*2/24;emit(x,y,Math.cos(a)*110,Math.sin(a)*110,.7,i%2?'#ffad64':'#ff5669',2);}tone(110,.22,'sawtooth',.04);}
