// ALPHA BLADE - Sound Manager
// Web Audio API based sound system

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted = false;
  private currentMusic: string | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private musicInterval: number | null = null;

  // Sound effect frequencies
  private readonly SOUNDS = {
    shoot: { freq: 880, type: 'sawtooth' as const, duration: 0.05, slide: -200 },
    enemyShoot: { freq: 220, type: 'square' as const, duration: 0.08, slide: -50 },
    explosion: { freq: 100, type: 'sawtooth' as const, duration: 0.3, slide: -80 },
    powerUp: { freq: 523.25, type: 'sine' as const, duration: 0.15, slide: 200 },
    bomb: { freq: 60, type: 'sawtooth' as const, duration: 0.8, slide: -30 },
    hit: { freq: 200, type: 'square' as const, duration: 0.1, slide: -100 },
    bossWarning: { freq: 440, type: 'sawtooth' as const, duration: 0.5, slide: 0 },
    gameOver: { freq: 330, type: 'sawtooth' as const, duration: 1, slide: -100 },
    stageClear: { freq: 659.25, type: 'sine' as const, duration: 0.5, slide: 200 },
  };

  constructor() {
    this.init();
  }

  init(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.audioContext.destination);

      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = 0.3;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = 0.4;
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  resume(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playSound(name: keyof typeof this.SOUNDS): void {
    if (!this.audioContext || this.isMuted) return;

    if (name === 'shoot') {
      const osc1 = this.audioContext.createOscillator();
      const osc2 = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(800, this.audioContext.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.15);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(600, this.audioContext.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);

      gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 400;

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(filter);
      filter.connect(this.sfxGain!);

      osc1.start(this.audioContext.currentTime);
      osc2.start(this.audioContext.currentTime);
      osc1.stop(this.audioContext.currentTime + 0.15);
      osc2.stop(this.audioContext.currentTime + 0.15);
      return;
    }

    const sound = this.SOUNDS[name];
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = sound.type;
    osc.frequency.setValueAtTime(sound.freq, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, sound.freq + sound.slide),
      this.audioContext.currentTime + sound.duration
    );

    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);

    osc.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + sound.duration);
  }

  startMenuMusic(): void {
    this.stopMusic();
    this.currentMusic = 'menu';
    
    if (!this.audioContext || this.isMuted) return;

    // Create ambient space drone
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = 110; // A2
    osc2.type = 'sine';
    osc2.frequency.value = 164.81; // E3

    gain.gain.value = 0.1;

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.musicGain!);

    osc1.start();
    osc2.start();

    this.musicOscillators = [osc1, osc2];

    // Add arpeggio effect
    let noteIndex = 0;
    const notes = [220, 261.63, 329.63, 392, 329.63, 261.63];
    
    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || this.currentMusic !== 'menu') return;
      
      const arpOsc = this.audioContext!.createOscillator();
      const arpGain = this.audioContext!.createGain();
      
      arpOsc.type = 'triangle';
      arpOsc.frequency.value = notes[noteIndex];
      arpGain.gain.setValueAtTime(0.05, this.audioContext!.currentTime);
      arpGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.2);
      
      arpOsc.connect(arpGain);
      arpGain.connect(this.musicGain!);
      
      arpOsc.start();
      arpOsc.stop(this.audioContext!.currentTime + 0.2);
      
      noteIndex = (noteIndex + 1) % notes.length;
    }, 250);
  }

  startStageMusic(stage: number): void {
    this.stopMusic();
    this.currentMusic = `stage${stage}`;
    
    if (!this.audioContext || this.isMuted) return;

    // Background Long Pad Sweep
    const padOsc1 = this.audioContext.createOscillator();
    const padOsc2 = this.audioContext.createOscillator();
    const padGain = this.audioContext.createGain();

    padOsc1.type = 'sawtooth';
    padOsc2.type = 'sawtooth';
    padOsc1.frequency.value = 110; // A2
    padOsc2.frequency.value = 110.5; // detune

    padGain.gain.setValueAtTime(0.04, this.audioContext.currentTime);

    const padFilter = this.audioContext.createBiquadFilter();
    padFilter.type = 'lowpass';
    const lfo = this.audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15; // slow sweep
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 800;
    
    lfo.connect(lfoGain);
    lfoGain.connect(padFilter.frequency);
    padFilter.frequency.value = 1000;

    padOsc1.connect(padFilter);
    padOsc2.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(this.musicGain!);

    padOsc1.start();
    padOsc2.start();
    lfo.start();
    this.musicOscillators.push(padOsc1, padOsc2, lfo);

    // Stage-specific bass lines
    const bassLines: Record<number, number[]> = {
      1: [65.41, 0, 73.42, 0, 82.41, 0, 98, 0], // Deep space
      2: [55, 65.41, 73.42, 82.41, 55, 65.41, 73.42, 98], // Asteroid belt
      3: [41.2, 41.2, 49, 55, 41.2, 49, 55, 65.41], // Enemy base
    };

    // Fast melody
    const melodies: Record<number, number[]> = {
      1: [440, 0, 523.25, 0, 587.33, 659.25, 0, 440, 880, 0, 0, 0, 783.99, 659.25, 523.25, 0],
      2: [329.63, 0, 392, 0, 440, 0, 329.63, 0, 493.88, 0, 523.25, 0, 0, 0, 0, 0],
      3: [293.66, 0, 329.63, 0, 349.23, 0, 440, 0, 493.88, 0, 523.25, 0, 587.33, 0, 0, 0],
    };

    const notes = bassLines[stage] || bassLines[1];
    const melodyNotes = melodies[stage] || melodies[1];
    let tick = 0;

    // Rhythm and Melody
    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || this.currentMusic !== `stage${stage}`) return;
      
      // Play bass
      const freq = notes[tick % notes.length];
      if (freq > 0) {
        const bass = this.audioContext!.createOscillator();
        const bassGain = this.audioContext!.createGain();
        bass.type = 'sawtooth';
        bass.frequency.value = freq;
        bassGain.gain.setValueAtTime(0.12, this.audioContext!.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.15);
        
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        bass.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(this.musicGain!);
        bass.start();
        bass.stop(this.audioContext!.currentTime + 0.18);
      }

      // Play melody
      const melFreq = melodyNotes[tick % melodyNotes.length];
      if (melFreq > 0) {
        const melOsc = this.audioContext!.createOscillator();
        const melGain = this.audioContext!.createGain();
        melOsc.type = 'square';
        melOsc.frequency.value = melFreq;
        melGain.gain.setValueAtTime(0.05, this.audioContext!.currentTime);
        melGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + 0.15);
        
        melOsc.connect(melGain);
        melGain.connect(this.musicGain!);
        melOsc.start();
        melOsc.stop(this.audioContext!.currentTime + 0.18);
      }
      
      tick++;
    }, 125); // Fast tempo for action
  }

  playBossWarning(): void {
    if (!this.audioContext || this.isMuted) return;

    // Stop current music
    this.stopMusic();
    this.currentMusic = 'bossWarning';

    // Dramatic warning sound
    const playWarningTone = (time: number, freq: number, duration: number) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.audioContext!.currentTime + time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.audioContext!.currentTime + time + duration);
      
      gain.gain.setValueAtTime(0.3, this.audioContext!.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + time + duration);
      
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      
      osc.start(this.audioContext!.currentTime + time);
      osc.stop(this.audioContext!.currentTime + time + duration);
    };

    // Alarm pattern
    for (let i = 0; i < 6; i++) {
      playWarningTone(i * 0.4, 880, 0.2);
      playWarningTone(i * 0.4 + 0.2, 440, 0.2);
    }

    // Resume stage music after warning
    setTimeout(() => {
      if (this.currentMusic === 'bossWarning') {
        this.startStageMusic(1);
      }
    }, 3000);
  }

  stopMusic(): void {
    this.musicOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {}
    });
    this.musicOscillators = [];

    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.5;
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }
}

export default SoundManager;
