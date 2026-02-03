# 🔍 Railway Debug Checklist

## Healthcheck failing? Follow these steps:

### 1. View Deployment Logs

On Railway dashboard:
- Click on the **failed deployment**
- Click **"View logs"**
- Look for errors in the logs

**Common errors:**
- `Cannot find module '...'` → Missing npm install
- `ENOENT: no such file or directory` → Wrong path
- `Error: listen EADDRINUSE` → Port already in use
- Database errors → SQLite permissions issue

---

### 2. Check Server Startup

The logs should show:
```
⚔️  Agent Brawl Backend running on port XXXX
```

If you **don't see this line**, the server crashed during startup.

---

### 3. Test Healthcheck Manually

Once deployed, test the endpoint:
```bash
curl https://your-railway-url.railway.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-02-03T..."}
```

---

### 4. Common Fixes

#### Fix 1: PORT not set correctly
Railway uses `PORT` env var. Check `backend/server.js`:
```javascript
const PORT = process.env.PORT || 3001;
```

#### Fix 2: Healthcheck timeout too short
Railway default: 300s. May need to increase in Settings.

#### Fix 3: Frontend build blocking startup
If frontend build fails, backend won't serve static files but should still start.

#### Fix 4: SQLite permissions
If database can't write, server may crash. Check logs for:
```
Error: SQLITE_CANTOPEN: unable to open database file
```

Solution: Ensure `/data` volume is mounted (see DATABASE.md)

---

### 5. Disable Healthcheck Temporarily

To test if server runs without healthcheck:

Edit `railway.toml`:
```toml
[deploy]
startCommand = "node backend/server.js"
# healthcheckPath = "/api/health"  # Comment out
restartPolicyType = "on_failure"
```

Push changes, redeploy. If it works, healthcheck was timing out.

---

### 6. Check Environment Variables

Required variables:
- `PORT` → auto-set by Railway
- `DB_PATH` → `/data` (if using volume)

Optional:
- `NODE_ENV` → `production`

---

## Copy-paste this command for logs:

**If you have Railway CLI installed:**
```bash
railway logs --service agent-brawl
```

---

**Still stuck?** Share the logs from "View logs" button and I'll diagnose.
