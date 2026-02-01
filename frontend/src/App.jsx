import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import Arena from './components/Arena.jsx';
import Profile from './components/Profile.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import Achievements from './components/Achievements.jsx';
import Referral from './components/Referral.jsx';
import { createFighter, getFighter } from './api.js';

// Deterministic avatar from seed
export function generateAvatar(seed, size = 48) {
  const s = seed || 0;
  const colors = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c77dff','#ff9a76','#a8dadc','#e07a5f','#f4a261','#264653'];
  const bg = colors[s % colors.length];
  const fg = colors[(s * 7 + 3) % colors.length];
  const shapes = s % 4;
  const letter = String.fromCharCode(65 + ((s * 13) % 26));

  let shapeSvg = '';
  switch (shapes) {
    case 0: shapeSvg = `<circle cx="50%" cy="40%" r="18" fill="${fg}" opacity="0.6"/>`; break;
    case 1: shapeSvg = `<polygon points="50,12 88,80 12,80" fill="${fg}" opacity="0.6"/>`; break;
    case 2: shapeSvg = `<rect x="25" y="25" width="50" height="50" rx="8" fill="${fg}" opacity="0.6"/>`; break;
    case 3: shapeSvg = `<polygon points="50,8 62,35 92,35 68,55 78,85 50,68 22,85 32,55 8,35 38,35" fill="${fg}" opacity="0.6"/>`; break;
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ borderRadius: '50%', display: 'block' }}>
      <rect width="100" height="100" rx="50" fill={bg} />
      {shapeSvg}
      <text x="50" y="58" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="700" fontFamily="sans-serif" opacity="0.9">{letter}</text>
    </svg>
  );
}

export function shortenWallet(w) {
  if (!w) return '';
  return w.slice(0, 6) + '...' + w.slice(-4);
}

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [fighter, setFighter] = useState(null);
  const [page, setPage] = useState('arena');
  const [toast, setToast] = useState(null);

  // Check URL for referral code
  const getReferrerFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('ref');
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      showToast('No wallet detected. Install MetaMask!');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr = accounts[0];
      setWallet(addr);
      const referrer = getReferrerFromUrl();
      const f = await createFighter(addr, referrer);
      setFighter(f);
      showToast('Connected! Welcome, ' + shortenWallet(addr));
    } catch (e) {
      showToast('Connection failed: ' + e.message);
    }
  };

  const refreshFighter = async () => {
    if (!wallet) return;
    const f = await getFighter(wallet);
    if (f) setFighter(f);
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) { setWallet(null); setFighter(null); }
        else { setWallet(accounts[0]); }
      });
    }
  }, []);

  const showToast = (msg, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const renderPage = () => {
    switch (page) {
      case 'arena': return <Arena wallet={wallet} fighter={fighter} onBattle={refreshFighter} showToast={showToast} />;
      case 'profile': return <Profile wallet={wallet} fighter={fighter} refreshFighter={refreshFighter} />;
      case 'leaderboard': return <Leaderboard wallet={wallet} />;
      case 'achievements': return <Achievements wallet={wallet} fighter={fighter} />;
      case 'referral': return <Referral wallet={wallet} fighter={fighter} />;
      default: return <Arena wallet={wallet} fighter={fighter} onBattle={refreshFighter} showToast={showToast} />;
    }
  };

  return (
    <div className="app">
      <Header wallet={wallet} fighter={fighter} page={page} setPage={setPage} connectWallet={connectWallet} />
      <div className="main-content">
        {!wallet ? (
          <div className="empty-state">
            <div className="icon">⚔️</div>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: 8 }}>Agent Brawl</h2>
            <p style={{ color: '#666', marginBottom: 24 }}>Connect your wallet to create your fighter and enter the arena.</p>
            <button className="btn btn-primary" onClick={connectWallet} style={{ fontSize: '1rem', padding: '12px 32px' }}>
              Connect Wallet
            </button>
          </div>
        ) : renderPage()}
      </div>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
