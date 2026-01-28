
import React from 'react';
import { Rod } from '../types';
import { RODS } from '../constants';
import { sounds } from '../services/soundManager';

interface RodShopProps {
  coins: number;
  unlockedRods: number[];
  currentRodId: number;
  onUnlock: (rod: Rod) => void;
  onSelect: (rod: Rod) => void;
  onClose: () => void;
}

export const RodShop: React.FC<RodShopProps> = ({ 
  coins, unlockedRods, currentRodId, onUnlock, onSelect, onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <i className="fa-solid fa-store mr-2 text-blue-400"></i> Rod Shop
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl p-2">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-slate-900 p-3 rounded-lg flex justify-between items-center mb-4">
            <span className="text-slate-400">Your Balance</span>
            <span className="text-yellow-400 font-bold text-lg">
              <i className="fa-solid fa-coins mr-1"></i> {coins}
            </span>
          </div>

          {RODS.map((rod) => {
            const isUnlocked = unlockedRods.includes(rod.id);
            const isSelected = currentRodId === rod.id;
            const canAfford = coins >= rod.price;

            return (
              <div 
                key={rod.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isSelected ? 'border-blue-500 bg-slate-700' : 'border-slate-700 bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-lg ${rod.style} flex items-center justify-center text-3xl shadow-inner`}>
                    <i className="fa-solid fa-rod-curved"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{rod.name}</h3>
                    <div className="text-xs text-slate-400 grid grid-cols-2 gap-x-2 mt-1">
                      <span>Bar: {rod.barLength}px</span>
                      <span>Tol: ±{rod.tolerance}px</span>
                      <span>Rarity: +{rod.rarityBonus * 100}%</span>
                      <span>Size: +{rod.lengthBonus * 100}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {!isUnlocked ? (
                    <button 
                      onClick={() => onUnlock(rod)}
                      disabled={!canAfford}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                        canAfford 
                          ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900' 
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <i className="fa-solid fa-lock mr-2"></i> Unlock ({rod.price})
                    </button>
                  ) : (
                    <button 
                      onClick={() => onSelect(rod)}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                        isSelected 
                          ? 'bg-blue-600 text-white cursor-default' 
                          : 'bg-slate-600 hover:bg-slate-500 text-white'
                      }`}
                    >
                      {isSelected ? 'Equipped' : 'Use Rod'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
