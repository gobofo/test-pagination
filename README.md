# Cahier des charges — Test technique

## 1. Contexte

L’entreprise est une **plateforme e‑commerce** (mode, accessoires, etc.) avec un **gros catalogue**. Aujourd’hui, le site charge **tout le catalogue d’un coup** : temps de chargement élevé, charge inutile côté navigateur et risque de mauvaise expérience utilisateur.

**Objectif du test :** concevoir une solution **paginée côté serveur**, avec **filtres** et **tris**, une gestion des erreurs, et une stack imposée.

---

## 2. Problème à résoudre


| Axes                        | Description                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Performance**             | Ne plus renvoyer ni afficher l’intégralité des articles en une seule requête / un seul rendu.                     |
| **Fonctionnalité**          | Permettre la navigation dans le catalogue (pagination **ou** scroll infini **ou** équivalent — libre choix d’UX). |
| **Recherche / exploration** | **Filtrer** (ex. par catégorie) et **trier** (ex. prix croissant / décroissant).                                  |
| **Fiabilité**               | Pas de crash en cas de paramètres invalides, réseau instable ou réponse vide.                                     |


---

## 3. Périmètre fonctionnel


| Exigence       | Détail                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pagination** | Stratégie au choix (pages numérotées, « charger plus », scroll infini…) **à condition** que les données soient chargées **par blocs** depuis le backend. |
| **Filtres**    | Au minimum un filtre pertinent sur le catalogue (ex. catégorie) ; possibilité d’en ajouter d’autres si le temps le permet.                               |
| **Tris**       | Au minimum un tri sur un champ numérique ou textuel (ex. **prix** asc / desc).                                                                           |


---

## 4. Contraintes techniques (obligatoires)


| Couche              | Technologie                             |
| ------------------- | --------------------------------------- |
| **Frontend**        | **React** (JavaScript ou TypeScript)    |
| **Backend**         | **Node.js** avec **Express** (JS ou TS) |
| **Base de données** | **MongoDB** — **sans Mongoose**         |


Le reste (outillage, structure des dossiers, librairies UI) est laissé au candidat, dans la mesure où les exigences ci-dessus sont respectées.

---

## 5. Livrables attendus

- API REST (ou équivalent **documenté**) exposant une **liste d’articles paginée**, avec paramètres documentés : `page`, `limit`, filtres, etc..
- Frontend connecté à cette API, avec l’UX de pagination / chargement choisie.
- Gestion des cas limites : valeurs de pagination invalides, liste vide, erreur serveur, etc...

---

## 6. Hors périmètre / libertés

- **Design graphique :** libre (sobriété suffisante pour un test).
- **Modalité d’interaction** (boutons vs scroll infini, etc.) : libre, tant que le chargement reste **incrémental côté serveur**.

---

## 7. Implémentation

### Lancer le projet

```bash
docker compose up
```

- Frontend : http://localhost:5173
- Backend  : http://localhost:3001
- MongoDB  : localhost:27018 (base `shop`, 5 000 produits seedés au démarrage)

### Stratégie de pagination

Pagination numérotée avec `skip` / `limit` côté MongoDB. Pour 5 000 documents, les performances de `skip()` sont tout à fait acceptables et la stratégie reste simple à comprendre et à maintenir. Une pagination par curseur aurait été plus efficace à très grande échelle mais inutilement complexe ici.

### Backend — `GET /api/products`

| Paramètre  | Défaut     | Comportement si invalide       |
| ---------- | ---------- | ------------------------------ |
| `page`     | `1`        | ramené à `1`                   |
| `limit`    | `10`       | ramené à `10`, max `100`       |
| `category` | (tous)     | ignoré si hors whitelist       |
| `sort`     | `createdAt`| ramené à `createdAt`           |
| `order`    | `desc`     | ramené à `desc`                |

Les paramètres invalides sont silencieusement corrigés plutôt que rejetés (pas de 400), conformément à l’exigence de fiabilité. Le `countDocuments` et le `find` sont exécutés en parallèle via `Promise.all` pour minimiser la latence.

Le contrat complet de l’API est documenté dans [`openapi.yaml`](./openapi.yaml).

### Frontend — React

- Le `useEffect` de fetch se déclenche sur `[page, limit, category, sort, order]`.
- Un second `useEffect` remet `page` à `1` dès qu’un filtre, un tri ou la taille de page change, pour éviter d’atterrir sur une page inexistante.
- Un flag `cancelled` gère les race conditions en cas de changements rapides.
- L’interface expose : filtre par catégorie, tri par date / prix / nom, sens croissant / décroissant, et un sélecteur de taille de page (10 / 25 / 50).

