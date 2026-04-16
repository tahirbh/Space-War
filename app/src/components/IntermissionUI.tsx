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
    { speaker: 'Commander Sarah', text: `Welcome back, Captain ${playerName}. The landing sequence is complete.` },
    { speaker: 'Captain Jax', text: 'Thank you, Commander. The mission was intense. Those blue fire modules were glitchy.' },
    { speaker: 'Commander Sarah', text: "I've instructed the hangar crew to fix the spread fire emitters. You'll should find them much more effective now." },
    { speaker: 'Captain Jax', text: 'Excellent. I also collected a significant amount of data... and credits from the debris.' },
    { speaker: 'Commander Sarah', text: `Good. Use those credits in the armory. We need you at peak performance for Stage ${stage + 1}.` },
    { speaker: 'Captain Jax', text: "Understood. Re-arming and refueling now. Let's get back out there." },
  ];

  if (phase === 'shop') {
    return <ShopMenu onContinue={onFinish} />;
  }

  return (
    <div className="absolute inset-0 z-40 animate-in fade-in duration-1000">
      {/* Background Image (The Control Tower) */}
      <div 
        className="absolute inset-0 bg-cover bg-center grayscale-[20%] sepia-[10%]"
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
          Status: Refueling in progress...
        </div>
      </div>

      <MatrixDialogue 
        messages={dialogue} 
        onComplete={() => setPhase('shop')} 
      />
    </div>
  );
}
