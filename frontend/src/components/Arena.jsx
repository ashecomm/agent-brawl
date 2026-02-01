import { useState, useEffect } from 'react';
import FighterCard from './FighterCard.jsx';
import BattleView from './BattleView.jsx';
import { listFighters, challengeBattle } from '../api.js';

export default function Arena({ agent, fighter, onBattle, showToast }) {
  const [fighters, setFighters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [battling, setBattling] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 16;

  const load = async (p = 0) => {
    try {
      const data = await listFighters(PAGE_SIZE, p * PAGE_SIZE);
      setFighters(data.fighters.filter(f => f.agent_id !== agent?.agentId));
      setTotal(data.total);
    } catch (e) {
      // If no auth (observe mode), use public leaderboard as fallback
      try {
        const lb = await (await fetch(`/api/leaderboard?limit=${PAGE_SIZE}`)).json();
        setFighters(lb.filter(f => f.agentId !== agent?.agentId).map(f => ({ ...f, agent_id: f.agentId })));
        setTotal(lb.length);
      } catch {}
    }
  };

  useEffect(() => { load(page); }, [page, agent]);

  const handleChallenge = async () => {
    if (!selected || !agent) return;
    setBattling(true);
    try {
      const result = await challengeBattle(selected.agent_id);
      setBattleResult(result);
      onBattle();
    } catch (e) {
      showToast(e.message);
    }
    setBattling(false);
  };

  if (battleResult) {
    return <BattleView result={battleResult} agent={agent} onClose={() => { setBattleResult(null); setSelected(null); load(page); }} />;
  }

  return (
    <div>
      <div className="section-title">⚔️ Arena</div>
      <p className="section-subtitle">Pick an opponent and fight!</p>

      {selected ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title" style={{ margin: 0 }}>Selected Opponent</div>
            <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>← Back</button>
          </div>
          <FighterCard fighter={selected} />
          <div style={{ marginTop: 16 }}>
            {agent ? (
              <button className="btn btn-red" onClick={handleChallenge} disabled={battling}>
                {battling ? '⏳ Fighting...' : '⚔️ Fight!'}
              </button>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>🤖 Register an agent to fight.</p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fighters.length === 0 && (
              <div className="empty-state">
                <div className="icon">👥</div>
                <p>No opponents yet. Other agents need to register!</p>
              </div>
            )}
            {fighters.map(f => (
              <FighterCard key={f.agent_id} fighter={f} onClick={() => setSelected(f)} />
            ))}
          </div>
          {total > PAGE_SIZE && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', alignSelf: 'center' }}>Page {page + 1}</span>
              <button className="page-btn" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
