
import { FishTemplate, FishInstance, Rarity, Rod } from '../types';
import { FISH_TEMPLATES } from '../constants';

export const calculateFish = (castDistance: number, rod: Rod): FishInstance => {
  // 1. Pick a template based on probability + rod rarity bonus
  const totalWeight = FISH_TEMPLATES.reduce((sum, f) => {
    let weight = f.baseProb;
    if (f.rarity !== Rarity.COMMON) weight *= (1 + rod.rarityBonus);
    return sum + weight;
  }, 0);

  let random = Math.random() * totalWeight;
  let selectedTemplate: FishTemplate = FISH_TEMPLATES[0];

  for (const f of FISH_TEMPLATES) {
    let weight = f.baseProb;
    if (f.rarity !== Rarity.COMMON) weight *= (1 + rod.rarityBonus);
    if (random < weight) {
      selectedTemplate = f;
      break;
    }
    random -= weight;
  }

  // 2. Calculate attributes
  const distanceFactor = Math.min(castDistance, 1); // 0 to 1
  const rodLengthBonus = rod.lengthBonus;

  const lengthRange = selectedTemplate.maxLength - selectedTemplate.minLength;
  // Length = base + random float influenced by distance and rod
  const lengthVariation = (Math.random() * 0.7 + (distanceFactor * 0.2) + (rodLengthBonus * 0.1)) * lengthRange;
  const length = Math.min(selectedTemplate.maxLength, selectedTemplate.minLength + lengthVariation);
  
  const weightRange = selectedTemplate.maxWeight - selectedTemplate.minWeight;
  const weight = selectedTemplate.minWeight + (lengthVariation / lengthRange) * weightRange;

  const isGigantic = length >= selectedTemplate.maxLength * 0.9;

  // 3. Calculate value
  let rarityMultiplier = 1;
  switch (selectedTemplate.rarity) {
    case Rarity.RARE: rarityMultiplier = 2; break;
    case Rarity.EPIC: rarityMultiplier = 3; break;
    case Rarity.LEGENDARY: rarityMultiplier = 5; break;
  }

  let value = Math.floor((weight * 0.8 + length * 0.5) * rarityMultiplier);
  if (isGigantic) value = Math.floor(value * 1.2);

  return {
    id: Math.random().toString(36).substr(2, 9),
    templateId: selectedTemplate.id,
    name: selectedTemplate.name,
    weight: Number(weight.toFixed(1)),
    length: Number(length.toFixed(1)),
    rarity: selectedTemplate.rarity,
    value,
    isGigantic,
    emoji: selectedTemplate.emoji
  };
};
