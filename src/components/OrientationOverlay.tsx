import { Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export function OrientationOverlay() {
  const [isPortrait, setIsPortrait] = useState(false);
  const { gameState } = useGameStore();

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Allow portrait mode in shop or menu for accessibility
  if (!isPortrait || gameState === 'shop' || gameState === 'menu') return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A15] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
        <div className="relative animate-bounce-slow">
          <Smartphone className="w-24 h-24 text-cyan-400 rotate-90" />
        </div>
      </div>
      
      <h2 className="text-3xl font-black text-white mt-8 mb-4 tracking-tighter" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        ROTATE DEVICE
      </h2>
      
      <p className="text-cyan-400/60 font-mono text-sm max-w-xs leading-relaxed uppercase tracking-widest">
        Alpha Blade requires horizontal orientation for optimal neural link stability.
      </p>

      <div className="mt-12 flex gap-2">
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse delay-75" />
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse delay-150" />
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(90deg); }
          50% { transform: translateY(-20px) rotate(0deg); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
