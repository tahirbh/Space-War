import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameCanvas } from '@/components/GameCanvas';
import { HUD } from '@/components/HUD';
import { Menu } from '@/components/Menu';
import { MultiplayerLobby } from '@/components/MultiplayerLobby';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Pause, Play, RotateCcw, LogOut, Trophy, Volume2, VolumeX } from 'lucide-react';

type AppState = 'menu' | 'multiplayer' | 'playing' | 'paused' | 'gameover' | 'victory' | 'boss-warning';

function App() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { score, highScore, setScore, setHighScore, setStage, player2Connected, setPlayer2Connected } = useGameStore();
  const [playerStats] = useState({
    p1: { lives: 3, bombs: 2, power: 1 },
    p2: { lives: 3, bombs: 2, power: 1 },
  });
  const gameCanvasRef = useRef<HTMLDivElement>(null);
  const soundManagerRef = useRef<{ toggleMute: () => boolean; setMuted: (m: boolean) => void } | null>(null);

  // Keyboard input handling
  useEffect(() => {
    const { setInput1, setInput2 } = useGameStore.getState();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (appState !== 'playing' && appState !== 'paused' && appState !== 'boss-warning') return;

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          setInput1({ up: true });
          break;
        case 'arrowdown':
        case 's':
          setInput1({ down: true });
          break;
        case 'arrowleft':
        case 'a':
          setInput1({ left: true });
          break;
        case 'arrowright':
        case 'd':
          setInput1({ right: true });
          break;
        case 'z':
        case ' ':
          setInput1({ shoot: true });
          break;
        case 'x':
        case 'shift':
          setInput1({ bomb: true });
          break;
        case 'enter':
          togglePause();
          break;
        case 'm':
          toggleMute();
          break;
        // Player 2 controls
        case 'i':
          setInput2({ up: true });
          break;
        case 'k':
          setInput2({ down: true });
          break;
        case 'j':
          setInput2({ left: true });
          break;
        case 'l':
          setInput2({ right: true });
          break;
        case 'n':
          setInput2({ shoot: true });
          break;
        case 'b':
          setInput2({ bomb: true });
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const { setInput1, setInput2 } = useGameStore.getState();

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          setInput1({ up: false });
          break;
        case 'arrowdown':
        case 's':
          setInput1({ down: false });
          break;
        case 'arrowleft':
        case 'a':
          setInput1({ left: false });
          break;
        case 'arrowright':
        case 'd':
          setInput1({ right: false });
          break;
        case 'z':
        case ' ':
          setInput1({ shoot: false });
          break;
        case 'x':
        case 'shift':
          setInput1({ bomb: false });
          break;
        case 'i':
          setInput2({ up: false });
          break;
        case 'k':
          setInput2({ down: false });
          break;
        case 'j':
          setInput2({ left: false });
          break;
        case 'l':
          setInput2({ right: false });
          break;
        case 'n':
          setInput2({ shoot: false });
          break;
        case 'b':
          setInput2({ bomb: false });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [appState]);

  const togglePause = () => {
    if (appState === 'playing') {
      setAppState('paused');
      (window as unknown as { gameAPI: { pauseGame: () => void } }).gameAPI?.pauseGame();
    } else if (appState === 'paused') {
      setAppState('playing');
      (window as unknown as { gameAPI: { pauseGame: () => void } }).gameAPI?.pauseGame();
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (soundManagerRef.current) {
      soundManagerRef.current.setMuted(newMuted);
    }
    toast.info(newMuted ? 'Sound Muted' : 'Sound Unmuted');
  };

  const startGame = useCallback(() => {
    setAppState('playing');
    toast.success('Game Started!', { description: 'Destroy all enemies!' });
  }, []);

  const startMultiplayer = useCallback(() => {
    setAppState('multiplayer');
  }, []);

  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
    }
  }, [highScore, setScore, setHighScore]);

  const handleStageComplete = useCallback(() => {
    toast.success('Stage Complete!', { description: 'Get ready for the next wave!' });
  }, []);

  const handleGameOver = useCallback(() => {
    setAppState('gameover');
    toast.error('Game Over!', { description: `Final Score: ${score}` });
  }, [score]);

  const handleBossWarning = useCallback(() => {
    setShowBossWarning(true);
    setTimeout(() => {
      setShowBossWarning(false);
    }, 3000);
  }, []);

  const handlePlayer2Join = useCallback(() => {
    setPlayer2Connected(true);
    toast.success('Player 2 Joined!', { description: 'Team up and destroy!' });
  }, [setPlayer2Connected]);

  const handlePlayer2Leave = useCallback(() => {
    setPlayer2Connected(false);
    toast.info('Player 2 Disconnected');
  }, [setPlayer2Connected]);

  const resetGame = useCallback(() => {
    (window as unknown as { gameAPI: { resetGame: () => void } }).gameAPI?.resetGame();
    setAppState('menu');
    setScore(0);
    setStage(1);
    setShowBossWarning(false);
  }, [setScore, setStage]);

  const restartGame = useCallback(() => {
    (window as unknown as { gameAPI: { resetGame: () => void } }).gameAPI?.resetGame();
    setAppState('playing');
    setScore(0);
    setStage(1);
    setShowBossWarning(false);
  }, [setScore, setStage]);

  // Simulate Player 2 joining with key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' && appState === 'playing' && !player2Connected) {
        (window as unknown as { gameAPI: { spawnPlayer2: () => void } }).gameAPI?.spawnPlayer2();
        toast.success('Player 2 Joined!', { description: 'Press P again to remove' });
      } else if (e.key === 'p' && appState === 'playing' && player2Connected) {
        (window as unknown as { gameAPI: { removePlayer2: () => void } }).gameAPI?.removePlayer2();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, player2Connected]);

  // Render different screens based on app state
  if (appState === 'menu') {
    return (
      <div className="min-h-screen bg-[#0A0A15]">
        <Menu onStartGame={startGame} onJoinGame={startMultiplayer} />
        <Toaster />
      </div>
    );
  }

  if (appState === 'multiplayer') {
    return (
      <div className="min-h-screen bg-[#0A0A15]">
        <MultiplayerLobby 
          onBack={() => setAppState('menu')} 
          onStartGame={startGame} 
        />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A15] flex flex-col items-center justify-center relative p-2 md:p-4">
      {/* Game Container */}
      <div 
        ref={gameCanvasRef}
        className="relative w-full max-w-7xl aspect-video bg-black rounded-xl overflow-hidden border-4 border-cyan-500/50 shadow-2xl shadow-cyan-500/20"
      >
        <GameCanvas
          onScoreUpdate={handleScoreUpdate}
          onStageComplete={handleStageComplete}
          onGameOver={handleGameOver}
          onPlayer2Join={handlePlayer2Join}
          onPlayer2Leave={handlePlayer2Leave}
          onBossWarning={handleBossWarning}
          soundManagerRef={soundManagerRef}
        />

        {/* HUD */}
        <HUD 
          player1Lives={playerStats.p1.lives}
          player1Bombs={playerStats.p1.bombs}
          player1Power={playerStats.p1.power}
          player2Lives={playerStats.p2.lives}
          player2Bombs={playerStats.p2.bombs}
          player2Power={playerStats.p2.power}
        />

        {/* Boss Warning Overlay */}
        {showBossWarning && (
          <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center z-30 animate-pulse">
            <div className="text-7xl md:text-9xl font-black text-red-500 tracking-widest animate-bounce"
                 style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 50px #FF0000' }}>
              WARNING
            </div>
            <div className="text-2xl md:text-4xl text-white mt-4 tracking-[0.5em]"
                 style={{ fontFamily: 'Orbitron, sans-serif' }}>
              BOSS APPROACHING
            </div>
            <div className="mt-8 flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-4 h-16 bg-red-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {appState === 'paused' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20">
            <h2 className="text-5xl md:text-7xl font-bold text-cyan-400 mb-8" 
                style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 30px #00D4FF' }}>
              PAUSED
            </h2>
            <div className="flex gap-4">
              <button
                onClick={togglePause}
                className="flex items-center gap-2 px-8 py-4 bg-cyan-600 rounded-lg text-white font-bold text-lg hover:bg-cyan-500 transition-all hover:scale-105"
              >
                <Play className="w-6 h-6" />
                Resume
              </button>
              <button
                onClick={resetGame}
                className="flex items-center gap-2 px-8 py-4 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all"
              >
                <LogOut className="w-6 h-6" />
                Quit
              </button>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {appState === 'gameover' && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-20">
            <h2 className="text-6xl md:text-8xl font-bold text-red-500 mb-4" 
                style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 40px #FF0000' }}>
              GAME OVER
            </h2>
            <div className="flex items-center gap-4 mb-8">
              <Trophy className="w-10 h-10 text-yellow-400" />
              <span className="text-4xl md:text-5xl font-mono text-white">
                {score.toString().padStart(8, '0')}
              </span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={restartGame}
                className="flex items-center gap-2 px-8 py-4 bg-cyan-600 rounded-lg text-white font-bold text-lg hover:bg-cyan-500 transition-all hover:scale-105"
              >
                <RotateCcw className="w-6 h-6" />
                Try Again
              </button>
              <button
                onClick={resetGame}
                className="flex items-center gap-2 px-8 py-4 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all"
              >
                <LogOut className="w-6 h-6" />
                Main Menu
              </button>
            </div>
          </div>
        )}

        {/* Top Controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={toggleMute}
            className="p-3 bg-black/60 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-black/80 transition-colors border border-white/20"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
          {appState === 'playing' && (
            <button
              onClick={togglePause}
              className="p-3 bg-black/60 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-black/80 transition-colors border border-white/20"
            >
              <Pause className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Player 2 Join Hint */}
        {appState === 'playing' && !player2Connected && (
          <div className="absolute top-20 right-4 z-10 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg text-white/60 text-sm border border-white/20">
            Press <span className="text-pink-400 font-bold">P</span> for P2 to join
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-white/50 text-sm text-center flex flex-wrap items-center justify-center gap-4 md:gap-8">
        <span><span className="text-cyan-400 font-bold">P1:</span> WASD + Z/X</span>
        <span><span className="text-pink-400 font-bold">P2:</span> IJKL + N/B</span>
        <span><span className="text-yellow-400 font-bold">Pause:</span> Enter</span>
        <span><span className="text-green-400 font-bold">Mute:</span> M</span>
        <span className="hidden md:inline text-white/30">|</span>
        <span className="text-cyan-400/80">Hold FIRE for continuous beam!</span>
      </div>

      <Toaster />
    </div>
  );
}

export default App;
