import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Heart, Zap, Bomb, Trophy, User, Users } from 'lucide-react';

interface HUDProps {
  player1Lives?: number;
  player1Bombs?: number;
  player1Power?: number;
  player2Lives?: number;
  player2Bombs?: number;
  player2Power?: number;
}

export function HUD({ 
  player1Lives = 3, 
  player1Bombs = 2, 
  player1Power = 1,
  player2Lives = 3,
  player2Bombs = 2,
  player2Power = 1,
}: HUDProps) {
  const { score, stage, player2Connected, playerName, coins } = useGameStore();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Bar - Score and Stage */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-2 sm:p-3 md:p-4 gap-2 sm:gap-4">
        {/* Score */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-1 sm:gap-2">
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-400 shrink-0" />
            <span className="text-base sm:text-xl md:text-3xl font-bold text-white font-mono tracking-wider truncate mobile-950-small-text"
                  style={{ textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
              {score.toString().padStart(8, '0')}
            </span>
          </div>
          <div className="text-[10px] sm:text-xs md:text-sm text-yellow-500 font-mono mt-0.5 sm:mt-1">
            G: {coins.toString().padStart(6, '0')}
          </div>
        </div>

        {/* Stage */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[8px] sm:text-xs text-white/60 uppercase tracking-widest mobile-950-hide">Stage</span>
          <span className="text-xl sm:text-2xl md:text-4xl font-bold text-cyan-400 font-mono mobile-950-small-title"
                style={{ textShadow: '0 0 15px rgba(0, 212, 255, 0.6)' }}>
            {stage}
          </span>
        </div>

        {/* Player 2 Indicator */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
          {player2Connected ? (
            <>
              <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400 shrink-0" />
              <span className="text-green-400 font-bold text-[10px] sm:text-sm md:text-base hidden xs:inline">P2 CONNECTED</span>
            </>
          ) : (
            <>
              <User className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white/40 shrink-0" />
              <span className="text-white/40 text-[10px] sm:text-sm md:text-base hidden xs:inline">P2 JOIN...</span>
            </>
          )}
        </div>
      </div>

      {/* Bottom Bar - Player Stats */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end p-3 md:p-4">
        {/* Player 1 Stats */}
        <div className="flex flex-col gap-1 md:gap-2">
          <div className="text-cyan-400 font-bold text-xs md:text-sm" 
               style={{ textShadow: '0 0 8px rgba(0, 212, 255, 0.5)' }}>
            P1: {playerName}
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Lives */}
            <div className="flex items-center gap-0.5 md:gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart 
                  key={i} 
                  className={cn(
                    "w-4 h-4 md:w-6 md:h-6",
                    i < player1Lives ? "text-red-500 fill-red-500" : "text-white/20"
                  )} 
                />
              ))}
            </div>
            {/* Bombs */}
            <div className="flex items-center gap-1">
              <Bomb className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
              <span className="text-white font-mono text-base md:text-xl">x{player1Bombs}</span>
            </div>
            {/* Power */}
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "w-2 h-3 md:w-3 md:h-4 rounded-sm transition-all",
                      i < player1Power ? "bg-yellow-400 shadow-lg shadow-yellow-400/50" : "bg-white/20"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Player 2 Stats */}
        {player2Connected && (
          <div className="flex flex-col gap-1 md:gap-2 items-end">
            <div className="text-pink-400 font-bold text-xs md:text-sm"
                 style={{ textShadow: '0 0 8px rgba(255, 51, 102, 0.5)' }}>
              P2: Guest
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {/* Power */}
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "w-2 h-3 md:w-3 md:h-4 rounded-sm transition-all",
                        i < player2Power ? "bg-pink-400 shadow-lg shadow-pink-400/50" : "bg-white/20"
                      )}
                    />
                  ))}
                </div>
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
              </div>
              {/* Bombs */}
              <div className="flex items-center gap-1">
                <span className="text-white font-mono text-base md:text-xl">x{player2Bombs}</span>
                <Bomb className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
              </div>
              {/* Lives */}
              <div className="flex items-center gap-0.5 md:gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart 
                    key={i} 
                    className={cn(
                      "w-4 h-4 md:w-6 md:h-6",
                      i < player2Lives ? "text-red-500 fill-red-500" : "text-white/20"
                    )} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
