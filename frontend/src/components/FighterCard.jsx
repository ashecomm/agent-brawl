import { generateAvatar } from '../Avatar.jsx';

export default function FighterCard({ fighter, compact = false, onClick, showChallenge = false, onChallenge }) {
  if (!fighter) return null;

  return (
    <div className={`fighter-card ${compact ? 'compact' : ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
      <div>{generateAvatar(fighter.avatar_seed, compact ? 42 : 48)}</div>
      <div className="fighter-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{fighter.name}</span>
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
            <span style={{ fontSize: '0.75rem' }}>⚔️ <span style={{ color: '#ff6b6b' }}>{fighter.base_attack}</span></span>
            <span style={{ fontSize: '0.75rem' }}>🛡️ <span style={{ color: '#4d96ff' }}>{fighter.base_defense}</span></span>
            <span style={{ fontSize: '0.75rem' }}>⚡ <span style={{ color: '#6bcb77' }}>{fighter.base_speed}</span></span>
            <span style={{ fontSize: '0.75rem' }}>🍀 <span style={{ color: '#ffd93d' }}>{fighter.base_luck}</span></span>
          </div>
        )}
      </div>
      {showChallenge && onChallenge && (
        <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); onChallenge(); }}>⚔️ Challenge</button>
      )}
    </div>
  );
}
