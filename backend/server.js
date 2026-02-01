const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const fightersRouter = require('./routes/fighters');
const battlesRouter = require('./routes/battles');
const leaderboardRouter = require('./routes/leaderboard');
const referralsRouter = require('./routes/referrals');

app.use('/api/fighters', fightersRouter);
app.use('/api/battles', battlesRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/referrals', referralsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`⚔️  Agent Brawl Backend running on port ${PORT}`);
});
