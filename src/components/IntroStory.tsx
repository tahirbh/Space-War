import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { SoundManager } from '@/engine/SoundManager';

interface IntroStoryProps {
  onComplete: () => void;
  soundManager?: SoundManager | null;
}

export function IntroStory({ onComplete, soundManager }: IntroStoryProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (soundManager) {
      soundManager.playSound('welcome');
      soundManager.startIntroMusic(); // This loops Intro_conversation.mp3
    }
    return () => {
      soundManager?.stopMusic();
    };
  }, [soundManager]);

  const stages = [
    { id: 1, name: 'EVEREST - MARS ORBIT', desc: 'Infiltrate the high-altitude Martian defense perimeter.' },
    { id: 2, name: 'GULF - SATURN RINGS', desc: 'Navigate the crystal debris of Saturn\'s massive rings.' },
    { id: 3, name: 'ARAB DESERT - JUPITER', desc: 'Sandstorms and giant storms await on the Jovian surface.' },
    { id: 4, name: 'RIO - VENUS GATES', desc: 'Lush alien flora hides experimental tank battalions.' },
    { id: 5, name: 'KASHMIR - NEPTUNE COLD', desc: 'Zero-degree combat across the frozen Neptune wastes.' },
    { id: 6, name: 'NEW YORK - MERCURY FAST', desc: 'High-speed intercept over the sun-scorched Mercury spires.' },
    { id: 7, name: 'SYDNEY - URANUS BLUE', desc: 'Oceanic warfare in the deep azure atmosphere of Uranus.' },
    { id: 8, name: 'REEF - LUNAR TIDE', desc: 'Tidal combat on the lunar surface during full eclipse.' },
    { id: 9, name: 'GRAND CANYON - PLUTO', desc: 'Deep canyon dogfights on the edge of the solar system.' },
    { id: 10, name: 'TOKYO - SOLAR FLARE', desc: 'The final push through the Solar Flare defense grid.' },
  ];

  const nextSlide = () => {
    if (currentSlide < stages.length - 1) {
      setCurrentSlide(s => s + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    setCurrentSlide(s => Math.max(0, s - 1));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      {/* Cinematic Cockpit Background (Fixed) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ 
          backgroundImage: `url('/cockpit_briefing_view.png')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      {/* Stage Image (The Slider) */}
      <div className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out">
        {stages.map((stage, idx) => (
          <div 
            key={stage.id}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${
              idx === currentSlide ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
            style={{ backgroundImage: `url('/bg_stage_${stage.id}.png')` }}
          >
             <div className="absolute inset-0 bg-black/20" />
          </div>
        ))}
      </div>

      {/* Cockpit HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none border-[20px] border-black/80">
        <div className="absolute top-10 left-10 w-32 h-32 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-3xl animate-pulse" />
        <div className="absolute top-10 right-10 w-32 h-32 border-r-2 border-t-2 border-cyan-500/30 rounded-tr-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-10 left-10 w-32 h-32 border-l-2 border-b-2 border-cyan-500/30 rounded-bl-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-10 right-10 w-32 h-32 border-r-2 border-b-2 border-cyan-500/30 rounded-br-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center">
        <div className="mb-4 sm:mb-12 text-center landscape-hide">
          <h2 className="text-cyan-400 font-mono text-sm tracking-[0.5em] uppercase mb-2">MISSION RECONNAISSANCE</h2>
          <div className="h-[1px] w-64 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto" />
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 p-2 sm:p-8 rounded-2xl w-[220px] sm:w-full h-[120px] sm:h-auto sm:max-w-2xl text-center transform transition-all duration-500 hover:border-cyan-400/50 flex flex-col justify-center landscape-small-content-area">
          <div className="mb-1 sm:mb-4">
            <span className="text-cyan-500 font-mono text-[8px] sm:text-xs uppercase tracking-widest landscape-hide">Waypoint {currentSlide + 1} / 10</span>
            <h3 className="text-sm sm:text-3xl font-bold text-white mt-0.5 sm:mt-2 font-orbitron truncate px-2 landscape-small-title">{stages[currentSlide].name}</h3>
          </div>
          
          <p className="text-gray-300 text-[10px] sm:text-lg leading-tight sm:leading-relaxed mb-2 sm:mb-8 h-8 sm:h-20 overflow-hidden text-ellipsis landscape-hide">
            {stages[currentSlide].desc}
          </p>

          <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
            <button 
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={`p-2 sm:p-4 rounded-full border border-cyan-500/30 transition-all landscape-nav-button ${
                currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-cyan-500/20 hover:border-cyan-400'
              }`}
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-400" />
            </button>

            <button 
              onClick={nextSlide}
              className="flex-1 py-2 sm:py-4 px-4 sm:px-8 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 sm:gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-[10px] sm:text-base whitespace-nowrap landscape-small-button"
            >
              {currentSlide === stages.length - 1 ? (
                <>
                  <Play className="w-4 h-4 sm:w-6 sm:h-6 fill-current" />
                  BEGIN OPERATION
                </>
              ) : (
                <>
                  CONTINUE JOURNEY
                  <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="mt-4 sm:mt-8 flex gap-2 landscape-hide">
          {stages.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 transition-all duration-300 rounded-full ${
                idx === currentSlide ? 'w-8 bg-cyan-500' : 'w-2 bg-cyan-500/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
