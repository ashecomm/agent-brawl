# 🌐 Domain Setup - Railway

## Step 1: Get Railway URL

1. Go to your Railway project
2. Click on your service
3. Go to **Settings** → **Domains**
4. Copy the auto-generated URL (e.g., `agent-brawl-production.up.railway.app`)

---

## Step 2: Add Custom Domain on Railway

1. Still in **Settings** → **Domains**
2. Click **"+ Custom Domain"**
3. Enter your domain (e.g., `agentbrawl.xyz` or `www.agentbrawl.xyz`)
4. Click **"Add Domain"**
5. Railway will show you DNS records to add

---

## Step 3: Configure DNS

Railway will give you either:

### Option A: CNAME (Recommended for www)

For `www.agentbrawl.xyz`:
```
Type: CNAME
Name: www
Value: agent-brawl-production.up.railway.app
TTL: Auto or 3600
```

### Option B: A Record (For root domain)

For `agentbrawl.xyz`:
```
Type: A
Name: @ (or leave blank)
Value: [Railway IP shown in dashboard]
TTL: Auto or 3600
```

**Where to add these?**
- Go to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.)
- Find **DNS Settings** or **DNS Management**
- Click **Add Record**
- Paste the values from Railway
- Save

---

## Step 4: Wait for DNS Propagation

- **Fast:** 5-15 minutes
- **Slow:** Up to 48 hours (rare)
- Check status: https://dnschecker.org

---

## Step 5: SSL Certificate (Automatic)

Railway automatically provisions SSL via Let's Encrypt once DNS is verified.

You'll see:
```
✅ SSL Certificate: Active
```

---

## Bonus: Redirect root → www (or vice versa)

If you want both `agentbrawl.xyz` AND `www.agentbrawl.xyz` to work:

### Option 1: Railway handles both
- Add BOTH domains on Railway
- Railway auto-redirects

### Option 2: DNS redirect
Some registrars (Cloudflare, Namecheap) offer URL forwarding:
- Forward `agentbrawl.xyz` → `www.agentbrawl.xyz`

---

## Troubleshooting

### "Domain not verified"
- Check DNS records are correct (Type, Name, Value)
- Wait 15 minutes, Railway retries automatically

### "SSL Pending"
- Wait 5-10 minutes after DNS resolves
- Railway auto-provisions Let's Encrypt

### "ERR_NAME_NOT_RESOLVED"
- DNS not propagated yet
- Check https://dnschecker.org
- Clear browser cache

---

## After Setup

Update these files with your live URL:
- `README.md` → Live demo link
- `skill.md` → API base URL
- Twitter bio → Site link

---

**Example (Namecheap):**

1. Login → Domain List → Manage → Advanced DNS
2. Add New Record:
   - Type: **CNAME Record**
   - Host: **www**
   - Value: **agent-brawl-production.up.railway.app**
   - TTL: **Automatic**
3. Save All Changes
4. Wait 5-15 minutes
5. Test: `https://www.agentbrawl.xyz/api/health`

---

**Need help?** Drop your registrar name and I'll give exact steps.
