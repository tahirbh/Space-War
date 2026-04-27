import { useState } from 'react';
import { MatrixDialogue } from './MatrixDialogue';
import { ShopMenu } from './ShopMenu';
import { useGameStore } from '@/store/gameStore';

interface IntermissionUIProps {
  stage: number;
  onFinish: () => void;
}

export function IntermissionUI({ stage, onFinish }: IntermissionUIProps) {
  const [phase, setPhase] = useState<'dialogue' | 'shop'>('dialogue');
  const { playerName } = useGameStore();

  const dialogue = [
    { 
      speaker: 'Commander Sarah', 
      text: `Welcome back, Captain ${playerName}. The docking sequence is complete and we've established a secure mid-air link.\n\nOur scanners indicate high levels of enemy activity in the next sector. We need to be fast.` 
    },
    { 
      speaker: 'Captain Jax', 
      text: 'Thank you, Commander. The mission was intense. Those blue fire modules were glitchy but we managed to push through.\n\nI need a full systems check and a weapon recalibration before we hit the next waypoint.' 
    },
    { 
      speaker: 'Commander Sarah', 
      text: "I've instructed the hangar crew to fix the spread fire emitters. You'll should find them much more effective now.\n\nAlso, your refueling tanker is moving into position. Stay steady while we transfer the plasma cells." 
    },
    { 
      speaker: 'Captain Jax', 
      text: 'Excellent. I also collected a significant amount of data... and credits from the debris.\n\nReady to spend some of those hard-earned coins on some serious upgrades.' 
    },
    { 
      speaker: 'Commander Sarah', 
      text: `Good. Use those credits in the armory. We need you at peak performance for Stage ${stage + 1}.\n\nThe fate of the sector depends on your next move.` 
    },
  ];

  if (phase === 'shop') {
    return <ShopMenu onContinue={onFinish} />;
  }

  return (
    <div className="absolute inset-0 z-40">
      {/* Background Image (The Control Tower) */}
      <div 
        className="absolute inset-0 bg-cover bg-center animate-fade-clear"
        style={{ backgroundImage: 'url("/intermission.png")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />
      </div>

      {/* Atmospheric Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 text-cyan-500/30 font-mono text-xs uppercase tracking-[0.5em] animate-pulse">
          Control Tower: Online | Hangar Bay B-12
        </div>
        
        <div className="absolute bottom-10 right-10 text-red-500/30 font-mono text-xs uppercase tracking-[0.5em]">
          Status: Mid-air refueling in progress...
        </div>
      </div>

      <MatrixDialogue 
        messages={dialogue} 
        onComplete={onFinish} 
      />
    </div>
  );
}
