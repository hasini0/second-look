# Demo video script (about 3:00)

Next Byte's rules ask for 2–5 minutes covering **what it does, how it works and the problem it solves**; the overview page says 1–3 minutes. Aim for 2:30–3:00 to satisfy both.

Record at desktop width in Chrome (the QR scanner needs Chrome or Edge). Speak slowly. Before recording, open `docs/demo-qr/fake-refund-upi.png` on your phone screen (or print it), so you can hold it up to the camera.

**0:00 – The problem (20s)**
"Scams don't beat people with technology. They beat them with a feeling: a deadline, a threat, a 'Hi Mum, new number'. And now they're on QR stickers on parking meters too. Second Look is a calm second opinion for the message or QR code you hesitate to trust, and it runs entirely on your device."

**0:20 – Check a message (40s)**
Examples → *Fake PayPal alert* → **Take a second look**.
- Verdict: Strong warning signs, in plain words.
- Open **Why this level?** "No black box: every point, and the one sign that decided it: the link disguises where it goes."
- Scroll to the highlights. Tap **Scares you** to show it jumping to the words.
- Link X-ray: "It looks like PayPal, but it really goes to **account-verify.top**. We never open the link."

**1:00 – QR code X-ray (35s)** *(the new feature: spend time here)*
**Scan a QR code** → **Use camera** → hold up the fake refund code.
- "Someone buying your old sofa says: scan this to receive the payment. Second Look reads the code on this device…"
- QR card: "**If you scanned it, it would send ₹4,999 to 'Refund Desk'.** You never scan a code to receive money."
- Then **Choose a photo** → `fake-parking-meter.png`: "A parking-meter sticker: it pretends to be PayPal on a .top website."

**1:35 – On a call right now (20s)**
Scroll up → **Someone's on the phone with me right now**. Tick *They say they're from your bank*, then *They want you to move money*.
"Phone scams take the most money, and there's nothing to paste. Tick what the caller says… and it tells you straight away: **hang up, it's OK to hang up**, and exactly what to say."

**1:55 – Honest uncertainty (15s)**
Examples → *Ordinary message* → "No common warning signs found… **that doesn't mean it's safe.**"
Answer the three questions: Not expecting it → No → Yes. "Your answers can raise the warning, never lower it."

**2:10 – Ask someone I trust + Already responded (30s)**
Examples → *"Hi Mum" on a new number* → scroll to *Ask someone I trust*: "Codes, numbers and names are removed, so you can safely ask your family."
**Already responded?** → pick **India** under *Where do you live?*, tick *I sent money*: "An ordered plan for your country. In India, calling 1930 jumps to the top, because it can freeze money that's still moving."

**2:40 – How it works and trust (15s)**
How it works tab: "Plain JavaScript, no libraries, no server. The browser itself blocks any outgoing data: network requests stay at 0. QR codes are read with Chrome's built-in scanner."
Evaluation table: "We test on new messages we've never tuned on. Our frozen round catches about three in four scams, with one false alarm in twelve, and we show you that honestly."

**2:55 – Close (5s)**
"Second Look: pause, understand, check. Just make this moment a little safer."

## Screenshots to capture for Devpost
1. PayPal result: verdict + "Why this level?" open
2. QR card for the fake UPI refund (red "would send money" card)
3. "On a call right now?" with the red "Hang up now" banner
4. Highlighted message + tactic cards
5. Link X-ray card
6. "Ask someone I trust" with the "Hidden:" chips
7. Recovery plan for India with 1930 under "Right now"
8. How it works: request counter + evaluation table
9. Phone-width view in dark mode
