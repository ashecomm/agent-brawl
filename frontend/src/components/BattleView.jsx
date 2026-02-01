import { useState, useEffect, useRef } from 'react';
import { generateAvatar, shortenWallet } from '../App.jsx';

const RARITY_COLORS = { common: '#aaa', rare: '#4d96ff', epic: '#c77dff', legendary: '#ffd700' };

export default function BattleView({ result, wallet, onClose }) {
  const [replayIndex, setReplayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);
  const logRef = useRef(null);

  const { rounds, winner, loser, f1MaxHp, f2MaxHp, eloWinner, eloLoser, loot, xpWinner, xpLoser, winnerLeveledUp, loserLeveledUp, winnerAchievements, loserAchievements, draw } = result;
  const challenger = result.challenger;
  const defender = result.defender;

  // Calculate current HP from round log
  const getCurrentHp = (idx) => {
    if (idx < 0 || rounds.length === 0) return { f1: f1MaxHp, f2: f2MaxHp };
    const round = rounds[Math.min(idx, rounds.length - 1)];
    return { f1: round.f1Hp, f2: round.f2Hp };
  };

  const hp = getCurrentHp(replayIndex - 1);
  const battleDone = replayIndex >= rounds.length;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setReplayIndex(prev => {
          if (prev >= rounds.length) { setPlaying(false); clearInterval(intervalRef.current); return prev; }
          return prev + 1;
        });
      }, 600);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, rounds.length]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [replayIndex]);

  const f1Pct = Math.max(0, (hp.f1 / f1MaxHp) * 100);
  const f2Pct = Math.max(0, (hp.f2 / f2MaxHp) * 100);

  return (
    <div>
      <div className="battle-arena">
        {/* HP Bars */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div className="hp-bar-label">
              <span>{shortenWallet(challenger)}</span>
              <span>{hp.f1}/{f1MaxHp}</span>
            </div>
            <div className="hp-bar-bg"><div className="hp-bar-fill left" style={{ width: `${f1Pct}%` }} /></div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="hp-bar-label" style={{ flexDirection: 'row-reverse' }}>
              <span>{shortenWallet(defender)}</span>
              <span>{hp.f2}/{f2MaxHp}</span>
            </div>
            <div className="hp-bar-bg"><div className="hp-bar-fill right" style={{ width: `${f2Pct}%` }} /></div>
          </div>
        </div>

        {/* Fighters */}
        <div className="battle-fighters">
          <div className="battle-side">
            {generateAvatar(0, 64)}
            <div className="fighter-name" style={{ marginTop: 8 }}>{shortenWallet(challenger)}</div>
          </div>
          <div className="battle-vs">VS</div>
          <div className="battle-side">
            {generateAvatar(1, 64)}
            <div className="fighter-name" style={{ marginTop: 8 }}>{shortenWallet(defender)}</div>
          </div>
        </div>

        {/* Round Log */}
        <div className="round-log" ref={logRef} style={{ marginBottom: 16 }}>
          {rounds.slice(0, replayIndex).map((r, i) => (
            <div key={i} className={`round-entry ${r.isCrit ? 'crit' : r.isDodge ? 'dodge' : ''}`}>
              <span className="round-num">#{r.round}</span>
              <span className="round-text">
                {r.isDodge ? (
                  <><span className={r.attacker === 'f1' ? '' : ''} style={{ color: '#fff', fontWeight: 600 }}>{shortenWallet(r.attacker === 'f1' ? challenger : defender)}</span> attacks — <span style={{ color: '#6bcb77' }}>DODGED!</span></>
                ) : (
                  <><span style={{ color: '#fff', fontWeight: 600 }}>{shortenWallet(r.attacker === 'f1' ? challenger : defender)}</span> deals <span style={{ color: '#ff6b6b', fontWeight: 600 }}>{r.damage}</span> damage{r.isCrit && <span style={{ color: '#ffd700' }}> ⚡ CRIT!</span>}</>
                )}
              </span>
            </div>
          ))}
          {rounds.length === 0 && <div style={{ padding: 20, color: '#555', textAlign: 'center' }}>No rounds</div>}
        </div>

        {/* Controls */}
        <div className="battle-controls">
          <button className="btn btn-sm" style={{ background: '#1e1e3a', color: '#aaa', border: '1px solid #2a2a5a' }} onClick={() => { setReplayIndex(0); setPlaying(false); }}>⏮ Reset</button>
          <button className="btn btn-sm" style={{ background: '#1e1e3a', color: '#aaa', border: '1px solid #2a2a5a' }} onClick={() => setReplayIndex(p => Math.max(0, p - 1))} disabled={replayIndex <= 0}>◀ Prev</button>
          <button className="btn btn-primary btn-sm" onClick={() => { if (battleDone) setReplayIndex(0); setPlaying(!playing); }}>
            {playing ? '⏸ Pause' : battleDone ? '🔄 Replay' : '▶ Play'}
          </button>
          <button className="btn btn-sm" style={{ background: '#1e1e3a', color: '#aaa', border: '1px solid #2a2a5a' }} onClick={() => setReplayIndex(p => Math.min(rounds.length, p + 1))} disabled={battleDone}>Next ▶</button>
          <button className="btn btn-sm" style={{ background: '#1e1e3a', color: '#aaa', border: '1px solid #2a2a5a' }} onClick={() => setReplayIndex(rounds.length)}>⏭ End</button>
        </div>
      </div>

      {/* Results */}
      {battleDone && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            {draw ? (
              <h3 style={{ color: '#aaa', fontSize: '1.2rem' }}>🤝 Draw!</h3>
            ) : (
              <h3 style={{ color: '#6bcb77', fontSize: '1.2rem' }}>🏆 {shortenWallet(winner)} wins!</h3>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 4 }}>Winner ELO</div>
              <div style={{ color: '#6bcb77', fontWeight: 600 }}>+{eloWinner} ELO</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 8 }}>Winner XP</div>
              <div style={{ color: '#c77dff', fontWeight: 600 }}>+{xpWinner} XP{winnerLeveledUp && ' ⬆️ Level Up!'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 4 }}>Loser ELO</div>
              <div style={{ color: '#ff6b6b', fontWeight: 600 }}>{eloLoser} ELO</div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 8 }}>Loser XP</div>
              <div style={{ color: '#c77dff', fontWeight: 600 }}>+{xpLoser} XP{loserLeveledUp && ' ⬆️ Level Up!'}</div>
            </div>
          </div>
          {loot && (
            <div style={{ marginTop: 16, padding: 12, background: '#0f0f24', borderRadius: 8, border: `1px solid ${RARITY_COLORS[loot.rarity]}44` }}>
              <div style={{ fontSize: '0.72rem', color: '#666', marginBottom: 4 }}>🎁 Loot Drop</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: RARITY_COLORS[loot.rarity], fontWeight: 600 }}>{loot.name}</span>
                <span style={{ fontSize: '0.7rem', color: RARITY_COLORS[loot.rarity], textTransform: 'uppercase' }}>{loot.rarity}{loot.equipped ? ' • Equipped!' : ''}</span>
              </div>
            </div>
          )}
          {(winnerAchievements?.length > 0 || loserAchievements?.length > 0) && (
            <div style={{ marginTop: 12, padding: 10, background: '#0f0f24', borderRadius: 8 }}>
              <div style={{ fontSize: '0.72rem', color: '#ffd700' }}>🎖️ New Achievement(s) earned!</div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={onClose}>← Back to Arena</button>
      </div>
    </div>
  );
}
