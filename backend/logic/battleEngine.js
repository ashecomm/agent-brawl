function getEffectiveStats(fighter, equipment, referralCount) {
  let stats = {
    attack: fighter.base_attack,
    defense: fighter.base_defense,
    speed: fighter.base_speed,
    luck: fighter.base_luck,
    critChance: 0,
    dodgeChance: 0,
    damageReduction: 0,
    xpBonusPercent: 0
  };

  for (const item of equipment) {
    stats.attack += item.attack_bonus;
    stats.defense += item.defense_bonus;
    stats.speed += item.speed_bonus;
    stats.luck += item.luck_bonus;
    stats.critChance += item.crit_chance;
    stats.dodgeChance += item.dodge_chance;
    stats.damageReduction += item.damage_reduction;
    stats.xpBonusPercent += item.xp_bonus_percent;
  }

  // Referral boost: 1% per recruit, cap 10%
  const boostPercent = Math.min(referralCount, 10);
  stats.attack = Math.floor(stats.attack * (1 + boostPercent / 100));
  stats.defense = Math.floor(stats.defense * (1 + boostPercent / 100));
  stats.speed = Math.floor(stats.speed * (1 + boostPercent / 100));
  stats.luck = Math.floor(stats.luck * (1 + boostPercent / 100));

  return stats;
}

function calculateHP(level, effectiveDefense) {
  return 100 + (level * 15) + (effectiveDefense * 3);
}

// Seeded PRNG for deterministic replay
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function resolveBattle(fighter1, f1Equip, f1Referrals, fighter2, f2Equip, f2Referrals) {
  const seed = Date.now() + Math.floor(Math.random() * 100000);
  const rand = seededRandom(seed);

  const f1Stats = getEffectiveStats(fighter1, f1Equip, f1Referrals);
  const f2Stats = getEffectiveStats(fighter2, f2Equip, f2Referrals);

  let f1Hp = calculateHP(fighter1.level, f1Stats.defense);
  let f2Hp = calculateHP(fighter2.level, f2Stats.defense);
  const f1MaxHp = f1Hp;
  const f2MaxHp = f2Hp;

  const rounds = [];
  let round = 1;

  while (f1Hp > 0 && f2Hp > 0 && round <= 200) {
    const f1SpeedRoll = f1Stats.speed + rand() * Math.max(1, f1Stats.luck);
    const f2SpeedRoll = f2Stats.speed + rand() * Math.max(1, f2Stats.luck);

    const order = f1SpeedRoll >= f2SpeedRoll
      ? [{ id: 'f1', atkStats: f1Stats, defStats: f2Stats }, { id: 'f2', atkStats: f2Stats, defStats: f1Stats }]
      : [{ id: 'f2', atkStats: f2Stats, defStats: f1Stats }, { id: 'f1', atkStats: f1Stats, defStats: f2Stats }];

    for (const action of order) {
      if (f1Hp <= 0 || f2Hp <= 0) break;

      const { id, atkStats, defStats } = action;

      // Dodge
      const isDodge = (rand() * 100) < defStats.dodgeChance;
      if (isDodge) {
        rounds.push({ round, attacker: id, damage: 0, isCrit: false, isDodge: true, f1Hp, f2Hp });
        continue;
      }

      // Damage calc
      let rawDamage = atkStats.attack + Math.floor(rand() * atkStats.attack * 0.4);
      const isCrit = (rand() * 100) < atkStats.critChance;
      if (isCrit) rawDamage = Math.floor(rawDamage * 2);

      let finalDamage = Math.max(1, rawDamage - defStats.defense - defStats.damageReduction);

      if (id === 'f1') {
        f2Hp -= finalDamage;
      } else {
        f1Hp -= finalDamage;
      }

      rounds.push({
        round,
        attacker: id,
        damage: finalDamage,
        isCrit,
        isDodge: false,
        f1Hp: Math.max(0, f1Hp),
        f2Hp: Math.max(0, f2Hp)
      });
    }
    round++;
  }

  let winner = null, loser = null;
  if (f1Hp > 0 && f2Hp <= 0) { winner = 'f1'; loser = 'f2'; }
  else if (f2Hp > 0 && f1Hp <= 0) { winner = 'f2'; loser = 'f1'; }

  return { winner, loser, rounds, seed, f1MaxHp, f2MaxHp, f1Stats, f2Stats };
}

module.exports = { resolveBattle, getEffectiveStats, calculateHP };
