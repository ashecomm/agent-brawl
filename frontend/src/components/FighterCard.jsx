import { generateAvatar, shortenWallet } from '../App.jsx';

const SLOT_ICONS = { weapon: '⚔️', armor: '🛡️', boots: '👢', helmet: '🪖' };
const RARITY_BORDER = { common: '#aaa4', rare: '#4d96ff4', epic: '#c77dff4', legendary: '#ffd70066' };

export default function FighterCard({ fighter, compact = false, onClick, showChallenge = false, onChallenge }) {
  if (!fighter) return null;

  const wr = fighter.wins + fighter.losses > 0
    ? Math.round((fighter.wins / (fighter.wins + fighter.losses)) * 100)
    : 0;

  const maxStat = 30;
  const equip = fighter.equipment || [];

  return (
    <div className={`fighter-card ${compact ? 'compact' : ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
      <div>{generateAvatar(fighter.avatar_seed, compact ? 42 : 48)}</div>
      <div className="fighter-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="fighter-wallet">{shortenWallet(fighter.wallet)}</span>
          <span className={`league-badge league-${fighter.league}`}>{fighter.league}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
          <span className="fighter-level">Lv.{fighter.level}</span>
          <span className="fighter-level">ELO {fighter.elo}</span>
          <span className="fighter-level">{fighter.wins}W / {fighter.losses}L</span>
          {fighter.winstreak > 0 && <span style={{ color: '#ff6b6b', fontSize: '0.72rem' }}>🔥 {fighter.winstreak} streak</span>}
        </div>
        {!compact && (
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
              <span style={{ color: '#ff6b6b' }}>⚔️</span><span>{fighter.base_attack}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
              <span style={{ color: '#4d96ff' }}>🛡️</span><span>{fighter.base_defense}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
              <span style={{ color: '#6bcb77' }}>⚡</span><span>{fighter.base_speed}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
              <span style={{ color: '#ffd93d' }}>🍀</span><span>{fighter.base_luck}</span>
            </div>
          </div>
        )}
      </div>
      {showChallenge && onChallenge && (
        <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); onChallenge(); }}>
          ⚔️ Challenge
        </button>
      )}
    </div>
  );
}
