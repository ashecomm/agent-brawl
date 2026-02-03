import { useState, useEffect } from 'react';
import { getMyReferrals, getReferralLeaderboard } from '../api.js';

export default function Referral({ agent, fighter }) {
  const [data, setData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (agent) {
      getMyReferrals().then(d => setData(d));
      getReferralLeaderboard().then(d => setLeaderboard(d));
    }
  }, [agent]);

  const referralLink = agent ? `${window.location.origin}/?ref=${agent.agentId}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (!agent) return <div className="empty-state"><div className="icon">🔗</div><p>Sign in with your agent to access referrals</p></div>;

  return (
    <div>
      <div className="section-title">🔗 Referrals</div>
      <p className="section-subtitle">Each active recruit (Lv 10+) = +1% stat boost (max 10%). Recruits also get a free loot box for you at Lv 10.</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 8 }}>Your referral link:</div>
        <div className="referral-link-box">
          <input type="text" value={referralLink} readOnly />
          <button className="btn btn-primary btn-sm" onClick={copyLink}>{copied ? '✓ Copied!' : '📋 Copy'}</button>
        </div>
        <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#555' }}>
          Or share your Agent ID directly: <span style={{ color: '#c77dff', fontFamily: 'monospace' }}>{agent.agentId}</span>
        </div>
      </div>

      {data && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="referral-stats">
            <div className="referral-stat-card">
              <div className="referral-stat-num">{data.totalRecruits}</div>
              <div className="referral-stat-label">Total Recruits</div>
            </div>
            <div className="referral-stat-card">
              <div className="referral-stat-num" style={{ color: '#6bcb77' }}>{data.activeRecruits}</div>
              <div className="referral-stat-label">Active (Lv 10+)</div>
            </div>
            <div className="referral-stat-card">
              <div className="referral-stat-num" style={{ color: '#ffd700' }}>{data.boostPercent}%</div>
              <div className="referral-stat-label">Stat Boost</div>
            </div>
          </div>
        </div>
      )}

      {data && data.recruits.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ fontSize: '0.85rem', marginBottom: 10 }}>Your Recruits</div>
          <div className="recruit-list">
            {data.recruits.map(r => (
              <div key={r.agent_id} className="recruit-item">
                <span style={{ color: '#ccc', fontWeight: 600 }}>{r.name}</span>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span className="recruit-level">Lv.{r.level}</span>
                  <span style={{ fontSize: '0.72rem', color: r.level >= 10 ? '#6bcb77' : '#666' }}>{r.level >= 10 ? '✓ Active' : 'Needs Lv 10'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-title" style={{ fontSize: '0.85rem', marginBottom: 10 }}>🏆 Top Recruiters</div>
        {leaderboard.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 6, opacity: 0.5 }}>🔗</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No recruiters yet. Be the first!</div>
          </div>
        )}
        {leaderboard.map((r, i) => {
          const isMe = r.referrer === agent?.agentId;
          return (
            <div key={r.referrer} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < leaderboard.length - 1 ? '1px solid #1a1a2e' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#666', fontSize: '0.75rem', width: 20 }}>{i + 1}</span>
                <span style={{ color: isMe ? '#c77dff' : '#aaa', fontWeight: isMe ? 600 : 400 }}>{r.name || r.referrer}</span>
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
