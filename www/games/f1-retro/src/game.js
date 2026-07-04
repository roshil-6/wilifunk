// Main Game Scene
class MainGame extends Phaser.Scene {
    constructor() {
        super({ key: 'MainGame' });
    }

    init(data) {
        this.trackKey = data.trackKey || 'classic';
        this.playerColor = data.playerColor || 'blue';
        this.aiCount = data.aiCount !== undefined ? data.aiCount : 3;
        this.controlStyle = data.controlStyle || 'wheel';
        this.gameMode = data.gameMode || 'championship';
        this.isMultiplayer = (this.gameMode === 'multiplayer');
        this.p2Color = (this.playerColor === 'blue') ? 'orange' : 'blue';
        
        this.cars = [];
        this.playerCar = null;
        this.player2Car = null;
        this.aiDrivers = [];
        
        // Race status
        this.raceState = 'COUNTDOWN'; // COUNTDOWN, RACING, FINISHED, PAUSED
        this.countdownValue = 3;
        this.raceTimer = 0;
        this.timeRemaining = 30.0; // Seconds to survive in Time Attack
        this.lastCrossedCheckpoint = -1; // Index tracker for checkpoints
        this.countdownTimer = null;
        
        // Keyboard inputs
        this.keys = {};
        
        // Control overlays values (mobile/visual)
        this.touchSteer = 0;
        this.touchThrottle = 0;
    }

    preload() {
        // Procedurally generate car textures for all colors in config
        Object.keys(CAR_COLORS).forEach(colorKey => {
            const data = CAR_COLORS[colorKey];
            Car.generateCarTexture(this, colorKey, data.primary, data.secondary);
        });
    }

    create() {
        // 1. Setup Graphics Layers
        this.track = new Track(this, this.trackKey);
        this.track.draw();

        // Layer for skidmarks so they render under cars
        this.skidmarkGraphics = this.add.graphics();

        // 2. Setup Particle Emitters for Smoke/Gravel Dust
        this.smokeParticles = this.add.particles(0, 0, null, {
            frequency: -1, // emit manually
            lifespan: 400,
            speed: { min: 20, max: 50 },
            scale: { start: 2.5, end: 0.5 },
            alpha: { start: 0.5, end: 0 },
            blendMode: 'NORMAL'
        });

        // 3. Spawn Grid Positions
        this.spawnRaceGrid();

        // 4. Input Listeners
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            esc: Phaser.Input.Keyboard.KeyCodes.ESC
        });

        // Prevent browser scrolling default behavior for Arrow, WASD, and Space keys
        this.input.keyboard.addCapture([
            Phaser.Input.Keyboard.KeyCodes.UP,
            Phaser.Input.Keyboard.KeyCodes.DOWN,
            Phaser.Input.Keyboard.KeyCodes.LEFT,
            Phaser.Input.Keyboard.KeyCodes.RIGHT,
            Phaser.Input.Keyboard.KeyCodes.W,
            Phaser.Input.Keyboard.KeyCodes.S,
            Phaser.Input.Keyboard.KeyCodes.A,
            Phaser.Input.Keyboard.KeyCodes.D,
            Phaser.Input.Keyboard.KeyCodes.SPACE
        ]);

        // Toggle mute key (M)
        this.input.keyboard.on('keydown-M', () => {
            const isSoundOn = synth.toggleMute();
            this.soundToggleText.setText(`SOUND: ${isSoundOn ? 'ON' : 'OFF'}`);
        });

        // Pause listener
        this.input.keyboard.on('keydown-ESC', () => {
            this.togglePause();
        });

        // 5. Draw Game UI & Overlays
        this.setupHUD();
        this.setupInteractiveControls();

        // 6. Start Race Countdown
        this.startCountdown();
        
        // Start engine synth
        synth.init();
        synth.startEngine();
    }

    spawnRaceGrid() {
        const centerline = this.track.config.centerline;
        const spline = this.track.spline;
        
        const isMultiplayer = (this.gameMode === 'multiplayer');
        const playerColorP1 = this.playerColor;
        const playerColorP2 = (playerColorP1 === 'orange') ? 'red' : 'orange';

        const totalCars = Math.min(this.aiCount + (isMultiplayer ? 2 : 1), 4);
        
        // Pick colors to use (avoiding repeats where possible)
        const allColors = Object.keys(CAR_COLORS);
        
        // Shuffle AI names and colors
        const aiNames = Phaser.Utils.Array.Shuffle([...AI_NAMES]);
        const aiColors = allColors.filter(c => c !== playerColorP1 && (!isMultiplayer || c !== playerColorP2));
        Phaser.Utils.Array.Shuffle(aiColors);

        // Spawn cars staggered backward along spline from t = 1.0 (starting line)
        for (let i = 0; i < totalCars; i++) {
            // Traverse spline backwards from the start line
            const t = (1.0 - (i * 0.015) + 1.0) % 1.0;
            const pt = spline.getPoint(t);
            const tangent = spline.getTangent(t);
            const nx = -tangent.y;
            const ny = tangent.x;
            
            // Alternate left/right offset from centerline
            const side = (i % 2 === 0) ? 1 : -1;
            const offsetDist = 18; // px offset
            
            const x = pt.x + nx * (offsetDist * side);
            const y = pt.y + ny * (offsetDist * side);
            const angle = Math.atan2(tangent.y, tangent.x);

            const isP1 = (i === totalCars - 1);
            const isP2 = isMultiplayer && (i === totalCars - 2);

            // Find nearest waypoint index on spawn to initialize car's waypoint index correctly
            let spawnNearestIdx = 0;
            let minDist = Infinity;
            const totalWaypoints = this.track.waypoints.length;
            for (let wIdx = 0; wIdx < totalWaypoints; wIdx++) {
                const dist = Phaser.Math.Distance.Between(x, y, this.track.waypoints[wIdx].x, this.track.waypoints[wIdx].y);
                if (dist < minDist) {
                    minDist = dist;
                    spawnNearestIdx = wIdx;
                }
            }

            let car;
            if (isP1) {
                car = new Car(this, x, y, `car-${playerColorP1}`, true, "PLAYER 1");
                this.playerCar = car;
            } else if (isP2) {
                car = new Car(this, x, y, `car-${playerColorP2}`, false, "PLAYER 2");
                car.isPlayer2 = true;
                this.player2Car = car;
            } else {
                const color = aiColors[i % aiColors.length];
                const name = aiNames[i % aiNames.length];
                car = new Car(this, x, y, `car-${color}`, false, name);
                
                // Assign AI Driver
                const driver = new AIDriver(car, this.track.waypoints);
                this.aiDrivers.push(driver);
            }

            car.lastWaypointIdx = spawnNearestIdx;
            car.rotation = angle;
            this.cars.push(car);
        }
    }

    setupHUD() {
        // Montserrat style overlays matching layout
        const dropShadow = { color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 0 };

        // 1. Top-Left Speedometer LCD Dashboard
        this.speedometerBg = this.add.graphics();
        this.speedometerBg.fillStyle(0x8ba888, 0.95); // Olive Green digital LCD
        this.speedometerBg.lineStyle(3, 0x111115, 1);
        this.speedometerBg.fillRoundedRect(20, 20, 160, 100, 8);
        this.speedometerBg.strokeRoundedRect(20, 20, 160, 100, 8);
        
        // HUD Texts
        this.hudSpeedVal = this.add.text(35, 30, '000', {
            fontFamily: 'Share Tech Mono',
            fontSize: '44px',
            color: '#1a2318',
            fontStyle: 'bold'
        });
        
        this.add.text(125, 45, 'KM/H', {
            fontFamily: 'Share Tech Mono',
            fontSize: '14px',
            color: '#1a2318',
            fontStyle: 'bold'
        });

        this.hudGearVal = this.add.text(35, 80, 'GEAR: 1', {
            fontFamily: 'Share Tech Mono',
            fontSize: '20px',
            color: '#1a2318',
            fontStyle: 'bold'
        });

        if (this.gameMode === 'multiplayer') {
            // Label P1
            this.add.text(25, 23, 'P1', {
                fontFamily: 'Share Tech Mono',
                fontSize: '10px',
                color: '#1a2318',
                fontStyle: 'bold'
            });

            // 1b. Player 2 Speedometer LCD Dashboard (Slate-Blue Gray)
            this.speedometer2Bg = this.add.graphics();
            this.speedometer2Bg.fillStyle(0x889fa8, 0.95);
            this.speedometer2Bg.lineStyle(3, 0x111115, 1);
            this.speedometer2Bg.fillRoundedRect(20, 135, 160, 100, 8);
            this.speedometer2Bg.strokeRoundedRect(20, 135, 160, 100, 8);

            this.add.text(25, 138, 'P2', {
                fontFamily: 'Share Tech Mono',
                fontSize: '10px',
                color: '#1a2318',
                fontStyle: 'bold'
            });

            this.hudSpeedVal2 = this.add.text(35, 145, '000', {
                fontFamily: 'Share Tech Mono',
                fontSize: '44px',
                color: '#1a2318',
                fontStyle: 'bold'
            });
            
            this.add.text(125, 160, 'KM/H', {
                fontFamily: 'Share Tech Mono',
                fontSize: '14px',
                color: '#1a2318',
                fontStyle: 'bold'
            });

            this.hudGearVal2 = this.add.text(35, 195, 'GEAR: 1', {
                fontFamily: 'Share Tech Mono',
                fontSize: '20px',
                color: '#1a2318',
                fontStyle: 'bold'
            });
        }

        // 2. Top-Right Stats (POS, LAP, TIME)
        this.hudPos = this.add.text(GAME_WIDTH - 200, 20, 'POS: 1 / 12', {
            fontFamily: 'Montserrat',
            fontSize: '20px',
            color: '#ffffff',
            align: 'right'
        }).setOrigin(1, 0).setShadow(2, 2, '#000000', 0);

        this.hudLap = this.add.text(GAME_WIDTH - 200, 50, 'LAP: 1 / 3', {
            fontFamily: 'Montserrat',
            fontSize: '20px',
            color: '#ffffff',
            align: 'right'
        }).setOrigin(1, 0).setShadow(2, 2, '#000000', 0);

        if (this.gameMode === 'multiplayer') {
            this.hudPos.setColor('#60a5fa');
            this.hudLap.setColor('#60a5fa');
            this.hudPos.setText('P1 POS: 1 / 12');
            this.hudLap.setText('P1 LAP: 1 / 3');

            this.hudPos2 = this.add.text(GAME_WIDTH - 360, 20, 'P2 POS: 2 / 12', {
                fontFamily: 'Montserrat',
                fontSize: '20px',
                color: '#f97316',
                align: 'right'
            }).setOrigin(1, 0).setShadow(2, 2, '#000000', 0);

            this.hudLap2 = this.add.text(GAME_WIDTH - 360, 50, 'P2 LAP: 1 / 3', {
                fontFamily: 'Montserrat',
                fontSize: '20px',
                color: '#f97316',
                align: 'right'
            }).setOrigin(1, 0).setShadow(2, 2, '#000000', 0);
        }

        // Checkered flag + Time block
        this.timeBg = this.add.graphics();
        this.timeBg.fillStyle(0x111115, 0.9);
        this.timeBg.fillRoundedRect(GAME_WIDTH - 250, 80, 230, 36, 4);

        this.hudTimer = this.add.text(GAME_WIDTH - 35, 85, '🏁 TIME: 0:00.000', {
            fontFamily: 'Share Tech Mono',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(1, 0);

        // 3. Leaderboard list on right
        this.leaderboardBg = this.add.graphics();
        this.leaderboardBg.fillStyle(0x111115, 0.7);
        this.leaderboardBg.fillRoundedRect(GAME_WIDTH - 250, 130, 230, 290, 4);
        
        this.hudLeaderboard = [];
        for (let i = 0; i < 6; i++) {
            const txt = this.add.text(GAME_WIDTH - 235, 145 + i * 45, '', {
                fontFamily: 'Share Tech Mono',
                fontSize: '16px',
                color: '#ffffff'
            });
            this.hudLeaderboard.push(txt);
        }

        // Countdown text overlay
        this.countdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, '', {
            fontFamily: 'Montserrat',
            fontSize: '120px',
            color: '#f59e0b',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5).setShadow(4, 4, '#000000', 0);

        // Sound toggle helper note
        this.soundToggleText = this.add.text(20, GAME_HEIGHT - 35, 'SOUND: ON (PRESS M TO MUTE)', {
            fontFamily: 'Share Tech Mono',
            fontSize: '13px',
            color: '#ffffff'
        }).setShadow(1, 1, '#000000', 0);

        // Adjust HUD layouts for Time Attack
        if (this.gameMode === 'timeattack') {
            this.hudPos.setVisible(false);
            this.timeBg.setVisible(false);
            this.hudTimer.setVisible(false);
            this.leaderboardBg.setVisible(false);
            this.hudLeaderboard.forEach(txt => txt.setVisible(false));

            // Create center digital clock
            this.hudClockBg = this.add.graphics();
            this.hudClockBg.fillStyle(0x000000, 0.8);
            this.hudClockBg.lineStyle(3, 0xef4444, 1);
            this.hudClockBg.fillRoundedRect(GAME_WIDTH / 2 - 80, 20, 160, 60, 6);
            this.hudClockBg.strokeRoundedRect(GAME_WIDTH / 2 - 80, 20, 160, 60, 6);

            this.hudClockText = this.add.text(GAME_WIDTH / 2, 50, '30.0', {
                fontFamily: 'Share Tech Mono',
                fontSize: '44px',
                color: '#fbbf24',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);
        }
    }

    setupInteractiveControls() {
        const joystickBase = document.getElementById('html-joystick-base');
        const wheelControls = document.getElementById('html-wheel-controls');
        
        if (this.controlStyle === 'joystick') {
            if (joystickBase) joystickBase.classList.remove('hidden');
            if (wheelControls) wheelControls.classList.add('hidden');
        } else if (this.controlStyle === 'wheel') {
            if (joystickBase) joystickBase.classList.add('hidden');
            if (wheelControls) wheelControls.classList.remove('hidden');
            
            // Set up HTML steering wheel and pedals listeners
            const wheelEl = document.getElementById('html-steering-wheel');
            const pedalBrakeEl = document.getElementById('html-pedal-brake');
            const pedalAccelEl = document.getElementById('html-pedal-accel');
            
            this.isDraggingWheel = false;
            this.isPedalBrakePressed = false;
            this.isPedalAccelPressed = false;
            
            let wheelCenterX = 0;
            let wheelCenterY = 0;
            let startAngle = 0;
            
            const startWheelDrag = (e) => {
                this.isDraggingWheel = true;
                const rect = wheelEl.getBoundingClientRect();
                wheelCenterX = rect.left + rect.width / 2;
                wheelCenterY = rect.top + rect.height / 2;
                
                const pageX = e.touches ? e.touches[0].clientX : e.clientX;
                const pageY = e.touches ? e.touches[0].clientY : e.clientY;
                startAngle = Math.atan2(pageY - wheelCenterY, pageX - wheelCenterX);
                
                if (e.cancelable) e.preventDefault();
            };
            
            const moveWheelDrag = (e) => {
                if (!this.isDraggingWheel) return;
                const pageX = e.touches ? e.touches[0].clientX : e.clientX;
                const pageY = e.touches ? e.touches[0].clientY : e.clientY;
                const angle = Math.atan2(pageY - wheelCenterY, pageX - wheelCenterX);
                let angleDiff = angle - startAngle;
                
                // Wrap to -PI/PI range
                angleDiff = Phaser.Math.Angle.Wrap(angleDiff);
                
                let degrees = angleDiff * (180 / Math.PI);
                degrees = Phaser.Math.Clamp(degrees, -80, 80); // clamp turning range
                
                wheelEl.style.transform = `rotate(${degrees}deg)`;
                wheelEl.setAttribute('data-angle', degrees);
                this.touchSteer = degrees / 80;
                
                if (e.cancelable) e.preventDefault();
            };
            
            const stopWheelDrag = () => {
                if (!this.isDraggingWheel) return;
                this.isDraggingWheel = false;
                wheelEl.style.transform = 'rotate(0deg)';
                wheelEl.setAttribute('data-angle', 0);
                this.touchSteer = 0;
            };
            
            // Wheel event bindings
            const wheelContainer = document.getElementById('html-steering-wheel-container');
            if (wheelContainer) {
                wheelContainer.addEventListener('touchstart', startWheelDrag, { passive: false });
                window.addEventListener('touchmove', moveWheelDrag, { passive: false });
                window.addEventListener('touchend', stopWheelDrag);
                
                wheelContainer.addEventListener('mousedown', startWheelDrag);
                window.addEventListener('mousemove', moveWheelDrag);
                window.addEventListener('mouseup', stopWheelDrag);
            }
            
            // Pedals event bindings
            const startBrake = (e) => {
                this.isPedalBrakePressed = true;
                this.touchThrottle = -1.0;
                pedalBrakeEl.classList.add('active');
                if (e.cancelable) e.preventDefault();
            };
            const stopBrake = () => {
                if (!this.isPedalBrakePressed) return;
                this.isPedalBrakePressed = false;
                pedalBrakeEl.classList.remove('active');
                if (!this.isPedalAccelPressed) {
                    this.touchThrottle = 0;
                }
            };
            
            const startAccel = (e) => {
                this.isPedalAccelPressed = true;
                this.touchThrottle = 1.0;
                pedalAccelEl.classList.add('active');
                if (e.cancelable) e.preventDefault();
            };
            const stopAccel = () => {
                if (!this.isPedalAccelPressed) return;
                this.isPedalAccelPressed = false;
                pedalAccelEl.classList.remove('active');
                if (this.isPedalBrakePressed) {
                    this.touchThrottle = -1.0;
                } else {
                    this.touchThrottle = 0;
                }
            };
            
            if (pedalBrakeEl) {
                pedalBrakeEl.addEventListener('touchstart', startBrake, { passive: false });
                pedalBrakeEl.addEventListener('touchend', stopBrake);
                pedalBrakeEl.addEventListener('touchcancel', stopBrake);
                pedalBrakeEl.addEventListener('mousedown', startBrake);
                pedalBrakeEl.addEventListener('mouseup', stopBrake);
                pedalBrakeEl.addEventListener('mouseleave', stopBrake);
            }
            
            if (pedalAccelEl) {
                pedalAccelEl.addEventListener('touchstart', startAccel, { passive: false });
                pedalAccelEl.addEventListener('touchend', stopAccel);
                pedalAccelEl.addEventListener('touchcancel', stopAccel);
                pedalAccelEl.addEventListener('mousedown', startAccel);
                pedalAccelEl.addEventListener('mouseup', stopAccel);
                pedalAccelEl.addEventListener('mouseleave', stopAccel);
            }
        } else {
            if (joystickBase) joystickBase.classList.add('hidden');
            if (wheelControls) wheelControls.classList.add('hidden');
        }
    }

    startCountdown() {
        this.raceState = 'COUNTDOWN';
        this.countdownValue = 3;
        this.countdownText.setText('3').setScale(1.2);
        
        synth.playBeep(440, 0.15); // Low beep

        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.countdownValue--;
                if (this.countdownValue === 2) {
                    this.countdownText.setText('2').setScale(1.2);
                    synth.playBeep(440, 0.15);
                } else if (this.countdownValue === 1) {
                    this.countdownText.setText('1').setScale(1.2);
                    synth.playBeep(440, 0.15);
                } else if (this.countdownValue === 0) {
                    this.countdownText.setText('GO!').setColor('#10b981').setScale(1.3);
                    synth.playBeep(880, 0.4); // High beep
                    this.raceState = 'RACING';
                    this.raceTimer = 0;

                    // Remove countdown text shortly after
                    this.time.delayedCall(800, () => {
                        this.countdownText.setText('');
                    });
                }
            },
            repeat: 3
        });
    }

    update(time, delta) {
        // Limit delta step to prevent physics glitch on lag
        const dt = Math.min(delta / 1000, 0.1);

        if (this.raceState === 'PAUSED') return;

        // 1. Accumulate timer
        if (this.raceState === 'RACING') {
            if (this.gameMode === 'timeattack') {
                this.timeRemaining -= dt;
                if (this.timeRemaining <= 0) {
                    this.timeRemaining = 0;
                    this.timeOver();
                }
                this.updateClockHUD();
            } else {
                this.raceTimer += dt;
                this.updateTimerHUD();
            }
        }

        // 2. Input compilation
        let steer = 0;
        let throttle = 0;
        let steer2 = 0;
        let throttle2 = 0;

        if (this.raceState === 'RACING') {
            if (this.gameMode === 'multiplayer') {
                // Split controls: P1 uses Arrows
                if (this.keys.left.isDown) steer = -1;
                else if (this.keys.right.isDown) steer = 1;

                if (this.keys.up.isDown) throttle = 1.0;
                else if (this.keys.down.isDown) throttle = -0.8;

                // P2 uses WASD
                if (this.keys.a.isDown) steer2 = -1;
                else if (this.keys.d.isDown) steer2 = 1;

                if (this.keys.w.isDown) throttle2 = 1.0;
                else if (this.keys.s.isDown) throttle2 = -0.8;
            } else {
                // Single-player: P1 can use Arrows OR WASD
                if (this.keys.left.isDown || this.keys.a.isDown) steer = -1;
                else if (this.keys.right.isDown || this.keys.d.isDown) steer = 1;

                if (this.keys.up.isDown || this.keys.w.isDown) throttle = 1.0;
                else if (this.keys.down.isDown || this.keys.s.isDown) throttle = -0.8;
            }

            // Combine/fall back to mobile controls for P1
            if (steer === 0) {
                steer = this.controlStyle === 'joystick' ? (window.htmlTouchSteer || 0) : this.touchSteer;
            }
            if (throttle === 0) {
                throttle = this.controlStyle === 'joystick' ? (window.htmlTouchThrottle || 0) : this.touchThrottle;
            }
        }

        // Update wheel rotation visual representation matching keyboard input (P1)
        if (this.raceState === 'RACING') {
            if (this.wheelContainer) {
                if (steer < 0) {
                    this.wheelContainer.angle = Phaser.Math.Linear(this.wheelContainer.angle, -45, 12 * dt);
                } else if (steer > 0) {
                    this.wheelContainer.angle = Phaser.Math.Linear(this.wheelContainer.angle, 45, 12 * dt);
                } else {
                    this.wheelContainer.angle = Phaser.Math.Linear(this.wheelContainer.angle, 0, 15 * dt);
                }
            }

            // Sync visual pedal depression (P1)
            if (this.pedalBrake && this.pedalAccel) {
                this.drawPedals(throttle < 0, throttle > 0);
            }
        }

        // 3. Physics Updates
        this.cars.forEach(car => {
            // Detect surface
            const surf = this.track.getSurface(car.x, car.y);
            car.onTrack = surf.onTrack;
            car.onGravel = surf.onGravel;

            if (car.isPlayer) {
                car.update(dt, steer, throttle);
            } else if (car.isPlayer2) {
                car.update(dt, steer2, throttle2);
            } else {
                // Find driver associated
                const driver = this.aiDrivers.find(d => d.car === car);
                if (driver) {
                    const aiInput = driver.computeInputs(dt, this.cars);
                    // Override inputs if still counting down
                    if (this.raceState === 'COUNTDOWN') {
                        car.update(dt, 0, 0);
                    } else {
                        car.update(dt, aiInput.steer, aiInput.throttle);
                    }
                }
            }

            // Skidmarks and smoke particle effects
            this.handleParticlesAndSkids(car, dt);
        });

        // 4. Handle collisions
        this.resolveCollisions(dt);

        // 5. Check points/laps progress
        this.updateLeaderboardRankings();
        this.updateSpeedometerHUD();
    }

    handleParticlesAndSkids(car, dt) {
        // Emit skidmarks on asphalt
        if (car.isDrifting && car.onTrack && !car.onGravel && Math.abs(car.speed) > 100) {
            // Draw gray skidmark line behind wheels
            const backOffsetAngle = car.rotation + Math.PI;
            
            // Calculate wheel offsets
            const leftW = {
                x: car.x + Math.cos(backOffsetAngle) * 16 - Math.sin(backOffsetAngle) * 10,
                y: car.y + Math.sin(backOffsetAngle) * 16 + Math.cos(backOffsetAngle) * 10
            };
            const rightW = {
                x: car.x + Math.cos(backOffsetAngle) * 16 + Math.sin(backOffsetAngle) * 10,
                y: car.y + Math.sin(backOffsetAngle) * 16 - Math.cos(backOffsetAngle) * 10
            };

            this.skidmarkGraphics.lineStyle(2, 0x1f2937, 0.4);
            
            if (car.lastSkidPoints) {
                this.skidmarkGraphics.lineBetween(car.lastSkidPoints.lx, car.lastSkidPoints.ly, leftW.x, leftW.y);
                this.skidmarkGraphics.lineBetween(car.lastSkidPoints.rx, car.lastSkidPoints.ry, rightW.x, rightW.y);
            }

            car.lastSkidPoints = { lx: leftW.x, ly: leftW.y, rx: rightW.x, ry: rightW.y };

            // Emit white tire smoke particles
            if (Math.random() < 0.35) {
                this.smokeParticles.emitParticleAt(car.x + Math.cos(backOffsetAngle) * 15, car.y + Math.sin(backOffsetAngle) * 15);
            }
        } else {
            car.lastSkidPoints = null;
        }

        // Emit brown gravel dust particles
        if (car.onGravel && Math.abs(car.speed) > 30) {
            const backAngle = car.rotation + Math.PI;
            
            // Draw brief dust particles
            this.graphics = this.graphics || this.add.graphics();
            this.skidmarkGraphics.fillStyle(0x8a6d43, 0.2); // flat sandy dust marks
            this.skidmarkGraphics.fillCircle(car.x + Math.cos(backAngle) * 15 + Phaser.Math.Between(-6,6), car.y + Math.sin(backAngle) * 15 + Phaser.Math.Between(-6,6), 4);
        }
    }

    resolveCollisions(dt) {
        // Car-to-Car collision disabled per request (cars pass through each other to prevent pile-ups)
        /*
        for (let i = 0; i < this.cars.length; i++) {
            for (let j = i + 1; j < this.cars.length; j++) {
                this.cars[i].handleCarCollision(this.cars[j], dt);
            }
        }
        */

        // Car-to-Obstacle bounds check
        const tires = this.track.config.decorations.tires;
        const trees = this.track.config.decorations.trees;

        this.cars.forEach(car => {
            // Check against tires (radius 9)
            tires.forEach(t => {
                car.handleObstacleCollision(t.x, t.y, 9);
            });
            // Check against trees (radius 22)
            trees.forEach(t => {
                car.handleObstacleCollision(t.x, t.y, 20); // slightly smaller collision radius for trees for clean gameplay
            });
        });
    }

    updateLeaderboardRankings() {
        const totalWaypoints = this.track.waypoints.length;

        // Loop through all cars and update lap progress
        this.cars.forEach(car => {
            if (car.raceFinished) return;

            // Find closest waypoint to estimate completion
            let minDist = Infinity;
            let nearestIdx = car.lastWaypointIdx;
            
            // Search in a window of 30 nodes around the last recorded index to prevent jumping/cuts
            const searchWindow = 35;
            for (let i = -searchWindow; i <= searchWindow; i++) {
                const idx = (car.lastWaypointIdx + i + totalWaypoints) % totalWaypoints;
                const dist = Phaser.Math.Distance.Between(car.x, car.y, this.track.waypoints[idx].x, this.track.waypoints[idx].y);
                if (dist < minDist) {
                    minDist = dist;
                    nearestIdx = idx;
                }
            }

            // Check lap completion crossing (wrapping from high waypoint index to low)
            const diff = nearestIdx - car.lastWaypointIdx;
            const wrapThreshold = totalWaypoints * 0.7;

            if (Math.abs(diff) < wrapThreshold) {
                // Standard progress update
                if (nearestIdx > car.lastWaypointIdx) {
                    car.lastWaypointIdx = nearestIdx;
                    
                    // Track if midpoint has been passed to enable lap wraps (using a wide 25%-75% window to prevent high-speed skips)
                    if (nearestIdx > totalWaypoints * 0.25 && nearestIdx < totalWaypoints * 0.75) {
                        car.hasPassedMidpoint = true;
                    }
                    
                    if (car.isPlayer && this.gameMode === 'timeattack') {
                        this.checkTimeAttackCheckpoints(nearestIdx);
                    }
                }
            } else {
                // Wrap-around detected
                if (car.lastWaypointIdx > totalWaypoints * 0.8 && nearestIdx < totalWaypoints * 0.2) {
                    if (car.hasPassedMidpoint) {
                        // Crossed line in forward direction AND has travelled around the track
                        car.currentLap++;
                        car.lastWaypointIdx = nearestIdx;
                        car.hasPassedMidpoint = false; // Reset for next lap

                        if (this.gameMode === 'timeattack') {
                            if (car.isPlayer) {
                                this.awardTimeExtension(20.0, "LAP EXTENSION!");
                                this.lastCrossedCheckpoint = -1;
                            }
                        } else {
                            if (car.currentLap > this.track.config.laps) {
                                car.raceFinished = true;
                                car.finishTime = this.raceTimer;
                                
                                if (this.gameMode === 'multiplayer') {
                                    if (car.isPlayer || car.isPlayer2) {
                                        synth.playBeep(660, 0.2);
                                    }
                                    if (this.playerCar.raceFinished && this.player2Car.raceFinished) {
                                        this.finishRace();
                                    }
                                } else {
                                    if (car.isPlayer) {
                                        this.finishRace();
                                    }
                                }
                            } else {
                                // Play beep for lap cross (player only)
                                if (car.isPlayer || car.isPlayer2) {
                                    synth.playBeep(660, 0.2);
                                }
                            }
                        }
                    } else {
                        // Just update index, do not increment lap
                        car.lastWaypointIdx = nearestIdx;
                    }
                }
            }

            // Calculate precise fractional progress
            car.progressFraction = car.currentLap + (nearestIdx / totalWaypoints);
        });

        // Sort cars by total progress fraction
        const rankings = [...this.cars].sort((a, b) => {
            if (a.raceFinished && b.raceFinished) {
                return a.finishTime - b.finishTime; // earlier finish time wins
            }
            if (a.raceFinished) return -1;
            if (b.raceFinished) return 1;
            return b.progressFraction - a.progressFraction; // higher progress wins
        });

        // Force end the race if remaining cars cannot change standings
        if (this.raceState === 'RACING') {
            const finishedCarsCount = this.cars.filter(c => c.raceFinished).length;
            if (this.gameMode === 'multiplayer') {
                const bothPlayersFinished = this.playerCar.raceFinished && this.player2Car.raceFinished;
                if (bothPlayersFinished || (finishedCarsCount >= this.cars.length - 1 && this.playerCar.raceFinished && this.player2Car.raceFinished)) {
                    this.finishRace();
                    return;
                }
            } else if (this.gameMode === 'championship') {
                if (finishedCarsCount >= this.cars.length - 1 && !this.playerCar.raceFinished) {
                    this.playerCar.raceFinished = true;
                    this.playerCar.finishTime = this.raceTimer;
                    this.finishRace();
                    return;
                }
            }
        }

        // Update player positioning stats
        if (this.gameMode === 'multiplayer') {
            const playerRank = rankings.indexOf(this.playerCar) + 1;
            const currentLapVal = Math.min(this.playerCar.currentLap, this.track.config.laps);
            this.hudPos.setText(`P1 POS: ${playerRank} / ${rankings.length}`);
            this.hudLap.setText(`P1 LAP: ${currentLapVal} / ${this.track.config.laps}`);

            const player2Rank = rankings.indexOf(this.player2Car) + 1;
            const currentLapVal2 = Math.min(this.player2Car.currentLap, this.track.config.laps);
            this.hudPos2.setText(`P2 POS: ${player2Rank} / ${rankings.length}`);
            this.hudLap2.setText(`P2 LAP: ${currentLapVal2} / ${this.track.config.laps}`);
        } else {
            const playerRank = rankings.indexOf(this.playerCar) + 1;
            this.hudPos.setText(`POS: ${playerRank} / ${rankings.length}`);
            
            const currentLapVal = Math.min(this.playerCar.currentLap, this.track.config.laps);
            this.hudLap.setText(`LAP: ${currentLapVal} / ${this.track.config.laps}`);
        }

        // Update Leaderboard overlay
        const leader = rankings[0];
        for (let i = 0; i < 6; i++) {
            if (i < rankings.length) {
                const car = rankings[i];
                let gapText = "";
                
                if (i === 0) {
                    if (car.raceFinished) {
                        gapText = "FINISH";
                    } else {
                        gapText = "LEADER";
                    }
                } else {
                    // Approximate distance/time gap (1 progress unit ~ 15 seconds)
                    const diffFraction = leader.progressFraction - car.progressFraction;
                    const gapSec = diffFraction * 14.5;
                    
                    if (car.raceFinished) {
                        gapText = `+${(car.finishTime - leader.finishTime).toFixed(2)}s`;
                    } else {
                        gapText = `+${gapSec.toFixed(2)}s`;
                    }
                }

                // Format row
                const prefix = car.isPlayer ? "▶ " : (car.isPlayer2 ? "▷ " : "");
                const nameStr = (prefix + car.driverName).substring(0, 10);
                this.hudLeaderboard[i].setText(`${i + 1}. ${nameStr.padEnd(10, ' ')} ${gapText}`);
                
                // Highlight player name
                if (car.isPlayer) {
                    this.hudLeaderboard[i].setColor('#60a5fa');
                } else if (car.isPlayer2) {
                    this.hudLeaderboard[i].setColor('#f97316');
                } else {
                    this.hudLeaderboard[i].setColor('#ffffff');
                }
            } else {
                this.hudLeaderboard[i].setText('');
            }
        }
    }

    updateSpeedometerHUD() {
        const speedKmh = Math.round(Math.abs(this.playerCar.speed));
        this.hudSpeedVal.setText(speedKmh.toString().padStart(3, '0'));
        this.hudGearVal.setText(`GEAR: ${this.playerCar.gear}`);

        if (this.gameMode === 'multiplayer') {
            const speedKmh2 = Math.round(Math.abs(this.player2Car.speed));
            this.hudSpeedVal2.setText(speedKmh2.toString().padStart(3, '0'));
            this.hudGearVal2.setText(`GEAR: ${this.player2Car.gear}`);
        }
    }

    updateTimerHUD() {
        const msTotal = Math.floor(this.raceTimer * 1000);
        const mins = Math.floor(msTotal / 60000);
        const secs = Math.floor((msTotal % 60000) / 1000);
        const ms = msTotal % 1000;

        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
        this.hudTimer.setText(`🏁 TIME: ${timeStr}`);
    }

    updateClockHUD() {
        if (this.hudClockText) {
            this.hudClockText.setText(this.timeRemaining.toFixed(1));
            if (this.timeRemaining < 10) {
                this.hudClockText.setColor('#ef4444');
                if (Math.floor(this.timeRemaining * 5) % 2 === 0) {
                    this.hudClockText.setAlpha(0.2);
                } else {
                    this.hudClockText.setAlpha(1.0);
                }
            } else {
                this.hudClockText.setColor('#fbbf24');
                this.hudClockText.setAlpha(1.0);
            }
        }
    }

    checkTimeAttackCheckpoints(idx) {
        if (this.lastCrossedCheckpoint === -1 && idx >= 90 && idx < 180) {
            this.awardTimeExtension(15.0, "CHECKPOINT 1");
            this.lastCrossedCheckpoint = 0;
        } else if (this.lastCrossedCheckpoint === 0 && idx >= 180 && idx < 270) {
            this.awardTimeExtension(15.0, "CHECKPOINT 2");
            this.lastCrossedCheckpoint = 1;
        } else if (this.lastCrossedCheckpoint === 1 && idx >= 270 && idx < 360) {
            this.awardTimeExtension(15.0, "CHECKPOINT 3");
            this.lastCrossedCheckpoint = 2;
        }
    }

    awardTimeExtension(seconds, label) {
        this.timeRemaining = Math.min(this.timeRemaining + seconds, 99.9);
        
        // Play arcade checkpoint sound
        synth.playBeep(880, 0.15);
        this.time.delayedCall(80, () => synth.playBeep(1100, 0.15));

        // Display animated checkpoint overlay
        const checkpointTxt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, `${label}!\n+${seconds}s TIME EXTENSION`, {
            fontFamily: 'Montserrat',
            fontSize: '36px',
            color: '#10b981',
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5).setShadow(3, 3, '#000000', 0);

        this.tweens.add({
            targets: checkpointTxt,
            scaleX: 1.4,
            scaleY: 1.4,
            alpha: 0,
            duration: 1200,
            onComplete: () => {
                checkpointTxt.destroy();
            }
        });
    }

    timeOver() {
        this.raceState = 'FINISHED';
        synth.stopEngine();
        
        // Play low timeout buzz
        synth.playBeep(220, 1.2);
        
        this.countdownText.setText('TIME OVER').setColor('#ef4444').setScale(1.0);
        
        setTimeout(() => {
            const resultsOverlay = document.getElementById('results-overlay');
            const resultsTitle = document.getElementById('results-title');
            const playerRankSpan = document.getElementById('player-final-pos');
            const resultsRows = document.getElementById('leaderboard-results-rows');
            
            resultsTitle.textContent = "TIME OVER!";
            
            const reachedLaps = this.playerCar.currentLap - 1;
            const progressPct = Math.round((this.playerCar.lastWaypointIdx / this.track.waypoints.length) * 100);
            playerRankSpan.textContent = `LAPS: ${reachedLaps} (${progressPct}% L${this.playerCar.currentLap})`;
            
            resultsRows.innerHTML = '';
            
            // Sort cars by total progress fraction
            const rankings = [...this.cars].sort((a, b) => b.progressFraction - a.progressFraction);
            rankings.forEach((car, index) => {
                const row = document.createElement('div');
                row.className = `leaderboard-row ${car.isPlayer ? 'player-row' : ''}`;
                
                const posSpan = document.createElement('span');
                posSpan.textContent = `${index + 1}`;
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = car.driverName;
                
                const timeSpan = document.createElement('span');
                timeSpan.textContent = `Lap ${car.currentLap} (${Math.round((car.lastWaypointIdx / this.track.waypoints.length) * 100)}%)`;
                
                row.appendChild(posSpan);
                row.appendChild(nameSpan);
                row.appendChild(timeSpan);
                resultsRows.appendChild(row);
            });
            
            resultsOverlay.classList.remove('hidden');
        }, 2500);
    }

    finishRace() {
        this.raceState = 'FINISHED';
        synth.playFinishFanfare();
        synth.stopEngine(0);
        synth.stopEngine(1);

        // Reset title block text to default
        const resultsTitle = document.getElementById('results-title');
        resultsTitle.textContent = "RACE FINISHED!";

        // Calculate and build final standings array
        const rankings = [...this.cars].sort((a, b) => {
            if (a.raceFinished && b.raceFinished) return a.finishTime - b.finishTime;
            if (a.raceFinished) return -1;
            if (b.raceFinished) return 1;
            return b.progressFraction - a.progressFraction;
        });

        const playerRank = rankings.indexOf(this.playerCar) + 1;
        const player2Rank = this.gameMode === 'multiplayer' ? rankings.indexOf(this.player2Car) + 1 : -1;
        
        // Show results screen overlay
        setTimeout(() => {
            const resultsOverlay = document.getElementById('results-overlay');
            const playerRankSpan = document.getElementById('player-final-pos');
            const resultsRows = document.getElementById('leaderboard-results-rows');
            
            // Format player rank suffix
            let suffix = "th";
            if (playerRank === 1) suffix = "st";
            else if (playerRank === 2) suffix = "nd";
            else if (playerRank === 3) suffix = "rd";
            
            if (this.gameMode === 'multiplayer') {
                let suffix2 = "th";
                if (player2Rank === 1) suffix2 = "st";
                else if (player2Rank === 2) suffix2 = "nd";
                else if (player2Rank === 3) suffix2 = "rd";

                playerRankSpan.innerHTML = `P1: <span style="color:#60a5fa">${playerRank}${suffix}</span> | P2: <span style="color:#f97316">${player2Rank}${suffix2}</span>`;
            } else {
                playerRankSpan.textContent = `${playerRank}${suffix}`;
            }
            
            // Clear and populate rows
            resultsRows.innerHTML = '';
            
            rankings.forEach((car, index) => {
                const row = document.createElement('div');
                row.className = `leaderboard-row ${car.isPlayer ? 'player-row' : ''} ${car.isPlayer2 ? 'player2-row' : ''}`;
                
                const posSpan = document.createElement('span');
                posSpan.textContent = `${index + 1}`;
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = car.driverName;
                
                const timeSpan = document.createElement('span');
                
                const msTotal = Math.floor(car.finishTime * 1000);
                const mins = Math.floor(msTotal / 60000);
                const secs = Math.floor((msTotal % 60000) / 1000);
                const ms = msTotal % 1000;
                
                let finishText = "DNF";
                if (car.raceFinished && car.currentLap > this.track.config.laps) {
                    finishText = `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
                } else if (car.currentLap <= this.track.config.laps) {
                    const lapsBehind = this.track.config.laps - car.currentLap + 1;
                    finishText = `+${lapsBehind} Lap${lapsBehind > 1 ? 's' : ''}`;
                }
                timeSpan.textContent = finishText;
                
                row.appendChild(posSpan);
                row.appendChild(nameSpan);
                row.appendChild(timeSpan);
                resultsRows.appendChild(row);
            });
            
            resultsOverlay.classList.remove('hidden');
        }, 1500);
    }

    togglePause() {
        if (this.raceState === 'COUNTDOWN' || this.raceState === 'FINISHED') return;

        if (this.raceState === 'RACING') {
            this.raceState = 'PAUSED';
            synth.stopEngine(0);
            synth.stopEngine(1);
            // Show a simple pause notification using text
            this.pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GAME PAUSED\n[ESC] TO RESUME', {
                fontFamily: 'Montserrat',
                fontSize: '48px',
                color: '#ffffff',
                align: 'center',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5).setShadow(4, 4, '#000000', 0);
        } else if (this.raceState === 'PAUSED') {
            this.raceState = 'RACING';
            synth.startEngine(0);
            if (this.gameMode === 'multiplayer') {
                synth.startEngine(1);
            }
            if (this.pauseText) {
                this.pauseText.destroy();
                this.pauseText = null;
            }
        }
    }
}

// -------------------------------------------------------------
// Bootstrapping Phaser setup & HTML bindings
// -------------------------------------------------------------
let game = null;

function initGame() {
    const trackSelect = document.getElementById('track-select');
    const aiCountSelect = document.getElementById('ai-count');
    const colorButtons = document.querySelectorAll('.color-btn');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const menuOverlay = document.getElementById('menu-overlay');
    const resultsOverlay = document.getElementById('results-overlay');
    
    // Joystick DOM elements
    const joystickContainer = document.getElementById('mobile-controls-container');
    const joystickBase = document.getElementById('html-joystick-base');
    const joystickKnob = document.getElementById('html-joystick-knob');
    
    let selectedColor = 'blue';

    // 1. Color Button events
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            colorButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedColor = btn.getAttribute('data-color');
        });
    });

    const modeSelect = document.getElementById('mode-select');
    const aiCountSection = document.getElementById('ai-count-section');
    const singleplayerModeSection = document.getElementById('singleplayer-mode-section');
    const btn1Player = document.getElementById('btn-1player');
    const btn2Player = document.getElementById('btn-2player');

    let selectedPlayers = 1; // Default 1 Player

    btn1Player.addEventListener('click', () => {
        selectedPlayers = 1;
        btn1Player.classList.add('active');
        btn2Player.classList.remove('active');
        singleplayerModeSection.style.display = 'block';
        
        if (modeSelect.value === 'timeattack') {
            aiCountSection.style.display = 'none';
        } else {
            aiCountSection.style.display = 'block';
        }
    });

    btn2Player.addEventListener('click', () => {
        selectedPlayers = 2;
        btn2Player.classList.add('active');
        btn1Player.classList.remove('active');
        singleplayerModeSection.style.display = 'none';
        
        aiCountSection.style.display = 'block';
    });

    modeSelect.addEventListener('change', () => {
        if (selectedPlayers === 1 && modeSelect.value === 'timeattack') {
            aiCountSection.style.display = 'none';
        } else {
            aiCountSection.style.display = 'block';
        }
    });

    // 2. Start Game execution
    startBtn.addEventListener('click', () => {
        const trackKey = trackSelect.value;
        const gameMode = (selectedPlayers === 2) ? 'multiplayer' : modeSelect.value;
        const aiCount = gameMode === 'timeattack' ? 0 : parseInt(aiCountSelect.value, 10);
        const controlSelect = document.getElementById('control-select');
        const controlStyle = controlSelect.value;

        menuOverlay.classList.add('hidden');
        
        // Show/hide HTML virtual controls container
        if (controlStyle === 'joystick' || controlStyle === 'wheel') {
            joystickContainer.classList.remove('hidden');
        } else {
            joystickContainer.classList.add('hidden');
        }
        
        // Start sound engine on click
        synth.init();

        const config = {
            type: Phaser.AUTO,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            parent: 'game-container',
            backgroundColor: '#16a34a',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false
                }
            },
            scene: [MainGame]
        };

        if (game) {
            game.destroy(true);
        }
        
        game = new Phaser.Game(config);
        
        // Start main game with selected preferences
        setTimeout(() => {
            game.scene.start('MainGame', {
                trackKey: trackKey,
                playerColor: selectedColor,
                aiCount: aiCount,
                controlStyle: controlStyle,
                gameMode: gameMode
            });
        }, 100);
    });

    // 3. Restart Game button
    restartBtn.addEventListener('click', () => {
        resultsOverlay.classList.add('hidden');
        menuOverlay.classList.remove('hidden');
        
        // Always hide joystick when back in menu
        joystickContainer.classList.add('hidden');
        
        // Synchronize menu toggles on restart
        if (selectedPlayers === 2) {
            singleplayerModeSection.style.display = 'none';
            aiCountSection.style.display = 'block';
        } else {
            singleplayerModeSection.style.display = 'block';
            if (modeSelect.value === 'timeattack') {
                aiCountSection.style.display = 'none';
            } else {
                aiCountSection.style.display = 'block';
            }
        }
        
        if (game) {
            game.destroy(true);
            game = null;
        }
    });

    // 4. Bind HTML Virtual Joystick drag events
    let isDraggingJoystick = false;
    let joystickCenter = { x: 0, y: 0 };
    
    window.htmlTouchSteer = 0;
    window.htmlTouchThrottle = 0;

    function handleJoystickMove(touch) {
        const dx = touch.clientX - joystickCenter.x;
        const dy = touch.clientY - joystickCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 45;
        
        let kx = dx;
        let ky = dy;
        
        if (dist > maxDist) {
            kx = (dx / dist) * maxDist;
            ky = (dy / dist) * maxDist;
        }
        
        joystickKnob.style.left = `calc(50% + ${kx}px)`;
        joystickKnob.style.top = `calc(50% + ${ky}px)`;
        
        // Update global steer / throttle
        window.htmlTouchSteer = kx / maxDist;
        const vertical = -ky / maxDist;
        if (vertical >= 0) {
            window.htmlTouchThrottle = vertical; // Accel
        } else {
            window.htmlTouchThrottle = vertical * 0.8; // Brake
        }
    }

    const startDrag = (e) => {
        isDraggingJoystick = true;
        const rect = joystickBase.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        const point = e.touches ? e.touches[0] : e;
        handleJoystickMove(point);
    };

    const moveDrag = (e) => {
        if (!isDraggingJoystick) return;
        if (e.cancelable) e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        handleJoystickMove(point);
    };

    const stopDrag = () => {
        if (!isDraggingJoystick) return;
        isDraggingJoystick = false;
        joystickKnob.style.left = '50%';
        joystickKnob.style.top = '50%';
        window.htmlTouchSteer = 0;
        window.htmlTouchThrottle = 0;
    };

    // Touch events for mobile
    joystickBase.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', moveDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);

    // Mouse events for testing on desktop
    joystickBase.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', stopDrag);

    // Fade out loading screen after 2.5 seconds
    const loader = document.getElementById('loading-screen');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500); // Wait for transition to complete
        }, 2500);
    }
}

// Fire up bindings on page load
window.addEventListener('DOMContentLoaded', initGame);
