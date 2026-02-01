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

  const xpPct = fighter.xpToNext > 0 ? (fighter.xp / fighter.xpToNext) * 100 : 0;
  const equip = fighter.equipment || [];
  const slots = ['weapon', 'armor', 'boots', 'helmet'];

  return (
    <div>
      {/* Header */}
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

      {/* Stats + Equipment */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="section-title" style={{ fontSize: '0.9rem' }}>📊 Stats</div>
          {[
            { label: 'Attack', value: fighter.base_attack, cls: 'atk', color: '#ff6b6b' },
            { label: 'Defense', value: fighter.base_defense, cls: 'def', color: '#4d96ff' },
            { label: 'Speed', value: fighter.base_speed, cls: 'spd', color: '#6bcb77' },
            { label: 'Luck', value: fighter.base_luck, cls: 'lck', color: '#ffd93d' }
          ].map(s => (
            <div key={s.label} className="stat-row">
              <span className="stat-label">{s.label}</span>
              <div className="stat-bar-bg"><div className={`stat-bar-fill stat-bar-${s.cls}`} style={{ width: `${Math.min(100, (s.value / 40) * 100)}%` }} /></div>
              <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
          {fighter.referralBoost > 0 && <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#6bcb77' }}>🔗 +{fighter.referralBoost}% referral boost</div>}
        </div>
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
                      <span style={{ fontSize: '0.6rem', color: RARITY_COLORS[item.rarity], textTransform: 'uppercase' }}>{item.rarity}</span>
                    </>
                  ) : <span className="slot-label">{SLOT_LABELS[slot]}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Battle History */}
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
                <button className="btn btn-sm" style={{ background: '#1e1e3a', color: '#aaa', border: '1px solid #2a2a5a', padding: '4px 10px' }} onClick={() => setReplayBattle(b)}>Replay</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
