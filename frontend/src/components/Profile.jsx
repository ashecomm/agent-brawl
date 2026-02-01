import { useState, useEffect } from 'react';
import { generateAvatar } from '../Avatar.jsx';
import { getMyBattles } from '../api.js';
import BattleView from './BattleView.jsx';

const SLOT_ICONS = { weapon: '⚔️', armor: '🛡️', boots: '👢', helmet: '🪖' };
const SLOT_LABELS = { weapon: 'Weapon', armor: 'Armor', boots: 'Boots', helmet: 'Helmet' };
const RARITY_COLORS = { common: '#aaa', rare: '#4d96ff', epic: '#c77dff', legendary: '#ffd700' };

export default function Profile({ agent, fighter, refreshFighter }) {
  const [battles, setBattles] = useState([]);
  const [replayBattle, setReplayBattle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agent) getMyBattles().then(b => { setBattles(b); setLoading(false); });
  }, [agent]);

  if (!fighter) return <div className="empty-state"><div className="icon">👤</div><p>No fighter data</p></div>;
  if (replayBattle) return <BattleView result={replayBattle} agent={agent} onClose={() => setReplayBattle(null)} />;

  const equip = fighter.equipment || [];
  const slots = ['weapon', 'armor', 'boots', 'helmet'];

  // Compute totals (base + equipment bonuses)
  const totalAtk = fighter.base_attack + equip.reduce((s, e) => s + (e.attack_bonus || 0), 0);
  const totalDef = fighter.base_defense + equip.reduce((s, e) => s + (e.defense_bonus || 0), 0);
  const totalSpd = fighter.base_speed + equip.reduce((s, e) => s + (e.speed_bonus || 0), 0);
  const totalLck = fighter.base_luck + equip.reduce((s, e) => s + (e.luck_bonus || 0), 0);

  const atkBonus = totalAtk - fighter.base_attack;
  const defBonus = totalDef - fighter.base_defense;
  const spdBonus = totalSpd - fighter.base_speed;
  const lckBonus = totalLck - fighter.base_luck;

  const xpPct = fighter.xpToNext > 0 ? (fighter.xp / fighter.xpToNext) * 100 : 0;

  return (
    <div>
      {/* ── Header ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>{generateAvatar(fighter.avatar_seed, 72)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>{fighter.name}</span>
              <span className={`league-badge league-${fighter.league}`}>{fighter.league}</span>
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: '#aaa' }}>Level <strong style={{ color: '#c77dff' }}>{fighter.level}</strong></span>
              <span style={{ fontSize: '0.82rem', color: '#aaa' }}>ELO <strong style={{ color: '#fff' }}>{fighter.elo}</strong></span>
              <span style={{ fontSize: '0.82rem', color: '#aaa' }}><strong style={{ color: '#6bcb77' }}>{fighter.wins}</strong>W / <strong style={{ color: '#ff6b6b' }}>{fighter.losses}</strong>L</span>
              {fighter.winstreak > 0 && <span style={{ fontSize: '0.82rem', color: '#ff6b6b' }}>🔥 {fighter.winstreak} streak</span>}
            </div>
            {/* XP Bar */}
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#666', marginBottom: 3 }}>
                <span>XP: {fighter.xp} / {fighter.xpToNext}</span>
                <span>→ Lv {fighter.level < 100 ? fighter.level + 1 : 'MAX'}</span>
              </div>
              <div style={{ background: '#1e1e3a', borderRadius: 4, height: 8 }}>
                <div style={{ width: `${xpPct}%`, height: '100%', background: 'linear-gradient(90deg,#c77dff,#7c3aed)', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats + Equipment ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Stats with totals */}
        <div className="card">
          <div className="section-title" style={{ fontSize: '0.9rem' }}>📊 Stats</div>
          {[
            { label: 'Attack',  base: fighter.base_attack,  total: totalAtk, bonus: atkBonus, cls: 'atk', color: '#ff6b6b' },
            { label: 'Defense', base: fighter.base_defense,  total: totalDef, bonus: defBonus, cls: 'def', color: '#4d96ff' },
            { label: 'Speed',   base: fighter.base_speed,    total: totalSpd, bonus: spdBonus, cls: 'spd', color: '#6bcb77' },
            { label: 'Luck',    base: fighter.base_luck,     total: totalLck, bonus: lckBonus, cls: 'lck', color: '#ffd93d' }
          ].map(s => (
            <div key={s.label} className="stat-row">
              <span className="stat-label">{s.label}</span>
              <div className="stat-bar-bg">
                <div className={`stat-bar-fill stat-bar-${s.cls}`} style={{ width: `${Math.min(100, (s.total / 50) * 100)}%` }} />
              </div>
              <span className="stat-value" style={{ color: s.color }}>
                {s.total}
                {s.bonus > 0 && <span style={{ color: '#6bcb77', fontSize: '0.68rem', marginLeft: 3 }}>+{s.bonus}</span>}
              </span>
            </div>
          ))}
          {fighter.referralBoost > 0 && <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#6bcb77' }}>🔗 +{fighter.referralBoost}% referral boost</div>}
        </div>

        {/* Equipment with stat details */}
        <div className="card">
          <div className="section-title" style={{ fontSize: '0.9rem' }}>🎒 Equipment</div>
          <div className="equip-grid">
            {slots.map(slot => {
              const item = equip.find(e => e.slot === slot);
              return (
                <div key={slot} className={`equip-slot ${item ? '' : 'empty'}`} style={item ? { borderColor: RARITY_COLORS[item.rarity] + '44' } : {}}>
                  <span className="slot-icon">{SLOT_ICONS[slot]}</span>
                  {item ? (
                    <>
                      <span className="item-name" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</span>
                      <span className="item-rarity" style={{ color: RARITY_COLORS[item.rarity] }}>{item.rarity}</span>
                      <div className="equip-stats">
                        {item.attack_bonus > 0 && <span className="equip-stat" style={{ color: '#ff6b6b' }}>ATK+{item.attack_bonus}</span>}
                        {item.defense_bonus > 0 && <span className="equip-stat" style={{ color: '#4d96ff' }}>DEF+{item.defense_bonus}</span>}
                        {item.speed_bonus > 0 && <span className="equip-stat" style={{ color: '#6bcb77' }}>SPD+{item.speed_bonus}</span>}
                        {item.luck_bonus > 0 && <span className="equip-stat" style={{ color: '#ffd93d' }}>LCK+{item.luck_bonus}</span>}
                        {item.crit_chance > 0 && <span className="equip-stat" style={{ color: '#ff9a76' }}>CRIT+{item.crit_chance}%</span>}
                        {item.dodge_chance > 0 && <span className="equip-stat" style={{ color: '#a8dadc' }}>DODGE+{item.dodge_chance}%</span>}
                        {item.damage_reduction > 0 && <span className="equip-stat" style={{ color: '#4d96ff' }}>DMG-{item.damage_reduction}</span>}
                        {item.xp_bonus_percent > 0 && <span className="equip-stat" style={{ color: '#c77dff' }}>XP+{item.xp_bonus_percent}%</span>}
                      </div>
                    </>
                  ) : <span className="slot-label">{SLOT_LABELS[slot]}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Battle History ── */}
      <div className="card">
        <div className="section-title" style={{ fontSize: '0.9rem' }}>📜 Battle History</div>
        {loading && <div className="loading"><div className="spinner"></div>Loading...</div>}
        {!loading && battles.length === 0 && <div style={{ color: '#555', fontSize: '0.82rem', padding: '20px 0' }}>No battles yet. Go to the Arena!</div>}
        {!loading && battles.map((b, i) => {
          const isWinner = b.winner === agent?.agentId;
          const opName = b.challenger === agent?.agentId ? (b.defenderName || b.defender) : (b.challengerName || b.challenger);
          return (
            <div key={b.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < battles.length - 1 ? '1px solid #1a1a2e' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.75rem', width: 28, textAlign: 'center', borderRadius: 4, padding: '2px 0', background: isWinner ? '#6bcb7722' : '#ff6b6b22', color: isWinner ? '#6bcb77' : '#ff6b6b' }}>
                  {b.winner ? (isWinner ? 'W' : 'L') : 'D'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#aaa' }}>vs {opName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.72rem', color: isWinner ? '#6bcb77' : '#ff6b6b' }}>
                  {isWinner ? `+${b.elo_winner} ELO` : `${b.elo_loser} ELO`}
                </span>
                <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px' }} onClick={() => setReplayBattle(b)}>Replay</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
