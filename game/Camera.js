/**
 * Camera.js - Cinematic camera system
 * Wide framing, smooth follow, dynamic zoom based on momentum
 */

export class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Position
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        // Zoom
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        
        // Follow settings
        this.followLag = 0.1; // Camera lag (sells speed)
        this.followOffsetX = 300; // Player offset from left edge
        this.followOffsetY = canvasHeight / 2;
        
        // Dynamic zoom based on momentum
        this.baseZoom = 0.8; // Wide framing
        this.zoomRange = 0.3; // Zoom variation
        
        // Screen shake
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        
        // Momentum-based adjustments
        this.momentumZoomFactor = 1.0;
        this.momentumPullback = 0; // Pull back at higher momentum
    }
    
    /**
     * Update camera position and zoom
     */
    update(deltaTime, playerX, playerY, hunterX, momentum, gameSpeed) {
        // Calculate target position (follow player with lag)
        this.targetX = playerX - this.followOffsetX;
        this.targetY = playerY - this.followOffsetY;
        
        // Momentum-based camera adjustments
        // At high momentum: pull back (wider view)
        // At low momentum: tighten (closer, more tension)
        this.momentumPullback = momentum * 100; // 0 to 100 units
        this.targetX -= this.momentumPullback;
        
        // When hunter is close, tighten camera slightly
        const hunterDistance = playerX - hunterX;
        if (hunterDistance < 200) {
            this.targetX += (200 - hunterDistance) * 0.3; // Pull camera forward
        }
        
        // Smooth follow (lag-based)
        const lagFactor = 1.0 - Math.pow(1.0 - this.followLag, deltaTime * 60);
        this.x += (this.targetX - this.x) * lagFactor;
        this.y += (this.targetY - this.y) * lagFactor;
        
        // Dynamic zoom based on momentum and speed
        // High momentum = wider view (pull back)
        // Low momentum = tighter view (more tension)
        const momentumZoom = 1.0 - (momentum * 0.15); // 1.0 to 0.85
        const speedZoom = Math.min(1.1, 1.0 + (gameSpeed / 1000)); // Slight zoom at high speed
        this.targetZoom = this.baseZoom * momentumZoom * speedZoom;
        
        // Smooth zoom
        this.zoom += (this.targetZoom - this.zoom) * 0.1;
        
        // Update screen shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaTime;
            const intensity = this.shakeIntensity * (this.shakeDuration / this.shakeDuration);
            this.shakeX = (Math.random() - 0.5) * intensity;
            this.shakeY = (Math.random() - 0.5) * intensity;
            
            if (this.shakeDuration <= 0) {
                this.shakeX = 0;
                this.shakeY = 0;
                this.shakeIntensity = 0;
            }
        }
    }
    
    /**
     * Add screen shake effect
     */
    addShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }
    
    /**
     * Apply camera transform to context
     */
    applyTransform(ctx) {
        ctx.save();
        
        // Apply zoom (centered)
        const zoomX = this.canvasWidth / 2;
        const zoomY = this.canvasHeight / 2;
        ctx.translate(zoomX, zoomY);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-zoomX, -zoomY);
        
        // Apply position offset (inverse - camera moves left, world moves right)
        ctx.translate(-this.x + this.shakeX, -this.y + this.shakeY);
    }
    
    /**
     * Get camera bounds (for culling)
     */
    getBounds() {
        const viewWidth = this.canvasWidth / this.zoom;
        const viewHeight = this.canvasHeight / this.zoom;
        
        return {
            left: this.x - 200, // Extra margin for culling
            right: this.x + viewWidth + 200,
            top: this.y - 200,
            bottom: this.y + viewHeight + 200
        };
    }
}
