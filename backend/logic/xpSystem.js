function xpToNextLevel(level) {
  return Math.floor(500 * Math.pow(1.2, level - 1));
}

function awardXP(fighter, xpAmount, equipmentXpBonus) {
  const effectiveXp = Math.floor(xpAmount * (1 + equipmentXpBonus / 100));
  let currentXp = fighter.xp + effectiveXp;
  let level = fighter.level;
  const statGains = { attack: 0, defense: 0, speed: 0, luck: 0 };

  while (level < 100) {
    const needed = xpToNextLevel(level);
    if (currentXp >= needed) {
      currentXp -= needed;
      level++;
      const stats = ['attack', 'defense', 'speed', 'luck'];
      const chosen = stats[Math.floor(Math.random() * stats.length)];
      statGains[chosen]++;
    } else {
      break;
    }
  }

  return {
    newXp: currentXp,
    newLevel: level,
    leveledUp: level > fighter.level,
    statGains,
    effectiveXpAwarded: effectiveXp
  };
}

module.exports = { xpToNextLevel, awardXP };
