# Athlete Training — Web

React + TypeScript + Vite frontend for the Athlete Training API: manage athletes, log
training sessions and track weekly training load (session RPE × duration) with spike
warnings.

## Setup

```bash
npm install
# .env
VITE_API_URL=http://localhost:3000
npm run dev       # http://localhost:5173
npm run build     # type-check + production build into dist/
npm run lint
npm run preview   # serve dist/ locally
```

## Deploying to S3 static website hosting

Upload the contents of `dist/` to the bucket and set **both** the index document and the
error document to `index.html` so client-side routes (`/athletes/:id`) resolve on refresh.

## Structure

```
src/
  api/         fetch client (ApiError, query building) + typed endpoint functions
  components/  UI primitives (Button, Modal, FormField, States…) and feature sections
  hooks/       useQuery, useDebouncedCallback, useToast, URL param helpers
  lib/         dates, formatting, validation rules, training-load maths, theme
  pages/       AthletesPage, AthleteDetailPage, NotFoundPage
```
