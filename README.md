# Market Research Analysis — frontend

Web UI for the Market Research Analysis API (`../Market_Research_Analysis`).
Write a project brief, watch the agents work, review the findings, approve or
send parts back, and export the feasibility report.

Built with Next.js (App Router), React and TypeScript.

## Run it

1. By default the frontend uses the hosted API at
   `https://market-analysis.pflabs.in`. To use a local API instead, start it
   (in `../Market_Research_Analysis`) with `uv run python main.py` and set
   `API_TARGET=http://127.0.0.1:8001` in `.env`.

2. Get an API key. Either create one:

   ```
   uv run python -m src.service.admin create-key --user you --tenant acme --role analyst
   ```

   or, for local development only, start the API with `AUTH_DISABLED=1` and
   leave the key empty.

3. Start the frontend (in this folder):

   ```
   npm install
   npm run dev
   ```

   Open http://localhost:3000 and paste the key when asked. For a production
   build: `npm run build`, then `npm start`.

## What each role can do here

| Role | In the UI |
| --- | --- |
| `viewer` | Open analyses and documents, export reports |
| `analyst` | Also check a brief, start, review and resume analyses, upload and delete documents |
| `admin` | Also delete analyses and open "Usage and audit" |

The API does not say which role a key has, so every button is shown and the
API's refusal is displayed if the key's role is too low.

## Screens

- **New analysis.** The brief form. "Check brief" calls `POST /intake` and
  shows which fields are empty plus clarifying questions; answers are sent in
  the brief's `clarifications`.
- **Analysis.** Polls `GET /analyses/{id}` every 3 seconds while the run is
  running and shows which agents have finished. When the run is awaiting
  review, a panel offers Approve or Send back (per-section comments and edited
  financial inputs). Tabs: Overview (recommendation, executive summary,
  scorecard), Financials, Risks, Sections (analysis and checked evidence per
  agent) and Details (brief, evidence quality, usage).
- **Internal documents.** Upload, list and delete the documents agents search.
- **Usage and audit.** Monthly usage and the audit log (admin keys).

The open view is kept in the URL (`?run=<id>`, `?view=documents`), so a reload
or a shared link reopens it.

## How it talks to the API

The browser calls `/api/*` on its own origin and the Next.js server forwards
those requests to the API (the rewrite in `next.config.ts`). The FastAPI app
has no CORS middleware, so this is what makes the calls work without touching
the backend.

| Setting | Where | Default | Purpose |
| --- | --- | --- | --- |
| `API_TARGET` | `.env` | `https://market-analysis.pflabs.in` | Where the Next.js server forwards `/api` (set `http://127.0.0.1:8001` for a local API) |
| `NEXT_PUBLIC_API_BASE_URL` | `.env` | unset | Call the API directly from the browser instead (needs CORS on the API) |

Both are read at build time by `next build`, so rebuild after changing them.

Two Next.js proxy defaults are raised in `next.config.ts`:

- `proxyTimeout` (30 s by default) is 5 minutes, because the brief check is an
  LLM call.
- `proxyClientMaxBodySize` (10 MB by default) is 25 MB. With the default, an
  upload over 10 MB is cut short and hangs; the API accepts 20 MB.

If you host this behind another proxy, its own limits apply too.

## Things to know

- The API key is stored in this browser's `localStorage` and sent as
  `Authorization: Bearer <key>`. Anyone with access to the browser profile can
  read it.
- `GET /analyses` does not return the project text, so the list shows a title
  only for analyses this browser has started or opened; others appear as
  "Analysis <id>" until opened.
- The score thresholds drawn on the scorecard bar (40 and 65) are copied from
  the backend's `src/scoring.py`. Change them in `src/components/Overview.tsx`
  if you tune them there.
- Agent-written analysis text is rendered as Markdown; raw HTML in it is not
  rendered.

## Layout

```
next.config.ts    /api rewrite to the FastAPI app, proxy limits
src/
  app/            layout, page, global styles, icon
  App.tsx         client shell: views, API key, list of analyses
  api.ts          types mirroring the backend models, and every API call
  labels.ts       display names for sections, statuses, model inputs
  progress.ts     turns a run's finished graph nodes into the stages shown
  format.ts       number and date formatting
  components/     BriefForm, RunView and its tabs, ReviewPanel, DocumentsView, AdminView
```
