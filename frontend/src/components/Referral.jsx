import { useState, useEffect } from 'react';
import { getReferrals, getReferralLeaderboard } from '../api.js';
import { shortenWallet } from '../App.jsx';

export default function Referral({ wallet, fighter }) {
  const [referralData, setReferralData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (wallet) {
      getReferrals(wallet).then(d => setReferralData(d));
      getReferralLeaderboard().then(d => setLeaderboard(d));
    }
  }, [wallet]);

  const referralLink = wallet ? `${window.location.origin}/?ref=${wallet}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!wallet) return <div className="empty-state"><div className="icon">🔗</div><p>Connect wallet to see referrals</p></div>;

  return (
    <div>
      <div className="section-title">🔗 Referrals</div>
      <p className="section-subtitle">Recruit other agents. Each active recruit gives you +1% stat boost (max 10%).</p>

      {/* Referral Link */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 8 }}>Your referral link:</div>
        <div className="referral-link-box">
          <input type="text" value={referralLink} readOnly />
          <button className="btn btn-primary btn-sm" onClick={copyLink}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {referralData && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="referral-stats">
            <div className="referral-stat-card">
              <div className="referral-stat-num">{referralData.totalRecruits}</div>
              <div className="referral-stat-label">Total Recruits</div>
            </div>
            <div className="referral-stat-card">
              <div className="referral-stat-num" style={{ color: '#6bcb77' }}>{referralData.activeRecruits}</div>
              <div className="referral-stat-label">Active (Lv 10+)</div>
            </div>
            <div className="referral-stat-card">
              <div className="referral-stat-num" style={{ color: '#ffd700' }}>{referralData.boostPercent}%</div>
              <div className="referral-stat-label">Stat Boost</div>
            </div>
          </div>
        </div>
      )}

      {/* Recruit List */}
      {referralData && referralData.recruits.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ fontSize: '0.85rem', marginBottom: 10 }}>Your Recruits</div>
          <div className="recruit-list">
            {referralData.recruits.map(r => (
              <div key={r.wallet} className="recruit-item">
                <span className="recruit-wallet">{shortenWallet(r.wallet)}</span>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span className="recruit-level">Lv.{r.level}</span>
                  <span style={{ fontSize: '0.72rem', color: r.level >= 10 ? '#6bcb77' : '#666' }}>
                    {r.level >= 10 ? '✓ Active' : 'Needs Lv 10'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral Leaderboard */}
      <div className="card">
        <div className="section-title" style={{ fontSize: '0.85rem', marginBottom: 10 }}>🏆 Top Recruiters</div>
        {leaderboard.length === 0 && <div style={{ color: '#555', fontSize: '0.82rem' }}>No recruiters yet.</div>}
        {leaderboard.map((r, i) => {
          const isMe = r.wallet === wallet?.toLowerCase();
          return (
            <div key={r.wallet} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < leaderboard.length - 1 ? '1px solid #1a1a2e' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#666', fontSize: '0.75rem', width: 20 }}>{i + 1}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: isMe ? '#c77dff' : '#aaa' }}>{shortenWallet(r.wallet)}</span>
                {isMe && <span style={{ fontSize: '0.65rem', color: '#c77dff' }}>(you)</span>}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem' }}>
                <span style={{ color: '#6bcb77' }}>{r.active} active</span>
                <span style={{ color: '#666' }}>{r.total} total</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
