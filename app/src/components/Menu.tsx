import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Play, Users, Settings, BookOpen, Trophy, Zap, Rocket, Target } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MenuProps {
  onStartGame: () => void;
  onJoinGame: () => void;
}

export function Menu({ onStartGame, onJoinGame }: MenuProps) {
  const { highScore, playerName, setPlayerName } = useGameStore();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  const handleSaveSettings = () => {
    setPlayerName(nameInput || 'Player 1');
    setShowSettings(false);
  };

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
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-tighter"
              style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 40px rgba(0, 212, 255, 0.5)' }}>
            STARSHIPS WAR
          </h1>
          <p className="text-xl md:text-2xl text-cyan-400 tracking-[0.5em] mt-2 uppercase"
             style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px rgba(0, 212, 255, 0.5)' }}>
            Alpha
          </p>
        </div>

        {/* High Score */}
        <div className="flex items-center gap-3 bg-black/50 px-6 py-3 rounded-full border border-cyan-500/30">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-white/60 text-sm uppercase tracking-wider">High Score</span>
          <span className="text-2xl font-mono text-yellow-400">
            {highScore.toString().padStart(8, '0')}
          </span>
        </div>

        {/* Menu Buttons */}
        <div className="flex flex-col gap-4 w-72">
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

          <div className="flex gap-4">
            <button
              onClick={() => setShowHowToPlay(true)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3",
                "bg-white/10 rounded-lg text-white/80 font-medium",
                "transition-all duration-300 hover:bg-white/20 hover:text-white",
                "border border-white/20"
              )}
            >
              <BookOpen className="w-5 h-5" />
              How to Play
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3",
                "bg-white/10 rounded-lg text-white/80 font-medium",
                "transition-all duration-300 hover:bg-white/20 hover:text-white",
                "border border-white/20"
              )}
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="flex items-center gap-8 mt-8">
          <div className="flex flex-col items-center gap-2 text-cyan-400/60">
            <Rocket className="w-8 h-8" />
            <span className="text-xs uppercase tracking-wider">Shoot</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-pink-400/60">
            <Zap className="w-8 h-8" />
            <span className="text-xs uppercase tracking-wider">Dodge</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-yellow-400/60">
            <Target className="w-8 h-8" />
            <span className="text-xs uppercase tracking-wider">Destroy</span>
          </div>
        </div>
      </div>

      {/* How to Play Dialog */}
      <Dialog open={showHowToPlay} onOpenChange={setShowHowToPlay}>
        <DialogContent className="bg-[#0A0A15] border-cyan-500/50 text-white max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              HOW TO PLAY
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Master the art of space combat
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Controls */}
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-3">Controls</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-white font-mono">WASD / Arrows</div>
                  <div className="text-white/60 text-sm">Move Ship</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-white font-mono">Z / Space</div>
                  <div className="text-white/60 text-sm">Shoot</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-white font-mono">X / Shift</div>
                  <div className="text-white/60 text-sm">Use Bomb</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-white font-mono">Enter</div>
                  <div className="text-white/60 text-sm">Pause</div>
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
                  Collect Power-ups (P) to increase your firepower
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  Use bombs when overwhelmed - they clear all enemy bullets
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  Bosses appear at the end of each stage
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  Player 2 can join anytime during gameplay!
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-[#0A0A15] border-cyan-500/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              SETTINGS
            </DialogTitle>
            <DialogDescription className="text-white/60">
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
