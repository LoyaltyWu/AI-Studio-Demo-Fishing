
import { FishTemplate, Rarity, Rod } from './types';

export const FISH_TEMPLATES: FishTemplate[] = [
  { id: '1', name: 'Crucian Carp', minWeight: 10, maxWeight: 20, minLength: 10, maxLength: 15, rarity: Rarity.COMMON, baseProb: 0.30, color: 'text-slate-400', emoji: '🐟' },
  { id: '2', name: 'Perch', minWeight: 15, maxWeight: 25, minLength: 12, maxLength: 18, rarity: Rarity.COMMON, baseProb: 0.20, color: 'text-slate-400', emoji: '🐠' },
  { id: '3', name: 'Rainbow Trout', minWeight: 20, maxWeight: 35, minLength: 20, maxLength: 30, rarity: Rarity.RARE, baseProb: 0.15, color: 'text-blue-400', emoji: '🐡' },
  { id: '4', name: 'Smallmouth Bass', minWeight: 25, maxWeight: 45, minLength: 25, maxLength: 40, rarity: Rarity.RARE, baseProb: 0.12, color: 'text-blue-400', emoji: '🐟' },
  { id: '5', name: 'Catfish', minWeight: 40, maxWeight: 60, minLength: 45, maxLength: 65, rarity: Rarity.RARE, baseProb: 0.08, color: 'text-blue-400', emoji: '🦈' },
  { id: '6', name: 'Salmon', minWeight: 50, maxWeight: 75, minLength: 50, maxLength: 75, rarity: Rarity.EPIC, baseProb: 0.05, color: 'text-purple-400', emoji: '🍣' },
  { id: '7', name: 'Sturgeon', minWeight: 60, maxWeight: 85, minLength: 60, maxLength: 90, rarity: Rarity.EPIC, baseProb: 0.04, color: 'text-purple-400', emoji: '🦈' },
  { id: '8', name: 'Pike', minWeight: 45, maxWeight: 70, minLength: 55, maxLength: 85, rarity: Rarity.EPIC, baseProb: 0.03, color: 'text-purple-400', emoji: '🐟' },
  { id: '9', name: 'Golden Koi', minWeight: 70, maxWeight: 90, minLength: 70, maxLength: 95, rarity: Rarity.LEGENDARY, baseProb: 0.015, color: 'text-yellow-400', emoji: '🐠' },
  { id: '10', name: 'Arowana', minWeight: 80, maxWeight: 100, minLength: 80, maxLength: 100, rarity: Rarity.LEGENDARY, baseProb: 0.01, color: 'text-yellow-400', emoji: '🐉' },
  { id: '11', name: 'Neon Tetra', minWeight: 5, maxWeight: 10, minLength: 5, maxLength: 8, rarity: Rarity.EPIC, baseProb: 0.005, color: 'text-purple-400', emoji: '✨' },
  { id: '12', name: 'Leviathan', minWeight: 95, maxWeight: 100, minLength: 95, maxLength: 100, rarity: Rarity.LEGENDARY, baseProb: 0.001, color: 'text-yellow-600', emoji: '👑' },
];

export const RODS: Rod[] = [
  { 
    id: 0, 
    name: 'Bamboo Rod', 
    price: 0, 
    barLength: 100, 
    tolerance: 10,
    rarityBonus: 0, 
    lengthBonus: 0, 
    style: 'bg-amber-800', 
    unlocked: true 
  },
  { 
    id: 1, 
    name: 'Fiberglass Rod', 
    price: 1800, 
    barLength: 145, 
    tolerance: 15,
    rarityBonus: 0.1, 
    lengthBonus: 0.1, 
    style: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]', 
    unlocked: false 
  },
  { 
    id: 2, 
    name: 'Carbon Fiber Rod', 
    price: 4500, 
    barLength: 190, 
    tolerance: 20,
    rarityBonus: 0.25, 
    lengthBonus: 0.2, 
    style: 'bg-slate-800 border-b-2 border-blue-400', 
    unlocked: false 
  },
  { 
    id: 3, 
    name: 'Iridium Rod', 
    price: 9000, 
    barLength: 240, 
    tolerance: 25,
    rarityBonus: 0.4, 
    lengthBonus: 0.3, 
    style: 'bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-400 animate-pulse', 
    unlocked: false 
  },
];

export const MAX_BACKPACK_SIZE = 10;
