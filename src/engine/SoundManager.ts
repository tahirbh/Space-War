// ALPHA BLADE - Sound Manager
// High-Fidelity Audio Engine using requested MP3 assets

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted = false;
  private musicSources: AudioBufferSourceNode[] = [];
  private audioBuffers: Map<string, AudioBuffer> = new Map();

  // Unified Sound Mapping
  private readonly SOUNDS = {
    shoot: { file: '/audio/shoot.mp3' },
    bomb: { file: '/audio/bomb.mp3' },
    gameStart: { file: '/audio/startup.mp3' },
    intro: { file: '/audio/Intro_conversation.mp3' },
    welcome: { file: '/audio/welcoming_conversation.mp3' },
    boss: { file: '/audio/Boss.mp3' },
    stage: { file: '/audio/music_stage.mp3' },
    // Compatibility keys to prevent TS errors in existing components
    menuSelect: { file: '' }, 
    menuNavigate: { file: '' },
    powerUp: { file: '' },
    stageClear: { file: '' },
    gameOver: { file: '' },
    explosion: { file: '/audio/bomb.mp3' },
    enemyShoot: { file: '/audio/shoot.mp3' },
    hit: { file: '' }
  };

  constructor() {
    this.init();
    this.loadAllSounds();
  }

  private async loadAllSounds(): Promise<void> {
    const soundFiles = [
      { name: 'shoot', url: '/audio/shoot.mp3' },
      { name: 'bomb', url: '/audio/bomb.mp3' },
      { name: 'gameStart', url: '/audio/startup.mp3' },
      { name: 'intro', url: '/audio/Intro_conversation.mp3' },
      { name: 'welcome', url: '/audio/welcoming_conversation.mp3' },
      { name: 'boss', url: '/audio/Boss.mp3' },
      { name: 'stage', url: '/audio/music_stage.mp3' },
    ];

    for (const s of soundFiles) {
      try {
        const response = await fetch(s.url);
        if (!response.ok) continue;
        const arrayBuffer = await response.arrayBuffer();
        if (this.audioContext) {
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.audioBuffers.set(s.name, audioBuffer);
        }
      } catch (e) {
        console.warn(`Could not load sound: ${s.name}`);
      }
    }
  }

  init(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.audioContext.destination);

      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = 0.4;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = 0.6;
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

    const buffer = this.audioBuffers.get(name as string);
    if (buffer) {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      const gain = this.audioContext.createGain();
      
      let volume = 0.5;
      if (name === 'bomb') volume = 0.8;
      if (name === 'shoot') volume = 0.3;
      if (name === 'gameStart' || name === 'intro' || name === 'welcome') volume = 1.0;
      
      gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
      source.connect(gain);
      gain.connect(this.sfxGain!);
      source.start(0);
    }
  }

  startMenuMusic(): void {
    // Menu music logic moved to IntroStory / Startup
    this.stopMusic();
  }

  startMissionMusic(): void {
    this.startStageMusic();
  }

  startIntroMusic(): void {
    this.stopMusic();
    this.playLoop('intro');
  }

  startStageMusic(_stageNum?: number): void {
    this.stopMusic();
    this.playLoop('stage');
  }

  startBossMusic(): void {
    this.stopMusic();
    this.playLoop('boss');
  }

  playBossWarning(): void {
    this.startBossMusic();
  }

  private playLoop(name: string): void {
    if (!this.audioContext || this.isMuted) return;
    const buffer = this.audioBuffers.get(name);
    if (buffer) {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(this.musicGain!);
      source.start(0);
      this.musicSources.push(source);
    }
  }

  stopMusic(): void {
    this.musicSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    this.musicSources = [];
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
      this.musicGain.gain.value = volume * 0.4;
    }
  }

  setSFXVolume(volume: number): void {
    if (this.sfxGain) {
      this.sfxGain.gain.value = volume * 0.6;
    }
  }
}

export default SoundManager;
