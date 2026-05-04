# Canadian Credit Card Finder

A free, interactive single-page tool that recommends the best Canadian credit card based on a user's spending habits, goals, and credit profile.

Live preview (after Pages is enabled): `https://paawan99.github.io/PaawanShah/`

## What it does

1. **5-step wizard** — collects: main goal, monthly spend, top spending categories, annual-fee tolerance, credit score range.
2. **Scores 60+ Canadian cards** — covers TD, RBC, BMO, Scotiabank, CIBC, National Bank, American Express, Tangerine, Simplii, Brim, PC Financial, Rogers, Neo, MBNA, Triangle, Home Trust, Desjardins, Meridian and Vancity.
3. **Returns a top 5** — with reasons, welcome bonuses, pros, and a head-to-head comparison table for the top 3.

Scoring weights: goal alignment (40), category match (25), annual-fee fit (15), credit-score eligibility (15), spend fit (5).

## File structure

```
index.html    # Self-contained: HTML + CSS + card database + scoring engine
favicon.svg   # Site favicon
README.md     # This file
```

Everything is in one file so it can be hosted on GitHub Pages without a build step.

## Deploying

### GitHub Pages (project site)
1. Repo **Settings** -> **Pages**
2. Source: **Deploy from a branch** -> `main` -> `/ (root)`
3. Save — site goes live at `https://paawan99.github.io/PaawanShah/`

### Custom subdomain (recommended)
The apex domain `paawanshah99.com` is already used by the portfolio repo. To put this site on its own subdomain:

1. Create a `CNAME` file in the repo root containing e.g. `cards.paawanshah99.com`
2. At your DNS registrar add a record: `CNAME  cards  paawan99.github.io.`
3. In **Settings** -> **Pages**, set the custom domain to `cards.paawanshah99.com` and enable **Enforce HTTPS** once it becomes available.

## Disclaimer

Recommendations are based on publicly available card information and a heuristic scoring model. Card terms change frequently — always verify the current offer with the issuer before applying. This tool is not financial advice.
