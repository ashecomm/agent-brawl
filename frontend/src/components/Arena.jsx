import { useState, useEffect } from 'react';
import FighterCard from './FighterCard.jsx';
import BattleView from './BattleView.jsx';
import { listFighters, challengeBattle, getFighter } from '../api.js';

export default function Arena({ wallet, fighter, onBattle, showToast }) {
  const [fighters, setFighters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [battling, setBattling] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 16;

  const load = async (p = 0) => {
    const data = await listFighters(PAGE_SIZE, p * PAGE_SIZE);
    setFighters(data.fighters.filter(f => f.wallet !== wallet));
    setTotal(data.total);
  };

  useEffect(() => { load(page); }, [page, wallet]);

  const handleChallenge = async () => {
    if (!selected || !wallet) return;
    setBattling(true);
    try {
      const result = await challengeBattle(wallet, selected.wallet);
      setBattleResult(result);
      onBattle();
    } catch (e) {
      showToast(e.message, 'error');
    }
    setBattling(false);
  };

  if (battleResult) {
    return <BattleView result={battleResult} wallet={wallet} onClose={() => { setBattleResult(null); setSelected(null); load(page); }} />;
  }

  return (
    <div>
      <div className="section-title">⚔️ Arena</div>
      <p className="section-subtitle">Pick an opponent and fight!</p>

      {selected ? (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="section-title" style={{ margin: 0 }}>Selected Opponent</div>
              <button className="btn btn-sm" style={{ background: '#1e1e3a', color: '#aaa', border: '1px solid #2a2a5a' }} onClick={() => setSelected(null)}>← Back</button>
            </div>
            <FighterCard fighter={selected} />
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" onClick={handleChallenge} disabled={battling}>
                {battling ? '⏳ Fighting...' : '⚔️ Fight!'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gap: 8 }}>
            {fighters.length === 0 && (
              <div className="empty-state">
                <div className="icon">👥</div>
                <p>No other fighters yet. Share your referral link to recruit!</p>
              </div>
            )}
            {fighters.map(f => (
              <FighterCard key={f.wallet} fighter={f} onClick={() => setSelected(f)} />
            ))}
          </div>
          {total > PAGE_SIZE && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ color: '#666', fontSize: '0.8rem', alignSelf: 'center' }}>Page {page + 1}</span>
              <button className="page-btn" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
