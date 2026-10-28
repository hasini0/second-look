/* Second Look — interface. Everything here runs locally; nothing is sent anywhere. */
(function () {
  "use strict";
  const SL = window.SecondLook;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  // localStorage can be missing or blocked (private windows); the app must work without it.
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* not saved; fine */ }
    },
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const TACTIC_BY_ID = Object.fromEntries(SL.analyzer.TACTICS.map((t) => [t.id, t]));
  const sevOf = (weight) => (weight >= 3 ? "high" : weight >= 2 ? "mid" : "low");
  const SEV_LABEL = { high: "Serious", mid: "Warning", low: "Minor" };

  const BADGES = {
    strong: '<svg class="badge" viewBox="0 0 48 48" aria-hidden="true"><path d="M16 3h16l13 13v16L32 45H16L3 32V16z" fill="currentColor"/><path d="M24 13v14" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/><circle cx="24" cy="34.5" r="2.8" fill="#fff"/></svg>',
    some: '<svg class="badge" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4 46 43H2z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M24 17v12" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/><circle cx="24" cy="36" r="2.6" fill="#fff"/></svg>',
    few: '<svg class="badge" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="currentColor"/><path d="M24 14v.5M24 21v13" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/></svg>',
  };

  /* ================= routing ================= */
  const VIEWS = ["check", "recover", "practice", "how"];
  function route() {
    const name = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "check";
    for (const v of VIEWS) $("#view-" + v).hidden = v !== name;
    for (const a of $$(".tabs a")) {
      if (a.dataset.view === name) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }
    if (name === "practice" && !practice.started) renderPractice();
    if (name === "how") renderHow();
  }
  window.addEventListener("hashchange", () => {
    route();
    window.scrollTo(0, 0);
    $("#main").focus({ preventScroll: true });
  });

  /* ================= text size ================= */
  let size = store.get("sl-size", 0);
  const applySize = () => document.documentElement.setAttribute("data-size", String(size));
  applySize();
  $("#textsize").addEventListener("click", () => {
    size = (size + 1) % 3;
    applySize();
    store.set("sl-size", size);
    $("#textsize").setAttribute("aria-label", "Text size: " + ["normal", "large", "extra large"][size] + ". Tap to change.");
  });

  /* ================= check ================= */
  const msg = $("#msg");
  const results = $("#results");
  let ctx = { expected: null, knownSender: null, asks: null };
  let lastText = "";
  let shareDraft = null;

  for (const ex of SL.samples.EXAMPLES) {
    const o = document.createElement("option");
    o.value = ex.text;
    o.textContent = ex.label;
    $("#examples").appendChild(o);
  }
  $("#examples").addEventListener("change", (e) => {
    if (!e.target.value) return;
    msg.value = e.target.value;
    e.target.value = "";
    runCheck(true);
  });
  $("#check").addEventListener("click", () => runCheck(true));
  $("#clear").addEventListener("click", () => {
    msg.value = "";
    results.innerHTML = "";
    lastText = "";
    msg.focus();
  });
  msg.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runCheck(true);
  });

  function runCheck(fresh) {
    const text = msg.value;
    if (!text.trim()) {
      results.innerHTML = '<div class="card"><p>Paste or type a message first. Not sure what to try? Pick one from <strong>Try an example</strong>.</p></div>';
      msg.focus();
      return;
    }
    if (fresh && text !== lastText) {
      ctx = { expected: null, knownSender: null, asks: null };
      shareDraft = null;
    }
    lastText = text;
    let report;
    try {
      report = SL.analyzer.analyze(text, ctx);
    } catch (err) {
      // Fail visibly and safely rather than showing a misleading result.
      console.error(err);
      results.innerHTML = '<div class="card verdict some">' + BADGES.some + '<div><h2>Something went wrong</h2><p>We couldn\'t check this message. Treat it with care and contact the sender through a channel you already trust.</p></div></div>';
      return;
    }
    renderResults(text, report, fresh);
  }

  function highlightHTML(text, highlights) {
    let html = "";
    let pos = 0;
    for (const h of highlights) {
      html += esc(text.slice(pos, h.start));
      const part = text.slice(h.start, h.end);
      if (h.kind === "link") {
        html += `<mark class="hl t-link" data-tactic="link">${esc(part)}</mark><span class="sr-only"> (link, not opened)</span>`;
      } else {
        const t = TACTIC_BY_ID[h.id];
        html += `<mark class="hl t-${sevOf(t.weight) === "high" ? "high" : "mid"}" data-tactic="${t.id}" title="${esc(t.name)}">${esc(part)}</mark><span class="sr-only"> (warning sign: ${esc(t.name)})</span>`;
      }
      pos = h.end;
    }
    return html + esc(text.slice(pos));
  }

  function renderResults(text, r, fresh) {
    const active = document.activeElement && document.activeElement.id;
    const parts = [];

    // 1. Verdict
    parts.push(`
      <section class="card verdict ${r.level}" aria-labelledby="verdict-h">
        ${BADGES[r.level]}
        <div>
          <h2 id="verdict-h" tabindex="-1">${esc(SL.analyzer.HEADLINES[r.level])}</h2>
          <p>${esc(r.summary)}</p>
          ${r.level === "few" ? "<p><strong>That doesn't mean it's safe.</strong> If you weren't expecting it, check another way.</p>" : ""}
          ${r.contextNotes.map((n) => `<p class="context-note">${esc(n)}</p>`).join("")}
        </div>
        <div class="verdict-actions no-print">
          ${speech.available ? '<button class="btn ghost small" type="button" id="speak">🔊 Read aloud</button>' : ""}
          <a class="btn ghost small" href="#share-card">Ask someone I trust</a>
        </div>
      </section>`);

    // 2. What to do now
    parts.push(`
      <section class="card" aria-labelledby="next-h">
        <h2 id="next-h">What to do now</h2>
        <ol class="steps">${r.next.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      </section>`);

    // 3. What we noticed
    if (r.tactics.length || r.links.length) {
      const sorted = r.tactics.slice().sort((a, b) => b.weight - a.weight);
      parts.push(`
        <section class="card" aria-labelledby="noticed-h">
          <h2 id="noticed-h">What we noticed</h2>
          <p class="muted small">Highlighted in the message below. Tap a sign to find it in the text.</p>
          <div class="message-view" id="message-view">${highlightHTML(text, r.highlights)}</div>
          <div class="tactics">
            ${sorted.map((t) => `
              <button type="button" class="tactic" data-tactic="${t.id}" aria-pressed="false">
                <span class="ticon" aria-hidden="true">${t.icon}</span>
                <span class="tname">${esc(t.name)} <span class="sev ${sevOf(t.weight)}">${SEV_LABEL[sevOf(t.weight)]}</span></span>
                <span class="tplain">${esc(t.plain)}</span>
                <span class="tquote">“${esc(t.quotes.join("”, “"))}”</span>
              </button>`).join("")}
          </div>
          ${r.protective.length ? `<p class="small muted mt"><strong>Also noticed:</strong> ${r.protective.map(esc).join(" ")}</p>` : ""}
        </section>`);
    }

    // 4. Links
    if (r.links.length) {
      parts.push(`
        <section class="card" aria-labelledby="links-h">
          <h2 id="links-h">Links, X-rayed <span class="muted small">(we never open them)</span></h2>
          ${r.links.map((l) => `
            <div class="link-card">
              <div class="shown">${esc(l.text)}</div>
              <div class="real">Really goes to: <strong>${esc(l.domain)}</strong></div>
              ${l.findings.length ? `<ul class="findings">${l.findings.map((f) => `
                <li><span class="dot ${f.severity}" aria-hidden="true"></span><span><strong>${esc(f.title)}.</strong> ${esc(f.detail)}</span></li>`).join("")}</ul>`
                : '<p class="small muted m0">Nothing unusual about the address itself. That says nothing about what\'s on the page. If you need to visit the company, type its address yourself.</p>'}
            </div>`).join("")}
        </section>`);
    }

    // 5. Context questions: what only the person knows.
    const q = (key, legend) => `
      <fieldset class="q">
        <legend>${legend}</legend>
        <div class="seg" role="radiogroup">
          ${[["yes", true, "Yes"], ["no", false, "No"], ["unsure", null, "Not sure"]].map(([v, val, label]) => `
            <input type="radio" name="ctx-${key}" id="ctx-${key}-${v}" value="${v}" ${ctx[key] === val ? "checked" : ""}>
            <label for="ctx-${key}-${v}">${label}</label>`).join("")}
        </div>
      </fieldset>`;
    parts.push(`
      <section class="card" aria-labelledby="ctx-h">
        <h2 id="ctx-h">Three questions only you can answer</h2>
        <p class="muted small">The words can't tell us who you know or what you're expecting. Your answers can raise the warning level, never lower it, because a known contact's account can be hacked too.</p>
        <div class="questions">
          ${q("expected", "Were you expecting this message?")}
          ${q("knownSender", "Do you know the sender personally?")}
          ${q("asks", "Does it ask you to do something? (tap, reply, call, pay, share, install)")}
        </div>
      </section>`);

    // 6. How to verify
    parts.push(`
      <section class="card" aria-labelledby="verify-h">
        <h2 id="verify-h">How to check if it's real</h2>
        <ul class="verify-list">${r.verify.map((v) => `<li>${esc(v.text)}</li>`).join("")}</ul>
      </section>`);

    // 7. Ask someone I trust (redacted)
    const red = SL.redact.redact(text);
    const shareIntro = "Can you take a second look at this message before I do anything? (I've hidden my personal details.)";
    const signs = r.tactics.slice(0, 3).map((t) => t.name.toLowerCase());
    const shareBody = `${shareIntro}\n\n"${red.text.trim()}"${signs.length ? `\n\nSecond Look flagged: ${signs.join("; ")}.` : ""}`;
    if (shareDraft == null) shareDraft = shareBody;
    parts.push(`
      <section class="card share no-print" id="share-card" aria-labelledby="share-h">
        <h2 id="share-h">Ask someone I trust</h2>
        <p class="muted small">Getting a second opinion from a person is one of the best defences. We've hidden your codes, numbers, contact details and names. Check it and edit before you send.</p>
        <div class="removed">${red.removed.length ? red.removed.map((x) => `<span class="chip good">Hidden: ${x.count} ${esc(x.label)}${x.count > 1 && !/s$/.test(x.label) ? "s" : ""}</span>`).join("") : '<span class="chip">No personal details detected. Please double-check.</span>'}</div>
        <label class="visually-hidden" for="share-text">Message to send</label>
        <textarea id="share-text">${esc(shareDraft)}</textarea>
        <div class="row mt">
          ${navigator.share ? '<button class="btn primary" type="button" id="share-btn">Share…</button>' : ""}
          <button class="btn ${navigator.share ? "ghost" : "primary"}" type="button" id="copy-btn">Copy text</button>
          <span class="status" id="share-status" role="status"></span>
        </div>
      </section>`);

    // 8. Already responded
    parts.push(`
      <section class="card cta-card no-print">
        <p><strong>Already tapped, replied or paid?</strong><br><span class="muted small">Get a step-by-step plan. The first 15 minutes matter most.</span></p>
        <a class="btn ghost" href="#recover">Make my recovery plan</a>
      </section>`);

    // 9. Limits
    parts.push(`
      <section class="card" aria-labelledby="limits-h">
        <h2 id="limits-h">What this can't tell you</h2>
        <ul class="plain-list small">${r.caveats.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
      </section>`);

    results.innerHTML = parts.join("");
    wireResults(r);
    if (fresh) {
      const h = $("#verdict-h");
      h.focus({ preventScroll: true });
      h.closest(".verdict").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    } else if (active && document.getElementById(active)) {
      document.getElementById(active).focus({ preventScroll: true });
    }
  }

  function wireResults(r) {
    for (const btn of $$(".tactic", results)) {
      btn.addEventListener("click", () => {
        const on = btn.getAttribute("aria-pressed") !== "true";
        for (const b of $$(".tactic", results)) b.setAttribute("aria-pressed", "false");
        for (const m of $$("mark.hl", results)) m.classList.remove("focus");
        if (!on) return;
        btn.setAttribute("aria-pressed", "true");
        const marks = $$(`mark.hl[data-tactic="${btn.dataset.tactic}"]`, results);
        marks.forEach((m) => m.classList.add("focus"));
        if (marks[0]) marks[0].scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
    for (const input of $$('.questions input[type="radio"]', results)) {
      input.addEventListener("change", () => {
        const key = input.name.replace("ctx-", "");
        ctx[key] = input.value === "yes" ? true : input.value === "no" ? false : null;
        runCheck(false);
      });
    }
    const shareText = $("#share-text");
    shareText.addEventListener("input", () => (shareDraft = shareText.value));
    const status = $("#share-status");
    $("#copy-btn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shareText.value);
        status.textContent = "Copied. Paste it into a message to someone you trust.";
      } catch (e) {
        shareText.select();
        status.textContent = "Select the text and copy it.";
      }
    });
    const shareBtn = $("#share-btn");
    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        try {
          await navigator.share({ text: shareText.value });
        } catch (e) { /* cancelled */ }
      });
    }
    const speak = $("#speak");
    if (speak) speak.addEventListener("click", () => speech.say([SL.analyzer.HEADLINES[r.level] + ".", r.summary, "What to do now.", ...r.next].join(" ")));
  }

  /* ================= read aloud (on-device voices only) ================= */
  const speech = {
    available: false,
    voice: null,
    init() {
      if (!("speechSynthesis" in window)) return;
      const pick = () => {
        // Only voices that run on this device. Some browsers offer cloud voices that would send the text away.
        const voices = speechSynthesis.getVoices().filter((v) => v.localService && /^en/i.test(v.lang));
        this.voice = voices.find((v) => v.default) || voices[0] || null;
        const was = this.available;
        this.available = !!this.voice;
        if (this.available !== was && lastText) runCheck(false);
      };
      pick();
      speechSynthesis.addEventListener("voiceschanged", pick);
    },
    say(text) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = this.voice;
      u.rate = 0.95;
      speechSynthesis.speak(u);
    },
  };
  speech.init();

  /* ================= recover ================= */
  const planState = store.get("sl-plan", { selected: [], done: [] });
  function renderSituations() {
    $("#situations").innerHTML = SL.recovery.SITUATIONS.map((s) => `
      <div class="sit">
        <input type="checkbox" id="sit-${s.id}" value="${s.id}" ${planState.selected.includes(s.id) ? "checked" : ""}>
        <label for="sit-${s.id}"><span class="s-label">${esc(s.label)}</span><span class="s-hint">${esc(s.hint)}</span></label>
      </div>`).join("");
    for (const cb of $$("#situations input")) {
      cb.addEventListener("change", () => {
        planState.selected = $$("#situations input:checked").map((c) => c.value);
        store.set("sl-plan", planState);
        renderPlan();
      });
    }
  }
  function renderPlan() {
    const groups = SL.recovery.buildPlan(planState.selected);
    const el = $("#plan");
    if (!groups.length) {
      el.innerHTML = "";
      return;
    }
    const all = groups.flatMap((g) => g.steps);
    const doneCount = all.filter((s) => planState.done.includes(s.text)).length;
    el.innerHTML = `
      <section class="card" aria-labelledby="plan-h">
        <div class="plan-head">
          <h2 id="plan-h" class="m0">Your plan</h2>
          <div class="row no-print">
            <button class="btn ghost small" type="button" id="print-plan">Print</button>
            <button class="btn ghost small" type="button" id="reset-plan">Start over</button>
          </div>
        </div>
        <p class="small muted" id="plan-progress-label">${doneCount} of ${all.length} done. Saved on this device only.</p>
        <div class="progress" role="progressbar" aria-labelledby="plan-progress-label" aria-valuemin="0" aria-valuemax="${all.length}" aria-valuenow="${doneCount}"><span></span></div>
        ${groups.map((g) => `
          <div class="plan-group">
            <h3><span class="when-dot when-${g.when}" aria-hidden="true"></span>${esc(g.label)}</h3>
            ${g.steps.map((s, i) => {
              const id = `step-${g.when}-${i}`;
              const done = planState.done.includes(s.text);
              return `<label class="check-item ${done ? "done" : ""}" for="${id}"><input type="checkbox" id="${id}" data-text="${esc(s.text)}" ${done ? "checked" : ""}><span>${esc(s.text)}</span></label>`;
            }).join("")}
          </div>`).join("")}
      </section>`;
    // Set via the DOM: the security policy blocks inline style attributes.
    $(".progress span", el).style.width = (100 * doneCount) / all.length + "%";
    for (const cb of $$(".check-item input", el)) {
      cb.addEventListener("change", () => {
        const t = cb.dataset.text;
        planState.done = cb.checked ? planState.done.concat(t) : planState.done.filter((x) => x !== t);
        store.set("sl-plan", planState);
        const keep = cb.id;
        renderPlan();
        const again = document.getElementById(keep);
        if (again) again.focus();
      });
    }
    $("#print-plan").addEventListener("click", () => window.print());
    $("#reset-plan").addEventListener("click", () => {
      planState.selected = [];
      planState.done = [];
      store.set("sl-plan", planState);
      renderSituations();
      renderPlan();
    });
  }
  renderSituations();
  renderPlan();

  /* ================= practice ================= */
  const practice = { started: false, i: 0, results: [] };
  const ANSWER_LABELS = { scam: "Scam", real: "Looks real", verify: "I'd check first" };

  function renderPractice() {
    practice.started = true;
    const el = $("#practice");
    const items = SL.samples.PRACTICE;
    const dots = `<div class="dots" aria-hidden="true">${items.map((_, i) => `<span class="${practice.results[i] === true ? "right" : practice.results[i] === false ? "wrong" : ""} ${i === practice.i ? "current" : ""}"></span>`).join("")}</div>`;

    if (practice.i >= items.length) {
      const score = practice.results.filter(Boolean).length;
      el.innerHTML = `${dots}
        <section class="card center">
          <h2>Round complete</h2>
          <div class="score-big">${score}/${items.length}</div>
          <p>${score >= 8 ? "Excellent instincts. Share this with someone who'd find it useful." : score >= 5 ? "Good work. The tricky ones are the messages that could go either way: when unsure, check another way." : "These are hard, and scammers are good at their job. The habit that beats nearly every scam: pause, and check through a channel you trust."}</p>
          <button class="btn primary" type="button" id="practice-again">Play again</button>
        </section>`;
      $("#practice-again").addEventListener("click", () => {
        practice.i = 0;
        practice.results = [];
        renderPractice();
      });
      return;
    }

    const item = items[practice.i];
    el.innerHTML = `${dots}
      <p class="small muted center">Message ${practice.i + 1} of ${items.length}</p>
      <div class="phone" aria-label="Practice message">
        <div class="from">${esc(item.from)}</div>
        <div class="channel">${esc(item.channel)}</div>
        <div class="bubble">${esc(item.text)}</div>
      </div>
      <div class="answers" role="group" aria-label="Your answer">
        <button class="btn ghost" type="button" data-answer="scam">Scam <small>Don't engage</small></button>
        <button class="btn ghost" type="button" data-answer="real">Looks real <small>Normal message</small></button>
        <button class="btn ghost" type="button" data-answer="verify">I'd check first <small>Can't tell from this</small></button>
      </div>
      <div id="feedback" aria-live="polite"></div>`;
    for (const b of $$(".answers .btn", el)) b.addEventListener("click", () => answerPractice(b.dataset.answer, b));
  }

  function answerPractice(answer, btn) {
    const item = SL.samples.PRACTICE[practice.i];
    if (practice.results[practice.i] !== undefined) return;
    // "I'd check first" is never a bad answer on a scam: checking is exactly what keeps you safe.
    const right = answer === item.answer || (answer === "verify" && item.answer === "scam");
    practice.results[practice.i] = right;
    for (const b of $$(".answers .btn")) b.disabled = true;
    btn.classList.add("picked");
    const r = SL.analyzer.analyze(item.text);
    const title = right
      ? answer === item.answer ? "Right!" : "Good call. Checking first would keep you safe."
      : `Not quite. This one is best answered "${ANSWER_LABELS[item.answer]}".`;
    $("#feedback").innerHTML = `
      <section class="card feedback ${right ? "right" : "wrong"}">
        <h2 tabindex="-1" id="fb-h">${esc(title)}</h2>
        <p>${esc(item.why)}</p>
        ${r.tactics.length || r.links.length ? `<div class="message-view">${highlightHTML(item.text, r.highlights)}</div>
          <p class="small muted">Second Look's reading: <strong>${esc(SL.analyzer.HEADLINES[r.level])}</strong>${r.tactics.length ? ": " + esc(r.tactics.map((t) => t.name).join(", ")) : ""}.</p>`
          : '<p class="small muted">Second Look found no common warning signs in this one.</p>'}
        <button class="btn primary" type="button" id="practice-next">${practice.i + 1 < SL.samples.PRACTICE.length ? "Next message" : "See my score"}</button>
      </section>`;
    $("#fb-h").focus();
    $("#practice-next").addEventListener("click", () => {
      practice.i++;
      renderPractice();
      const first = $(".answers .btn");
      if (first) first.focus();
    });
  }

  /* ================= how it works ================= */
  let howRendered = false;
  function renderHow() {
    if (!howRendered) {
      $("#tactic-list").innerHTML = SL.analyzer.TACTICS.map((t) => `<li><span aria-hidden="true">${t.icon}</span> ${esc(t.name)}</li>`).join("") +
        "<li><span aria-hidden=\"true\">🔗</span> Links that hide or fake their destination</li>";
      $("#run-eval").addEventListener("click", () => renderEval(true));
      howRendered = true;
    }
    renderEval(false);
    updateOffline();
  }

  function score(rows) {
    let caught = 0, scams = 0, fp = 0, legit = 0;
    for (const r of rows) {
      const level = SL.analyzer.analyze(r.text).level;
      if (r.label === "scam") { scams++; if (level !== "few") caught++; } else { legit++; if (level !== "few") fp++; }
    }
    return { caught, scams, fp, legit };
  }

  function renderEval(flash) {
    const S = SL.samples;
    const tuning = S.EVAL.concat(S.PRACTICE.filter((p) => p.answer !== "verify").map((p) => ({ label: p.answer === "scam" ? "scam" : "legit", text: p.text })));
    const rows = [
      { name: "Tuning set", note: "Rules were built against these", s: score(tuning) },
      { name: "Round 1 (new messages)", note: "First blind score: 36% caught, 10% false alarms. Then used to fix gaps.", s: score(S.HOLDOUT) },
      { name: "Round 2 (new messages)", note: "First blind score: 40% caught, 8% false alarms. Then used to fix gaps.", s: score(S.HOLDOUT2) },
      { name: "Round 3 (new messages)", note: "Scored once, frozen, never tuned. This is the honest number.", s: score(S.HOLDOUT3), quoted: true },
    ];
    const pct = (a, b) => Math.round((100 * a) / b) + "%";
    $("#eval-table").innerHTML = `
      <div class="table-scroll"><table class="eval">
        <thead><tr><th scope="col">Test set</th><th scope="col">Scams caught</th><th scope="col">Normal messages flagged</th></tr></thead>
        <tbody>${rows.map((r) => `
          <tr class="${r.quoted ? "quoted" : ""}">
            <td><strong>${r.name}</strong><br><span class="small muted">${r.note}</span></td>
            <td class="num">${r.s.caught}/${r.s.scams} (${pct(r.s.caught, r.s.scams)})</td>
            <td class="num">${r.s.fp}/${r.s.legit} (${pct(r.s.fp, r.s.legit)})</td>
          </tr>`).join("")}</tbody>
      </table></div>
      ${flash ? `<p class="status" role="status">Re-ran ${tuning.length + S.HOLDOUT.length + S.HOLDOUT2.length + S.HOLDOUT3.length} messages on this device just now.</p>` : ""}`;
  }

  /* ================= privacy proof & offline ================= */
  let afterLoad = 0;
  window.addEventListener("load", () => {
    const base = performance.getEntriesByType("resource").length;
    const update = () => {
      afterLoad = performance.getEntriesByType("resource").length - base;
      $("#req-count").textContent = String(afterLoad);
    };
    update();
    if ("PerformanceObserver" in window) {
      try { new PerformanceObserver(update).observe({ type: "resource", buffered: false }); } catch (e) { /* older browsers */ }
    }
  });

  function updateOffline() {
    const el = $("#offline-status");
    if (location.protocol === "file:") el.textContent = "Open it from a web address to save for offline use";
    else if (!("serviceWorker" in navigator)) el.textContent = "Not supported in this browser";
    else if (navigator.serviceWorker.controller) el.textContent = "Yes, saved on this device";
    else el.textContent = "Getting ready… (reload once)";
  }

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").then(() => updateOffline()).catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", updateOffline);
  }

  /* ================= share target (Android "Share to Second Look") ================= */
  (function readShared() {
    const params = new URLSearchParams(location.search);
    const shared = [params.get("title"), params.get("text"), params.get("url")].filter(Boolean).join("\n");
    if (!shared) return;
    // Remove the message from the address bar and history straight away.
    history.replaceState(null, "", location.pathname + "#check");
    msg.value = shared;
  })();

  route();
  if (msg.value) runCheck(true);
})();
