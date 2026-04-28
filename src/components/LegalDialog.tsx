import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LegalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'privacy' | 'terms';
}

export function LegalDialog({ open, onOpenChange, type }: LegalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A15] border-white/20 text-white w-[95vw] sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden [&>button]:text-cyan-400">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {type === 'privacy' ? 'PRIVACY POLICY' : 'TERMS OF SERVICE'}
            </DialogTitle>
            <DialogDescription className="text-white/40">
              Last Updated: April 2026
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 text-white/80 text-sm leading-relaxed font-sans">
              {type === 'privacy' ? (
                <>
                  <section>
                    <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-wider">1. Data Collection</h3>
                    <p>Alpha Blade is designed to respect your privacy. We do not collect personal identification information (PII) such as your name, email address, or physical location. Any "Player Name" you enter is stored locally on your device only.</p>
                  </section>
                  <section>
                    <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-wider">2. Local Storage</h3>
                    <p>We use your browser's Local Storage to save your high scores, game progress, and settings. This data never leaves your device unless you manually export it or use a third-party sync service not provided by Alpha Blade.</p>
                  </section>
                  <section>
                    <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-wider">3. Analytics</h3>
                    <p>We may use anonymous telemetry to understand game performance and balance. This data is fully anonymized and contains no identifying information.</p>
                  </section>
                  <section>
                    <h3 className="text-cyan-400 font-bold mb-2 uppercase tracking-wider">4. Third-Party Services</h3>
                    <p>Alpha Blade uses Google Fonts and may use CDNs for asset delivery. These services may log your IP address as part of standard web traffic protocols.</p>
                  </section>
                </>
              ) : (
                <>
                  <section>
                    <h3 className="text-pink-400 font-bold mb-2 uppercase tracking-wider">1. Acceptance of Terms</h3>
                    <p>By accessing and playing Alpha Blade, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.</p>
                  </section>
                  <section>
                    <h3 className="text-pink-400 font-bold mb-2 uppercase tracking-wider">2. License to Use</h3>
                    <p>Alpha Blade grants you a personal, non-exclusive, non-transferable license to use the game for personal, non-commercial entertainment purposes.</p>
                  </section>
                  <section>
                    <h3 className="text-pink-400 font-bold mb-2 uppercase tracking-wider">3. User Conduct</h3>
                    <p>You agree not to attempt to reverse engineer, decompile, or otherwise interfere with the game's code or servers (if applicable). Cheating in multiplayer modes is strictly prohibited.</p>
                  </section>
                  <section>
                    <h3 className="text-pink-400 font-bold mb-2 uppercase tracking-wider">4. Disclaimer of Warranty</h3>
                    <p>The game is provided "as is" without any warranties. We are not responsible for any data loss, device damage, or emotional distress caused by losing a high score to a boss fight.</p>
                  </section>
                </>
              )}
            </div>
          </ScrollArea>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm font-bold tracking-widest uppercase"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
