# Extending Second Look

Every part of Second Look is a small, separate file with its knowledge kept as **data**, so most changes are
"add an entry to a list". There's no build step: edit a file, reload the page, run the tests.

| To add… | Edit | What to add |
|---|---|---|
| A new warning sign (scam tactic) | `js/analyzer.js` → `TACTICS` | `{ id, name, weight, icon, plain, patterns: [/regex/gi] }`, plus one line in `SAYS` |
| A brand scammers imitate | `js/links.js` → `BRANDS` | `{ name, key, domains: ["real-site.com"] }` |
| A country's reporting help | `js/regions.js` → `REGIONS` | `{ name, emergency, spam, report: [...], identity, urgentReport? }` keyed by its two-letter code |
| A "what happened" recovery situation | `js/recovery.js` → `SITUATIONS` and `STEPS` | the situation, and its steps tagged `when: "now" \| "today" \| "week"` |
| A phone-call warning sign | `js/call.js` → `SIGNS` | `{ id, label, why, hangUp? }` (`hangUp: true` means that sign alone means hang up) |
| A QR code type | `js/qr.js` → `parse()` | a branch that returns `{ kind, summary, details, text }` |
| Something to hide before sharing | `js/redact.js` → `RULES` | `{ label, tag, re }` (order matters: specific formats first) |
| A practice or test message | `js/samples.js` | `PRACTICE`, `EXAMPLES`, or a labelled set for `eval/run.js` |

## How the pieces fit

```
message ──► analyzer.js ──► tactics (words)      ┐
             │  uses links.js ──► link findings   ├─► score + level + "Why this level?" breakdown
             │  uses context  ──► your 3 answers, ┘     + what to do now + how to verify
             │                    scanned QR (qr.js)
             ▼
          app.js (interface only: renders results, never decides anything)
             ├─ redact.js   → "Ask someone I trust"
             ├─ regions.js  → "Report it", emergency number, recovery plan
             ├─ recovery.js → "Already responded?"
             └─ call.js     → "On a call right now?"
```

The engine files (`analyzer`, `links`, `redact`, `recovery`, `qr`, `call`, `regions`) are pure functions with no
DOM, so they run in Node and every one is unit-tested in `tests/engine.test.js`.

## Adding a warning sign, step by step

1. Add the tactic to `TACTICS` in `js/analyzer.js`. Pick a `weight`: 3+ is serious, 2 is a warning, 1 or less is
   minor. A message needs 2.5 points for "Some warning signs" and 6 for "Strong" (see `THRESHOLDS`).
2. Add how it reads in a sentence to `SAYS` ("It … and it …").
3. Run `node eval/run.js` and check no ordinary message got flagged.
4. Don't tune against the frozen round (currently Round 4). Write a new round of messages instead, and score it
   once before you look at what it misses.

## Releasing a change

Bump `V` in `sw.js` **and** every `?v=` in `index.html` to the same number. Browsers then fetch the new files
together instead of mixing an old cached script with a new page. `node --test` fails if the two disagree or if a
file in `js/` isn't loaded or cached.

## Rules that keep it trustworthy

- **No network.** The Content Security Policy sets `connect-src 'none'`. Don't add libraries, analytics or APIs.
- **Never say "safe".** The best result is "No common warning signs found", and it always says that isn't the same as safe.
- **Answers raise, never lower.** The three questions can only increase the warning level.
- **Only add helplines you've checked** on the official government site.
