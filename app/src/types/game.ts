// ZED BLADE Clone - Game Types

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';
export type EnemyType = 'grunt' | 'interceptor' | 'bomber' | 'elite';
export type BossType = 'mantis' | 'leviathan' | 'omega';
export type PowerUpType = 'power' | 'bomb' | 'speed' | 'life';
export type WeaponType = 'spread' | 'laser' | 'homing' | 'missile';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  active: boolean;
}

export interface Player extends Entity {
  playerNumber: 1 | 2;
  health: number;
  maxHealth: number;
  lives: number;
  powerLevel: number;
  bombs: number;
  speed: number;
  weaponType: WeaponType;
  invincible: boolean;
  invincibleTime: number;
  targetPosition: Vector2;
}

export interface Bullet extends Entity {
  owner: 'player1' | 'player2' | 'enemy';
  damage: number;
  color: string;
}

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  maxHealth: number;
  scoreValue: number;
  shootCooldown: number;
  lastShot: number;
  pattern: MovementPattern;
  patternPhase: number;
}

export interface Boss extends Entity {
  type: BossType;
  health: number;
  maxHealth: number;
  phase: number;
  maxPhases: number;
  attackCooldown: number;
  lastAttack: number;
  scoreValue: number;
}

export interface PowerUp extends Entity {
  type: PowerUpType;
  value: number;
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha: number;
}

export interface Explosion extends Entity {
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
}

export type MovementPattern = 
  | 'linear' 
  | 'sine' 
  | 'circle' 
  | 'tracking' 
  | 'dive' 
  | 'hover';

export interface Stage {
  id: number;
  name: string;
  duration: number; // seconds
  enemySpawnRate: number;
  bossSpawnTime: number;
  backgroundType: 'space' | 'asteroid' | 'base';
}

export interface GameStats {
  score: number;
  highScore: number;
  stage: number;
  enemiesKilled: number;
  startTime: number;
}

export interface MultiplayerState {
  isHost: boolean;
  roomCode: string | null;
  player2Connected: boolean;
  player2Position: Vector2;
  latency: number;
}

// Input state
export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  bomb: boolean;
}

// Network messages
export interface GameMessage {
  type: 'join' | 'leave' | 'position' | 'shoot' | 'hit' | 'powerup' | 'score' | 'stage';
  playerId?: string;
  data?: unknown;
  timestamp: number;
}
