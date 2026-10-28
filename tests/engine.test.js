// Run with: node --test
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { analyze } = require("../js/analyzer.js");
const links = require("../js/links.js");
const { redact } = require("../js/redact.js");
const { buildPlan } = require("../js/recovery.js");
const { HOLDOUT3 } = require("../js/samples.js");

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

test("frozen round-3 score stays what we publish", () => {
  let caught = 0, fp = 0;
  for (const r of HOLDOUT3) {
    const flagged = analyze(r.text).level !== "few";
    if (r.label === "scam" && flagged) caught++;
    if (r.label === "legit" && flagged) fp++;
  }
  // If a rule change moves these, update the README and Devpost numbers too.
  assert.equal(caught, 10);
  assert.equal(fp, 0);
});
