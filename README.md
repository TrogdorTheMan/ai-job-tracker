# ai-job-tracker

**Fight fire with fire!** An AI-built, AI-powered job tracker and search tool. Track applications, find openings via official APIs, and use Azure AI Foundry for resume/JD fit scoring, tailoring, and cover letters. Bring your own keys — run locally or deploy to your own Azure Static Web App. Open source (AGPLv3).

> *"Screw your AI-assisted job tool that I have to pay for. I'll build my own AI-assisted job tool — with blackjack, and LinkedIn!"*
> — with apologies to Bender 🤖

---

## Status

**M2 complete. M3 in progress.** The core tracker (M1) and job search (M2) are done and verified in production on Azure SWA. You can add jobs, drag them through a kanban pipeline, filter and sort, search live listings via Adzuna and USAJobs, import jobs by pasting a URL, and save search results directly into the tracker with duplicate detection. Auth (EasyAuth) and Azure Table Storage are both wired up and working. Next up: AI fit scoring — resume/JD matching, gap analysis, and optional LinkedIn data-export enrichment (M3). See [`ROADMAP.md`](ROADMAP.md) for the full plan and current progress.

## What it does

The pitch is simple — most "AI job search assistants" want a monthly subscription to do things your own API key can do for pennies. This is the opposite: you own the keys, you own the data, you own the bill (which is tiny).

- **Track your applications.** Company, role, status, dates, follow-ups, notes — the whole pipeline from *saved* to *applied* to *offer* (or *ghosted*, we don't judge).
- **Search real openings.** Pulls listings from official, above-board APIs (Adzuna, USAJobs, ATS feeds) — no scraping, no fragile gray-area nonsense.
- **Let the robots help.** With your own Azure AI Foundry key: score how well your resume fits a posting, get tailoring suggestions, and draft cover letters and outreach.
- **Know what's next.** The tracker doesn't just sit there — it tells you what to follow up on and what's worth applying to next.

## The deal with keys (a.k.a. why this is free)

Everything that costs money runs on **your** keys, server-side, never in the browser. The repo ships a `.env.example` and exactly zero secrets. Clone it, drop in your own keys, and you're running on your own dime — which, for the models this uses, is closer to "spare change" than "subscription."

Translation: nobody's API key is getting billed for your job hunt except your own.

## Quick start (local)

**Prerequisites:**
- [Node.js 20](https://nodejs.org/) (Azure Functions doesn't support Node 22+ yet — use [fnm](https://github.com/Schniz/fnm) to manage versions)
- [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local): `npm install -g azure-functions-core-tools@4`

```bash
git clone <your-fork-url> ai-job-tracker
cd ai-job-tracker
cp .env.example .env                              # fill in keys, or leave blank for the plain tracker
cp api/local.settings.json.example api/local.settings.json
npm install && cd api && npm install && cd ..     # install root + API deps separately
npm run dev                                       # http://localhost:4280
```

That's it — it runs fully local, no cloud account required. The AI features stay dark until you add an Azure AI Foundry key, so the plain tracker works out of the box.

## Deploy to Azure (optional)

Built to live in an [Azure Static Web App](https://learn.microsoft.com/azure/static-web-apps/) with built-in auth (GitHub / Microsoft / Google) and Azure Functions handling the secrets. Deploy guide arrives with the v1.0 milestone. Until then, local is the path.

## Configuration

All configuration is environment variables — see `.env.example` for the full list. The short version:

| What | Needed for |
| --- | --- |
| Azure AI Foundry endpoint + key | Fit scoring, tailoring, cover letters |
| Adzuna / USAJobs keys | Job search (each optional and independent) |
| LinkedIn app key/secret | *Optional, off by default* — profile import |

Leave any of them out and the matching feature simply turns off. Nothing breaks.

## License

[GNU AGPLv3](LICENSE). Strong copyleft, and it closes the SaaS loophole — meaning this can never be quietly turned into a closed-source paid product, not even as a hosted service. Forks stay open, forever. Copyright notices ride along with the code wherever it goes.

Copyright © 2026 Cory Francis.

## Contributing

Bug reports, ideas, and pull requests welcome. Be excellent to each other. (Please do not attempt to kill all humans.)
