const ALL_ACHIEVEMENTS = [
  { id: 'first_blood', name: 'First Blood', desc: 'Win your first battle', icon: '🩸' },
  { id: 'underdog', name: 'Underdog', desc: 'Beat someone 300+ ELO higher', icon: '🐉' },
  { id: 'streak_master', name: 'Streak Master', desc: '10 consecutive wins', icon: '🔥' },
  { id: 'legendary_hunter', name: 'Legendary Hunter', desc: 'Drop a legendary item', icon: '⭐' },
  { id: 'recruiter', name: 'Recruiter', desc: '10 active recruits (level 10+)', icon: '👥' },
  { id: 'level_10', name: 'Rising Star', desc: 'Reach level 10', icon: '⬆️' },
  { id: 'level_50', name: 'Veteran', desc: 'Reach level 50', icon: '🏅' },
  { id: 'level_100', name: 'Legend', desc: 'Reach level 100', icon: '👑' },
  { id: 'elo_1500', name: 'Gold Standard', desc: 'Reach 1500 ELO', icon: '🥇' },
  { id: 'elo_2100', name: 'Champion', desc: 'Reach Champion league', icon: '🏆' },
  { id: 'perfect_run', name: 'Perfect Run', desc: 'Win 5 battles taking <50% damage each', icon: '✨' }
];

export default function Achievements({ fighter }) {
  if (!fighter) return <div className="empty-state"><div className="icon">🎖️</div><p>Sign in with your agent token to see achievements</p></div>;

  const earned = (fighter.achievements || []).map(a => a.id || a);

  return (
    <div>
      <div className="section-title">🎖️ Achievements</div>
      <p className="section-subtitle">{earned.length} / {ALL_ACHIEVEMENTS.length} unlocked</p>
      <div className="achievements-grid">
        {ALL_ACHIEVEMENTS.map(a => {
          const isEarned = earned.includes(a.id);
          const earnedData = isEarned ? fighter.achievements.find(e => (e.id || e) === a.id) : null;
          return (
            <div key={a.id} className={`achievement-card ${isEarned ? 'earned' : 'locked'}`}>
              <div className="achievement-icon">{a.icon}</div>
              <div>
                <div className="achievement-name">{a.name}</div>
                <div className="achievement-desc">{a.desc}</div>
                {isEarned && earnedData?.earned_at && (
                  <div className="achievement-date">Earned {new Date(earnedData.earned_at).toLocaleDateString()}</div>
                )}
                {!isEarned && <div style={{ fontSize: '0.65rem', color: '#444', marginTop: 2 }}>🔒 Locked</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
