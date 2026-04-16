import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { Zap, Target, Heart, Bomb, ShoppingCart, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface ShopMenuProps {
  onContinue: () => void;
}

export function ShopMenu({ onContinue }: ShopMenuProps) {
  const { coins, addCoins, upgrades, setUpgrade, selectedWeapon } = useGameStore();

  const SHOP_ITEMS = [
    { 
      id: 'fireRate', 
      name: 'Fire Rate', 
      icon: <Zap className="w-6 h-6" />, 
      cost: upgrades.fireRate * 200, 
      max: 5, 
      desc: 'Shoot faster projectiles' 
    },
    { 
      id: 'damage', 
      name: 'Weapon Damage', 
      icon: <Target className="w-6 h-6" />, 
      cost: upgrades.damage * 300, 
      max: 5, 
      desc: 'Increase bullet destruction' 
    },
    { 
      id: 'health', 
      name: 'Armor Plating', 
      icon: <Heart className="w-6 h-6" />, 
      cost: upgrades.health * 400, 
      max: 5, 
      desc: 'Increase maximum health' 
    },
    { 
      id: 'bombs', 
      name: 'Bomb Stock', 
      icon: <Bomb className="w-6 h-6" />, 
      cost: 150, 
      max: 5, 
      desc: 'Extra screen-clearing bomb' 
    },
  ];

  const handlePurchase = (item: typeof SHOP_ITEMS[0]) => {
    if (coins < item.cost) {
      toast.error('Insufficient Coins', { description: 'Destroy more enemies to earn gold!' });
      return;
    }

    if (item.id === 'bombs') {
       // Bomb logic might be different if it's consumable, but here we'll treat it as capacity
       setUpgrade('bombs', Math.min(upgrades.bombs + 1, item.max));
    } else {
       const type = item.id as 'fireRate' | 'damage' | 'health';
       if (upgrades[type] >= item.max) {
         toast.info('Max Level Reached');
         return;
       }
       setUpgrade(type, upgrades[type] + 1);
    }

    addCoins(-item.cost);
    toast.success(`${item.name} Upgraded!`);
  };

  return (
    <div className="absolute inset-0 bg-[#0A0A15]/95 z-40 flex flex-col items-center justify-center p-8 overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600 mb-2"
            style={{ fontFamily: 'Orbitron, sans-serif' }}>
          ARMORY & SHOP
        </h2>
        <div className="flex items-center justify-center gap-2 text-yellow-400">
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xl font-mono tracking-widest">{coins.toString().padStart(6, '0')} COINS</span>
        </div>
      </div>

      {/* Ship Preview / Weapon Status */}
      <div className="w-full max-w-4xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 flex items-center gap-8 backdrop-blur-xl">
        <div className="w-32 h-32 flex items-center justify-center bg-cyan-500/10 rounded-full border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(0,212,255,0.2)]">
            <span className="text-cyan-400 uppercase font-black text-xs tracking-tighter">Current: {selectedWeapon}</span>
        </div>
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Fire Speed" value={upgrades.fireRate} color="text-cyan-400" />
            <StatBox label="Damage" value={upgrades.damage} color="text-red-400" />
            <StatBox label="Hull" value={upgrades.health} color="text-green-400" />
            <StatBox label="Bombs" value={upgrades.bombs} color="text-purple-400" />
        </div>
      </div>

      {/* Shop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {SHOP_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => handlePurchase(item)}
            disabled={(item.id !== 'bombs' && upgrades[item.id as keyof typeof upgrades] >= item.max)}
            className={cn(
              "group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
              "bg-white/5 border-white/10 hover:border-yellow-400/50 hover:bg-white/10",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
            )}
          >
            <div className="w-12 h-12 flex items-center justify-center bg-yellow-400/10 rounded-lg text-yellow-400 group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-bold">{item.name}</h3>
              <p className="text-white/40 text-xs">{item.desc}</p>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-mono font-bold">{item.cost} G</div>
              <div className="text-[10px] text-white/20 uppercase tracking-widest">
                LVL {item.id === 'bombs' ? upgrades.bombs : upgrades[item.id as keyof typeof upgrades]} / {item.max}
              </div>
            </div>
            <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        className="mt-12 flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-full text-white font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(0,100,255,0.3)] hover:scale-105 active:scale-95 transition-all"
      >
        Fly Out to Sky
        <ArrowRight className="w-6 h-6" />
      </button>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="bg-black/40 p-3 rounded-lg border border-white/5">
            <div className="text-[10px] text-white/40 uppercase tracking-tighter mb-1">{label}</div>
            <div className={cn("text-xl font-mono font-bold", color)}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < value ? "opacity-100" : "opacity-20"}>I</span>
                ))}
            </div>
        </div>
    );
}
