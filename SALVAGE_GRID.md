# SALVAGE GRID

Secondary SPACEHULL activity. Explore and Tap & Fun remain the only flight/competitive modes.

## Implementation
- `www/salvage.js`: pure 8x8 model, 15 shape library, weighted scratch-board generator, legal move search, simultaneous row/column clears, chain scoring and snapshots.
- `www/salvage-ui.js`: pointer capture, finger-offset drag, valid/invalid preview, animated return, fast clears, tutorial, pause/settings, target/claim/overtime and results.
- `www/progression.js`: persistent charges and attempt ID, shared coin wallet, single claims, progression, optional verified-ad recovery/doubling.
- `www/art/salvage-bay.svg`: original vector planet horizon and debris; CSS metal materials.

## Initial balance
Two introductory charges; maximum three. Each newly claimed flight milestone and mission gives one charge, capped. New attempts spend one; resuming an unfinished attempt spends none. Restart forfeits the old attempt and spends a new charge. Board and tray persist after every successful placement.

Target 2,500 points gives 300 coins; 5,000 gives another 100; 10,000 grants one unowned component if available. Below-target failure pays floor(score / 20), capped at 120. Successful recoveries 1/5/10/20/30/50 grant 100 coins / Ion trail / 500 coins / Arctic paint / Phase module / Salvage veteran trail. These thresholds and scoring live in SALVAGE and SALVAGE_MILESTONES. Existing distance-based rocket access remains unchanged; Salvage is optional.

Rewards are committed once per run. Ad recovery replaces an unusable tray once; double coins adds only the normal run coin portion. Ad buttons appear only when an actual rewarded-ad adapter is configured. No ad provider was added by this feature.

## Verification
`node --test --test-isolation=none tests/salvage.test.js tests/salvage-economy.test.js`: 16 tests pass, including generated-set solvability, randomized long games, simultaneous clears, persistence, charge consumption, stale-tab claim attempts, reward caps and all 50-success milestones.

Browser checks: real drag placement, occupied-cell rejection, bottom-row clear, score update, target choice, continued board in overtime, claim updates isolated shared wallet, pause and reload/resume. `tests/salvage-browser.html` provides a memory-only near-target fixture; serve the repository root to open it. It never touches the player profile and is outside packaged www assets.

Full existing suite: 87 pass, four older flight checks fail. They assert removed unlock wording and the previous fixed Explore corridor, while current flight code uses different unlock text and full-width random/homing obstacle generation. Those flight systems were not changed for Salvage.

Physical Android touch latency and sustained device FPS have not been measured. Android web assets are copied with Capacitor after verification.
