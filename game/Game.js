/**
 * Game.js - Premium 2D Hunt Runner
 * Core mechanic: MOMENTUM/FLOW system
 * Failure condition: HUNTER catches player
 */

import { Input } from './Input.js';
import { Player } from './Player.js';
import { TRex } from './TRex.js';
import { Obstacles } from './Obstacles.js';
import { Collectibles } from './Collectibles.js';
import { ComboSystem } from './ComboSystem.js';
import { PixelArt } from './PixelArt.js';

        // Make game accessible globally for Player input access
        if (typeof window !== 'undefined') {
            window.gameInstance = this;
        }

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true,
            willReadFrequently: false
        });
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.input = new Input();
        
        // Game state
        this.isRunning = false;
        this.isGameOver = false;
        this.gameStarted = false;
        
        // Dino chase mechanics
        this.missedNumbers = 0;
        this.lastNumberCollectionTime = 0;
        this.timeSinceLastCollection = 0;
        this.numberCollectionAdvantages = {
            speedBoost: 0,
            jumpBoost: 0,
            collectionCount: 0
        };
        
        // Game objects
        this.player = null;
        this.trex = null; // T-Rex enemy
        this.obstacles = null;
        this.collectibles = null;
        this.comboSystem = null;
        this.camera = null;
        
        // World
        this.groundY = 550;
        this.worldX = 0; // World scrolls left to right
        this.baseSpeed = 200;
        this.currentSpeed = this.baseSpeed;
        this.baseGameSpeed = 200; // Missing property fix
        this.gameSpeed = this.baseGameSpeed;
        
        // Camera system - FIXED to never move faster than player
        this.cameraVelocityX = 0; // Camera velocity for smooth damping
        this.cameraDamping = 0.15; // Smooth damping factor (lower = smoother, slower)
        this.cameraLookAhead = 50; // Small look-ahead distance
        this.cameraMaxLookAhead = 100; // Maximum look-ahead
        this.cameraMaxSpeed = 200; // Camera max speed (matches player speed)
        
        // Debug options
        this.cameraDebug = {
            freeze: false,
            slowMotion: false,
            showLookAhead: false
        };
        
        // Performance tracking (for titles)
        this.cleanMoves = 0;
        this.hesitations = 0;
        this.perfectTimings = 0;
        this.distanceTraveled = 0;
        this.timeAlive = 0;
        
        // Title system
        this.performanceTitle = null;
        this.titleThresholds = {
            'Reckless': { momentum: 0.3, distance: 100 },
            'Sharp': { momentum: 0.5, distance: 300 },
            'Relentless': { momentum: 0.7, distance: 600 },
            'Dominant': { momentum: 0.85, distance: 1000 },
            'Untouchable': { momentum: 0.95, distance: 2000 }
        };
        
        // UI elements (minimal)
        this.gameOverElement = document.getElementById('gameOver');
        this.retryBtn = document.getElementById('retryBtn');
        this.startMenu = document.getElementById('startMenu');
        this.startGameBtn = document.getElementById('startGameBtn');
        
        // Setup start button
        if (this.startGameBtn) {
            this.startGameBtn.onclick = () => this.startGame();
        }
        
        // Space to start
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.gameStarted) {
                e.preventDefault();
                this.startGame();
            }
        });
        
        // Debug camera controls (temporary for tuning)
        window.addEventListener('keydown', (e) => {
            // F1: Toggle camera freeze
            if (e.code === 'F1') {
                e.preventDefault();
                this.cameraDebug.freeze = !this.cameraDebug.freeze;
                console.log('Camera freeze:', this.cameraDebug.freeze);
            }
            // F2: Toggle slow motion
            if (e.code === 'F2') {
                e.preventDefault();
                this.cameraDebug.slowMotion = !this.cameraDebug.slowMotion;
                console.log('Camera slow motion:', this.cameraDebug.slowMotion);
            }
            // F3: Toggle look-ahead display
            if (e.code === 'F3') {
                e.preventDefault();
                this.cameraDebug.showLookAhead = !this.cameraDebug.showLookAhead;
                console.log('Show look-ahead:', this.cameraDebug.showLookAhead);
            }
        });
        
        // Animation frame
        this.lastTime = 0;
        this.animationFrameId = null;
    }
    
    /**
     * Initialize the game
     */
    init() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.resetGame();
        this.isRunning = true;
        this.gameLoop(0);
    }
    
    /**
     * Reset game to initial state
     */
    resetGame() {
        this.isGameOver = false;
        this.cameraX = 0;
        this.targetCameraX = 0;
        this.cameraVelocityX = 0; // Reset camera velocity
        this.gameSpeed = this.baseGameSpeed;
        this.score = 0;
        this.distanceTraveled = 0;
        this.missedNumbers = 0;
        this.lastNumberCollectionTime = 0;
        this.timeSinceLastCollection = 0;
        this.numberCollectionAdvantages = {
            speedBoost: 0,
            jumpBoost: 0,
            collectionCount: 0
        };
        this.screenShakeX = 0;
        this.screenShakeY = 0;
        
        // Create game objects
        this.player = new Player(100, 400);
        this.obstacles = new Obstacles();
        this.collectibles = new Collectibles();
        this.comboSystem = new ComboSystem();
        if (this.player) {
            this.trex = new TRex(this.player.x - 400, this.groundY - 70);
        }
        
        // Spawn initial obstacles
        this.spawnInitialObstacles();
        
        // Hide game over
        if (this.gameOverElement) {
            this.gameOverElement.classList.add('hidden');
        }
    }
    
    /**
     * Start the game
     */
    startGame() {
        if (this.gameStarted) return;
        
        this.gameStarted = true;
        if (this.startMenu) {
            this.startMenu.classList.add('hidden');
        }
    }
    
    /**
     * Main game loop
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        
        let deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Safety checks
        if (isNaN(deltaTime) || deltaTime <= 0 || deltaTime > 1) {
            deltaTime = 0.016;
        }
        deltaTime = Math.min(deltaTime, 0.033); // Cap at ~30fps minimum
        
        if (this.gameStarted && !this.isGameOver) {
            this.update(deltaTime);
        }
        
        this.draw();
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * Update game state
     */
    update(deltaTime) {
        if (this.isGameOver) return;
        
        // Update input
        this.input.update();
        
        // Update player
        this.player.update(deltaTime, this.groundY);
        
        // Update camera with proper velocity clamping
        this.updateCamera(deltaTime);
        
        // Update obstacles
        if (this.obstacles) {
            this.obstacles.update(deltaTime, this.player.x, this.gameSpeed);
            
            // Check obstacle collisions
            if (this.obstacles.checkCollision(this.player.x, this.player.y, 
                                             this.player.width, this.player.height)) {
                this.onPlayerDeath();
                return;
            }
        }
        
        // Update collectibles
        if (this.collectibles) {
            this.collectibles.update(deltaTime, this.player.x);
            
            // Check collection
            const playerBounds = {
                x: this.player.x - this.player.width / 2,
                y: this.player.y - this.player.height / 2,
                width: this.player.width,
                height: this.player.height
            };
            const collected = this.collectibles.checkCollection(playerBounds);
            if (collected) {
                this.lastNumberCollectionTime = Date.now() / 1000;
                this.timeSinceLastCollection = 0;
                this.numberCollectionAdvantages.collectionCount++;
            }
        }
        
        // Update T-Rex
        if (this.trex && this.player) {
            this.timeSinceLastCollection += deltaTime;
            this.trex.update(deltaTime, this.player.x, this.player.y, this.groundY, 
                           this.gameSpeed, this.missedNumbers, this.timeSinceLastCollection, true);
            
            // Check T-Rex catch
            const trexHit = this.trex.checkCollision(this.player.x, this.player.y, 
                                                    this.player.width, this.player.height);
            if (trexHit && this.numberCollectionAdvantages.collectionCount >= 2) {
                this.onPlayerDeath();
                return;
            }
        }
        
        // Update distance
        this.distanceTraveled = this.player.x;
        this.score = Math.floor(this.distanceTraveled / 10);
        
        // Spawn obstacles and collectibles
        this.spawnObstaclesAndCollectibles();
    }
    
    /**
     * Spawn obstacles and collectibles
     */
    spawnObstaclesAndCollectibles() {
        // Obstacles are auto-spawned in update()
        // Just spawn collectibles here
        
        // Spawn collectibles occasionally
        if (this.collectibles && Math.random() < 0.015) {
            const numbers = [2, 3, 5, 6];
            const number = numbers[Math.floor(Math.random() * numbers.length)];
            const collectibleY = 350 + Math.random() * 150;
            this.collectibles.createCube(this.player.x + 600, collectibleY, number);
        }
    }
    
    /**
     * Spawn initial obstacles
     */
    spawnInitialObstacles() {
        if (this.obstacles && this.player) {
            this.obstacles.spawnInitialObstacles(this.player.x);
        }
        
        // Add starter number boxes (give player a chance)
        if (this.collectibles && this.player) {
            // Delay first box slightly
            setTimeout(() => {
                if (this.collectibles && this.player) {
                    this.collectibles.createCube(this.player.x + 400, this.groundY - 110, 2);
                }
            }, 1000);
            
            setTimeout(() => {
                if (this.collectibles && this.player) {
                    this.collectibles.createCube(this.player.x + 700, this.groundY - 110, 3);
                }
            }, 2000);
        }
    }
    
    /**
     * Player death handler
     */
    onPlayerDeath() {
        if (this.isGameOver) return;
        
        this.isGameOver = true;
        this.addScreenShake(20, 15);
        
        // Show game over
        if (this.gameOverElement) {
            const messageEl = this.gameOverElement.querySelector('.game-over-message');
            const statsEl = this.gameOverElement.querySelector('.game-over-stats');
            
            if (messageEl) {
                messageEl.textContent = 'GAME OVER';
            }
            
            if (statsEl) {
                statsEl.innerHTML = `
                    <div>Distance: ${Math.floor(this.distanceTraveled)}m</div>
                    <div>Score: ${this.score}</div>
                `;
            }
            
            this.gameOverElement.classList.remove('hidden');
            this.gameOverElement.classList.add('visible');
        }
        
        // Setup retry
        if (this.retryBtn) {
            this.retryBtn.onclick = () => this.restart();
        }
        
        // Space to retry
        const spaceHandler = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                window.removeEventListener('keydown', spaceHandler);
                this.restart();
            }
        };
        window.addEventListener('keydown', spaceHandler);
    }
    
    /**
     * Restart game
     */
    restart() {
        this.resetGame();
        this.gameStarted = true;
    }
    
    /**
     * Update camera with smooth damping and velocity clamping
     * Camera NEVER moves faster than player speed
     */
    updateCamera(deltaTime) {
        if (this.cameraDebug.freeze) {
            return; // Debug: freeze camera
        }
        
        if (!this.player) return;
        
        // Get actual player speed
        const playerSpeed = this.player.velocityX || 200;
        
        // Calculate desired camera position
        // Player should stay at x=300 on screen, so camera = player.x - 300
        const baseTargetX = this.player.x - 300;
        
        // Calculate small look-ahead (scales with player speed, clamped)
        const lookAheadAmount = Math.min(
            this.cameraLookAhead * (playerSpeed / 200), // Scale with speed
            this.cameraMaxLookAhead // Clamp to max
        );
        this.targetCameraX = baseTargetX + lookAheadAmount;
        
        // Calculate desired camera movement
        const desiredMovement = this.targetCameraX - this.cameraX;
        
        // CRITICAL: Calculate maximum allowed movement per frame
        // Camera can move at most playerSpeed * deltaTime per frame
        const maxMovementPerFrame = playerSpeed * deltaTime;
        
        // Calculate desired movement with smooth damping
        const dampingFactor = 1 - Math.pow(1 - this.cameraDamping, deltaTime * 60);
        let desiredMovementThisFrame = desiredMovement * dampingFactor;
        
        // STRICT CLAMP: Camera movement per frame must never exceed player movement per frame
        if (Math.abs(desiredMovementThisFrame) > maxMovementPerFrame) {
            desiredMovementThisFrame = Math.sign(desiredMovementThisFrame) * maxMovementPerFrame;
        }
        
        // Apply camera movement (strictly clamped)
        if (this.cameraDebug.slowMotion) {
            this.cameraX += desiredMovementThisFrame * 0.5; // Debug: slow motion
        } else {
            this.cameraX += desiredMovementThisFrame;
        }
        
        // Update velocity for smooth interpolation (but clamped)
        this.cameraVelocityX = desiredMovementThisFrame / deltaTime;
        if (Math.abs(this.cameraVelocityX) > playerSpeed) {
            this.cameraVelocityX = Math.sign(this.cameraVelocityX) * playerSpeed;
        }
        
        // Safety clamp: Ensure camera never gets ahead of player
        const maxCameraX = this.player.x - 200; // Camera should be at least 200 units behind player
        if (this.cameraX > maxCameraX) {
            this.cameraX = maxCameraX;
            this.cameraVelocityX = 0;
        }
        
        // Safety clamp: Ensure camera never lags too far behind
        const minCameraX = this.player.x - 500; // Camera should not lag more than 500 units
        if (this.cameraX < minCameraX) {
            this.cameraX = minCameraX;
        }
    }
    
    /**
     * Add screen shake effect
     */
    addScreenShake(intensity, duration) {
        // Simple screen shake
        this.screenShakeX = intensity;
        this.screenShakeY = intensity;
        setTimeout(() => {
            this.screenShakeX = 0;
            this.screenShakeY = 0;
        }, duration * 1000);
    }
    
    /**
     * Draw everything
     */
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a'; // Serious dark background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.gameStarted) {
            this.drawStartScreen();
            return;
        }
        
        if (!this.player || !this.trex || !this.obstacles) {
            return;
        }
        
        // Simple camera offset with shake
        this.ctx.save();
        this.ctx.translate(-this.cameraX + this.screenShakeX, this.screenShakeY);
        
        // Draw sky gradient (beautiful blue to light blue)
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
        skyGradient.addColorStop(0, '#87CEEB'); // Sky blue
        skyGradient.addColorStop(0.5, '#B0E0E6'); // Powder blue
        skyGradient.addColorStop(1, '#E0F6FF'); // Light blue
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(-2000, 0, 4000, this.groundY);
        
        // Draw clouds (parallax effect)
        this.drawClouds();
        
        // Draw ground with texture and gradient
        const groundGradient = this.ctx.createLinearGradient(0, this.groundY, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#8B6F47'); // Light brown
        groundGradient.addColorStop(0.3, '#6B5237'); // Medium brown
        groundGradient.addColorStop(1, '#4A3427'); // Dark brown
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(-2000, this.groundY, 4000, this.canvas.height - this.groundY);
        
        // Draw ground texture/grass line
        this.ctx.strokeStyle = '#7ED321';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-2000, this.groundY);
        this.ctx.lineTo(2000, this.groundY);
        this.ctx.stroke();
        
        // Draw ground detail (small grass tufts)
        this.ctx.fillStyle = '#5CB85C';
        for (let x = -2000; x < 2000; x += 40) {
            if (Math.random() > 0.6) {
                const offset = (Math.sin(x * 0.1) * 2);
                this.ctx.fillRect(x + offset, this.groundY - 2, 2, 4);
                this.ctx.fillRect(x + offset + 3, this.groundY - 3, 2, 5);
            }
        }
        
        // Draw obstacles
        this.obstacles.draw(this.ctx, this.cameraX);
        
        // Draw T-Rex
        this.trex.draw(this.ctx, this.cameraX);
        
        // Draw collectibles
        if (this.collectibles) {
            this.collectibles.draw(this.ctx, this.cameraX);
        }
        
        // Draw player
        this.player.draw(this.ctx, this.cameraX);
        
        // Debug: Draw look-ahead indicator
        if (this.cameraDebug.showLookAhead && this.player) {
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            const lookAheadX = this.player.x + this.cameraLookAhead - this.cameraX;
            this.ctx.beginPath();
            this.ctx.moveTo(lookAheadX, 0);
            this.ctx.lineTo(lookAheadX, this.canvas.height);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Draw start screen (minimal)
     */
    drawStartScreen() {
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#EEE';
        this.ctx.font = 'bold 48px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('HUNT RUNNER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '24px monospace';
        this.ctx.fillText('Press SPACE to start', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    /**
     * Draw background - premium layered depth with atmosphere
     */
    drawBackground() {
        // Sky gradient for depth
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#0a0a0a');
        skyGradient.addColorStop(0.5, '#0f0f0f');
        skyGradient.addColorStop(1, '#1a1a1a');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(-2000, 0, this.canvas.width * 4, this.canvas.height);
        
        // Far background (parallax) - subtle atmospheric elements
        const bg1Offset = this.camera.x * 0.1;
        this.ctx.fillStyle = 'rgba(30, 30, 30, 0.3)';
        for (let i = 0; i < 15; i++) {
            const x = (i * 400 - bg1Offset) % (this.canvas.width * 5);
            const size = 20 + Math.sin(i) * 10;
            this.ctx.beginPath();
            this.ctx.arc(x, 100 + Math.sin(i * 0.7) * 50, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Mid background - environmental elements
        const bg2Offset = this.camera.x * 0.3;
        this.drawEnvironment(bg2Offset);
    }
    
    /**
     * Draw environment elements - premium layered depth
     */
    drawEnvironment(offset) {
        // Environmental storytelling - ruins, structures with smooth shapes
        for (let i = 0; i < 25; i++) {
            const x = (i * 280 - offset) % (this.canvas.width * 4);
            const height = 60 + Math.sin(i * 0.5) * 40 + Math.cos(i * 0.3) * 20;
            const width = 35 + Math.sin(i) * 15;
            
            // Smooth structure with gradient
            const structureGradient = this.ctx.createLinearGradient(x, this.groundY - height, x, this.groundY);
            structureGradient.addColorStop(0, '#2a2a2a');
            structureGradient.addColorStop(1, '#1a1a1a');
            this.ctx.fillStyle = structureGradient;
            
            // Rounded top
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.groundY - height);
            this.ctx.lineTo(x + width, this.groundY - height);
            this.ctx.quadraticCurveTo(x + width, this.groundY - height - 5, x + width / 2, this.groundY - height - 8);
            this.ctx.quadraticCurveTo(x, this.groundY - height - 5, x, this.groundY - height);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Main body
            this.ctx.fillRect(x, this.groundY - height, width, height);
            
            // Decay details
            if (Math.random() > 0.7) {
                this.ctx.fillStyle = '#1a1a1a';
                this.ctx.fillRect(x + width * 0.3, this.groundY - height * 0.6, width * 0.4, 3);
            }
        }
    }
    
    /**
     * Draw clouds for atmosphere
     */
    drawClouds() {
        const cloudOffset = this.cameraX * 0.3; // Parallax
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        
        for (let i = 0; i < 8; i++) {
            const cloudX = ((i * 600 - cloudOffset) % 2400) - 200;
            const cloudY = 80 + Math.sin(i) * 40;
            const cloudSize = 60 + Math.sin(i * 0.7) * 20;
            
            // Draw fluffy cloud
            this.ctx.beginPath();
            this.ctx.arc(cloudX, cloudY, cloudSize * 0.6, 0, Math.PI * 2);
            this.ctx.arc(cloudX + cloudSize * 0.5, cloudY, cloudSize * 0.7, 0, Math.PI * 2);
            this.ctx.arc(cloudX + cloudSize, cloudY, cloudSize * 0.6, 0, Math.PI * 2);
            this.ctx.arc(cloudX + cloudSize * 0.3, cloudY - cloudSize * 0.3, cloudSize * 0.5, 0, Math.PI * 2);
            this.ctx.arc(cloudX + cloudSize * 0.7, cloudY - cloudSize * 0.3, cloudSize * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * Draw terrain - premium organic ground with depth
     */
    drawTerrain() {
        // Ground gradient for depth
        const groundGradient = this.ctx.createLinearGradient(-1000, this.groundY, -1000, this.canvas.height);
        groundGradient.addColorStop(0, '#3a3a3a');
        groundGradient.addColorStop(0.3, '#2a2a2a');
        groundGradient.addColorStop(1, '#1a1a1a');
        this.ctx.fillStyle = groundGradient;
        
        // Organic curved ground with smooth curves
        this.ctx.beginPath();
        this.ctx.moveTo(-1000, this.groundY);
        
        for (let x = -1000; x < this.canvas.width + 1000; x += 15) {
            const y = this.groundY + Math.sin(x * 0.008) * 4 + Math.cos(x * 0.015) * 2;
            this.ctx.lineTo(x, y);
        }
        
        // Smooth curve to bottom
        this.ctx.lineTo(this.canvas.width + 1000, this.canvas.height);
        this.ctx.lineTo(-1000, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Ground surface highlight
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-1000, this.groundY);
        for (let x = -1000; x < this.canvas.width + 1000; x += 15) {
            const y = this.groundY + Math.sin(x * 0.008) * 4 + Math.cos(x * 0.015) * 2;
            this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
    }
    
}
