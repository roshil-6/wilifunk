/**
 * TRex3D.js - 3D T-Rex enemy
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class TRex3D {
    constructor(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        // Chase mechanics
        this.baseSpeed = 6;
        this.currentSpeed = this.baseSpeed;
        this.maxSpeed = 12;
        this.rageMultiplier = 1.0;
        
        // Animation
        this.animationTime = 0;
        this.legPhase = 0;
        this.headBob = 0;
        this.tailSwing = 0;
        
        // Create 3D mesh
        this.mesh = this.createMesh();
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Bounds
        this.bounds = {
            width: 2,
            height: 3,
            depth: 2
        };
    }
    
    createMesh() {
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(1.5, 1.2, 2.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4a5d23,
            roughness: 0.8,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.0;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.8, 0.6, 1.2);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x5a6d33,
            roughness: 0.7
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(1.2, 1.3, 0);
        head.castShadow = true;
        group.add(head);
        
        // Snout
        const snoutGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.6);
        const snout = new THREE.Mesh(snoutGeometry, headMaterial);
        snout.position.set(1.5, 1.2, 0);
        snout.castShadow = true;
        group.add(snout);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(1.0, 1.4, -0.2);
        group.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(1.0, 1.4, 0.2);
        group.add(rightEye);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.3, 1.0, 0.3);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3a4d13,
            roughness: 0.8
        });
        
        // Front legs
        const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontLeftLeg.position.set(0.5, 0.5, -0.6);
        frontLeftLeg.castShadow = true;
        group.add(frontLeftLeg);
        
        const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontRightLeg.position.set(0.5, 0.5, 0.6);
        frontRightLeg.castShadow = true;
        group.add(frontRightLeg);
        
        // Back legs
        const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        backLeftLeg.position.set(-0.5, 0.5, -0.6);
        backLeftLeg.castShadow = true;
        group.add(backLeftLeg);
        
        const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        backRightLeg.position.set(-0.5, 0.5, 0.6);
        backRightLeg.castShadow = true;
        group.add(backRightLeg);
        
        // Tail
        const tailGeometry = new THREE.BoxGeometry(0.4, 0.4, 1.5);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(-1.2, 0.8, 0);
        tail.castShadow = true;
        group.add(tail);
        
        // Store references for animation
        this.body = body;
        this.head = head;
        this.tail = tail;
        this.legs = [frontLeftLeg, frontRightLeg, backLeftLeg, backRightLeg];
        
        return group;
    }
    
    update(deltaTime, playerPosition, gameSpeed, missedNumbers, timeSinceLastCollection) {
        this.animationTime += deltaTime;
        
        // Calculate distance to player
        const distanceToPlayer = playerPosition.z - this.position.z;
        
        // Rage system
        this.rageMultiplier = 1.0 + (missedNumbers * 0.15);
        if (timeSinceLastCollection > 2.0) {
            const escapeBonus = Math.min(0.5, (timeSinceLastCollection - 2.0) * 0.1);
            this.rageMultiplier += escapeBonus;
        }
        
        // Speed adjustment
        if (distanceToPlayer > 5) {
            this.currentSpeed = Math.min(this.maxSpeed, (this.baseSpeed + distanceToPlayer * 0.2) * this.rageMultiplier);
        } else {
            this.currentSpeed = this.baseSpeed * this.rageMultiplier;
        }
        
        // Move forward
        this.position.z += this.currentSpeed * deltaTime;
        this.mesh.position.z = this.position.z;
        
        // Update animations
        this.updateAnimations(deltaTime);
    }
    
    updateAnimations(deltaTime) {
        this.legPhase += deltaTime * 8;
        this.headBob = Math.sin(this.animationTime * 5) * 0.1;
        this.tailSwing = Math.sin(this.animationTime * 3) * 0.3;
        
        // Head bob
        this.head.position.y = 1.3 + this.headBob;
        
        // Tail swing
        this.tail.rotation.y = this.tailSwing;
        
        // Leg animation
        for (let i = 0; i < this.legs.length; i++) {
            const phase = this.legPhase + (i * Math.PI / 2);
            this.legs[i].rotation.x = Math.sin(phase) * 0.3;
        }
    }
    
    checkCollision(playerPosition, playerBounds) {
        const distance = this.position.distanceTo(playerPosition);
        return distance < 1.5;
    }
}
