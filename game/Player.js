/**
 * Player.js - Controls Willu (the main character)
 * Terraria-quality pixel-art character with proper animations
 */
import { PixelArt } from './PixelArt.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 70;
        
        // Physics
        this.velocityX = 200; // AUTO-RUN - player moves forward automatically
        this.baseVelocityX = 200;
        this.velocityY = 0;
        this.jumpForce = -480;
        this.gravity = 850;
        this.isGrounded = false;
        this.isDead = false;
        this.isSliding = false;
        this.slideDuration = 0;
        this.maxSlideDuration = 0.5;
        
        // State
        this.state = 'running';
        this.stateTime = 0;
        
        // Run cycle animation
        this.runFrame = 0;
        this.runCycleSpeed = 12;
        this.animationTime = 0;
        
        // Weight-based physics
        this.forwardLean = 0;
        this.landingCompression = 0;
        this.recoveryTime = 0;
        
        // Performance tracking
        this.lastActionTime = 0;
        this.hesitationTime = 0;
        this.lastActionWasPerfect = false;
        this.perfectTimingWindow = 0.15;
        this.justJumped = false; // Prevent same-frame double jump
        
        // Visual
        this.trail = [];
        this.maxTrailLength = 8;
        this.pixelArt = null; // Will be initialized in draw
        this.groundY = 550;
    }
    
    update(deltaTime, groundY) {
        this.animationTime += deltaTime;
        this.stateTime += deltaTime;
        this.groundY = groundY;
        
        if (this.isDead) {
            this.velocityX = 0;
            this.velocityY = 0;
            this.state = 'dead';
            return;
        }
        
        this.handleInput();
        this.updatePhysics(deltaTime, groundY);
        
        // Keep auto-running
        this.velocityX = this.baseVelocityX;
        
        this.updateAnimations(deltaTime);
        this.updateTrail(deltaTime);
    }
    
    handleInput() {
        // Jump: Dino Run style - very sensitive, can jump as soon as grounded
        // Check if jump key is pressed AND we're grounded (allows rapid jumping)
        if ((window.gameInstance?.input?.isJumpPressed() || 
             window.gameInstance?.input?.isKeyPressed('Space') || 
             window.gameInstance?.input?.isKeyPressed('ArrowUp')) && 
            this.isGrounded && !this.isSliding && !this.justJumped) {
            this.jump();
            this.justJumped = true; // Prevent same frame double jump
        }
        
        // Reset justJumped flag when not grounded (allows new jump when landing)
        if (!this.isGrounded) {
            this.justJumped = false;
        }
        
        // Slide: Trigger on just pressed
        if (window.gameInstance?.input?.isSlideJustPressed() && this.isGrounded) {
            if (!this.isSliding) {
                this.slide();
            }
        } else if (this.isSliding && !window.gameInstance?.input?.isSlidePressed()) {
            this.isSliding = false;
            this.slideDuration = 0;
        }
    }
    
    jump() {
        const timeSinceLastAction = this.animationTime - this.lastActionTime;
        if (timeSinceLastAction < this.perfectTimingWindow || timeSinceLastAction > 2.0) {
            this.lastActionWasPerfect = true;
        }
        this.velocityY = this.jumpForce;
        this.isGrounded = false;
        this.state = 'jumping';
        this.stateTime = 0;
        this.lastActionTime = this.animationTime;
        this.hesitationTime = 0;
    }
    
    slide() {
        const timeSinceLastAction = this.animationTime - this.lastActionTime;
        if (timeSinceLastAction < this.perfectTimingWindow || timeSinceLastAction > 2.0) {
            this.lastActionWasPerfect = true;
        }
        this.isSliding = true;
        this.slideDuration = 0;
        this.state = 'sliding';
        this.stateTime = 0;
        this.lastActionTime = this.animationTime;
        this.hesitationTime = 0;
    }
    
    updatePhysics(deltaTime, groundY) {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocityY += this.gravity * deltaTime;
        }
        if (this.velocityY > 600) {
            this.velocityY = 600;
        }
        
        // Update position (AUTO-RUN forward)
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        const groundLevel = groundY - this.height / 2;
        if (this.y >= groundLevel) {
            const wasGrounded = this.isGrounded;
            this.y = groundLevel;
            this.velocityY = 0;
            this.isGrounded = true;
            if (!wasGrounded) {
                this.landingCompression = 0.15;
                this.createLandingParticles();
                this.state = 'running';
                this.stateTime = 0;
                this.justJumped = false; // Reset on landing - allows immediate next jump (Dino Run style)
            }
        } else {
            this.isGrounded = false;
        }
        
        if (this.isSliding) {
            this.slideDuration += deltaTime;
            if (this.slideDuration >= this.maxSlideDuration) {
                this.isSliding = false;
                this.slideDuration = 0;
                this.state = 'running';
            }
        }
        
        if (this.isGrounded && !this.isSliding && 
            this.animationTime - this.lastActionTime > 0.5) {
            this.hesitationTime += deltaTime;
        } else {
            this.hesitationTime = 0;
        }
    }
    
    updateAnimations(deltaTime) {
        if (this.landingCompression > 0) {
            this.landingCompression = Math.max(0, this.landingCompression - deltaTime * 3);
        }
        if (this.isGrounded && !this.isSliding && this.state === 'running') {
            this.runFrame = (this.runFrame + deltaTime * this.runCycleSpeed) % 8;
        }
        if (!this.isGrounded) {
            this.state = this.velocityY < 0 ? 'jumping' : 'falling';
        }
    }
    
    createLandingParticles() {
        for (let i = 0; i < 8; i++) {
            this.trail.push({
                x: this.x,
                y: this.groundY,
                vx: (Math.random() - 0.5) * 50,
                vy: -30 - Math.random() * 30,
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.4 + Math.random() * 0.3,
                size: 3 + Math.random() * 4
            });
        }
    }
    
    updateTrail(deltaTime) {
        this.trail = this.trail.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 300 * deltaTime;
            particle.life -= deltaTime;
            return particle.life > 0;
        });
    }
    
    /**
     * Draw the player using PixelArt
     */
    draw(ctx, cameraX) {
        if (!this.pixelArt) {
            this.pixelArt = new PixelArt(ctx);
        }
        const screenX = this.x - cameraX;
        const screenY = this.y - this.height / 2;
        
        // Draw enhanced shadow with blur effect
        const shadowX = screenX + this.width / 2;
        const shadowY = this.groundY;
        const shadowWidth = this.width * 0.6;
        const shadowHeight = this.width * 0.2;
        
        // Outer shadow (softer)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(shadowX, shadowY, shadowWidth * 1.3, shadowHeight * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner shadow (darker)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(shadowX, shadowY, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw character using PixelArt
        const animationFrame = Math.floor(this.animationTime * 12);
        this.pixelArt.drawCharacterSprite(screenX, screenY, this.width, this.height, this.state, animationFrame);
        
        // Draw trail particles
        this.trail.forEach(particle => {
            const particleX = particle.x - cameraX;
            if (particleX > -50 && particleX < ctx.canvas.width + 50) {
                const alpha = particle.life / particle.maxLife;
                ctx.fillStyle = `rgba(150, 150, 150, ${alpha * 0.6})`;
                ctx.beginPath();
                ctx.arc(particleX, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
}
