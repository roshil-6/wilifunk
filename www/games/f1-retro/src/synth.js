class RetroSynth {
    constructor() {
        this.ctx = null;
        this.engines = [
            { osc: null, filter: null, gain: null },
            { osc: null, filter: null, gain: null }
        ];
        this.screeches = [
            { source: null, filter: null, gain: null },
            { source: null, filter: null, gain: null }
        ];
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.initialized = true;
            
            this.setupEngine(0);
            this.setupEngine(1);
            
            this.setupScreech(0);
            this.setupScreech(1);
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    setupEngine(idx) {
        if (!this.ctx) return;
        
        // Lowpass filter to make it sound warm and retro
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        // Engine volume control
        const gain = this.ctx.createGain();
        gain.gain.value = 0.0; // Start silent

        // Setup custom oscillator (sawtooth/triangle blend)
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 60; // Idle speed frequency

        // Connect nodes
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(0);

        this.engines[idx] = { osc, filter, gain };
    }

    setupScreech(idx) {
        if (!this.ctx) return;

        // Generate white noise buffer
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds buffer
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        // Screech nodes
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 3.0;

        const gain = this.ctx.createGain();
        gain.gain.value = 0;

        // Source node using the white noise buffer
        const source = this.ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        source.start(0);

        this.screeches[idx] = { source, filter, gain };
    }

    startEngine(idx = 0) {
        this.resumeContext();
        if (!this.enabled) return;
        const engine = this.engines[idx];
        if (engine && engine.gain) {
            // Smoothly fade in engine sound to a low idle volume
            engine.gain.gain.setTargetAtTime(0.12, this.ctx.currentTime, 0.1);
        }
    }

    stopEngine(idx = 0) {
        const engine = this.engines[idx];
        if (engine && engine.gain) {
            engine.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        }
    }

    updateEnginePitch(idx = 0, speedRatio, currentGear) {
        if (!this.enabled || !this.ctx) return;
        const engine = this.engines[idx];
        if (!engine || !engine.osc || !engine.filter || !engine.gain) return;
        
        // Calculate dynamic pitch based on speed ratio & current gear.
        // As speed ratio increases within a gear, frequency rises.
        let baseFreq = 50 + currentGear * 15;
        let scale = 110 + currentGear * 20;
        
        // Normalise speed ratio within simulated gear bounds
        let gearSpeedRatio = speedRatio * 1.5; 
        if (gearSpeedRatio > 1.0) gearSpeedRatio = 1.0;

        const targetFreq = baseFreq + gearSpeedRatio * scale;
        
        // Smooth frequency changes to prevent click sounds
        engine.osc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);

        // Adjust filter frequency according to engine RPM
        engine.filter.frequency.setTargetAtTime(targetFreq * 2.2, this.ctx.currentTime, 0.05);

        // Slightly increase engine volume as speed goes up
        const targetVol = 0.08 + speedRatio * 0.08;
        engine.gain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.05);
    }

    screechStart(idx = 0) {
        if (!this.enabled || !this.ctx) return;
        const screech = this.screeches[idx];
        if (screech && screech.gain) {
            screech.gain.gain.setTargetAtTime(0.15, this.ctx.currentTime, 0.05);
        }
    }

    screechStop(idx = 0) {
        if (!this.ctx) return;
        const screech = this.screeches[idx];
        if (screech && screech.gain) {
            screech.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        }
    }

    playCrash() {
        this.resumeContext();
        if (!this.enabled || !this.ctx) return;

        // Custom low-frequency and noise burst for retro crash sound
        const osc = this.ctx.createOscillator();
        const noise = this.ctx.createBufferSource();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        // 0.2s white noise buffer
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;

        // Low frequency sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.35);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

        osc.connect(filter);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(0);
        noise.start(0);

        osc.stop(this.ctx.currentTime + 0.4);
        noise.stop(this.ctx.currentTime + 0.4);
    }

    playBeep(freq, duration) {
        this.resumeContext();
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square'; // Classic retro square wave
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(0);
        osc.stop(this.ctx.currentTime + duration);
    }

    playFinishFanfare() {
        this.resumeContext();
        if (!this.enabled || !this.ctx) return;

        const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25, 659.25]; // C E G C G C E arpeggio
        const tempo = 0.12;

        notes.forEach((freq, idx) => {
            const time = this.ctx.currentTime + idx * tempo;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(time);
            osc.stop(time + 0.25);
        });
    }

    resumeContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopEngine(0);
            this.stopEngine(1);
            this.screechStop(0);
            this.screechStop(1);
        } else {
            this.startEngine(0);
            this.startEngine(1);
        }
        return this.enabled;
    }
}

// Global synthesizer instance
const synth = new RetroSynth();
