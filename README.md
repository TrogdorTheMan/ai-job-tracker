<!-- ai-job-tracker — AI-assisted job tracker and search tool -->
<!-- Copyright (C) 2026 Cory "TrogdorTheMan" Francis -->
<!-- Licensed under the GNU AGPLv3. See LICENSE for details. -->

# ai-job-tracker

**Fight fire with fire.** An AI-built, AI-powered job tracker and search tool. Track applications, search real listings via official APIs, score your resume against job descriptions, and draft cover letters — all on your own keys, your own storage, your own bill. Open source (AGPLv3).

> *"Screw your AI-assisted job tool that I have to pay for. I'll build my own AI-assisted job tool — with blackjack, and LinkedIn!"*
> — with apologies to Bender 🤖

---

## Status

**M4 complete.** The core tracker (M1), job search (M2), AI fit scoring (M3), and AI generation (M4) are all shipped. M5 (next-best-action, pipeline summary) is next. See [`ROADMAP.md`](ROADMAP.md) for the full plan.

---

## What it does

Most "AI job search assistants" want a monthly subscription to do things your own API key can do for pennies. This is the opposite: you own the keys, you own the data, you own the bill.

**Shipped features:**

- **Kanban + list views** — drag cards between status columns (Saved → Applied → Phone Screen → Interview → Offer), filter and sort, full pipeline history per application
- **Resume library** — store multiple named resumes (paste text or upload `.pdf`/`.docx`); each is automatically embedded for fit scoring; resumes are stored in your own Azure Table Storage
- **AI fit scoring** — paste a job description on any application and get a cosine similarity score, a plain-English summary, and a "missing from resume" gap list; displayed as a color-coded percentage on kanban cards and in the edit form
- **Per-application resume selection** — pick which resume to score against on each job; falls back to your first resume if none selected
- **Job search** — search Adzuna and USAJobs in parallel from inside the app; "Save to Tracker" pre-fills the application form; duplicate detection across sources
- **Direct URL import** — paste any job posting URL to auto-fill company, role, location, and job description text (uses schema.org `JobPosting` LD+JSON; works on Greenhouse, Lever, Workday, Indeed, and more)
- **LinkedIn data export import** — download your LinkedIn data export `.zip` (no API key needed) and import work history, skills, and education directly into the resume library
- **LinkedIn login** — optional "Sign in with LinkedIn" via OpenID Connect; requires a free LinkedIn OAuth app registration

- **Resume tailoring** — click "Suggest resume edits" on any saved application to get up to 8 AI-suggested bullet rewrites keyed to that specific job description; copy individual suggestions into your resume
- **Cover letter & outreach drafting** — one click generates a full cover letter and a short LinkedIn DM/recruiter outreach message, both tailored to the role; copy buttons on each

**Coming in M5:** Next-best-action recommendations, stale application follow-up detection, pipeline summary.

---

## The deal with keys

Everything that costs money runs on **your** keys, server-side, never in the browser. The repo ships `.env.example` and zero secrets. At this app's scale, the Azure AI Foundry cost is literally fractions of a cent per scoring action — closer to "spare change" than "subscription."

Nobody's API key is billed for your job hunt except your own.

---

## Quick start (local)

**Prerequisites:**
- [Node.js 20](https://nodejs.org/) — use [fnm](https://github.com/Schniz/fnm) to manage versions if needed
- [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local): `npm install -g azure-functions-core-tools@4`

```bash
git clone <your-fork-url> ai-job-tracker
cd ai-job-tracker
cp api/local.settings.json.example api/local.settings.json
# Optional: add keys for AI scoring and job search — or leave blank for the plain tracker
npm install && cd api && npm install && cd ..
npm run dev    # SWA + Functions + Vite → http://localhost:4280
```

The plain tracker (kanban, list, form) works with no keys at all. AI features stay dark until either `AZURE_OPENAI_ENDPOINT`/`AZURE_OPENAI_KEY` (Azure path) or `ANTHROPIC_API_KEY` (Claude path) are set. Job search connectors are each independently optional.

> **Note:** The local SWA emulator uses a mock auth system — you'll be signed in automatically. LinkedIn OAuth login is cloud-only (Azure SWA doesn't support custom OIDC providers in the emulator).

---

## Configuration

All secrets go in `api/local.settings.json` for local dev, or as **SWA Application Settings** when deployed to Azure. Leave any section blank and the matching feature simply turns off — nothing breaks.

| Variable | Feature | Notes |
|---|---|---|
| `AZURE_OPENAI_ENDPOINT` | AI fit scoring + generation | Your Azure AI Foundry endpoint URL |
| `AZURE_OPENAI_KEY` | AI fit scoring + generation | Key 1 or Key 2 from your Foundry resource |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | AI fit scoring | Deployment name; default `text-embedding-3-small` |
| `AZURE_OPENAI_CHAT_DEPLOYMENT` | AI generation (M4) | Chat model deployment name (e.g. `gpt-4o-mini`); required for resume tailoring and cover letter drafting on the Azure path. Separate from the embedding deployment. |
| `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` | Job search | Free key at [developer.adzuna.com](https://developer.adzuna.com/) |
| `USAJOBS_API_KEY` + `USAJOBS_USER_AGENT` | Job search (federal) | Free at [developer.usajobs.gov](https://developer.usajobs.gov/); user-agent must be your email |
| `ANTHROPIC_API_KEY` | AI fit scoring (Claude) | API key from [console.anthropic.com](https://console.anthropic.com); activates automatically when Azure keys are absent. **Note:** Claude Pro (claude.ai subscription) does not include API access — a separate API account with usage-based billing is required. At personal scoring scale, cost is fractions of a cent per action. |
| `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET` | LinkedIn login | Register a free OAuth app at [linkedin.com/developers](https://www.linkedin.com/developers/); data export import works without these |
| `DATA_BACKEND` | Storage | `local` (JSON file, default) or `azure-table` (cloud) |
| `AZURE_STORAGE_CONNECTION_STRING` | Storage (cloud) | Required when `DATA_BACKEND=azure-table` |

See `.env.example` for full documentation of every variable.

---

## LinkedIn data export import

No API key required. To import your LinkedIn profile:

1. On LinkedIn: **Settings → Data Privacy → Get a copy of your data → Request archive**
2. Download the `.zip` when it arrives (usually within a few minutes for a fast export)
3. In the app, go to **Profile → Import LinkedIn export (.zip)**
4. Your work history, skills, and education are parsed and pre-filled as a new resume entry — review and save

---

## LinkedIn login (optional)

LinkedIn OAuth login requires a free app registration:

1. Go to [linkedin.com/developers](https://www.linkedin.com/developers/) → **Create app**
2. Under **Products**, add **Sign In with LinkedIn using OpenID Connect**
3. Set the redirect URL to: `https://<your-swa-hostname>/.auth/login/linkedin/callback`
4. Copy **Client ID** and **Client Secret** into your SWA Application Settings as `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`

The LinkedIn login button appears automatically once the keys are configured.

---

## Trogdor's Own — Claude AI backend (optional)

By default, fit scoring uses Azure AI Foundry (embeddings + cosine similarity). If you'd rather use Claude instead — or if you don't have an Azure OpenAI account — you can swap in Anthropic's API as the AI backend. The two paths are mutually exclusive by configuration: Azure runs when `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_KEY` are set; Claude runs when those are absent and `ANTHROPIC_API_KEY` is set.

**What changes with Claude:**
- Fit scoring calls Claude directly with your resume text + the job description; no pre-computed embedding is needed
- Sonnet 4.6 and Opus 4.8 use extended thinking for richer gap analysis; Haiku 4.5 is faster and lighter
- The Profile page shows a model picker when Claude is your active backend; preference is saved in your browser and sent with each scoring request

**Setup:**
1. Get an API key at [console.anthropic.com](https://console.anthropic.com) (separate from any Claude Pro subscription)
2. Set `ANTHROPIC_API_KEY` in `api/local.settings.json` (local) or SWA Application Settings (cloud)
3. Leave `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_KEY` blank (or remove them)
4. The Profile page will show the Claude model picker once you have at least one resume saved

---

## Deploy to Azure (optional)

The app is built for [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/) with built-in auth (EasyAuth) and managed Functions. Full step-by-step deploy guide is planned for the v1.0 milestone (M6). The short version:

1. Create an Azure Static Web App and connect it to your GitHub repo
2. Set `DATA_BACKEND=azure-table` and `AZURE_STORAGE_CONNECTION_STRING` in SWA Application Settings
3. Add any other keys from the configuration table above
4. SWA handles the GitHub Actions CI/CD, auth routing, and Functions hosting automatically

---

## License

[GNU AGPLv3](LICENSE). Strong copyleft — closes the SaaS loophole so this can never be quietly turned into a closed-source paid product, not even as a hosted service. Forks stay open, forever.

Copyright © 2026 Cory Francis.

---

## Contributing

Bug reports, ideas, and pull requests welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md). Be excellent to each other. (Please do not attempt to kill all humans.)
