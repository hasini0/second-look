/*
 * Second Look — link X-ray.
 * Finds links in a message and explains where they really go, WITHOUT opening them.
 * Pure functions, no network. Works in the browser (window.SecondLook) and in Node (require).
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === "object" && module.exports) module.exports = mod;
  else (root.SecondLook = root.SecondLook || {}).links = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Brands that scammers impersonate most, with the domains they really use.
  const BRANDS = [
    { name: "PayPal", key: "paypal", domains: ["paypal.com", "paypal.me"] },
    { name: "Amazon", key: "amazon", domains: ["amazon.com", "amazon.co.uk", "amazon.ca", "amazon.in", "amazon.de", "amzn.to", "a.co"] },
    { name: "Apple", key: "apple", domains: ["apple.com", "icloud.com"] },
    { name: "Microsoft", key: "microsoft", domains: ["microsoft.com", "live.com", "outlook.com", "office.com"] },
    { name: "Netflix", key: "netflix", domains: ["netflix.com"] },
    { name: "Google", key: "google", domains: ["google.com", "youtube.com", "goo.gl"] },
    { name: "USPS", key: "usps", domains: ["usps.com"] },
    { name: "FedEx", key: "fedex", domains: ["fedex.com"] },
    { name: "UPS", key: "ups", domains: ["ups.com"] },
    { name: "DHL", key: "dhl", domains: ["dhl.com"] },
    { name: "the IRS", key: "irs", domains: ["irs.gov"] },
    { name: "Social Security", key: "ssa", domains: ["ssa.gov"] },
    { name: "Chase", key: "chase", domains: ["chase.com"] },
    { name: "Wells Fargo", key: "wellsfargo", domains: ["wellsfargo.com"] },
    { name: "Bank of America", key: "bankofamerica", domains: ["bankofamerica.com", "bofa.com"] },
    { name: "Coinbase", key: "coinbase", domains: ["coinbase.com"] },
    { name: "Venmo", key: "venmo", domains: ["venmo.com"] },
    { name: "Facebook", key: "facebook", domains: ["facebook.com", "fb.com", "meta.com"] },
    { name: "Instagram", key: "instagram", domains: ["instagram.com"] },
    { name: "WhatsApp", key: "whatsapp", domains: ["whatsapp.com", "wa.me"] },
    { name: "Steam", key: "steam", domains: ["steampowered.com", "steamcommunity.com"] },
    { name: "Roblox", key: "roblox", domains: ["roblox.com"] },
    { name: "E-ZPass", key: "ezpass", domains: ["e-zpassny.com", "ezpassnj.com", "e-zpassiag.com"] },
  ];

  const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "rb.gy", "shorturl.at", "rebrand.ly", "tiny.cc", "s.id", "t.ly", "bl.ink", "short.io"];

  // TLDs that are cheap and disproportionately used in throwaway scam sites.
  // Being on this list is a weak hint, never proof.
  const RISKY_TLDS = ["top", "xyz", "icu", "click", "zip", "mov", "cfd", "sbs", "rest", "buzz", "monster", "cyou", "quest", "support", "live", "info", "shop", "online", "site", "vip", "tk", "ml", "ga", "cf", "gq"];

  // Second-level suffixes where the "registrable" domain has three labels (example.co.uk).
  const MULTI_PART_SUFFIXES = ["co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "net.au", "co.in", "co.nz", "com.br", "co.jp", "com.mx", "co.za"];

  const TLD_RE = "[a-z]{2,24}|xn--[a-z0-9-]{2,30}";
  // Catches http(s) links, www. links, and bare domains like "paypal-secure.com/login".
  const URL_RE = new RegExp(
    "(?:https?:\\/\\/|hxxps?:\\/\\/)[^\\s<>\"']+" +
      "|\\bwww\\.[^\\s<>\"']+" +
      "|(?<![@\\w.-])(?:[a-z0-9\\u00a1-\\uffff](?:[a-z0-9\\u00a1-\\uffff-]{0,61}[a-z0-9\\u00a1-\\uffff])?\\.)+(?:" + TLD_RE + ")(?::\\d{2,5})?(?:\\/[^\\s<>\"']*)?(?![\\w@])",
    "giu"
  );

  // Words that look like domains but almost never are, in normal messages.
  const NOT_DOMAINS = /^(?:e\.g|i\.e|a\.m|p\.m|u\.s|etc|vs|mr|mrs|dr|st|no)\.?$/i;
  const KNOWN_TLDS = new Set(("com net org gov edu mil io co uk us ca au in de fr es it nl jp cn ru br me tv ly gl to app dev ai info biz shop online site live top xyz icu click zip mov cfd sbs rest buzz monster cyou quest support vip tk ml ga cf gq ws cc ch se no fi pl be at ie nz za mx").split(" "));

  // Digits and Cyrillic/Greek letters that pass for Latin ones at a glance.
  const HOMOGLYPHS = { "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ӏ": "l", "ј": "j", "ѕ": "s", "ο": "o", "α": "a", "ν": "v", "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "|": "l" };

  function trimTrailing(raw) {
    // Sentence punctuation after a link is not part of the link.
    let s = raw.replace(/[.,;:!?)\]}'"»”’]+$/u, "");
    // Keep a closing paren if the URL opened one, e.g. wikipedia links.
    if (raw.length > s.length && raw[s.length] === ")" && s.includes("(")) s += ")";
    return s;
  }

  function normalizeForCompare(label) {
    let s = label.toLowerCase().replace(/rn/g, "m").replace(/vv/g, "w");
    s = s.replace(/[0-9@$|\u0370-\u04ff]/g, (c) => HOMOGLYPHS[c] || c);
    return s.replace(/[-_.]/g, "");
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  const isIPv4 = (host) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  const isIPv6 = (host) => /^\[[0-9a-f:.]+\]$/i.test(host);

  function registrableDomain(host) {
    if (isIPv4(host) || isIPv6(host)) return host; // a raw address has no "website name" to shorten to
    const labels = host.split(".");
    if (labels.length <= 2) return host;
    const lastTwo = labels.slice(-2).join(".");
    if (MULTI_PART_SUFFIXES.includes(lastTwo)) return labels.slice(-3).join(".");
    return lastTwo;
  }

  function isOfficial(host, brand) {
    return brand.domains.some((d) => host === d || host.endsWith("." + d));
  }

  function parseLink(raw) {
    let text = trimTrailing(raw);
    let candidate = text.replace(/^hxxp/i, "http");
    if (!/^https?:\/\//i.test(candidate)) candidate = "http://" + candidate;
    let url;
    try {
      url = new URL(candidate);
    } catch (e) {
      return null;
    }
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    const tld = host.split(".").pop();
    // Bare words like "e.g." are not links; bare domains need a TLD we recognise.
    if (!/^https?:\/\//i.test(text) && !/^www\./i.test(text)) {
      if (NOT_DOMAINS.test(text)) return null;
      if (!KNOWN_TLDS.has(tld) && !tld.startsWith("xn--")) return null;
    }
    return { text, url, host, tld, explicitScheme: /^https?:\/\//i.test(text) ? url.protocol.replace(":", "") : null };
  }

  /**
   * Explain one link. Returns { text, host, domain, findings: [{id, severity, title, detail}], brand }.
   * severity: "high" | "medium" | "low" | "info"
   */
  function inspect(raw) {
    const parsed = parseLink(raw);
    if (!parsed) return null;
    const { text, url, host, tld, explicitScheme } = parsed;
    const findings = [];
    const domain = registrableDomain(host);
    // Original Unicode host (URL() converts to punycode; we want to show what the reader sees).
    const shownHostMatch = text.replace(/^(?:hxxps?|https?):\/\//i, "").match(/^[^\/:?#]+/);
    const shownHost = shownHostMatch ? shownHostMatch[0].toLowerCase() : host;

    if (/[^\x00-\x7f]/.test(shownHost) || host.split(".").some((l) => l.startsWith("xn--"))) {
      findings.push({
        id: "punycode", severity: "high",
        title: "Uses look-alike letters",
        detail: `This address contains special characters that can imitate normal letters. Behind the scenes it is really "${host}".`,
      });
    }

    if (isIPv4(host) || isIPv6(host)) {
      findings.push({ id: "ip", severity: "high", title: "No company name at all", detail: "The link goes to a raw number address (an IP address). Real companies almost always use their name." });
    }

    if (url.username || url.password || /^[^\/]*@/.test(text.replace(/^https?:\/\//i, ""))) {
      findings.push({ id: "at-sign", severity: "high", title: "Hides the real destination", detail: `Everything before the "@" is ignored by your browser. The link actually goes to "${host}".` });
    }

    if (SHORTENERS.includes(host)) {
      findings.push({ id: "shortener", severity: "medium", title: "Destination is hidden", detail: `${host} is a link shortener, so you can't see where it really leads. Companies rarely use these for account or payment messages.` });
    }

    let brand = null;
    let officialBrand = null;
    const shownDomain = registrableDomain(shownHost);
    const domainLabel = (/^[^\x00-\x7f]*$/.test(shownDomain) ? domain : shownDomain).split(".")[0];
    // Compare per word so "purchase" doesn't look like "chase" and "pineapple" doesn't look like "apple".
    const hostTokens = shownHost.split(/[.-]/).map(normalizeForCompare);
    const PREFIXES = /^(?:secure|my|login|signin|verify|account|support|help|www|online|update|service|auth|id)/;
    const tokenHasBrand = (key) =>
      hostTokens.some((t) => t === key || t.startsWith(key) || (t.endsWith(key) && PREFIXES.test(t.slice(0, t.length - key.length))));
    for (const b of BRANDS) {
      if (isOfficial(host, b)) {
        officialBrand = b;
        break;
      }
    }
    if (!officialBrand) {
      for (const b of BRANDS) {
        const keyNorm = b.key;
        const containsName = keyNorm.length >= 4 && tokenHasBrand(keyNorm);
        const distance = levenshtein(normalizeForCompare(domainLabel), keyNorm);
        const nearMiss = keyNorm.length >= 5 && distance > 0 && distance <= (keyNorm.length >= 8 ? 2 : 1);
        const digitSwap = normalizeForCompare(domainLabel) === keyNorm && domainLabel !== keyNorm;
        if (containsName || nearMiss || digitSwap) {
          brand = b;
          const where = host.indexOf(b.key) !== -1 && host.indexOf(b.key) < host.length - domain.length ? "at the start of the address" : "in the address";
          findings.push({
            id: "brand-mismatch", severity: "high",
            title: `Pretends to be ${b.name}`,
            detail: containsName && !digitSwap
              ? `"${b.key}" appears ${where}, but the website is really "${domain}", which is not owned by ${b.name}. ${b.name}'s real site is ${b.domains[0]}.`
              : `"${domain}" is spelled to look like ${b.domains[0]}, but it is a different website.`,
          });
          break;
        }
      }
    }

    const subdomainDepth = host.split(".").length - domain.split(".").length;
    if (subdomainDepth >= 3) {
      findings.push({ id: "deep-subdomain", severity: "medium", title: "Unusually long address", detail: `The address has many parts before the real website name (${domain}). This trick pushes the real name out of view on small screens.` });
    }

    if (RISKY_TLDS.includes(tld) && !officialBrand) {
      findings.push({ id: "risky-tld", severity: "low", title: `Ends in ".${tld}"`, detail: `".${tld}" addresses are cheap and often used for short-lived scam sites. Plenty of honest sites use it too. On its own this means little.` });
    }

    if ((domainLabel.match(/-/g) || []).length >= 2 && !officialBrand && !domainLabel.startsWith("xn--")) {
      findings.push({ id: "hyphens", severity: "low", title: "Lots of hyphens", detail: "Names like secure-account-update are common in fake login pages." });
    }

    if (explicitScheme === "http" && !officialBrand) {
      findings.push({ id: "no-https", severity: "low", title: "Not encrypted", detail: "This link starts with http:// instead of https://. Never type a password or card number on a page like that." });
    }

    if (/(?:login|signin|verify|secure|update|account|wallet|unlock|confirm|billing|reset)/i.test(url.pathname + url.search) && !officialBrand) {
      findings.push({ id: "login-path", severity: "low", title: "Leads to a login or payment page", detail: "The link goes straight to a sign-in or billing page. Fake pages often copy the real one perfectly." });
    }

    if (officialBrand) {
      findings.push({ id: "official", severity: "info", title: `Matches ${officialBrand.name}'s real website`, detail: `The domain is ${domain}. Real addresses can still be misused, so open the official app or type the address yourself rather than tapping.` });
    }

    return { text, host, shownHost, domain, brand: brand || officialBrand, official: !!officialBrand, findings };
  }

  /** Find every link in a message, with its position. */
  function find(message) {
    const out = [];
    URL_RE.lastIndex = 0;
    let m;
    while ((m = URL_RE.exec(message))) {
      const report = inspect(m[0]);
      if (!report) continue;
      out.push({ start: m.index, end: m.index + report.text.length, ...report });
    }
    return out;
  }

  return { find, inspect, registrableDomain, levenshtein, BRANDS };
});
