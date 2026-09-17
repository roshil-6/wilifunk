# SPACEHULL

Two portrait arcade modes, one shared rocket collection. The active source is `www/`. Start with `npm run dev` and open http://localhost:8000.

## Gameplay

- **Explore:** automatic forward flight with analogue Side Slide (default), held arrows, or Touch & Hold Glide. Keyboard arrows/A/D also steer. Distance and skill score are separate. Collect coins, stars and fuel; near misses build a timed multiplier.
- **Tap & Fun:** tap/Space/Up/W to rise, release to fall. The first tap starts the run. Clear formations, earn Perfect Pass and Skim bonuses, and collect coins/stars. No fuel system. Scores and records remain separate from Explore.
- Escape pauses. Backgrounding pauses active play. Launch and crash sequences connect the universe to its menus and results.

## Rockets and progression

Scout, Ranger, Atlas, Comet, Magnetar, Voyager, Phantom and Odyssey have distinct configurable handling and systems. Ranger/Atlas absorb limited shallow impacts; major collisions remain fatal. Comet charges Explore overdrive through near misses. Magnetar attracts coins. Voyager reduces fuel consumption and environmental forces. Phantom has one manual phase per run. Odyssey chooses one temporary system upgrade every 5 km. Legacy Crimson/Aurora unlocks remain available.

The hangar shows costs and unlock requirements, supports purchases/equipment, and offers safe 15-second trials without awarding records or currency. Cosmetics change appearance without stats.

Explore advances through eight regions with paced calm, challenge, route-choice, event, recovery and discovery sections. Events include meteor storms, rings, debris, gravity, flares and comet trails. Signals can be scanned; deep discoveries and components contribute to advanced unlocks. Space Map, automatic one-time milestones, daily/weekly missions and achievements track progress across runs.

## Modules

- `config.js`: rockets, physics tuning, regions, milestones, cosmetics and missions.
- `flight.js`: analogue movement, collision geometry and bounded pools.
- `rocket-systems.js`: armor, magnet, phase and overdrive systems.
- `expedition.js`: pacing and near-miss combos.
- `tap-flight.js` / `tap-renderer.js`: isolated Tap simulation and presentation.
- `progression.js`: versioned profile, migration, recovery, rewards and service adapters.
- `progression-ui.js`: hangar, map, missions, cosmetics and journal.
- `game.js`: lifecycle, input, rendering, audio and screen orchestration.
- `style.css` / `index.html`: portrait UI, safe areas and accessible controls.

## Save compatibility

`spacehullProfile` is the unified versioned save; `spacehullProfileBackup` retains the prior valid save. Historical wallet, unlock, selected-rocket, settings, badges and per-mode record keys are migrated and mirrored for compatibility. Existing earned milestones are granted once. Reset requires an explicit in-game confirmation and preserves `spacehullResetBackup`.

The application ID remains unchanged. The visible name is SPACEHULL. A source backup from before the master update is in `backups/spacehull-20260916-191441`.

## Records and optional services

Local personal leaderboards work for both modes. Open allows different rockets; Classic filters known Scout runs without assistance. Explore can rank distance or skill score. No fabricated global or friend rankings appear. Online rankings still require an authenticated backend.

`configureServices({ rewardedAds })`, exported by `game.js`, accepts an adapter implementing `showRewarded({ placement })`. It must resolve `true` only after the provider's verified reward callback. Without an adapter, ad actions stay hidden. Supported placements include one Explore rescue, doubled collected coins, and a scanner for the next Explore run. Duplicate rewards and simultaneous requests are guarded. Assisted runs are excluded from Classic.

`getBalanceEvents()` exports the bounded local balancing-event buffer. No analytics are transmitted to a server.

## Validation and Android

`npm test`: **42 passing tests**, covering controls, collision, pools, mode separation, saves/recovery, milestone and mission idempotence, rocket abilities, trials, combos, Perfect Passes, discoveries, temporary upgrades and verified reward handling. Canvas integration tests use mocks; visual inspection is separate.

Browser checks covered 390×844 and 360×640 portraits, both modes, launch/crash/pause, hangar trials, map, missions, settings and records. No browser errors were observed in the final smoke check.

Run `npm run android:copy` to sync `www` into the Capacitor Android project. The app retains portrait orientation and its existing package ID.

Artwork is cached; device pixel ratio and pools are bounded; particle density adapts to sustained slow frames. Graphics settings expose Auto/Low/High. Physical Android touch, safe areas, haptics and sustained 60 FPS require device testing. Economy values are initial tuning and need longer player testing. No live ad SDK or online leaderboard provider is configured.

## Gameplay clarity and reliability update

Flight now uses a restrained nebula layer from the cached cinematic artwork, brighter rock edge lighting, distinct rocket accents/body details, instrument panels and a next-unearned-milestone indicator. The home cards retain their design. Tap's lower progress panel fades near the lower flight boundary to preserve visibility.

Paint is saved per rocket in `rocketPaints`. Legacy global paint migrates onto the equipped rocket once. Preview and flight use the same paint resolver. Ranger is teal, Atlas gold, Comet violet and Voyager blue. All local module imports carry a shared revision to prevent stale browser/WebView modules mixing with new UI code.

Corrections cover protected-contact near misses, rocket-specific Tap boundary radius, overdrive pickup/hazard speed consistency, direct trial exit, misleading trial mission reward messages and already-earned milestone prompts. Regression suite: **49 passing tests**. Portrait browser checks at 390×844 and 360×640 include Ranger preview/trial colour consistency and both HUDs. Physical-device performance remains unmeasured.

## Mines, coin goals and shared systems

Explore now spawns denser waves with a smoothly changing coin-marked safe corridor, plus early satellites and wreckage. The existing bomb hazard is retained as a pulsing, spiked space mine. Mine collisions use the normal crash/save lifecycle; shield and phase protection work without bypassing result handling. Explore personal records store run coins, and switching from the coin ranking to Tap preserves Tap score units.

The flight footer now targets the next eligible locked main rocket: wallet plus unbanked run earnings, remaining coins, and any unmet requirements. It never double-counts banked coins or auto-purchases a craft.

Planet positions no longer change side at region boundaries. Visible scenery uses continuous motion, with landmark wrapping beyond the viewport. Tap shares armor, magnetic coin attraction, phase, star shields (Aurora gets its longer duration), charged Comet overdrive, and Odyssey choices every 25 cleared formations. Fuel efficiency remains Explore-specific because Tap has no fuel. Magnetic fields never attract mines; protected column removal awards no Perfect Pass.

Validation: **60 passing tests**, including mine crashes/saves, shield absorption, coin rankings across modes, coin-goal accounting, background position continuity, safe openings, Tap magnet filtering, shields, Comet charging and Odyssey upgrade routing. Physical-device performance and extended difficulty/economy balancing still need playtesting.

Tap & Fun now includes pooled flying asteroids between alternating columns. They drift vertically and rotate, enter from beyond the right edge, and retain open column gaps. Collision uses swept distance and shared armor/shield/phase rules. They do not change formation score awards. Tests cover spawning, movement, recycling and protection: 64 tests pass.
