/**
 * ComboSystem.js - Manages number combo effects
 * 3 Combos: 232 (Protection), 636 (Speed Boost), 555 (Dangerous Reward)
 */

export class ComboSystem {
    constructor() {
        this.collectedNumbers = [];
        this.maxNumbers = 3;
        
        // Three combo types
        this.activeCombo = null; // 'PROTECTION_232', 'SPEED_636', 'DANGEROUS_555', or null
        this.comboTimer = 0;
        this.comboDuration = 0; // Set based on combo type
        
        // Combo effects
        this.isProtectionActive = false;
        this.isSpeedBoostActive = false;
        this.isDangerousRewardActive = false;
        this.isDoubleJumpActive = false;
        this.isSlowMotionActive = false;
        this.isMagnetActive = false;
        this.survivedSpeedBoost = false; // Track if player survived 636 combo
    }
    
    /**
     * Add a collected number
     * If combo is active, collecting a number destroys the combo
     * Returns combo type if triggered, null otherwise
     */
    addNumber(number) {
        try {
            if (!number || (number !== 2 && number !== 3 && number !== 5 && number !== 6)) {
                console.warn('Invalid number:', number);
                return null;
            }
            
            // If a combo is active, collecting a number destroys it
            if (this.activeCombo !== null) {
                this.cancelActiveCombo();
            }
            
            // If already at max, remove oldest (FIFO)
            if (this.collectedNumbers.length >= this.maxNumbers) {
                this.collectedNumbers.shift();
            }
            
            this.collectedNumbers.push(number);
            
            // Check for combo if we have 3 numbers
            if (this.collectedNumbers.length === this.maxNumbers) {
                return this.checkCombo();
            }
            
            return null;
        } catch (error) {
            console.error('Error adding number:', error);
            return null;
        }
    }
    
    /**
     * Cancel active combo (when collecting new number)
     */
    cancelActiveCombo() {
        this.activeCombo = null;
        this.comboTimer = 0;
        this.comboDuration = 0;
        this.isProtectionActive = false;
        this.isSpeedBoostActive = false;
        this.isDangerousRewardActive = false;
    }
    
    /**
     * Check if collected numbers match a combo
     * Returns combo type or null
     */
    checkCombo() {
        try {
            const numbers = [...this.collectedNumbers];
            
            if (numbers.length !== this.maxNumbers) {
                return null;
            }
            
            // COMBO 1: 2-3-2 → PROTECTION (6 seconds protection)
            if (numbers[0] === 2 && numbers[1] === 3 && numbers[2] === 2) {
                console.log('✅ 232 combo detected!');
                this.collectedNumbers = [];
                return 'PROTECTION_232';
            }
            
            // COMBO 2: 6-3-6 → SPEED BOOST (dangerous, if survived gives 10s protection)
            if (numbers[0] === 6 && numbers[1] === 3 && numbers[2] === 6) {
                console.log('✅ 636 combo detected!');
                this.collectedNumbers = [];
                return 'SPEED_636';
            }
            
            // COMBO 3: 5-5-5 → DANGEROUS REWARD (obstacles disabled 4s, then suddenly appear)
            if (numbers[0] === 5 && numbers[1] === 5 && numbers[2] === 5) {
                console.log('✅ 555 combo detected!');
                this.collectedNumbers = [];
                return 'DANGEROUS_555';
            }
            
            console.log('❌ No combo match for:', numbers);
            
            // No combo matched - clear numbers
            this.collectedNumbers = [];
            return null;
        } catch (error) {
            console.error('Error checking combo:', error);
            this.collectedNumbers = [];
            return null;
        }
    }
    
    /**
     * Activate a combo
     */
    activateCombo(comboType) {
        // FIX: Properly activate combo
        console.log('activateCombo called with:', comboType);
        
        if (!comboType) {
            console.warn('activateCombo called with null/undefined comboType');
            return;
        }
        
        this.cancelActiveCombo(); // Cancel any existing combo
        
        this.activeCombo = comboType;
        
        if (comboType === 'PROTECTION_232') {
            this.comboDuration = 6; // 6 seconds
            this.comboTimer = this.comboDuration;
            this.isProtectionActive = true;
            console.log('PROTECTION_232 activated, duration:', this.comboDuration);
        } else if (comboType === 'SPEED_636') {
            this.comboDuration = 5; // Speed boost duration
            this.comboTimer = this.comboDuration;
            this.isSpeedBoostActive = true;
            this.survivedSpeedBoost = false; // Reset survival flag
            console.log('SPEED_636 activated, duration:', this.comboDuration);
            this.comboTimer = this.comboDuration;
            this.isSpeedBoostActive = true;
            this.survivedSpeedBoost = false; // Reset survival flag
        } else if (comboType === 'DANGEROUS_555') {
            this.comboDuration = 4; // 4 seconds obstacles disabled
            this.comboTimer = this.comboDuration;
            this.isDangerousRewardActive = true;
        } else if (comboType === 'DOUBLE_JUMP_222') {
            this.comboDuration = 8; // 8 seconds
            this.comboTimer = this.comboDuration;
            this.isDoubleJumpActive = true;
        } else if (comboType === 'SLOW_MOTION_333') {
            this.comboDuration = 5; // 5 seconds
            this.comboTimer = this.comboDuration;
            this.isSlowMotionActive = true;
        } else if (comboType === 'MAGNET_666') {
            this.comboDuration = 10; // 10 seconds
            this.comboTimer = this.comboDuration;
            this.isMagnetActive = true;
        } else if (comboType === 'TELEPORT_256') {
            this.comboDuration = 0; // Instant effect
            this.comboTimer = 0;
        } else if (comboType === 'SHIELD_BURST_523') {
            this.comboDuration = 0; // Instant effect
            this.comboTimer = 0;
        }
    }
    
    /**
     * Update combo system (timers, etc.)
     */
    update(deltaTime) {
        if (this.activeCombo !== null) {
            this.comboTimer -= deltaTime;
            
            if (this.comboTimer <= 0) {
                this.endActiveCombo();
            }
        }
    }
    
    /**
     * End active combo
     */
    endActiveCombo() {
        // If speed boost ended and player survived, grant protection
        if (this.activeCombo === 'SPEED_636' && this.isSpeedBoostActive) {
            this.survivedSpeedBoost = true;
            // Will be handled by Game.js to grant 10s protection
        }
        
        this.activeCombo = null;
        this.comboTimer = 0;
        this.comboDuration = 0;
        this.isProtectionActive = false;
        this.isSpeedBoostActive = false;
        this.isDangerousRewardActive = false;
    }
    
    /**
     * Check if Protection is active
     */
    hasProtection() {
        return this.isProtectionActive;
    }
    
    /**
     * Check if Speed Boost is active
     */
    hasSpeedBoost() {
        return this.isSpeedBoostActive;
    }
    
    /**
     * Check if Dangerous Reward is active
     */
    hasDangerousReward() {
        return this.isDangerousRewardActive;
    }
    
    /**
     * Check if player survived speed boost
     */
    didSurviveSpeedBoost() {
        return this.survivedSpeedBoost;
    }
    
    /**
     * Reset survival flag (after granting protection)
     */
    resetSurvivalFlag() {
        this.survivedSpeedBoost = false;
    }
    
    /**
     * Get active combo type
     */
    getActiveCombo() {
        return this.activeCombo;
    }
    
    /**
     * Get combo timer (0-1, 1 = just activated, 0 = about to end)
     */
    getComboProgress() {
        if (this.activeCombo === null || this.comboDuration === 0) return 0;
        return this.comboTimer / this.comboDuration;
    }
    
    /**
     * Reset combo system
     */
    reset() {
        this.collectedNumbers = [];
        this.cancelActiveCombo();
        this.survivedSpeedBoost = false;
    }
}
