class AIDriver {
    constructor(car, waypointPath) {
        this.car = car;
        this.path = waypointPath; // High-resolution spline array of {x, y}
        
        // Randomise driver attributes to simulate human personalities
        this.skillSteerNoise = Phaser.Math.FloatBetween(-0.06, 0.06);
        this.brakingAggression = Phaser.Math.FloatBetween(0.80, 0.96);
        
        // Preferred racing line offset (-25 to +25 pixels from centerline)
        this.lateralOffset = Phaser.Math.FloatBetween(-20, 20);
        
        // Overtake timer & cooldown
        this.overtakeTimer = 0;
        this.overtakeOffset = 0;

        // Stuck detection and recovery variables
        this.stuckTimer = 0;
        this.reverseTimer = 0;
        this.isReversing = false;
        this.stuckSteerDir = 1;

        // Initialise waypoint index by searching the entire path once
        let minDist = Infinity;
        let nearestIdx = 0;
        for (let i = 0; i < this.path.length; i++) {
            const dist = Phaser.Math.Distance.Between(this.car.x, this.car.y, this.path[i].x, this.path[i].y);
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
            }
        }
        this.currentIdx = nearestIdx;
    }

    findNearestPathIndex() {
        let minDist = Infinity;
        let nearestIdx = this.currentIdx;
        
        // Dynamic search window (up to 40 nodes around last known index for efficiency)
        const windowSize = 40;
        const len = this.path.length;
        
        for (let i = -windowSize; i <= windowSize; i++) {
            const idx = (this.currentIdx + i + len) % len;
            const pt = this.path[idx];
            const dist = Phaser.Math.Distance.Between(this.car.x, this.car.y, pt.x, pt.y);
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = idx;
            }
        }
        
        this.currentIdx = nearestIdx;
        return nearestIdx;
    }

    computeInputs(dt, allCars) {
        this.findNearestPathIndex();

        // 1. Stuck recovery state machine
        if (this.isReversing) {
            this.reverseTimer -= dt;
            if (this.reverseTimer <= 0) {
                this.isReversing = false;
                this.stuckTimer = 0;
            }
            
            // Reversing: Throttle is backwards (-0.5), steer is angled out
            return { steer: this.stuckSteerDir, throttle: -0.5 };
        }

        // Stuck detection: speed is very low but trying to move
        if (Math.abs(this.car.speed) < 18 && !this.car.raceFinished) {
            this.stuckTimer += dt;
            if (this.stuckTimer > 1.2) {
                this.isReversing = true;
                this.reverseTimer = Phaser.Math.FloatBetween(0.8, 1.5);
                // Choose a random steering direction to back out
                this.stuckSteerDir = Math.random() > 0.5 ? 1 : -1;
                this.stuckTimer = 0;
                return { steer: this.stuckSteerDir, throttle: -0.5 };
            }
        } else {
            this.stuckTimer = Math.max(0, this.stuckTimer - dt);
        }

        // 2. Curvature detection to prevent corner cutting
        const len = this.path.length;
        const curNode = this.path[this.currentIdx];
        const nextIdx = (this.currentIdx + 1) % len;
        const nextNode = this.path[nextIdx];
        const prevIdx = (this.currentIdx - 1 + len) % len;
        const prevNode = this.path[prevIdx];
        
        // Find track heading at current index
        const currentTrackAngle = Math.atan2(nextNode.y - prevNode.y, nextNode.x - prevNode.x);

        // Look 16 waypoints ahead to evaluate upcoming curvature
        const lookFarIdx = (this.currentIdx + 16) % len;
        const lookFarNode = this.path[lookFarIdx];
        const lookFarNextNode = this.path[(lookFarIdx + 1) % len];
        const lookFarPrevNode = this.path[(lookFarIdx - 1 + len) % len];
        const farTrackAngle = Math.atan2(lookFarNextNode.y - lookFarPrevNode.y, lookFarNextNode.x - lookFarPrevNode.x);
        
        // Absolute change in track heading
        const trackCurvature = Math.abs(Phaser.Math.Angle.Wrap(farTrackAngle - currentTrackAngle));

        // Scale lookahead distance with speed (lower speeds look closer, high speeds look further)
        const speedRatio = Math.abs(this.car.speed) / 300;
        
        // Base lookahead range
        let lookAheadDistance = Math.round(Phaser.Math.Linear(5, 16, speedRatio));
        
        // If upcoming curve is sharp, drastically shorten lookahead to hug the centerline and avoid cutting corners
        if (trackCurvature > 0.35) {
            lookAheadDistance = Math.round(Phaser.Math.Linear(3, 7, speedRatio));
        }
        
        const targetIdx = (this.currentIdx + lookAheadDistance) % len;
        const targetNode = this.path[targetIdx];
        
        // Calculate tangent/normal to adjust lateral path offset (driving lines + overtaking)
        const targetNext = this.path[(targetIdx + 1) % len];
        const targetPrev = this.path[(targetIdx - 1 + len) % len];
        const trackAngle = Math.atan2(targetNext.y - targetPrev.y, targetNext.x - targetPrev.x);
        
        // Normal vector pointing perpendicular to track direction
        const normalX = -Math.sin(trackAngle);
        const normalY = Math.cos(trackAngle);

        // Overtaking logic: Scan for nearby cars in front of this AI
        this.updateOvertaking(dt, allCars, trackAngle);
        
        const activeOffset = this.lateralOffset + this.overtakeOffset;
        
        // Target coordinate shifted laterally from track center
        const targetX = targetNode.x + normalX * activeOffset;
        const targetY = targetNode.y + normalY * activeOffset;

        // Angle calculations
        const targetAngle = Phaser.Math.Angle.Between(this.car.x, this.car.y, targetX, targetY);
        let angleDiff = Phaser.Math.Angle.Wrap(targetAngle - this.car.rotation);

        // Inject steering noise (sinusoidal deviation) to simulate micro-errors
        const timeVal = this.car.scene.time.now * 0.005;
        angleDiff += this.skillSteerNoise * Math.sin(timeVal);

        // Direct steer direction output
        let steer = 0;
        if (angleDiff > 0.06) steer = 1;
        if (angleDiff < -0.06) steer = -1;

        // 3. Obstacle Avoidance (Avoid getting stuck on trees/barriers)
        let avoidanceSteer = 0;
        let avoidanceForce = 0;
        const scene = this.car.scene;
        const track = scene.track;

        if (track && track.config && track.config.decorations) {
            const tires = track.config.decorations.tires || [];
            const trees = track.config.decorations.trees || [];
            let closestObsDist = Infinity;
            
            const obstacles = [
                ...tires.map(t => ({ x: t.x, y: t.y, radius: 9 })),
                ...trees.map(t => ({ x: t.x, y: t.y, radius: 20 }))
            ];
            
            obstacles.forEach(obs => {
                const dist = Phaser.Math.Distance.Between(this.car.x, this.car.y, obs.x, obs.y);
                const detectionRange = obs.radius + 36; // Scan area boundary
                
                if (dist < detectionRange) {
                    const angleToObs = Phaser.Math.Angle.Between(this.car.x, this.car.y, obs.x, obs.y);
                    const relAngle = Phaser.Math.Angle.Wrap(angleToObs - this.car.rotation);
                    
                    if (Math.abs(relAngle) < Math.PI / 2.2) { // 80-degree front vision cone
                        if (dist < closestObsDist) {
                            closestObsDist = dist;
                            avoidanceSteer = relAngle > 0 ? -1 : 1; // Steer opposite to obstacle center
                            avoidanceForce = (detectionRange - dist) / detectionRange;
                        }
                    }
                }
            });
        }

        // Apply obstacle avoidance steering if threat is high
        if (avoidanceForce > 0.25) {
            steer = avoidanceSteer;
        }

        // Predictive Braking: Slow down proportionally to upcoming sharp angles
        let throttle = 1.0;
        const absAngleDiff = Math.abs(angleDiff);

        if (absAngleDiff > 0.38) {
            // Steering sharp: scale back throttle based on braking aggressiveness profile
            throttle = (1.0 - absAngleDiff) * this.brakingAggression;
            
            // Hard braking for tight hairpins if going fast
            if (this.car.speed > 165) {
                throttle = -0.3; // Slam brakes to drift or slow down
            }
        }
        
        // Braking overrides for obstacle collision avoidance
        if (avoidanceForce > 0.45) {
            throttle = Math.min(throttle, 0.1);
            if (this.car.speed > 110) {
                throttle = -0.2; // Brake to avoid impact
            }
        }

        // Slow down slightly if on grass or gravel to regain grip/control
        if (!this.car.onTrack) {
            throttle = 0.5;
        }

        return { steer, throttle };
    }

    updateOvertaking(dt, allCars, trackAngle) {
        this.overtakeTimer -= dt;
        if (this.overtakeTimer > 0) return;

        // Look for any car directly ahead in a 140px cone
        let targetCarAhead = null;
        let minAheadDist = 140;

        allCars.forEach(other => {
            if (other === this.car || other.raceFinished) return;
            
            const dist = Phaser.Math.Distance.Between(this.car.x, this.car.y, other.x, other.y);
            if (dist < minAheadDist) {
                // Check if other car is in front by computing angle relative to track heading
                const angleToOther = Phaser.Math.Angle.Between(this.car.x, this.car.y, other.x, other.y);
                const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToOther - trackAngle));
                
                if (angleDiff < Math.PI / 3) { // Inside 60-degree cone ahead
                    minAheadDist = dist;
                    targetCarAhead = other;
                }
            }
        });

        if (targetCarAhead) {
            // Overtake maneuver: switch to opposite lateral side!
            // If other car is to the right of centerline, go left; and vice-versa
            const otherOffsetSign = Math.sign(this.lateralOffset);
            this.overtakeOffset = otherOffsetSign !== 0 ? -otherOffsetSign * 22 : (Math.random() > 0.5 ? 22 : -22);
            this.overtakeTimer = Phaser.Math.FloatBetween(1.2, 2.5); // Hold maneuver
        } else {
            // Return to preferred racing line slowly
            this.overtakeOffset = Phaser.Math.Linear(this.overtakeOffset, 0, 3 * dt);
        }
    }
}
