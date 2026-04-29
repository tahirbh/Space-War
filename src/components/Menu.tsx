import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Play, Users, Settings, BookOpen, Trophy, ChevronRight, ChevronLeft, Home } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { LegalDialog } from './LegalDialog';
import { CreditsDialog } from './CreditsDialog';

interface MenuProps {
  onStartGame: () => void;
  onJoinGame: () => void;
  soundManager?: any;
}

export function Menu({ onStartGame, onJoinGame, soundManager }: MenuProps) {
  const { highScore, playerName, setPlayerName } = useGameStore();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLegal, setShowLegal] = useState<{ open: boolean; type: 'privacy' | 'terms' }>({ open: false, type: 'privacy' });
  const [showCredits, setShowCredits] = useState(false);
  const { 
    selectedWeapon, setSelectedWeapon, 
    musicVolume, setMusicVolume,
    sfxVolume, setSfxVolume 
  } = useGameStore();
  const [nameInput, setNameInput] = useState(playerName);
  const [tempMusicVol, setTempMusicVol] = useState(musicVolume);
  const [tempSfxVol, setTempSfxVol] = useState(sfxVolume);

  // Sync temp volumes when dialog opens
  useEffect(() => {
    if (showSettings) {
      setTempMusicVol(musicVolume);
      setTempSfxVol(sfxVolume);
      setNameInput(playerName);
    }
  }, [showSettings, musicVolume, sfxVolume, playerName]);

  const handleSaveSettings = () => {
    soundManager?.playSound('saveSound');
    setPlayerName(nameInput || 'Player 1');
    setMusicVolume(tempMusicVol);
    setSfxVolume(tempSfxVol);
    
    // Apply immediately to sound manager
    if (soundManager) {
      soundManager.setMusicVolume(tempMusicVol);
      soundManager.setSFXVolume(tempSfxVol);
    }
    
    setShowSettings(false);
  };

  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 3;

  const handleNextPage = () => {
    soundManager?.playSound('menuNavigate');
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    soundManager?.playSound('menuNavigate');
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const menuPages = [
    {
      title: 'Combat Deck',
      subtitle: 'MISSION DEPLOYMENT',
      content: (
        <div className="flex flex-row sm:flex-col gap-2 sm:gap-4 w-full justify-center">
          <button
            onClick={onStartGame}
            className={cn(
              "group relative flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4",
              "bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg",
              "text-white font-bold text-sm sm:text-lg uppercase tracking-wider",
              "transition-all duration-300 hover:scale-105 active:scale-95",
              "border border-cyan-400/50"
            )}
          >
            <Play className="w-4 h-4 sm:w-6 sm:h-6 group-hover:animate-pulse" />
            <span className="truncate">Start</span>
            <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={onJoinGame}
            className={cn(
              "group relative flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4",
              "bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg",
              "text-white font-bold text-sm sm:text-lg uppercase tracking-wider",
              "transition-all duration-300 hover:scale-105 active:scale-95",
              "border border-pink-400/50"
            )}
          >
            <Users className="w-4 h-4 sm:w-6 sm:h-6 group-hover:animate-pulse" />
            <span className="truncate">Mission</span>
            <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )
    },
    {
      title: 'Technical Deck',
      subtitle: 'SYSTEM CONFIGURATION',
      content: (
        <div className="flex flex-row sm:flex-col gap-2 sm:gap-4 w-full justify-center">
          <button
            onClick={() => {
              soundManager?.playSound('menuNavigate');
              setShowHowToPlay(true);
            }}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-4",
              "bg-white/10 rounded-lg text-white font-medium text-xs sm:text-lg",
              "transition-all duration-300 hover:bg-white/20 active:scale-95",
              "border border-white/20"
            )}
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            Manual
          </button>

          <button
            onClick={() => {
              soundManager?.playSound('menuNavigate');
              setShowSettings(true);
            }}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-4",
              "bg-white/10 rounded-lg text-white font-medium text-xs sm:text-lg",
              "transition-all duration-300 hover:bg-white/20 active:scale-95",
              "border border-white/20"
            )}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            Config
          </button>
        </div>
      )
    },
    {
      title: 'Archives Deck',
      subtitle: 'INTEL & CREDITS',
      content: (
        <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 w-full justify-center">
          <button 
            onClick={() => setShowLegal({ open: true, type: 'privacy' })}
            className="flex-1 sm:flex-none px-2 py-3 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 text-[10px] sm:text-sm uppercase tracking-widest"
          >
            Privacy
          </button>
          <button 
            onClick={() => setShowLegal({ open: true, type: 'terms' })}
            className="flex-1 sm:flex-none px-2 py-3 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 text-[10px] sm:text-sm uppercase tracking-widest"
          >
            Terms
          </button>
          <button 
            onClick={() => setShowCredits(true)}
            className="flex-1 sm:flex-none px-2 py-3 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 text-[10px] sm:text-sm uppercase tracking-widest"
          >
            Credits
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="h-screen h-[100svh] bg-[#0A0A15] flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Animated Background Stars */}
      <div className="absolute inset-0">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Scanlines Effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-[1vh] sm:gap-8 w-full max-w-4xl px-4 text-center">
        {/* Logo (Stays fixed) */}
        <div className="mb-[1vh] sm:mb-8 transition-all duration-500 transform origin-top scale-75 sm:scale-100">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-tighter"
              style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 40px rgba(0, 212, 255, 0.5)' }}>
            STARSHIPS WAR
          </h1>
          <div className="flex items-center justify-center gap-4 mt-1">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-cyan-500/50" />
            <p className="text-[12px] sm:text-base md:text-lg text-cyan-400 tracking-[0.3em] sm:tracking-[0.5em] uppercase font-bold"
               style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Alpha
            </p>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-cyan-500/50" />
          </div>
        </div>

        {/* High Score (Fixed) - Hidden on very short screens to save space */}
        <div className="hidden sm:flex items-center gap-3 bg-black/50 px-6 py-2 rounded-full border border-cyan-500/30 mb-4">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-white/60 text-[10px] uppercase tracking-wider">High Score</span>
          <span className="text-xl font-mono text-yellow-400">
            {highScore.toString().padStart(8, '0')}
          </span>
        </div>

        {/* Paginated Content Area - Dynamic height */}
        <div className="relative w-full max-w-[350px] sm:max-w-md h-[160px] sm:h-[280px] overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {menuPages.map((page, i) => (
              <div key={i} className="min-w-full px-4 flex flex-col items-center justify-center gap-2 sm:gap-6">
                <div className="text-center">
                  <h3 className="text-[10px] text-cyan-400/60 font-mono tracking-[0.2em] uppercase mb-0.5 sm:mb-1">{page.subtitle}</h3>
                  <h2 className="text-xl sm:text-3xl font-bold text-white tracking-widest uppercase">{page.title}</h2>
                </div>
                {page.content}
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex gap-2 mt-2 sm:mt-4">
          {menuPages.map((_, i) => (
            <div 
              key={i}
              className={cn(
                "h-1 transition-all duration-300 rounded-full",
                currentPage === i ? "w-8 bg-cyan-400" : "w-2 bg-white/20"
              )}
            />
          ))}
        </div>
      </div>

      {/* Navigation Buttons (Corners) - Adjusted for small screens and thumb reach */}
      <div className="fixed bottom-4 sm:bottom-8 left-4 sm:left-10 z-20 transition-all duration-300">
        {currentPage > 0 && (
          <button
            onClick={handlePrevPage}
            className="group flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 text-white/40 hover:text-white transition-all active:scale-95"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center group-hover:border-cyan-400 group-hover:bg-cyan-500/10 group-hover:scale-110 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:text-cyan-400" />
            </div>
            <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.2em] uppercase opacity-40 group-hover:opacity-100 transition-opacity hidden sm:inline">Back</span>
          </button>
        )}
      </div>

      <div className="fixed bottom-4 sm:bottom-8 right-4 sm:right-10 z-20 transition-all duration-300">
        <button
          onClick={handleNextPage}
          className="group flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 text-white/40 hover:text-white transition-all active:scale-95"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center group-hover:border-cyan-400 group-hover:bg-cyan-500/10 group-hover:scale-110 transition-all shadow-[0_0_20px_rgba(0,212,255,0)] group-hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            {currentPage === totalPages - 1 ? (
              <Home className="w-6 h-6 sm:w-8 sm:h-8 group-hover:text-cyan-400" />
            ) : (
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:text-cyan-400 animate-pulse" />
            )}
          </div>
          <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.2em] uppercase opacity-40 group-hover:opacity-100 transition-opacity hidden sm:inline">
            {currentPage === totalPages - 1 ? 'Main' : 'Next Deck'}
          </span>
        </button>
      </div>

      <LegalDialog 
        open={showLegal.open} 
        onOpenChange={(open: boolean) => setShowLegal(prev => ({ ...prev, open }))} 
        type={showLegal.type} 
      />
      
      <CreditsDialog 
        open={showCredits} 
        onOpenChange={setShowCredits} 
      />

      {/* How to Play Dialog */}
      <Dialog open={showHowToPlay} onOpenChange={setShowHowToPlay}>
        <DialogContent className="bg-[#0A0A15] border-cyan-500/50 text-white w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6 [&>button]:text-cyan-400 [&>button]:opacity-100">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              HOW TO PLAY
            </DialogTitle>
            <DialogDescription className="text-white/60 text-sm">
              Master the art of space combat
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Controls */}
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-3">Controls</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-white font-mono text-sm sm:text-base">WASD / Arrows</div>
                  <div className="text-white/60 text-xs sm:text-sm">Move Ship</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-white font-mono text-sm sm:text-base">Z / Space</div>
                  <div className="text-white/60 text-xs sm:text-sm">Shoot</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-white font-mono text-sm sm:text-base">B / Shift</div>
                  <div className="text-white/60 text-xs sm:text-sm">Use Bomb</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-white font-mono text-sm sm:text-base">Enter</div>
                  <div className="text-white/60 text-xs sm:text-sm">Pause</div>
                </div>
              </div>
            </div>

            {/* Power-ups */}
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-3">Power-ups</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold">P</div>
                  <div>
                    <div className="text-white font-medium">Power Up</div>
                    <div className="text-white/60 text-sm">Increase shot power (max 5)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center font-bold">B</div>
                  <div>
                    <div className="text-white font-medium">Bomb</div>
                    <div className="text-white/60 text-sm">Clear screen of bullets</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">S</div>
                  <div>
                    <div className="text-white font-medium">Speed Up</div>
                    <div className="text-white/60 text-sm">Move faster</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-xs">1UP</div>
                  <div>
                    <div className="text-white font-medium">Extra Life</div>
                    <div className="text-white/60 text-sm">Rare! Adds a life</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-3">Tips</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  Try the Homing Missile for automatic targeting!
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  Laser is now rapid-fire - hold shoot for a stream of beams
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  Use bombs when overwhelmed - they clear all enemy bullets
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-[#0A0A15] border-cyan-500/50 text-white w-[95vw] sm:max-w-md p-4 sm:p-6 [&>button]:text-cyan-400 [&>button]:opacity-100">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              SETTINGS
            </DialogTitle>
            <DialogDescription className="text-white/60 text-sm">
              Customize your experience
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-white/80 text-sm mb-2 block">Player Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none"
                maxLength={12}
              />
            </div>

            <div>
              <label className="text-white/80 text-xs sm:text-sm mb-2 block font-medium uppercase tracking-wider">Starting Weapon</label>
              <div className="grid grid-cols-3 gap-2">
                {(['laser', 'homing', 'booster'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      soundManager?.playSound('menuNavigate');
                      setSelectedWeapon(w);
                    }}
                    className={cn(
                      "px-2 sm:px-3 py-2 rounded-lg border text-[10px] sm:text-sm capitalize transition-all",
                      selectedWeapon === w 
                        ? "bg-cyan-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,212,255,0.4)]" 
                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                    )}
                  >
                    {w === 'homing' ? 'Missile' : w}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-white/80 text-xs sm:text-sm font-medium uppercase tracking-wider">Music Volume</label>
                  <span className="text-cyan-400 font-mono text-xs">{Math.round(tempMusicVol * 100)}%</span>
                </div>
                <Slider
                  value={[tempMusicVol * 100]}
                  max={100}
                  step={1}
                  onValueChange={(val) => setTempMusicVol(val[0] / 100)}
                  className="[&>[role=slider]]:bg-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-white/80 text-xs sm:text-sm font-medium uppercase tracking-wider">SFX Volume</label>
                  <span className="text-pink-400 font-mono text-xs">{Math.round(tempSfxVol * 100)}%</span>
                </div>
                <Slider
                  value={[tempSfxVol * 100]}
                  max={100}
                  step={1}
                  onValueChange={(val) => setTempSfxVol(val[0] / 100)}
                  className="[&>[role=slider]]:bg-pink-400"
                />
              </div>
            </div>

            {/* Background selection removed - stages now use fixed sequential parallax backgrounds */}


            <div className="bg-white/5 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Game Info</h4>
              <div className="text-white/60 text-sm space-y-1">
                <p>Resolution: 1280x720</p>
                <p>Target FPS: 60</p>
                <p>Multiplayer: WebSocket</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 px-4 py-3 bg-white/10 rounded-lg text-white/80 hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="flex-1 px-4 py-3 bg-cyan-600 rounded-lg text-white font-medium hover:bg-cyan-500 transition-colors"
            >
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
