/**
 * Obstacles3D.js - 3D Obstacles (walls, rails, platforms, ramps, gaps)
 * Real geometry that clearly indicates required action
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Obstacles3D {
    constructor() {
        this.obstacles = [];
    }
    
    createObstacle(scene, type, x, y, z) {
        let obstacle = null;
        
        switch (type) {
            case 'wall':
                obstacle = this.createWall(x, y, z);
                break;
            case 'lowBar':
                obstacle = this.createLowBar(x, y, z);
                break;
            case 'gap':
                // Gap is just a marker, no geometry
                obstacle = { type: 'gap', position: new THREE.Vector3(x, y, z), bounds: { width: 2, height: 0.1, depth: 1 } };
                break;
            case 'platform':
                obstacle = this.createPlatform(x, y, z);
                break;
            case 'ramp':
                obstacle = this.createRamp(x, y, z);
                break;
            default:
                obstacle = this.createWall(x, y, z);
        }
        
        if (obstacle && obstacle.mesh) {
            scene.add(obstacle.mesh);
        }
        
        this.obstacles.push(obstacle);
        return obstacle;
    }
    
    createWall(x, y, z) {
        // Tall wall - requires jump
        const geometry = new THREE.BoxGeometry(1.5, 2.5, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x8b7355,
            roughness: 0.8,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + 1.25, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return {
            type: 'wall',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            bounds: { width: 1.5, height: 2.5, depth: 1 }
        };
    }
    
    createLowBar(x, y, z) {
        // Low bar - requires slide
        const geometry = new THREE.BoxGeometry(1.5, 0.3, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x6b5237,
            roughness: 0.7,
            metalness: 0.2
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + 0.15, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return {
            type: 'lowBar',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            bounds: { width: 1.5, height: 0.3, depth: 1 }
        };
    }
    
    createPlatform(x, y, z) {
        // Narrow platform - requires precision
        const geometry = new THREE.BoxGeometry(0.8, 0.2, 2);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x7d6b4f,
            roughness: 0.6,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + 0.1, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return {
            type: 'platform',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            bounds: { width: 0.8, height: 0.2, depth: 2 }
        };
    }
    
    createRamp(x, y, z) {
        // Ramp - allows jump boost
        const geometry = new THREE.BoxGeometry(2, 0.2, 1.5);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x9b8b6f,
            roughness: 0.5,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + 0.1, z);
        mesh.rotation.x = -0.3; // Angled ramp
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return {
            type: 'ramp',
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            bounds: { width: 2, height: 0.2, depth: 1.5 }
        };
    }
    
    update(deltaTime, gameSpeed, playerPosition) {
        // Move obstacles backward
        for (let obstacle of this.obstacles) {
            if (obstacle.mesh) {
                obstacle.mesh.position.z -= gameSpeed * deltaTime;
                obstacle.position.z -= gameSpeed * deltaTime;
            } else {
                obstacle.position.z -= gameSpeed * deltaTime;
            }
        }
        
        // Remove obstacles that are far behind
        this.obstacles = this.obstacles.filter(obs => {
            if (playerPosition && obs.position.z < playerPosition.z - 20) {
                if (obs.mesh) {
                    obs.mesh.parent.remove(obs.mesh);
                }
                return false;
            }
            return true;
        });
    }
    
    checkCollision(playerPosition, playerBounds) {
        for (let obstacle of this.obstacles) {
            if (obstacle.type === 'gap') continue; // Gaps don't kill, they just require jump
            
            const obsPos = obstacle.position;
            const obsBounds = obstacle.bounds;
            
            // AABB collision
            if (playerPosition.x < obsPos.x + obsBounds.width / 2 &&
                playerPosition.x > obsPos.x - obsBounds.width / 2 &&
                playerPosition.z < obsPos.z + obsBounds.depth / 2 &&
                playerPosition.z > obsPos.z - obsBounds.depth / 2 &&
                playerPosition.y < obsPos.y + obsBounds.height &&
                playerPosition.y > obsPos.y - obsBounds.height) {
                return true;
            }
        }
        return false;
    }
    
    cleanup(scene) {
        for (let obstacle of this.obstacles) {
            if (obstacle.mesh) {
                scene.remove(obstacle.mesh);
            }
        }
        this.obstacles = [];
    }
}
