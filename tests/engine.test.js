// Run with: node --test
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { analyze } = require("../js/analyzer.js");
const links = require("../js/links.js");
const { redact } = require("../js/redact.js");
const { buildPlan } = require("../js/recovery.js");
const { HOLDOUT4 } = require("../js/samples.js");

test("never calls a message safe", () => {
  const r = analyze("See you at 7 for dinner!");
  assert.equal(r.level, "few");
  assert.ok(!/\bsafe\b/i.test(r.summary.replace(/doesn't mean it's safe/i, "")));
  assert.ok(r.caveats.some((c) => /not the same as "safe"/.test(c)));
});

test("asking for a security code is always a strong warning", () => {
  assert.equal(analyze("I sent you a code by mistake, can you send it to me?").level, "strong");
  assert.equal(analyze("Verify by sending the 6-digit code you receive.").level, "strong");
});

test("a real code message that says never share it is not flagged", () => {
  assert.equal(analyze("Your verification code is 381920. Never share this code with anyone.").level, "few");
});

test("receiving a Venmo payment is not a payment red flag", () => {
  assert.equal(analyze("Hey, sent you $40 on Venmo for the concert tickets!").level, "few");
});

test("lookalike and disguised links are caught", () => {
  const ids = (u) => links.inspect(u).findings.map((f) => f.id);
  assert.ok(ids("https://paypal.com.account-verify.top/login").includes("brand-mismatch"));
  assert.ok(ids("netf1ix-billing.com").includes("brand-mismatch"));
  assert.ok(ids("https://аpple.com").includes("punycode")); // Cyrillic "а"
  assert.ok(ids("https://user@evil.com").includes("at-sign"));
  assert.ok(ids("bit.ly/abc").includes("shortener"));
  assert.deepEqual(ids("https://www.paypal.com/signin"), ["official"]);
  assert.ok(!ids("purchase-confirm.com").includes("brand-mismatch"), "purchase is not chase");
});

test("bare words are not mistaken for links", () => {
  assert.equal(links.find("e.g. bring snacks, i.e. chips").length, 0);
});

test("context answers can raise concern but never lower it", () => {
  const plain = "Can you look at this for me today?";
  assert.equal(analyze(plain).level, "few");
  assert.equal(analyze(plain, { expected: false, knownSender: false, asks: true }).level, "strong");
  const scam = "Grandma it's me, new number. Send $900 by Zelle and don't tell mom";
  assert.equal(analyze(scam, { expected: true, knownSender: true, asks: false }).level, "strong");
});

test("redaction hides personal details but keeps the link's website", () => {
  const r = redact("Hi Sarah Jones, your code is 448210. Call +1 (555) 013-2291. Card 4111 1111 1111 1111. help@x.com https://bad.top/v?id=sarah");
  assert.ok(!/Sarah|448210|013-2291|4111|help@x\.com|id=sarah/.test(r.text), r.text);
  assert.ok(r.text.includes("https://bad.top/…"));
  assert.equal(redact("Dear Customer, hi").text, "Dear Customer, hi");
});

test("recovery plan puts the urgent steps first and has no duplicates", () => {
  const plan = buildPlan(["paid", "remote", "code"]);
  assert.equal(plan[0].when, "now");
  assert.match(plan[0].steps[0].text, /Disconnect/);
  const texts = plan.flatMap((g) => g.steps.map((s) => s.text));
  assert.equal(new Set(texts).size, texts.length);
  assert.deepEqual(buildPlan([]), []);
});

test("frozen round-4 score stays what we publish", () => {
  let caught = 0, fp = 0;
  for (const r of HOLDOUT4) {
    const flagged = analyze(r.text).level !== "few";
    if (r.label === "scam" && flagged) caught++;
    if (r.label === "legit" && flagged) fp++;
  }
  // If a rule change moves these, update the README and Devpost numbers too.
  assert.equal(caught, 11);
  assert.equal(fp, 1);
});

// ---------------------------------------------------------------- added for Next Byte Hacks

const qr = require("../js/qr.js");

test("QR payment codes are recognised as sending money", () => {
  const upi = qr.parse("upi://pay?pa=refund.desk@okbank&pn=Refund%20Desk&am=4999&cu=INR&tn=Receive%20refund");
  assert.equal(upi.kind, "payment");
  assert.match(upi.summary, /INR 4999 to Refund Desk/);
  assert.equal(qr.parse("bitcoin:bc1qxyz123456789?amount=0.05").kind, "payment");
});

test("QR codes that open links, join Wi-Fi or hold text are told apart", () => {
  assert.equal(qr.parse("https://pay-parking.top/zone4").kind, "link");
  const wifi = qr.parse("WIFI:T:nopass;S:Free Airport WiFi;;");
  assert.equal(wifi.kind, "wifi");
  assert.match(wifi.summary, /Free Airport WiFi/);
  assert.equal(qr.parse("tel:+15550100").kind, "phone");
  assert.equal(qr.parse("Table 12, enjoy your meal").kind, "text");
});

test("a QR code that sends money is always a strong warning, whatever its words", () => {
  const info = qr.parse("upi://pay?pa=x@okbank&pn=Buyer&am=2000");
  const r = analyze(info.text, { qr: info });
  assert.equal(r.level, "strong");
  assert.equal(r.critical, "The QR code would send money from you");
  assert.ok(r.verify[0].text.includes("QR codes"));
});

test("a parking-meter QR link pretending to be a brand is caught", () => {
  const info = qr.parse("https://paypal-parking.top/pay");
  assert.equal(analyze(info.text, { qr: info }).level, "strong");
});

test("the score breakdown adds up and explains the level", () => {
  const r = analyze("URGENT: your account will be suspended. Confirm your password at secure-login-update.top");
  const total = r.breakdown.reduce((a, b) => a + b.points, 0);
  assert.equal(Math.round(total * 10) / 10, r.score);
  assert.ok(r.breakdown.some((b) => b.label === "Rushes you"));
  assert.deepEqual(r.thresholds, { some: 2.5, strong: 6 });
  assert.equal(analyze("See you at 7!").breakdown.length, 0);
});

test("overpayment and survey-reward scams are caught (round-3 fixes)", () => {
  assert.notEqual(analyze("I'll mail a cashier's check for more than the price, just send the difference back to my mover.").level, "few");
  assert.notEqual(analyze("Your loyalty reward of $100 expires today. Take a quick survey to claim it.").level, "few");
  assert.equal(analyze("Thanks for taking our survey last week, the results are on the website.").level, "few");
});
