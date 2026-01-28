
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, FishInstance, Rod, SaveData, Rarity } from './types';
import { RODS, MAX_BACKPACK_SIZE } from './constants';
import { sounds } from './services/soundManager';
import { calculateFish } from './services/gameLogic';
import { RodShop } from './components/RodShop';
import { Backpack } from './components/Backpack';
import { FishingGame } from './components/FishingGame';

const App: React.FC = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [coins, setCoins] = useState(0);
  const [backpack, setBackpack] = useState<FishInstance[]>([]);
  const [unlockedRods, setUnlockedRods] = useState<number[]>([0]);
  const [currentRodId, setCurrentRodId] = useState(0);
  
  // Interaction State
  const [castPower, setCastPower] = useState(0);
  const [bitingFish, setBitingFish] = useState<FishInstance | null>(null);
  const [caughtFish, setCaughtFish] = useState<FishInstance | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const castTimer = useRef<number | null>(null);
  const biteTimeout = useRef<number | null>(null);
  const audioInitialized = useRef(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('fishing_save');
    if (saved) {
      try {
        const data: SaveData = JSON.parse(saved);
        setCoins(data.coins);
        setUnlockedRods(data.unlockedRods);
        setCurrentRodId(data.currentRodId);
        setBackpack(data.backpack || []);
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
  }, []);

  useEffect(() => {
    const data: SaveData = { coins, unlockedRods, currentRodId, backpack };
    localStorage.setItem('fishing_save', JSON.stringify(data));
  }, [coins, unlockedRods, currentRodId, backpack]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const currentRod = RODS[currentRodId];

  // Actions
  const initAudio = () => {
    if (!audioInitialized.current) {
      sounds.init();
      audioInitialized.current = true;
    }
  };

  const handleCastStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only handle primary button (left click/touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    if (backpack.length >= MAX_BACKPACK_SIZE) {
      showToast("Backpack full! Sell some fish first.");
      return;
    }
    
    // CRITICAL: Capture the pointer so events are received even outside the element
    e.currentTarget.setPointerCapture(e.pointerId);
    
    initAudio();
    setGameState(GameState.CASTING);
    setCastPower(0);
    
    if (castTimer.current) clearInterval(castTimer.current);
    castTimer.current = window.setInterval(() => {
      setCastPower(prev => Math.min(prev + 0.05, 1));
    }, 50);
  };

  const handleCastEnd = () => {
    // If timer is null, we aren't actually casting (prevents double triggers)
    if (!castTimer.current) return;

    clearInterval(castTimer.current);
    castTimer.current = null;

    sounds.playCast();
    setGameState(GameState.WAITING);

    // Random wait time for bite (2-5s)
    const waitTime = 2000 + Math.random() * 3000;
    
    if (biteTimeout.current) clearTimeout(biteTimeout.current);
    biteTimeout.current = window.setTimeout(() => {
      sounds.playBite();
      setGameState(GameState.BITING);
      
      // Player has 2 seconds to react
      biteTimeout.current = window.setTimeout(() => {
        setGameState(GameState.IDLE);
        showToast("The fish got away...");
      }, 2000);
    }, waitTime);
  };

  const handleHook = () => {
    if (biteTimeout.current) clearTimeout(biteTimeout.current);
    sounds.playHook();
    
    const fish = calculateFish(castPower, currentRod);
    setBitingFish(fish);
    setGameState(GameState.FIGHTING);
  };

  const handleFishingSuccess = () => {
    if (bitingFish) {
      sounds.playCollect();
      setCaughtFish(bitingFish);
      setGameState(GameState.CAUGHT);
      setBitingFish(null);
    }
  };

  const handleFishingFail = () => {
    setGameState(GameState.IDLE);
    setBitingFish(null);
    showToast("The line snapped!");
  };

  const addToBackpack = () => {
    if (caughtFish) {
      setBackpack(prev => [...prev, caughtFish]);
      setCaughtFish(null);
      setGameState(GameState.IDLE);
      showToast(`Caught a ${caughtFish.name}!`);
    }
  };

  const sellFish = (id: string) => {
    const fishToSell = backpack.find(f => f.id === id);
    if (fishToSell) {
      setCoins(prev => prev + fishToSell.value);
      setBackpack(prev => prev.filter(f => f.id !== id));
      sounds.playCoin();
    }
  };

  const sellAllFish = () => {
    const total = backpack.reduce((acc, f) => acc + f.value, 0);
    setCoins(prev => prev + total);
    setBackpack([]);
    sounds.playCollect();
    showToast(`Sold all fish for ${total} coins!`);
  };

  const unlockRod = (rod: Rod) => {
    if (coins >= rod.price && !unlockedRods.includes(rod.id)) {
      setCoins(prev => prev - rod.price);
      setUnlockedRods(prev => [...prev, rod.id]);
      setCurrentRodId(rod.id);
      sounds.playUnlock();
      showToast(`Unlocked ${rod.name}!`);
    }
  };

  return (
    <div className="h-screen w-full relative flex flex-col bg-slate-900 overflow-hidden">
      {/* Background Layer: Water & Pier */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-blue-900">
          <div className="ripple top-1/2 left-1/4"></div>
          <div className="ripple top-1/3 left-2/3" style={{ animationDelay: '1s' }}></div>
          <div className="ripple top-2/3 left-1/2" style={{ animationDelay: '0.5s' }}></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-slate-800 border-t-4 border-slate-700"></div>
      </div>

      {/* UI Top */}
      <div className="relative z-10 p-4 flex justify-between items-start pointer-events-none">
        <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-white/10 pointer-events-auto">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-coins text-yellow-400"></i>
            <span className="font-black text-lg">{coins}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => { initAudio(); setGameState(GameState.BACKPACK); }}
            className="w-16 h-16 bg-slate-800/80 backdrop-blur rounded-full border-2 border-slate-600 flex items-center justify-center text-2xl shadow-lg pointer-events-auto relative active:scale-95 transition-transform"
          >
            <i className="fa-solid fa-briefcase text-blue-400"></i>
            {backpack.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 border-slate-800">
                {backpack.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => { initAudio(); setGameState(GameState.SHOP); }}
            className="w-16 h-16 bg-slate-800/80 backdrop-blur rounded-full border-2 border-slate-600 flex items-center justify-center text-2xl shadow-lg pointer-events-auto active:scale-95 transition-transform"
          >
            <i className="fa-solid fa-store text-yellow-500"></i>
          </button>
        </div>
      </div>

      {/* Center Layer */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 pointer-events-none">
        <div className="mb-12 transition-all duration-500">
          <div className="relative text-8xl">
            {gameState === GameState.IDLE && '🧘'}
            {gameState === GameState.CASTING && '💪'}
            {gameState === GameState.WAITING && '🎣'}
            {gameState === GameState.BITING && '‼️'}
            {gameState === GameState.FIGHTING && '😰'}
            {gameState === GameState.CAUGHT && '🥳'}

            {(gameState === GameState.WAITING || gameState === GameState.FIGHTING || gameState === GameState.BITING) && (
               <div className={`absolute -right-4 -top-8 w-1 h-32 origin-bottom rotate-45 rounded-full ${currentRod.style}`}></div>
            )}
          </div>
        </div>

        <div className="pointer-events-auto">
          {/* Combine IDLE and CASTING to keep the element in DOM while pointer is down */}
          {(gameState === GameState.IDLE || gameState === GameState.CASTING) && (
            <div className="flex flex-col items-center">
              {gameState === GameState.CASTING && (
                <div className="w-48 h-4 bg-slate-800 rounded-full border-2 border-slate-600 overflow-hidden mb-6 shadow-inner animate-in fade-in zoom-in duration-300">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-all"
                    style={{ width: `${castPower * 100}%` }}
                  ></div>
                </div>
              )}
              
              <button 
                onPointerDown={handleCastStart}
                onPointerUp={handleCastEnd}
                onPointerCancel={handleCastEnd}
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all select-none touch-none ${
                  gameState === GameState.CASTING 
                    ? 'bg-blue-500 scale-110 shadow-[0_0_30px_rgba(59,130,246,0.6)] border-white' 
                    : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] border-blue-400'
                } border-4`}
              >
                <i className={`fa-solid ${gameState === GameState.CASTING ? 'fa-arrow-up animate-bounce' : 'fa-fish-fins'} text-2xl mb-1`}></i>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {gameState === GameState.CASTING ? 'Release' : 'Cast'}
                </span>
              </button>
              
              {gameState === GameState.CASTING && (
                <p className="text-white text-sm font-bold animate-pulse uppercase tracking-wider mt-4">Release to Cast!</p>
              )}
            </div>
          )}

          {gameState === GameState.WAITING && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-slate-500 border-t-white animate-spin mb-4 mx-auto"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest">Waiting for a bite...</p>
            </div>
          )}

          {gameState === GameState.BITING && (
            <button 
              onClick={handleHook}
              className="w-24 h-24 rounded-full bg-red-600 hover:bg-red-500 shadow-[0_0_30px_rgba(220,38,38,0.6)] border-4 border-red-400 flex flex-col items-center justify-center transition-transform animate-ping active:scale-110"
            >
              <i className="fa-solid fa-anchor text-2xl mb-1"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Hook!</span>
            </button>
          )}
        </div>
      </div>

      {/* Overlays */}
      {gameState === GameState.CAUGHT && caughtFish && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="text-center mb-8">
             <h2 className="text-yellow-400 text-3xl font-black italic uppercase tracking-tighter mb-2">Magnificent Catch!</h2>
             <p className="text-slate-400 text-sm">You landed a record-breaker!</p>
          </div>

          <div className="flex flex-col items-center mb-8 relative">
             <div className="text-8xl mb-8 relative">
                🧑‍🌾
                <div className="absolute -top-4 -right-12 text-9xl transition-all duration-700" style={{ transform: `scale(${Math.max(1, caughtFish.length / 50)})` }}>
                   {caughtFish.emoji}
                </div>
             </div>

             <div className={`bg-slate-800 border-2 rounded-2xl p-6 w-full max-w-xs shadow-2xl ${
               caughtFish.rarity === Rarity.LEGENDARY ? 'legendary-glow border-yellow-500' : 
               caughtFish.rarity === Rarity.EPIC ? 'epic-glow border-purple-500' : 
               caughtFish.rarity === Rarity.RARE ? 'rare-glow border-blue-500' : 'border-slate-600'
             }`}>
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-2xl font-bold">{caughtFish.name}</h3>
                   <span className="bg-white/10 px-2 py-1 rounded text-[10px] font-black uppercase">{caughtFish.rarity}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div>
                      <p className="text-[10px] text-slate-400 uppercase">Length</p>
                      <p className="text-lg font-black">{caughtFish.length}cm</p>
                   </div>
                   <div>
                      <p className="text-[10px] text-slate-400 uppercase">Weight</p>
                      <p className="text-lg font-black">{caughtFish.weight}kg</p>
                   </div>
                </div>
                {caughtFish.isGigantic && (
                   <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 rounded-lg p-2 text-center text-sm font-black italic mb-4">
                      ⭐ ULTRA LARGE SIZE ⭐ (+20% VALUE)
                   </div>
                )}
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                   <span className="text-slate-400 text-sm font-bold">Value</span>
                   <span className="text-yellow-400 font-black text-xl">
                      <i className="fa-solid fa-coins mr-1"></i> {caughtFish.value}
                   </span>
                </div>
             </div>
          </div>
          <button 
            onClick={addToBackpack}
            className="w-full max-w-xs bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-lg shadow-xl active:scale-95 transition-all"
          >
            Add to Backpack
          </button>
        </div>
      )}

      {gameState === GameState.FIGHTING && bitingFish && (
        <FishingGame 
          rod={currentRod} 
          fish={bitingFish} 
          onSuccess={handleFishingSuccess} 
          onFail={handleFishingFail} 
        />
      )}

      {gameState === GameState.SHOP && (
        <RodShop 
          coins={coins}
          unlockedRods={unlockedRods}
          currentRodId={currentRodId}
          onUnlock={unlockRod}
          onSelect={(rod) => setCurrentRodId(rod.id)}
          onClose={() => setGameState(GameState.IDLE)}
        />
      )}

      {gameState === GameState.BACKPACK && (
        <Backpack 
          items={backpack}
          onSell={sellFish}
          onSellAll={sellAllFish}
          onClose={() => setGameState(GameState.IDLE)}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-800 border border-white/10 px-6 py-3 rounded-full shadow-2xl animate-bounce">
          <p className="text-white font-bold text-sm flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-blue-400"></i> {toast}
          </p>
        </div>
      )}

      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Zen Fishing Mobile v1.1</p>
      </div>
    </div>
  );
};

export default App;
