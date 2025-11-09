# Roadmap — EUR/USD Converter

## M1 — Robustesse (S)
- [ ] CI GitHub Actions: lint + tests + build.
- [ ] Tests unitaires et d’intégration (front).
- [ ] Gestion d’erreurs réseau (retry/backoff, bannière d’alerte).
- [ ] CORS restrictif si backend externe.

## M2 — UX & a11y (M)
- [ ] Formatage multi-locale (FR/EN) pour entrées/sorties.
- [ ] Thème clair/sombre, responsive mobile first.
- [ ] Raccourcis clavier (↑↓ pour switch, Enter = calcul).
- [ ] Aides contextuelles (hint sur taux fixe et auto-off 2%).

## M3 — Fonctionnel (M)
- [ ] Multi-devises (sélecteur : EUR/USD, GBP/USD, etc.).
- [ ] Historique persistant + export CSV.
- [ ] Graph live avec fenêtre glissante (1/5/15 min).

## M4 — Observabilité & déploiement (L)
- [ ] Logs structurés + métriques (front/back).
- [ ] Back FastAPI déployé (Render/Fly) + healthchecks.
- [ ] CDN sur le front (Pages + cache headers).
