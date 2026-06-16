<!-- ai-job-tracker — AI-assisted job tracker and search tool -->
<!-- Copyright (C) 2026 Cory "TrogdorTheMan" Francis -->
<!-- Licensed under the GNU AGPLv3. See LICENSE for details. -->

# AI-Assisted Job Tracker & Search — Roadmap

**License:** **AGPLv3** (strong copyleft + closes the SaaS/hosting loophole so it can never be made closed source, even as a hosted service) · **Hosting target:** Azure Static Web Apps · **Also runs:** fully local
**Data model:** ✅ **Bring-your-own-keys, local-first** (locked) — one codebase runs locally or on the deployer's own SWA; no shared/hosted instance.
**Guiding principle:** *Keys are config, not code.* Ship source freely; every deployer brings their own keys.

> *"Screw your AI-assisted job tool I have to pay for. I'll build my own AI-assisted job tool — with blackjack, and LinkedIn!"* — with apologies to Bender 🤖

---

## 1. Architecture at a glance

| Layer | Choice | Why |
|---|---|---|
| Frontend | Static SPA (Vite + **React**) on **Azure SWA** | Matches your existing SWA workflow; free tier |
| API / backend | **Azure Functions** (SWA-managed) | Keeps all secrets + AI calls server-side, never in the browser |
| Auth | **SWA built-in auth (EasyAuth)** — GitHub / Microsoft / Google | Zero custom auth code, zero cost |
| AI | **Azure AI Foundry** — `gpt-4o-mini` (generation) + `text-embedding-3-small` (scoring) | Cheapest capable models; BYO endpoint + key |
| Storage | **Local:** SQLite/JSON · **Cloud:** Azure Table Storage or Cosmos serverless (free tier) | Cheapest path that works both ways |
| Job sources | Official APIs only: **Adzuna, USAJobs, Greenhouse/Lever ATS feeds** | Free, within ToS, no scraping fragility |
| Profile | **LinkedIn — optional:** free OpenID login (basic profile) + user's own data-export `.zip` (full work history). No API key required for core value; OAuth login feature-flagged for deployers who register a free OAuth app | Official + ToS-safe; **no scraping**; core never depends on it |
| Secrets | `.env` (local) / SWA app settings / optional Key Vault (cloud) | Committed file is `.env.example` only |

**Cost-minimization rules baked in:** small models by default; cache embeddings so a resume/JD is only embedded once; AI features are opt-in per-action (no background token burn); free-tier storage and auth.

---

## 2. Milestones

### M0 — Foundations ✅ *(complete)*
Repo + license + the "two ways to run" skeleton.
- **AGPLv3 `LICENSE`** + `NOTICE`/`AUTHORS` file + a copyright header in each source file — this is what carries your attribution forward into every fork (the legal trail, independent of GitHub's UI)
- `README`, `CONTRIBUTING`, `.env.example`, `.gitignore` (excludes all secrets)
- `.claude/settings.json` with `"includeCoAuthoredBy": false` so commits stay authored solely under the maintainer's identity (clean history, no AI co-author trailer)
- SWA + Functions project scaffold; `npm run dev` runs end-to-end locally
- CI (GitHub Actions): lint + build + SWA preview deploy
- **Done when:** a stranger can clone, copy `.env.example` → `.env`, add nothing, and get a blank app running locally.

### M1 — Core tracker ✅ *(complete)*
A solid manual job tracker.
- ✅ Auth wired via EasyAuth; per-user data isolation
- ✅ CRUD for applications with full pipeline state: company, role, link, status (saved → applied → interview → offer/rejected/ghosted), applied date, follow-up date, next action, contacts, notes — the structured fields the AI assistant (M5) later reasons over
- ✅ Storage abstraction with two adapters (local JSON + Azure Table) behind one interface — verified in production
- ✅ Board (kanban) and list views
- ✅ **Drag-and-drop kanban:** cards draggable between status columns to update status without opening the edit form
- ✅ Filter + sort on board/list; timeline of status changes per application
- **Done when:** you can track a real job hunt — what you applied to, when, where it stands, and what's next — without touching any AI or external API.

### M2 — Job aggregation ✅ *(complete)*
Search real listings inside the app.
- ✅ Connector interface with Adzuna and USAJobs adapters (both free keys); graceful degradation when keys are absent — each connector is independently optional
- ✅ `GET /api/search` fan-out endpoint: queries all available connectors in parallel via `Promise.allSettled`, deduplicates results by URL, sorts by post date, caps at 50 results; returns per-source status metadata
- ✅ Search UI (`/search`): keywords, location, remote-only filter; source status strip shows result counts or unavailability reason per connector (notes USAJobs = federal jobs only)
- ✅ **"Save to Tracker"** on a search result opens the New Application form pre-filled (company, role, URL, location, remote) via React Router state — user reviews and saves
- ✅ **Duplicate detection:** "Already in tracker" badge on search results whose URL matches an existing application
- ✅ **Direct URL import:** paste any job posting URL at the top of the New Application form → server fetches the page, parses schema.org `JobPosting` LD+JSON first (works on Greenhouse, Lever, Workday, Indeed, etc.), falls back to heuristic HTML extraction; SSRF-protected; handles 403s with a user-friendly message
- ✅ **Kanban board improvements:** fluid equal-width columns that fill the viewport at any window size with no horizontal scroll; company and role titles line-clamped; location/date truncated
- **Done when:** a user with their own Adzuna/USAJobs key can search and save jobs; a user with no keys can still paste a URL and save it; app still works for users who configure neither. ✅ Verified in production on Azure SWA.

### M3 — AI fit scoring ✅ *(complete)*
Resume ↔ job-description matching, with an optional LinkedIn-enriched profile.
- ✅ Resume upload/paste → stored at rest in Azure Table (per-user, BYO storage) + embedded once via `text-embedding-3-small` (cached); no re-embed on reload
- ✅ `GET/PUT /api/profile` — stores `resumeText` + `resumeEmbedding` (vector cached, never sent to client); graceful no-op if Azure OpenAI keys absent
- ✅ JD embedding on application save — if AI keys present + JD text present + resume embedding cached → compute cosine similarity + gap extraction inline; stored on the application record
- ✅ `fitScore`, `fitSummary`, `fitGaps` displayed: kanban cards (colored %, green/amber), list view (Fit column), and application edit form (score + gap chips)
- ✅ `/profile` page — resume paste area, embedded status badge, last-saved timestamp; nav link in header
- ✅ Graceful degradation — no AI keys → no scores, everything else works normally
- ✅ New env vars documented: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`, `AZURE_OPENAI_EMBEDDING_DEPLOYMENT`
- ✅ **Resume file upload:** accept `.pdf` and `.docx` uploads; parse text server-side and feed into the same embed + store flow
- ✅ **Named resume library:** multiple resumes per user, each with a name, file upload, and independent embedding; per-application resume selection for fit scoring; scoring falls back to first resume if none selected
- ✅ **LinkedIn profile enrichment — optional, no API key required:**
  - **Data export import:** user downloads their own `.zip` from LinkedIn (Settings → Data Privacy → Get a copy of your data) and drops it in the app. Parses Positions, Skills, Education, and Profile CSVs server-side; creates a named resume entry pre-filled with formatted work history. No key, no scraping, fully ToS-compliant.
  - **"Sign in with LinkedIn" (OpenID):** standard OAuth login using LinkedIn's free basic profile scope — requires a free LinkedIn OAuth app registration. Configured as a custom OIDC provider in Azure SWA EasyAuth; cloud-only (SWA emulator does not support custom OIDC). Feature-flagged via `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` SWA app settings.
- **Done when:** LinkedIn enrichment shipped + saved jobs show a fit score and a "what's missing" summary, with embeddings cached (no re-embedding on reload). ✅ Complete.

### M4 — AI generation ✅ *(complete)*
- ✅ **Resume tailoring:** per-posting bullet/keyword edit suggestions shown inline; copy individual suggestions; works on both Azure (chat deployment) and Claude paths
- ✅ **Cover letter / outreach drafting:** tailored cover letter + LinkedIn DM drafted in one call; copy buttons on each; inline reveal with token-cost confirmation before generating
- ✅ Token-cost guardrails: per-action confirmation strip showing estimated token count and cost before generation fires
- ✅ Dual-provider: Azure Chat Completions path (`AZURE_OPENAI_CHAT_DEPLOYMENT`) or Claude path (`ANTHROPIC_API_KEY`), same auto-fallthrough pattern as M3 scoring
- **Done when:** from a saved job, a user can generate tailored resume edits and a cover letter in a couple of clicks. ✅ Complete.

### M5 — AI application assistant *(intelligence over the pipeline)*
Turns the tracker from a passive log into something that tells you what to do next. Reads the structured pipeline data from M1 (and fit scores from M3) — no scraping, no background token burn.
- **Next-best-action:** ranked "what to apply to / follow up on next," weighted by fit score, deadline, and how long an app has sat in a state
- **Stale & follow-up detection:** flags applications with no movement, suggests follow-up timing, drafts the follow-up message (reuses M4 generation)
- **Pipeline summary:** plain-language status of the whole hunt ("3 awaiting response >2 weeks, 2 interviews this week, 4 strong-fit saved but not applied")
- **Optional digest:** on-demand (or scheduled, for self-hosters) "here's your week" rundown
- **Done when:** opening the app surfaces a prioritized, explained to-do list and a one-glance pipeline summary, all from local data + the user's own key.

### M6 — Polish & v1.0 release
- "Deploy to Azure" button + one-page deploy guide; verified clean local-only path
- Docs: getting keys (Azure OpenAI, Adzuna, USAJobs), cost expectations, troubleshooting
- Accessibility/responsive pass; error states; empty states
- **Trogdor's Own — Claude AI backend:** alternative fit-scoring path using Anthropic's API (Haiku / Sonnet / Opus) activated by setting `ANTHROPIC_API_KEY` when Azure OpenAI keys are absent; user-selectable model on Profile page; Sonnet 4.6 default with extended thinking; no embeddings required; Azure path completely unchanged
- **Done when:** tagged `v1.0.0`, README walks a newcomer from clone → running in <15 min.

### M7+ — Stretch
More connectors (Lever/Greenhouse boards, Jooble), application Q&A autofill, analytics dashboard, scheduled "new matches" digest email, browser extension to capture postings. **Custom job board sources:** let a user register an RSS feed or structured listing URL (e.g. a company careers page that publishes a feed) as a named source so it shows up alongside the built-in connectors in search. **Embedding model upgrade:** swap `text-embedding-3-small` for `text-embedding-3-large` via a single deployment name config change — improves semantic scoring quality at ~6× the token cost (still negligible at personal/small-team scale; ~$0.04 vs $0.006 per 1M tokens).

---

## 3. Sequencing logic
Each milestone ships something usable on its own: M1 is a working tracker, M2 adds search, M3–M5 layer AI on top. That keeps the repo demo-able at every stage and lets contributors land work without waiting on the AI layer. AI is deliberately additive so the non-AI core stays runnable by anyone, even without an Azure OpenAI key. The application-tracking *data* lands early (M1) so it's useful immediately; the AI *intelligence* over that data (next-actions, follow-ups, pipeline summary) comes in M5, once fit scores and generation exist to draw on.

## 4. Open decisions to revisit later
- Frontend framework: **React** (decided at M0).
- Cloud store: Azure Table (cheapest) vs Cosmos serverless (richer queries) — decide at M1 based on query needs.
- Whether resume files are stored at rest or kept ephemeral/client-side — privacy call at M3.
