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
    <div className="absolute inset-0 z-50 bg-[#0A0A15]">
      {/* Cinematic Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 blur-[100px] animate-pulse delay-700" />
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
