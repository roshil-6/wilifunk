/**
 * Obstacles.js - Simple working obstacles
 * Basic blocks and bombs that the player can collide with
 */

export class Obstacles {
    constructor() {
        this.obstacles = [];
        this.lastSpawnX = 0; // Will be set to player's starting position
        this.spawnDistance = 300;
        this.groundY = 550;
        this.initialized = false;
    }
    
    /**
     * Update obstacles
     */
    update(deltaTime, playerX, gameSpeed) {
        // Initialize lastSpawnX to player's starting position on first update
        if (!this.initialized) {
            this.lastSpawnX = playerX;
            this.initialized = true;
        }
        
        // Remove obstacles behind player
        this.obstacles = this.obstacles.filter(obs => obs.x > playerX - 500);
        
        // Spawn new obstacles ahead of player
        while (this.lastSpawnX < playerX + 1500) {
            this.spawnObstacle(this.lastSpawnX + this.spawnDistance);
            this.lastSpawnX += this.spawnDistance;
        }
    }
    
    /**
     * Spawn a simple obstacle
     */
    spawnObstacle(x) {
        const types = ['block', 'bomb', 'airBlock'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const obstacle = {
            x: x,
            type: type,
            width: 40,
            height: 40,
            y: this.groundY - 40, // Ground level
            active: true
        };
        
        // Air blocks float
        if (type === 'airBlock') {
            obstacle.y = 350 + Math.random() * 100;
        }
        
        // Bombs are smaller
        if (type === 'bomb') {
            obstacle.width = 30;
            obstacle.height = 30;
        }
        
        this.obstacles.push(obstacle);
    }
    
    /**
     * Check collision with player
     */
    checkCollision(playerX, playerY, playerWidth, playerHeight) {
        const playerLeft = playerX - playerWidth / 2;
        const playerRight = playerX + playerWidth / 2;
        const playerTop = playerY - playerHeight / 2;
        const playerBottom = playerY + playerHeight / 2;
        
        for (const obs of this.obstacles) {
            if (!obs.active) continue;
            
            const obsLeft = obs.x - obs.width / 2;
            const obsRight = obs.x + obs.width / 2;
            const obsTop = obs.y - obs.height / 2;
            const obsBottom = obs.y + obs.height / 2;
            
            if (playerRight > obsLeft && 
                playerLeft < obsRight && 
                playerBottom > obsTop && 
                playerTop < obsBottom) {
                return true; // Collision!
            }
        }
        
        return false;
    }
    
    /**
     * Draw obstacles
     */
    draw(ctx, cameraX) {
        // Safety check
        if (!isFinite(cameraX)) {
            cameraX = 0;
        }
        
        for (const obs of this.obstacles) {
            if (!obs.active) continue;
            
            const screenX = obs.x - cameraX;
            
            // Cull off-screen
            if (screenX < -100 || screenX > ctx.canvas.width + 100) {
                continue;
            }
            
            // Validate values
            if (!isFinite(screenX) || !isFinite(obs.y) || !isFinite(obs.width) || !isFinite(obs.height)) {
                continue;
            }
            
            ctx.save();
            
            // Draw based on type
            if (obs.type === 'bomb') {
                // Enhanced bomb with 3D effect
                const bombX = screenX;
                const bombY = obs.y;
                const radius = obs.width / 2;
                
                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(bombX + 2, bombY + radius + 3, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Bomb body gradient
                const bombGradient = ctx.createRadialGradient(
                    bombX - radius * 0.3, bombY - radius * 0.3, 0,
                    bombX, bombY, radius
                );
                bombGradient.addColorStop(0, '#FF4444');
                bombGradient.addColorStop(0.5, '#CC0000');
                bombGradient.addColorStop(1, '#990000');
                ctx.fillStyle = bombGradient;
                ctx.beginPath();
                ctx.arc(bombX, bombY, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(bombX - radius * 0.3, bombY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
                ctx.fill();
                
                // Fuse with glow
                ctx.fillStyle = '#FFD700';
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#FFD700';
                ctx.fillRect(bombX - 3, bombY - radius - 8, 6, 10);
                ctx.shadowBlur = 0;
                
                // Fuse tip (spark)
                ctx.fillStyle = '#FF6600';
                ctx.beginPath();
                ctx.arc(bombX, bombY - radius - 8, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Enhanced block with 3D effect
                const blockX = screenX - obs.width / 2;
                const blockY = obs.y - obs.height / 2;
                const isAir = obs.type === 'airBlock';
                
                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                ctx.fillRect(blockX + 3, blockY + obs.height + 2, obs.width, 4);
                
                // Block gradient
                const blockGradient = ctx.createLinearGradient(
                    blockX, blockY,
                    blockX, blockY + obs.height
                );
                if (isAir) {
                    blockGradient.addColorStop(0, '#888888');
                    blockGradient.addColorStop(0.5, '#666666');
                    blockGradient.addColorStop(1, '#444444');
                } else {
                    blockGradient.addColorStop(0, '#A68B5F');
                    blockGradient.addColorStop(0.5, '#8B6F47');
                    blockGradient.addColorStop(1, '#6B5237');
                }
                ctx.fillStyle = blockGradient;
                ctx.fillRect(blockX, blockY, obs.width, obs.height);
                
                // Top highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(blockX, blockY, obs.width, 3);
                
                // Left highlight
                ctx.fillRect(blockX, blockY, 3, obs.height);
                
                // Right shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(blockX + obs.width - 3, blockY, 3, obs.height);
                
                // Bottom shadow
                ctx.fillRect(blockX, blockY + obs.height - 3, obs.width, 3);
                
                // Texture (for ground blocks)
                if (!isAir) {
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                    ctx.lineWidth = 1;
                    for (let i = 1; i < 3; i++) {
                        ctx.beginPath();
                        ctx.moveTo(blockX + i * obs.width / 3, blockY);
                        ctx.lineTo(blockX + i * obs.width / 3, blockY + obs.height);
                        ctx.stroke();
                    }
                }
                
                // Outline
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(blockX, blockY, obs.width, obs.height);
            }
            
            ctx.restore();
        }
    }
    
    /**
     * Spawn initial obstacles (simple, easy start)
     */
    spawnInitialObstacles(playerStartX = 100) {
        // Start easy - few obstacles ahead of player
        // Player starts at x=100, so spawn obstacles starting at x=600 (500 units ahead)
        this.lastSpawnX = playerStartX;
        for (let i = 0; i < 3; i++) {
            const spawnX = playerStartX + 500 + i * 400;
            this.spawnObstacle(spawnX);
            this.lastSpawnX = Math.max(this.lastSpawnX, spawnX);
        }
        this.initialized = true;
    }
    
    /**
     * Spawn challenge (for compatibility with Game.js)
     */
    spawnChallenge(x, type) {
        // Simple compatibility method
        this.spawnObstacle(x);
    }
    
    /**
     * Spawn challenges (for compatibility)
     */
    spawnChallenges(worldX, momentum) {
        // Simple compatibility - just spawn obstacles
        while (this.lastSpawnX < worldX + 2000) {
            this.spawnObstacle(this.lastSpawnX + this.spawnDistance);
            this.lastSpawnX += this.spawnDistance;
        }
    }
}
