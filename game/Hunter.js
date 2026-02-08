/**
 * Hunter.js - Premium relentless pursuer
 * Always visible, serious design, smooth organic shapes
 * CORE PRESSURE SYSTEM
 */

export class Hunter {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 140;
        this.height = 160;
        
        this.baseSpeed = 150;
        this.currentSpeed = this.baseSpeed;
        this.targetDistance = 300;
        this.minDistance = 50;
        
        this.animationTime = 0;
        this.legPhase = 0;
        this.bodySway = 0;
        this.presenceIntensity = 0;
        this.shadowOffset = 0;
        
        this.dustParticles = [];
        this.groundY = 550;
        
        // Visual intensity
        this.stompIntensity = 0;
        this.breathPhase = 0;
    }
    
    update(deltaTime, playerX, playerY, groundY, gameSpeed, targetDistance, momentum) {
        this.animationTime += deltaTime;
        this.groundY = groundY;
        this.targetDistance = targetDistance;
        
        const distanceToPlayer = playerX - this.x;
        const momentumPressure = 1.0 - momentum;
        const speedMultiplier = 0.8 + (momentumPressure * 0.4);
        
        if (distanceToPlayer > this.targetDistance) {
            this.currentSpeed = Math.min(400, (this.baseSpeed + (distanceToPlayer - this.targetDistance) * 0.5) * speedMultiplier);
        } else if (distanceToPlayer < this.minDistance) {
            this.currentSpeed = this.baseSpeed * 0.7 * speedMultiplier;
        } else {
            this.currentSpeed = this.baseSpeed * speedMultiplier;
        }
        
        const moveDistance = this.currentSpeed * deltaTime;
        if (distanceToPlayer > this.minDistance) {
            this.x += moveDistance;
        }
        
        this.y = this.groundY - this.height / 2;
        
        this.legPhase += deltaTime * (10 + momentumPressure * 5);
        this.bodySway = Math.sin(this.animationTime * 2.5) * 4;
        this.presenceIntensity = momentumPressure;
        this.shadowOffset = Math.sin(this.animationTime * 3) * 3;
        this.breathPhase += deltaTime * 3;
        this.stompIntensity = Math.min(1, this.stompIntensity + deltaTime * 2);
        
        this.updateDustParticles(deltaTime);
    }
    
    updateDustParticles(deltaTime) {
        if (Math.random() < 0.4) {
            this.dustParticles.push({
                x: this.x - 30 + Math.random() * 60,
                y: this.groundY,
                vx: -40 - Math.random() * 30,
                vy: -15 - Math.random() * 15,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 0.6 + Math.random() * 0.4,
                size: 4 + Math.random() * 6
            });
        }
        
        this.dustParticles = this.dustParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 200 * deltaTime;
            particle.life -= deltaTime;
            return particle.life > 0;
        });
    }
    
    checkCollision(playerX, playerY, playerWidth, playerHeight) {
        const dx = Math.abs((playerX + playerWidth / 2) - (this.x + this.width / 2));
        const dy = Math.abs((playerY + playerHeight / 2) - (this.y + this.height / 2));
        return dx < (playerWidth / 2 + this.width / 2) && dy < (playerHeight / 2 + this.height / 2);
    }
    
    /**
     * Draw premium hunter - smooth, menacing, always visible
     */
    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        const screenY = this.y;
        
        if (screenX < -300 || screenX > ctx.canvas.width + 300) {
            return;
        }
        
        ctx.save();
        
        // Premium shadow with intensity
        const shadowAlpha = 0.4 + this.presenceIntensity * 0.3;
        const shadowGradient = ctx.createRadialGradient(
            screenX + this.width / 2 + this.shadowOffset, this.groundY, 0,
            screenX + this.width / 2 + this.shadowOffset, this.groundY, this.width * 0.8
        );
        shadowGradient.addColorStop(0, `rgba(0, 0, 0, ${shadowAlpha})`);
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(screenX + this.width / 2 + this.shadowOffset, this.groundY, 
                   this.width * 0.7, this.width * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Dust particles with better visuals
        this.dustParticles.forEach(particle => {
            const particleX = particle.x - cameraX;
            if (particleX > -50 && particleX < ctx.canvas.width + 50) {
                const alpha = particle.life / particle.maxLife;
                const gradient = ctx.createRadialGradient(particleX, particle.y, 0, particleX, particle.y, particle.size * 2);
                gradient.addColorStop(0, `rgba(120, 120, 120, ${alpha * 0.8})`);
                gradient.addColorStop(1, `rgba(80, 80, 80, 0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(particleX, particle.y, particle.size * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.translate(screenX + this.width / 2 + this.bodySway, screenY + this.height / 2);
        
        // Presence glow when close
        if (this.presenceIntensity > 0.4) {
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width);
            glowGradient.addColorStop(0, `rgba(200, 0, 0, ${this.presenceIntensity * 0.3})`);
            glowGradient.addColorStop(1, 'rgba(200, 0, 0, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.width, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Main body - smooth, powerful, organic
        const bodyGradient = ctx.createLinearGradient(-this.width / 2, -this.height / 2, -this.width / 2, this.height / 2);
        bodyGradient.addColorStop(0, '#1a1a1a');
        bodyGradient.addColorStop(0.5, '#2a2a2a');
        bodyGradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        this.roundRect(ctx, -this.width / 2, -this.height / 3, this.width, this.height * 0.6, 12);
        ctx.fill();
        
        // Head - smooth, menacing
        const headY = -this.height / 2 + 25;
        ctx.fillStyle = '#0f0f0f';
        ctx.beginPath();
        ctx.ellipse(0, headY, 35, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes - glowing, intense
        const eyeGlow = this.presenceIntensity;
        const eyeGradient = ctx.createRadialGradient(-12, headY, 0, -12, headY, 8 + eyeGlow * 6);
        eyeGradient.addColorStop(0, `rgba(255, 0, 0, ${0.8 + eyeGlow * 0.2})`);
        eyeGradient.addColorStop(0.5, `rgba(200, 0, 0, ${0.6 + eyeGlow * 0.4})`);
        eyeGradient.addColorStop(1, 'rgba(100, 0, 0, 0)');
        ctx.fillStyle = eyeGradient;
        ctx.beginPath();
        ctx.arc(-12, headY, 8 + eyeGlow * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(12, headY, 8 + eyeGlow * 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Body details - muscular, powerful
        ctx.fillStyle = '#1f1f1f';
        ctx.beginPath();
        this.roundRect(ctx, -this.width / 2 + 15, -this.height / 3 + 20, this.width - 30, this.height * 0.4, 8);
        ctx.fill();
        
        // Legs - smooth, powerful, animated
        const legOffset = Math.sin(this.legPhase) * 10;
        ctx.fillStyle = '#0f0f0f';
        // Left leg
        ctx.save();
        ctx.translate(-this.width / 2 + 30, this.height / 3);
        ctx.rotate(Math.sin(this.legPhase) * 0.2);
        ctx.beginPath();
        this.roundRect(ctx, -8, 0, 16, 35, 6);
        ctx.fill();
        ctx.restore();
        // Right leg
        ctx.save();
        ctx.translate(this.width / 2 - 30, this.height / 3);
        ctx.rotate(Math.sin(this.legPhase + Math.PI) * 0.2);
        ctx.beginPath();
        this.roundRect(ctx, -8, 0, 16, 35, 6);
        ctx.fill();
        ctx.restore();
        
        // Breath effect
        if (this.presenceIntensity > 0.5) {
            const breathAlpha = Math.sin(this.breathPhase) * 0.3 + 0.2;
            ctx.fillStyle = `rgba(200, 0, 0, ${breathAlpha})`;
            ctx.beginPath();
            ctx.ellipse(0, headY + 25, 20, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    roundRect(ctx, x, y, width, height, radius) {
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
}
