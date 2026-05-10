# Swiss Ephemeris data files

This directory is intentionally (almost) empty. `pyswisseph` falls back to its
built-in Moshier ephemeris when no `.se1` files are present, with accuracy of a
few arcseconds — sufficient for natal/mundane astrology display.

For full Swiss Ephemeris precision (1800–2400 CE), drop these three files here
before building the Docker image:

- `seas_18.se1` — main asteroids
- `semo_18.se1` — Moon
- `sepl_18.se1` — planets

Download from <https://www.astro.com/ftp/swisseph/ephe/> (free for personal use;
review the Astrodienst license for redistribution).

When the `.se1` files are present, `swe.calc_ut(..., FLG_SWIEPH)` automatically
uses them. No code change required.
