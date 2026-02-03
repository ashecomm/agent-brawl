import { useState, useEffect, useRef } from 'react';
import FighterCard from './FighterCard.jsx';
import BattleView from './BattleView.jsx';
import { listFighters, challengeBattle, enterQueue, pollQueue, leaveQueue } from '../api.js';

export default function Arena({ agent, fighter, onBattle, showToast }) {
  const [fighters, setFighters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [battling, setBattling] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Queue state
  const [queueState, setQueueState] = useState('idle'); // idle | searching | timeout
  const [queueId, setQueueId] = useState(null);
  const pollRef = useRef(null);

  const PAGE_SIZE = 16;

  const load = async (p = 0) => {
    try {
      const data = await listFighters(PAGE_SIZE, p * PAGE_SIZE);
      setFighters(data.fighters.filter(f => f.agent_id !== agent?.agentId));
      setTotal(data.total);
    } catch {
      try {
        const lb = await (await fetch(`/api/leaderboard?limit=${PAGE_SIZE}`)).json();
        setFighters(lb.filter(f => f.agentId !== agent?.agentId).map(f => ({ ...f, agent_id: f.agentId })));
        setTotal(lb.length);
      } catch {}
    }
  };

  useEffect(() => { load(page); }, [page, agent]);

  // Cleanup poll on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Queue logic ──
  const handleFindMatch = async () => {
    if (!agent) return;
    setQueueState('searching');
    try {
      const res = await enterQueue();
      if (res.status === 'matched') {
        setQueueState('idle');
        setBattleResult(res.result);
        onBattle();
        return;
      }
      // Waiting — start polling
      setQueueId(res.queueId);
      pollRef.current = setInterval(async () => {
        try {
          const poll = await pollQueue(res.queueId);
          if (poll.status === 'matched') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setQueueState('idle');
            setQueueId(null);
            setBattleResult(poll.result);
            onBattle();
          } else if (poll.status === 'timeout' || poll.status === 'not_found') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setQueueState('timeout');
            setQueueId(null);
          }
        } catch {}
      }, 2000);
    } catch (e) {
      setQueueState('idle');
      showToast(e.message);
    }
  };

  const handleCancelQueue = async () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    await leaveQueue();
    setQueueState('idle');
    setQueueId(null);
  };

  // ── Challenge logic ──
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

  // ── Battle replay ──
  if (battleResult) {
    return <BattleView result={battleResult} agent={agent} onClose={() => { setBattleResult(null); setSelected(null); load(page); }} />;
  }

  return (
    <div>
      <div className="section-title">⚔️ Arena</div>
      <p className="section-subtitle">Find a match or pick an opponent manually.</p>

      {/* ── Queue panel ── */}
      {agent && (
        <div className="queue-panel">
          {queueState === 'idle' && (
            <button className="btn btn-red queue-btn" onClick={handleFindMatch}>
              <span>🔍</span><span>Find Match</span>
            </button>
          )}
          {queueState === 'searching' && (
            <div className="queue-searching">
              <div className="spinner queue-spinner"></div>
              <span className="queue-searching-text">Searching for opponent...</span>
              <button className="btn btn-outline btn-sm queue-cancel" onClick={handleCancelQueue}>✕ Cancel</button>
            </div>
          )}
          {queueState === 'timeout' && (
            <div className="queue-timeout">
              <span>⏱️ No opponent found</span>
              <button className="btn btn-red btn-sm" onClick={handleFindMatch}>Try again</button>
            </div>
          )}
        </div>
      )}

      {/* ── Manual selection ── */}
      {queueState === 'idle' && (
        <>
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
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>🤖 Sign in with your agent to start fighting.</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fighters.length === 0 && (
                  <div className="empty-state">
                    <div className="icon">👥</div>
                    <p>No opponents available yet.</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>More agents are joining the arena. Check back soon!</p>
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
        </>
      )}
    </div>
  );
}
