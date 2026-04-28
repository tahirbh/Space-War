import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Play, Users, Settings, BookOpen, Trophy } from 'lucide-react';
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
    selectedBackground, setSelectedBackground,
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
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={onStartGame}
            className={cn(
              "group relative flex items-center justify-center gap-3 px-8 py-4",
              "bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg",
              "text-white font-bold text-lg uppercase tracking-wider",
              "transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/50",
              "border-2 border-cyan-400/50"
            )}
          >
            <Play className="w-6 h-6 group-hover:animate-pulse" />
            Start Game
            <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={onJoinGame}
            className={cn(
              "group relative flex items-center justify-center gap-3 px-8 py-4",
              "bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg",
              "text-white font-bold text-lg uppercase tracking-wider",
              "transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/50",
              "border-2 border-pink-400/50"
            )}
          >
            <Users className="w-6 h-6 group-hover:animate-pulse" />
            Multiplayer
            <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )
    },
    {
      title: 'Technical Deck',
      subtitle: 'SYSTEM CONFIGURATION',
      content: (
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => {
              soundManager?.playSound('menuNavigate');
              setShowHowToPlay(true);
            }}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-4",
              "bg-white/10 rounded-lg text-white font-medium text-lg",
              "transition-all duration-300 hover:bg-white/20 hover:text-white",
              "border border-white/20"
            )}
          >
            <BookOpen className="w-5 h-5" />
            How to Play
          </button>

          <button
            onClick={() => {
              soundManager?.playSound('menuNavigate');
              setShowSettings(true);
            }}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-4",
              "bg-white/10 rounded-lg text-white font-medium text-lg",
              "transition-all duration-300 hover:bg-white/20 hover:text-white",
              "border border-white/20"
            )}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>
      )
    },
    {
      title: 'Archives Deck',
      subtitle: 'INTEL & CREDITS',
      content: (
        <div className="flex flex-col gap-3 w-full">
          <button 
            onClick={() => setShowLegal({ open: true, type: 'privacy' })}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 hover:text-cyan-400 transition-all text-sm uppercase tracking-widest"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => setShowLegal({ open: true, type: 'terms' })}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 hover:text-pink-400 transition-all text-sm uppercase tracking-widest"
          >
            Terms of Service
          </button>
          <button 
            onClick={() => setShowCredits(true)}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 hover:text-yellow-400 transition-all text-sm uppercase tracking-widest"
          >
            View Credits
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A15] flex flex-col items-center justify-center relative overflow-hidden">
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
      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-8 w-full max-w-4xl px-4 text-center">
        {/* Logo (Stays fixed) */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-tighter"
              style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 40px rgba(0, 212, 255, 0.5)' }}>
            STARSHIPS WAR
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-cyan-500/50" />
            <p className="text-sm sm:text-base md:text-lg text-cyan-400 tracking-[0.5em] uppercase"
               style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Alpha
            </p>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-cyan-500/50" />
          </div>
        </div>

        {/* High Score (Fixed) */}
        <div className="flex items-center gap-3 bg-black/50 px-6 py-2 rounded-full border border-cyan-500/30 mb-4 scale-90 sm:scale-100">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-white/60 text-[10px] uppercase tracking-wider">High Score</span>
          <span className="text-xl font-mono text-yellow-400">
            {highScore.toString().padStart(8, '0')}
          </span>
        </div>

        {/* Paginated Content Area */}
        <div className="relative w-full max-w-[320px] sm:max-w-md h-[240px] sm:h-[280px] overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {menuPages.map((page, i) => (
              <div key={i} className="min-w-full px-4 flex flex-col items-center justify-center gap-6">
                <div className="text-center">
                  <h3 className="text-xs text-cyan-400/60 font-mono tracking-[0.3em] uppercase mb-1">{page.subtitle}</h3>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-widest uppercase">{page.title}</h2>
                </div>
                {page.content}
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex gap-2 mt-4">
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

      {/* Navigation Buttons (Corners) */}
      <div className="fixed bottom-6 left-6 z-20">
        {currentPage > 0 && (
          <button
            onClick={handlePrevPage}
            className="group flex flex-col items-center gap-2 p-4 text-white/40 hover:text-white transition-all"
          >
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity">Previous Deck</span>
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-cyan-400 group-hover:scale-110 transition-all">
              <span className="text-2xl">←</span>
            </div>
          </button>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={handleNextPage}
          className="group flex flex-col items-center gap-2 p-4 text-white/40 hover:text-white transition-all"
        >
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity">
            {currentPage === totalPages - 1 ? 'Back to Combat' : 'Next Deck'}
          </span>
          <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-cyan-400 group-hover:scale-110 transition-all shadow-[0_0_20px_rgba(0,212,255,0)] group-hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]">
            <span className="text-2xl">{currentPage === totalPages - 1 ? '↺' : '→'}</span>
          </div>
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

            <div>
              <label className="text-white/80 text-xs sm:text-sm mb-2 block font-medium uppercase tracking-wider">Background Theme</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {[
                  { id: 'space', name: 'Deep Space' },
                  { id: 'clouds', name: 'Cloudy Sky' },
                  { id: 'cyber', name: 'Cyber City' },
                  { id: 'ocean', name: 'Ocean Flight' },
                  { id: 'jungle', name: 'Amazon Jungle' }
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => {
                      soundManager?.playSound('menuNavigate');
                      setSelectedBackground(bg.id);
                    }}
                    className={cn(
                      "px-2 sm:px-3 py-2 rounded-lg border text-[10px] sm:text-sm transition-all",
                      selectedBackground === bg.id 
                        ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                        : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                    )}
                  >
                    {bg.name}
                  </button>
                ))}
              </div>
              
              {/* Live Background Preview Box */}
              <div className="relative w-full h-24 rounded-lg overflow-hidden border border-white/20 bg-black">
                {selectedBackground === 'space' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#050510]">
                    <div className="absolute w-1 h-1 bg-white rounded-full top-4 left-4 shadow-[0_0_4px_#fff]"></div>
                    <div className="absolute w-2 h-2 bg-blue-400 rounded-full top-12 left-20 opacity-50 blur-[2px]"></div>
                    <div className="absolute w-1 h-1 bg-white rounded-full top-8 right-10 shadow-[0_0_4px_#fff]"></div>
                    <div className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full bottom-4 left-1/2 opacity-50 blur-[1px]"></div>
                  </div>
                )}
                {selectedBackground === 'clouds' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] to-[#E0F6FF]">
                    <div className="absolute w-16 h-8 bg-white/80 rounded-full top-4 left-4 blur-[4px]"></div>
                    <div className="absolute w-20 h-10 bg-white/60 rounded-full bottom-2 right-4 blur-[6px]"></div>
                  </div>
                )}
                {selectedBackground === 'cyber' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#1a0b2e] to-[#000000] border-b-2 border-pink-500">
                    <div className="absolute bottom-0 left-4 w-6 h-12 bg-[#2a1b3e] border border-pink-500/30"></div>
                    <div className="absolute bottom-0 left-12 w-8 h-16 bg-[#2a1b3e] border border-cyan-500/30"></div>
                    <div className="absolute bottom-0 right-8 w-10 h-10 bg-[#2a1b3e] border border-purple-500/30"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,255,0.1)_1px,transparent_1px)] bg-[size:100%_4px]"></div>
                  </div>
                )}
                {selectedBackground === 'ocean' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364]">
                    <div className="absolute bottom-4 left-4 w-12 h-1 bg-white/40 rounded-full"></div>
                    <div className="absolute bottom-8 right-8 w-16 h-1.5 bg-white/30 rounded-full"></div>
                    <div className="absolute bottom-2 left-1/2 w-8 h-1 bg-white/50 rounded-full"></div>
                  </div>
                )}
                {selectedBackground === 'jungle' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#11998e] to-[#38ef7d]">
                    <div className="absolute bottom-0 w-full h-4 bg-[#1e3d17]"></div>
                    <div className="absolute bottom-4 left-4 w-4 h-12 bg-[#2d5a27] rounded-t-full"></div>
                    <div className="absolute bottom-4 left-2 w-8 h-8 bg-[#1e3d17] rounded-full"></div>
                    <div className="absolute bottom-4 right-6 w-6 h-16 bg-[#2d5a27] rounded-t-full"></div>
                    <div className="absolute bottom-8 right-4 w-10 h-10 bg-[#1e3d17] rounded-full"></div>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-white/80 font-bold text-xs uppercase tracking-widest drop-shadow-md">Preview</span>
                </div>
              </div>
            </div>

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
