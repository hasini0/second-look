/*
 * Second Look — redaction for "Ask someone I trust".
 * Masks the personal details in a message so it can be shown to a friend or family member
 * without passing on codes, account numbers, contact details or names.
 * The person can still edit the result before sharing: this is a best effort, not a guarantee.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === "object" && module.exports) module.exports = mod;
  else (root.SecondLook = root.SecondLook || {}).redact = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const RULES = [
    { label: "card or account number", tag: "[card/account number]", re: /\b(?:\d[ -]?){12,18}\d\b/g },
    { label: "phone number", tag: "[phone number]", re: /(?<![\w$£€.,])\+?\(?\d[\d\s().-]{7,}\d\b/g },
    { label: "last digits", tag: "ending in [digits]", re: /\b(?:ending|ends) (?:in|with) \d{2,6}\b/gi },
    { label: "code", tag: "[code]", re: /(?<=\b(?:code|otp|pin|passcode)\b[^.\n]{0,20}?)\b\d{4,8}\b|\b\d{4,8}\b(?=[^.\n]{0,20}\b(?:is your|code|otp|pin)\b)/gi },
    { label: "number", tag: "[number]", re: /(?<![\w$£€.,])\d{5,}(?![\w,]|\.\d)/g },
    { label: "reference", tag: "[reference]", re: /\b(?=[A-Z0-9-]*\d{3})(?=[A-Z0-9-]*[A-Z])[A-Z0-9][A-Z0-9-]{5,}\b/g },
    { label: "street address", tag: "[address]", re: /\b\d{1,5}\s+(?:[A-Z][a-z]+\s){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Boulevard|Blvd|Drive|Dr|Court|Ct|Way|Place|Pl)\b/g },
    { label: "name", tag: "$1[name]", re: /\b((?:Hi|Hello|Hey|Dear|Attn:?)\s+)([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/g, group: true,
      // Greetings like "Dear Customer" or "Hi Mum" aren't names.
      keep: /^(?:customer|user|client|member|sir|madam|mum|mom|dad|there|all|friend|valued|account|team|everyone|folks)\b/i },
  ];

  /**
   * Returns { text, removed: [{label, count}] }.
   * Links keep their website name (which is what a helper needs to judge them)
   * but lose the path and query, where tracking IDs and personal tokens live.
   */
  function redact(input) {
    let text = String(input || "");
    const vault = [];
    const counts = {};
    const bump = (label) => (counts[label] = (counts[label] || 0) + 1);

    text = text.replace(/\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g, () => (bump("email address"), "[email]"));

    // Protect links next so their digits aren't mistaken for phone numbers.
    text = text.replace(/\b(?:https?:\/\/|hxxps?:\/\/|www\.)[^\s<>"']+|\b(?:[a-z0-9-]+\.)+(?:com|net|org|info|top|xyz|icu|click|live|shop|online|site|support|co|io|ly|me|us|uk|vip)(?:\/[^\s<>"']*)?/gi, (m) => {
      const trailing = (m.match(/[.,;:!?)]+$/) || [""])[0];
      const link = m.slice(0, m.length - trailing.length);
      const cut = link.match(/^((?:\w+:\/\/)?[^\/?#]+)([\/?#].*)?$/);
      let safe = link;
      if (cut && cut[2] && cut[2].length > 1) {
        safe = cut[1] + "/…";
        bump("link details");
      }
      vault.push(safe);
      return "\u0000" + (vault.length - 1) + "\u0000" + trailing;
    });

    for (const rule of RULES) {
      text = text.replace(rule.re, (...args) => {
        if (rule.keep && rule.keep.test(args[2])) return args[0];
        bump(rule.label);
        return rule.group ? rule.tag.replace("$1", args[1]) : rule.tag;
      });
    }

    text = text.replace(/\u0000(\d+)\u0000/g, (_, i) => vault[Number(i)]);
    const removed = Object.entries(counts).map(([label, count]) => ({ label, count }));
    return { text, removed };
  }

  return { redact };
});
