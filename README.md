# Package Info Explorer

A hyperDart standalone component that answers natural-language npm package
questions — "npm express", "compare react and vue", "alternatives to
moment", "best npm package for date formatting" — with a single glanceable
answer instead of a trip to npmjs.com, bundlephobia, and a search engine.

## Running it locally

**Prerequisites:** Node.js `^20.19.0` or `>=22.12.0` (the Vite React plugin
requires one of those ranges — a plain Node 20.9 or similar will install but
print an `EBADENGINE` warning), and npm. No API keys, no `.env` file, no
backend to start — this is a plain frontend project.

```bash
git clone https://github.com/akash-singh-baghel/hackathon-Project-.git
cd hackathon-Project-
npm install
npm run start
```

`npm run start` launches Vite's dev server (default `http://localhost:5173`,
or the next free port if that one's taken — check the terminal output for the
exact URL) and opens the hyperDart sandbox: a mock search-results page with
this component rendered in it, simulating how the real platform would embed
it. The sandbox cycles through the example scenarios defined in
`searchData.json` (`npm express`, `compare react and vue`, `npm alternatives
to moment`, etc.) — edit that file and reload to try a different query
without touching any code, or use the sandbox's own search bar at the top to
type a live query directly.

To produce the production bundle that actually gets published to the
hyperDart registry:

```bash
npm run build
```

This outputs to `dist/` (already git-ignored). Running `npm publish` checks
that output (via the `prepublishOnly` script, `scripts/validate-publish.js`)
before actually publishing to the hyperDart registry — see `AGENTS.md` for
the full publish workflow.

## The idea

Developers ask four different kinds of questions about packages, and this
component tells them apart from the query text alone (the platform resolves
*which* package(s) are named; it never says what kind of question it is):

1. **Details** — "npm express" → one package's version, downloads, license,
   module format, TypeScript support, and (optionally) its gzipped size.
2. **Compare** — "compare react and vue" / "compare express, fastify, koa" →
   a downloads bar chart, a responsive comparison table, and a few
   *factual* takeaway lines generated from the numbers themselves (never an
   invented "winner" — see Design decisions).
3. **Alternatives** — "alternatives to moment" → a ranked list of real
   competitors, not anything that happens to share one loose keyword.
4. **Use-case recommendation** — "best npm package for date formatting" →
   the same ranked list, but driven by npm's own search relevance since
   there's no seed package to compare keywords against.

A fifth, extra-credit intent — **version-aware comparisons** ("express 4 vs
5") — diffs two specific published versions of one package side by side.

Follow-up actions ("Compare with…", "See alternatives", clicking a result)
re-point the same component at a new intent without going through the
platform's query parser again.

## Why no backend

The three data sources this component needs — the public npm registry, npm's
download-counts API, and Bundlephobia — are all free, keyless, and
CORS-enabled, so there's nothing here that needs hiding behind a server.
That's the deciding difference from a component like a weather-alerts or
places lookup, which *do* need a backend to keep an API key off the client.
This ships as the plain `react-vite` hyperDart template with no `src/backend`
at all.

## Data sources

| Data | Endpoint |
|---|---|
| Package metadata, all versions, dist-tags | `https://registry.npmjs.org/{package}` |
| Weekly downloads | `https://api.npmjs.org/downloads/point/last-week/{package}` |
| npm's own ranked search (alternatives, use-case, compare validation) | `https://registry.npmjs.org/-/v1/search` |
| Install size (gzipped, minified) | `https://bundlephobia.com/api/size?package={name}@{version}` (best-effort — see Design decisions) |
| DefinitelyTyped existence check | `https://registry.npmjs.org/@types/{name}` |

Scoped packages (`@org/name`) aren't tracked by the downloads API — that's
surfaced honestly as "Unknown" rather than a zero or a guess.

## Design decisions

- **No invented winner.** The comparison view's takeaway lines (e.g. "express
  gets 9.3× the weekly downloads of fastify") are generated directly from
  the fetched numbers in `utils/takeaways.js`. There's no subjective
  "X is better" copy anywhere — the judging brief explicitly calls out
  "no invented winner" as an accuracy requirement, and it's also just more
  useful: the reader draws their own conclusion from real numbers.
- **Alternatives ranking is reranked client-side.** A single npm search
  query for "alternatives to express" surfaces a lot of noise — packages
  that share one loose keyword (an AWS Lambda wrapper, a React Router
  devtools package) outrank real competitors like Fastify or Koa in npm's
  own relevance score. `hooks/usePackageExplorer.js` runs two differently-
  sized keyword queries, merges the candidate pool, and reranks by actual
  keyword overlap with the seed package before anyone's download count is
  even fetched. This measurably fixed the ranking in testing — Hono, Koa,
  and `@hapi/hapi` now lead "alternatives to express" instead of unrelated
  scoped packages.
- **Bundlephobia is best-effort, never blocking.** It's a useful, widely-used
  but unofficial API. A failure or timeout there degrades a single chip
  ("Size" just doesn't render) rather than breaking the rest of the card —
  see the robustness judging criterion.
- **Operate-mode visual design, not a landing page.** This is a dense,
  task-focused dev tool, not a marketing surface — the visual direction
  (restrained color used only for accents/state, a tight type scale, a
  second "sunken" surface tone for data chrome, `tabular-nums` throughout
  so numbers align, one authored 220ms reveal transition on data load) comes
  from Anthropic's `impeccable` design skill's Operate-mode guidance rather
  than generic "AI slop" defaults (no gradients, no kicker/eyebrow labels,
  no nested cards).
- **The comparison table is responsive, not reformatted per `props.format`.**
  Below ~440px of actual container width it collapses from a `<table>` into
  one stacked card per field via a CSS container query — the same markup
  works correctly in both sidebar and mainline because it reacts to real
  rendered width rather than trusting the platform's `format` hint.
- **Honest empty/error states.** An unresolved package name, a package with
  zero close alternatives, and a registry outage each get their own distinct,
  plainly-worded message — never a silent blank panel.

## Libraries

Just the hyperDart template defaults (React 19, Emotion for styling,
`react-router-dom` via `withHD`). No chart library, no UI kit beyond what the
template already peer-depends on, no date library — the downloads bar chart
is CSS/SVG-free plain `<div>` bars, intentionally, to keep the bundle and the
dependency surface small.

## Built with

Scaffolded from the official `create-hyper-dart` `react-vite` template.
Implementation (intent detection, the npm API client, all components, the
responsive table, the ranking fix) and the visual design pass were done with
Claude Code, using Anthropic's `impeccable` skill for Operate-mode design
guidance and Playwright (via MCP) to drive the local sandbox for real-data
and cross-viewport/theme QA during development — including catching and
fixing the alternatives-ranking quality issue and a mislabeled responsive
table above.
