/**
 * Game3D.js - Main 3D game loop using Three.js
 * Converted from 2D Canvas to 3D WebGL
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { Input } from './Input.js';
import { Player3D } from './Player3D.js';
import { Obstacles3D } from './Obstacles3D.js';
import { Collectibles3D } from './Collectibles3D.js';
import { ComboSystem } from './ComboSystem.js';
import { TRex3D } from './TRex3D.js';

export class Game3D {
    constructor(container) {
        this.container = container;
        
        // Three.js setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Game state
        this.isRunning = false;
        this.isGameOver = false;
        this.gameStarted = false;
        
        // Game objects
        this.player = null;
        this.obstacles = null;
        this.collectibles = null;
        this.comboSystem = null;
        this.trex = null;
        
        // Camera settings (cinematic side/¾ view)
        this.cameraOffset = new THREE.Vector3(0, 5, 15); // Side/¾ angle
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.cameraDamping = 0.1; // Smooth follow
        this.cameraSpeedPullback = 0.5; // Pull back at higher speeds
        
        // Game speed
        this.gameSpeed = 8; // 3D units per second
        this.baseGameSpeed = 8;
        this.maxGameSpeed = 15;
        this.speedIncreaseRate = 0.5;
        
        // Environment
        this.groundY = 0;
        this.distanceTraveled = 0;
        
        // Obstacle spawning
        this.lastObstacleZ = 0;
        this.obstacleSpawnDistance = 20;
        this.minObstacleGap = 10;
        this.maxObstacleGap = 20;
        this.difficultyLevel = 1;
        
        // Dino chase mechanics
        this.missedNumbers = 0;
        this.timeSinceLastCollection = 0;
        this.numberCollectionAdvantages = {
            speedBoost: 0,
            jumpBoost: 0,
            collectionCount: 0
        };
        
        // Badge system
        this.badges = {
            SILVER: { score: 500, name: 'Silver', icon: '🥈', color: '#C0C0C0' },
            GOLD: { score: 1500, name: 'Gold', icon: '🥇', color: '#FFD700' },
            PLATINUM: { score: 3000, name: 'Platinum', icon: '💎', color: '#E5E4E2' },
            LEGENDARY: { score: 5000, name: 'Legendary', icon: '👑', color: '#FF6B35' }
        };
        this.currentBadge = null;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore') || '0');
        this.highestBadge = localStorage.getItem('highestBadge') || null;
        
        // Input
        this.input = new Input();
        
        // UI elements
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.bestScoreDisplay = document.getElementById('bestScoreDisplay');
        this.distanceDisplay = document.getElementById('distanceDisplay');
        this.comboDisplay = document.getElementById('comboDisplay');
        this.badgeDisplay = document.getElementById('badgeDisplay');
        this.gameOverDiv = document.getElementById('gameOver');
        this.startMenu = document.getElementById('startMenu');
        
        // Initialize
        this.init();
    }
    
    init() {
        console.log('=== INITIALIZING 3D GAME ===');
        
        // Create Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200); // Depth fog
        
        // Create camera (perspective, side/¾ view)
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(0, 8, 20);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // Lighting
        this.setupLighting();
        
        // Create ground
        this.createGround();
        
        // Create game objects
        this.resetGame();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start render loop
        this.animate();
        
        console.log('=== 3D GAME INITIALIZED ===');
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        this.scene.add(directionalLight);
        
        // Fill light (softer shadows)
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, 10, -10);
        this.scene.add(fillLight);
    }
    
    createGround() {
        // Create ground plane
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a5d23,
            roughness: 0.8,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = this.groundY;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add some texture variation
        const grassGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
        const grassMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x5a6d33,
            roughness: 0.9,
            metalness: 0.0
        });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = this.groundY + 0.01;
        this.scene.add(grass);
    }
    
    resetGame() {
        console.log('Resetting 3D game...');
        
        // Clear existing objects
        if (this.player) {
            this.scene.remove(this.player.mesh);
        }
        if (this.obstacles) {
            this.obstacles.cleanup(this.scene);
        }
        if (this.collectibles) {
            this.collectibles.cleanup(this.scene);
        }
        if (this.trex) {
            this.scene.remove(this.trex.mesh);
        }
        
        // Reset game state
        this.isGameOver = false;
        this.score = 0;
        this.distanceTraveled = 0;
        this.gameSpeed = this.baseGameSpeed;
        this.lastObstacleZ = 0;
        this.missedNumbers = 0;
        this.timeSinceLastCollection = 0;
        this.difficultyLevel = 1;
        this.currentBadge = null;
        
        // Create player
        this.player = new Player3D(0, 1, 0);
        this.scene.add(this.player.mesh);
        
        // Create obstacles
        this.obstacles = new Obstacles3D();
        
        // Create collectibles
        this.collectibles = new Collectibles3D();
        
        // Create combo system
        this.comboSystem = new ComboSystem();
        
        // Create T-Rex
        this.trex = new TRex3D(0, 2, -10);
        this.scene.add(this.trex.mesh);
        
        // Reset camera
        this.camera.position.set(0, 8, 20);
        this.cameraTarget.set(0, 0, 0);
        
        // Spawn initial obstacles
        this.spawnInitialObstacles();
        
        console.log('3D game reset complete');
    }
    
    spawnInitialObstacles() {
        for (let i = 0; i < 10; i++) {
            this.spawnObstacleGroup(this.lastObstacleZ + i * 15);
        }
    }
    
    spawnObstacleGroup(z) {
        if (!this.obstacles) return;
        
        const gap = this.minObstacleGap + Math.random() * (this.maxObstacleGap - this.minObstacleGap);
        const difficulty = this.difficultyLevel;
        
        // Spawn various obstacle types
        const obstacleTypes = ['wall', 'lowBar', 'gap', 'platform', 'ramp'];
        const selectedType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        this.obstacles.createObstacle(this.scene, selectedType, 0, this.groundY, z);
        
        // Spawn collectibles near obstacles
        if (this.collectibles && Math.random() > 0.5) {
            const numbers = [2, 3, 5, 6];
            const number = numbers[Math.floor(Math.random() * numbers.length)];
            const collectibleX = (Math.random() - 0.5) * 3; // Random X position
            const collectibleY = this.groundY + 1.5;
            const collectibleZ = z + (Math.random() - 0.5) * 5;
            this.collectibles.createCube(this.scene, collectibleX, collectibleY, collectibleZ, number);
        }
        
        this.lastObstacleZ = z + gap;
    }
    
    startGame() {
        if (this.gameStarted) return;
        
        console.log('Starting 3D game...');
        this.gameStarted = true;
        this.isRunning = true;
        
        if (this.startMenu) {
            this.startMenu.classList.add('hidden');
        }
        
        this.resetGame();
    }
    
    update(deltaTime) {
        if (!this.isRunning || this.isGameOver) return;
        
        // Update player
        if (this.player) {
            this.player.update(deltaTime, this.input, this.gameSpeed);
        }
        
        // Update obstacles
        if (this.obstacles) {
            this.obstacles.update(deltaTime, this.gameSpeed, this.player?.position);
        }
        
        // Update collectibles
        if (this.collectibles) {
            this.collectibles.update(deltaTime, this.gameSpeed);
        }
        
        // Update T-Rex
        if (this.trex && this.player) {
            this.trex.update(deltaTime, this.player.position, this.gameSpeed, this.missedNumbers, this.timeSinceLastCollection);
        }
        
        // Update combo system
        if (this.comboSystem) {
            this.comboSystem.update(deltaTime);
        }
        
        // Update camera (cinematic follow)
        this.updateCamera(deltaTime);
        
        // Spawn obstacles
        if (this.player && this.player.position.z > this.lastObstacleZ - 30) {
            this.spawnObstacleGroup(this.lastObstacleZ + this.obstacleSpawnDistance);
        }
        
        // Update distance and score
        if (this.player) {
            this.distanceTraveled = this.player.position.z;
            this.score = Math.floor(this.distanceTraveled / 10);
        }
        
        // Update UI
        this.updateUI();
        
        // Check collisions
        this.checkCollisions();
    }
    
    updateCamera(deltaTime) {
        if (!this.player) return;
        
        const playerPos = this.player.position;
        
        // Calculate target camera position (side/¾ view)
        const speedMultiplier = 1 + (this.gameSpeed / this.baseGameSpeed - 1) * this.cameraSpeedPullback;
        const targetX = this.cameraOffset.x;
        const targetY = this.cameraOffset.y * speedMultiplier; // Pull back at higher speeds
        const targetZ = playerPos.z + this.cameraOffset.z;
        
        // Smooth camera follow with damping
        this.camera.position.x += (targetX - this.camera.position.x) * this.cameraDamping;
        this.camera.position.y += (targetY - this.camera.position.y) * this.cameraDamping;
        this.camera.position.z += (targetZ - this.camera.position.z) * this.cameraDamping;
        
        // Look at player with slight lead
        this.cameraTarget.set(playerPos.x, playerPos.y + 1, playerPos.z);
        this.camera.lookAt(this.cameraTarget);
    }
    
    checkCollisions() {
        if (!this.player || !this.obstacles) return;
        
        // Check obstacle collisions
        const hit = this.obstacles.checkCollision(this.player.position, this.player.bounds);
        if (hit) {
            this.onPlayerDeath();
        }
        
        // Check collectible collisions
        if (this.collectibles) {
            const collectedNumber = this.collectibles.checkCollection(this.player.position, this.player.bounds);
            if (collectedNumber !== null) {
                this.handleNumberCollection(collectedNumber);
            }
        }
        
        // Check T-Rex collision
        if (this.trex) {
            const trexHit = this.trex.checkCollision(this.player.position, this.player.bounds);
            if (trexHit) {
                this.onPlayerDeath();
            }
        }
    }
    
    handleNumberCollection(number) {
        // Reset missed counter
        this.missedNumbers = 0;
        this.timeSinceLastCollection = 0;
        
        // Give advantages
        this.numberCollectionAdvantages.collectionCount++;
        this.numberCollectionAdvantages.speedBoost = 2.0;
        this.numberCollectionAdvantages.jumpBoost = 2.0;
        
        // Apply speed boost
        if (this.player) {
            this.gameSpeed *= 1.1;
        }
        
        // Add to combo system
        if (this.comboSystem) {
            const comboType = this.comboSystem.addNumber(number);
            if (comboType) {
                this.comboSystem.activateCombo(comboType);
            }
        }
    }
    
    updateUI() {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `SCORE: ${this.score}`;
        }
        if (this.distanceDisplay) {
            this.distanceDisplay.textContent = `DISTANCE: ${Math.floor(this.distanceTraveled)}m`;
        }
        if (this.bestScoreDisplay) {
            this.bestScoreDisplay.textContent = `BEST: ${this.bestScore}`;
        }
        
        // Update combo display
        if (this.comboDisplay && this.comboSystem) {
            const activeCombo = this.comboSystem.getActiveCombo();
            if (activeCombo) {
                this.comboDisplay.textContent = activeCombo;
                this.comboDisplay.classList.remove('hidden');
            } else {
                this.comboDisplay.classList.add('hidden');
            }
        }
        
        // Check badges
        this.checkBadges();
    }
    
    checkBadges() {
        for (const [key, badge] of Object.entries(this.badges)) {
            if (this.score >= badge.score && this.currentBadge !== key) {
                this.currentBadge = key;
                if (this.badgeDisplay) {
                    this.badgeDisplay.textContent = `${badge.icon} ${badge.name} BADGE!`;
                    this.badgeDisplay.classList.remove('hidden');
                }
                
                // Save highest badge
                if (!this.highestBadge || badge.score > this.badges[this.highestBadge]?.score) {
                    this.highestBadge = key;
                    localStorage.setItem('highestBadge', key);
                }
            }
        }
    }
    
    onPlayerDeath() {
        if (this.isGameOver) return;
        
        this.isGameOver = true;
        this.isRunning = false;
        
        // Save best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore.toString());
        }
        
        // Show game over
        if (this.gameOverDiv) {
            this.gameOverDiv.classList.remove('hidden');
        }
    }
    
    restart() {
        this.gameStarted = false;
        this.isGameOver = false;
        this.isRunning = false;
        
        if (this.gameOverDiv) {
            this.gameOverDiv.classList.add('hidden');
        }
        
        this.resetGame();
    }
    
    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        if (this.isRunning) {
            this.update(deltaTime);
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
