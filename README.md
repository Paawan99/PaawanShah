# Stardust — Astrology SAAS

A free, open-source astrology web app powered by **Swiss Ephemeris**
(`pyswisseph`) for the math and **OpenAI** for natural-language chart
interpretations. Supports both Tropical (Western) and Sidereal (Vedic, Lahiri
ayanamsa) zodiacs, plus four classical Mundane techniques.

> Live: <https://paawanshah.vercel.app> (frontend) ·
> API: `https://stardust-api.onrender.com/api/v1` (Render free tier).

## Features

| Module | What it does |
|---|---|
| Natal chart | Planets, houses, aspects. Tropical or Sidereal. Placidus / Whole Sign / Equal / Koch / Regiomontanus. |
| Cardinal Ingresses | Charts cast for the moment the Sun enters Aries, Cancer, Libra, Capricorn — the four classical mundane charts of the year. |
| Lunations & Eclipses | New / Full Moons in any window; solar & lunar eclipses with local visibility. |
| Planetary Cycles | Exact aspects (☌ ☍ □ △ ✶) among Jupiter through Pluto across years. |
| City Chart | Cast the sky over any city at any moment — read the houses as collective themes. |
| AI Interpretation | OpenAI `gpt-4o-mini` reads the structured chart data and writes a Markdown reading. Several focus modes (overview, career, relationships, spiritual, mundane). |
| AI Chat (SSE) | Conversational follow-up grounded in the chart data. |

## Architecture

```
Browser ──HTTPS──▶ Next.js (Vercel) ──/api/v1/* rewrite──▶ FastAPI (Render)
                                                    │
                                                    ├── pyswisseph (Swiss Ephemeris)
                                                    ├── OpenAI (interpret + chat SSE)
                                                    └── Open-Meteo geocoding
```

- **Frontend** — Next.js 14 (App Router, TypeScript, Tailwind). Custom SVG `ChartWheel`. Zero auth, zero DB.
- **Backend** — FastAPI on Python 3.11. `pyswisseph` for all astronomical calculations. `slowapi` rate limiting. Open-Meteo for geocoding.
- **AI** — OpenAI Chat Completions, `gpt-4o-mini` default. Stable system prompt benefits from server-side prompt caching. In-memory TTL cache by chart hash.
- **Auth & DB** — none in MVP. Charts are stateless.
- **Cost model** — free tiers (Vercel + Render free); donations via Buy Me a Coffee.

## Customer journey

```
Landing  →  Cast natal chart           ┐
            (date/time/place)          │
                  │                    │ Free, no signup.
                  ▼                    │ Birth data not stored.
            Chart wheel + tables  ◀────┘
                  │
                  ▼
            AI interpretation (focus tabs)
                  │
                  ▼
            Mundane dashboard ──┬─ Ingress charts (year + city)
                                ├─ Lunations & eclipses
                                ├─ Planetary cycles
                                └─ City chart for any moment
```

## Developer / creator workflow

```
                  ┌─ web/  (Next.js 14, Tailwind)
paawanshah ───────┤
                  └─ api/  (FastAPI + pyswisseph)

Local dev:
  cp api/.env.example api/.env          # add OPENAI_API_KEY
  cp web/.env.example web/.env.local
  cd api && pip install -r requirements.txt && uvicorn app.main:app --reload
  cd web && npm install && npm run dev

Add a new mundane technique:
  1. api/app/services/<name>.py     — pure function, swe_* calls
  2. api/app/models/schemas.py      — pydantic models
  3. api/app/routes/charts.py       — register endpoint
  4. api/tests/test_<name>.py       — fixture-based test
  5. web/src/app/mundane/<name>/page.tsx
  6. web/src/lib/api.ts             — typed client method

Deploy:
  Push to main → Vercel auto-deploys web/, Render auto-deploys api/.
```

## Roadmap

| Phase | Scope |
|---|---|
| MVP (now) | Natal + 4 mundane modules, AI interpret + SSE chat, geocode, deploy. |
| v1 | Transits & bi-wheel, shareable chart URLs, OG images, sitemap, prompt-cache disk persistence. |
| v2 | Synastry & composite, solar return, progressed Sun, optional accounts (Auth.js + Supabase) for chart history. |
| v3 | Vedic dashas (Vimshottari), divisional charts (D9, D10), electional search, PDF export. |

## Licensing

- Frontend (`web/`) — MIT.
- Backend (`api/`) — uses `pyswisseph` which mirrors Swiss Ephemeris under
  AGPL-3. Deployed instances must offer source to network users; that
  obligation is satisfied by this public repository linked from the site
  footer.

## Status

This branch (`claude/astrology-saas-planning-NBGVE`) is the initial scaffold.
See the open PR for the full file map and TODOs.
