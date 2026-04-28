import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditsDialog({ open, onOpenChange }: CreditsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A15] border-cyan-500/50 text-white w-[95vw] sm:max-w-md p-6 overflow-hidden [&>button]:text-cyan-400">
        <DialogHeader>
          <DialogTitle className="text-2xl text-cyan-400 text-center mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            MISSION CREDITS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 text-center">
          <div>
            <h3 className="text-pink-400 text-xs uppercase tracking-[0.3em] mb-2">Lead Developer</h3>
            <p className="text-xl font-bold text-white">Alpha Team 01</p>
          </div>

          <div>
            <h3 className="text-pink-400 text-xs uppercase tracking-[0.3em] mb-2">Engines & Tech</h3>
            <div className="space-y-1 text-white/60">
              <p>Neural Blade Engine v4.0</p>
              <p>Vite + React + Tailwind</p>
              <p>Zustand State Matrix</p>
              <p>Web Audio API Synth</p>
            </div>
          </div>

          <div>
            <h3 className="text-pink-400 text-xs uppercase tracking-[0.3em] mb-2">Special Thanks</h3>
            <p className="text-white/60 italic">"To all the pilots who never returned from the Amazon Jungle stage."</p>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-[10px] text-white/20 uppercase tracking-widest">
              &copy; 2026 Alpha Blade Industries. All Rights Reserved.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
