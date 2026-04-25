import React, { useState, useEffect, useRef } from 'react';

// --- Constants & Data ---
const ANIMALS = [
  { id: 'bunny', name: 'bunny', icon: '🐰' },
  { id: 'unicorn', name: 'unicorn', icon: '🦄' },
  { id: 'cow', name: 'cow', icon: '🐮' },
  { id: 'wolf', name: 'wolf', icon: '🐺' },
  { id: 'tiger', name: 'tiger', icon: '🐯' },
  { id: 'horse', name: 'horse', icon: '🐴' }
];

const INITIAL_MESSAGES = [
  "Your hosts have selected you to participate in the Great Animal Race!",
  "The game is simple: help your toy animal reach milestones by earning XP from different actions and games",
  "The first to raise their toy animal to age 1, just like the birthday girl, wins the prize! good luck :)"
];

// --- Custom Animations & Styles ---
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');
  
  .slot-font {
    font-family: 'Russo One', sans-serif;
  }
  
  @keyframes flash {
    0%, 100% { opacity: 1; filter: brightness(1.5) drop-shadow(0 0 10px #fef08a); }
    50% { opacity: 0.5; filter: brightness(1) drop-shadow(0 0 0px transparent); }
  }
  .animate-flash {
    animation: flash 1s infinite;
  }
  .animate-flash-delay {
    animation: flash 1s infinite;
    animation-delay: 0.5s;
  }

  @keyframes reel-bounce {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }
  .animate-reel-bounce {
    animation: reel-bounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  @keyframes open-door {
    0% { transform: perspective(2000px) rotateX(0deg); opacity: 1; }
    100% { transform: perspective(2000px) rotateX(90deg); opacity: 1; }
  }
  .animate-open-door {
    transform-origin: bottom center;
    animation: open-door 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
`;

const SlotReel = ({ status, finalAnimal, spinDuration }: { status: string, finalAnimal: any, spinDuration: number }) => {
  const spinList = React.useMemo(() => {
    const list = [];
    // Start with a random animal so it's not blank
    list.push(ANIMALS[Math.floor(Math.random() * ANIMALS.length)]);
    const numSpins = Math.floor(spinDuration * 12); 
    for (let i = 0; i < numSpins - 1; i++) {
      list.push(ANIMALS[Math.floor(Math.random() * ANIMALS.length)]);
    }
    list.push(finalAnimal);
    return list;
  }, [finalAnimal, spinDuration]);

  const translateY = -(spinList.length - 1) * (100 / spinList.length);

  return (
    <div className="relative w-20 sm:w-24 md:w-32 h-24 sm:h-32 md:h-40 bg-zinc-100 rounded-lg overflow-hidden shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] border-y-4 border-zinc-800">
      {/* Glass glare */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent z-20 pointer-events-none"></div>
      
      <div 
        className="absolute top-0 left-0 w-full flex flex-col z-10"
        style={{ 
          height: `${spinList.length * 100}%`,
          transform: status !== 'initial' ? `translateY(${translateY}%)` : 'translateY(0)',
          transition: status === 'spinning' ? `transform ${spinDuration}s cubic-bezier(0.1, 0.7, 0.1, 1.05)` : 'none',
        }}
      >
        {spinList.map((animal, idx) => {
          const isLast = idx === spinList.length - 1;
          const isRevealed = isLast && status === 'revealed';
          return (
            <div 
              key={idx} 
              className="w-full flex flex-col items-center justify-center shrink-0"
              style={{ height: `${100 / spinList.length}%` }}
            >
              <span className={`text-5xl sm:text-6xl md:text-7xl drop-shadow-lg ${status === 'spinning' && !isLast ? 'blur-[2px] scale-y-125' : ''} ${isRevealed ? 'animate-reel-bounce' : ''}`}>
                {animal.icon}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function SlotMachineOverlay({ onComplete, onStartOpening, onSpinStart }: { onComplete: (animalId: string) => void, onStartOpening?: () => void, onSpinStart?: () => void }) {
  const [slotStatuses, setSlotStatuses] = useState(['initial', 'initial', 'initial']);
  const [isPulling, setIsPulling] = useState(false);
  const [leverX, setLeverX] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [maxPull, setMaxPull] = useState(200);
  const [selectedAnimal, setSelectedAnimal] = useState(ANIMALS[0]);
  
  useEffect(() => {
    // Any of the 6 animals (bunny, unicorn, cow, wolf, tiger, horse)
    // can be the prize.
    setSelectedAnimal(ANIMALS[Math.floor(Math.random() * ANIMALS.length)]);
  }, []);
  
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const leverRef = useRef<{ startX: number, startLeverX: number } | null>(null);

  useEffect(() => {
    const calculateMaxPull = () => {
      if (trackRef.current && knobRef.current) {
        setMaxPull(trackRef.current.offsetWidth - knobRef.current.offsetWidth - 8); // 8 for padding
      }
    };
    
    calculateMaxPull();
    window.addEventListener('resize', calculateMaxPull);
    return () => window.removeEventListener('resize', calculateMaxPull);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (slotStatuses[0] === 'spinning' || gameWon) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsPulling(true);
    leverRef.current = { startX: e.clientX, startLeverX: leverX };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPulling || !leverRef.current) return;
    const dx = e.clientX - leverRef.current.startX;
    let newX = leverRef.current.startLeverX + dx;
    newX = Math.max(0, Math.min(newX, maxPull));
    setLeverX(newX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPulling) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsPulling(false);
    leverRef.current = null;

    if (leverX > maxPull * 0.7) {
      onSpinStart?.();
      triggerSpin();
    }
    setLeverX(0);
  };

  const triggerSpin = () => {
    setSlotStatuses(['spinning', 'spinning', 'spinning']);
    setGameWon(false);

    setTimeout(() => setSlotStatuses(prev => ['revealed', prev[1], prev[2]]), 2000);
    setTimeout(() => setSlotStatuses(prev => ['revealed', 'revealed', prev[2]]), 3500);
    setTimeout(() => {
      setSlotStatuses(['revealed', 'revealed', 'revealed']);
      setTimeout(() => {
        setGameWon(true);
        setIsOpening(true);
        onStartOpening?.();
        setTimeout(() => onComplete(selectedAnimal.id), 1500);
      }, 1500);
    }, 5000);
  };

  // Generate marquee lights
  const lights = Array.from({ length: 14 }).map((_, i) => (
    <div key={i} className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-300 shadow-[0_0_10px_#fde047] ${i % 2 === 0 ? 'animate-flash' : 'animate-flash-delay'}`}></div>
  ));

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-zinc-950 bg-[url('/unicorn_wall.png')] bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out ${isOpening ? 'animate-open-door pointer-events-none' : ''}`}>
      <style>{customStyles}</style>

      {/* Background ambient glow / dark overlay to ensure machine pops */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.3)_0%,transparent_70%)] pointer-events-none"></div>
      
      {/* Hinge seam hider to prevent sub-pixel gaps at the bottom edge during 3D rotation */}
      <div className="absolute top-full left-[-10vw] right-[-10vw] h-[10vh] bg-black pointer-events-none"></div>

      {/* Main Slot Machine Body */}
      <div className="relative flex flex-col items-center w-full max-w-md sm:max-w-lg md:max-w-xl z-10 transform transition-transform origin-center [@media(max-height:850px)]:scale-90 [@media(max-height:750px)]:scale-75 [@media(max-height:650px)]:scale-50 [@media(max-height:500px)]:scale-40">
        
        {/* Top Marquee Sign */}
        <div className="relative bg-gradient-to-b from-yellow-400 to-yellow-600 p-2 rounded-t-[2rem] border-4 border-b-0 border-yellow-700 w-11/12 mx-auto shadow-2xl z-20">
          <div className="absolute inset-0 flex justify-around items-center px-4">
            {lights}
          </div>
          <div className="bg-red-600 rounded-2xl py-3 px-4 border-4 border-red-800 shadow-[inset_0_5px_15px_rgba(0,0,0,0.5)] relative z-10 text-center flex flex-col items-center">
            <img src="/unicorn.png" alt="Unicorn" className="w-16 h-16 sm:w-20 sm:h-20 mb-2 drop-shadow-md animate-bounce" />
            <h2 className="slot-font text-yellow-300 text-lg sm:text-xl md:text-2xl tracking-widest uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-pulse">
              Charlotte's
            </h2>
            <h1 className="slot-font text-white text-2xl sm:text-3xl md:text-4xl tracking-tighter uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-none animate-pulse">
              Toy Machine
            </h1>
          </div>
        </div>

        {/* Main Cabinet */}
        <div className="bg-gradient-to-b from-pink-500 via-purple-500 to-indigo-600 p-4 sm:p-6 md:p-8 rounded-3xl border-8 border-pink-300 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_5px_15px_rgba(255,255,255,0.4)] w-full relative z-10 flex flex-col items-center">
          
          {/* Digital Text Display (Replaces the old initial text inside slots) */}
          {slotStatuses[0] === 'initial' && (
            <div className="mb-4 w-full bg-zinc-950 p-3 sm:p-4 rounded-xl border-4 border-zinc-800 shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                {INITIAL_MESSAGES.map((msg, i) => (
                  <p key={i} className="text-green-400 text-[10px] sm:text-xs md:text-sm text-center font-mono uppercase tracking-widest leading-tight drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]">
                    {msg}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Reels Display Area */}
          <div className="bg-zinc-900 p-4 sm:p-6 rounded-2xl shadow-[inset_0_10px_30px_rgba(0,0,0,0.8)] border-4 border-zinc-700 relative w-full flex justify-center gap-2 sm:gap-4 mb-6">
            
            <SlotReel status={slotStatuses[0]} finalAnimal={selectedAnimal} spinDuration={2} />
            <SlotReel status={slotStatuses[1]} finalAnimal={selectedAnimal} spinDuration={3.5} />
            <SlotReel status={slotStatuses[2]} finalAnimal={selectedAnimal} spinDuration={5} />
          </div>

          {/* Lever Area */}
          <div className="w-full bg-black/30 p-4 rounded-2xl border-t-2 border-white/20 shadow-inner transition-all duration-500 flex flex-col justify-center min-h-[4rem]">
            <div className={`text-center ${slotStatuses[0] === 'initial' ? 'mb-3' : ''}`}>
              <span className="slot-font text-pink-200 text-sm sm:text-base md:text-lg uppercase tracking-widest drop-shadow-md">
                {slotStatuses[0] === 'initial' ? 'Slide to Spin!' : 'Good Luck!'}
              </span>
            </div>
            
            {slotStatuses[0] === 'initial' && (
              <div 
                ref={trackRef}
                className="w-full h-16 sm:h-20 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-full shadow-[inset_0_5px_15px_rgba(0,0,0,0.8)] border-2 border-zinc-700 relative flex items-center px-2 animate-in fade-in duration-500"
              >
                {/* Track glowing line */}
                <div className="absolute inset-x-8 top-1/2 h-1 bg-pink-500/20 transform -translate-y-1/2 rounded-full pointer-events-none"></div>
                
                {/* Draggable Knob */}
                <div 
                  ref={knobRef}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 shadow-[0_5px_15px_rgba(236,72,153,0.6),inset_0_4px_4px_rgba(255,255,255,0.5)] border-2 border-pink-300 z-20 relative cursor-grab active:cursor-grabbing flex items-center justify-center shrink-0"
                  style={{ 
                    transform: `translateX(${leverX}px)`, 
                    touchAction: 'none',
                    transition: isPulling ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {/* Knob inner detail */}
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-white/40 to-transparent shadow-inner pointer-events-none"></div>
                </div>
              </div>
            )}
          </div>

        </div>
        
        {/* Base/Stand */}
        <div className="w-5/6 h-8 sm:h-12 bg-gradient-to-b from-indigo-800 to-indigo-950 rounded-b-[2rem] border-x-4 border-b-4 border-indigo-900 shadow-2xl -mt-2 z-0"></div>
      </div>
    </div>
  );
}
