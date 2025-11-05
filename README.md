# StreamV8

Plateforme de streaming full-stack combinant une API Express sécurisée et un frontend Next.js App Router inspiré de l’expérience Netflix.

## Installation

```bash
npm install
```

## Démarrage en développement

### 1. Compiler l’API
```bash
npm run build:server
```

### 2. Lancer l’environnement
```bash
npm run dev
```

L’API Express et Next.js sont servis depuis `server.js` sur le port `3000`.

## Scripts utiles

- `npm run seed` : prépare les données JSON (utilisateurs, catalogue, séries).
- `npm run backup` : archive le dossier `data` dans `backups/backup-YYYYMMDD-HHMM.zip`.
- `npm run lint:catalog` : valide la cohérence du catalogue JSON via Zod.

## Fonctionnalités clés

- Authentification par cookie HTTP-only signé (TTL 7 jours), mot de passe bcrypt, CSRF sur mutations et audit des actions.
- Gestion catalogue JSON (films, séries, catégories) avec verrouillage de fichiers, écriture atomique et merge intelligent des épisodes.
- Frontend Next.js App Router : carrousels animés, lazy loading, bouton retour haut, mode sombre accessible et lecteur vidéo (Video.js) respectant le cycle HLS/DASH.
- Historique utilisateur et reprise de lecture synchronisés côté serveur.
- Scripts de seed/backup, validation Zod, configuration prête pour Docker Compose (volume `./data:/app/data`).

## Notes

- Configurez `API_BASE_URL`/`NEXT_PUBLIC_API_BASE_URL` si vous séparez l’API du frontend.
- Pour l’exploitation, lancez `npm run build` puis `npm run build:server` et servez via `node server.js`.
