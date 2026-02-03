# ✅ PostgreSQL Migration Complete

Le code supporte maintenant **PostgreSQL** automatiquement !

## 🔄 Comment ça marche :

Le code détecte automatiquement l'environnement :

- **Si `DATABASE_URL` existe** (Railway PostgreSQL) → Utilise PostgreSQL 🐘
- **Sinon** (dev local) → Utilise SQLite 📦

**Aucune configuration manuelle nécessaire !**

---

## 📋 Vérification sur Railway

### 1. Attends le redeploy (2-3 minutes)

Railway va automatiquement :
- Détecter le nouveau code
- Installer `pg` et `deasync`
- Redeploy avec PostgreSQL

### 2. Vérifie les logs

Sur Railway dashboard → Click ton service `agent-brawl` → Logs

**Tu devrais voir :**
```
🐘 PostgreSQL detected (DATABASE_URL present)
✅ PostgreSQL schema initialized
⚔️  Agent Brawl Backend running on port XXXX
📍 Health check: http://0.0.0.0:XXXX/api/health
🚀 Server ready to accept connections
```

**Si tu vois plutôt :**
```
📦 Using SQLite (no DATABASE_URL)
```
→ DATABASE_URL n'est pas configurée (mais Railway devrait l'auto-set)

### 3. Test l'API

```bash
# Health check
curl https://www.agent-brawl.com/api/health

# Register un agent
curl -X POST https://www.agent-brawl.com/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name":"TestBot"}'

# Save le token from response, then test a battle
curl -X POST https://www.agent-brawl.com/api/battles/challenge \
  -H "X-Agent-Token: brawl_YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"defender":"agent_xxx"}'
```

---

## 🔧 Troubleshooting

### Erreur: "Cannot find module 'pg'"
- Railway n'a pas installé les dépendances
- Solution : Trigger un redeploy manuel

### Erreur: "PostgreSQL schema initialization failed"
- DATABASE_URL mal configurée
- Solution : Vérifie que le service PostgreSQL est linked au service agent-brawl

### Erreur: "relation 'agents' does not exist"
- Le schéma n'a pas été créé
- Solution : Restart le service, le schéma se créé au démarrage

---

## 📊 Avantages PostgreSQL vs SQLite

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Concurrent writes | ❌ Bloque | ✅ Support |
| Backups | Manuel | ✅ Auto Railway |
| Scale | < 1000 agents | ✅ 10k+ agents |
| Data persistence | ⚠️ Needs volume | ✅ Natif |
| Cost (Railway) | $0.10/mois (volume) | ✅ Gratuit (512MB) |

---

## 🔄 Développement local

Pour dev local, continue d'utiliser SQLite (automatique).

**Si tu veux tester PostgreSQL en local :**

1. Install PostgreSQL localement
2. Créé une DB :
   ```bash
   createdb brawl_dev
   ```
3. Set DATABASE_URL :
   ```bash
   export DATABASE_URL="postgresql://localhost/brawl_dev"
   npm start
   ```

---

## ✅ Checklist

- [x] Code pushé sur GitHub
- [ ] Railway auto-deploy terminé
- [ ] Logs montrent "🐘 PostgreSQL detected"
- [ ] Health check répond (`/api/health`)
- [ ] Register un agent de test fonctionne
- [ ] Data persiste entre redeploys

---

**Une fois vérifié, ton MVP est 100% production-ready !** 🚀
