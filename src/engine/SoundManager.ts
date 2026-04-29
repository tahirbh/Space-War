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
  private audioBuffers: Map<string, AudioBuffer> = new Map();

  // Sound effect frequencies
  private readonly SOUNDS = {
    shoot: { freq: 880, type: 'sawtooth' as const, duration: 0.05, slide: -200, file: '/audio/Shoot.mp3' },
    enemyShoot: { freq: 220, type: 'square' as const, duration: 0.08, slide: -50 },
    explosion: { freq: 100, type: 'sawtooth' as const, duration: 0.3, slide: -80, file: '/audio/bomb.mp3' },
    powerUp: { freq: 523.25, type: 'sine' as const, duration: 0.15, slide: 200 },
    bomb: { freq: 60, type: 'sawtooth' as const, duration: 0.8, slide: -30, file: '/audio/bomb.mp3' },
    hit: { freq: 200, type: 'square' as const, duration: 0.1, slide: -100 },
    bossWarning: { freq: 440, type: 'sawtooth' as const, duration: 0.5, slide: 0, file: '/audio/Boss.mp3' },
    gameOver: { freq: 330, type: 'sawtooth' as const, duration: 1, slide: -100 },
    stageClear: { freq: 659.25, type: 'sine' as const, duration: 0.5, slide: 200 },
    menuNavigate: { freq: 1200, type: 'square' as const, duration: 0.04, slide: -200 },
    menuSelect: { freq: 800, type: 'sawtooth' as const, duration: 0.1, slide: 400 },
    gameStart: { freq: 440, type: 'sawtooth' as const, duration: 0.8, slide: 600, file: '/audio/startup.mp3' },
    saveSound: { freq: 523.25, type: 'sine' as const, duration: 0.4, slide: 0 },
    readyMission: { freq: 220, type: 'square' as const, duration: 0.6, slide: 100 },
    intro: { freq: 0, type: 'sine' as const, duration: 0, slide: 0, file: '/audio/Intro_conversation.mp3' },
    welcome: { freq: 0, type: 'sine' as const, duration: 0, slide: 0, file: '/audio/welcoming_conversation.mp3' },
  };

  constructor() {
    this.init();
    this.loadAllSounds();
  }

  private async loadAllSounds(): Promise<void> {
    const soundFiles = [
      { name: 'shoot', url: '/audio/Shoot.mp3' },
      { name: 'explosion', url: '/audio/bomb.mp3' },
      { name: 'bomb', url: '/audio/bomb.mp3' },
      { name: 'bossWarning', url: '/audio/Boss.mp3' },
      { name: 'gameStart', url: '/audio/startup.mp3' },
      { name: 'intro', url: '/audio/Intro_conversation.mp3' },
      { name: 'welcome', url: '/audio/welcoming_conversation.mp3' },
      { name: 'music_stage', url: '/audio/music_stage.mp3' },
    ];

    for (const s of soundFiles) {
      try {
        const response = await fetch(s.url);
        const arrayBuffer = await response.arrayBuffer();
        if (this.audioContext) {
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.audioBuffers.set(s.name, audioBuffer);
        }
      } catch (e) {
        console.error(`Failed to load sound: ${s.name}`, e);
      }
    }
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

    // Try playing real audio buffer first
    const buffer = this.audioBuffers.get(name as string);
    if (buffer) {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      const gain = this.audioContext.createGain();
      
      // Dynamic volume adjustment for real samples
      let volume = 0.4;
      if (name === 'bomb') volume = 0.8;
      if (name === 'explosion') volume = 0.6;
      if (name === 'bossWarning') volume = 0.7;
      if (name === 'gameStart') volume = 0.6;
      if (name === 'intro' || name === 'welcome') volume = 0.9;
      
      gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
      source.connect(gain);
      gain.connect(this.sfxGain!);
      source.start(0);
      return;
    }

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

    if (name === 'menuSelect') {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, this.audioContext.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.1);
      return;
    }

    if (name === 'gameStart') {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.5);
      gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.5);
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
    
    // Check for high-quality music buffer
    const musicBuffer = this.audioBuffers.get('music_stage');
    if (musicBuffer && this.audioContext && !this.isMuted) {
      this.currentMusic = `stage${stage}`;
      const source = this.audioContext.createBufferSource();
      source.buffer = musicBuffer;
      source.loop = true;
      source.connect(this.musicGain!);
      source.start(0);
      this.musicOscillators.push(source as any); // Re-using array for cleanup
      return;
    }

    // Mission music for stage 1 (inspired by Through the Wire)
    if (stage === 1) {
      this.startMissionMusic();
      return;
    }

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

  startMissionMusic(): void {
    this.stopMusic();
    this.currentMusic = 'mission';
    
    if (!this.audioContext || this.isMuted) return;

    // Soulful hip-hop beat - inspired by "Through the Wire"
    // BPM: 85 (approx 176ms per 1/16th note, 706ms per beat)
    const tickTime = 175; 
    let tick = 0;

    // Bass line
    const bassNotes = [55, 0, 55, 65.41, 0, 0, 41.2, 49, 55, 0, 55, 65.41, 0, 0, 82.41, 73.42];

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || this.currentMusic !== 'mission') return;

      const time = this.audioContext!.currentTime;

      // KICK DRUM (Every 1st and 3rd beat + syncopation)
      if (tick % 8 === 0 || tick % 8 === 2 || tick % 8 === 5) {
        this.playDrum('kick', time);
      }

      // SNARE DRUM (Every 2nd and 4th beat)
      if (tick % 8 === 4) {
        this.playDrum('snare', time);
      }

      // BASS
      const freq = bassNotes[tick % bassNotes.length];
      if (freq > 0) {
        this.playBass(freq, time);
      }

      // SOUL MELODY (Chipmunk-soul inspired high synth)
      if (tick % 16 === 0 || tick % 16 === 3 || tick % 16 === 6 || tick % 16 === 10) {
        const melody = [880, 1046.5, 1318.5, 1174.7];
        this.playSoulLead(melody[Math.floor(tick / 4) % 4], time);
      }

      tick++;
    }, tickTime);
  }

  private playDrum(type: 'kick' | 'snare', time: number): void {
    if (!this.audioContext || !this.musicGain) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    if (type === 'kick') {
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    } else {
       // Snare noise
       const bufferSize = this.audioContext.sampleRate * 0.1;
       const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
       const data = buffer.getChannelData(0);
       for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
       const noise = this.audioContext.createBufferSource();
       noise.buffer = buffer;
       const noiseFilter = this.audioContext.createBiquadFilter();
       noiseFilter.type = 'highpass';
       noiseFilter.frequency.value = 1000;
       noise.connect(noiseFilter);
       noiseFilter.connect(gain);
       gain.gain.setValueAtTime(0.2, time);
       gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
       noise.start(time);
       noise.stop(time + 0.1);
       return;
    }

    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playBass(freq: number, time: number): void {
    if (!this.audioContext || !this.musicGain) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    osc.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playSoulLead(freq: number, time: number): void {
    if (!this.audioContext || !this.musicGain) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    
    gain.gain.setValueAtTime(0.03, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain!);
    osc.start(time);
    osc.stop(time + 0.3);
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

  setMusicVolume(volume: number): void {
    if (this.musicGain) {
      this.musicGain.gain.value = volume * 0.3; // Scaling factor
    }
  }

  setSFXVolume(volume: number): void {
    if (this.sfxGain) {
      this.sfxGain.gain.value = volume * 0.4; // Scaling factor
    }
  }
}

export default SoundManager;
