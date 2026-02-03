# Cloudflare Setup Guide - agent-brawl.com

## Why Cloudflare?
- Railway SSL works perfectly with Cloudflare
- Free SSL/TLS certificates
- Better DNS performance
- DDoS protection
- Easy configuration

---

## Step 1: Create Cloudflare Account & Add Domain

1. **Go to:** https://dash.cloudflare.com/sign-up
2. **Sign up** with your email
3. **Select Free Plan** ($0/month)
4. Click **"Add a site"**
5. Enter: `agent-brawl.com` (without www)
6. Click **"Add site"**
7. Choose **"Free"** plan
8. Click **"Continue"**

---

## Step 2: Get Cloudflare Nameservers

Cloudflare will scan your DNS records and show you **2 nameservers** like:

```
NAME SERVER 1: alice.ns.cloudflare.com
NAME SERVER 2: bob.ns.cloudflare.com
```

**📝 COPY THESE TWO NAMESERVERS** - You'll need them for OVH

---

## Step 3: Change Nameservers at OVH

1. **Go to:** https://www.ovh.com/manager/
2. **Login** to your OVH account
3. Click **"Web Cloud"** → **"Domain names"** → **"agent-brawl.com"**
4. Click **"DNS servers"** tab
5. Click **"Modify DNS servers"**
6. **Replace** the current OVH nameservers with Cloudflare's:
   - Delete existing DNS servers
   - Add: `alice.ns.cloudflare.com` (replace with your actual NS1)
   - Add: `bob.ns.cloudflare.com` (replace with your actual NS2)
7. Click **"Apply configuration"**
8. **Confirm** the change

**⏰ Wait time:** Nameserver propagation can take 2-24 hours (usually ~2-4 hours)

---

## Step 4: Configure DNS in Cloudflare

While waiting for nameservers to propagate, configure DNS:

1. **Go to:** Cloudflare Dashboard → agent-brawl.com → **DNS** → **Records**
2. **Delete** any imported records for `www` (if they exist)
3. Click **"Add record"**

### Add CNAME for www subdomain:

```
Type:    CNAME
Name:    www
Target:  6ofbqi84.up.railway.app
Proxy:   🔴 DNS only (grey cloud, NOT orange)
TTL:     Auto
```

**⚠️ CRITICAL:** The cloud icon must be **GREY** (DNS only), NOT orange (proxied)

4. Click **"Save"**

### Optional: Add root domain redirect (if you want agent-brawl.com → www.agent-brawl.com)

```
Type:    CNAME
Name:    @ (or agent-brawl.com)
Target:  6ofbqi84.up.railway.app
Proxy:   🔴 DNS only (grey cloud)
TTL:     Auto
```

---

## Step 5: Configure SSL/TLS Settings in Cloudflare

1. **Go to:** SSL/TLS tab (left sidebar)
2. **Set encryption mode to:** **Full**
   - ✅ Full
   - ❌ NOT "Full (Strict)"
   - ❌ NOT "Flexible"
3. Click **"SSL/TLS"** → **"Edge Certificates"**
4. **Enable:**
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites
   - ✅ Universal SSL (should be enabled by default)

---

## Step 6: Update Railway Domain (After Nameservers Propagate)

**⏰ Wait until nameservers have propagated** (check status in Cloudflare dashboard)

1. **Go to:** Railway Dashboard → Your project → Settings → Domains
2. **Remove** the old `www.agent-brawl.com` domain (if it exists)
3. Click **"+ Custom Domain"**
4. Enter: `www.agent-brawl.com`
5. Railway will verify the CNAME
6. **Wait 5-15 minutes** for SSL certificate issuance
7. Status should change to: **"✅ Setup Complete"**

---

## Step 7: Verify SSL Certificate

After Railway shows "Setup Complete":

**Test in browser:**
- https://www.agent-brawl.com
- Should show ✅ secure lock icon
- Certificate should be issued for `www.agent-brawl.com`

**Test with curl:**
```bash
curl -I https://www.agent-brawl.com
# Should return: HTTP/2 200
```

**Test certificate:**
```bash
echo | openssl s_client -servername www.agent-brawl.com -connect www.agent-brawl.com:443 2>/dev/null | openssl x509 -noout -subject
# Should return: subject=CN = www.agent-brawl.com
```

---

## Troubleshooting

### Nameserver propagation check:
```bash
dig agent-brawl.com NS +short
# Should return Cloudflare nameservers
```

### CNAME verification:
```bash
dig www.agent-brawl.com CNAME +short
# Should return: 6ofbqi84.up.railway.app.
```

### If SSL still not working after 1 hour:

1. **Check Cloudflare DNS:** Grey cloud icon (not orange) ✅
2. **Check SSL mode:** Should be "Full" (not Flexible or Full Strict)
3. **Remove & re-add domain in Railway:** Delete domain, wait 5 min, re-add
4. **Clear browser cache:** Hard refresh (Ctrl+Shift+R)
5. **Check Railway logs:** Look for SSL/certificate errors

### Common mistakes:
- ❌ Orange cloud (proxied) instead of grey (DNS only)
- ❌ SSL mode set to "Flexible" or "Full (Strict)"
- ❌ Forgot to wait for nameserver propagation
- ❌ Typo in CNAME target (must be: `6ofbqi84.up.railway.app`)

---

## Expected Timeline

- **Step 1-3:** 15 minutes (setup)
- **Step 4:** Nameserver propagation: 2-24 hours (usually 2-4h)
- **Step 5:** SSL configuration: 5 minutes
- **Step 6:** Railway SSL issuance: 5-15 minutes
- **Total:** 2-24 hours (most likely ~2-4 hours)

---

## After SSL is Active ✅

Once HTTPS works:

1. ✅ Test the site: https://www.agent-brawl.com
2. ✅ Generate Twitter visual assets with Nano Banana Pro
3. ✅ Create Twitter profile
4. ✅ Launch! 🚀

---

## Questions?

- Cloudflare Docs: https://developers.cloudflare.com/dns/
- Railway Docs: https://docs.railway.com/guides/public-networking
- Railway Help: https://station.railway.com/

---

**Current Status:**
- Domain: agent-brawl.com
- Railway CNAME target: 6ofbqi84.up.railway.app
- Goal: HTTPS on www.agent-brawl.com

**Next:** Follow Step 1 - Create Cloudflare account and add domain
