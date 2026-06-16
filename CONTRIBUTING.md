# Contributing

Bug reports, ideas, and pull requests are all welcome. Be excellent to each other. (Please do not attempt to kill all humans.)

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) v4 (`npm install -g azure-functions-core-tools@4`)
- Azure Static Web Apps CLI (installed automatically via `npm install`)

## Getting started

```bash
git clone <repo>
cd ai-job-tracker
cp .env.example .env          # fill in keys — or leave blank for the plain tracker
cp api/local.settings.json.example api/local.settings.json
npm install
npm run dev                   # http://localhost:4280
```

`npm run dev` starts the Vite dev server, the Azure Functions emulator, and the SWA proxy together. All three in one command.

## Before opening a PR

```bash
npm run lint       # must pass
npm run typecheck  # must pass
```

Add yourself to `AUTHORS` on your first contribution. Contributions are licensed under AGPLv3, the same as the project.

See [`ROADMAP.md`](ROADMAP.md) for what's planned and where help is most useful.
