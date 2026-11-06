# Demo video script (about 2:45)

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

**1:35 – Honest uncertainty (20s)**
Examples → *Ordinary message* → "No common warning signs found… **that doesn't mean it's safe.**"
Answer the three questions: Not expecting it → No → Yes. "Your answers can raise the warning, never lower it."

**1:55 – Ask someone I trust + Already responded (30s)**
Examples → *"Hi Mum" on a new number* → scroll to *Ask someone I trust*: "Codes, numbers and names are removed, so you can safely ask your family."
**Already responded?** → tick *I shared a security code* and *I sent money*: "An ordered plan: next 15 minutes, today, this week. Saved only on this device."

**2:25 – How it works and trust (20s)**
How it works tab: "Plain JavaScript, no libraries, no server. The browser itself blocks any outgoing data: network requests stay at 0. QR codes are read with Chrome's built-in scanner."
Evaluation table: "We test on new messages we've never tuned on. Our frozen round catches about three in four scams, with one false alarm in twelve, and we show you that honestly."

**2:45 – Close (5s)**
"Second Look: pause, understand, check. Just make this moment a little safer."

## Screenshots to capture for Devpost
1. PayPal result: verdict + "Why this level?" open
2. QR card for the fake UPI refund (red "would send money" card)
3. Highlighted message + tactic cards
4. Link X-ray card
5. "Ask someone I trust" with the "Hidden:" chips
6. Recovery plan with a few steps ticked
7. How it works: request counter + evaluation table
8. Phone-width view in dark mode
