# Second Look

**A calm second opinion for the message you hesitate to click.**
Paste a suspicious text, email or DM. Second Look points out the scam tactics in plain words, X-rays links without opening them, tells you a safe next step, and helps you act. Your message never leaves your device.

Built for **SafeSpace Hacks 2026**. Everything here was created during the event (Oct 17 – Nov 22, 2026).

## Features
- **Check a message**: highlights the exact pressure tactics (20 kinds) with one-line explanations, and gives three levels that never say "safe".
- **Link X-ray**: shows where a link really goes and catches lookalike domains, foreign look-alike letters, brand-in-subdomain tricks, `@` tricks, IPs and shorteners. It never opens the link.
- **Three questions only you can answer**: your context can raise the warning level, never lower it.
- **Ask someone I trust**: a copy with codes, numbers, contacts, names and link tracking IDs removed, editable before sharing.
- **Already responded?**: an ordered recovery plan (next 15 minutes / today / this week), saved only on your device, printable.
- **Practice**: 10 synthetic messages, including real ones and "check first" ones.
- **Private by construction**: no server, no AI service, no trackers, no libraries. The CSP sets `connect-src 'none'`. Works offline and installs as an app (with Android "Share to Second Look").
- **Accessible**: keyboard, screen-reader labels, text sizes, dark mode, reduced motion, phone-friendly.

## Run it
No install, no build.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. You can also double-click `index.html` (everything except offline mode works).

**Deploy:** push to GitHub → Settings → Pages → deploy from `main`, root folder.

## Test and evaluate
```bash
node --test
```

```bash
node eval/run.js
```

| Round (synthetic, labelled) | Scams caught | Normal messages flagged |
|---|---|---|
| Round 1, first blind score | 36% | 10% |
| Round 2, first blind score | 40% | 8% |
| **Round 3, frozen, never tuned** | **67% (10/15)** | **0% (0/12)** |

Each round's new set was scored once before we looked at the misses. Round 3 is the honest number. See [docs/DEVPOST.md](docs/DEVPOST.md) for the full story.

## Limitations
It reads words and link addresses only, so it can't confirm a sender or say a message is safe. It misses about 1 in 3 new scams in our frozen test, it's English-only, and its advice is US-focused. Test sets are small and synthetic.

## Project layout
```
index.html            page + strict Content Security Policy
styles.css            design (light/dark, text sizes, print)
js/links.js           link X-ray (no network)
js/analyzer.js        tactic detection, levels, advice
js/redact.js          redaction for "Ask someone I trust"
js/recovery.js        recovery plan builder
js/samples.js         synthetic examples, practice and test sets
js/app.js             interface
sw.js                 offline cache
tests/                node --test
eval/run.js           evaluation report
```

## Credits
No third-party code, assets or datasets. All messages are synthetic (555 phone numbers). Guidance is based on public FTC / IC3 / national cyber-security advice. AI assistance: Claude (Anthropic) helped write code and copy.

MIT License.
