# ai-job-tracker

**Fight fire with fire!** An AI-built, AI-powered job tracker and search tool. Track applications, find openings via official APIs, and use Azure OpenAI for resume/JD fit scoring, tailoring, and cover letters. Bring your own keys — run locally or deploy to your own Azure Static Web App. Open source (AGPLv3).

> *"Screw your AI-assisted job tool that I have to pay for. I'll build my own AI-assisted job tool — with blackjack, and LinkedIn!"*
> — with apologies to Bender 🤖

---

## Status

Early days. The skeleton is going up and milestones are landing one at a time (see [`ROADMAP.md`](ROADMAP.md) for the plan). The honest version: this is a work in progress, not a finished product. Star it, watch it, or come back when there's more to see.

## What it does

The pitch is simple — most "AI job search assistants" want a monthly subscription to do things your own API key can do for pennies. This is the opposite: you own the keys, you own the data, you own the bill (which is tiny).

- **Track your applications.** Company, role, status, dates, follow-ups, notes — the whole pipeline from *saved* to *applied* to *offer* (or *ghosted*, we don't judge).
- **Search real openings.** Pulls listings from official, above-board APIs (Adzuna, USAJobs, ATS feeds) — no scraping, no fragile gray-area nonsense.
- **Let the robots help.** With your own Azure OpenAI key: score how well your resume fits a posting, get tailoring suggestions, and draft cover letters and outreach.
- **Know what's next.** The tracker doesn't just sit there — it tells you what to follow up on and what's worth applying to next.

## The deal with keys (a.k.a. why this is free)

Everything that costs money runs on **your** keys, server-side, never in the browser. The repo ships a `.env.example` and exactly zero secrets. Clone it, drop in your own keys, and you're running on your own dime — which, for the models this uses, is closer to "spare change" than "subscription."

Translation: nobody's API key is getting billed for your job hunt except your own.

## Quick start (local)

```bash
git clone <your-fork-url> ai-job-tracker
cd ai-job-tracker
cp .env.example .env       # then fill in your keys
npm install
npm run dev
```

That's it — it runs fully local, no cloud account required. The AI features stay dark until you add an Azure OpenAI key, so the plain tracker works out of the box.

## Deploy to Azure (optional)

Built to live in an [Azure Static Web App](https://learn.microsoft.com/azure/static-web-apps/) with built-in auth (GitHub / Microsoft / Google) and Azure Functions handling the secrets. Deploy guide arrives with the v1.0 milestone. Until then, local is the path.

## Configuration

All configuration is environment variables — see `.env.example` for the full list. The short version:

| What | Needed for |
| --- | --- |
| Azure OpenAI endpoint + key | Fit scoring, tailoring, cover letters |
| Adzuna / USAJobs keys | Job search (each optional and independent) |
| LinkedIn app key/secret | *Optional, off by default* — profile import |

Leave any of them out and the matching feature simply turns off. Nothing breaks.

## License

[GNU AGPLv3](LICENSE). Strong copyleft, and it closes the SaaS loophole — meaning this can never be quietly turned into a closed-source paid product, not even as a hosted service. Forks stay open, forever. Copyright notices ride along with the code wherever it goes.

Copyright © 2026 Cory Francis.

## Contributing

Bug reports, ideas, and pull requests welcome. Be excellent to each other. (Please do not attempt to kill all humans.)
