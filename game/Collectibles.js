/**
 * Collectibles.js - Manages number collection
 * Enhanced graphics with better visual effects
 */

export const NumberType = {
    TWO: 2,
    THREE: 3,
    FIVE: 5,
    SIX: 6
};

export const PowerUpType = {
    SPEED_BOOST: 'speed',
    INVINCIBILITY: 'invincible',
    MAGNET: 'magnet',
    DOUBLE_SCORE: 'doubleScore',
    MYSTERY_BOX: 'mystery'
};

export class Collectibles {
    constructor() {
        this.cubes = [];
        this.powerUps = [];
        this.mysteryBoxes = [];
    }
    
    /**
     * Create a power-up
     */
    createPowerUp(x, y, type) {
        const colors = {
            'speed': '#FFD700',
            'invincible': '#FF6B6B',
            'magnet': '#4ECDC4',
            'doubleScore': '#95E1D3'
        };
        
        this.powerUps.push({
            x: x,
            y: y,
            width: 32,
            height: 32,
            type: type,
            color: colors[type] || '#FFFFFF',
            collected: false,
            floatPhase: Math.random() * Math.PI * 2,
            rotation: 0,
            pulsePhase: Math.random() * Math.PI * 2
        });
    }
    
    /**
     * Create a mystery box
     */
    createMysteryBox(x, y) {
        this.mysteryBoxes.push({
            x: x,
            y: y,
            width: 35,
            height: 35,
            collected: false,
            floatPhase: Math.random() * Math.PI * 2,
            rotation: 0,
            pulsePhase: Math.random() * Math.PI * 2,
            glowPhase: 0
        });
    }
    
    /**
     * Check power-up collection
     */
    checkPowerUpCollection(playerBounds) {
        for (let powerUp of this.powerUps) {
            if (powerUp.collected) continue;
            
            const powerUpBounds = {
                x: powerUp.x - powerUp.width / 2,
                y: powerUp.y - powerUp.height / 2,
                width: powerUp.width,
                height: powerUp.height
            };
            
            if (this.isColliding(playerBounds, powerUpBounds)) {
                powerUp.collected = true;
                return powerUp.type;
            }
        }
        return null;
    }
    
    /**
     * Check mystery box collection
     */
    checkMysteryBoxCollection(playerBounds) {
        for (let box of this.mysteryBoxes) {
            if (box.collected) continue;
            
            const boxBounds = {
                x: box.x - box.width / 2,
                y: box.y - box.height / 2,
                width: box.width,
                height: box.height
            };
            
            if (this.isColliding(playerBounds, boxBounds)) {
                box.collected = true;
                return true;
            }
        }
        return false;
    }
    
    /**
     * Create a number collectible
     */
    createCube(x, y, number) {
        const numberColors = {
            2: '#FF6B6B',  // Red
            3: '#4ECDC4',  // Cyan
            5: '#FFD93D',  // Yellow
            6: '#95E1D3'   // Light Green
        };
        
        this.cubes.push({
            x: x,
            y: y,
            width: 32,
            height: 32,
            number: number,
            color: numberColors[number] || '#FFFFFF',
            collected: false,
            floatPhase: Math.random() * Math.PI * 2,
            rotation: 0,
            pulsePhase: Math.random() * Math.PI * 2
        });
    }
    
    /**
     * Check collection with player
     * Returns the color type if collected, null otherwise
     */
    checkCollection(playerBounds) {
        // Only check one cube per call to prevent multiple collections
        for (let cube of this.cubes) {
            if (cube.collected) continue;
            
            // Check collision
            const cubeBounds = {
                x: cube.x - cube.width / 2,
                y: cube.y - cube.height / 2,
                width: cube.width,
                height: cube.height
            };
            
            if (this.isColliding(playerBounds, cubeBounds)) {
                // Mark as collected IMMEDIATELY to prevent re-triggering
                cube.collected = true;
                
                // Store number before returning
                const number = cube.number;
                
                // Return immediately - only one collection per frame
                return number;
            }
        }
        return null;
    }
    
    /**
     * Simple AABB collision detection
     */
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    /**
     * Update collectibles (animations)
     */
    update(deltaTime, playerX = null) {
        // Clean up collected cubes and cubes far behind player
        if (playerX !== null) {
            this.cubes = this.cubes.filter(cube => {
                // Keep if not collected and not too far behind
                return !cube.collected && cube.x > playerX - 500;
            });
        } else {
            // Just remove collected ones if no playerX provided
            this.cubes = this.cubes.filter(cube => !cube.collected);
        }
        
        // Update cubes
        this.cubes.forEach(cube => {
            // Floating animation
            cube.floatPhase += deltaTime * 2;
            
            // Rotation animation
            cube.rotation += deltaTime * 2;
            
            // Pulse animation
            cube.pulsePhase += deltaTime * 4;
        });
        
        // Update power-ups
        this.powerUps.forEach(powerUp => {
            if (powerUp.collected) return;
            powerUp.floatPhase += deltaTime * 2;
            powerUp.rotation += deltaTime * 3;
            powerUp.pulsePhase += deltaTime * 4;
        });
        
        // Update mystery boxes
        this.mysteryBoxes.forEach(box => {
            if (box.collected) return;
            box.floatPhase += deltaTime * 1.5;
            box.rotation += deltaTime * 2;
            box.pulsePhase += deltaTime * 3;
            box.glowPhase += deltaTime * 5;
        });
    }
    
    /**
     * Reset all collectibles
     */
    reset() {
        this.cubes = [];
        this.powerUps = [];
        this.mysteryBoxes = [];
    }
    
    /**
     * Draw all collectibles - Enhanced Graphics
     */
    draw(ctx, cameraX) {
        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            if (powerUp.collected) return;
            
            const screenX = powerUp.x - cameraX;
            const floatOffset = Math.sin(powerUp.floatPhase) * 10;
            const y = powerUp.y + floatOffset;
            const pulseScale = 1 + Math.sin(powerUp.pulsePhase) * 0.2;
            
            ctx.save();
            ctx.translate(screenX, y);
            ctx.rotate(powerUp.rotation);
            ctx.scale(pulseScale, pulseScale);
            
            // Draw power-up icon
            ctx.fillStyle = powerUp.color;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, powerUp.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Icon symbol
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const symbols = {
                'speed': '⚡',
                'invincible': '🛡',
                'magnet': '🧲',
                'doubleScore': '2x'
            };
            ctx.fillText(symbols[powerUp.type] || '?', 0, 0);
            
            ctx.restore();
        });
        
        // Draw mystery boxes
        this.mysteryBoxes.forEach(box => {
            if (box.collected) return;
            
            const screenX = box.x - cameraX;
            const floatOffset = Math.sin(box.floatPhase) * 12;
            const y = box.y + floatOffset;
            const pulseScale = 1 + Math.sin(box.pulsePhase) * 0.15;
            const glow = Math.sin(box.glowPhase) * 0.3 + 0.7;
            
            ctx.save();
            ctx.translate(screenX, y);
            ctx.rotate(box.rotation);
            ctx.scale(pulseScale, pulseScale);
            
            // Glow effect
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, box.width);
            glowGradient.addColorStop(0, `rgba(155, 89, 182, ${glow})`);
            glowGradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, box.width, 0, Math.PI * 2);
            ctx.fill();
            
            // Box
            ctx.fillStyle = '#9B59B6';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.fillRect(-box.width/2, -box.height/2, box.width, box.height);
            ctx.strokeRect(-box.width/2, -box.height/2, box.width, box.height);
            
            // Question mark
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', 0, 0);
            
            ctx.restore();
        });
        
        // Draw number collectibles
        this.cubes.forEach(cube => {
            // Don't draw collected cubes
            if (cube.collected) {
                return;
            }
            
            const screenX = cube.x - cameraX;
            const floatOffset = Math.sin(cube.floatPhase) * 12;
            const y = cube.y + floatOffset;
            const pulseScale = 1 + Math.sin(cube.pulsePhase) * 0.15;
            
            ctx.save();
            ctx.translate(screenX, y);
            ctx.rotate(cube.rotation);
            ctx.scale(pulseScale, pulseScale);
            
            // Main cube - Professional design with depth
            // Shadow first
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.drawRoundedRect(ctx, 
                -cube.width / 2 + 2, 
                -cube.height / 2 + 2, 
                cube.width, 
                cube.height, 
                6
            );
            ctx.fill();
            
            // Main cube gradient - Number-based colors
            const cubeGradient = ctx.createLinearGradient(-cube.width/2, -cube.height/2, cube.width/2, cube.height/2);
            cubeGradient.addColorStop(0, cube.color);
            cubeGradient.addColorStop(0.5, this.darkenColor(cube.color, 0.2));
            cubeGradient.addColorStop(1, this.darkenColor(cube.color, 0.4));
            ctx.fillStyle = cubeGradient;
            ctx.strokeStyle = '#1A252F';
            ctx.lineWidth = 2;
            
            // Draw rounded cube
            this.drawRoundedRect(ctx, -cube.width / 2, -cube.height / 2, cube.width, cube.height, 6);
            ctx.fill();
            ctx.stroke();
            
            // Top highlight for 3D effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.drawRoundedRect(ctx, -cube.width / 3, -cube.height / 3, cube.width * 2 / 3, cube.height / 3, 3);
            ctx.fill();
            
            // Side shadow for depth
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.drawRoundedRect(ctx, 
                cube.width / 2 - 3, 
                -cube.height / 3, 
                3, 
                cube.height * 2 / 3, 
                1
            );
            ctx.fill();
            
            // Draw number text
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(cube.number.toString(), 0, 0);
            ctx.fillText(cube.number.toString(), 0, 0);
            
            // Glow effect around cube
            const glowAlpha = Math.sin(cube.pulsePhase * 2) * 0.2 + 0.3;
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cube.width * 1.5);
            glowGradient.addColorStop(0, `rgba(${this.hexToRgb(cube.color).r}, ${this.hexToRgb(cube.color).g}, ${this.hexToRgb(cube.color).b}, ${glowAlpha})`);
            glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, cube.width * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Sparkle effect
            const sparkleAlpha = Math.sin(cube.pulsePhase * 2) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
            ctx.beginPath();
            ctx.arc(-cube.width / 4, -cube.height / 4, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Additional sparkles
            for (let i = 0; i < 3; i++) {
                const angle = (cube.pulsePhase * 2 + i * Math.PI * 2 / 3) * 2;
                const sparkleX = Math.cos(angle) * cube.width * 0.4;
                const sparkleY = Math.sin(angle) * cube.width * 0.4;
                const sparkleSize = Math.sin(cube.pulsePhase * 3 + i) * 0.5 + 1.5;
                ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha * 0.7})`;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }
    
    /**
     * Draw rounded rectangle
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
    
    /**
     * Helper to darken a color
     */
    darkenColor(color, amount) {
        // Simple darkening for hex colors
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
        const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
        const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    /**
     * Helper to convert hex to RGB
     */
    hexToRgb(hex) {
        const num = parseInt(hex.replace('#', ''), 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }
}
