# Acceleration chart: verification log

Checked on 16 Oct 2026 against each publisher's own data or report. Every number on the chart
comes from `data/acceleration.json`, which `scripts/build-acceleration-data.py` builds from the
downloaded files listed below. Nothing in the file comes from secondary reporting.

## Status by tab

| Tab | Status | Primary file checked |
|---|---|---|
| Capability | Verified | METR `benchmark_results_1_1.yaml` (page last updated 8 Sep 2026) |
| Compute | Verified | Epoch AI `ai_chip_sales_timelines_by_chip.csv` (updated 14 Oct 2026) and epoch.ai/trends |
| Cost | Verified | Epoch AI report page and its data repo, `output/slides/Figure 2.csv` at commit `9163c17` |
| Adoption | Verified | Eurostat API, `isoc_eb_ai` (data updated 15 Jun 2026) |
| Incidents | Verified | AIID snapshot `backup-20261012101643.tar.bz2`, `incidents.csv` (sha256 `01d0ae55…c218683`) |

## Left out

- **Claude Mythos Preview (early), 1,044.8 min (≈17.4 h).** Above 16 hours. METR's page states
  that "measurements above 16 hrs are unreliable with our current task suite". The point is kept
  in the data file under `capability.excluded` but is not drawn.
- **Models above 10²⁵ FLOP (earlier compute tab, replaced).** Epoch's tracker stops at 33 models
  (latest May 2025) and Epoch has published no current count, so the tab now shows global AI
  chip capacity instead.
- **Q3 2026 chip sales.** Epoch flags the quarter incomplete for several chips; the series ends Q2 2026.
- **AI Index figures** (incidents 233 / 362, cost "280×"). They were replaced by the primary data.

## How the chart displays the data (decided 16 Oct 2026)

- All five measures share one linear time axis, 1 January 2021 to 1 January 2027 (extended on
  6 Nov 2026 so the current year shows in full; `_meta.window`). The selected measure is navy; the
  other four are grey.
- The y-axis shows the selected measure in its own units, with ticks set per measure in the data
  file. The grey lines are drawn on their own scales (0 to their top tick) and cannot be read
  against the axis; the note under the chart says so. (A first version scaled every line to
  "% of latest value"; replaced on request, 16 Oct 2026.)
- Coverage within the window: capability from Mar 2022 (GPT-3.5 Turbo Instruct, 0.6 min, now
  included), compute from Q1 2022, cost from Jan 2025 (Epoch publishes no meaningful earlier
  series: its only earlier GPQA level is 25%, the guessing rate), adoption 2021–2025, incidents
  2021–2025 (2016–2020 dropped from the file; 2026 is a partial year).
- Annual values (adoption, incidents) are plotted at mid-year.
- Adoption shows the EU total as the line and the 2025 size split as bars beside the chart.
- Cost is framed as "times cheaper than January 2025" for a score of 75% on GPQA Diamond (decided 6 Nov 2026).
- Credits on the chart (decided 6 Nov 2026): one line under the plot, "Source: <short name>"
  (`source.short`), with "Show more" for the full title, the access date, the growth-rate source and
  our own modifications (`source.note`). Licences are not shown on the chart; they stay in
  `source.licence`. A credit with licence still belongs in the site's sources list or Claims
  Register, because CC BY 4.0 (Epoch) and CC BY-SA 4.0 (AIID) ask for the licence to be indicated.
- The legend sentence under the plot ("the selected measure is the dark line ...") was removed as
  self-explanatory (6 Nov 2026).

## Comparability caveats (stated on the page)

- **Eurostat.**
  - There are no AI figures for 2022.
  - In 2025 the list of AI technologies adds "generating pictures, videos, sound/audio". So the
    2024→2025 rise partly reflects a wider definition, although Eurostat itself compares the two years.
- **AIID.** These are reported incidents. Counts depend on reporting and curation and are revised
  over time. The redrawn chart is labelled CC BY-SA 4.0.
- **METR.** © METR, all rights reserved. We cite the numbers and draw our own chart; nothing of
  METR's is embedded.
