class Track {
    constructor(scene, trackKey) {
        this.scene = scene;
        
        // Scale original track config (referenced to 1200x800) dynamically to fit current GAME_WIDTH and GAME_HEIGHT
        const original = TRACKS_DATA[trackKey];
        const scaleX = GAME_WIDTH / 1200;
        const scaleY = GAME_HEIGHT / 800;
        const avgScale = (scaleX + scaleY) / 2;

        this.config = {
            name: original.name,
            laps: original.laps,
            trackWidth: original.trackWidth * avgScale,
            centerline: original.centerline.map(p => ({ x: p.x * scaleX, y: p.y * scaleY })),
            gravelZones: original.gravelZones.map(zone => zone.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }))),
            decorations: {
                trees: original.decorations.trees.map(t => ({ x: t.x * scaleX, y: t.y * scaleY })),
                tires: original.decorations.tires.map(t => ({ x: t.x * scaleX, y: t.y * scaleY })),
                stands: original.decorations.stands.map(s => ({
                    points: s.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY })),
                    density: s.density,
                    direction: s.direction
                }))
            }
        };

        // 1. Generate spline curve from scaled centerline
        const pts = this.config.centerline.map(p => new Phaser.Math.Vector2(p.x, p.y));
        pts.push(new Phaser.Math.Vector2(this.config.centerline[0].x, this.config.centerline[0].y));
        
        this.spline = new Phaser.Curves.Spline(pts);
        
        // Generate high resolution path for AI tracking and player completion calculations
        this.waypoints = this.spline.getPoints(360);
        
        // Create graphics layer
        this.graphics = scene.add.graphics();
        
        // Pre-create collision canvas
        this.createCollisionMap();
    }

    createCollisionMap() {
        // Build an in-memory canvas for instant pixel querying
        this.collisionCanvas = document.createElement('canvas');
        this.collisionCanvas.width = GAME_WIDTH;
        this.collisionCanvas.height = GAME_HEIGHT;
        const ctx = this.collisionCanvas.getContext('2d');
        
        // Fill canvas with black (off-track grass)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw gravel traps in Blue (#0000FF)
        ctx.fillStyle = '#0000ff';
        this.config.gravelZones.forEach(zone => {
            ctx.beginPath();
            ctx.moveTo(zone[0].x, zone[0].y);
            for (let i = 1; i < zone.length; i++) {
                ctx.lineTo(zone[i].x, zone[i].y);
            }
            ctx.closePath();
            ctx.fill();
        });

        // Draw track in White (#FFFFFF)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = this.config.trackWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.config.centerline[0].x, this.config.centerline[0].y);
        for (let i = 1; i < this.config.centerline.length; i++) {
            ctx.lineTo(this.config.centerline[i].x, this.config.centerline[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Capture pixel buffer to CPU array for O(1) checks
        this.collisionImgData = ctx.getImageData(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.collisionPixels = this.collisionImgData.data;
    }

    getSurface(x, y) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        
        // Bounds checking
        if (px < 0 || px >= GAME_WIDTH || py < 0 || py >= GAME_HEIGHT) {
            return { onTrack: false, onGravel: false };
        }

        const idx = (py * GAME_WIDTH + px) * 4;
        const r = this.collisionPixels[idx];
        const g = this.collisionPixels[idx + 1];
        const b = this.collisionPixels[idx + 2];

        // White pixel (255, 255, 255) means Track
        if (r > 200 && g > 200 && b > 200) {
            return { onTrack: true, onGravel: false };
        }
        // Blue pixel (0, 0, 255) means Gravel Trap
        if (b > 200 && r < 50 && g < 50) {
            return { onTrack: false, onGravel: true };
        }
        
        // Black pixel is Grass
        return { onTrack: false, onGravel: false };
    }

    draw() {
        this.graphics.clear();

        // 1. Draw Grass Background
        this.graphics.fillStyle(0x16a34a); // curate flat green
        this.graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw track outline (blue borders)
        this.graphics.lineStyle(this.config.trackWidth + 8, 0x1d4ed8); // thick blue line
        this.graphics.lineCap = 'round';
        this.graphics.lineJoin = 'round';
        
        // Draw blue track outline
        this.drawSplineCurve(this.graphics);

        // Draw track asphalt (dark slate gray)
        this.graphics.lineStyle(this.config.trackWidth, 0x4b5563); // asphalt color
        this.drawSplineCurve(this.graphics);

        // 2. Draw Gravel Traps (Beige with speckled pattern)
        this.config.gravelZones.forEach(zone => {
            this.graphics.fillStyle(0xc29b62); // Flat gravel color
            this.graphics.beginPath();
            this.graphics.moveTo(zone[0].x, zone[0].y);
            for (let i = 1; i < zone.length; i++) {
                this.graphics.lineTo(zone[i].x, zone[i].y);
            }
            this.graphics.closePath();
            this.graphics.fill();

            // Procedural specs for retro sand texture (flat brown dots)
            this.graphics.fillStyle(0x8a6d43);
            const minX = Math.min(...zone.map(p => p.x));
            const maxX = Math.max(...zone.map(p => p.x));
            const minY = Math.min(...zone.map(p => p.y));
            const maxY = Math.max(...zone.map(p => p.y));

            for (let d = 0; d < 300; d++) {
                const sx = Phaser.Math.Between(minX, maxX);
                const sy = Phaser.Math.Between(minY, maxY);
                
                // Only draw dot if it lies inside the polygon zone
                if (this.isPointInPolygon({ x: sx, y: sy }, zone)) {
                    this.graphics.fillRect(sx, sy, 2, 2);
                }
            }
        });

        // 3. Draw Rumble Strips (Red-and-white blocks along spline edge)
        const rumbleDensity = 240; // total blocks
        const w = this.config.trackWidth;
        
        for (let i = 0; i < rumbleDensity; i++) {
            const t = i / rumbleDensity;
            const pt = this.spline.getPoint(t);
            const tangent = this.spline.getTangent(t);
            
            // Perpendicular vector
            const nx = -tangent.y;
            const ny = tangent.x;
            const angle = Math.atan2(tangent.y, tangent.x);

            // Left boundary strip coords
            const lx = pt.x + nx * (w / 2 + 3);
            const ly = pt.y + ny * (w / 2 + 3);
            
            // Right boundary strip coords
            const rx = pt.x - nx * (w / 2 + 3);
            const ry = pt.y - ny * (w / 2 + 3);

            const isRed = (Math.floor(i / 2) % 2 === 0);
            const color = isRed ? 0xef4444 : 0xffffff;

            this.drawRumbleBlock(lx, ly, angle, color);
            this.drawRumbleBlock(rx, ry, angle, color);
        }

        // 4. Draw Checkered Start/Finish Line
        this.drawCheckeredFinishLine();

        // 5. Draw Decorations (Spectator stands, trees, tires)
        this.drawDecorations();
    }

    drawSplineCurve(graphics) {
        graphics.beginPath();
        const start = this.config.centerline[0];
        graphics.moveTo(start.x, start.y);
        for (let i = 1; i < this.config.centerline.length; i++) {
            const pt = this.config.centerline[i];
            graphics.lineTo(pt.x, pt.y);
        }
        graphics.closePath();
        graphics.strokePath();
    }

    drawRumbleBlock(x, y, angle, color) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const hw = 6;  // half width
        const hh = 2;  // half height
        
        const x1 = x - hw * cos + hh * sin;
        const y1 = y - hw * sin - hh * cos;
        
        const x2 = x + hw * cos + hh * sin;
        const y2 = y + hw * sin - hh * cos;
        
        const x3 = x + hw * cos - hh * sin;
        const y3 = y + hw * sin + hh * cos;
        
        const x4 = x - hw * cos - hh * sin;
        const y4 = y - hw * sin + hh * cos;
        
        const points = [
            new Phaser.Math.Vector2(x1, y1),
            new Phaser.Math.Vector2(x2, y2),
            new Phaser.Math.Vector2(x3, y3),
            new Phaser.Math.Vector2(x4, y4)
        ];
        
        this.graphics.fillStyle(color);
        this.graphics.fillPoints(points, true);
        this.graphics.lineStyle(1, 0x000000);
        this.graphics.strokePoints(points, true);
    }

    drawCheckeredFinishLine() {
        const startPt = this.config.centerline[0];
        const nextPt = this.config.centerline[1];
        const tangent = new Phaser.Math.Vector2(nextPt.x - startPt.x, nextPt.y - startPt.y).normalize();
        const nx = -tangent.y;
        const ny = tangent.x;

        const w = this.config.trackWidth;
        const rows = 12;
        const boxHeight = w / rows;

        // 1. Draw white background band
        const corners = [
            new Phaser.Math.Vector2(startPt.x - 4 * tangent.x - (w / 2) * nx, startPt.y - 4 * tangent.y - (w / 2) * ny),
            new Phaser.Math.Vector2(startPt.x + 4 * tangent.x - (w / 2) * nx, startPt.y + 4 * tangent.y - (w / 2) * ny),
            new Phaser.Math.Vector2(startPt.x + 4 * tangent.x + (w / 2) * nx, startPt.y + 4 * tangent.y + (w / 2) * ny),
            new Phaser.Math.Vector2(startPt.x - 4 * tangent.x + (w / 2) * nx, startPt.y - 4 * tangent.y + (w / 2) * ny)
        ];

        this.graphics.fillStyle(0xffffff);
        this.graphics.fillPoints(corners, true);
        this.graphics.lineStyle(1.5, 0x000000);
        this.graphics.strokePoints(corners, true);

        // 2. Draw black squares (alternating boxes)
        this.graphics.fillStyle(0x000000);
        for (let r = 0; r < rows; r++) {
            const y1 = -w / 2 + r * boxHeight;
            const y2 = y1 + boxHeight;

            // Row alternates: either left column is black or right column is black
            const x1 = (r % 2 === 0) ? -4 : 0;
            const x2 = x1 + 4;

            const boxCorners = [
                new Phaser.Math.Vector2(startPt.x + x1 * tangent.x + y1 * nx, startPt.y + x1 * tangent.y + y1 * ny),
                new Phaser.Math.Vector2(startPt.x + x2 * tangent.x + y1 * nx, startPt.y + x2 * tangent.y + y1 * ny),
                new Phaser.Math.Vector2(startPt.x + x2 * tangent.x + y2 * nx, startPt.y + x2 * tangent.y + y2 * ny),
                new Phaser.Math.Vector2(startPt.x + x1 * tangent.x + y2 * nx, startPt.y + x1 * tangent.y + y2 * ny)
            ];

            this.graphics.fillPoints(boxCorners, true);
        }
    }

    drawDecorations() {
        // Draw stands
        this.config.decorations.stands.forEach(stand => {
            this.graphics.fillStyle(0x6b7280); // Gray stands base
            this.graphics.lineStyle(2, 0x111115);
            
            this.graphics.beginPath();
            this.graphics.moveTo(stand.points[0].x, stand.points[0].y);
            for (let i = 1; i < stand.points.length; i++) {
                this.graphics.lineTo(stand.points[i].x, stand.points[i].y);
            }
            this.graphics.closePath();
            this.graphics.fill();
            this.graphics.stroke();

            // Draw steps inside stand (lines along the long edge)
            this.graphics.lineStyle(1.5, 0x374151);
            const steps = 4;
            for (let s = 1; s < steps; s++) {
                const lerpStart = Phaser.Math.Interpolation.Linear([stand.points[0].x, stand.points[3].x], s / steps);
                const lerpStartValY = Phaser.Math.Interpolation.Linear([stand.points[0].y, stand.points[3].y], s / steps);
                const lerpEnd = Phaser.Math.Interpolation.Linear([stand.points[1].x, stand.points[2].x], s / steps);
                const lerpEndValY = Phaser.Math.Interpolation.Linear([stand.points[1].y, stand.points[2].y], s / steps);
                
                this.graphics.lineBetween(lerpStart, lerpStartValY, lerpEnd, lerpEndValY);
            }

            // Scatter spectators (small colored dots)
            const minX = Math.min(...stand.points.map(p => p.x));
            const maxX = Math.max(...stand.points.map(p => p.x));
            const minY = Math.min(...stand.points.map(p => p.y));
            const maxY = Math.max(...stand.points.map(p => p.y));

            const colors = [0xef4444, 0x3b82f6, 0xeab308, 0xffffff, 0x111111];
            for (let sp = 0; sp < stand.density; sp++) {
                const sx = Phaser.Math.Between(minX, maxX);
                const sy = Phaser.Math.Between(minY, maxY);

                if (this.isPointInPolygon({ x: sx, y: sy }, stand.points)) {
                    this.graphics.fillStyle(Phaser.Utils.Array.GetRandom(colors));
                    this.graphics.fillCircle(sx, sy, 2.5);
                }
            }
        });

        // Draw tires (Barrier concentric rings)
        this.config.decorations.tires.forEach(tire => {
            this.graphics.fillStyle(0x1e2937); // Dark gray tire color
            this.graphics.lineStyle(1.5, 0x000000);
            this.graphics.fillCircle(tire.x, tire.y, 9);
            this.graphics.strokeCircle(tire.x, tire.y, 9);
            
            // Inner hollow core
            this.graphics.fillStyle(0x0f172a);
            this.graphics.fillCircle(tire.x, tire.y, 5);
            this.graphics.strokeCircle(tire.x, tire.y, 5);
        });

        // Draw trees (Concentric volumetric green rings)
        this.config.decorations.trees.forEach(tree => {
            // Outer layer
            this.graphics.fillStyle(0x14532d); // Dark pine green
            this.graphics.lineStyle(1.5, 0x000000);
            this.graphics.fillCircle(tree.x, tree.y, 22);
            this.graphics.strokeCircle(tree.x, tree.y, 22);
            
            // Middle layer
            this.graphics.fillStyle(0x16a34a); // Mid green
            this.graphics.fillCircle(tree.x, tree.y, 16);
            this.graphics.strokeCircle(tree.x, tree.y, 16);

            // Inner core
            this.graphics.fillStyle(0x4ade80); // Bright green crown
            this.graphics.fillCircle(tree.x, tree.y, 9);
            this.graphics.strokeCircle(tree.x, tree.y, 9);
        });
    }

    // Helper: Jordan Curve Theorem Ray Casting algorithm for polygon boundary checks
    isPointInPolygon(point, polygon) {
        const x = point.x, y = point.y;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
}
