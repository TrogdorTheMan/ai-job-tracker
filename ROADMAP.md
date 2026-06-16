# AI-Assisted Job Tracker & Search — Roadmap

**License:** **AGPLv3** (strong copyleft + closes the SaaS/hosting loophole so it can never be made closed source, even as a hosted service) · **Hosting target:** Azure Static Web Apps (like newsite.seafairpirates.org) · **Also runs:** fully local
**Data model:** ✅ **Bring-your-own-keys, local-first** (locked) — one codebase runs locally or on the deployer's own SWA; no shared/hosted instance.
**Guiding principle:** *Keys are config, not code.* Ship source freely; every deployer brings their own keys.

> *"Screw your AI-assisted job tool I have to pay for. I'll build my own AI-assisted job tool — with blackjack, and LinkedIn!"* — with apologies to Bender 🤖

---

## 1. Architecture at a glance

| Layer | Choice | Why |
|---|---|---|
| Frontend | Static SPA (Vite + React or Svelte) on **Azure SWA** | Matches your existing SWA workflow; free tier |
| API / backend | **Azure Functions** (SWA-managed) | Keeps all secrets + AI calls server-side, never in the browser |
| Auth | **SWA built-in auth (EasyAuth)** — GitHub / Microsoft / Google | Zero custom auth code, zero cost |
| AI | **Azure OpenAI** — `gpt-4o-mini` (generation) + `text-embedding-3-small` (scoring) | Cheapest capable models; BYO endpoint + key |
| Storage | **Local:** SQLite/JSON · **Cloud:** Azure Table Storage or Cosmos serverless (free tier) | Cheapest path that works both ways |
| Job sources | Official APIs only: **Adzuna, USAJobs, Greenhouse/Lever ATS feeds** | Free, within ToS, no scraping fragility |
| Profile | **LinkedIn — optional, off by default**, feature-flagged behind user-supplied LinkedIn app key/secret; plus user data-export import | Official + ToS-safe; **no scraping**; core never depends on it |
| Secrets | `.env` (local) / SWA app settings / optional Key Vault (cloud) | Committed file is `.env.example` only |

**Cost-minimization rules baked in:** small models by default; cache embeddings so a resume/JD is only embedded once; AI features are opt-in per-action (no background token burn); free-tier storage and auth.

---

## 2. Milestones

### M0 — Foundations *(scaffolding, ~week 1)*
Repo + license + the "two ways to run" skeleton.
- **AGPLv3 `LICENSE`** + `NOTICE`/`AUTHORS` file + a copyright header in each source file — this is what carries your attribution forward into every fork (the legal trail, independent of GitHub's UI)
- `README`, `CONTRIBUTING`, `.env.example`, `.gitignore` (excludes all secrets)
- `.claude/settings.json` with `"includeCoAuthoredBy": false` so commits stay authored solely under the maintainer's identity (clean history, no AI co-author trailer)
- SWA + Functions project scaffold; `npm run dev` runs end-to-end locally
- CI (GitHub Actions): lint + build + SWA preview deploy
- **Done when:** a stranger can clone, copy `.env.example` → `.env`, add nothing, and get a blank app running locally.

### M1 — Core tracker *(the product is useful even with zero AI)*
A solid manual job tracker.
- Auth wired via EasyAuth; per-user data isolation
- CRUD for applications with full pipeline state: company, role, link, status (saved → applied → interview → offer/rejected/ghosted), applied date, follow-up date, next action, contacts, notes — the structured fields the AI assistant (M5) later reasons over
- Storage abstraction with two adapters (local file/SQLite + Azure Table) behind one interface
- Board/list view with filter + sort; timeline of status changes per application
- **Done when:** you can track a real job hunt — what you applied to, when, where it stands, and what's next — without touching any AI or external API.

### M2 — Job aggregation *(official APIs)*
Search real listings inside the app.
- Connector interface + first connectors: Adzuna, USAJobs (both free keys)
- Search UI (keywords, location, remote); one-click "save to tracker"
- Dedup + rate-limit handling; graceful degradation if a connector key is missing
- **Done when:** a user with their own Adzuna/USAJobs key can search and save jobs; app still works for users who configure neither.

### M3 — AI fit scoring *(first Azure AI feature)*
Resume ↔ job-description matching, with an optional LinkedIn-enriched profile.
- Resume upload/paste → stored + embedded once (cached)
- **LinkedIn profile import — optional, OFF by default, feature-flagged:** the entire feature stays dark unless a deployer provides their own LinkedIn app key/secret (the maintainer's own instance leaves it unset). When enabled: "Sign in with LinkedIn" (OpenID) pulls the basic profile; user can also drop in their official LinkedIn data export (`.zip`) for full work history. The AI then references this profile alongside the resume for richer fit scoring and, later, tailoring (M4) and assistant context (M5). **Strictly official APIs / user-provided exports — no scraping.** Implementation rule: the LinkedIn module is isolated behind the feature flag so the core app builds, runs, and passes tests with zero LinkedIn config; the data-export import works even when the API integration is disabled.
- Embed saved JDs; cosine-similarity fit score + ranked list
- Gap highlights: keywords/skills in the JD missing from the resume
- **Done when:** saved jobs show a fit score and a "what's missing" summary, with embeddings cached (no re-embedding on reload).

### M4 — AI generation *(the differentiators)*
- **Resume tailoring:** per-posting bullet/keyword edit suggestions (diff view, user approves)
- **Cover letter / outreach drafting:** tailored letter + recruiter message from profile + JD
- Token-cost guardrails: per-action confirmation, model + max-tokens configurable
- **Done when:** from a saved job, a user can generate tailored resume edits and a cover letter in a couple of clicks.

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
- 🎰 **Easter egg — Blackjack pop-out:** a tiny, self-contained, client-side blackjack game (no AI, no network, zero cost) behind a hidden trigger. Pure homage to Bender. Ships in the static bundle; never touches a key.
- **Done when:** tagged `v1.0.0`, README walks a newcomer from clone → running in <15 min.

### M7+ — Stretch
More connectors (Lever/Greenhouse boards, Jooble), application Q&A autofill, analytics dashboard, scheduled "new matches" digest email, browser extension to capture postings.

---

## 3. Sequencing logic
Each milestone ships something usable on its own: M1 is a working tracker, M2 adds search, M3–M5 layer AI on top. That keeps the repo demo-able at every stage and lets contributors land work without waiting on the AI layer. AI is deliberately additive so the non-AI core stays runnable by anyone, even without an Azure OpenAI key. The application-tracking *data* lands early (M1) so it's useful immediately; the AI *intelligence* over that data (next-actions, follow-ups, pipeline summary) comes in M5, once fit scores and generation exist to draw on.

## 4. Open decisions to revisit later
- Frontend framework (React vs Svelte) — pick at M0.
- Cloud store: Azure Table (cheapest) vs Cosmos serverless (richer queries) — decide at M1 based on query needs.
- Whether resume files are stored at rest or kept ephemeral/client-side — privacy call at M3.
