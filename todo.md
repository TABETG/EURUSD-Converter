# TODO — EUR/USD Converter

## Raccourcis pris (time-box)
- Pas de persistance de l’historique (mémoire volatile côté front).
- Pas d’auth ni de cache applicatif.
- Gestion d’erreurs réseau minimale (fallback → random-walk local).
- Formatage devise simple (pas d’i18n complet).
- Peu/pas de tests (unitaires/E2E).
- Styles en CSS léger, pas de design system complet.

## Améliorations immédiates
- [ ] Tests unitaires (conversion, switch continuité, auto-off > 2%).
- [ ] Tests d’intégration (polling API, fallback local).
- [ ] i18n + formatage local (Intl.NumberFormat, séparateur ,/.).
- [ ] Accessibilité (labels, focus ring, contrastes WCAG).
- [ ] États d’erreur UX (toast quand l’API tombe, bannière info).
- [ ] Rounding cohérent (banker/half-up) + nombre de décimales configurable.

## Dette technique
- [ ] Factoriser composants (Input, Badge, Table).
- [ ] ESLint/Prettier strict + hooks rules (exhaustive-deps).
- [ ] Découpler logique de conversion dans un service pur testable.
- [ ] CI: lint + tests + build sur PR.

## Idées rapides
- [ ] Sauvegarder l’historique (localStorage).
- [ ] Courbe du taux en temps réel (Recharts).
- [ ] PWA (offline + install
