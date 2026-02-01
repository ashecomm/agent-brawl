const { v4: uuidv4 } = require('uuid');

const RARITIES = [
  { name: 'common', chance: 60, statRange: [1, 3], passives: 0, uniques: 0 },
  { name: 'rare', chance: 25, statRange: [4, 7], passives: 1, uniques: 0 },
  { name: 'epic', chance: 12, statRange: [8, 12], passives: 2, uniques: 0 },
  { name: 'legendary', chance: 3, statRange: [13, 20], passives: 0, uniques: 1 }
];

const PASSIVE_EFFECTS = [
  'lifesteal_1', 'lifesteal_2', 'counter_strike', 'armor_break',
  'momentum', 'shield_bash', 'true_strike', 'berserker'
];

const UNIQUE_EFFECTS = [
  'phoenix_strike', 'shadow_step', 'iron_will', 'time_slash',
  'death_defiance', 'storm_fury'
];

const SLOT_NAMES = {
  weapon: {
    common: ['Iron Sword', 'Wooden Club', 'Dull Blade', 'Rust Dagger'],
    rare: ['Steel Longsword', 'Sharpened Cutlass', 'War Hammer', 'Keen Rapier'],
    epic: ['Void Blade', 'Dragon Fang', 'Shadow Reaper', 'Storm Lance'],
    legendary: ['Chaos Blade', 'Thunderclap', 'Deathbringer', 'Ragnarök']
  },
  armor: {
    common: ['Leather Vest', 'Wooden Shield', 'Cloth Tunic', 'Hide Armor'],
    rare: ['Chain Mail', 'Reinforced Plate', 'Scaled Armor', 'Battle Vest'],
    epic: ['Titan Guard', 'Phoenix Shell', 'Abyssal Plate', 'Aegis Armor'],
    legendary: ['Fortress Wall', 'Golem Shell', 'Invincible Shroud', 'Eternal Guard']
  },
  boots: {
    common: ['Leather Boots', 'Worn Sandals', 'Simple Shoes', 'Trail Walkers'],
    rare: ['Swift Steps', 'Wind Runners', 'Shadow Boots', 'Quick Stride'],
    epic: ['Phantom Treads', 'Lightning Steps', 'Void Walker', 'Ghost Shoes'],
    legendary: ['Flash Step', 'Time Stride', 'Dimensional Walker', 'Light Speed']
  },
  helmet: {
    common: ['Iron Cap', 'Wooden Helm', 'Leather Hood', 'Simple Visor'],
    rare: ['Knight Helm', 'Mystic Hood', 'War Crest', 'Sage Cowl'],
    epic: ['Oracle Crown', 'Fate Helm', 'Celestial Cap', 'Void Visor'],
    legendary: ['Omniscient Crown', 'Fate Weaver', 'Destiny Helm', 'Cosmic Crown']
  }
};

function rollRarity() {
  let roll = Math.random() * 100;
  let cumulative = 0;
  for (const rarity of RARITIES) {
    cumulative += rarity.chance;
    if (roll < cumulative) return rarity;
  }
  return RARITIES[0];
}

function rollSlot() {
  const slots = ['weapon', 'armor', 'boots', 'helmet'];
  return slots[Math.floor(Math.random() * slots.length)];
}

function generateItem() {
  const rarity = rollRarity();
  const slot = rollSlot();
  const [minStat, maxStat] = rarity.statRange;
  const totalBonus = minStat + Math.floor(Math.random() * (maxStat - minStat + 1));

  const item = {
    id: uuidv4(),
    slot,
    rarity: rarity.name,
    attack_bonus: 0,
    defense_bonus: 0,
    speed_bonus: 0,
    luck_bonus: 0,
    xp_bonus_percent: 0,
    crit_chance: 0,
    dodge_chance: 0,
    damage_reduction: 0,
    passive: null,
    unique_effect: null
  };

  const primaryShare = Math.ceil(totalBonus * 0.7);
  const secondaryShare = totalBonus - primaryShare;

  switch (slot) {
    case 'weapon':
      item.attack_bonus = primaryShare;
      item.crit_chance = Math.min(secondaryShare * 3, 25);
      break;
    case 'armor':
      item.defense_bonus = primaryShare;
      item.damage_reduction = secondaryShare;
      break;
    case 'boots':
      item.speed_bonus = primaryShare;
      item.dodge_chance = Math.min(secondaryShare * 3, 20);
      break;
    case 'helmet':
      item.luck_bonus = primaryShare;
      item.xp_bonus_percent = secondaryShare * 5;
      break;
  }

  const names = SLOT_NAMES[slot][rarity.name];
  item.name = names[Math.floor(Math.random() * names.length)];

  // Passives
  const availablePassives = [...PASSIVE_EFFECTS];
  const passiveList = [];
  for (let i = 0; i < rarity.passives; i++) {
    const idx = Math.floor(Math.random() * availablePassives.length);
    passiveList.push(availablePassives[idx]);
    availablePassives.splice(idx, 1);
  }
  if (passiveList.length > 0) item.passive = passiveList.join(',');

  // Unique effect
  if (rarity.uniques > 0) {
    item.unique_effect = UNIQUE_EFFECTS[Math.floor(Math.random() * UNIQUE_EFFECTS.length)];
  }

  return item;
}

module.exports = { generateItem };
