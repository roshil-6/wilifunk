/**
 * PixelArt.js - Terraria-quality pixel art rendering utilities
 * Provides tile-based drawing, pixel-perfect rendering, and sprite generation
 */

export class PixelArt {
    constructor(ctx) {
        this.ctx = ctx;
        this.tileSize = 16; // Base tile size (16x16 pixels)
        
        // Enable pixel-perfect rendering
        ctx.imageSmoothingEnabled = false;
    }
    
    /**
     * Draw a pixel-perfect rectangle (for tiles)
     */
    drawPixelRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));
    }
    
    /**
     * Draw a tile with pixel-art shading
     */
    drawTile(x, y, tileSize, baseColor, highlightColor, shadowColor) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        const size = Math.floor(tileSize);
        
        // Base tile
        this.ctx.fillStyle = baseColor;
        this.ctx.fillRect(px, py, size, size);
        
        // Top/left highlight (light source from top-left)
        this.ctx.fillStyle = highlightColor;
        this.ctx.fillRect(px, py, size, 2);
        this.ctx.fillRect(px, py, 2, size);
        
        // Bottom/right shadow
        this.ctx.fillStyle = shadowColor;
        this.ctx.fillRect(px, py + size - 2, size, 2);
        this.ctx.fillRect(px + size - 2, py, 2, size);
        
        // Corner highlights
        this.ctx.fillRect(px, py, 1, 1);
        this.ctx.fillRect(px + size - 1, py, 1, 1);
    }
    
    /**
     * Draw dirt/ground tile with variation
     */
    drawDirtTile(x, y, tileSize, variant = 0) {
        const baseColors = [
            '#8B6F47', // Light brown
            '#6B5237', // Medium brown
            '#5C4A37'  // Dark brown
        ];
        const highlight = '#A68B5F';
        const shadow = '#4A3427';
        
        this.drawTile(x, y, tileSize, baseColors[variant % 3], highlight, shadow);
        
        // Add texture spots
        if (Math.random() > 0.7) {
            this.ctx.fillStyle = shadow;
            this.ctx.fillRect(
                Math.floor(x + Math.random() * tileSize * 0.6),
                Math.floor(y + Math.random() * tileSize * 0.6),
                2, 2
            );
        }
    }
    
    /**
     * Draw grass tile (dirt with grass on top)
     */
    drawGrassTile(x, y, tileSize) {
        // Dirt base
        this.drawDirtTile(x, y, tileSize, 0);
        
        // Grass top
        const grassColors = ['#7ED321', '#6CD34F', '#5CB85C'];
        const grassColor = grassColors[Math.floor(Math.random() * grassColors.length)];
        
        this.ctx.fillStyle = grassColor;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(tileSize), 4);
        
        // Grass highlight
        this.ctx.fillStyle = '#A8E063';
        this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(tileSize), 1);
        
        // Small grass tufts
        if (Math.random() > 0.6) {
            this.drawGrassTuft(x + Math.random() * tileSize, y);
        }
    }
    
    /**
     * Draw a small grass tuft
     */
    drawGrassTuft(x, y) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        
        this.ctx.fillStyle = '#5CB85C';
        // 3-4 pixel blades
        for (let i = 0; i < 3; i++) {
            const offset = (i - 1) * 2;
            this.ctx.fillRect(px + offset, py - 2, 1, 2);
            this.ctx.fillRect(px + offset, py - 3, 1, 1);
        }
    }
    
    /**
     * Draw stone/brick tile
     */
    drawStoneTile(x, y, tileSize, variant = 0) {
        const baseColors = ['#7F7F7F', '#6B6B6B', '#5C5C5C'];
        const highlight = '#9F9F9F';
        const shadow = '#4A4A4A';
        
        this.drawTile(x, y, tileSize, baseColors[variant % 3], highlight, shadow);
        
        // Add cracks/texture
        if (variant === 1 && Math.random() > 0.8) {
            this.ctx.strokeStyle = shadow;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(Math.floor(x + tileSize * 0.3), Math.floor(y + tileSize * 0.2));
            this.ctx.lineTo(Math.floor(x + tileSize * 0.7), Math.floor(y + tileSize * 0.8));
            this.ctx.stroke();
        }
    }
    
    /**
     * Draw wood plank tile
     */
    drawWoodTile(x, y, tileSize, horizontal = true) {
        const baseColor = '#8B6F47';
        const highlight = '#A68B5F';
        const shadow = '#6B5237';
        
        this.drawTile(x, y, tileSize, baseColor, highlight, shadow);
        
        // Wood grain lines
        this.ctx.strokeStyle = shadow;
        this.ctx.lineWidth = 1;
        if (horizontal) {
            for (let i = 2; i < tileSize; i += 4) {
                this.ctx.beginPath();
                this.ctx.moveTo(Math.floor(x), Math.floor(y + i));
                this.ctx.lineTo(Math.floor(x + tileSize), Math.floor(y + i));
                this.ctx.stroke();
            }
        } else {
            for (let i = 2; i < tileSize; i += 4) {
                this.ctx.beginPath();
                this.ctx.moveTo(Math.floor(x + i), Math.floor(y));
                this.ctx.lineTo(Math.floor(x + i), Math.floor(y + tileSize));
                this.ctx.stroke();
            }
        }
    }
    
    /**
     * Draw spike (dangerous obstacle)
     */
    drawSpike(x, y, width, height, color = '#8B0000') {
        const px = Math.floor(x);
        const py = Math.floor(y);
        const w = Math.floor(width);
        const h = Math.floor(height);
        
        // Spike triangle
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(px + w / 2, py);
        this.ctx.lineTo(px, py + h);
        this.ctx.lineTo(px + w, py + h);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Highlight edge
        this.ctx.strokeStyle = '#FF4444';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(px + w / 2, py);
        this.ctx.lineTo(px, py + h);
        this.ctx.stroke();
        
        // Shadow edge
        this.ctx.strokeStyle = '#4A0000';
        this.ctx.beginPath();
        this.ctx.moveTo(px + w / 2, py);
        this.ctx.lineTo(px + w, py + h);
        this.ctx.stroke();
    }
    
    /**
     * Draw crumbling platform (broken/worn)
     */
    drawCrumblingPlatform(x, y, width, height) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        const w = Math.floor(width);
        const h = Math.floor(height);
        
        // Base platform (stone)
        this.ctx.fillStyle = '#6B6B6B';
        this.ctx.fillRect(px, py, w, h);
        
        // Top highlight
        this.ctx.fillStyle = '#8B8B8B';
        this.ctx.fillRect(px, py, w, 2);
        
        // Bottom shadow
        this.ctx.fillStyle = '#4A4A4A';
        this.ctx.fillRect(px, py + h - 2, w, 2);
        
        // Cracks and damage
        this.ctx.strokeStyle = '#4A4A4A';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const crackX = px + Math.random() * w;
            this.ctx.beginPath();
            this.ctx.moveTo(crackX, py);
            this.ctx.lineTo(crackX + (Math.random() - 0.5) * 10, py + h);
            this.ctx.stroke();
        }
        
        // Missing chunks
        if (Math.random() > 0.7) {
            const chunkX = px + Math.random() * (w - 8);
            const chunkY = py + Math.random() * (h - 4);
            this.ctx.fillStyle = '#4A4A4A';
            this.ctx.fillRect(chunkX, chunkY, 4, 2);
        }
    }
    
    /**
     * Draw narrow ledge
     */
    drawLedge(x, y, width) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        const w = Math.floor(width);
        const h = 8;
        
        // Stone ledge
        this.drawStoneTile(px, py, w, 0);
        
        // Top edge highlight
        this.ctx.fillStyle = '#9F9F9F';
        this.ctx.fillRect(px, py, w, 1);
        
        // Bottom shadow
        this.ctx.fillStyle = '#4A4A4A';
        this.ctx.fillRect(px, py + h - 1, w, 1);
    }
    
    /**
     * Draw broken bridge segment
     */
    drawBrokenBridge(x, y, width, broken = false) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        const w = Math.floor(width);
        const h = 12;
        
        if (broken) {
            // Draw only partial bridge
            this.drawWoodTile(px, py, w * 0.6, true);
            // Gap
            this.ctx.fillStyle = '#4A4A4A';
            this.ctx.fillRect(px + w * 0.6, py, w * 0.4, h);
        } else {
            // Full bridge
            this.drawWoodTile(px, py, w, true);
        }
        
        // Rope/chain supports (if needed)
        this.ctx.strokeStyle = '#5C5C5C';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(px, py + h);
        this.ctx.lineTo(px, py + h + 20);
        this.ctx.moveTo(px + w, py + h);
        this.ctx.lineTo(px + w, py + h + 20);
        this.ctx.stroke();
    }
    
    /**
     * Draw pixel-art character sprite (simplified runner)
     */
    drawCharacterSprite(x, y, width, height, state, animationFrame) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        const w = Math.floor(width);
        const h = Math.floor(height);
        
        // Character colors
        const skinColor = '#FFDBAC';
        const shirtColor = '#4A90E2';
        const pantsColor = '#2E5C8A';
        const shoeColor = '#1A1A1A';
        const hairColor = '#3D2817';

        const run = state === 'running';
        const jumping = state === 'jumping';
        const falling = state === 'falling';
        const phase = ((animationFrame % 10) + 10) % 10; // stable 0..9
        const bob = run ? (phase === 2 || phase === 7 ? 1 : 0) : 0;
        const blink = run && (animationFrame % 70 === 0 || animationFrame % 70 === 1); // short blink
        
        // HEAD
        this.ctx.fillStyle = skinColor;
        this.ctx.fillRect(px + w * 0.3, py + bob, w * 0.4, h * 0.2);
        
        // Hair
        this.ctx.fillStyle = hairColor;
        this.ctx.fillRect(px + w * 0.25, py + bob, w * 0.5, h * 0.15);
        
        // Eyes (blink)
        this.ctx.fillStyle = '#000000';
        if (blink) {
            this.ctx.fillRect(px + w * 0.34, py + bob + h * 0.095, 4, 1);
            this.ctx.fillRect(px + w * 0.54, py + bob + h * 0.095, 4, 1);
        } else {
            this.ctx.fillRect(px + w * 0.35, py + bob + h * 0.085, 2, 2);
            this.ctx.fillRect(px + w * 0.55, py + bob + h * 0.085, 2, 2);
        }

        // Mouth (tiny line - makes character feel alive)
        this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
        this.ctx.fillRect(px + w * 0.44, py + bob + h * 0.14, 4, 1);
        
        // TORSO (shirt)
        this.ctx.fillStyle = shirtColor;
        this.ctx.fillRect(px + w * 0.25, py + bob + h * 0.2, w * 0.5, h * 0.3);

        // Shirt highlight + shadow
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        this.ctx.fillRect(px + w * 0.28, py + bob + h * 0.22, w * 0.16, h * 0.26);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
        this.ctx.fillRect(px + w * 0.58, py + bob + h * 0.2, w * 0.15, h * 0.3);
        
        // ARMS (animated based on state)
        const armOffset = run ? (phase < 5 ? (phase - 2) : (7 - phase)) * 2 : 0;
        this.ctx.fillStyle = skinColor;
        // Jump pose: arms slightly up
        const armBaseY = jumping ? (h * 0.22) : (falling ? (h * 0.24) : (h * 0.25));
        // Left arm swings opposite
        this.ctx.fillRect(px + w * 0.15, py + bob + armBaseY - armOffset, w * 0.12, h * 0.2);
        // Right arm
        this.ctx.fillRect(px + w * 0.73, py + bob + armBaseY + armOffset, w * 0.12, h * 0.2);
        
        // LEGS (animated for running)
        this.ctx.fillStyle = pantsColor;
        const legOffsetA = run ? (phase < 5 ? (phase - 2) : (7 - phase)) * 2 : 0;
        const legOffsetB = run ? -legOffsetA : 0;
        const legBaseY = jumping ? (h * 0.52) : (falling ? (h * 0.54) : (h * 0.5));
        // Left leg
        this.ctx.fillRect(px + w * 0.30, py + bob + legBaseY + legOffsetA, w * 0.2, h * 0.3);
        // Right leg
        this.ctx.fillRect(px + w * 0.50, py + bob + legBaseY + legOffsetB, w * 0.2, h * 0.3);
        
        // FEET (shoes)
        this.ctx.fillStyle = shoeColor;
        this.ctx.fillRect(px + w * 0.30, py + bob + h * 0.82 + legOffsetA, w * 0.2, h * 0.13);
        this.ctx.fillRect(px + w * 0.50, py + bob + h * 0.82 + legOffsetB, w * 0.2, h * 0.13);
    }
}
