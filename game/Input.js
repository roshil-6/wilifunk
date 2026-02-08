/**
 * Input.js - Handles keyboard and touch input
 * Responsive jump and slide controls with continuous touch support
 */

export class Input {
    constructor() {
        this.keys = {};
        this.jumpPressed = false;
        this.jumpJustPressed = false;
        this.slidePressed = false;
        this.slideJustPressed = false;
        
        // Touch state
        this.touchActive = false;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Jump (Space or Arrow Up)
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                if (e.cancelable) e.preventDefault();
                if (!this.jumpPressed) {
                    this.jumpJustPressed = true;
                }
                this.jumpPressed = true;
            }
            
            // Slide (Arrow Down or S)
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                if (e.cancelable) e.preventDefault();
                if (!this.slidePressed) {
                    this.slideJustPressed = true;
                }
                this.slidePressed = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                this.jumpPressed = false;
            }
            
            if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.slidePressed = false;
            }
        });
        
        // Touch events - Continuous touch for higher jumps
        window.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault();
            const touch = e.touches[0];
            this.touchStartY = touch.clientY;
            this.touchStartTime = Date.now();
            this.touchActive = true;
            
            // Start jump on touch
            if (!this.jumpPressed) {
                this.jumpJustPressed = true;
            }
            this.jumpPressed = true;
        });
        
        window.addEventListener('touchmove', (e) => {
            if (e.cancelable) e.preventDefault();
            if (!this.touchActive) return;
            
            const touch = e.touches[0];
            const deltaY = touch.clientY - this.touchStartY;
            const deltaTime = Date.now() - this.touchStartTime;
            
            // If swiping down quickly, trigger slide instead
            if (deltaY > 30 && deltaTime < 200) {
                this.jumpPressed = false;
                if (!this.slidePressed) {
                    this.slideJustPressed = true;
                }
                this.slidePressed = true;
                this.touchActive = false;
            }
        });
        
        window.addEventListener('touchend', (e) => {
            if (e.cancelable) e.preventDefault();
            this.jumpPressed = false;
            this.slidePressed = false;
            this.touchActive = false;
        });
        
        // Mouse click (for desktop testing)
        window.addEventListener('mousedown', (e) => {
            // Left click = jump (hold for higher)
            if (e.button === 0) {
                if (!this.jumpPressed) {
                    this.jumpJustPressed = true;
                }
                this.jumpPressed = true;
            }
            // Right click = slide
            else if (e.button === 2) {
                if (e.cancelable) e.preventDefault();
                if (!this.slidePressed) {
                    this.slideJustPressed = true;
                }
                this.slidePressed = true;
            }
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.jumpPressed = false;
            } else if (e.button === 2) {
                this.slidePressed = false;
            }
        });
        
        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    /**
     * Check if jump was just pressed (one-time trigger)
     */
    isJumpJustPressed() {
        if (this.jumpJustPressed) {
            this.jumpJustPressed = false;
            return true;
        }
        return false;
    }
    
    /**
     * Check if jump is currently held (for continuous jump)
     */
    isJumpPressed() {
        return this.jumpPressed;
    }
    
    /**
     * Check if slide was just pressed (one-time trigger)
     */
    isSlideJustPressed() {
        if (this.slideJustPressed) {
            this.slideJustPressed = false;
            return true;
        }
        return false;
    }
    
    /**
     * Check if slide is currently held
     */
    isSlidePressed() {
        return this.slidePressed;
    }
    
    /**
     * Check if a key is currently pressed
     */
    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }
    
    /**
     * Update input state (called each frame)
     */
    update() {
        // Don't auto-reset - let the getters handle it
        // This ensures responsive input
    }
}
