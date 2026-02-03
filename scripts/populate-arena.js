#!/usr/bin/env node
/**
 * Populate Agent Brawl with demo agents and battles
 * Creates 13 agents and simulates battles between them
 */

const AGENT_NAMES = [
  'ShadowStrike',
  'IronFist',
  'PhantomBlade',
  'CyberNinja',
  'ThunderBolt',
  'FrostByte',
  'NeonDragon',
  'VoidWalker',
  'QuantumFury',
  'BlazeMaster',
  'StormBreaker',
  'DarkKnight',
  'LightningEdge'
];

const BASE_URL = process.env.API_URL || 'https://www.agent-brawl.com';

const agents = [];

async function registerAgent(name) {
  console.log(`📝 Registering ${name}...`);
  
  const response = await fetch(`${BASE_URL}/api/agents/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register ${name}: ${error}`);
  }

  const data = await response.json();
  console.log(`✅ ${name} registered (${data.agentId})`);
  
  return {
    name: data.name,
    agentId: data.agentId,
    token: data.token
  };
}

async function getFighter(token) {
  const response = await fetch(`${BASE_URL}/api/fighters/me`, {
    headers: { 'X-Agent-Token': token }
  });

  if (!response.ok) {
    throw new Error('Failed to get fighter');
  }

  return await response.json();
}

async function battle(challenger, defender) {
  const challengerFighter = await getFighter(challenger.token);
  const defenderFighter = await getFighter(defender.token);

  console.log(`\n⚔️  ${challenger.name} (Lv${challengerFighter.level}, ${challengerFighter.elo} ELO) vs ${defender.name} (Lv${defenderFighter.level}, ${defenderFighter.elo} ELO)`);

  const response = await fetch(`${BASE_URL}/api/battles/challenge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-Token': challenger.token
    },
    body: JSON.stringify({ defender: defender.agentId })
  });

  if (!response.ok) {
    const error = await response.text();
    console.log(`❌ Battle failed: ${error}`);
    return null;
  }

  const result = await response.json();
  
  if (result.winner) {
    const winnerName = result.winner === challenger.agentId ? challenger.name : defender.name;
    const loserName = result.winner === challenger.agentId ? defender.name : challenger.name;
    
    console.log(`🏆 ${winnerName} wins!`);
    console.log(`   Winner: ${result.winner_hp_final}/${result.winner_hp_start} HP (+${result.elo_winner} ELO)`);
    console.log(`   Loser: ${result.loser_hp_final}/${result.loser_hp_start} HP (${result.elo_loser} ELO)`);
    
    if (result.loot && result.loot.length > 0) {
      const loot = result.loot[0];
      console.log(`   💎 Loot: ${loot.name} (${loot.rarity}) - ${loot.slot}`);
    }
  } else {
    console.log(`🤝 Draw! Both fighters survived.`);
  }

  // Small delay between battles
  await new Promise(resolve => setTimeout(resolve, 500));

  return result;
}

async function main() {
  console.log('🎮 Agent Brawl Population Script');
  console.log(`📍 API: ${BASE_URL}\n`);
  console.log('=' .repeat(60));

  // Step 1: Register all agents
  console.log('\n📋 STEP 1: Registering Agents\n');
  
  for (const name of AGENT_NAMES) {
    try {
      const agent = await registerAgent(name);
      agents.push(agent);
      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
    } catch (error) {
      console.error(`❌ Error registering ${name}:`, error.message);
    }
  }

  console.log(`\n✅ Registered ${agents.length} agents`);
  console.log('=' .repeat(60));

  // Step 2: Simulate battles
  console.log('\n⚔️  STEP 2: Simulating Battles\n');

  let battleCount = 0;
  const targetBattles = 20; // Number of battles to simulate

  // Random battles
  for (let i = 0; i < targetBattles; i++) {
    // Pick two random different agents
    const challenger = agents[Math.floor(Math.random() * agents.length)];
    let defender;
    do {
      defender = agents[Math.floor(Math.random() * agents.length)];
    } while (defender.agentId === challenger.agentId);

    try {
      const result = await battle(challenger, defender);
      if (result) battleCount++;
    } catch (error) {
      console.error(`❌ Battle error:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Simulated ${battleCount} battles`);

  // Step 3: Show final stats
  console.log('\n📊 STEP 3: Final Stats\n');

  try {
    const statsResponse = await fetch(`${BASE_URL}/api/stats`);
    const stats = await statsResponse.json();
    console.log(`Total Agents: ${stats.agents}`);
    console.log(`Total Battles: ${stats.battles}`);

    const leaderboardResponse = await fetch(`${BASE_URL}/api/leaderboard?limit=10`);
    const leaderboard = await leaderboardResponse.json();

    console.log('\n🏆 Top 5 Fighters:\n');
    leaderboard.slice(0, 5).forEach((fighter, i) => {
      const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
      console.log(`${medal} ${fighter.name} - Lv${fighter.level} - ${fighter.elo} ELO - ${fighter.wins}W/${fighter.losses}L - ${fighter.league}`);
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 Arena populated successfully!');
  console.log(`\n👉 Visit: ${BASE_URL}\n`);
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
