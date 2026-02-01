const BASE = '/api';

export async function getFighter(wallet) {
  const r = await fetch(`${BASE}/fighters/${wallet}`);
  if (!r.ok) return null;
  return r.json();
}

export async function createFighter(wallet, referrer = null) {
  const r = await fetch(`${BASE}/fighters/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, referrer })
  });
  return r.json();
}

export async function listFighters(limit = 20, offset = 0) {
  const r = await fetch(`${BASE}/fighters?limit=${limit}&offset=${offset}`);
  return r.json();
}

export async function challengeBattle(challenger, defender) {
  const r = await fetch(`${BASE}/battles/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenger, defender })
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
  return r.json();
}

export async function getBattles(wallet) {
  const r = await fetch(`${BASE}/battles/${wallet}`);
  return r.json();
}

export async function getLeaderboard(sort = 'elo', limit = 50) {
  const r = await fetch(`${BASE}/leaderboard?sort=${sort}&limit=${limit}`);
  return r.json();
}

export async function getReferrals(wallet) {
  const r = await fetch(`${BASE}/referrals/${wallet}`);
  return r.json();
}

export async function getReferralLeaderboard() {
  const r = await fetch(`${BASE}/referrals/leaderboard`);
  return r.json();
}
