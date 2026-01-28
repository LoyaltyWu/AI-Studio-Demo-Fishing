
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
  const isPressingRef = useRef(isPressing);
  isPressingRef.current = isPressing; // so game loop always sees current value (avoids stale closure on touch)
  
  // Failure tracking
  const failProgress = useRef(0);

  // Reeling debug overlay: FPS + physics (updated every ~200ms from game loop)
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const debugRef = useRef<{ dt: number; barVel: number; fishVel: number; barPos: number; fishPos: number }>({
    dt: 0, barVel: 0, fishVel: 0, barPos: 0, fishPos: 0,
  });
  const [debugSnapshot, setDebugSnapshot] = useState<{
    fps: number;
    dt: number;
    gravity: number;
    lift: number;
    damping: number;
    bounce: number;
    barPos: number;
    fishPos: number;
    barVel: number;
    fishVel: number;
    isMobile: boolean;
  } | null>(null); 

  // Runtime mobile/touch detection: UA regex OR touch capability (so real phones
  // are detected even when UA is spoofed or "Desktop site" is on). Ref so the
  // game loop always sees the current value (avoids stale closure on first paint).
  const isMobileDevice =
    (typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
        navigator.userAgent,
      )) ||
    (typeof window !== 'undefined' &&
      ('ontouchstart' in window || (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0)));
  const isMobileRef = useRef(isMobileDevice);
  isMobileRef.current = isMobileDevice;

  // Physics Constants - tuned separately for desktop vs mobile
  const GRAVITY = isMobileDevice ? 0.08 : 0.15;
  const LIFT = isMobileDevice ? 0.32 : 0.35;
  const DAMPING = isMobileDevice ? 0.97 : 0.96;
  const BOUNCE = isMobileDevice ? 0.2 : 0.4;

  const update = useCallback((time: number) => {
    // Normalize delta time to ~60fps units and clamp only extreme spikes
    let dt = (time - lastTime.current) / 16;
    const maxDt = isMobileRef.current ? 3 : 2; // allow up to ~3 frames worth on mobile (e.g. 30fps) to avoid "heavy" feel
    if (dt > maxDt) dt = maxDt;
    lastTime.current = time;
    debugRef.current.dt = dt;

    // 1. Update Player Bar Physics (use ref so touch state is never stale in rAF)
    if (isPressingRef.current) {
      barVel.current += LIFT * dt;
    } else {
      barVel.current -= GRAVITY * dt;
    }
    
    // Apply damping
    barVel.current *= DAMPING;
    debugRef.current.barVel = barVel.current;

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
      debugRef.current.barPos = next;
      return next;
    });

    // 2. Update Fish AI (use ref for position just updated this frame)
    if (Math.abs(debugRef.current.fishPos - fishTarget.current) < 2) {
      const struggleFreq = Math.max(0.01, 0.04 - (rod.id * 0.005)); 
      if (Math.random() < struggleFreq) {
        fishTarget.current = Math.random() * 85 + 7;
      }
    }

    const fishAggression = 0.1 + (fish.weight / 400); 
    if (fishPos < fishTarget.current) fishVel.current += fishAggression * dt;
    else fishVel.current -= fishAggression * dt;
    
    fishVel.current *= 0.92; // Damping for fish

    debugRef.current.fishVel = fishVel.current;
    setFishPos(prev => {
      let next = prev + fishVel.current * dt;
      next = Math.max(5, Math.min(95, next));
      debugRef.current.fishPos = next;
      return next;
    });

    // 3. Update Catch Progress (use refs for positions just updated this frame)
    const barHeightPct = (rod.barLength / 400) * 100;
    const isInside = Math.abs(debugRef.current.fishPos - debugRef.current.barPos) <= (barHeightPct / 2 + (rod.tolerance / 400 * 100));

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

    // Debug overlay: every ~200ms update FPS + physics snapshot
    frameCountRef.current += 1;
    const elapsed = time - lastFpsTimeRef.current;
    if (elapsed >= 200) {
      const fps = Math.round((frameCountRef.current * 1000) / elapsed);
      setDebugSnapshot({
        fps,
        dt: debugRef.current.dt,
        gravity: GRAVITY,
        lift: LIFT,
        damping: DAMPING,
        bounce: BOUNCE,
        barPos: debugRef.current.barPos,
        fishPos: debugRef.current.fishPos,
        barVel: debugRef.current.barVel,
        fishVel: debugRef.current.fishVel,
        isMobile: isMobileRef.current,
      });
      frameCountRef.current = 0;
      lastFpsTimeRef.current = time;
    }

    animationFrame.current = requestAnimationFrame(update);
  }, [rod, fish, onSuccess, onFail]);

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

          {/* Position scale markers every ~50 units (0, 50, 100) */}
          <div className="absolute inset-x-0 inset-y-0 pointer-events-none text-[9px] font-mono text-slate-300/70">
            {/* 100 (top) */}
            <div className="absolute top-1 left-0 right-0 flex items-center">
              <div className="flex-1 h-px bg-slate-500/60"></div>
              <span className="ml-1">100</span>
            </div>
            {/* 50 (middle) */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex items-center">
              <div className="flex-1 h-px bg-slate-500/40"></div>
              <span className="ml-1">50</span>
            </div>
            {/* 0 (bottom) */}
            <div className="absolute bottom-1 left-0 right-0 flex items-center">
              <div className="flex-1 h-px bg-slate-500/60"></div>
              <span className="ml-1">0</span>
            </div>
          </div>

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

      {/* Reeling debug overlay: FPS, physics constants, positions & velocities */}
      {debugSnapshot && (
        <div className="absolute top-4 left-4 right-4 max-w-xs bg-black/85 border border-slate-600 rounded-lg p-3 font-mono text-[10px] text-slate-300 pointer-events-none z-50">
          <div className="font-bold text-cyan-400 mb-1">Reeling Debug</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span>FPS</span>
            <span className="text-white">{debugSnapshot.fps}</span>
            <span>dt</span>
            <span className="text-white">{debugSnapshot.dt.toFixed(3)}</span>
            <span>isMobile</span>
            <span className="text-white">{debugSnapshot.isMobile ? 'yes' : 'no'}</span>
            <span>GRAVITY</span>
            <span className="text-white">{debugSnapshot.gravity}</span>
            <span>LIFT</span>
            <span className="text-white">{debugSnapshot.lift}</span>
            <span>DAMPING</span>
            <span className="text-white">{debugSnapshot.damping}</span>
            <span>BOUNCE</span>
            <span className="text-white">{debugSnapshot.bounce}</span>
            <span>barPos</span>
            <span className="text-white">{debugSnapshot.barPos.toFixed(1)}</span>
            <span>fishPos</span>
            <span className="text-white">{debugSnapshot.fishPos.toFixed(1)}</span>
            <span>barVel</span>
            <span className="text-white">{debugSnapshot.barVel.toFixed(3)}</span>
            <span>fishVel</span>
            <span className="text-white">{debugSnapshot.fishVel.toFixed(3)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
