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
const BEAM_DAMAGE_TICK = 5; // Damage every 5 frames when beam is active

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
  };
  
  // Stage management
  currentStage: Stage;
  stageTime = 0;
  enemySpawnTimer = 0;
  bossSpawned = false;
  bossWarningShown = false;
  
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
  
  // Background scroll
  bgOffset = 0;
  stars: { x: number; y: number; size: number; speed: number; brightness: number; color: string }[] = [];
  nebulas: { x: number; y: number; radius: number; color: string; alpha: number }[] = [];
  
  // Screen shake
  shakeIntensity = 0;
  shakeDecay = 0.9;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    
    // Initialize sound
    this.soundManager = new SoundManager();
    
    // Initialize stage
    this.currentStage = this.getStage(1);
    
    // Generate background
    this.generateStars();
    this.generateNebulas();
    
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

  private getStage(stageNum: number): Stage {
    const stages: Stage[] = [
      { id: 1, name: 'DEEP SPACE', duration: 60, enemySpawnRate: 1.5, bossSpawnTime: 55, backgroundType: 'space' },
      { id: 2, name: 'ASTEROID BELT', duration: 75, enemySpawnRate: 1.2, bossSpawnTime: 70, backgroundType: 'asteroid' },
      { id: 3, name: 'ENEMY BASE', duration: 90, enemySpawnRate: 0.8, bossSpawnTime: 85, backgroundType: 'base' },
    ];
    return stages[(stageNum - 1) % stages.length];
  }

  spawnPlayer1(): Player {
    this.player1 = {
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
      bombs: 2,
      speed: PLAYER_SPEED,
      weaponType: 'spread',
      invincible: false,
      invincibleTime: 0,
      targetPosition: { x: 100, y: CANVAS_HEIGHT / 2 },
    };
    return this.player1;
  }

  spawnPlayer2(): Player {
    this.player2 = {
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
      bombs: 2,
      speed: PLAYER_SPEED,
      weaponType: 'spread',
      invincible: true,
      invincibleTime: 3000,
      targetPosition: { x: 100, y: CANVAS_HEIGHT / 2 + 60 },
    };
    this.onPlayer2Join?.();
    return this.player2;
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
    };
    this.stageTime = 0;
    this.enemySpawnTimer = 0;
    this.bossSpawned = false;
    this.bossWarningShown = false;
    this.currentStage = this.getStage(1);
    this.spawnPlayer1();
  }

  nextStage(): void {
    this.stats.stage++;
    this.currentStage = this.getStage(this.stats.stage);
    this.stageTime = 0;
    this.enemySpawnTimer = 0;
    this.bossSpawned = false;
    this.bossWarningShown = false;
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
    if (this.bossSpawned && !this.boss && this.enemies.length === 0) {
      if (this.stageTime > this.currentStage.bossSpawnTime + 5) {
        this.nextStage();
      }
    }
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

    // Beam shooting - continuous when button held
    if (input.shoot && player.active) {
      this.beamActive = true;
      this.updateBeam(player);
    } else {
      this.beamActive = false;
    }

    // Bomb
    if (input.bomb && player.bombs > 0) {
      this.useBomb(player);
      input.bomb = false;
    }
  }

  private updateBeam(player: Player): void {
    this.beamDamageTick++;
    
    // Create beam particles
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        id: uuidv4(),
        position: { 
          x: player.position.x + player.width + Math.random() * (CANVAS_WIDTH - player.position.x - player.width),
          y: player.position.y + player.height / 2 + (Math.random() - 0.5) * (4 + player.powerLevel * 2)
        },
        velocity: { x: 0, y: 0 },
        width: 2,
        height: 2,
        active: true,
        life: 100,
        maxLife: 100,
        color: player.playerNumber === 1 ? '#00FFFF' : '#FF66AA',
        size: 2 + Math.random() * 2,
        alpha: 0.8,
      });
    }

    // Damage enemies in beam path (every N frames)
    if (this.beamDamageTick >= BEAM_DAMAGE_TICK) {
      this.beamDamageTick = 0;
      this.soundManager.playSound('shoot');

      const beamY = player.position.y + player.height / 2;
      const beamWidth = 8 + player.powerLevel * 4;

      // Damage enemies in beam
      this.enemies.forEach(enemy => {
        if (enemy.position.x > player.position.x + player.width &&
            Math.abs(enemy.position.y + enemy.height / 2 - beamY) < beamWidth + enemy.height / 2) {
          enemy.health -= player.powerLevel;
          this.createParticles(enemy.position.x, enemy.position.y + enemy.height / 2, 3, '#FF6B35');
          if (enemy.health <= 0) {
            this.destroyEnemy(enemy);
          }
        }
      });

      // Damage boss in beam
      if (this.boss) {
        const bossCenterY = this.boss.position.y + this.boss.height / 2;
        if (Math.abs(bossCenterY - beamY) < beamWidth + this.boss.height / 2) {
          this.boss.health -= player.powerLevel;
          this.createParticles(this.boss.position.x, beamY, 5, '#9D4EDD');
          if (this.boss.health <= 0) {
            this.destroyBoss();
          }
        }
      }
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
    if (!this.bossSpawned && this.stageTime >= this.currentStage.bossSpawnTime) {
      this.spawnBoss();
      return;
    }

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

    const enemy = this.createEnemy(type);
    this.enemies.push(enemy);
  }

  private createEnemy(type: EnemyType): Enemy {
    const y = Math.random() * (CANVAS_HEIGHT - 100) + 50;
    
    const enemyData: Record<EnemyType, { health: number; score: number; width: number; height: number }> = {
      grunt: { health: 3, score: 100, width: 30, height: 25 },
      interceptor: { health: 6, score: 300, width: 35, height: 30 },
      bomber: { health: 15, score: 500, width: 45, height: 40 },
      elite: { health: 30, score: 1000, width: 50, height: 45 },
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
      shootCooldown: type === 'grunt' ? 2000 : type === 'interceptor' ? 1500 : 3000,
      lastShot: 0,
      pattern: type === 'grunt' ? 'linear' : type === 'interceptor' ? 'tracking' : type === 'bomber' ? 'hover' : 'sine',
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
    this.bullets = this.bullets.filter(bullet => {
      if (!bullet.active) return false;

      bullet.position.x += bullet.velocity.x * (dt / 16) * 60;
      bullet.position.y += bullet.velocity.y * (dt / 16) * 60;

      if (bullet.position.x < -50 || bullet.position.x > CANVAS_WIDTH + 50 ||
          bullet.position.y < -50 || bullet.position.y > CANVAS_HEIGHT + 50) {
        return false;
      }

      return true;
    });
  }

  private updateEnemies(dt: number): void {
    const now = Date.now();

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
    
    const bulletPatterns = [
      [{ x: 0, y: 0, vx: -5, vy: 0 }],
      [{ x: 0, y: -5, vx: -5, vy: -0.5 }, { x: 0, y: 5, vx: -5, vy: 0.5 }],
    ];

    const pattern = bulletPatterns[Math.floor(Math.random() * bulletPatterns.length)];

    pattern.forEach(b => {
      this.bullets.push({
        id: uuidv4(),
        position: { x: enemy.position.x, y: enemy.position.y + enemy.height / 2 },
        velocity: { x: b.vx, y: b.vy },
        width: 8,
        height: 8,
        active: true,
        owner: 'enemy',
        damage: 1,
        color: '#FF6B35',
      });
    });
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
    this.shakeIntensity = 40;
    this.soundManager.playSound('explosion');
    this.createExplosion(this.boss.position.x, this.boss.position.y, 200, '#9D4EDD');
    this.createParticles(this.boss.position.x, this.boss.position.y, 80, '#9D4EDD');
    this.boss = null;
    this.onScoreUpdate?.(this.stats.score);
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUpType[] = ['power', 'bomb', 'speed', 'life'];
    const weights = [0.5, 0.25, 0.15, 0.1];
    
    let random = Math.random();
    let type: PowerUpType = 'power';
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
    
    switch (type) {
      case 'power':
        player.powerLevel = Math.min(player.powerLevel + 1, 5);
        break;
      case 'bomb':
        player.bombs = Math.min(player.bombs + 1, 5);
        break;
      case 'speed':
        player.speed = Math.min(player.speed + 1, 10);
        break;
      case 'life':
        player.lives = Math.min(player.lives + 1, 5);
        break;
    }
    this.createParticles(player.position.x, player.position.y, 15, '#00FF00');
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
    this.drawBeam(ctx);
    this.drawPowerUps(ctx);
    this.drawBullets(ctx);
    this.drawEnemies(ctx);
    this.drawBoss(ctx);
    this.drawPlayers(ctx);
    this.drawParticles(ctx);
    this.drawExplosions(ctx);

    // Draw touch controls
    if (this.isTouchDevice) {
      this.drawTouchControls(ctx);
    }

    ctx.restore();
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
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

    // Stage name
    if (this.stageTime < 3) {
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

      // Ship body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(player.position.x + player.width, player.position.y + player.height / 2);
      ctx.lineTo(player.position.x, player.position.y);
      ctx.lineTo(player.position.x, player.position.y + player.height);
      ctx.closePath();
      ctx.fill();

      // Engine glow
      ctx.fillStyle = player.playerNumber === 1 ? '#00FFFF' : '#FF88AA';
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(player.position.x - 5, player.position.y + player.height / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Engine trail
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = `rgba(${player.playerNumber === 1 ? '0, 255, 255' : '255, 136, 170'}, ${0.6 - i * 0.1})`;
        ctx.beginPath();
        ctx.arc(player.position.x - 12 - i * 10, player.position.y + player.height / 2 + Math.sin(Date.now() / 30 + i) * 4, 5 - i * 0.5, 0, Math.PI * 2);
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

      ctx.fillStyle = bullet.color;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 8;
      
      ctx.beginPath();
      ctx.arc(bullet.position.x, bullet.position.y, bullet.width / 2, 0, Math.PI * 2);
      ctx.fill();
      
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
      };

      ctx.fillStyle = colors[enemy.type];
      ctx.shadowColor = colors[enemy.type];
      ctx.shadowBlur = 10;

      switch (enemy.type) {
        case 'grunt':
          ctx.beginPath();
          ctx.moveTo(enemy.position.x, enemy.position.y + enemy.height / 2);
          ctx.lineTo(enemy.position.x + enemy.width, enemy.position.y);
          ctx.lineTo(enemy.position.x + enemy.width, enemy.position.y + enemy.height);
          ctx.closePath();
          ctx.fill();
          break;
        case 'interceptor':
          ctx.beginPath();
          ctx.arc(enemy.position.x + enemy.width / 2, enemy.position.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'bomber':
          ctx.fillRect(enemy.position.x, enemy.position.y, enemy.width, enemy.height);
          break;
        case 'elite':
          ctx.beginPath();
          ctx.moveTo(enemy.position.x + enemy.width / 2, enemy.position.y);
          ctx.lineTo(enemy.position.x + enemy.width, enemy.position.y + enemy.height / 2);
          ctx.lineTo(enemy.position.x + enemy.width / 2, enemy.position.y + enemy.height);
          ctx.lineTo(enemy.position.x, enemy.position.y + enemy.height / 2);
          ctx.closePath();
          ctx.fill();
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
    ctx.fillRect(this.boss.position.x, this.boss.position.y, this.boss.width, this.boss.height);
    ctx.shadowBlur = 0;

    // Boss details
    ctx.fillStyle = '#FFFFFF';
    switch (this.boss.type) {
      case 'mantis':
        ctx.fillRect(this.boss.position.x + 20, this.boss.position.y + 20, 25, 25);
        ctx.fillRect(this.boss.position.x + 20, this.boss.position.y + 60, 25, 25);
        break;
      case 'leviathan':
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(this.boss.position.x + 35 + i * 40, this.boss.position.y + 35, 25, 50);
        }
        break;
      case 'omega':
        ctx.fillStyle = '#FFFF00';
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(this.boss.position.x + this.boss.width / 2, this.boss.position.y + this.boss.height / 2, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
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
      bomb: '#FF0000',
      speed: '#0088FF',
      life: '#00FF00',
    };

    const labels: Record<PowerUpType, string> = {
      power: 'P',
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
      ctx.beginPath();
      ctx.arc(pu.position.x + pu.width / 2, pu.position.y + pu.height / 2, pu.width / 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 12px Orbitron';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[pu.type], pu.position.x + pu.width / 2, pu.position.y + pu.height / 2);
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
