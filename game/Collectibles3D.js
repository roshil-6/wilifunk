/**
 * Collectibles3D.js - 3D Number collectibles
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Collectibles3D {
    constructor() {
        this.cubes = [];
    }
    
    createCube(scene, x, y, z, number) {
        const numberColors = {
            2: 0xff6b6b,  // Red
            3: 0x4ecdc4,  // Cyan
            5: 0xffd93d,  // Yellow
            6: 0x95e1d3   // Light Green
        };
        
        // Create cube geometry
        const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const material = new THREE.MeshStandardMaterial({ 
            color: numberColors[number] || 0xffffff,
            emissive: numberColors[number] || 0xffffff,
            emissiveIntensity: 0.3,
            roughness: 0.3,
            metalness: 0.2
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add number text (simplified - using a plane with color)
        const textGeometry = new THREE.PlaneGeometry(0.4, 0.4);
        const textMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 0, 0.31);
        mesh.add(textMesh);
        
        const cube = {
            mesh: mesh,
            position: new THREE.Vector3(x, y, z),
            number: number,
            collected: false,
            rotation: 0,
            floatOffset: Math.random() * Math.PI * 2
        };
        
        scene.add(mesh);
        this.cubes.push(cube);
        
        return cube;
    }
    
    update(deltaTime, gameSpeed) {
        for (let cube of this.cubes) {
            // Move backward
            cube.mesh.position.z -= gameSpeed * deltaTime;
            cube.position.z -= gameSpeed * deltaTime;
            
            // Rotate and float
            cube.rotation += deltaTime * 3;
            cube.mesh.rotation.y = cube.rotation;
            cube.mesh.position.y = cube.position.y + Math.sin(cube.floatOffset + cube.rotation) * 0.2;
            
            // Remove if far behind
            if (cube.position.z < -50) {
                cube.mesh.parent.remove(cube.mesh);
            }
        }
        
        // Clean up collected cubes
        this.cubes = this.cubes.filter(cube => {
            if (cube.collected || cube.position.z < -50) {
                if (cube.mesh && cube.mesh.parent) {
                    cube.mesh.parent.remove(cube.mesh);
                }
                return false;
            }
            return true;
        });
    }
    
    checkCollection(playerPosition, playerBounds) {
        for (let cube of this.cubes) {
            if (cube.collected) continue;
            
            const distance = cube.position.distanceTo(playerPosition);
            if (distance < 0.8) {
                cube.collected = true;
                return cube.number;
            }
        }
        return null;
    }
    
    cleanup(scene) {
        for (let cube of this.cubes) {
            if (cube.mesh) {
                scene.remove(cube.mesh);
            }
        }
        this.cubes = [];
    }
}
