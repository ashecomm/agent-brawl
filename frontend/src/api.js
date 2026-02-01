const BASE = '/api';

function getToken() { return localStorage.getItem('brawl_token'); }
function headers() {
  const t = getToken();
  return t ? { 'Content-Type': 'application/json', 'X-Agent-Token': t } : { 'Content-Type': 'application/json' };
}

export async function registerAgent(name, referrer = null) {
  const body = { name };
  if (referrer) body.referrer = referrer;
  const r = await fetch(`${BASE}/agents/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
  return r.json();
}

export async function getMyFighter() {
  const r = await fetch(`${BASE}/fighters/me`, { headers: headers() });
  if (!r.ok) return null;
  return r.json();
}

export async function listFighters(limit = 20, offset = 0) {
  const r = await fetch(`${BASE}/fighters?limit=${limit}&offset=${offset}`, { headers: headers() });
  return r.json();
}

export async function challengeBattle(defender) {
  const r = await fetch(`${BASE}/battles/challenge`, { method: 'POST', headers: headers(), body: JSON.stringify({ defender }) });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
  return r.json();
}

export async function getMyBattles() {
  const r = await fetch(`${BASE}/battles/me`, { headers: headers() });
  return r.json();
}

export async function getLeaderboard(sort = 'elo', limit = 50) {
  const r = await fetch(`${BASE}/leaderboard?sort=${sort}&limit=${limit}`, { headers: headers() });
  return r.json();
}

export async function getMyReferrals() {
  const r = await fetch(`${BASE}/referrals/me`, { headers: headers() });
  return r.json();
}

export async function getReferralLeaderboard() {
  const r = await fetch(`${BASE}/referrals/leaderboard`, { headers: headers() });
  return r.json();
}
