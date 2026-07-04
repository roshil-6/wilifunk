class Car extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, textureKey, isPlayer = false, driverName = "Driver") {
        super(scene, x, y, textureKey);
        scene.add.existing(this);

        this.isPlayer = isPlayer;
        this.isPlayer2 = false; // Flag for local co-op Player 2
        this.driverName = driverName;
        
        // Physics variables
        this.speed = 0;
        this.vx = 0;
        this.vy = 0;
        this.onTrack = true;
        this.onGravel = false;
        
        // Track progress tracking
        this.currentLap = 1;
        this.progressFraction = 0; // Total percentage of track completed
        this.lastWaypointIdx = 0;
        this.totalLapDistanceCompleted = 0; // For leaderboard sorting
        this.raceFinished = false;
        this.finishTime = 0;
        this.hasPassedMidpoint = false; // Prevents false lap wraps on grid start
        
        // Drifting state
        this.isDrifting = false;
        this.gear = 1;

        // Origin in middle for correct rotation center
        this.setOrigin(0.5, 0.5);
    }

    static generateCarTexture(scene, colorKey, primaryColor, secondaryColor) {
        const key = `car-${colorKey}`;
        if (scene.textures.exists(key)) return key;

        // Size: 52px long (X axis), 30px wide (Y axis) to look like F1 car
        const w = 56;
        const h = 32;
        
        const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
        
        // 1. Shadow (solid dark gray, flat shading offset)
        graphics.fillStyle(0x111115, 0.4);
        graphics.fillRect(4, 4, w - 8, h - 8);

        // Convert hex strings to numeric hex values
        const primary = Phaser.Display.Color.HexStringToColor(primaryColor).color;
        const secondary = Phaser.Display.Color.HexStringToColor(secondaryColor).color;
        const black = 0x000000;
        const white = 0xffffff;
        const darkGray = 0x333333;

        // 2. Tires (4 black rectangles)
        graphics.fillStyle(black);
        // Front tires
        graphics.fillRect(w - 18, 0, 10, 6);
        graphics.fillRect(w - 18, h - 6, 10, 6);
        // Rear tires (wider)
        graphics.fillRect(8, 0, 12, 7);
        graphics.fillRect(8, h - 7, 12, 7);

        // 3. Front Wing (secondary color, wide banner at nose)
        graphics.fillStyle(secondary);
        graphics.fillRect(w - 10, 3, 4, h - 6);
        graphics.fillStyle(black);
        graphics.fillRect(w - 6, 3, 2, h - 6); // wing edge

        // 4. Rear Wing (secondary color, box at rear)
        graphics.fillStyle(secondary);
        graphics.fillRect(2, 4, 4, h - 8);
        graphics.fillStyle(black);
        graphics.fillRect(1, 4, 1, h - 8); // wing endplate

        // 5. Main Chassis (tapers from rear to nose, primary color)
        graphics.fillStyle(primary);
        // Draw polygon for the nosecone
        const points = [
            { x: 6, y: 8 },
            { x: w - 8, y: 12 },
            { x: w - 8, y: h - 12 },
            { x: 6, y: h - 8 }
        ];
        graphics.fillPoints(points, true);

        // 6. Sidepods (primary/secondary design)
        graphics.fillStyle(secondary);
        graphics.fillRect(16, 6, 16, 4);
        graphics.fillRect(16, h - 10, 16, 4);

        // 7. Engine Intake (behind driver, dark shape)
        graphics.fillStyle(darkGray);
        graphics.fillRect(14, 12, 6, 8);

        // 8. Cockpit (black opening)
        graphics.fillStyle(black);
        graphics.fillCircle(24, 16, 5);

        // 9. Driver Helmet (white with dark visor, facing forward/right)
        graphics.fillStyle(white);
        graphics.fillCircle(24, 16, 4);
        graphics.fillStyle(black);
        graphics.fillRect(24, 14, 3, 4); // Visor

        // Draw black outlines around everything to match flat retro drawing style
        graphics.lineStyle(1.5, black);
        graphics.strokePoints(points, true);
        
        // Stroke wings
        graphics.strokeRect(w - 10, 3, 4, h - 6);
        graphics.strokeRect(2, 4, 4, h - 8);
        
        // Generate texture in Phaser cache
        graphics.generateTexture(key, w, h);
        graphics.destroy();
        return key;
    }

    update(dt, steerInput, throttleInput) {
        if (this.raceFinished) {
            // Decelerate automatically
            this.speed = Phaser.Math.Linear(this.speed, 0, 2 * dt);
            this.vx = Phaser.Math.Linear(this.vx, 0, 2 * dt);
            this.vy = Phaser.Math.Linear(this.vy, 0, 2 * dt);
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            return;
        }

        const maxSpeed = 310;
        const accel = 420;
        const turnRate = 3.0; // Peak turns rate (radians/sec)
        
        // Calculate dynamic grip based on current velocity percentage
        const speedRatio = Math.abs(this.speed) / maxSpeed;
        let baseGrip = 0.94; 
        
        // Slide mechanic: Reduce grip past 80% speed for satisfying drifts
        if (speedRatio > 0.80) {
            const driftFactor = (speedRatio - 0.80) / 0.20; // 0.0 to 1.0
            baseGrip = Phaser.Math.Linear(0.94, 0.82, driftFactor);
        }
        
        // Handle off-track penalties
        let currentGrip = baseGrip;
        let currentMaxSpeed = maxSpeed;

        if (this.onGravel) {
            currentGrip = 0.65;
            currentMaxSpeed = maxSpeed * 0.25; // Massive penalty
        } else if (!this.onTrack) {
            currentGrip = 0.72;
            currentMaxSpeed = maxSpeed * 0.45; // Grass penalty
        }

        // Acceleration / Braking
        if (throttleInput > 0) {
            this.speed += throttleInput * accel * dt;
        } else if (throttleInput < 0) {
            this.speed += throttleInput * accel * 1.5 * dt; // Stronger braking force
        } else {
            // Drag deceleration
            this.speed = Phaser.Math.Linear(this.speed, 0, 1.2 * dt);
        }
        this.speed = Phaser.Math.Clamp(this.speed, -currentMaxSpeed * 0.3, currentMaxSpeed);

        // Turn rate scaling (prevents pivot-spinning when stationary)
        const speedFactor = Phaser.Math.Clamp(Math.abs(this.speed) / (maxSpeed * 0.5), 0, 1);
        this.rotation += steerInput * turnRate * speedFactor * dt;

        // Velocity blending (the core drift algorithm)
        const facingVX = Math.cos(this.rotation) * this.speed;
        const facingVY = Math.sin(this.rotation) * this.speed;

        this.vx = Phaser.Math.Linear(this.vx, facingVX, currentGrip);
        this.vy = Phaser.Math.Linear(this.vy, facingVY, currentGrip);

        // Apply physical positional updates
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Calculate drift slipping indicator
        if (this.speed > 80) {
            const facingAngle = this.rotation;
            const velocityAngle = Math.atan2(this.vy, this.vx);
            const slipAngle = Math.abs(Phaser.Math.Angle.Wrap(facingAngle - velocityAngle));
            this.isDrifting = slipAngle > 0.18; // Threshold for slide state
        } else {
            this.isDrifting = false;
        }

        // Calculate simulated gears for dashboard HUD and sound pitch modulation
        const speedVal = Math.abs(this.speed);
        if (speedVal < 10) this.gear = 1;
        else if (speedVal < 90) this.gear = 1;
        else if (speedVal < 160) this.gear = 2;
        else if (speedVal < 230) this.gear = 3;
        else this.gear = 4;

        // If player, modulate engine pitch and screech sound
        if (this.isPlayer) {
            synth.updateEnginePitch(0, speedRatio, this.gear);
            if (this.isDrifting && this.onTrack && !this.onGravel) {
                synth.screechStart(0);
            } else {
                synth.screechStop(0);
            }
        } else if (this.isPlayer2) {
            synth.updateEnginePitch(1, speedRatio, this.gear);
            if (this.isDrifting && this.onTrack && !this.onGravel) {
                synth.screechStart(1);
            } else {
                synth.screechStop(1);
            }
        }
    }

    handleCarCollision(other, dt) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
        const minDist = 28; // sum of car collision radii (approx 14px each)
        
        if (dist < minDist) {
            // Push away to resolve overlap immediately
            const angle = Phaser.Math.Angle.Between(this.x, this.y, other.x, other.y);
            const overlap = minDist - dist;
            
            // Displace both cars away from each other
            this.x -= Math.cos(angle) * overlap * 0.5;
            this.y -= Math.sin(angle) * overlap * 0.5;
            other.x += Math.cos(angle) * overlap * 0.5;
            other.y += Math.sin(angle) * overlap * 0.5;

            // Simple elastic bounce response
            const tempVx = this.vx;
            const tempVy = this.vy;
            
            // Blend velocities slightly and exchange momentum
            this.vx = (other.vx * 0.7) - (Math.cos(angle) * 40);
            this.vy = (other.vy * 0.7) - (Math.sin(angle) * 40);
            other.vx = (tempVx * 0.7) + (Math.cos(angle) * 40);
            other.vy = (tempVy * 0.7) + (Math.sin(angle) * 40);

            // Re-calculate speed based on new velocities
            this.speed = Math.cos(this.rotation) * this.vx + Math.sin(this.rotation) * this.vy;
            other.speed = Math.cos(other.rotation) * other.vx + Math.sin(other.rotation) * other.vy;

            // Spawn collision sparks/debris or play sound
            if (this.isPlayer || this.isPlayer2 || other.isPlayer || other.isPlayer2) {
                synth.playCrash();
                // Add a small camera shake to the scene
                this.scene.cameras.main.shake(150, 0.007);
            }
        }
    }

    handleObstacleCollision(obsX, obsY, radius) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, obsX, obsY);
        const carRadius = 14;
        const minDist = radius + carRadius;

        if (dist < minDist) {
            // Angle of collision bounce
            const angle = Phaser.Math.Angle.Between(obsX, obsY, this.x, this.y);
            const overlap = minDist - dist;

            // Push car outside obstacle
            this.x += Math.cos(angle) * overlap;
            this.y += Math.sin(angle) * overlap;

            // Reflect velocity
            const speedMagnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const bounceSpeed = Math.max(speedMagnitude * 0.4, 50); // Minimum bounce force

            this.vx = Math.cos(angle) * bounceSpeed;
            this.vy = Math.sin(angle) * bounceSpeed;
            
            // Adjust linear speed accordingly
            this.speed = -this.speed * 0.3; // bounce backward slightly

            if (this.isPlayer || this.isPlayer2) {
                synth.playCrash();
                this.scene.cameras.main.shake(200, 0.012);
            }
        }
    }
}
