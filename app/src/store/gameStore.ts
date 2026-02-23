import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, InputState, Vector2 } from '@/types/game';

interface GameStore {
  // Game state
  gameState: GameState;
  setGameState: (state: GameState) => void;
  
  // Player info
  playerName: string;
  setPlayerName: (name: string) => void;
  
  // Multiplayer
  isHost: boolean;
  setIsHost: (host: boolean) => void;
  roomCode: string | null;
  setRoomCode: (code: string | null) => void;
  player2Connected: boolean;
  setPlayer2Connected: (connected: boolean) => void;
  player2Position: Vector2;
  setPlayer2Position: (pos: Vector2) => void;
  
  // Game stats
  score: number;
  setScore: (score: number) => void;
  highScore: number;
  setHighScore: (score: number) => void;
  stage: number;
  setStage: (stage: number) => void;
  
  // Input states
  input1: InputState;
  setInput1: (input: Partial<InputState>) => void;
  input2: InputState;
  setInput2: (input: Partial<InputState>) => void;
  
  // Reset
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      // Initial state
      gameState: 'menu',
      playerName: 'Player 1',
      isHost: false,
      roomCode: null,
      player2Connected: false,
      player2Position: { x: 0, y: 0 },
      score: 0,
      highScore: 0,
      stage: 1,
      input1: { up: false, down: false, left: false, right: false, shoot: false, bomb: false },
      input2: { up: false, down: false, left: false, right: false, shoot: false, bomb: false },

      setGameState: (state) => set({ gameState: state }),
      setPlayerName: (name) => set({ playerName: name }),
      setIsHost: (host) => set({ isHost: host }),
      setRoomCode: (code) => set({ roomCode: code }),
      setPlayer2Connected: (connected) => set({ player2Connected: connected }),
      setPlayer2Position: (pos) => set({ player2Position: pos }),
      setScore: (score) => set({ score }),
      setHighScore: (score) => set({ highScore: score }),
      setStage: (stage) => set({ stage }),
      
      setInput1: (input) => set((state) => ({ 
        input1: { ...state.input1, ...input } 
      })),
      setInput2: (input) => set((state) => ({ 
        input2: { ...state.input2, ...input } 
      })),
      
      resetGame: () => set({
        gameState: 'menu',
        score: 0,
        stage: 1,
        player2Connected: false,
        roomCode: null,
      }),
    }),
    {
      name: 'zed-blade-storage',
      partialize: (state) => ({
        playerName: state.playerName,
        highScore: state.highScore,
      }),
    }
  )
);
