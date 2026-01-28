
export enum Rarity {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary'
}

export interface FishTemplate {
  id: string;
  name: string;
  minWeight: number;
  maxWeight: number;
  minLength: number;
  maxLength: number;
  rarity: Rarity;
  baseProb: number;
  color: string;
  emoji: string;
}

export interface FishInstance {
  id: string;
  templateId: string;
  name: string;
  weight: number;
  length: number;
  rarity: Rarity;
  value: number;
  isGigantic: boolean;
  emoji: string;
}

export interface Rod {
  id: number;
  name: string;
  price: number;
  barLength: number;
  tolerance: number;
  rarityBonus: number;
  lengthBonus: number;
  style: string;
  unlocked: boolean;
}

export enum GameState {
  IDLE = 'IDLE',
  CASTING = 'CASTING',
  WAITING = 'WAITING',
  BITING = 'BITING',
  FIGHTING = 'FIGHTING',
  CAUGHT = 'CAUGHT',
  SHOP = 'SHOP',
  BACKPACK = 'BACKPACK'
}

export interface SaveData {
  coins: number;
  unlockedRods: number[];
  currentRodId: number;
  backpack: FishInstance[];
}
