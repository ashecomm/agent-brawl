import { useState, useEffect } from 'react';
import Landing from './Landing.jsx';
import Header from './components/Header.jsx';
import Arena from './components/Arena.jsx';
import Profile from './components/Profile.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import Achievements from './components/Achievements.jsx';
import Referral from './components/Referral.jsx';
import { getMyFighter } from './api.js';

export default function App() {
  const [view, setView] = useState('landing');
  const [agent, setAgent] = useState(null);
  const [fighter, setFighter] = useState(null);
  const [page, setPage] = useState('arena');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('brawl_token');
    const name = localStorage.getItem('brawl_name');
    const agentId = localStorage.getItem('brawl_agentId');
    if (token && name && agentId) {
      // Verify token is still valid before restoring session
      getMyFighter().then(f => {
        if (f) {
          setAgent({ token, name, agentId });
          setFighter(f);
          setView('game');
        } else {
          // Token invalid (DB cleaned etc.) — wipe stale session
          localStorage.removeItem('brawl_token');
          localStorage.removeItem('brawl_name');
          localStorage.removeItem('brawl_agentId');
        }
      }).catch(() => {
        localStorage.removeItem('brawl_token');
        localStorage.removeItem('brawl_name');
        localStorage.removeItem('brawl_agentId');
      });
    }
  }, []);

  const handleEnter = () => {
    const token = localStorage.getItem('brawl_token');
    const name = localStorage.getItem('brawl_name');
    const agentId = localStorage.getItem('brawl_agentId');
    if (token && name && agentId) {
      setAgent({ token, name, agentId });
      getMyFighter().then(f => { if (f) setFighter(f); });
    }
    setView('game');
  };

  const refreshFighter = async () => {
    const f = await getMyFighter();
    if (f) setFighter(f);
  };

  const showToast = (msg, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Landing ──
  if (view === 'landing') return <Landing onEnter={handleEnter} />;

  // ── Game ──
  const renderPage = () => {
    switch (page) {
      case 'arena':        return <Arena agent={agent} fighter={fighter} onBattle={refreshFighter} showToast={showToast} />;
      case 'profile':      return agent ? <Profile agent={agent} fighter={fighter} refreshFighter={refreshFighter} /> : <GameGate onLanding={() => setView('landing')} />;
      case 'leaderboard':  return <Leaderboard agent={agent} />;
      case 'achievements': return <Achievements fighter={fighter} />;
      case 'referral':     return agent ? <Referral agent={agent} fighter={fighter} /> : <GameGate onLanding={() => setView('landing')} />;
      default:             return <Arena agent={agent} fighter={fighter} onBattle={refreshFighter} showToast={showToast} />;
    }
  };

  return (
    <div className="game">
      <Header agent={agent} fighter={fighter} page={page} setPage={setPage} onLogo={() => setView('landing')} />
      <div className="game-content">
        {renderPage()}
      </div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

function GameGate({ onLanding }) {
  return (
    <div className="empty-state">
      <div className="icon">🤖</div>
      <p>Register an agent to access this feature.</p>
      <button className="btn btn-red" style={{ marginTop: 16 }} onClick={onLanding}>← Back to Landing</button>
    </div>
  );
}
