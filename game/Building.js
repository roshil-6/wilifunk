/**
 * Building.js - The building where girlfriend falls from
 * End of level structure
 */

export class Building {
    constructor(x, groundY) {
        this.x = x;
        this.groundY = groundY;
        this.width = 100;
        this.height = 400;
        this.windowWidth = 20;
        this.windowHeight = 25;
        this.windowSpacing = 30;
    }
    
    /**
     * Draw building on canvas - Professional Mario Run Style
     */
    draw(ctx, cameraX) {
        const screenX = this.x - cameraX;
        const buildingTop = this.groundY - this.height;
        
        ctx.save();
        
        // Building shadow with better depth
        const shadowGradient = ctx.createLinearGradient(
            screenX + this.width, buildingTop,
            screenX + this.width + 30, this.groundY
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.fillRect(screenX + this.width, buildingTop, 30, this.height);
        
        // Main building structure - Standard brick building
        const buildingGradient = ctx.createLinearGradient(
            screenX, buildingTop,
            screenX + this.width, this.groundY
        );
        buildingGradient.addColorStop(0, '#D2691E'); // Chocolate
        buildingGradient.addColorStop(0.3, '#CD853F'); // Peru
        buildingGradient.addColorStop(0.7, '#8B4513'); // Saddle brown
        buildingGradient.addColorStop(1, '#654321'); // Dark brown
        ctx.fillStyle = buildingGradient;
        ctx.fillRect(screenX, buildingTop, this.width, this.height);
        
        // Brick pattern
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        const brickHeight = 20;
        const brickWidth = 40;
        for (let y = buildingTop; y < this.groundY; y += brickHeight) {
            const offset = (Math.floor((y - buildingTop) / brickHeight) % 2) * (brickWidth / 2);
            for (let x = screenX + offset; x < screenX + this.width; x += brickWidth) {
                ctx.strokeRect(x, y, brickWidth, brickHeight);
            }
        }
        
        // Building outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(screenX, buildingTop, this.width, this.height);
        
        // Windows (more detailed)
        const windowRows = Math.floor(this.height / this.windowSpacing);
        for (let row = 0; row < windowRows; row++) {
            const windowY = buildingTop + (row * this.windowSpacing) + 10;
            
            // Left window
            const leftWindowX = screenX + 15;
            this.drawWindow(ctx, leftWindowX, windowY);
            
            // Right window
            const rightWindowX = screenX + this.width - 35;
            this.drawWindow(ctx, rightWindowX, windowY);
        }
        
        // Top of building (where girlfriend falls from) - more detailed
        const roofGradient = ctx.createLinearGradient(
            screenX, buildingTop,
            screenX + this.width, buildingTop - 15
        );
        roofGradient.addColorStop(0, '#E74C3C');
        roofGradient.addColorStop(0.5, '#C0392B');
        roofGradient.addColorStop(1, '#A93226');
        ctx.fillStyle = roofGradient;
        ctx.strokeStyle = '#922B21';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX, buildingTop);
        ctx.lineTo(screenX + this.width / 2, buildingTop - 15);
        ctx.lineTo(screenX + this.width, buildingTop);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Roof highlight
        ctx.strokeStyle = '#EC7063';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(screenX + 5, buildingTop);
        ctx.lineTo(screenX + this.width / 2, buildingTop - 12);
        ctx.lineTo(screenX + this.width - 5, buildingTop);
        ctx.stroke();
        
        // Win zone indicator (ground level at building) - more visible
        ctx.strokeStyle = '#27AE60';
        ctx.lineWidth = 5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#27AE60';
        ctx.beginPath();
        ctx.moveTo(screenX - 10, this.groundY);
        ctx.lineTo(screenX + this.width + 10, this.groundY);
        ctx.stroke();
        
        // Win zone glow
        ctx.strokeStyle = '#2ECC71';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#2ECC71';
        ctx.beginPath();
        ctx.moveTo(screenX - 8, this.groundY - 2);
        ctx.lineTo(screenX + this.width + 8, this.groundY - 2);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    
    /**
     * Draw a window - Professional Design
     */
    drawWindow(ctx, x, y) {
        // Window frame (dark)
        ctx.fillStyle = '#1A252F';
        ctx.strokeStyle = '#34495E';
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, this.windowWidth, this.windowHeight);
        ctx.strokeRect(x, y, this.windowWidth, this.windowHeight);
        
        // Window light (warm yellow/orange)
        const lightGradient = ctx.createLinearGradient(x, y, x, y + this.windowHeight);
        lightGradient.addColorStop(0, '#F39C12');
        lightGradient.addColorStop(0.5, '#E67E22');
        lightGradient.addColorStop(1, '#D35400');
        ctx.fillStyle = lightGradient;
        ctx.fillRect(x + 3, y + 3, this.windowWidth - 6, this.windowHeight - 6);
        
        // Window cross (frame)
        ctx.strokeStyle = '#1A252F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + this.windowWidth / 2, y + 2);
        ctx.lineTo(x + this.windowWidth / 2, y + this.windowHeight - 2);
        ctx.moveTo(x + 2, y + this.windowHeight / 2);
        ctx.lineTo(x + this.windowWidth - 2, y + this.windowHeight / 2);
        ctx.stroke();
        
        // Window highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 1, y + 1);
        ctx.lineTo(x + this.windowWidth - 1, y + 1);
        ctx.lineTo(x + this.windowWidth - 1, y + 3);
        ctx.stroke();
    }
    
    /**
     * Get the X position where player should reach to win
     */
    getWinZoneX() {
        return this.x;
    }
}
