# LLM Compare

Side-by-side benchmark comparison for LLMs. Pick up to 10 models and compare scores, pricing, speed, arena ratings, and modalities in a clean dark UI.

**Live:** [broskees.github.io/llm-compare](https://broskees.github.io/llm-compare/)

## Features

- Compare up to 10 models simultaneously
- Benchmark scores with color-coded bars (green = best, red = worst across selected models)
- Arena / human eval scores (TrueSkill ratings from [Magia](https://magia.land))
- Provider details: pricing, context window, throughput, TTFT
- Modality badges (text/image/audio/video in+out)
- URL state — share comparisons via `?m=model-id-1,model-id-2,...`
- Responsive: desktop (subgrid alignment), tablet (2-col), mobile (swipe carousel)

## Data

All data is sourced from [api.zeroeval.com](https://api.zeroeval.com) and pre-fetched weekly via GitHub Actions. No backend required — everything is static JSON served from GitHub Pages.

| Path | Description |
|------|-------------|
| `data/models.json` | Full model list (~254 models) |
| `data/details/{model-id}.json` | Per-model benchmarks and metadata |
| `data/arena/{model-id}.json` | Per-model arena scores |

Model IDs with `/` are stored with `--` (e.g. `meta-llama/Llama-3` → `meta-llama--Llama-3`).

For machine-readable access see [`llms.txt`](./llms.txt).

## Development

No build step. Just serve the directory:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Data Refresh

The GitHub Action at `.github/workflows/fetch-data.yml` runs every Monday at 6am UTC, fetches fresh data from `api.zeroeval.com`, and commits the updated JSON files back to the repo — triggering a Pages redeploy automatically.

To trigger manually:

```bash
gh workflow run fetch-data.yml --repo broskees/llm-compare
```

## Stack

- Vanilla HTML/CSS/JS — no framework, no build tool
- GitHub Actions for data pipeline
- GitHub Pages for hosting
