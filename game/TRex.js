/**
 * TRex.js - T-Rex enemy that chases the player
 * DINO RUN STYLE - Realistic pixel-art dinosaur
 */

export class TRex {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 120;
        this.height = 140;
        this.baseSpeed = 150; // Base speed
        this.currentSpeed = this.baseSpeed;
        this.maxSpeed = 500; // Can get very fast if player avoids numbers
        // Base chase distances (we dynamically tighten these to allow actual catching)
        this.baseMinDistance = 250;
        this.baseTargetDistance = 300;
        this.minDistance = this.baseMinDistance; // Minimum distance before catching
        this.targetDistance = this.baseTargetDistance; // Target chase distance
        
        // Dino chase mechanics
        this.missedNumbers = 0; // Track missed number boxes
        this.lastNumberMissedTime = 0; // When last number was missed
        this.escapeTime = 0; // Time spent without collecting numbers
        this.rageMultiplier = 1.0; // Speed multiplier based on missed numbers
        
        // Animation
        this.animationTime = 0;
        this.legPhase = 0;
        this.headBob = 0;
        this.tailSwing = 0;
        this.roarPhase = 0;
        this.bodySway = 0;
        this.neckStretch = 0;
        
        // State
        this.isRoaring = false;
        this.roarDuration = 0;
        this.groundY = 550;
        this.stompTimer = 0;
        
        // Visual effects
        this.dustParticles = [];
        this.stompShake = 0;
        this.roarParticles = [];
        this.speedTrail = [];
    }
    
    update(deltaTime, playerX, playerY, groundY, gameSpeed, missedNumbers = 0, timeSinceLastCollection = 0, allowCatch = true) {
        this.animationTime += deltaTime;
        this.groundY = groundY;
        this.stompTimer += deltaTime;
        
        // Track missed numbers and escape time
        this.missedNumbers = missedNumbers;
        this.escapeTime = timeSinceLastCollection;
        
        // Enhanced animations
        this.legPhase += deltaTime * 12; // Faster leg animation
        this.headBob = Math.sin(this.animationTime * 6) * 5;
        this.tailSwing = Math.sin(this.animationTime * 4) * 15;
        this.bodySway = Math.sin(this.animationTime * 2.5) * 3;
        this.neckStretch = Math.sin(this.animationTime * 5) * 4;
        
        // Calculate distance to player
        const distanceToPlayer = playerX - this.x;
        
        // RAGE SYSTEM: Dino gets faster based on missed numbers and escape time
        // BUT: don't allow the dino to "hunt down" (catch/kill) until the game has given enough boxes to escape.
        if (!allowCatch) {
            this.rageMultiplier = 1.0;
            this.targetDistance = this.baseTargetDistance;
            this.minDistance = this.baseMinDistance;
        } else {
            // Each missed number increases rage by 15%
            this.rageMultiplier = 1.0 + (this.missedNumbers * 0.15);

            // If player is escaping without collecting, dino gets progressively faster
            if (this.escapeTime > 2.0) {
                const escapeBonus = Math.min(0.5, (this.escapeTime - 2.0) * 0.1); // Up to 50% speed bonus
                this.rageMultiplier += escapeBonus;
            }

            // As escape time grows and numbers are missed, reduce targetDistance/minDistance so it can overlap (eat).
            const tighten = Math.max(0, this.escapeTime - 1.5) * 60 + (this.missedNumbers * 45);
            this.targetDistance = Math.max(0, this.baseTargetDistance - tighten);
            this.minDistance = Math.max(0, this.targetDistance - 25);
        }
        
        // Speed adjustment based on distance
        if (distanceToPlayer > this.targetDistance) {
            // Chase when far away - with rage multiplier
            this.currentSpeed = Math.min(
                this.maxSpeed, 
                (this.baseSpeed + (distanceToPlayer - this.targetDistance) * 0.6) * this.rageMultiplier
            );
        } else if (distanceToPlayer < this.minDistance) {
            // Slow down when too close (but still apply rage)
            this.currentSpeed = Math.max(
                this.baseSpeed * 0.6, 
                (this.baseSpeed - (this.minDistance - distanceToPlayer) * 0.5) * this.rageMultiplier
            );
        } else {
            // Maintain base speed with rage
            this.currentSpeed = this.baseSpeed * this.rageMultiplier;
        }
        
        // T-Rex speed scales with game speed (but keep it fair before allowCatch is enabled)
        this.currentSpeed += gameSpeed * (allowCatch ? 0.25 : 0.15);
        
        // Move T-Rex forward
        this.x += this.currentSpeed * deltaTime;
        this.y = groundY - this.height / 2;
        
        // Enhanced roar system
        if (!this.isRoaring && Math.random() < 0.0015) {
            this.isRoaring = true;
            this.roarDuration = 1.2;
            // Create roar particles
            for (let i = 0; i < 15; i++) {
                this.roarParticles.push({
                    x: this.x + this.width / 2,
                    y: this.y - this.height / 3,
                    velocityX: (Math.random() - 0.5) * 200,
                    velocityY: -50 - Math.random() * 100,
                    size: 4 + Math.random() * 6,
                    alpha: 1,
                    life: 0.8 + Math.random() * 0.4,
                    color: `hsl(${Math.random() * 60 + 10}, 100%, 60%)`
                });
            }
        }
        
        if (this.isRoaring) {
            this.roarDuration -= deltaTime;
            this.roarPhase += deltaTime * 12;
            if (this.roarDuration <= 0) {
                this.isRoaring = false;
            }
        }
        
        // Update roar particles
        this.roarParticles.forEach(p => {
            p.x += p.velocityX * deltaTime;
            p.y += p.velocityY * deltaTime;
            p.velocityY += 150 * deltaTime;
            p.alpha -= deltaTime * 1.5;
            p.life -= deltaTime;
        });
        this.roarParticles = this.roarParticles.filter(p => p.life > 0 && p.alpha > 0);
        
        // Enhanced dust particles
        if (this.stompTimer > 0.15) {
            this.stompTimer = 0;
            for (let i = 0; i < 8; i++) {
                this.dustParticles.push({
                    x: this.x - this.width / 2 + Math.random() * this.width,
                    y: this.y + this.height / 2,
                    velocityX: -80 - Math.random() * 80,
                    velocityY: -30 - Math.random() * 30,
                    size: 4 + Math.random() * 6,
                    alpha: 0.9,
                    life: 0.6 + Math.random() * 0.4
                });
            }
        }
        
        // Update dust particles
        this.dustParticles.forEach(p => {
            if (!p || !isFinite(p.x) || !isFinite(p.y) || !isFinite(p.velocityX) || !isFinite(p.velocityY)) {
                return; // Skip invalid particles
            }
            p.x += p.velocityX * deltaTime;
            p.y += p.velocityY * deltaTime;
            p.velocityY += 120 * deltaTime;
            p.alpha -= deltaTime * 2;
            p.life -= deltaTime;
        });
        this.dustParticles = this.dustParticles.filter(p => p && p.life > 0 && p.alpha > 0 && isFinite(p.x) && isFinite(p.y));
        
        // Speed trail effect
        if (this.currentSpeed > this.baseSpeed * 1.3) {
            this.speedTrail.push({
                x: this.x - this.width / 2,
                y: this.y,
                alpha: 0.6,
                life: 0.3
            });
        }
        
        this.speedTrail.forEach(t => {
            t.alpha -= deltaTime * 3;
            t.life -= deltaTime;
        });
        this.speedTrail = this.speedTrail.filter(t => t.life > 0 && t.alpha > 0);
        
        if (this.stompShake > 0) {
            this.stompShake -= deltaTime * 6;
        }
    }
    
    checkCollision(playerX, playerY, playerWidth, playerHeight) {
        const trexLeft = this.x - this.width / 2;
        const trexRight = this.x + this.width / 2;
        const trexTop = this.y - this.height / 2;
        const trexBottom = this.y + this.height / 2;
        
        const playerLeft = playerX - playerWidth / 2;
        const playerRight = playerX + playerWidth / 2;
        const playerTop = playerY - playerHeight / 2;
        const playerBottom = playerY + playerHeight / 2;
        
        return trexLeft < playerRight &&
               trexRight > playerLeft &&
               trexTop < playerBottom &&
               trexBottom > playerTop;
    }
    
    /**
     * Draw T-Rex - DINO RUN STYLE (Realistic pixel-art dinosaur)
     */
    draw(ctx, cameraX) {
        // Enable pixel-perfect rendering for Dino Run style
        ctx.imageSmoothingEnabled = false;
        
        // Safety check for cameraX
        if (!isFinite(cameraX)) {
            cameraX = 0;
        }
        
        const screenX = this.x - cameraX;
        const screenY = this.y;
        
        ctx.save();
        
        // Draw speed trail
        this.speedTrail.forEach(trail => {
            ctx.globalAlpha = trail.alpha;
            ctx.fillStyle = 'rgba(220, 220, 220, 0.9)';
            ctx.fillRect(trail.x - cameraX, trail.y - 20, 20, 40);
        });
        ctx.globalAlpha = 1;
        
        // Draw dust particles (behind T-Rex)
        this.dustParticles.forEach(particle => {
            if (!particle || !isFinite(particle.x) || !isFinite(particle.y) || !isFinite(particle.size)) {
                return; // Skip invalid particles
            }
            
            const particleX = particle.x - cameraX;
            const particleY = particle.y;
            const particleSize = particle.size || 5;
            
            if (!isFinite(particleX) || !isFinite(particleY) || !isFinite(particleSize)) {
                return; // Skip if any value is still invalid
            }
            
            ctx.globalAlpha = particle.alpha || 1;
            const dustGradient = ctx.createRadialGradient(
                particleX, particleY, 0,
                particleX, particleY, particleSize * 2
            );
            dustGradient.addColorStop(0, 'rgba(120, 120, 120, 0.75)');
            dustGradient.addColorStop(1, 'rgba(120, 120, 120, 0)');
            ctx.fillStyle = dustGradient;
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize * 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // Transform for body sway
        ctx.translate(screenX + this.bodySway, screenY);
        
        // DINO RUN STYLE: Pixel-art T-Rex body
        // Main body - large, powerful torso
        // Realistic grey palette (requested)
        const bodyColor = '#6C7075';
        const bodyDark = '#3E4348';
        const bodyLight = '#8F959B';
        
        // Body (large rectangle with rounded edges - pixel style)
        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.fillRect(-this.width / 2, -this.height / 3, this.width, this.height * 0.7);
        ctx.strokeRect(-this.width / 2, -this.height / 3, this.width, this.height * 0.7);
        
        // Body shading (pixel style)
        ctx.fillStyle = bodyDark;
        ctx.fillRect(-this.width / 2, -this.height / 3, this.width, 8); // Top shadow
        ctx.fillRect(this.width / 2 - 8, -this.height / 3, 8, this.height * 0.7); // Right shadow
        ctx.fillStyle = bodyLight;
        ctx.fillRect(-this.width / 2, -this.height / 3, 8, this.height * 0.7); // Left highlight
        
        // NECK - Thick, powerful neck (Dino Run style)
        const neckWidth = 28;
        const neckHeight = 50;
        const neckX = this.width / 2 - 8;
        const neckY = -this.height / 2 - neckHeight / 2 + this.neckStretch;
        
        ctx.fillStyle = bodyColor;
        ctx.fillRect(neckX - neckWidth / 2, neckY, neckWidth, neckHeight);
        ctx.strokeRect(neckX - neckWidth / 2, neckY, neckWidth, neckHeight);
        
        // Neck shading
        ctx.fillStyle = bodyDark;
        ctx.fillRect(neckX - neckWidth / 2, neckY, neckWidth, 6);
        ctx.fillStyle = bodyLight;
        ctx.fillRect(neckX - neckWidth / 2, neckY, 6, neckHeight);
        
        // HEAD - Large, menacing T-Rex head (Dino Run style)
        const headWidth = 65;
        const headHeight = 55;
        const headX = this.width / 2 + headWidth / 2 - 12;
        const headY = -this.height / 2 - headHeight / 2 + this.headBob;
        
        // Head body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(headX - headWidth / 2, headY, headWidth, headHeight);
        ctx.strokeRect(headX - headWidth / 2, headY, headWidth, headHeight);
        
        // Head shading
        ctx.fillStyle = bodyDark;
        ctx.fillRect(headX - headWidth / 2, headY, headWidth, 6);
        ctx.fillStyle = bodyLight;
        ctx.fillRect(headX - headWidth / 2, headY, 6, headHeight);
        
        // SNOUT - Distinctive T-Rex snout
        const snoutWidth = 35;
        const snoutHeight = 20;
        ctx.fillStyle = bodyColor;
        ctx.fillRect(headX + headWidth / 2 - 5, headY + headHeight / 3, snoutWidth, snoutHeight);
        ctx.strokeRect(headX + headWidth / 2 - 5, headY + headHeight / 3, snoutWidth, snoutHeight);
        
        // JAW - Powerful lower jaw
        const jawWidth = headWidth * 0.75;
        const jawHeight = 22;
        const jawOpen = this.isRoaring ? Math.sin(this.roarPhase) * 0.5 + 0.5 : 0;
        const jawY = headY + headHeight * 0.7 + jawHeight * jawOpen;
        
        ctx.fillStyle = bodyDark;
        ctx.fillRect(headX - jawWidth / 2, headY + headHeight * 0.7, jawWidth, jawHeight);
        ctx.strokeRect(headX - jawWidth / 2, headY + headHeight * 0.7, jawWidth, jawHeight);
        
        // TEETH - Sharp, visible teeth (Dino Run style)
        if (this.isRoaring || jawOpen > 0.3) {
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const toothX = headX - jawWidth / 2 + (i + 0.5) * (jawWidth / 8);
                const toothY = jawY - 2;
                // Pixel-style triangle teeth
                ctx.beginPath();
                ctx.moveTo(toothX - 2, toothY);
                ctx.lineTo(toothX, toothY - 8);
                ctx.lineTo(toothX + 2, toothY);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }
        
        // EYES - Menacing red eyes (Dino Run style)
        const eyeX = headX - headWidth / 4;
        const eyeY = headY + headHeight / 4;
        const eyeSize = 8;
        
        // Eye socket
        ctx.fillStyle = '#000000';
        ctx.fillRect(eyeX - eyeSize, eyeY - eyeSize, eyeSize * 2, eyeSize * 2);
        
        // Eye glow (red)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(eyeX - eyeSize / 2, eyeY - eyeSize / 2, eyeSize, eyeSize);
        
        // Eye highlight
        ctx.fillStyle = '#FF6666';
        ctx.fillRect(eyeX - eyeSize / 3, eyeY - eyeSize / 3, eyeSize / 2, eyeSize / 2);
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Eye highlight
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(eyeX - 2, eyeY - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // LEGS - More organic, dinosaur-like legs
        const legWidth = 20;
        const legHeight = 55;
        const legSpacing = 32;
        
        // Front legs (smaller, closer to body)
        for (let i = 0; i < 2; i++) {
            const legX = -this.width / 4 + i * legSpacing;
            const legY = this.height / 2;
            const legOffset = Math.sin(this.legPhase + i * Math.PI) * 8;
            const legAngle = Math.sin(this.legPhase + i * Math.PI) * 0.3;
            
            ctx.save();
            ctx.translate(legX + legOffset, legY);
            ctx.rotate(legAngle);
            
            ctx.fillStyle = '#1A252F';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            
            // Thigh (upper leg) - more organic shape
            ctx.beginPath();
            ctx.ellipse(0, legHeight / 3, legWidth / 2, legHeight / 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Lower leg (shin) - thinner
            ctx.translate(0, legHeight / 2);
            ctx.beginPath();
            ctx.ellipse(0, legHeight / 4, legWidth / 3, legHeight / 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Foot with claws
            ctx.translate(0, legHeight / 2);
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(0, 0, legWidth / 2, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Claws (3 per foot)
            for (let j = 0; j < 3; j++) {
                const clawX = -legWidth / 3 + j * (legWidth / 3);
                ctx.beginPath();
                ctx.moveTo(clawX, 0);
                ctx.lineTo(clawX - 2, 6);
                ctx.lineTo(clawX + 2, 6);
                ctx.closePath();
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // Back legs (larger, more powerful)
        for (let i = 0; i < 2; i++) {
            const legX = -this.width / 2 + 15 + i * legSpacing;
            const legY = this.height / 2;
            const legOffset = Math.sin(this.legPhase + Math.PI + i * Math.PI) * 8;
            const legAngle = Math.sin(this.legPhase + Math.PI + i * Math.PI) * 0.3;
            
            ctx.save();
            ctx.translate(legX + legOffset, legY);
            ctx.rotate(legAngle);
            
            ctx.fillStyle = '#1A252F';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            
            // Thigh (upper leg) - thicker for back legs
            ctx.beginPath();
            ctx.ellipse(0, legHeight / 3, legWidth / 2 + 2, legHeight / 3 + 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Lower leg (shin)
            ctx.translate(0, legHeight / 2);
            ctx.beginPath();
            ctx.ellipse(0, legHeight / 4, legWidth / 3, legHeight / 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Foot with claws
            ctx.translate(0, legHeight / 2);
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(0, 0, legWidth / 2 + 2, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Claws (3 per foot)
            for (let j = 0; j < 3; j++) {
                const clawX = -legWidth / 3 + j * (legWidth / 3);
                ctx.beginPath();
                ctx.moveTo(clawX, 0);
                ctx.lineTo(clawX - 2, 7);
                ctx.lineTo(clawX + 2, 7);
                ctx.closePath();
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // TAIL - Curved, organic dinosaur tail
        const tailX = -this.width / 2;
        const tailY = 0;
        const tailLength = 95;
        const tailBaseWidth = 28;
        const tailTipWidth = 8;
        
        ctx.save();
        ctx.translate(tailX, tailY);
        ctx.rotate(this.tailSwing * Math.PI / 180);
        
        ctx.fillStyle = '#2C3E50';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        
        // Tail shape - curved and tapered (more organic)
        ctx.beginPath();
        // Base of tail (attached to body)
        ctx.moveTo(0, -tailBaseWidth / 2);
        ctx.quadraticCurveTo(-tailLength / 3, -tailBaseWidth / 3, -tailLength / 2, -tailTipWidth);
        // Tip of tail
        ctx.quadraticCurveTo(-tailLength * 0.7, 0, -tailLength, 0);
        // Bottom curve
        ctx.quadraticCurveTo(-tailLength / 2, tailTipWidth, -tailLength / 3, tailBaseWidth / 3);
        ctx.quadraticCurveTo(0, tailBaseWidth / 2, 0, tailBaseWidth / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Tail detail line
        ctx.strokeStyle = '#1A252F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-tailLength / 4, 0);
        ctx.quadraticCurveTo(-tailLength / 2, 0, -tailLength * 0.75, 0);
        ctx.stroke();
        
        ctx.restore();
        
        // ROAR PARTICLES
        this.roarParticles.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x - cameraX, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // SPEED LINES (when running fast)
        if (this.currentSpeed > this.baseSpeed * 1.3) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 8; i++) {
                const lineX = -this.width / 2 - 30 - i * 20;
                const lineY = -this.height / 4 + (i % 3) * 15;
                ctx.beginPath();
                ctx.moveTo(lineX, lineY);
                ctx.lineTo(lineX - 15, lineY);
                ctx.stroke();
            }
        }
        
        // Re-enable smoothing for other elements
        ctx.imageSmoothingEnabled = true;
        ctx.restore();
    }
    
    /**
     * Helper to draw rounded rectangle
     */
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.currentSpeed = this.baseSpeed;
        this.animationTime = 0;
        this.isRoaring = false;
        this.dustParticles = [];
        this.roarParticles = [];
        this.speedTrail = [];
    }
}
