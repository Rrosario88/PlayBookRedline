# PlaybookRedline

AI-powered contract review and redlining tool for legal teams.

## Stack
- Client: React + Vite + TypeScript + Tailwind CSS
- Server: Node.js + Express + TypeScript
- LLM: Anthropic Claude (`claude-sonnet-4-20250514`)
- Document parsing: `mammoth`, `pdf-parse`
- DOCX generation: `docx` with Word tracked revisions
- Containers: Docker + Docker Compose

## Features
- Upload contract and playbook in PDF or DOCX format
- Clause-by-clause SSE streaming analysis
- Sortable and filterable risk table
- Inline editable redlines
- Sample NDA + playbook demo
- Word export with granular tracked changes using revision markup (`w:ins` / `w:del`)
- Basic production hardening via Helmet, compression, rate limiting, nginx, and CI

## Run locally

### Server
```bash
cd server
cp ../.env.example .env
npm install
npm run dev
```

### Client
```bash
cd client
npm install
npm run dev
```

The Vite app proxies `/api` requests to `http://localhost:3001`.

## Run with Docker
```bash
docker compose up --build
```

Then open:
- App: http://localhost:8080
- API: http://localhost:3001/api/health

## Environment
Create `.env` from `.env.example` at the project root or export env vars before running.

Supported variables:
- `ANTHROPIC_API_KEY` — optional; enables Claude analysis
- `PORT` — backend port (default `3001`)
- `CORS_ORIGIN` — comma-separated allowed origins for backend

## Notes
- If `ANTHROPIC_API_KEY` is not set, the app falls back to deterministic heuristic analysis for local demos.
- Export now applies tracked changes at a granular word/phrase level within each clause instead of replacing the entire clause.
- CI workflow builds both client and server on push and pull request.
