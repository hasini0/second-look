/*
 * Second Look — "I think I already fell for it" recovery plan.
 * Turns what happened into an ordered checklist: the steps that limit damage fastest come first.
 * General guidance only. Pass a region from js/regions.js to get that country's reporting steps.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === "object" && module.exports) module.exports = mod;
  else (root.SecondLook = root.SecondLook || {}).recovery = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const SITUATIONS = [
    { id: "clicked", label: "I tapped or clicked a link", hint: "but didn't type anything" },
    { id: "password", label: "I typed a password on a page", hint: "or signed in through the link" },
    { id: "code", label: "I shared a security code", hint: "a one-time code from a text, email or app" },
    { id: "card", label: "I gave card or bank details", hint: "card number, CVV, account or routing number" },
    { id: "paid", label: "I sent money", hint: "bank transfer, Zelle, Venmo, Cash App, wire" },
    { id: "giftcard", label: "I paid with gift cards or crypto", hint: "or read out gift card numbers" },
    { id: "remote", label: "I let them control my device", hint: "installed an app like AnyDesk or TeamViewer" },
    { id: "identity", label: "I gave personal ID details", hint: "SSN, date of birth, passport, driver's license" },
    { id: "replied", label: "I only replied or talked to them", hint: "and didn't share anything else" },
  ];

  // when: "now" (next 15 minutes), "today", "week"
  const STEPS = {
    remote: [
      { when: "now", text: "Disconnect the device from the internet (turn off Wi-Fi or unplug the cable). This cuts off their access." },
      { when: "now", text: "Uninstall the remote-access app they asked you to install." },
      { when: "today", text: "From a different, trusted device, change the passwords for your email and bank." },
      { when: "today", text: "Run a security scan, or ask a trusted local repair shop to check the device." },
    ],
    code: [
      { when: "now", text: "Sign in to the account the code was for and change its password. If you can't sign in, use the account's \"forgot password\" or recovery page." },
      { when: "now", text: "In that account's security settings, sign out of all other devices and check for recovery emails or phone numbers you don't recognise." },
      { when: "today", text: "Turn on two-step verification with an authenticator app if you can, and tell friends not to trust odd messages from that account." },
    ],
    password: [
      { when: "now", text: "Change that password now, on the real website or app (type the address yourself)." },
      { when: "now", text: "If you used the same password anywhere else, change it there too, starting with your email." },
      { when: "today", text: "Turn on two-step verification for that account and your email." },
    ],
    card: [
      { when: "now", text: "Call your bank using the number on the back of your card or in its app. Say the card details were stolen and ask them to block or replace the card." },
      { when: "today", text: "Go through recent transactions with the bank and dispute any you don't recognise." },
      { when: "week", text: "Keep checking statements for a few weeks. Small test charges often come first." },
    ],
    paid: [
      { when: "now", text: "Call your bank or payment app right away (the number in its app or on your card). Ask them to stop or recall the payment and report it as fraud. Speed matters." },
      { when: "today", text: "Write down what happened: amounts, dates, usernames, phone numbers, and keep screenshots." },
    ],
    giftcard: [
      { when: "now", text: "Contact the gift card company using the number on the card or its website, tell them it was used in a scam, and ask if the funds can be frozen. Keep the cards and receipts." },
      { when: "now", text: "For crypto, contact the exchange or ATM operator you used and report the transaction. Save the wallet address and transaction ID." },
    ],
    identity: [
      { when: "today", text: "Freeze your credit with each credit bureau. It's free and stops new accounts being opened in your name." },
      { when: "today", text: "In the US, make a recovery plan at IdentityTheft.gov." },
      { when: "week", text: "Check your credit reports for accounts you didn't open." },
    ],
    clicked: [
      { when: "now", text: "Close the page. If something downloaded, don't open it; delete it." },
      { when: "today", text: "Update your phone or computer and browser. Updates fix the weaknesses that bad pages try to use." },
    ],
    replied: [
      { when: "now", text: "Stop replying. Block the number or account. Replying confirms your number is active, so expect more scam messages for a while." },
    ],
  };

  const ALWAYS = [
    { when: "today", text: "Report it. In the US: ReportFraud.ftc.gov (and ic3.gov for online crime). Elsewhere, your national fraud or cybercrime reporting service. Reports help stop the same scammer reaching others." },
    { when: "week", text: "Expect follow-up scams, like 'recovery services' that promise to get your money back for a fee. Those are scams too." },
    { when: "week", text: "Tell someone you trust what happened. Scams are designed by professionals; falling for one doesn't make you foolish." },
  ];

  const WHEN_LABELS = { now: "Right now (next 15 minutes)", today: "Today", week: "Over the next few days" };

  /**
   * Build an ordered plan for the selected situation ids.
   * `region` (optional, an entry from js/regions.js) swaps the US-flavoured reporting and identity
   * steps for that country's services.
   */
  function buildPlan(selected, region) {
    const order = ["remote", "code", "password", "card", "paid", "giftcard", "identity", "clicked", "replied"];
    const picked = order.filter((id) => selected.includes(id));
    const seen = new Set();
    const groups = { now: [], today: [], week: [] };
    const add = (step, source) => {
      if (seen.has(step.text)) return;
      seen.add(step.text);
      groups[step.when].push({ id: source + ":" + groups[step.when].length, text: step.text, source });
    };
    const local = (step) => {
      if (!region) return step;
      if (step === ALWAYS[0]) {
        // Some helplines can freeze stolen money if called within the first hours (urgentReport).
        const lostMoney = picked.some((id) => id === "paid" || id === "card" || id === "giftcard");
        return { when: region.urgentReport && lostMoney ? "now" : "today", text: "Report it. " + region.report.join(" ") + " Reports help stop the same scammer reaching others." };
      }
      if (step === STEPS.identity[1]) return { when: "today", text: region.identity };
      if (step === STEPS.identity[0]) return null; // the country's identity step covers this (credit freezes are US-specific)
      return step;
    };
    for (const id of picked) for (const step of STEPS[id]) { const s = local(step); if (s) add(s, id); }
    if (picked.length) for (const step of ALWAYS) add(local(step), "always");
    return ["now", "today", "week"].filter((w) => groups[w].length).map((w) => ({ when: w, label: WHEN_LABELS[w], steps: groups[w] }));
  }

  return { SITUATIONS, buildPlan };
});
