
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Rod, FishInstance } from '../types';

interface FishingGameProps {
  rod: Rod;
  fish: FishInstance;
  onSuccess: () => void;
  onFail: () => void;
}

export const FishingGame: React.FC<FishingGameProps> = ({ rod, fish, onSuccess, onFail }) => {
  const [barPos, setBarPos] = useState(0); // 0 at bottom, 100 at top
  const [fishPos, setFishPos] = useState(30);
  const [progress, setProgress] = useState(25); // Start with a little buffer
  const [isPressing, setIsPressing] = useState(false);
  const [isStressed, setIsStressed] = useState(false);
  
  const barVel = useRef(0);
  const fishVel = useRef(0);
  const fishTarget = useRef(30);
  const lastTime = useRef(performance.now());
  const animationFrame = useRef<number>(0);
  
  // Failure tracking
  const failProgress = useRef(0); 

  // Simple runtime check for mobile-ish devices
  const isMobileDevice =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      navigator.userAgent,
    );

  // Physics Constants - tuned separately for desktop vs mobile
  // Mobile: slightly lower gravity, stronger lift, lighter damping, softer bounce
  const GRAVITY = isMobileDevice ? 0.08 : 0.15;
  const LIFT = isMobileDevice ? 0.32 : 0.35;
  const DAMPING = isMobileDevice ? 0.97 : 0.96;
  const BOUNCE = isMobileDevice ? 0.2 : 0.4;

  const update = useCallback((time: number) => {
    // Normalize delta time to ~60fps units and clamp only extreme spikes
    let dt = (time - lastTime.current) / 16;
    const maxDt = isMobileDevice ? 3 : 2; // allow up to ~3 frames worth on mobile (e.g. 30fps) to avoid "heavy" feel
    if (dt > maxDt) dt = maxDt;
    lastTime.current = time;

    // 1. Update Player Bar Physics
    if (isPressing) {
      barVel.current += LIFT * dt;
    } else {
      barVel.current -= GRAVITY * dt;
    }
    
    // Apply damping
    barVel.current *= DAMPING;

    setBarPos(prev => {
      let next = prev + barVel.current * dt;
      
      // Boundaries with bounce
      if (next <= 0) {
        next = 0;
        barVel.current = Math.abs(barVel.current) * BOUNCE; // Slight bounce up
      }
      if (next >= 100) {
        next = 100;
        barVel.current = -Math.abs(barVel.current) * BOUNCE; // Slight bounce down
      }
      return next;
    });

    // 2. Update Fish AI
    if (Math.abs(fishPos - fishTarget.current) < 2) {
      const struggleFreq = Math.max(0.01, 0.04 - (rod.id * 0.005)); 
      if (Math.random() < struggleFreq) {
        fishTarget.current = Math.random() * 85 + 7;
      }
    }

    const fishAggression = 0.1 + (fish.weight / 400); 
    if (fishPos < fishTarget.current) fishVel.current += fishAggression * dt;
    else fishVel.current -= fishAggression * dt;
    
    fishVel.current *= 0.92; // Damping for fish

    setFishPos(prev => {
      let next = prev + fishVel.current * dt;
      return Math.max(5, Math.min(95, next));
    });

    // 3. Update Catch Progress
    const barHeightPct = (rod.barLength / 400) * 100;
    const isInside = Math.abs(fishPos - barPos) <= (barHeightPct / 2 + (rod.tolerance / 400 * 100));

    setProgress(prev => {
      const increment = (isInside ? 0.6 : -0.8) * dt;
      let next = prev + increment;
      
      if (next >= 100) {
        onSuccess();
        return 100;
      }
      
      if (next <= 0) {
        // Failure condition logic
        failProgress.current += dt;
        setIsStressed(true);
        
        // If progress at 0 for ~3 seconds (roughly 180 frames)
        if (failProgress.current > 180) {
          onFail();
          return 0;
        }
        return 0;
      } else {
        // Reset failure progress if we have any catch progress
        failProgress.current = Math.max(0, failProgress.current - dt * 0.5);
        setIsStressed(false);
      }
      
      return next;
    });

    animationFrame.current = requestAnimationFrame(update);
  }, [isPressing, rod, fish, fishPos, barPos, onSuccess, onFail]);

  useEffect(() => {
    animationFrame.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame.current!);
  }, [update]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-40 flex flex-col items-center justify-center select-none touch-none"
      onPointerDown={(e) => { 
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        setIsPressing(true); 
      }}
      onPointerUp={() => setIsPressing(false)}
      onPointerLeave={() => setIsPressing(false)}
    >
      <div className="text-center mb-8">
        <h3 className={`text-2xl font-black italic mb-1 transition-colors ${isStressed ? 'text-red-500 animate-bounce' : 'text-yellow-400'}`}>
          {isStressed ? 'LINE SNAPPING!' : 'REELING!'}
        </h3>
        <p className="text-sm text-slate-300">Keep the fish inside the bar!</p>
      </div>

      <div className="relative flex items-center gap-6">
        {/* Progress Bar Container */}
        <div className={`w-5 h-[400px] bg-slate-900 rounded-full border-2 overflow-hidden flex flex-col-reverse transition-colors ${isStressed ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-slate-700'}`}>
          <div 
            className={`w-full transition-all duration-100 ${isStressed ? 'bg-red-600' : 'bg-green-500'}`} 
            style={{ 
              height: `${progress}%`,
              boxShadow: isStressed ? 'none' : '0 0 15px rgba(34,197,94,0.4)'
            }}
          />
        </div>

        {/* Fishing Area */}
        <div className="relative w-20 h-[400px] bg-slate-800 rounded-xl border-4 border-slate-700 overflow-hidden shadow-2xl">
          {/* Subtle water texture overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

          {/* Player Bar */}
          <div 
            className={`absolute left-0 w-full rounded-md border-y-4 border-white/40 transition-all duration-75 ${rod.style} opacity-80`}
            style={{ 
              height: `${rod.barLength}px`, 
              bottom: `calc(${barPos}% - ${rod.barLength / 2}px)` 
            }}
          >
            {/* Inner highlight for the bar */}
            <div className="w-full h-full bg-white/10"></div>
          </div>

          {/* Fish Icon */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 text-3xl transition-all duration-75 pointer-events-none drop-shadow-xl fish-struggle"
            style={{ bottom: `calc(${fishPos}% - 18px)` }}
          >
            {fish.emoji}
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-8 h-1 rounded-full ${isPressing ? 'bg-blue-400' : 'bg-slate-700'}`}></div>
          ))}
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
          {isPressing ? 'Applying Tension' : 'Releasing Tension'}
        </p>
      </div>
    </div>
  );
};
