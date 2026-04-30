import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { GameCanvas } from '@/components/GameCanvas';
import { HUD } from '@/components/HUD';
import { Menu } from '@/components/Menu';
import { MultiplayerMission } from '@/components/MultiplayerMission';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Pause, Play, RotateCcw, LogOut, Trophy, Volume2, VolumeX } from 'lucide-react';
import { IntermissionUI } from '@/components/IntermissionUI';
import { ShopMenu } from '@/components/ShopMenu';
import { OrientationOverlay } from '@/components/OrientationOverlay';
import { IntroStory } from '@/components/IntroStory';

import { SoundManager } from '@/engine/SoundManager';

type AppState = 'start' | 'menu' | 'intro' | 'multiplayer' | 'playing' | 'paused' | 'gameover' | 'victory' | 'boss-warning' | 'intermission' | 'shop';

function App() {
  const soundManagerRefStatic = useRef<SoundManager | null>(null);

  // Initialize SoundManager once
  if (!soundManagerRefStatic.current) {
    soundManagerRefStatic.current = new SoundManager();
  }
  const [appState, setAppState] = useState<AppState>('start');
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const {
    score, highScore, setScore, setHighScore, stage, setStage,
    player2Connected, setPlayer2Connected
  } = useGameStore();
  const [playerStats, setPlayerStats] = useState({
    p1: { lives: 9, bombs: 90, power: 1 },
    p2: { lives: 9, bombs: 90, power: 1 },
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
        case 'b':
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
        case ',':
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
        case 'b':
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
        case ',':
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

  // Expose store to window for engine access and handle deep links
  useEffect(() => {
    (window as any).gameStore = useGameStore.getState();
    
    // Deep Link Check
    const params = new URLSearchParams(window.location.search);
    const missionCode = params.get('mission') || params.get('lobby');
    const targetStage = params.get('stage');
    const targetScore = params.get('score');

    if (missionCode && missionCode.length === 6) {
      const { setPendingState } = useGameStore.getState();
      setPendingState(
        missionCode.toUpperCase(), 
        targetStage ? parseInt(targetStage) : 1,
        targetScore ? parseInt(targetScore) : 0
      );
      
      toast.success(`Mission Signal Detected: ${missionCode.toUpperCase()}`);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
    setAppState('intro');
    if (soundManagerRefStatic.current) {
      soundManagerRefStatic.current.playSound('menuSelect');
    }
  }, []);

  const startMission = useCallback(() => {
    const { pendingMissionCode, pendingStage, pendingScore, clearPendingState, setRoomCode, setIsHost, setPlayer2Connected } = useGameStore.getState();
    
    if (pendingMissionCode) {
      setRoomCode(pendingMissionCode);
      setIsHost(false);
      setPlayer2Connected(true);
      if (pendingStage !== null) setStage(pendingStage);
      if (pendingScore !== null) setScore(pendingScore);
      clearPendingState();
      toast.success('Joined Mission Sequence Complete');
    }

    setAppState('playing');
    if (soundManagerRefStatic.current) {
      soundManagerRefStatic.current.playSound('gameStart');
    }
    toast.success('Game Started!', { description: 'Destroy all enemies!' });
  }, [setScore, setStage]);

  const startMultiplayer = useCallback(() => {
    if (soundManagerRefStatic.current) {
      soundManagerRefStatic.current.playSound('menuSelect');
    }
    setAppState('multiplayer');
  }, []);

  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
    }
  }, [highScore, setScore, setHighScore]);

  const handleStageComplete = useCallback(() => {
    toast.success(`Get Ready for Next Stage!`, { description: 'Enemies incoming...', duration: 4000 });
  }, []);

  const handleIntermissionStart = useCallback(() => {
    setAppState('intermission');
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

  const handlePlayerStatsUpdate = useCallback((stats: any) => {
    setPlayerStats(prev => {
      const newP1 = stats.p1 || prev.p1;
      const newP2 = stats.p2 || prev.p2;
      
      // Only update if changed
      if (newP1.lives !== prev.p1.lives || newP1.bombs !== prev.p1.bombs || newP1.power !== prev.p1.power ||
          newP2.lives !== prev.p2.lives || newP2.bombs !== prev.p2.bombs || newP2.power !== prev.p2.power) {
        return { p1: newP1, p2: newP2 };
      }
      return prev;
    });
  }, []);

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
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [isSystemReady, setIsSystemReady] = useState(false);
  const hasPlayedStart = useRef(false);

  useEffect(() => {
    const logs = [
      'INITIALIZING NEURAL CORE...',
      'CHECKING QUANTUM STABILITY...',
      'LOADING ALPHA BLADE ENGINE...',
      'ESTABLISHING SATELLITE LINK...',
      'OPTIMIZING COMBAT HUD...',
      'NEURAL LINK ESTABLISHED'
    ];
    
    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setBootLog(prev => [...prev, logs[i]]);
        i++;
      } else {
        setIsSystemReady(true);
        clearInterval(interval);
        if (!hasPlayedStart.current && soundManagerRefStatic.current) {
          soundManagerRefStatic.current.playSound('gameStart');
          hasPlayedStart.current = true;
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (appState === 'start') {
    return (
      <div
        className="min-h-screen bg-black flex items-center justify-center cursor-pointer overflow-hidden group"
        onClick={() => {
          if (isSystemReady) {
            // Request fullscreen
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
              elem.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
              });
            }

            setAppState('menu');
            if (soundManagerRefStatic.current) {
              soundManagerRefStatic.current.resume();
              soundManagerRefStatic.current.startMissionMusic();
            }
          }
        }}
      >
        <div className="absolute inset-0 bg-[#0A0A15]">
          <div className="absolute inset-0">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center max-w-lg">
          {!isSystemReady ? (
            <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
          ) : (
            <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-green-500 rounded-full flex items-center justify-center animate-pulse mb-4">
              <div className="w-6 h-6 bg-green-500 rounded-full" />
            </div>
          )}
          
          <h1 className={cn(
            "text-2xl sm:text-3xl md:text-5xl font-black tracking-[0.1em] sm:tracking-[0.3em] uppercase transition-all duration-700",
            isSystemReady ? "text-green-400" : "text-cyan-400"
          )}
            style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {isSystemReady ? 'Link Established' : 'System Boot'}
          </h1>

          <div className="w-full bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-[10px] sm:text-xs text-left space-y-1 min-h-[120px]">
            {bootLog.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-white/20">[{i.toString().padStart(2, '0')}]</span>
                <span className={i === bootLog.length - 1 ? "text-cyan-400 animate-pulse" : "text-white/60"}>
                  {log}
                </span>
              </div>
            ))}
          </div>

          <p className={cn(
            "font-mono text-xs sm:text-sm tracking-widest transition-all duration-500",
            isSystemReady ? "text-green-400/80 animate-bounce" : "text-white/20"
          )}>
            {isSystemReady ? '- CLICK TO DEPLOY -' : '- CONNECTING NEURAL LINK -'}
          </p>
        </div>

        <div className="absolute bottom-6 md:bottom-10 left-0 right-0 text-center text-[8px] sm:text-[10px] text-white/20 font-mono tracking-widest uppercase">
          Neural-Net Alpha Blade Engine v4.1.0
        </div>
        <OrientationOverlay />
      </div>
    );
  }

  if (appState === 'intro') {
    return (
      <div className="min-h-screen bg-[#0A0A15]">
        <IntroStory 
          onComplete={startMission} 
          soundManager={soundManagerRefStatic.current}
        />
        <Toaster />
        <OrientationOverlay />
      </div>
    );
  }

  if (appState === 'menu') {
    return (
      <div className="min-h-screen bg-[#0A0A15]">
        <Menu 
          onStartGame={startGame} 
          onJoinGame={startMultiplayer} 
          soundManager={soundManagerRefStatic.current}
        />
        <Toaster />
        <OrientationOverlay />
      </div>
    );
  }

  if (appState === 'multiplayer') {
    return (
      <div className="min-h-screen bg-[#0A0A15]">
        <MultiplayerMission
          onBack={() => setAppState('menu')}
          onStartGame={startGame}
        />
        <Toaster />
        <OrientationOverlay />
      </div>
    );
  }

  const proceedToNextMission = () => {
    (window as any).gameAPI?.nextStage();
    setAppState('playing');
  };

  return (
    <div className="w-screen h-screen bg-[#0A0A15] flex flex-col relative overflow-hidden touch-none select-none">
      {/* Game Container */}
      <div
        ref={gameCanvasRef}
        className="relative flex-1 w-full h-full bg-black overflow-hidden"
      >
        <GameCanvas
          onScoreUpdate={handleScoreUpdate}
          onStageComplete={handleStageComplete}
          onIntermissionStart={handleIntermissionStart}
          onGameOver={handleGameOver}
          onPlayer2Join={handlePlayer2Join}
          onPlayer2Leave={handlePlayer2Leave}
          onBossWarning={handleBossWarning}
          onPlayerStatsUpdate={handlePlayerStatsUpdate}
          soundManager={soundManagerRefStatic.current}
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

        {/* Intermission View */}
        {appState === 'intermission' && (
          <IntermissionUI
            stage={stage}
            onFinish={proceedToNextMission}
          />
        )}

        {/* Shop View */}
        {appState === 'shop' && (
          <ShopMenu onContinue={proceedToNextMission} />
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
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex gap-1 sm:gap-2">
          <button
            onClick={toggleMute}
            className="p-1.5 sm:p-3 bg-black/60 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-black/80 transition-colors border border-white/20"
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-6 sm:h-6" /> : <Volume2 className="w-4 h-4 sm:w-6 sm:h-6" />}
          </button>
          {appState === 'playing' && (
            <button
              onClick={togglePause}
              className="p-1.5 sm:p-3 bg-black/60 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-black/80 transition-colors border border-white/20"
            >
              <Pause className="w-4 h-4 sm:w-6 sm:h-6" />
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
      <div className="absolute bottom-16 sm:bottom-2 left-0 right-0 z-10 text-white/40 text-[10px] sm:text-sm text-center flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:gap-8 pointer-events-none px-4 mobile-950-hide landscape-hide">
        <span><span className="text-cyan-400 font-bold">P1:</span> WASD + Z/B</span>
        <span className="hidden xs:inline"><span className="text-pink-400 font-bold">P2:</span> IJKL + N/,</span>
        <span className="hidden xs:inline"><span className="text-yellow-400 font-bold">Pause:</span> Enter</span>
        <span className="hidden xs:inline"><span className="text-green-400 font-bold">Mute:</span> M</span>
        <span className="hidden md:inline text-white/30">|</span>
        <span className="text-cyan-400/60 font-medium">Rapid-fire beams enabled!</span>
      </div>

      <Toaster />
      <OrientationOverlay />
    </div>
  );
}

export default App;
