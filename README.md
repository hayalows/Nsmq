# NSMQ Intelligence Lab

Independent historical archive and forecasting research project for Ghana's National Science & Maths Quiz.

## Current coverage

- Official championship / runner-up history: 1994–2025
- No-competition years represented explicitly: 2010, 2011
- Detailed Grand Final dataset currently seeded for 2018–2025
- Source-quality labels: verified / partial
- Contestant names stored only where a cited report explicitly identifies them
- Transparent exploratory forecasting baseline

## Why this structure

The project separates:
1. historical facts,
2. source evidence,
3. derived school ratings,
4. forecast outputs.

That matters because older seasons have different formats and weaker public documentation. The eventual model should train only on information available before each contest to avoid future-data leakage.

## Database

`schema.sql` is prepared for Postgres via Vercel Marketplace storage (for example Neon). The current web build uses `data.js` as a reviewed seed snapshot while the historical ingestion work continues.

## Roadmap

- Reconstruct every National Championship contest for the strongest documented years
- Map official YouTube videos to contests and timestamps
- Extract and verify round scores and contestant substitutions
- Build question/transcript pipeline with science notation cleanup
- Add regional/qualifier form and opponent-adjusted ratings
- Backtest forecast versions year-by-year before publishing accuracy claims

## Disclaimer

This is an independent research project, not the official NSMQ website. NSMQ is produced by Primetime Limited.