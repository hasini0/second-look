#!/usr/bin/env node
// Runs the analyzer over the labeled synthetic set and prints honest numbers.
// Usage: node eval/run.js [--verbose]
"use strict";
const { analyze } = require("../js/analyzer.js");
const { EVAL, PRACTICE, HOLDOUT, HOLDOUT2, HOLDOUT3 } = require("../js/samples.js");

const verbose = process.argv.includes("--verbose");
const tuning = EVAL.concat(
  PRACTICE.filter((p) => p.answer !== "verify").map((p) => ({ label: p.answer === "scam" ? "scam" : "legit", text: p.text }))
);
report("Tuning set (rules were adjusted against these)", tuning);
report("Round-1 held-out (scored once at 36% / 10%, then used to fix gaps)", HOLDOUT);
report("Round-2 held-out (scored once at 40% / 8%, then used to fix gaps)", HOLDOUT2);
report("Round-3 held-out (frozen, never tuned on: the number we quote)", HOLDOUT3);

function report(title, rows) {

const tally = { scam: { strong: 0, some: 0, few: 0 }, legit: { strong: 0, some: 0, few: 0 } };
for (const r of rows) {
  const res = analyze(r.text);
  tally[r.label][res.level]++;
  const miss = (r.label === "scam" && res.level === "few") || (r.label === "legit" && res.level !== "few");
  if (verbose || miss) {
    console.log(`${miss ? "✗" : "✓"} [${r.label} → ${res.level} ${res.score}] ${r.text.slice(0, 90)}`);
    if (miss) console.log(`    tactics: ${res.tactics.map((t) => t.id).join(", ") || "-"}; links: ${res.links.map((l) => l.findings.map((f) => f.id).join("+")).join(" | ") || "-"}`);
  }
}

const s = tally.scam, l = tally.legit;
const nS = s.strong + s.some + s.few, nL = l.strong + l.some + l.few;
const pct = (a, b) => ((100 * a) / b).toFixed(0) + "%";
console.log(`\n${title}: ${nS} scam, ${nL} legitimate`);
console.log(`Scams flagged (some or strong):   ${s.strong + s.some}/${nS} (${pct(s.strong + s.some, nS)})  strong: ${s.strong}`);
console.log(`Legit messages flagged (false +): ${l.strong + l.some}/${nL} (${pct(l.strong + l.some, nL)})  strong: ${l.strong}`);
}
