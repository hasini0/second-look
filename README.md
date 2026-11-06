# Second Look

**A calm second opinion for the message you hesitate to click.**
Paste a suspicious text, email or DM, or scan a QR code. Second Look points out the scam tactics in plain words, X-rays links and QR codes without opening them, tells you a safe next step, and helps you act. Your message never leaves your device.

Built for **Next Byte Hacks V5**. Everything here was created during the event (first commit Oct 28, 2026; the event runs Oct 6 – Nov 8, 2026).

## Features
- **Check a message**: highlights the exact pressure tactics (20 kinds) with one-line explanations, and gives three levels that never say "safe".
- **QR code X-ray** (new): scan a code from a parking meter, parcel note or poster, or pick a photo of it. It's decoded on your device with the browser's built-in scanner and never opened. Catches fake websites behind stickers, and "scan to receive money" codes that actually **send** money (UPI, Bitcoin and other payment codes).
- **"Why this level?"** (new): an open score breakdown. Every point each warning sign added, the thresholds, and the one serious sign that decided it, if there was one.
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
| Round 3, first blind score | 67% (10/15) | 0% (0/12) |
| **Round 4, frozen, never tuned** | **73% (11/15)** | **8% (1/12)** |

Each round's new set was scored once before we looked at the misses, then used to fix gaps. Round 4 was written before the round-3 fixes and scored before them (11/15, 1/12, counts only) and once after: the fixes didn't change it. Round 4 is the honest number. It was written by the same team that wrote the rules, so treat it as indicative, not a benchmark. See [docs/DEVPOST.md](docs/DEVPOST.md) for the full story.

## Limitations
It reads words, link addresses and QR codes only, so it can't confirm a sender or say a message is safe. It misses about 1 in 4 new scams in our frozen test and wrongly flagged 1 of 12 ordinary messages, it's English-only, and its advice is US-focused. Test sets are small and synthetic. QR reading needs a browser with a built-in scanner (Chrome and Edge on Android, Mac and ChromeOS); elsewhere you can type the address your camera shows.

## Project layout
```
index.html            page + strict Content Security Policy
styles.css            design (light/dark, text sizes, print)
js/links.js           link X-ray (no network)
js/analyzer.js        tactic detection, levels, advice
js/qr.js              QR code reading (built-in BarcodeDetector) and explaining what a code would do
js/redact.js          redaction for "Ask someone I trust"
js/recovery.js        recovery plan builder
js/samples.js         synthetic examples, practice and test sets
js/app.js             interface
sw.js                 offline cache
tests/                node --test
eval/run.js           evaluation report
docs/demo-qr/         sample QR codes for trying the scanner (fake UPI refund, fake parking meter, real site, Wi-Fi)
```

## Credits
No third-party code, assets or datasets. All messages are synthetic (555 phone numbers). Guidance is based on public FTC / IC3 / national cyber-security advice. AI assistance: Claude (Anthropic) helped write code and copy.

MIT License.
