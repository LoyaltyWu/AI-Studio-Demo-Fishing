
import React from 'react';
import { FishInstance, Rarity } from '../types';
import { MAX_BACKPACK_SIZE } from '../constants';

interface BackpackProps {
  items: FishInstance[];
  onSell: (id: string) => void;
  onSellAll: () => void;
  onClose: () => void;
}

export const Backpack: React.FC<BackpackProps> = ({ items, onSell, onSellAll, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <i className="fa-solid fa-bag-shopping mr-2 text-blue-400"></i> Backpack 
            <span className="ml-2 text-sm font-normal text-slate-400">({items.length}/{MAX_BACKPACK_SIZE})</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl p-2">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-10 text-slate-500 italic">
              Empty... go fishing!
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-xl bg-slate-700/50 border border-slate-600 ${
                  item.rarity === Rarity.LEGENDARY ? 'border-yellow-500/50' : ''
                }`}
              >
                <div className="text-4xl w-12 text-center">{item.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm truncate">{item.name}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      item.rarity === Rarity.LEGENDARY ? 'bg-yellow-500 text-black' :
                      item.rarity === Rarity.EPIC ? 'bg-purple-500 text-white' :
                      item.rarity === Rarity.RARE ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'
                    }`}>
                      {item.rarity}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {item.length}cm • {item.weight}kg 
                    {item.isGigantic && <span className="ml-2 text-yellow-400 font-bold underline">BIG</span>}
                  </div>
                </div>
                <button 
                  onClick={() => onSell(item.id)}
                  className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-bold flex flex-col items-center"
                >
                  <span className="text-[10px] opacity-80 mb-0.5">Sell</span>
                  <span><i className="fa-solid fa-coins mr-1"></i>{item.value}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-slate-700">
            <button 
              onClick={onSellAll}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-hand-holding-dollar"></i>
              Sell All For <i className="fa-solid fa-coins ml-1"></i> {items.reduce((acc, i) => acc + i.value, 0)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
