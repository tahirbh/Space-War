import { useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { useGameStore } from '@/store/gameStore';

interface GameCanvasProps {
  onScoreUpdate?: (score: number) => void;
  onStageComplete?: () => void;
  onGameOver?: () => void;
  onPlayer2Join?: () => void;
  onPlayer2Leave?: () => void;
  onBossWarning?: () => void;
  soundManagerRef?: MutableRefObject<{ toggleMute: () => boolean; setMuted: (m: boolean) => void } | null>;
}

export function GameCanvas({ 
  onScoreUpdate, 
  onStageComplete, 
  onGameOver,
  onPlayer2Join,
  onPlayer2Leave,
  onBossWarning,
  soundManagerRef,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  
  const { input1, input2, setScore } = useGameStore();

  // Initialize game engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    // Expose sound manager
    if (soundManagerRef) {
      soundManagerRef.current = {
        toggleMute: () => engine.soundManager.toggleMute(),
        setMuted: (m: boolean) => engine.soundManager.setMuted(m),
      };
    }

    // Set callbacks
    engine.onScoreUpdate = (score) => {
      setScore(score);
      onScoreUpdate?.(score);
    };
    engine.onStageComplete = onStageComplete;
    engine.onGameOver = onGameOver;
    engine.onPlayer2Join = onPlayer2Join;
    engine.onPlayer2Leave = onPlayer2Leave;
    engine.onBossWarning = onBossWarning;

    // Spawn player 1
    engine.spawnPlayer1();
    engine.start();

    return () => {
      engine.stop();
    };
  }, []);

  // Update inputs
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.input1 = { ...input1 };
    }
  }, [input1]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.input2 = { ...input2 };
    }
  }, [input2]);

  // Expose engine methods
  const spawnPlayer2 = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.spawnPlayer2();
    }
  }, []);

  const removePlayer2 = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.removePlayer2();
    }
  }, []);

  const resetGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
      engineRef.current.spawnPlayer1();
    }
  }, []);

  const pauseGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
  }, []);

  // Expose to parent via window
  useEffect(() => {
    (window as unknown as { gameAPI: { 
      spawnPlayer2: () => void; 
      removePlayer2: () => void; 
      resetGame: () => void;
      pauseGame: () => void;
    } }).gameAPI = {
      spawnPlayer2,
      removePlayer2,
      resetGame,
      pauseGame,
    };
  }, [spawnPlayer2, removePlayer2, resetGame, pauseGame]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-contain game-canvas"
      style={{ 
        imageRendering: 'pixelated',
      }}
    />
  );
}
