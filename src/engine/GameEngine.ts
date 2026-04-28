import type { 
  Player, Bullet, Enemy, Boss, PowerUp, Particle, Explosion,
  GameStats, Stage, InputState, EnemyType, BossType, PowerUpType 
} from '@/types/game';
import { SoundManager } from './SoundManager';
import { v4 as uuidv4 } from 'uuid';

// Game constants
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const PLAYER_SPEED = 6;

// Base entity interface for collision
interface Entity {
  position: { x: number; y: number };
  width: number;
  height: number;
}

// Touch input state
export interface TouchState {
  joystick: { x: number; y: number; active: boolean; originX: number; originY: number };
  fireButton: { active: boolean };
  bombButton: { active: boolean };
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  soundManager: SoundManager;
  
  // Game state
  isRunning = false;
  isPaused = false;
  lastTime = 0;
  deltaTime = 0;
  gameTime = 0;
  
  // Entities
  player1: Player | null = null;
  player2: Player | null = null;
  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  boss: Boss | null = null;
  powerUps: PowerUp[] = [];
  particles: Particle[] = [];
  explosions: Explosion[] = [];
  
  // Beam system
  beamActive = false;
  beamTimer = 0;
  beamDamageTick = 0;
  
  // Game stats
  stats: GameStats = {
    score: 0,
    highScore: 0,
    stage: 1,
    enemiesKilled: 0,
    startTime: 0,
    coins: 0,
  };
  
  // Stage management
  currentStage: Stage;
  stageTime = 0;
  enemySpawnTimer = 0;
  bossSpawned = false;
  bossDefeated = false;
  bossWarningShown = false;
  intermission = false;
  intermissionTimer = 0;
  tankerJet = { x: CANVAS_WIDTH + 500, y: 100, active: false, pipeLen: 0, docking: false };
  
  // Input
  input1: InputState = { up: false, down: false, left: false, right: false, shoot: false, bomb: false };
  input2: InputState = { up: false, down: false, left: false, right: false, shoot: false, bomb: false };
  
  // Touch controls
  touchState: TouchState = {
    joystick: { x: 0, y: 0, active: false, originX: 0, originY: 0 },
    fireButton: { active: false },
    bombButton: { active: false },
  };
  isTouchDevice = false;
  
  // Callbacks
  onScoreUpdate?: (score: number) => void;
  onStageComplete?: () => void;
  onGameOver?: () => void;
  onPlayer2Join?: () => void;
  onPlayer2Leave?: () => void;
  onBossWarning?: () => void;
  onIntermissionStart?: () => void;
  onAddCoins?: (amount: number) => void;
  onPlayerStatsUpdate?: (stats: { p1: any, p2: any }) => void;
  
  // Character dialogues
  dialogueActive = false;
  currentDialogueIndex = 0;
  
  // Background scroll
  bgOffset = 0;
  stars: { x: number; y: number; size: number; speed: number; brightness: number; color: string }[] = [];
  nebulas: { x: number; y: number; radius: number; color: string; alpha: number }[] = [];
  groundFixtures: { x: number; y: number; width: number; height: number; type: number; speed: number }[] = [];
  clouds: { x: number; y: number; width: number; height: number; speed: number; opacity: number }[] = [];
  cityBuildings: { x: number; width: number; height: number; color: string; speed: number; windows: {x:number, y:number, on:boolean}[] }[] = [];
  oceanWaves: { x: number; y: number; width: number; speed: number; opacity: number }[] = [];
  jungleTrees: { x: number; y: number; width: number; height: number; speed: number; color: string }[] = [];
  
  // Screen shake
  shakeIntensity = 0;
  shakeDecay = 0.9;

  constructor(canvas: HTMLCanvasElement, soundManager?: SoundManager) {
    this.canvas = canvas;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    
    // Initialize sound
    this.soundManager = soundManager || new SoundManager();
    
    // Initialize stage
    this.currentStage = this.getStage(1);
    
    // Generate background
    this.generateStars();
    this.generateNebulas();
    this.generateGroundFixtures();
    this.generateClouds();
    this.generateCityBuildings();
    this.generateOceanWaves();
    this.generateJungle();
    
    // Detect touch device
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Bind methods
    this.gameLoop = this.gameLoop.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    
    // Setup touch listeners
    this.setupTouchListeners();
  }

  private setupTouchListeners(): void {
    if (!this.isTouchDevice) return;
    
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      // Left side = joystick area
      if (x < CANVAS_WIDTH * 0.4) {
        this.touchState.joystick.active = true;
        this.touchState.joystick.originX = x;
        this.touchState.joystick.originY = y;
        this.touchState.joystick.x = x;
        this.touchState.joystick.y = y;
      }
      // Right side buttons
      else if (x > CANVAS_WIDTH * 0.7) {
        if (y > CANVAS_HEIGHT * 0.6) {
          this.touchState.fireButton.active = true;
          this.input1.shoot = true;
        } else if (y > CANVAS_HEIGHT * 0.3 && y < CANVAS_HEIGHT * 0.5) {
          this.touchState.bombButton.active = true;
          this.input1.bomb = true;
        }
      }
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.touchState.joystick.active) return;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      // Update joystick position
      if (x < CANVAS_WIDTH * 0.4) {
        this.touchState.joystick.x = x;
        this.touchState.joystick.y = y;

        // Calculate direction
        const dx = x - this.touchState.joystick.originX;
        const dy = y - this.touchState.joystick.originY;
        const maxDist = 60;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          const normalizedX = dx / Math.max(dist, maxDist);
          const normalizedY = dy / Math.max(dist, maxDist);
          
          this.input1.right = normalizedX > 0.3;
          this.input1.left = normalizedX < -0.3;
          this.input1.down = normalizedY > 0.3;
          this.input1.up = normalizedY < -0.3;
        }
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const x = (touch.clientX - rect.left) * scaleX;

      // Reset joystick if released
      if (x < CANVAS_WIDTH * 0.4) {
        this.touchState.joystick.active = false;
        this.input1.up = false;
        this.input1.down = false;
        this.input1.left = false;
        this.input1.right = false;
      }
      // Reset buttons
      else if (x > CANVAS_WIDTH * 0.7) {
        this.touchState.fireButton.active = false;
        this.touchState.bombButton.active = false;
        this.input1.shoot = false;
        this.input1.bomb = false;
      }
    }
  }

  private generateStars(): void {
    const colors = ['#FFFFFF', '#FFE4B5', '#B0E0E6', '#FFB6C1'];
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 3 + 0.5,
        brightness: Math.random(),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  private generateNebulas(): void {
    const colors = ['rgba(138, 43, 226, 0.1)', 'rgba(0, 191, 255, 0.08)', 'rgba(255, 20, 147, 0.06)'];
    for (let i = 0; i < 5; i++) {
      this.nebulas.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        radius: Math.random() * 200 + 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.3 + 0.1,
      });
    }
  }

  private generateGroundFixtures(): void {
    for (let i = 0; i < 6; i++) {
      this.groundFixtures.push({
        x: (CANVAS_WIDTH / 6) * i + Math.random() * 200,
        y: CANVAS_HEIGHT - 50 - Math.random() * 100,
        width: 100 + Math.random() * 200,
        height: 50 + Math.random() * 150,
        type: Math.floor(Math.random() * 3),
        speed: 1.5 + Math.random() * 1,
      });
    }
  }

  private generateClouds(): void {
    for (let i = 0; i < 15; i++) {
      this.clouds.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * (CANVAS_HEIGHT * 0.7),
        width: 100 + Math.random() * 200,
        height: 40 + Math.random() * 60,
        speed: 0.5 + Math.random() * 1.5,
        opacity: 0.3 + Math.random() * 0.4,
      });
    }
  }

  private generateCityBuildings(): void {
    let currentX = 0;
    while (currentX < CANVAS_WIDTH + 300) {
      const width = 60 + Math.random() * 100;
      const height = 150 + Math.random() * 300;
      const windows = [];
      for(let wy = 20; wy < height - 20; wy += 30) {
        for(let wx = 10; wx < width - 10; wx += 20) {
          windows.push({ x: wx, y: wy, on: Math.random() > 0.3 });
        }
      }
      this.cityBuildings.push({
        x: currentX,
        width,
        height,
        color: `hsl(${220 + Math.random() * 40}, 30%, ${10 + Math.random() * 15}%)`,
        speed: 2 + Math.random() * 0.5,
        windows
      });
      currentX += width + (Math.random() * 20);
    }
  }

  private generateOceanWaves(): void {
    for (let i = 0; i < 30; i++) {
      this.oceanWaves.push({
        x: Math.random() * CANVAS_WIDTH,
        y: CANVAS_HEIGHT - 150 + Math.random() * 150,
        width: 50 + Math.random() * 100,
        speed: 1 + Math.random() * 2,
        opacity: 0.2 + Math.random() * 0.5,
      });
    }
  }

  private generateJungle(): void {
    for (let i = 0; i < 40; i++) {
      this.jungleTrees.push({
        x: Math.random() * CANVAS_WIDTH * 2,
        y: CANVAS_HEIGHT - 100 - Math.random() * 200,
        width: 30 + Math.random() * 50,
        height: 150 + Math.random() * 200,
        speed: 1.5 + Math.random() * 2,
        color: `hsl(${100 + Math.random() * 40}, ${40 + Math.random() * 30}%, ${15 + Math.random() * 15}%)`,
      });
    }
  }

  private getStage(stageNum: number): Stage {
    const stages: Stage[] = [
      { id: 1, name: 'DEEP SPACE', duration: 60, enemySpawnRate: 4.0, bossSpawnTime: 55, backgroundType: 'space' },
      { id: 2, name: 'ASTEROID BELT', duration: 75, enemySpawnRate: 1.2, bossSpawnTime: 70, backgroundType: 'asteroid' },
      { id: 3, name: 'ENEMY BASE', duration: 90, enemySpawnRate: 0.8, bossSpawnTime: 85, backgroundType: 'base' },
      { id: 4, name: 'AMAZON JUNGLE', duration: 100, enemySpawnRate: 1.5, bossSpawnTime: 95, backgroundType: 'jungle' },
    ];
    return stages[(stageNum - 1) % stages.length];
  }

  spawnPlayer1(): Player {
    const player: Player = {
      id: 'player1',
      position: { x: 100, y: CANVAS_HEIGHT / 2 },
      velocity: { x: 0, y: 0 },
      width: 40,
      height: 30,
      active: true,
      playerNumber: 1,
      health: 3,
      maxHealth: 3,
      lives: 3,
      powerLevel: 1,
      bombs: 90,
      speed: PLAYER_SPEED,
      weaponType: 'laser',
      invincible: false,
      invincibleTime: 0,
      targetPosition: { x: 100, y: CANVAS_HEIGHT / 2 },
      lastShot: 0,
      lastBombTime: 0,
    } as any;

    this.player1 = player;

    // Force weapon type from store/selection
    const store = (window as any).gameStore;
    if (store && store.selectedWeapon) {
      player.weaponType = store.selectedWeapon;
    }
    
    return player;
  }

  spawnPlayer2(): Player {
    const player: Player = {
      id: 'player2',
      position: { x: 100, y: CANVAS_HEIGHT / 2 + 60 },
      velocity: { x: 0, y: 0 },
      width: 40,
      height: 30,
      active: true,
      playerNumber: 2,
      health: 3,
      maxHealth: 3,
      lives: 3,
      powerLevel: 1,
      bombs: 90,
      speed: PLAYER_SPEED,
      weaponType: 'laser',
      invincible: true,
      invincibleTime: 3000,
      targetPosition: { x: 100, y: CANVAS_HEIGHT / 2 + 60 },
      lastShot: 0,
      lastBombTime: 0,
    } as any;

    this.player2 = player;
    this.onPlayer2Join?.();
    return player;
  }

  removePlayer2(): void {
    this.player2 = null;
    this.onPlayer2Leave?.();
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.stats.startTime = Date.now();
    this.lastTime = performance.now();
    this.soundManager.resume();
    this.soundManager.startStageMusic(this.stats.stage);
    requestAnimationFrame(this.gameLoop);
  }

  pause(): void {
    this.isPaused = !this.isPaused;
  }

  stop(): void {
    this.isRunning = false;
    this.soundManager.stopMusic();
  }

  reset(): void {
    this.bullets = [];
    this.enemies = [];
    this.boss = null;
    this.powerUps = [];
    this.particles = [];
    this.explosions = [];
    this.beamActive = false;
    this.stats = {
      score: 0,
      highScore: this.stats.highScore,
      stage: 1,
      enemiesKilled: 0,
      startTime: Date.now(),
      coins: 0,
    };
    this.stageTime = 0;
    this.enemySpawnTimer = -1;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossWarningShown = false;
    this.intermission = false;
    this.intermissionTimer = 0;
    this.tankerJet.active = false;
    this.currentStage = this.getStage(1);
    this.spawnPlayer1();
  }

  nextStage(): void {
    this.stats.stage++;
    this.currentStage = this.getStage(this.stats.stage);
    this.stageTime = 0;
    this.enemySpawnTimer = -3;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossWarningShown = false;
    this.intermission = false;
    this.intermissionTimer = 0;
    this.tankerJet.active = false;
    this.enemies = [];
    this.bullets = this.bullets.filter(b => b.owner !== 'enemy');
    this.soundManager.playSound('stageClear');
    this.soundManager.startStageMusic(this.stats.stage);
    this.onStageComplete?.();
  }

  private gameLoop(currentTime: number): void {
    if (!this.isRunning) return;

    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.update(this.deltaTime);
      this.render();
    }

    requestAnimationFrame(this.gameLoop);
  }

  private update(dt: number): void {
    const dtSeconds = dt / 1000;
    this.gameTime += dt;
    this.stageTime += dtSeconds;

    // Update screen shake
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= this.shakeDecay;
      if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
    }

    // Update background
    this.bgOffset += 80 * dtSeconds;
    this.groundFixtures.forEach(fix => {
      fix.x -= fix.speed * (dt / 16);
      if (fix.x + fix.width < 0) {
        fix.x = CANVAS_WIDTH + Math.random() * 500;
        fix.y = CANVAS_HEIGHT - 50 - Math.random() * 100;
      }
    });

    // Update background objects
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed * (dt / 16);
      if (cloud.x + cloud.width < 0) {
        cloud.x = CANVAS_WIDTH + Math.random() * 200;
        cloud.y = Math.random() * (CANVAS_HEIGHT * 0.7);
      }
    });

    this.cityBuildings.forEach(b => {
      b.x -= b.speed * (dt / 16);
      if (b.x + b.width < 0) {
        b.x = CANVAS_WIDTH + Math.random() * 100;
      }
    });

    this.oceanWaves.forEach(wave => {
      wave.x -= wave.speed * (dt / 16);
      if (wave.x + wave.width < 0) {
        wave.x = CANVAS_WIDTH + Math.random() * 100;
      }
    });

    this.jungleTrees.forEach(tree => {
      tree.x -= tree.speed * (dt / 16);
      if (tree.x + tree.width < 0) {
        tree.x = CANVAS_WIDTH + Math.random() * 100;
      }
    });

    // Update players
    this.updatePlayer(this.player1, this.input1, dt);
    this.updatePlayer(this.player2, this.input2, dt);

    // Spawn enemies
    this.updateEnemySpawning(dt);

    // Update entities
    this.updateBullets(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updatePowerUps(dt);
    this.updateParticles(dt);
    this.updateExplosions(dt);

    // Check collisions
    this.checkCollisions();

    // Check stage progression
    if (this.intermission) {
      this.intermissionTimer += dtSeconds;
      
      // Zero inputs to prevent player wandering during cinematic
      if (this.player1) { this.input1.up = false; this.input1.down = false; this.input1.left = false; this.input1.right = false; this.input1.shoot = false; this.input1.bomb = false; }
      if (this.player2) { this.input2.up = false; this.input2.down = false; this.input2.left = false; this.input2.right = false; this.input2.shoot = false; this.input2.bomb = false; }
      
      this.tankerJet.active = true;

      // Tanker Jet flying in from right
      if (this.intermissionTimer < 2) {
         this.tankerJet.x = CANVAS_WIDTH + 500 - (this.intermissionTimer * 400);
         this.tankerJet.y = 100;
      } else {
         this.tankerJet.x = CANVAS_WIDTH - 400;
      }
      
      // Pipe releasing
      if (this.intermissionTimer > 2.5 && this.intermissionTimer < 4) {
         this.tankerJet.pipeLen = Math.min(100, (this.intermissionTimer - 2.5) * 80);
      }
      
      // Players flying to tanker
      if (this.intermissionTimer > 3 && this.intermissionTimer < 6) {
         const targetX = this.tankerJet.x - 50;
         const targetY = this.tankerJet.y + 120;
         if (this.player1 && this.player1.active) {
            this.player1.position.x += (targetX - this.player1.position.x) * (dt/800);
            this.player1.position.y += (targetY - this.player1.position.y) * (dt/800);
         }
         if (this.player2 && this.player2.active) {
            this.player2.position.x += (targetX - 50 - this.player2.position.x) * (dt/800);
            this.player2.position.y += (targetY + 40 - this.player2.position.y) * (dt/800);
         }
      }
      
      // Refuel and speed off
      if (this.intermissionTimer >= 8 && this.intermissionTimer < 10) {
         if (this.intermissionTimer < 8.05) {
            if (this.player1) { this.player1.health = this.player1.maxHealth; this.player1.bombs = 90; }
            if (this.player2) { this.player2.health = this.player2.maxHealth; this.player2.bombs = 90; }
            this.soundManager.playSound('powerUp');
         }
         // All move together to the right
         const speed = 10 * (dt/16);
         this.tankerJet.x += speed;
         if (this.player1 && this.player1.active) this.player1.position.x += speed;
         if (this.player2 && this.player2.active) this.player2.position.x += speed;
      }

      if (this.intermissionTimer > 10) {
         if (this.player1) this.player1.position.x = 100;
         if (this.player2) this.player2.position.x = 100;
         this.intermission = false;
         this.intermissionTimer = 0;
         this.tankerJet.active = false;
         this.tankerJet.pipeLen = 0;
         this.onIntermissionStart?.(); 
      }
    } else {
      if (this.bossSpawned && !this.boss && this.enemies.length === 0) {
        if (this.stageTime > this.currentStage.bossSpawnTime + 2) {
          this.intermission = true;
          this.intermissionTimer = 0;
          this.bullets = [];
        }
      }
    }

    // Trigger HUD update
    this.onPlayerStatsUpdate?.({
      p1: this.player1 ? { lives: this.player1.lives, bombs: this.player1.bombs, power: this.player1.powerLevel } : null,
      p2: this.player2 ? { lives: this.player2.lives, bombs: this.player2.bombs, power: this.player2.powerLevel } : null,
    });
  }

  private updatePlayer(player: Player | null, input: InputState, dt: number): void {
    if (!player || !player.active) return;

    // Update invincibility
    if (player.invincible) {
      player.invincibleTime -= dt;
      if (player.invincibleTime <= 0) {
        player.invincible = false;
      }
    }

    // Movement
    let dx = 0;
    let dy = 0;
    if (input.up) dy = -1;
    if (input.down) dy = 1;
    if (input.left) dx = -1;
    if (input.right) dx = 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    player.position.x += dx * player.speed * (dt / 16);
    player.position.y += dy * player.speed * (dt / 16);

    player.position.x = Math.max(20, Math.min(CANVAS_WIDTH - 60, player.position.x));
    player.position.y = Math.max(20, Math.min(CANVAS_HEIGHT - 40, player.position.y));

    // Weapon shooting
    if (input.shoot && player.active) {
      const now = Date.now();
      const fireDelay = player.weaponType === 'laser' ? 100 : 180; // Rapid fire for laser
      
      if (now - player.lastShot > fireDelay) {
        player.lastShot = now;
        this.shootProjectileWeapon(player);
      }
      
      if (player.weaponType === 'laser') {
        this.beamActive = true;
      }
    } else {
      this.beamActive = false;
    }

    // Bomb
    const now = Date.now();
    if (input.bomb && player.bombs > 0 && now - (player as any).lastBombTime > 300) {
      this.useBomb(player);
      (player as any).lastBombTime = now;
      input.bomb = false;
    }
  }

  private shootProjectileWeapon(player: Player): void {
    this.soundManager.playSound('shoot');
    const bY = player.position.y + player.height / 2;
    const bX = player.position.x + player.width;
    const speed = 15;
    const isBooster = player.weaponType === 'booster';
    const isHoming = player.weaponType === 'homing';
    const isLaser = player.weaponType === 'laser';
    const dmg = player.powerLevel;
    
    if (isBooster) {
      // Booster: Fast, high damage, multiple inline
      this.bullets.push({
        id: uuidv4(), position: { x: bX, y: bY },
        velocity: { x: speed * 1.5, y: 0 }, width: 14 + dmg * 2, height: 4 + dmg,
        active: true, owner: `player${player.playerNumber}` as 'player1' | 'player2',
        damage: dmg * 1.5, color: '#00FF00'
      });
    } else if (isHoming) {
      // Homing Missile: Starts slow, speeds up and tracks
      const ways = dmg >= 4 ? 3 : dmg >= 2 ? 2 : 1;
      for (let i = 0; i < ways; i++) {
        const angle = ways > 1 ? (i - (ways - 1) / 2) * 0.4 : 0;
        this.bullets.push({
          id: uuidv4(), 
          position: { x: bX, y: bY },
          velocity: { x: Math.cos(angle) * 8, y: Math.sin(angle) * 8 },
          width: 12, height: 6,
          active: true, 
          owner: `player${player.playerNumber}` as 'player1' | 'player2',
          damage: dmg * 1.2, 
          color: '#FF6600',
          isHoming: true,
          targetId: null
        });
      }
    } else if (isLaser) {
      // Rapid Fire Laser: Twin parallel beams
      const offsets = [-8, 8];
      offsets.forEach(offset => {
        this.bullets.push({
          id: uuidv4(), 
          position: { x: bX, y: bY + offset },
          velocity: { x: speed * 2, y: 0 }, 
          width: 20, height: 3,
          active: true, 
          owner: `player${player.playerNumber}` as 'player1' | 'player2',
          damage: dmg * 0.8, 
          color: player.playerNumber === 1 ? '#00FFFF' : '#FF66AA'
        });
      });
    }
  }


  private useBomb(player: Player): void {
    player.bombs--;
    this.shakeIntensity = 25;
    this.soundManager.playSound('bomb');

    // Clear all enemy bullets
    this.bullets = this.bullets.filter(b => b.owner !== 'enemy');

    // Damage all enemies
    this.enemies.forEach(enemy => {
      enemy.health -= 10;
      if (enemy.health <= 0) {
        this.destroyEnemy(enemy);
      }
    });

    if (this.boss) {
      this.boss.health -= 20;
      if (this.boss.health <= 0) {
        this.destroyBoss();
      }
    }

    this.createExplosion(player.position.x + 200, player.position.y, 200, '#00FFFF');
  }

  private updateEnemySpawning(dt: number): void {
    if (this.boss) return;

    this.enemySpawnTimer += dt / 1000;

    // Boss warning
    if (!this.bossWarningShown && this.stageTime >= this.currentStage.bossSpawnTime - 5) {
      this.bossWarningShown = true;
      this.onBossWarning?.();
      this.soundManager.playBossWarning();
    }

    // Spawn boss
    if (!this.bossSpawned && !this.bossDefeated && this.stageTime >= this.currentStage.bossSpawnTime) {
      this.spawnBoss();
      return;
    }

    // Skip spawning if boss is alive or recently defeated/intermission
    if (this.boss || this.bossDefeated || this.intermission) return;

    // Spawn regular enemies
    if (this.enemySpawnTimer >= this.currentStage.enemySpawnRate) {
      this.enemySpawnTimer = 0;
      this.spawnEnemy();
    }
  }

  private spawnEnemy(): void {
    const types: EnemyType[] = ['grunt', 'interceptor', 'bomber', 'elite'];
    const weights = [0.5, 0.3, 0.15, 0.05];
    
    let random = Math.random();
    let type: EnemyType = 'grunt';
    let cumulative = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        type = types[i];
        break;
      }
    }

    if (this.stats.stage === 4 && Math.random() < 0.3) {
      type = 'tank';
    }

    const enemy = this.createEnemy(type);
    this.enemies.push(enemy);
  }

  private createEnemy(type: EnemyType): Enemy {
    const y = type === 'tank' ? CANVAS_HEIGHT - 60 : Math.random() * (CANVAS_HEIGHT - 100) + 50;
    
    const enemyData: Record<EnemyType, { health: number; score: number; width: number; height: number }> = {
      grunt: { health: 3, score: 100, width: 30, height: 25 },
      interceptor: { health: 6, score: 300, width: 35, height: 30 },
      bomber: { health: 15, score: 500, width: 45, height: 40 },
      elite: { health: 30, score: 1000, width: 50, height: 45 },
      tank: { health: 20, score: 800, width: 60, height: 40 },
    };

    const data = enemyData[type];

    return {
      id: uuidv4(),
      position: { x: CANVAS_WIDTH + 50, y },
      velocity: { x: -2, y: 0 },
      width: data.width,
      height: data.height,
      active: true,
      type,
      health: data.health,
      maxHealth: data.health,
      scoreValue: data.score,
      // Increased cooldowns for easier gameplay (was 1500-3000ms)
      shootCooldown: type === 'grunt' ? 4000 : type === 'interceptor' ? 3000 : type === 'tank' ? 2500 : 5000,
      lastShot: Date.now() + Math.random() * 2000, // Initial delay
      pattern: type === 'grunt' ? 'linear' : type === 'interceptor' ? 'tracking' : type === 'bomber' ? 'hover' : type === 'tank' ? 'linear' : 'sine',
      patternPhase: 0,
    };
  }

  private spawnBoss(): void {
    this.bossSpawned = true;
    const bossTypes: BossType[] = ['mantis', 'leviathan', 'omega'];
    const type = bossTypes[(this.stats.stage - 1) % 3];

    const bossData: Record<BossType, { health: number; score: number; width: number; height: number }> = {
      mantis: { health: 300, score: 10000, width: 120, height: 100 },
      leviathan: { health: 500, score: 20000, width: 150, height: 120 },
      omega: { health: 800, score: 50000, width: 180, height: 140 },
    };

    const data = bossData[type];

    this.boss = {
      id: 'boss',
      position: { x: CANVAS_WIDTH + 100, y: CANVAS_HEIGHT / 2 },
      velocity: { x: -1, y: 0 },
      width: data.width,
      height: data.height,
      active: true,
      type,
      health: data.health,
      maxHealth: data.health,
      phase: 1,
      maxPhases: 3,
      attackCooldown: 2000,
      lastAttack: 0,
      scoreValue: data.score,
    };

    this.shakeIntensity = 20;
  }

  private updateBullets(dt: number): void {
    const dtFactor = dt / 16;
    this.bullets = this.bullets.filter(bullet => {
      if (!bullet.active) return false;

      // Homing logic
      if (bullet.isHoming && bullet.owner !== 'enemy') {
        // Find target if none
        if (!bullet.targetId) {
          let nearestDist = 800;
          let nearest: Enemy | Boss | null = null;

          this.enemies.forEach(e => {
            const dist = Math.hypot(e.position.x - bullet.position.x, e.position.y - bullet.position.y);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearest = e;
            }
          });

          if (this.boss) {
            const dist = Math.hypot(this.boss.position.x - bullet.position.x, this.boss.position.y - bullet.position.y);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearest = this.boss;
            }
          }

          if (nearest) {
            bullet.targetId = (nearest as any).id;
          }
        }

        // Steer towards target
        const target = bullet.targetId === 'boss' ? this.boss : this.enemies.find(e => e.id === bullet.targetId);
        if (target && target.active) {
          const targetX = target.position.x + target.width / 2;
          const targetY = target.position.y + target.height / 2;
          const dx = targetX - bullet.position.x;
          const dy = targetY - bullet.position.y;
          const targetAngle = Math.atan2(dy, dx);
          const currentAngle = Math.atan2(bullet.velocity.y, bullet.velocity.x);
          
          let angleDiff = targetAngle - currentAngle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          const turnRate = 0.15 * dtFactor;
          const newAngle = currentAngle + Math.max(-turnRate, Math.min(turnRate, angleDiff));
          const speed = Math.hypot(bullet.velocity.x, bullet.velocity.y);
          const newSpeed = Math.min(20, speed + 0.2 * dtFactor); // Accelerate

          bullet.velocity.x = Math.cos(newAngle) * newSpeed;
          bullet.velocity.y = Math.sin(newAngle) * newSpeed;
          
          // Rotate bullet visual (if height/width used for orientation)
          if (bullet.width > bullet.height) {
            // Keep it simple for now, but missiles usually look better pointed at target
          }
        } else {
          bullet.targetId = null; // Target lost
          // Accelerate forward anyway
          const speed = Math.hypot(bullet.velocity.x, bullet.velocity.y);
          const factor = (speed + 0.1 * dtFactor) / speed;
          bullet.velocity.x *= factor;
          bullet.velocity.y *= factor;
        }
      }

      bullet.position.x += bullet.velocity.x * dtFactor;
      bullet.position.y += bullet.velocity.y * dtFactor;

      if (bullet.position.x < -50 || bullet.position.x > CANVAS_WIDTH + 100 ||
          bullet.position.y < -50 || bullet.position.y > CANVAS_HEIGHT + 50) {
        return false;
      }

      return true;
    });
  }

  private updateEnemies(dt: number): void {
    const now = Date.now();

    // Force clear enemies if boss is defeated or in intermission
    if (this.bossDefeated || this.intermission) {
      this.enemies = [];
      this.bullets = this.bullets.filter(b => b.owner !== 'enemy');
      return;
    }

    this.enemies = this.enemies.filter(enemy => {
      if (!enemy.active) return false;

      enemy.patternPhase += dt / 1000;

      switch (enemy.pattern) {
        case 'linear':
          enemy.position.x -= 3 * (dt / 16);
          break;
        case 'sine':
          enemy.position.x -= 2 * (dt / 16);
          enemy.position.y += Math.sin(enemy.patternPhase * 2) * 2;
          break;
        case 'tracking':
          enemy.position.x -= 2.5 * (dt / 16);
          const target = this.player1 || this.player2;
          if (target) {
            const dy = target.position.y - enemy.position.y;
            enemy.position.y += Math.sign(dy) * 1.5 * (dt / 16);
          }
          break;
        case 'hover':
          enemy.position.x = CANVAS_WIDTH - 150 + Math.sin(enemy.patternPhase) * 50;
          enemy.position.y += Math.sin(enemy.patternPhase * 1.5) * 1;
          break;
      }

      if (now - enemy.lastShot > enemy.shootCooldown) {
        enemy.lastShot = now;
        this.enemyShoot(enemy);
      }

      if (enemy.position.x < -100) return false;

      return true;
    });
  }

  private enemyShoot(enemy: Enemy): void {
    this.soundManager.playSound('enemyShoot');
    
    let targetPlayer: Player | null = null;
    let minDiff = Infinity;
    [this.player1, this.player2].forEach(p => {
      if (p && p.active) {
        const dist = Math.hypot(p.position.x - enemy.position.x, p.position.y - enemy.position.y);
        if (dist < minDiff) {
          minDiff = dist;
          targetPlayer = p as Player;
        }
      }
    });

    let targetAngle = Math.PI; // Default shoot left
    if (this.stats.stage > 1 && targetPlayer) { // Only track if stage > 1
      const tp = targetPlayer as Player;
      targetAngle = Math.atan2(
        tp.position.y + tp.height / 2 - (enemy.position.y + enemy.height / 2),
        tp.position.x + tp.width / 2 - enemy.position.x
      );
    }
    
    // Rebalanced: Slower bullets and single shots
    let speed = 4 + (this.stats.stage * 0.5); // Much slower than before (was 7.5+)
    
    // Stage 1 kids friendly balance
    if (this.stats.stage === 1) {
      speed = 2; // Very slow
      targetAngle = Math.PI; // Strictly horizontal
    }
    
    // Tank logic (stage 4)
    if (enemy.type === 'tank') {
      targetAngle = -Math.PI / 2; // Straight up
      speed = 3; // Very slow moving upwards
    }

    let numBullets = 1; // Always 1 for base performance
    
    if (enemy.type === 'elite' && this.stats.stage > 1) {
       numBullets = 2; // Only elites get 2, but not in Stage 1
    }

    for (let i = 0; i < numBullets; i++) {
      const bulletAngle = numBullets > 1 ? targetAngle + (i - 0.5) * 0.2 : targetAngle;
      
      this.bullets.push({
        id: uuidv4(),
        position: { x: enemy.position.x, y: enemy.position.y + enemy.height / 2 },
        velocity: { 
          x: Math.cos(bulletAngle) * speed, 
          y: Math.sin(bulletAngle) * speed 
        },
        width: 16,
        height: 16,
        active: true,
        owner: 'enemy',
        damage: 1,
        color: '#FF3300',
      });
    }
  }

  private updateBoss(dt: number): void {
    if (!this.boss) return;

    const now = Date.now();

    if (this.boss.position.x > CANVAS_WIDTH - 200) {
      this.boss.position.x -= 1 * (dt / 16);
    } else {
      this.boss.position.y = CANVAS_HEIGHT / 2 + Math.sin(this.stageTime * 1.5) * 150;
    }

    const healthPercent = this.boss.health / this.boss.maxHealth;
    if (healthPercent < 0.33) {
      this.boss.phase = 3;
    } else if (healthPercent < 0.66) {
      this.boss.phase = 2;
    }

    if (now - this.boss.lastAttack > this.boss.attackCooldown / this.boss.phase) {
      this.boss.lastAttack = now;
      this.bossAttack();
    }
  }

  private bossAttack(): void {
    if (!this.boss) return;

    this.soundManager.playSound('enemyShoot');
    const centerX = this.boss.position.x + this.boss.width / 2;
    const centerY = this.boss.position.y + this.boss.height / 2;

    switch (this.boss.phase) {
      case 1:
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI + (i / 11) * Math.PI);
          this.bullets.push({
            id: uuidv4(),
            position: { x: centerX, y: centerY },
            velocity: { 
              x: Math.cos(angle) * 6, 
              y: Math.sin(angle) * 6 
            },
            width: 10,
            height: 10,
            active: true,
            owner: 'enemy',
            damage: 1,
            color: '#9D4EDD',
          });
        }
        break;
      case 2:
        for (let i = 0; i < 16; i++) {
          const angle = (this.stageTime * 3 + (i / 16) * Math.PI * 2);
          this.bullets.push({
            id: uuidv4(),
            position: { x: centerX, y: centerY },
            velocity: { 
              x: Math.cos(angle) * 5, 
              y: Math.sin(angle) * 5 
            },
            width: 8,
            height: 8,
            active: true,
            owner: 'enemy',
            damage: 1,
            color: '#FF00FF',
          });
        }
        break;
      case 3:
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2;
          this.bullets.push({
            id: uuidv4(),
            position: { x: centerX, y: centerY },
            velocity: { 
              x: Math.cos(angle) * 7, 
              y: Math.sin(angle) * 7 
            },
            width: 6,
            height: 6,
            active: true,
            owner: 'enemy',
            damage: 1,
            color: '#FF0000',
          });
        }
        break;
    }
  }

  private updatePowerUps(dt: number): void {
    this.powerUps = this.powerUps.filter(pu => {
      if (!pu.active) return false;
      pu.position.y += Math.sin(Date.now() / 500) * 0.5;
      pu.position.x -= 1 * (dt / 16);
      return pu.position.x > -50;
    });
  }

  private updateParticles(dt: number): void {
    this.particles = this.particles.filter(p => {
      if (!p.active) return false;
      p.life -= dt;
      p.alpha = p.life / p.maxLife;
      p.position.x += p.velocity.x * (dt / 16);
      p.position.y += p.velocity.y * (dt / 16);
      return p.life > 0;
    });
  }

  private updateExplosions(dt: number): void {
    this.explosions = this.explosions.filter(e => {
      if (!e.active) return false;
      e.life -= dt;
      e.radius = e.maxRadius * (1 - e.life / e.maxLife);
      return e.life > 0;
    });
  }

  private checkCollisions(): void {
    // Player bullets vs Enemies/Boss
    this.bullets.filter(b => b.owner !== 'enemy').forEach(bullet => {
      // Check enemies
      this.enemies.forEach(enemy => {
        if (enemy.active && this.checkRectCollision(bullet, enemy)) {
          bullet.active = false;
          enemy.health -= bullet.damage;
          this.createParticles(bullet.position.x, bullet.position.y, 3, bullet.color);
          if (enemy.health <= 0) {
            this.destroyEnemy(enemy);
          }
        }
      });

      // Check boss
      if (this.boss && this.boss.active && this.checkRectCollision(bullet, this.boss)) {
        bullet.active = false;
        this.boss.health -= bullet.damage;
        this.createParticles(bullet.position.x, bullet.position.y, 5, bullet.color);
        if (this.boss.health <= 0) {
          this.destroyBoss();
        }
      }
    });

    // Enemy bullets vs players
    this.bullets.filter(b => b.owner === 'enemy').forEach(bullet => {
      [this.player1, this.player2].forEach(player => {
        if (player && player.active && !player.invincible && this.checkRectCollision(bullet, player)) {
          bullet.active = false;
          this.damagePlayer(player);
        }
      });
    });

    // Enemies vs players (collision)
    this.enemies.forEach(enemy => {
      [this.player1, this.player2].forEach(player => {
        if (player && player.active && !player.invincible && this.checkRectCollision(enemy, player)) {
          enemy.health = 0;
          this.destroyEnemy(enemy);
          this.damagePlayer(player);
        }
      });
    });

    // Power-ups vs players
    this.powerUps.forEach(pu => {
      [this.player1, this.player2].forEach(player => {
        if (player && player.active && this.checkRectCollision(pu, player)) {
          pu.active = false;
          this.collectPowerUp(player, pu.type);
        }
      });
    });
  }

  private checkRectCollision(a: Entity, b: Entity): boolean {
    return a.position.x < b.position.x + b.width &&
           a.position.x + a.width > b.position.x &&
           a.position.y < b.position.y + b.height &&
           a.position.y + a.height > b.position.y;
  }

  private damagePlayer(player: Player): void {
    player.health--;
    this.shakeIntensity = 15;
    this.soundManager.playSound('hit');
    this.createExplosion(player.position.x, player.position.y, 60, '#00D4FF');

    if (player.health <= 0) {
      player.lives--;
      if (player.lives > 0) {
        player.health = player.maxHealth;
        player.powerLevel = Math.max(1, player.powerLevel - 1);
        player.invincible = true;
        player.invincibleTime = 3000;
        player.position = { x: 100, y: CANVAS_HEIGHT / 2 + (player.playerNumber === 1 ? 0 : 60) };
      } else {
        player.active = false;
        this.soundManager.playSound('gameOver');
        if ((!this.player1 || !this.player1.active) && (!this.player2 || !this.player2.active)) {
          this.onGameOver?.();
        }
      }
    }
  }

  private destroyEnemy(enemy: Enemy): void {
    enemy.active = false;
    this.stats.score += enemy.scoreValue;
    this.stats.enemiesKilled++;
    this.shakeIntensity = Math.min(this.shakeIntensity + 4, 20);
    this.soundManager.playSound('explosion');
    this.createExplosion(enemy.position.x, enemy.position.y, 50, '#FF6B35');
    this.createParticles(enemy.position.x, enemy.position.y, 20, '#FF6B35');

    if (Math.random() < 0.2) {
      this.spawnPowerUp(enemy.position.x, enemy.position.y);
    }

    this.onScoreUpdate?.(this.stats.score);
  }

  private destroyBoss(): void {
    if (!this.boss) return;
    this.stats.score += this.boss.scoreValue;
    this.onAddCoins?.(500); // Boss bonus
    this.shakeIntensity = 40;
    this.soundManager.playSound('explosion');
    this.createExplosion(this.boss.position.x, this.boss.position.y, 200, '#9D4EDD');
    this.createParticles(this.boss.position.x, this.boss.position.y, 80, '#9D4EDD');
    
    // Auto-destroy all other enemies
    this.enemies.forEach(e => {
      if (e.active) {
        e.health = 0;
        this.destroyEnemy(e);
      }
    });

    this.boss = null;
    this.bossDefeated = true;
    this.bullets = this.bullets.filter(b => b.owner !== 'enemy');
    this.onScoreUpdate?.(this.stats.score);
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['weapon', 'bomb', 'speed', 'life'];
    const weights = [0.5, 0.25, 0.15, 0.1];
    
    let random = Math.random();
    let type: PowerUpType = 'weapon';
    let cumulative = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        type = types[i];
        break;
      }
    }

    this.powerUps.push({
      id: uuidv4(),
      position: { x, y },
      velocity: { x: -1, y: 0 },
      width: 25,
      height: 25,
      active: true,
      type,
      value: type === 'power' ? 1 : type === 'bomb' ? 1 : type === 'speed' ? 0.5 : 1,
    });
  }

  private collectPowerUp(player: Player, type: PowerUpType): void {
    this.soundManager.playSound('powerUp');
    
    // Power-ups now grant coins instead of changing weapons/stats directly
    // EXCEPT for specific mechanic power-ups like life/bomb/speed
    switch (type) {
      case 'weapon':
      case 'power':
        this.onAddCoins?.(50);
        this.createParticles(player.position.x, player.position.y, 20, '#FFD700'); // Gold particles
        break;
      case 'bomb':
        player.bombs = Math.min(player.bombs + 1, 99);
        break;
      case 'speed':
        player.speed = Math.min(player.speed + 1, 10);
        break;
      case 'life':
        player.lives = Math.min(player.lives + 1, 5);
        break;
    }
  }

  private createParticles(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        id: uuidv4(),
        position: { x, y },
        velocity: { 
          x: Math.cos(angle) * speed, 
          y: Math.sin(angle) * speed 
        },
        width: 3,
        height: 3,
        active: true,
        life: Math.random() * 500 + 300,
        maxLife: 800,
        color,
        size: Math.random() * 4 + 1,
        alpha: 1,
      });
    }
  }

  private createExplosion(x: number, y: number, maxRadius: number, _color: string): void {
    this.explosions.push({
      id: uuidv4(),
      position: { x, y },
      velocity: { x: 0, y: 0 },
      width: maxRadius * 2,
      height: maxRadius * 2,
      active: true,
      radius: 0,
      maxRadius,
      life: 600,
      maxLife: 600,
    });
  }

  private render(): void {
    const ctx = this.ctx;
    
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Clear screen
    ctx.fillStyle = '#0A0A15';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    this.drawBackground(ctx);

    // Draw game entities
    this.drawPowerUps(ctx);
    this.drawBullets(ctx);
    this.drawEnemies(ctx);
    this.drawBoss(ctx);
    this.drawPlayers(ctx);
    this.drawParticles(ctx);
    this.drawExplosions(ctx);
    this.drawBeam(ctx);

    // Draw touch controls
    if (this.isTouchDevice) {
      this.drawTouchControls(ctx);
    }

    ctx.restore();
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const bgMode = this.currentStage.backgroundType || 'space';

    if (bgMode === 'space' || bgMode === 'asteroid' || bgMode === 'base') {
      // Draw nebulas
      this.nebulas.forEach(nebula => {
        const x = (nebula.x - this.bgOffset * 0.2) % (CANVAS_WIDTH + 400);
        const wrappedX = x < -200 ? x + CANVAS_WIDTH + 400 : x;
        
        const gradient = ctx.createRadialGradient(wrappedX, nebula.y, 0, wrappedX, nebula.y, nebula.radius);
        gradient.addColorStop(0, nebula.color.replace(/[\d.]+\)$/, `${nebula.alpha})`));
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(wrappedX, nebula.y, nebula.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw stars
      this.stars.forEach(star => {
        const x = (star.x - this.bgOffset * star.speed) % CANVAS_WIDTH;
        const wrappedX = x < 0 ? x + CANVAS_WIDTH : x;
        
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.brightness;
        ctx.beginPath();
        ctx.arc(wrappedX, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw ground fixtures
      ctx.fillStyle = '#1A1A2E';
      this.groundFixtures.forEach(fix => {
        ctx.beginPath();
        if (fix.type === 0) {
          ctx.fillRect(fix.x, fix.y, fix.width, CANVAS_HEIGHT - fix.y);
          ctx.fillStyle = '#00FFFF';
          for (let w = 10; w < fix.width - 10; w += 20) {
            if (w % 30 !== 0) ctx.fillRect(fix.x + w, fix.y + 20, 5, 10);
          }
          ctx.fillStyle = '#1A1A2E';
        } else if (fix.type === 1) {
          ctx.arc(fix.x + fix.width / 2, fix.y + fix.height / 2, fix.width / 2, Math.PI, 0);
          ctx.fill();
          ctx.strokeStyle = '#00D4FF';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.moveTo(fix.x + fix.width * 0.4, CANVAS_HEIGHT);
          ctx.lineTo(fix.x + fix.width * 0.5, fix.y - fix.height);
          ctx.lineTo(fix.x + fix.width * 0.6, CANVAS_HEIGHT);
          ctx.fill();
          ctx.fillStyle = '#FF0055';
          ctx.beginPath();
          ctx.arc(fix.x + fix.width * 0.5, fix.y - fix.height, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1A1A2E';
        }
      });
    } else if (bgMode === 'clouds') {
      // Sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGradient.addColorStop(0, '#4facfe');
      skyGradient.addColorStop(1, '#00f2fe');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Clouds
      ctx.fillStyle = '#FFFFFF';
      this.clouds.forEach(cloud => {
        ctx.globalAlpha = cloud.opacity;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.height / 2, Math.PI / 2, (Math.PI * 3) / 2);
        ctx.arc(cloud.x + cloud.width / 4, cloud.y - cloud.height / 3, cloud.height / 1.5, Math.PI, 0);
        ctx.arc(cloud.x + cloud.width / 2, cloud.y - cloud.height / 2, cloud.height / 1.2, Math.PI, 0);
        ctx.arc(cloud.x + (cloud.width * 3) / 4, cloud.y - cloud.height / 4, cloud.height / 1.5, Math.PI, 0);
        ctx.arc(cloud.x + cloud.width, cloud.y, cloud.height / 2, (Math.PI * 3) / 2, Math.PI / 2);
        ctx.closePath();
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    } else if (bgMode === 'cyber') {
      // Cyber City Sky
      const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGradient.addColorStop(0, '#0f0c29');
      skyGradient.addColorStop(0.5, '#302b63');
      skyGradient.addColorStop(1, '#24243e');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Cyber Buildings
      this.cityBuildings.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, CANVAS_HEIGHT - b.height, b.width, b.height);
        
        ctx.fillStyle = '#f9ca24'; // Yellow windows
        b.windows.forEach(w => {
          if (w.on) {
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#f9ca24';
            ctx.fillRect(b.x + w.x, CANVAS_HEIGHT - b.height + w.y, 8, 12);
            ctx.shadowBlur = 0;
          }
        });
        
        // Neon edge
        ctx.strokeStyle = '#e056fd';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, CANVAS_HEIGHT - b.height, b.width, b.height);
      });
    } else if (bgMode === 'ocean') {
      // Ocean Sky
      const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGradient.addColorStop(0, '#89f7fe');
      skyGradient.addColorStop(1, '#66a6ff');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Clouds in background
      ctx.fillStyle = '#FFFFFF';
      this.clouds.forEach(cloud => {
        ctx.globalAlpha = cloud.opacity * 0.8;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y * 0.5, cloud.height / 3, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.4, cloud.y * 0.5 - 10, cloud.height / 2.5, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.8, cloud.y * 0.5, cloud.height / 3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Ocean Water
      ctx.globalAlpha = 1;
      const oceanGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - 200, 0, CANVAS_HEIGHT);
      oceanGradient.addColorStop(0, '#009ffd');
      oceanGradient.addColorStop(1, '#2a2a72');
      ctx.fillStyle = oceanGradient;
      ctx.fillRect(0, CANVAS_HEIGHT - 200, CANVAS_WIDTH, 200);

      // Waves
      ctx.fillStyle = '#FFFFFF';
      this.oceanWaves.forEach(wave => {
        ctx.globalAlpha = wave.opacity;
        ctx.beginPath();
        ctx.ellipse(wave.x, wave.y, wave.width / 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    } else if (bgMode === 'jungle') {
      // Jungle Sky
      const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGradient.addColorStop(0, '#11998e');
      skyGradient.addColorStop(1, '#38ef7d');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant mountains
      ctx.fillStyle = '#2d5a27';
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT);
      ctx.lineTo(CANVAS_WIDTH * 0.2, CANVAS_HEIGHT - 300);
      ctx.lineTo(CANVAS_WIDTH * 0.5, CANVAS_HEIGHT - 100);
      ctx.lineTo(CANVAS_WIDTH * 0.8, CANVAS_HEIGHT - 250);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fill();

      // Trees
      this.jungleTrees.forEach(tree => {
        ctx.fillStyle = tree.color;
        // Trunk
        ctx.fillRect(tree.x + tree.width / 2 - 10, tree.y, 20, tree.height);
        // Leaves
        ctx.beginPath();
        ctx.arc(tree.x + tree.width / 2, tree.y, tree.width, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tree.x + tree.width / 2 - 20, tree.y + 20, tree.width * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tree.x + tree.width / 2 + 20, tree.y + 20, tree.width * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Ground
      ctx.fillStyle = '#1e3d17';
      ctx.fillRect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);
    }

    // Stage name
    if (this.stageTime < 3 && !this.intermission) {
      ctx.fillStyle = `rgba(255, 255, 255, ${1 - this.stageTime / 3})`;
      ctx.font = 'bold 56px Orbitron';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#00D4FF';
      ctx.shadowBlur = 20;
      ctx.fillText(`STAGE ${this.stats.stage}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      ctx.font = '36px Orbitron';
      ctx.fillText(this.currentStage.name, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      ctx.shadowBlur = 0;
    }

    // Draw Tanker Jet
    if (this.tankerJet.active) {
      const tx = this.tankerJet.x;
      const ty = this.tankerJet.y;
      
      // Tanker Body
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.moveTo(tx + 300, ty + 50); // Nose
      ctx.lineTo(tx + 50, ty); // Top wing front
      ctx.lineTo(tx - 100, ty + 20); // Tail top
      ctx.lineTo(tx - 120, ty + 50); // Tail rear
      ctx.lineTo(tx - 100, ty + 80); // Tail bottom
      ctx.lineTo(tx + 50, ty + 100); // Bottom wing front
      ctx.closePath();
      ctx.fill();
      
      // Cockpit
      ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(tx + 220, ty + 50, 40, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Refueling Pipe
      if (this.tankerJet.pipeLen > 0) {
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tx + 50, ty + 80);
        ctx.lineTo(tx - 20, ty + 80 + this.tankerJet.pipeLen);
        ctx.stroke();
        
        // Nozzle
        ctx.fillStyle = '#888';
        ctx.fillRect(tx - 30, ty + 75 + this.tankerJet.pipeLen, 20, 10);
      }

      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 18px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('FUEL TANKER K-9', tx + 100, ty + 40);
    }
  }

  private drawBeam(ctx: CanvasRenderingContext2D): void {
    if (!this.beamActive || !this.player1?.active) return;

    const player = this.player1;
    const beamY = player.position.y + player.height / 2;
    const beamWidth = 6 + player.powerLevel * 3;

    // Beam glow
    const gradient = ctx.createLinearGradient(player.position.x + player.width, beamY, CANVAS_WIDTH, beamY);
    gradient.addColorStop(0, `rgba(0, 255, 255, 0.8)`);
    gradient.addColorStop(0.3, `rgba(0, 212, 255, 0.5)`);
    gradient.addColorStop(1, `rgba(0, 100, 255, 0.1)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = beamWidth;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 20;
    
    ctx.beginPath();
    ctx.moveTo(player.position.x + player.width, beamY);
    ctx.lineTo(CANVAS_WIDTH, beamY);
    ctx.stroke();

    // Core beam
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = beamWidth * 0.4;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.moveTo(player.position.x + player.width, beamY);
    ctx.lineTo(CANVAS_WIDTH, beamY);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Muzzle flash
    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.arc(player.position.x + player.width, beamY, beamWidth, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPlayers(ctx: CanvasRenderingContext2D): void {
    [this.player1, this.player2].forEach(player => {
      if (!player || !player.active) return;

      const color = player.playerNumber === 1 ? '#00D4FF' : '#FF3366';
      
      if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      // Realistic Fighter Jet Shape
      ctx.fillStyle = color;
      ctx.beginPath();
      // Main fuselage
      ctx.moveTo(player.position.x + player.width, player.position.y + player.height / 2); // Nose
      ctx.lineTo(player.position.x + player.width * 0.7, player.position.y + player.height * 0.3); // Upper intake
      ctx.lineTo(player.position.x + player.width * 0.4, player.position.y + player.height * 0.1); // Canopy front
      ctx.lineTo(player.position.x + player.width * 0.1, player.position.y + player.height * 0.1); // Tail top
      ctx.lineTo(player.position.x, player.position.y); // Vertical stabilizer top
      ctx.lineTo(player.position.x + player.width * 0.1, player.position.y + player.height * 0.4); // Tail rear
      ctx.lineTo(player.position.x, player.position.y + player.height / 2); // Engine nozzle mid
      ctx.lineTo(player.position.x + player.width * 0.1, player.position.y + player.height * 0.6); // Tail bottom rear
      ctx.lineTo(player.position.x, player.position.y + player.height); // Bottom stabilizer
      ctx.lineTo(player.position.x + player.width * 0.1, player.position.y + player.height * 0.9); // Underbelly rear
      ctx.lineTo(player.position.x + player.width * 0.7, player.position.y + player.height * 0.7); // Lower intake
      ctx.closePath();
      ctx.fill();

      // Cockpit Canopy (Glass)
      ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.moveTo(player.position.x + player.width * 0.65, player.position.y + player.height * 0.35);
      ctx.bezierCurveTo(
        player.position.x + player.width * 0.55, player.position.y + player.height * 0.2,
        player.position.x + player.width * 0.4, player.position.y + player.height * 0.2,
        player.position.x + player.width * 0.35, player.position.y + player.height * 0.35
      );
      ctx.fill();

      // Wing
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(player.position.x + player.width * 0.6, player.position.y + player.height / 2);
      ctx.lineTo(player.position.x + player.width * 0.2, player.position.y + player.height * 0.8);
      ctx.lineTo(player.position.x + player.width * 0.1, player.position.y + player.height * 0.7);
      ctx.closePath();
      ctx.fill();

      // Engine glow
      const engineX = player.position.x;
      const engineY = player.position.y + player.height / 2;
      ctx.fillStyle = player.playerNumber === 1 ? '#00FFFF' : '#FF88AA';
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(engineX, engineY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Realistic Engine Flame (Jet Exhaust)
      const time = Date.now() / 50;
      for (let i = 0; i < 3; i++) {
        const flameWidth = 15 - i * 4;
        const flameLen = 40 + Math.sin(time + i) * 15;
        const grad = ctx.createLinearGradient(engineX, engineY, engineX - flameLen, engineY);
        grad.addColorStop(0, player.playerNumber === 1 ? '#FFFFFF' : '#FFDDEE');
        grad.addColorStop(0.3, player.playerNumber === 1 ? '#00FFFF' : '#FF3366');
        grad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(engineX, engineY - flameWidth / 2);
        ctx.quadraticCurveTo(engineX - flameLen, engineY, engineX, engineY + flameWidth / 2);
        ctx.fill();
      }

      // Shield
      if (player.invincible) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(player.position.x + player.width / 2, player.position.y + player.height / 2, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.globalAlpha = 1;

      // Player label
      ctx.fillStyle = color;
      ctx.font = 'bold 14px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(`P${player.playerNumber}`, player.position.x + player.width / 2, player.position.y - 15);
    });
  }

  private drawBullets(ctx: CanvasRenderingContext2D): void {
    this.bullets.forEach(bullet => {
      if (!bullet.active) return;

      if (bullet.owner === 'enemy') {
        ctx.fillStyle = bullet.color;
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 15;
        
        const timeOffset = Date.now() / 150;
        ctx.save();
        ctx.translate(bullet.position.x, bullet.position.y);
        ctx.rotate(timeOffset);
        
        ctx.beginPath();
        // Inner core
        ctx.arc(0, 0, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Rolling sawtooth outer spikes
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(0, bullet.width / 2);
          ctx.lineTo(-bullet.width * 0.2, bullet.width * 0.8);
          ctx.lineTo(bullet.width * 0.2, bullet.width * 0.8);
          ctx.fill();
          ctx.rotate(Math.PI / 2);
        }
        ctx.restore();
      } else {
        ctx.fillStyle = bullet.color;
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(bullet.position.x, bullet.position.y, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
    });
  }

  private drawEnemies(ctx: CanvasRenderingContext2D): void {
    this.enemies.forEach(enemy => {
      if (!enemy.active) return;

      const colors: Record<typeof enemy.type, string> = {
        grunt: '#FF6B35',
        interceptor: '#39FF14',
        bomber: '#FF3366',
        elite: '#9D4EDD',
        tank: '#8B4513',
      };

      ctx.fillStyle = colors[enemy.type];
      ctx.shadowColor = colors[enemy.type];
      ctx.shadowBlur = 10;

      switch (enemy.type) {
        case 'tank':
          ctx.beginPath();
          // Tank body
          ctx.rect(enemy.position.x, enemy.position.y + 10, enemy.width, 30);
          ctx.fill();
          // Tank treads
          ctx.fillStyle = '#333';
          ctx.beginPath();
          ctx.roundRect(enemy.position.x - 5, enemy.position.y + 30, enemy.width + 10, 15, 5);
          ctx.fill();
          // Turret pointing up
          ctx.fillStyle = colors[enemy.type];
          ctx.beginPath();
          ctx.arc(enemy.position.x + enemy.width / 2, enemy.position.y + 10, 15, Math.PI, 0);
          ctx.fill();
          ctx.fillRect(enemy.position.x + enemy.width / 2 - 4, enemy.position.y - 15, 8, 25);
          break;
        case 'grunt':
          ctx.beginPath();
          ctx.moveTo(enemy.position.x + enemy.width, enemy.position.y + enemy.height / 2);
          ctx.lineTo(enemy.position.x, enemy.position.y);
          ctx.lineTo(enemy.position.x + enemy.width * 0.2, enemy.position.y + enemy.height / 2);
          ctx.lineTo(enemy.position.x, enemy.position.y + enemy.height);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#FFF';
          ctx.beginPath();
          ctx.arc(enemy.position.x + enemy.width * 0.6, enemy.position.y + enemy.height / 2, enemy.height * 0.15, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'interceptor':
          ctx.beginPath();
          ctx.arc(enemy.position.x + enemy.width * 0.4, enemy.position.y + enemy.height / 2, enemy.width / 2, -Math.PI / 2, Math.PI / 2);
          ctx.arc(enemy.position.x + enemy.width * 0.7, enemy.position.y + enemy.height / 2, enemy.width * 0.4, Math.PI / 2, -Math.PI / 2, true);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#FFF';
          ctx.beginPath();
          ctx.arc(enemy.position.x + enemy.width * 0.4, enemy.position.y + enemy.height / 2, enemy.width * 0.15, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'bomber':
          if (!(ctx as any).roundRect) (ctx as any).roundRect = function(x: number, y: number, w: number, h: number) { ctx.rect(x,y,w,h); }; // Polyfill safety
          ctx.beginPath();
          ctx.roundRect(enemy.position.x + enemy.width * 0.2, enemy.position.y + enemy.height * 0.2, enemy.width * 0.8, enemy.height * 0.6, 5);
          ctx.fill();
          ctx.fillRect(enemy.position.x, enemy.position.y, enemy.width * 0.4, enemy.height * 0.2);
          ctx.fillRect(enemy.position.x, enemy.position.y + enemy.height * 0.8, enemy.width * 0.4, enemy.height * 0.2);
          ctx.fillStyle = '#00FFFF';
          ctx.fillRect(enemy.position.x - 5, enemy.position.y + enemy.height * 0.3, 10, enemy.height * 0.1);
          ctx.fillRect(enemy.position.x - 5, enemy.position.y + enemy.height * 0.6, 10, enemy.height * 0.1);
          break;
        case 'elite':
          ctx.beginPath();
          ctx.moveTo(enemy.position.x + enemy.width, enemy.position.y + enemy.height / 2);
          ctx.lineTo(enemy.position.x + enemy.width * 0.6, enemy.position.y);
          ctx.lineTo(enemy.position.x + enemy.width * 0.4, enemy.position.y + enemy.height * 0.3);
          ctx.lineTo(enemy.position.x, enemy.position.y + enemy.height * 0.1);
          ctx.lineTo(enemy.position.x + enemy.width * 0.2, enemy.position.y + enemy.height / 2);
          ctx.lineTo(enemy.position.x, enemy.position.y + enemy.height * 0.9);
          ctx.lineTo(enemy.position.x + enemy.width * 0.4, enemy.position.y + enemy.height * 0.7);
          ctx.lineTo(enemy.position.x + enemy.width * 0.6, enemy.position.y + enemy.height);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.stroke();
          break;
      }

      ctx.shadowBlur = 0;

      // Health bar
      if (enemy.type === 'bomber' || enemy.type === 'elite') {
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.position.x, enemy.position.y - 12, enemy.width, 6);
        ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : healthPercent > 0.25 ? '#FFFF00' : '#FF0000';
        ctx.fillRect(enemy.position.x, enemy.position.y - 12, enemy.width * healthPercent, 6);
      }
    });
  }

  private drawBoss(ctx: CanvasRenderingContext2D): void {
    if (!this.boss) return;

    const colors: Record<typeof this.boss.type, string> = {
      mantis: '#9D4EDD',
      leviathan: '#39FF14',
      omega: '#FF0000',
    };

    const color = colors[this.boss.type];

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    // Boss styling
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    switch (this.boss.type) {
      case 'mantis':
        ctx.beginPath();
        ctx.moveTo(this.boss.position.x, this.boss.position.y + this.boss.height / 2);
        ctx.lineTo(this.boss.position.x + this.boss.width * 0.3, this.boss.position.y);
        ctx.lineTo(this.boss.position.x + this.boss.width, this.boss.position.y + this.boss.height * 0.2);
        ctx.lineTo(this.boss.position.x + this.boss.width, this.boss.position.y + this.boss.height * 0.8);
        ctx.lineTo(this.boss.position.x + this.boss.width * 0.3, this.boss.position.y + this.boss.height);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#FFFFFF';
        const clawOffset = Math.sin(this.stageTime * 5) * 10;
        ctx.fillRect(this.boss.position.x - 20 + clawOffset, this.boss.position.y + 10, 40, 15);
        ctx.fillRect(this.boss.position.x - 20 - clawOffset, this.boss.position.y + this.boss.height - 25, 40, 15);
        
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.boss.position.x + 30, this.boss.position.y + 30, 20, 10);
        ctx.fillRect(this.boss.position.x + 30, this.boss.position.y + this.boss.height - 40, 20, 10);
        break;
      case 'leviathan':
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const segOffset = Math.sin(this.stageTime * 3 + i) * 15;
          ctx.beginPath();
          ctx.arc(this.boss.position.x + 30 + i * 35, this.boss.position.y + this.boss.height / 2 + segOffset, 30 - i * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = '#00FFFF';
          ctx.beginPath();
          ctx.arc(this.boss.position.x + 30 + i * 35, this.boss.position.y + this.boss.height / 2 + segOffset, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = color;
        }
        break;
      case 'omega':
        const pulse = Math.abs(Math.sin(this.stageTime * 2)) * 10;
        ctx.beginPath();
        ctx.arc(this.boss.position.x + this.boss.width / 2, this.boss.position.y + this.boss.height / 2, 60 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#FFFF00';
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(this.boss.position.x + this.boss.width / 2, this.boss.position.y + this.boss.height / 2, 30 - pulse / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(this.boss.position.x + this.boss.width / 2, this.boss.position.y + this.boss.height / 2, 90, 30, this.stageTime, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(this.boss.position.x + this.boss.width / 2, this.boss.position.y + this.boss.height / 2, 90, 30, -this.stageTime * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        break;
    }

    // Boss health bar
    const healthPercent = this.boss.health / this.boss.maxHealth;
    const barWidth = 500;
    
    ctx.fillStyle = '#222';
    ctx.fillRect((CANVAS_WIDTH - barWidth) / 2, 25, barWidth, 25);
    
    const healthGradient = ctx.createLinearGradient(0, 25, 0, 50);
    healthGradient.addColorStop(0, color);
    healthGradient.addColorStop(1, color + '88');
    ctx.fillStyle = healthGradient;
    ctx.fillRect((CANVAS_WIDTH - barWidth) / 2, 25, barWidth * healthPercent, 25);
    
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect((CANVAS_WIDTH - barWidth) / 2, 25, barWidth, 25);

    // Phase indicator
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 18px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(`PHASE ${this.boss.phase}`, CANVAS_WIDTH / 2, 70);
  }

  private drawPowerUps(ctx: CanvasRenderingContext2D): void {
    const colors: Record<PowerUpType, string> = {
      power: '#FFA500',
      weapon: '#FFA500', // Dynamic placeholder
      bomb: '#FF0000',
      speed: '#0088FF',
      life: '#00FF00',
    };

    const labels: Record<PowerUpType, string> = {
      power: 'P',
      weapon: 'W',
      bomb: 'B',
      speed: 'S',
      life: '1UP',
    };

    this.powerUps.forEach(pu => {
      if (!pu.active) return;

      const color = colors[pu.type];
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = color;

      if (pu.type === 'weapon') {
        const cycle = Date.now() % 9000;
        const weaponColor = cycle < 3000 ? '#FF0000' : cycle < 6000 ? '#00FF00' : '#00D4FF';
        const weaponLabel = cycle < 3000 ? 'LSR' : cycle < 6000 ? 'BST' : 'SPR';
        ctx.shadowColor = weaponColor;
        ctx.fillStyle = weaponColor;
        ctx.beginPath();
        ctx.moveTo(pu.position.x + pu.width / 2, pu.position.y);
        ctx.lineTo(pu.position.x + pu.width, pu.position.y + pu.height / 2);
        ctx.lineTo(pu.position.x + pu.width / 2, pu.position.y + pu.height);
        ctx.lineTo(pu.position.x, pu.position.y + pu.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 10px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(weaponLabel, pu.position.x + pu.width / 2, pu.position.y + pu.height / 2);
      } else if (pu.type === 'life') {
        // Draw distinct cross shape
        const cx = pu.position.x + pu.width / 2;
        const cy = pu.position.y + pu.height / 2;
        const thickness = pu.width * 0.3;
        const length = pu.width * 0.8;
        
        ctx.beginPath();
        // horizontal bar
        ctx.fillRect(cx - length / 2, cy - thickness / 2, length, thickness);
        // vertical bar
        ctx.fillRect(cx - thickness / 2, cy - length / 2, thickness, length);
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - length / 2, cy - thickness / 2, length, thickness);
        ctx.strokeRect(cx - thickness / 2, cy - length / 2, thickness, length);
      } else {
        // Draw standard circle for other powerups
        ctx.beginPath();
        ctx.arc(pu.position.x + pu.width / 2, pu.position.y + pu.height / 2, pu.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[pu.type], pu.position.x + pu.width / 2, pu.position.y + pu.height / 2);
      }
    });
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(p => {
      if (!p.active) return;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  private drawExplosions(ctx: CanvasRenderingContext2D): void {
    this.explosions.forEach(e => {
      if (!e.active) return;

      const alpha = e.life / e.maxLife;
      
      ctx.strokeStyle = `rgba(255, 150, 0, ${alpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(e.position.x, e.position.y, e.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(e.position.x, e.position.y, e.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(e.position.x, e.position.y, e.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawTouchControls(ctx: CanvasRenderingContext2D): void {
    // Joystick
    if (this.touchState.joystick.active) {
      // Outer ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.touchState.joystick.originX, this.touchState.joystick.originY, 80, 0, Math.PI * 2);
      ctx.stroke();

      // Inner stick
      const dx = this.touchState.joystick.x - this.touchState.joystick.originX;
      const dy = this.touchState.joystick.y - this.touchState.joystick.originY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 50;
      const stickX = this.touchState.joystick.originX + (dx / Math.max(dist, 1)) * Math.min(dist, maxDist);
      const stickY = this.touchState.joystick.originY + (dy / Math.max(dist, 1)) * Math.min(dist, maxDist);

      ctx.fillStyle = 'rgba(0, 212, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(stickX, stickY, 30, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Joystick hint
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(120, CANVAS_HEIGHT - 120, 60, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(120, CANVAS_HEIGHT - 120, 25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fire button
    ctx.fillStyle = this.touchState.fireButton.active 
      ? 'rgba(255, 100, 100, 0.8)' 
      : 'rgba(255, 100, 100, 0.4)';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 100, CANVAS_HEIGHT - 80, 50, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('FIRE', CANVAS_WIDTH - 100, CANVAS_HEIGHT - 75);

    // Bomb button
    ctx.fillStyle = this.touchState.bombButton.active 
      ? 'rgba(255, 200, 0, 0.8)' 
      : 'rgba(255, 200, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 100, CANVAS_HEIGHT - 200, 40, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px Orbitron';
    ctx.fillText('BOMB', CANVAS_WIDTH - 100, CANVAS_HEIGHT - 195);
  }

  getCanvasDimensions(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  setInput(player: 1 | 2, input: Partial<InputState>): void {
    if (player === 1) {
      Object.assign(this.input1, input);
    } else {
      Object.assign(this.input2, input);
    }
  }
}

export default GameEngine;
