const PUZZLES = [
    {
        size: 5,
        grid: [
            [1, 1, 1, 1, 1],
            [2, 2, 2, 2, 1],
            [2, 3, 3, 2, 1],
            [2, 3, 4, 2, 1],
            [2, 3, 4, 2, 1]
        ]
    },
    {
        size: 5,
        grid: [
            [1, 1, 2, 2, 3],
            [4, 1, 5, 2, 3],
            [4, 1, 5, 2, 3],
            [4, 1, 5, 2, 3],
            [4, 1, 1, 1, 3]
        ]
    },
    {
        size: 6,
        grid: [
            [1, 1, 1, 2, 2, 2],
            [1, 3, 1, 4, 5, 2],
            [1, 3, 1, 4, 5, 2],
            [1, 3, 1, 4, 5, 2],
            [1, 3, 1, 4, 5, 2],
            [1, 3, 3, 4, 5, 2]
        ]
    },
    {
        size: 6,
        grid: [
            [1, 1, 1, 1, 1, 1],
            [2, 2, 2, 2, 2, 1],
            [3, 3, 3, 3, 2, 1],
            [4, 4, 4, 3, 2, 1],
            [6, 5, 4, 3, 2, 1],
            [6, 5, 4, 3, 2, 1]
        ]
    },
    {
        size: 7,
        grid: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 2, 2, 2, 2, 2, 2],
            [1, 2, 3, 3, 3, 3, 3],
            [1, 2, 3, 4, 4, 4, 3],
            [1, 2, 3, 4, 5, 4, 3],
            [1, 2, 3, 4, 5, 4, 3],
            [1, 2, 3, 4, 5, 5, 3]
        ]
    }
];

const COLORS = {
    1: 0x00ffff, 
    2: 0xff00ff, 
    3: 0xffff00, 
    4: 0x00ff00, 
    5: 0xff8800, 
    6: 0xff0000  
};

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.level = data.level || 0;
        this.hints = 3;
        this.won = false;
        this.activeColor = null;
    }

    create() {
        this.drawBackground();

        this.puzzleDef = PUZZLES[this.level];
        this.size = this.puzzleDef.size;
        this.cellSize = Math.floor(360 / this.size);
        this.gridX = (400 - this.cellSize * this.size) / 2;
        this.gridY = 160;

        const parsed = this.parsePuzzle(this.puzzleDef);
        this.nodes = parsed.nodes;
        this.solutionPaths = parsed.paths;
        this.paths = {}; 

        this.gridGraphics = this.add.graphics();
        this.pathGraphics = this.add.graphics();
        this.nodesGroup = this.add.group();

        this.drawGrid();
        this.createNodes();

        this.setupInput();
        this.setupUI();

        this.startTime = this.time.now;
        
        if (!this.textures.exists('particle')) {
            const gfx = this.make.graphics({x:0, y:0, add:false});
            gfx.fillStyle(0xffffff);
            gfx.fillCircle(4, 4, 4);
            gfx.generateTexture('particle', 8, 8);
        }
    }

    drawBackground() {
        const bg = this.add.graphics();
        bg.fillStyle(0x050510, 1);
        bg.fillRect(0, 0, 400, 700);
        
        bg.lineStyle(1, 0x112233, 0.5);
        for(let i=0; i<400; i+=20) {
            bg.moveTo(i, 0); bg.lineTo(i, 700);
        }
        for(let i=0; i<700; i+=20) {
            bg.moveTo(0, i); bg.lineTo(400, i);
        }
        bg.strokePath();
    }

    parsePuzzle(puzzle) {
        const grid = puzzle.grid;
        const size = puzzle.size;
        const nodes = [];
        const paths = {};

        const getNeighbors = (r, c, val) => {
            const n = [];
            if (r > 0 && grid[r-1][c] === val) n.push({r:r-1, c});
            if (r < size-1 && grid[r+1][c] === val) n.push({r:r+1, c});
            if (c > 0 && grid[r][c-1] === val) n.push({r, c:c-1});
            if (c < size-1 && grid[r][c+1] === val) n.push({r, c:c+1});
            return n;
        };

        const uniqueVals = new Set();
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] !== 0) uniqueVals.add(grid[r][c]);
            }
        }

        uniqueVals.forEach(val => {
            const ends = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === val) {
                        if (getNeighbors(r, c, val).length === 1) {
                            ends.push({r, c});
                        }
                    }
                }
            }
            nodes.push({
                id: val,
                color: COLORS[val],
                points: ends 
            });
            
            let curr = ends[0];
            let prev = null;
            let path = [curr];
            while (true) {
                let nexts = getNeighbors(curr.r, curr.c, val);
                let next = nexts.find(n => !prev || (n.r !== prev.r || n.c !== prev.c));
                if (!next) break;
                path.push(next);
                prev = curr;
                curr = next;
            }
            paths[val] = path;
        });

        return { nodes, paths };
    }

    drawGrid() {
        this.gridGraphics.clear();
        this.gridGraphics.lineStyle(2, 0x334455, 0.8);
        this.gridGraphics.fillStyle(0x000000, 0.6);
        
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                this.gridGraphics.fillRect(this.gridX + c * this.cellSize, this.gridY + r * this.cellSize, this.cellSize, this.cellSize);
                this.gridGraphics.strokeRect(this.gridX + c * this.cellSize, this.gridY + r * this.cellSize, this.cellSize, this.cellSize);
            }
        }
    }

    createNodes() {
        this.nodesGroup.clear(true, true);
        const radius = this.cellSize * 0.3;

        this.nodes.forEach(node => {
            node.points.forEach(p => {
                const x = this.gridX + p.c * this.cellSize + this.cellSize / 2;
                const y = this.gridY + p.r * this.cellSize + this.cellSize / 2;
                
                const glow = this.add.circle(x, y, radius * 1.5, node.color, 0.3);
                const core = this.add.circle(x, y, radius, node.color, 1);
                const inner = this.add.circle(x, y, radius * 0.5, 0x000000, 1);
                
                this.nodesGroup.addMultiple([glow, core, inner]);
            });
        });
    }

    setupInput() {
        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);
        this.input.on('pointerout', this.onPointerUp, this);
    }

    getCellFromPointer(pointer) {
        const c = Math.floor((pointer.x - this.gridX) / this.cellSize);
        const r = Math.floor((pointer.y - this.gridY) / this.cellSize);
        if (r >= 0 && r < this.size && c >= 0 && c < this.size) {
            return {r, c};
        }
        return null;
    }

    getNodeAt(r, c) {
        return this.nodes.find(n => (n.points[0].r === r && n.points[0].c === c) || (n.points[1].r === r && n.points[1].c === c));
    }

    getPathColorAt(r, c) {
        for (let id in this.paths) {
            const path = this.paths[id];
            for (let i = 0; i < path.length; i++) {
                if (path[i].r === r && path[i].c === c) return parseInt(id);
            }
        }
        return null;
    }

    onPointerDown(pointer) {
        if (this.won) return;
        const cell = this.getCellFromPointer(pointer);
        if (!cell) return;

        const node = this.getNodeAt(cell.r, cell.c);
        if (node) {
            this.activeColor = node.id;
            this.paths[node.id] = [ {r: cell.r, c: cell.c} ];
            this.drawPaths();
            return;
        }

        const pathColor = this.getPathColorAt(cell.r, cell.c);
        if (pathColor) {
            this.activeColor = pathColor;
            const idx = this.paths[pathColor].findIndex(p => p.r === cell.r && p.c === cell.c);
            this.paths[pathColor] = this.paths[pathColor].slice(0, idx + 1);
            this.drawPaths();
        }
    }

    onPointerMove(pointer) {
        if (this.won || !this.activeColor) return;
        const cell = this.getCellFromPointer(pointer);
        if (!cell) return;

        const path = this.paths[this.activeColor];
        const last = path[path.length - 1];

        if (last.r === cell.r && last.c === cell.c) return;

        if (Math.abs(last.r - cell.r) + Math.abs(last.c - cell.c) === 1) {
            const node = this.getNodeAt(cell.r, cell.c);
            if (node) {
                if (node.id === this.activeColor) {
                    path.push({r: cell.r, c: cell.c});
                    this.activeColor = null;
                    this.drawPaths();
                    this.checkWin();
                }
            } else {
                const pathColor = this.getPathColorAt(cell.r, cell.c);
                if (pathColor === this.activeColor) {
                    const idx = path.findIndex(p => p.r === cell.r && p.c === cell.c);
                    this.paths[this.activeColor] = path.slice(0, idx + 1);
                    this.drawPaths();
                } else {
                    if (pathColor) {
                        const otherPath = this.paths[pathColor];
                        const idx = otherPath.findIndex(p => p.r === cell.r && p.c === cell.c);
                        this.paths[pathColor] = otherPath.slice(0, idx);
                    }
                    path.push({r: cell.r, c: cell.c});
                    this.drawPaths();
                }
            }
        }
    }

    onPointerUp() {
        if(this.activeColor) {
            this.activeColor = null;
            this.checkWin();
        }
    }

    drawPaths() {
        this.pathGraphics.clear();
        for (let id in this.paths) {
            const path = this.paths[id];
            if (!path || path.length < 1) continue;
            
            const color = COLORS[id];
            
            if (path.length > 1) {
                this.pathGraphics.lineStyle(16, color, 0.3);
                this.pathGraphics.beginPath();
                this.pathGraphics.moveTo(this.gridX + path[0].c * this.cellSize + this.cellSize/2, this.gridY + path[0].r * this.cellSize + this.cellSize/2);
                for (let i = 1; i < path.length; i++) {
                    this.pathGraphics.lineTo(this.gridX + path[i].c * this.cellSize + this.cellSize/2, this.gridY + path[i].r * this.cellSize + this.cellSize/2);
                }
                this.pathGraphics.strokePath();

                this.pathGraphics.lineStyle(6, color, 1);
                this.pathGraphics.beginPath();
                this.pathGraphics.moveTo(this.gridX + path[0].c * this.cellSize + this.cellSize/2, this.gridY + path[0].r * this.cellSize + this.cellSize/2);
                for (let i = 1; i < path.length; i++) {
                    this.pathGraphics.lineTo(this.gridX + path[i].c * this.cellSize + this.cellSize/2, this.gridY + path[i].r * this.cellSize + this.cellSize/2);
                }
                this.pathGraphics.strokePath();
            }

            for (let i = 0; i < path.length; i++) {
                const x = this.gridX + path[i].c * this.cellSize + this.cellSize/2;
                const y = this.gridY + path[i].r * this.cellSize + this.cellSize/2;
                this.pathGraphics.fillStyle(color, 0.3);
                this.pathGraphics.fillCircle(x, y, 8);
                this.pathGraphics.fillStyle(color, 1);
                this.pathGraphics.fillCircle(x, y, 3);
            }
        }
    }

    checkWin() {
        for (let node of this.nodes) {
            const path = this.paths[node.id];
            if (!path || path.length < 2) return;
            const first = path[0];
            const last = path[path.length - 1];
            
            const n1 = node.points[0];
            const n2 = node.points[1];
            const match1 = (first.r === n1.r && first.c === n1.c && last.r === n2.r && last.c === n2.c);
            const match2 = (first.r === n2.r && first.c === n2.c && last.r === n1.r && last.c === n1.c);
            if (!match1 && !match2) return;
        }

        let filledCells = 0;
        filledCells += this.nodes.length * 2;
        for (let id in this.paths) {
            const path = this.paths[id];
            if (path) filledCells += path.length - 2;
        }

        if (filledCells === this.size * this.size) {
            this.win();
        }
    }

    win() {
        if(this.won) return;
        this.won = true;
        
        this.tweens.add({
            targets: this.nodesGroup.getChildren(),
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 300,
            yoyo: true,
            repeat: 2
        });

        const emitter = this.add.particles(0, 0, 'particle', {
            x: 200, y: 350,
            speed: { min: 50, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 1500,
            blendMode: 'ADD',
            tint: [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00, 0xff8800]
        });
        emitter.explode(80);

        this.time.delayedCall(1500, () => {
            this.showWinScreen();
        });
    }

    showWinScreen() {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, 400, 700);

        const isLast = this.level >= PUZZLES.length - 1;
        
        this.add.text(200, 250, isLast ? 'YOU WIN!' : 'LEVEL COMPLETE', {
            fontFamily: 'monospace',
            fontSize: '32px',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#00ffff', 10, true, true);

        const btn = this.add.container(200, 400);
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xff00ff, 0.2);
        btnBg.lineStyle(2, 0xff00ff, 1);
        btnBg.fillRoundedRect(-80, -30, 160, 60, 10);
        btnBg.strokeRoundedRect(-80, -30, 160, 60, 10);
        
        const btnText = this.add.text(0, 0, isLast ? 'MENU' : 'NEXT', {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ff00ff', 5, true, true);
        
        btn.add([btnBg, btnText]);
        btn.setSize(160, 60);
        btn.setInteractive();
        
        btn.on('pointerdown', () => {
            if (isLast) {
                this.scene.start('MenuScene');
            } else {
                this.scene.start('GameScene', { level: this.level + 1 });
            }
        });
    }

    setupUI() {
        this.add.text(20, 20, `LEVEL ${this.level + 1}`, {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#00ffff'
        });

        this.timeText = this.add.text(20, 50, 'TIME: 0', {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#fff'
        });

        const hintBtn = this.add.container(320, 40);
        const hBg = this.add.graphics();
        hBg.fillStyle(0xffff00, 0.2);
        hBg.lineStyle(2, 0xffff00, 1);
        hBg.fillRoundedRect(-50, -25, 100, 50, 5);
        hBg.strokeRoundedRect(-50, -25, 100, 50, 5);
        
        this.hintText = this.add.text(0, 0, `HINT(${this.hints})`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        hintBtn.add([hBg, this.hintText]);
        hintBtn.setSize(100, 50);
        hintBtn.setInteractive();
        
        hintBtn.on('pointerdown', this.useHint, this);
    }

    useHint() {
        if (this.hints <= 0 || this.won) return;
        
        let colorToSolve = null;
        for (let node of this.nodes) {
            const p1 = this.paths[node.id] || [];
            const p2 = this.solutionPaths[node.id];
            let match = p1.length === p2.length;
            if (match) {
                let fwd = true, rev = true;
                for (let i=0; i<p1.length; i++) {
                    if (p1[i].r !== p2[i].r || p1[i].c !== p2[i].c) fwd = false;
                    if (p1[i].r !== p2[p2.length-1-i].r || p1[i].c !== p2[p2.length-1-i].c) rev = false;
                }
                if (!fwd && !rev) match = false;
            }
            if (!match) {
                colorToSolve = node.id;
                break;
            }
        }

        if (colorToSolve) {
            this.hints--;
            this.hintText.setText(`HINT(${this.hints})`);
            
            const sol = this.solutionPaths[colorToSolve];
            sol.forEach(cell => {
                const other = this.getPathColorAt(cell.r, cell.c);
                if (other && other !== colorToSolve) {
                    const idx = this.paths[other].findIndex(p => p.r === cell.r && p.c === cell.c);
                    this.paths[other] = this.paths[other].slice(0, idx);
                }
            });
            
            this.paths[colorToSolve] = [...this.solutionPaths[colorToSolve]];
            this.drawPaths();
            this.checkWin();
        }
    }

    update(time, delta) {
        if (!this.won) {
            const elapsed = Math.floor((time - this.startTime) / 1000);
            this.timeText.setText(`TIME: ${elapsed}`);
        }
    }
}
