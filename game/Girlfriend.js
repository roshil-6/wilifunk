/**
 * Girlfriend.js - The falling girlfriend (visual timer)
 * Falls from building - creates urgency
 */

export class Girlfriend {
    constructor(x, startY) {
        this.x = x;
        this.y = startY;
        this.startY = startY;
        this.width = 60; // Even bigger for visibility
        this.height = 60; // Even bigger for visibility
        this.fallSpeed = 120; // pixels per second (faster for urgency)
        this.hasReached = false;
        this.hasFallen = false;
        
        // Visual properties - Neon Magenta
        this.color = '#FF2FB3'; // Neon Magenta
        this.glowColor = '#FF2FB3';
        this.coreColor = '#FFFFFF';
        
        // Animation
        this.animationTime = 0;
        this.pulsePhase = 0;
        
        // Urgency indicators
        this.urgencyPhase = 0;
    }
    
    /**
     * Update girlfriend position (falling with increasing urgency)
     */
    update(deltaTime) {
        this.animationTime += deltaTime;
        this.pulsePhase += deltaTime * 4; // Faster pulse for urgency
        this.urgencyPhase += deltaTime * 6;
        
        if (!this.hasReached && !this.hasFallen) {
            // Increase fall speed over time (urgency increases)
            const speedMultiplier = 1 + (this.animationTime * 0.1);
            this.y += this.fallSpeed * speedMultiplier * deltaTime;
        }
    }
    
    /**
     * Check if Willu reached the end (win condition - changed)
     * Now win is when player reaches the building, not catching in air
     */
    checkReach(playerX, playerY, reachDistance, endBuildingX) {
        if (this.hasReached || this.hasFallen) return false;
        
        // Win condition: Player must reach the building (end of level)
        if (playerX >= endBuildingX - 50) {
            this.hasReached = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if girlfriend fell out of view (lose condition)
     */
    checkFell(cameraY, screenHeight) {
        if (this.hasReached || this.hasFallen) return false;
        
        if (this.y > cameraY + screenHeight + 50) {
            this.hasFallen = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * Get urgency level (0-1) based on how close she is to falling
     */
    getUrgencyLevel(cameraY, screenHeight) {
        if (this.hasReached || this.hasFallen) return 0;
        
        const distanceToBottom = (cameraY + screenHeight) - this.y;
        const maxDistance = screenHeight;
        return Math.max(0, Math.min(1, 1 - (distanceToBottom / maxDistance)));
    }
    
    /**
     * Reset girlfriend to starting position
     */
    reset() {
        this.y = this.startY;
        this.hasReached = false;
        this.hasFallen = false;
        this.animationTime = 0;
        this.pulsePhase = 0;
        this.urgencyPhase = 0;
    }
    
    /**
     * Draw girlfriend on canvas - Enhanced with Urgency and Character Design
     */
    draw(ctx, cameraX = 0) {
        const screenX = this.x - cameraX;
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.25; // More visible pulse
        
        ctx.save();
        ctx.translate(screenX, this.y);
        ctx.scale(pulseScale, pulseScale);
        
        // Main body - Mario Run style character (no glow)
        const bodySize = this.width * 0.8;
        const bodyGradient = ctx.createLinearGradient(-bodySize/2, -bodySize/2, bodySize/2, bodySize/2);
        bodyGradient.addColorStop(0, '#FF6B9D');
        bodyGradient.addColorStop(0.5, '#E91E63');
        bodyGradient.addColorStop(1, '#C2185B');
        ctx.fillStyle = bodyGradient;
        ctx.strokeStyle = '#8B1538';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0; // No glow
        
        // Draw rounded body
        ctx.beginPath();
        ctx.arc(0, 0, bodySize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Head (smaller circle on top) - Mario Run style
        const headRadius = 12;
        const headGradient = ctx.createRadialGradient(0, -bodySize/2 - headRadius, 0, 0, -bodySize/2 - headRadius, headRadius);
        headGradient.addColorStop(0, '#FFE5B4');
        headGradient.addColorStop(0.7, '#FFD89B');
        headGradient.addColorStop(1, '#E6C085');
        ctx.fillStyle = headGradient;
        ctx.strokeStyle = '#CC9966';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -bodySize/2 - headRadius, headRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Eyes - Mario Run style
        ctx.fillStyle = '#000000';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(-5, -bodySize/2 - headRadius - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -bodySize/2 - headRadius - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Falling trail effect - subtle
        if (!this.hasReached && !this.hasFallen) {
            const trailLength = 30;
            const trailGradient = ctx.createLinearGradient(0, -trailLength, 0, 0);
            trailGradient.addColorStop(0, 'rgba(233, 30, 99, 0.3)');
            trailGradient.addColorStop(0.5, 'rgba(233, 30, 99, 0.15)');
            trailGradient.addColorStop(1, 'rgba(233, 30, 99, 0)');
            ctx.fillStyle = trailGradient;
            ctx.fillRect(-4, -trailLength, 8, trailLength);
        }
        
        ctx.restore();
    }
}
