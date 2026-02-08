/**
 * Player3D.js - 3D Player character with animations
 * Clean, modern parkour runner character
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Player3D {
    constructor(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.groundY = y;
        
        // Physics
        this.gravity = -25;
        this.jumpForce = 8;
        this.isGrounded = true;
        this.isSliding = false;
        
        // State
        this.state = 'running'; // 'running', 'jumping', 'falling', 'sliding'
        this.stateTime = 0;
        
        // Animation
        this.animationTime = 0;
        this.legPhase = 0;
        this.armPhase = 0;
        this.forwardLean = 0;
        
        // Create 3D mesh
        this.mesh = this.createMesh();
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Bounds for collision
        this.bounds = {
            width: 0.8,
            height: 1.6,
            depth: 0.8
        };
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Body (torso)
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2c3e50,
            roughness: 0.7,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xf4d03f,
            roughness: 0.6
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.0;
        head.castShadow = true;
        group.add(head);
        
        // Arms (will be animated)
        const armGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x34495e,
            roughness: 0.7
        });
        
        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.4, 0.5, 0);
        this.leftArm.castShadow = true;
        group.add(this.leftArm);
        
        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(0.4, 0.5, 0);
        this.rightArm.castShadow = true;
        group.add(this.rightArm);
        
        // Legs (will be animated)
        const legGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a252f,
            roughness: 0.7
        });
        
        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.2, -0.35, 0);
        this.leftLeg.castShadow = true;
        group.add(this.leftLeg);
        
        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.set(0.2, -0.35, 0);
        this.rightLeg.castShadow = true;
        group.add(this.rightLeg);
        
        // Store body reference for forward lean
        this.body = body;
        
        return group;
    }
    
    update(deltaTime, input, gameSpeed) {
        this.animationTime += deltaTime;
        this.stateTime += deltaTime;
        
        // Handle input
        if (input.isJumpPressed() && this.isGrounded && !this.isSliding) {
            this.jump();
        }
        
        if (input.isSlidePressed() && this.isGrounded) {
            this.slide();
        } else if (this.isSliding && this.stateTime > 0.5) {
            this.isSliding = false;
            this.state = 'running';
        }
        
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        } else {
            this.velocity.y = 0;
        }
        
        // Forward movement (auto-run)
        this.velocity.z = gameSpeed;
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Ground collision
        if (this.position.y <= this.groundY) {
            this.position.y = this.groundY;
            this.isGrounded = true;
            if (this.state === 'falling') {
                this.state = 'running';
                this.stateTime = 0;
            }
        } else {
            this.isGrounded = false;
            if (this.velocity.y < 0) {
                this.state = 'falling';
            }
        }
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        
        // Update animations
        this.updateAnimations(deltaTime, gameSpeed);
    }
    
    jump() {
        if (!this.isGrounded) return;
        
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        this.state = 'jumping';
        this.stateTime = 0;
    }
    
    slide() {
        if (this.isSliding) return;
        
        this.isSliding = true;
        this.state = 'sliding';
        this.stateTime = 0;
    }
    
    updateAnimations(deltaTime, gameSpeed) {
        const speedFactor = gameSpeed / 8; // Normalize to base speed
        
        // Running animation
        if (this.state === 'running' && this.isGrounded) {
            this.legPhase += deltaTime * 10 * speedFactor;
            this.armPhase += deltaTime * 10 * speedFactor;
            
            // Leg animation (alternating)
            const leftLegAngle = Math.sin(this.legPhase) * 0.5;
            const rightLegAngle = -Math.sin(this.legPhase) * 0.5;
            
            this.leftLeg.rotation.x = leftLegAngle;
            this.rightLeg.rotation.x = rightLegAngle;
            
            // Arm swing (opposite to legs)
            this.leftArm.rotation.x = -leftLegAngle * 0.8;
            this.rightArm.rotation.x = -rightLegAngle * 0.8;
            
            // Forward lean (increases with speed)
            this.forwardLean = Math.min(0.3, (speedFactor - 1) * 0.2);
            this.body.rotation.x = this.forwardLean;
        }
        
        // Jumping animation
        if (this.state === 'jumping') {
            // Legs tuck up
            this.leftLeg.rotation.x = 1.2;
            this.rightLeg.rotation.x = 1.2;
            // Arms up
            this.leftArm.rotation.x = -0.8;
            this.rightArm.rotation.x = -0.8;
            // Body lean back slightly
            this.body.rotation.x = -0.2;
        }
        
        // Falling animation
        if (this.state === 'falling') {
            // Legs prepare for landing
            this.leftLeg.rotation.x = 0.3;
            this.rightLeg.rotation.x = 0.3;
            // Arms out for balance
            this.leftArm.rotation.x = 0.2;
            this.rightArm.rotation.x = 0.2;
        }
        
        // Sliding animation
        if (this.state === 'sliding') {
            // Body leans forward more
            this.body.rotation.x = 0.8;
            // Legs extend
            this.leftLeg.rotation.x = 1.5;
            this.rightLeg.rotation.x = 1.5;
            // Lower body
            this.mesh.position.y = this.position.y - 0.3;
        } else {
            this.mesh.position.y = this.position.y;
        }
    }
    
    getBounds() {
        return {
            min: new THREE.Vector3(
                this.position.x - this.bounds.width / 2,
                this.position.y - this.bounds.height / 2,
                this.position.z - this.bounds.depth / 2
            ),
            max: new THREE.Vector3(
                this.position.x + this.bounds.width / 2,
                this.position.y + this.bounds.height / 2,
                this.position.z + this.bounds.depth / 2
            )
        };
    }
}
