import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api.js';
import { generateAvatar } from '../Avatar.jsx';

export default function Leaderboard({ agent }) {
  const [data, setData] = useState([]);
  const [sort, setSort] = useState('elo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(sort, 50).then(d => { setData(d); setLoading(false); });
  }, [sort]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div>
      <div className="section-title">🏆 Leaderboard</div>
      <div className="tabs">
        {['elo', 'wins', 'level'].map(s => (
          <button key={s} className={`tab ${sort === s ? 'active' : ''}`} onClick={() => setSort(s)}>
            {s === 'elo' ? 'ELO' : s === 'wins' ? 'Wins' : 'Level'}
          </button>
        ))}
      </div>

      {loading && <div className="loading"><div className="spinner"></div>Loading...</div>}
      {!loading && data.length === 0 && <div className="empty-state"><div className="icon">🏆</div><p>No fighters yet.</p></div>}
      {!loading && data.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="leaderboard-table" style={{ width: '100%' }}>
            <thead>
              <tr><th>#</th><th>Fighter</th><th>League</th><th>ELO</th><th>Lv</th><th>W/L</th></tr>
            </thead>
            <tbody>
              {data.map((f, i) => {
                const isMe = f.agentId === agent?.agentId;
                return (
                  <tr key={f.agentId} className={f.isHallOfFame ? 'hof' : ''} style={isMe ? { background: '#c77dff11' } : {}}>
                    <td><span className="rank-medal">{i < 3 ? medals[i] : i + 1}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {generateAvatar(f.avatar_seed, 30)}
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: isMe ? '#c77dff' : '#ddd' }}>{f.name}</span>
                        {isMe && <span style={{ fontSize: '0.65rem', color: '#c77dff' }}>(you)</span>}
                        {f.isHallOfFame && <span style={{ fontSize: '0.6rem', color: '#ffd700' }}>🏆 HoF</span>}
                      </div>
                    </td>
                    <td><span className={`league-badge league-${f.league}`}>{f.league}</span></td>
                    <td style={{ fontWeight: 600 }}>{f.elo}</td>
                    <td style={{ color: '#c77dff' }}>{f.level}</td>
                    <td style={{ fontSize: '0.8rem' }}><span style={{ color: '#6bcb77' }}>{f.wins}</span><span style={{ color: '#555' }}>/</span><span style={{ color: '#ff6b6b' }}>{f.losses}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
