import { MatrixDialogue } from './MatrixDialogue';
import { useGameStore } from '@/store/gameStore';

interface IntroStoryProps {
  onComplete: () => void;
}

export function IntroStory({ onComplete }: IntroStoryProps) {
  const { playerName } = useGameStore();

  const dialogue = [
    { 
      speaker: 'Hangar Command', 
      text: `ALL UNITS, PREPARE FOR DEPLOYMENT.\n\nPilot ${playerName}, your Alpha Blade unit is fueled and armed. Neural link synchronization is at 99.8%.` 
    },
    { 
      speaker: 'Commander Sarah', 
      text: `Captain, the situation is critical. The Amazon Jungle sector has been overrun by ground-to-air experimental tanks.\n\nYour mission is to infiltrate the airspace, eliminate hostiles, and locate the source of the anomaly.` 
    },
    { 
      speaker: 'Captain Jax', 
      text: "Copy that, Command. All systems are green. I'm seeing multiple bogeys on the long-range scan already.\n\nThey won't know what hit them. Engaging stealth thrusters now." 
    },
    { 
      speaker: 'Commander Sarah', 
      text: "Good luck, Captain. We've authorized a 90-bomb payload for this operation. Don't hold back.\n\nSee you on the other side." 
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      {/* Cinematic Cockpit Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url('/cockpit_briefing_view.png')`,
          filter: 'contrast(1.2) brightness(0.8) saturate(1.2)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      </div>

      {/* Holographic HUD Overlay Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-3xl animate-pulse" />
        <div className="absolute top-10 right-10 w-32 h-32 border-r-2 border-t-2 border-cyan-500/30 rounded-tr-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-10 left-10 w-32 h-32 border-l-2 border-b-2 border-cyan-500/30 rounded-bl-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-10 right-10 w-32 h-32 border-r-2 border-b-2 border-cyan-500/30 rounded-br-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8">
        <div className="mb-12 text-center animate-in fade-in slide-in-from-top duration-1000">
          <h2 className="text-cyan-400 font-mono text-sm tracking-[0.5em] uppercase mb-2">Operation: Alpha Strike</h2>
          <div className="h-[1px] w-64 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto" />
        </div>

        <MatrixDialogue 
          messages={dialogue} 
          onComplete={onComplete} 
        />
      </div>
    </div>
  );
}
