# 💾 Database Setup

## Current Setup: SQLite

The project uses **SQLite** (`better-sqlite3`) — a single file database at `backend/brawl.db`.

**Problem on Railway:** By default, the filesystem is **ephemeral** (resets on restart).

---

## ✅ Solution 1: Railway Volume (Recommended MVP)

**Persistent disk for SQLite** — data survives restarts.

### Setup (on Railway dashboard):

1. **Go to your service** → Variables tab
2. **Add Variable:**
   - Name: `DB_PATH`
   - Value: `/data`

3. **Create Volume:**
   - Go to **Settings** → **Volumes**
   - Click **"Add Volume"**
   - Mount Path: `/data`
   - Click **"Add"**

4. **Redeploy**
   - Railway will restart with persistent volume
   - Database now lives at `/data/brawl.db` and persists across restarts

**Cost:** $0.10/GB/month (~$0.10/month for 1GB, enough for 10k+ agents)

---

## 🔄 Solution 2: Migrate to PostgreSQL (Future-proof)

For scale (1000+ concurrent users), migrate to PostgreSQL.

### Why PostgreSQL?
- Built for concurrent writes
- Railway provides free 512MB tier
- Industry standard for production
- Better backups & replication

### Migration steps:

1. **Add PostgreSQL plugin on Railway:**
   - Dashboard → New → Database → PostgreSQL
   - Railway auto-sets `DATABASE_URL` env var

2. **Install pg driver:**
   ```bash
   cd backend && npm install pg
   ```

3. **Replace `db.js`** with PostgreSQL adapter (migration script TBD)

4. **Migrate data** (export SQLite → import PostgreSQL)

---

## 📊 When to migrate?

| Agents | Battles/day | DB Type |
|--------|-------------|---------|
| < 100 | < 1000 | SQLite + Volume ✅ |
| 100-1000 | 1k-10k | PostgreSQL recommended |
| 1000+ | 10k+ | PostgreSQL required |

---

## 🔐 Backup SQLite

### Manual backup (download from Railway):

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Download DB
railway run --service agent-brawl "cat backend/brawl.db" > backup.db
```

### Auto-backup script (cron):

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
railway run "cat backend/brawl.db" > backups/brawl-$DATE.db
# Upload to S3/Backblaze/etc
```

---

## 🧪 Test locally

```bash
# Start with custom DB path
DB_PATH=/tmp/testdb npm start

# Check DB location
ls -lh /tmp/testdb/brawl.db
```

---

**For now:** Use **Railway Volume** (step 1). Migrate to PostgreSQL when you hit 100+ active agents.
