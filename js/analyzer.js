/*
 * Second Look — message analyzer.
 * Looks for the persuasion tactics scams depend on, explains them in plain language,
 * and suggests a safe next step. Runs entirely on-device; no network, no AI service.
 *
 * Design rule: we never say a message is "safe". The best we can say is that we
 * didn't spot the usual signs.
 */
(function (root, factory) {
  const links = typeof module === "object" && module.exports ? require("./links.js") : root.SecondLook.links;
  const mod = factory(links);
  if (typeof module === "object" && module.exports) module.exports = mod;
  else root.SecondLook.analyzer = mod;
})(typeof self !== "undefined" ? self : this, function (links) {
  "use strict";

  const NEGATION = /\b(?:never|not|don'?t|do not|won'?t|will not|no one|nobody|cannot|can'?t)\b[^.!?\n]{0,25}$/i;

  // Each tactic: what it is, why scammers use it, and the phrases that give it away.
  // Weights are rough: how much the tactic, on its own, should raise concern.
  const TACTICS = [
    {
      id: "code", name: "Asks for a security code", weight: 5, icon: "🔑",
      plain: "Security codes are the key to your account. No real company, bank or friend will ever ask you to send one. Anyone who asks wants to get into your account.",
      patterns: [
        /\b(?:send(?:ing)?|shar(?:e|ing)|tell(?:ing)?|giv(?:e|ing)|read(?:ing)?|forward(?:ing)?|reply(?:ing)? with|text(?:ing)?|provid(?:e|ing)|confirm(?:ing)?)\b[^.!?\n]{0,40}\b(?:code|otp|one[- ]time (?:pass(?:code|word)|pin)|verification number|passcode)\b/gi,
        /\b(?:code|otp|passcode)\b[^.!?\n]{0,50}\b(?:send|share|give|tell|forward)\b[^.!?\n]{0,10}\b(?:it )?(?:to |back to )?(?:me|us)\b/gi,
        /\bsent (?:you )?(?:a|the|my) (?:\d[- ]digit )?code (?:to (?:you|your phone|your number) )?by mistake\b|\bcode (?:i|we) (?:just )?sent (?:to )?you\b/gi,
      ],
      negatable: true,
    },
    {
      id: "remote", name: "Wants control of your device", weight: 4, icon: "🖥️",
      plain: "Remote-access apps let a stranger see and control your screen, including your bank. Real support teams don't contact you out of the blue and ask you to install one.",
      patterns: [
        /\b(?:anydesk|teamviewer|ultraviewer|logmein|rustdesk|quick ?assist)\b/gi,
        /\bremote (?:access|support|desktop|control|session)\b/gi,
        /\b(?:download|install)\b[^.!?\n]{0,30}\b(?:app|software|program)\b[^.!?\n]{0,30}\b(?:to (?:fix|secure|protect|remove|stop|cancel|refund))\b/gi,
        /\bscreen ?shar(?:e|ing)\b/gi,
      ],
    },
    {
      id: "payment", name: "Unusual way to pay", weight: 3, icon: "💳",
      plain: "Gift cards, crypto, wire transfers and payment apps are like cash: once sent, the money is almost impossible to get back. That's exactly why scammers ask for them.",
      patterns: [
        /\b(?:(?:itunes|apple|google ?play|steam|amazon|target|walmart|ebay|razer|vanilla)\s+)?gift ?cards?\b/gi,
        /\b(?:bitcoin|btc|crypto(?:currency)?|usdt|tether|ethereum|eth wallet|bitcoin atm|crypto atm)\b/gi,
        /\b(?:wire transfer|western union|moneygram|prepaid (?:debit )?card)\b/gi,
        /\b(?:send|pay|transfer)\b[^.!?\n]{0,25}\b(?:zelle|cash ?app|venmo|paypal friends)\b/gi,
        /\b(?:processing|release|upfront|up-front|activation|unlock|clearance|administration|admin|insurance|registration) fees?\b|\bpay\b[^.!?\n]{0,25}\bfee first\b/gi,
        /\bpay (?:a |the )?(?:small |one[- ]time |processing |release |verification )fee\b/gi,
      ],
    },
    {
      id: "credentials", name: "Asks for private information", weight: 3, icon: "🪪",
      plain: "Your password, card details and ID numbers are what scammers are after. Real companies don't ask you to confirm them by message or through a link.",
      patterns: [
        /\b(?:confirm|verify|update|validate|re-?enter|provide|enter|send|submit|give us|share)\b\s+(?:your\s+|us\s+your\s+)?(?:(?:bank|banking|online|account|email|full)\s+){0,2}(?:password|user ?name|log-?in(?: details| info)?|credentials|account (?:details|information|info)|bank(?:ing)? (?:details|information|info)|card (?:details|number|info)|payment (?:details|information|info|method)|billing (?:details|information|info)|ssn|social security(?: number)?|date of birth|identity|personal (?:details|information)|pin|(?:medicare|medicaid|insurance|member|policy|passport|driver'?s licen[cs]e|tax) (?:number|id))\b/gi,
        /\b(?:ssn|social security number|mother'?s maiden name|routing number)\b/gi,
        /\b(?:all|every) (?:users?|customers?|members?|accounts?) (?:must|need to|are required to) (?:re-?verify|re-?confirm|re-?validate|update)\b|\bmust re-?verify\b/gi,
      ],
    },
    {
      id: "money", name: "Asks you to send or move money", weight: 2.5, icon: "💰",
      plain: "Whatever the story, this message ends with you sending money. Check the story another way first. Money sent by transfer or app is very hard to get back.",
      patterns: [
        /\b(?:send|wire|transfer|move|deposit|pay|lend|loan|forward)\b(?: me| us| it)?[^.!?\n]{0,30}?(?:[$£€]\s?\d[\d,.]*|\b\d[\d,.]*\s?(?:dollars|pounds|euros|usd|btc|eth)\b|\b(?:your )?(?:savings|funds|money|rent|balance|deposit|payment)\b)/gi,
        /\bcan you (?:wire|send|lend|transfer|cover)\b/gi,
      ],
    },
    {
      id: "newdetails", name: "Payment details have \"changed\"", weight: 3.5, icon: "🏦",
      plain: "'We changed banks, please pay the new account' is how scammers redirect rent, invoices and salaries. Confirm by calling the person on a number you already know.",
      patterns: [
        /\b(?:changed|switched|new|updated|different) (?:banks?|bank (?:account|details)|account details|payment (?:details|instructions)|account number)\b|\bto the new account\b/gi,
        /\b(?:deposit|cash) (?:the|this|my) (?:attached )?(?:check|cheque)\b|\bprotected account\b|\bsafe (?:account|wallet)\b/gi,
        /\b(?:verify|confirm|upgrade) your (?:email|account) to (?:receive|accept|release)\b/gi,
      ],
    },
    {
      id: "overpay", name: "Overpays, then wants the difference back", weight: 3.5, icon: "🔁",
      plain: "Paying you too much and asking you to send back the extra is a classic trick. Their check or payment bounces days later, but the money you sent is gone for good.",
      patterns: [
        /\b(?:cashier'?s check|money order|certified check)[^.!?\n]{0,40}\b(?:more than|over|extra|above)\b/gi,
        /\bsend (?:me |us |back )?(?:the )?(?:difference|extra|rest|balance|change)(?: back)?\b/gi,
        /\b(?:overpaid|overpayment|paid (?:you )?too much)\b/gi,
      ],
    },
    {
      id: "secrecy", name: "Asks you to keep it secret", weight: 3, icon: "🤫",
      plain: "Scammers isolate you so nobody can warn you. A real bank, agency or family member won't tell you to hide something from the people who would help.",
      patterns: [
        /\bdon'?t tell (?:anyone|anybody|your|the bank|mom|mum|dad)\b/gi,
        /\bkeep (?:this|it) (?:between us|(?:a )?secret|confidential|private|to yourself)\b/gi,
        /\bdo not (?:contact|call|tell|inform) (?:the bank|anyone|anybody|your (?:family|bank)|the police)\b/gi,
        /\bdon'?t (?:hang up|talk to anyone)\b/gi,
      ],
    },
    {
      id: "family", name: "\"Family member\" on a new number", weight: 2.5, icon: "👪",
      plain: "A message from a 'son', 'daughter' or 'grandchild' on an unknown number who suddenly needs money is one of the most common scams. Call them on the number you already have.",
      patterns: [
        /\b(?:hi|hey|hello) (?:mum|mom|dad|mama|papa|grandma|grandpa|nana|gran)\b/gi,
        /\b(?:my )?new (?:phone )?number\b/gi,
        /\b(?:lost|broke|dropped|smashed) my phone\b|\bphone (?:is )?(?:broken|dead|lost)\b/gi,
        /\bi'?m in (?:trouble|jail|hospital|the hospital|a bit of trouble)\b/gi,
      ],
    },
    {
      id: "job", name: "Easy money offer", weight: 2.5, icon: "💸",
      plain: "Unrequested job offers with high pay for simple tasks, and investments with 'guaranteed' returns, are designed to get you to send money first.",
      patterns: [
        /\b(?:earn|make)\s+(?:up to\s+)?\$?\d[\d,]*\+?\s*(?:usd|dollars)?\s*(?:per|a|\/|each)\s*(?:day|hour|week)\b/gi,
        /\bwork(?:ing)? from home\b|\b(?:part[- ]time|remote|online) (?:job|position|role|work)\b/gi,
        /\b(?:guaranteed|high|daily|fixed) (?:returns?|profits?|income)\b|\binvestment opportunity\b|\bdouble your (?:money|bitcoin|crypto|investment)\b/gi,
        /\b(?:simple|easy) (?:online )?tasks?\b|\byou(?:'ve| have) been (?:hired|recommended|shortlisted)\b/gi,
        /\bdata entry (?:job|role|position|work)\b|\b(?:found|saw|came across|reviewed) your (?:resume|cv|profile)\b/gi,
      ],
    },
    {
      id: "threat", name: "Scares you", weight: 2, icon: "⚠️",
      plain: "Fear makes people act fast without checking. Threats of locked accounts, arrests, fines or lawsuits are a classic way to rush you.",
      patterns: [
        /\b(?:has been|have been|will be|is being|may be|could be|are being)\s+(?:permanently\s+)?(?:suspended|locked|closed|blocked|disabled|frozen|terminated|deactivated|restricted|cancell?ed|deleted|erased|removed|flagged|compromised)\b/gi,
        /\b(?:account|card|access|service|number|profile|license|licence|wallet|order|payment)\s+(?:is |was )?(?:permanently\s+)?(?:suspended|locked|blocked|disabled|frozen|terminated|deactivated|restricted|on hold|flagged|compromised|under review)\b/gi,
        /\b(?:legal action|arrest(?:ed)?|warrant|lawsuit|prosecut(?:e|ed|ion)|deport(?:ed|ation)?|jail|criminal charges)\b/gi,
        /\b(?:fined|penalt(?:y|ies)|late fees?)\b/gi,
        /\bfailure to (?:do so|comply|respond|verify|act) (?:will|may|could) result in\b/gi,
        /\b(?:suspicious|unusual|unauthori[sz]ed) (?:activity|sign-?in|log-?in|transaction|charge|purchase|access)\b/gi,
      ],
    },
    {
      id: "prize", name: "Too good to be true", weight: 2, icon: "🎁",
      plain: "Surprise prizes, refunds and free gifts are bait. If you didn't enter, you didn't win, and real refunds don't need you to 'claim' them through a link.",
      patterns: [
        /\bcongratulations\b|\bgiving away\b|\bgiveaway\b|\bextended warranty\b|\b(?:you are|you're) (?:due|owed|entitled to)\b|\byou(?:'ve| have)? (?:won|been selected|been chosen)\b|\b(?:prize|lottery|sweepstakes|jackpot|inheritance)\b/gi,
        /\bunclaimed (?:funds|money|refund|package)\b|\bfree (?:gift|iphone|money|cash|vacation|trip)\b|\bclaim (?:your|it|now)\b/gi,
        /\b(?:pre-?approved|approved instantly|instant approval|guaranteed approval|no credit check)\b/gi,
        /\b(?:tax |tuition |overpayment )?(?:refund|rebate) (?:of \$?[\d,.]+ )?(?:is |has been )?(?:pending|available|ready|waiting|approved)\b|\breward points? (?:expire|expiring)\b/gi,
        /\b(?:answer|complete|take|fill (?:out|in)) (?:a |our |this |the )?(?:\d+[- ](?:second|minute) |short |quick |brief )?survey\b|\b(?:membership|loyalty|customer) reward\b/gi,
      ],
    },
    {
      id: "delivery", name: "Package problem", weight: 2, icon: "📦",
      plain: "Fake delivery texts ask for a small 'redelivery' fee or 'address update' to steal card details. Carriers don't ask for fees by text. Check in their official app.",
      patterns: [
        /\b(?:package|parcel|shipment|delivery|order|item)\b[^.!?\n]{0,40}\b(?:on hold|held|could not be delivered|couldn'?t be delivered|undeliverable|delivery failed|failed|suspended|returned to sender|awaiting)\b/gi,
        /\bredeliver(?:y)?\b|\b(?:customs|shipping|delivery|redelivery|handling) (?:fee|charge|duty)\b/gi,
        /\b(?:incomplete|incorrect|invalid|insufficient) (?:delivery |shipping )?address\b|\baddress (?:is )?(?:incomplete|incorrect|invalid)\b/gi,
      ],
    },
    {
      id: "debt", name: "Says you owe money", weight: 1.5, icon: "🧾",
      plain: "Surprise bills for tolls, taxes or invoices you don't recognise are common. Check by logging in to the real account yourself, not through the message.",
      patterns: [
        /\bunpaid (?:toll|tolls|invoice|bill|balance|tax|taxes|fee|fees|parking)\b/gi,
        /\boutstanding (?:balance|toll|amount|debt|payment|invoice)\b|\b(?:overdue|past due)\b/gi,
      ],
    },
    {
      id: "urgency", name: "Rushes you", weight: 1.5, icon: "⏱️",
      plain: "A tight deadline stops you from pausing to check. Real organizations give you time and won't punish you for taking a day to verify.",
      patterns: [
        /\b(?:urgent(?:ly)?|immediately|right away|asap|act now|today only|time[- ]sensitive|don'?t delay|respond now|as soon as possible|before it'?s too late)\b/gi,
        /\bwithin (?:the next )?(?:\d+|an?|one|the)\s*(?:hours?|hrs?|minutes?|mins?|days?)\b|\bin the next \d+\s*(?:hours?|minutes?|mins?)\b/gi,
        /\b(?:expires?|expiring|ends?) (?:today|soon|tonight|in \d+)\b|\b(?:final|last) (?:notice|warning|reminder|chance|attempt)\b/gi,
      ],
    },
    {
      id: "offplatform", name: "Moves you to another app", weight: 1.5, icon: "↪️",
      plain: "Moving the chat to WhatsApp, Telegram or Signal gets you away from the platform's safety tools and makes the scammer harder to trace.",
      patterns: [
        /\b(?:message|text|contact|add|reach|chat|talk|continue|move|dm|find)\b[^.!?\n]{0,15}\b(?:on|via|over|to) (?:whatsapp|telegram|signal|wechat|line|kik|google chat|hangouts|snapchat)\b/gi,
        /\b(?:telegram|whatsapp)\s*(?:me|@\w+|\+\d)/gi,
        /\b(?:download|install|get) (?:the )?(?:signal|telegram|whatsapp|wechat) app\b/gi,
      ],
    },
    {
      id: "callnumber", name: "Gives you a number to call", weight: 1.5, icon: "📞",
      plain: "Scammers put their own phone number in the message so that when you 'check', you reach them. Use the number on the company's website, your card or your bill instead.",
      patterns: [/\b(?:call|ring|dial|contact|phone|reach)\b[^.!?\n]{0,30}?(?:\+?\d[\d\s().-]{6,}\d)/gi],
      // Combined with "if you didn't make this charge", it's the fake-refund script.
    },
    {
      id: "curiosity", name: "Curiosity bait", weight: 2, icon: "👀",
      plain: "'Is this you in this video?' and similar teasers make you tap before you think. They're often sent from friends' hacked accounts, so a familiar name doesn't make it safe.",
      patterns: [/\b(?:is (?:this|that) you\b|you in this (?:video|photo|pic|picture)|look what (?:they|someone|i found)|did you see (?:this|what)|someone (?:posted|is spreading)\b)/gi],
    },
    {
      id: "stranger", name: "Stranger getting personal", weight: 2, icon: "💬",
      plain: "Romance and 'wrong number' scams start with a friendly chat from a stranger and build trust for weeks before money comes up. The first message often looks harmless.",
      patterns: [
        /\b(?:hello|hi) (?:my )?dear\b|\bget to know you\b|\bwrong number\b|\bgot your (?:number|contact) from\b/gi,
        /\bis this (?:still )?[A-Z]?[a-z]+'?s (?:number|phone)\b/gi,
        /\b(?:added|messaged|texted) you by mistake\b|\byou seem (?:nice|interesting|kind|lovely)\b/gi,
        /\b(?:i'?m|i am) (?:a )?(?:doctor|surgeon|soldier|engineer|sergeant|captain|nurse)\b[^.!?\n]{0,40}\b(?:overseas|abroad|un\b|united nations|oil rig|military|deployed|peacekeeping|offshore)/gi,
      ],
    },
    {
      id: "click", name: "Pushes you to tap a link", weight: 1, icon: "👆",
      plain: "The message's main goal is getting you to tap. It's always safer to open the app or type the website yourself.",
      patterns: [
        /\b(?:click|tap|follow|visit|open|use) (?:on )?(?:the |this |our )?(?:link|here|below|button|url)\b/gi,
        /\b(?:log ?in|sign ?in|verify|pay) (?:here|now|below|at|via|using)\b/gi,
      ],
    },
    {
      id: "generic", name: "Doesn't use your name", weight: 0.5, icon: "👤",
      plain: "Mass scam messages go to thousands of people, so they use vague greetings. Not a strong sign on its own.",
      patterns: [/\bdear (?:customer|user|client|member|sir|madam|sir\/madam|account holder|valued \w+)\b|\bvalued customer\b/gi],
    },
  ];

  // Not found in the words: set when a scanned QR code would send money (see js/qr.js).
  const QR_PAYMENT = {
    id: "qrpay", name: "QR code that sends money", weight: 5, icon: "📲",
    plain: "Scanning this code starts a payment from you. You never need to scan a code or enter your PIN to receive money, so anyone who says you do is trying to take it.",
  };

  // How each tactic reads inside a sentence: "It rushes you and asks for a security code."
  const SAYS = {
    code: "asks for a security code", remote: "wants control of your device", payment: "asks for a kind of payment that's hard to undo",
    credentials: "asks for private information", money: "asks you to send or move money", newdetails: "says payment details have changed",
    overpay: "overpays and wants the difference back", secrecy: "asks you to keep it secret", family: "comes from a \"family member\" on a new number", job: "offers easy money",
    threat: "tries to scare you", prize: "promises something too good to be true", delivery: "claims there's a problem with a package",
    debt: "says you owe money", urgency: "rushes you", offplatform: "tries to move you to another app", callnumber: "gives you its own number to call",
    qrpay: "is a QR code that would send money from you", curiosity: "uses curiosity bait", stranger: "reads like a stranger getting personal", click: "pushes you to tap a link", generic: "doesn't use your name",
  };

  // Who the message claims to be from, and how to check that independently.
  const CLAIMS = [
    { kind: "bank", re: /\b(?:bank|chase|wells fargo|bank of america|citi(?:bank)?|capital one|hsbc|barclays|santander|credit union|visa|mastercard|amex|american express|fraud (?:team|department))\b/i },
    { kind: "delivery", re: /\b(?:usps|fedex|ups|dhl|royal mail|canada post|courier|post office|amazon delivery)\b/i },
    { kind: "government", re: /\b(?:irs|hmrc|social security|ssa|medicare|police|sheriff|fbi|immigration|department of|dmv|government|court|toll ?(?:authority|service)|e-?zpass)\b/i },
    { kind: "tech", re: /\b(?:apple|icloud|microsoft|windows|google|gmail|amazon|netflix|paypal|meta|facebook|instagram|whatsapp|geek squad|norton|mcafee|coinbase|steam|roblox|tech support)\b/i },
    { kind: "family", re: /\b(?:mum|mom|dad|grandma|grandpa|nana|son|daughter|grandson|granddaughter|your (?:child|kid))\b/i },
    { kind: "employer", re: /\b(?:recruiter|hiring manager|hr department|job offer|interview)\b/i },
  ];

  const VERIFY = {
    bank: "Call the number printed on the back of your card, or open your bank's app. Don't use any number or link in the message.",
    delivery: "Open the carrier's official app or type its website yourself and enter your tracking number. Carriers don't ask for fees by text.",
    government: "Government agencies don't demand payment by phone, text or gift card, and don't threaten arrest by message. Find the agency's number on its official .gov site.",
    tech: "Open the company's app or type its website yourself and check your account for alerts. If there's nothing there, the message wasn't real.",
    family: "Call the person on the number you already have saved, or ask a family member. Ask something only they would know.",
    qr: "QR codes on parking meters, parcels, posters and menus can be stickers placed over the real one. Pay or log in through the official app or by typing the website yourself.",
    employer: "Look up the company yourself and contact its official careers page. Real employers never ask you to pay to start a job.",
    generic: "Contact the person or organization using details you find yourself (the official app, website, or a number you already trust), never the ones in this message.",
  };

  const PROTECTIVE = [
    { re: /\b(?:never|don'?t|do not)\s+share\s+(?:this|your|the)\s+(?:code|otp|pin|password)\b/i, text: "Tells you not to share a code. Real security messages do this, though scammers sometimes copy it." },
    { re: /\b(?:number|phone number) on the back of your card\b|\bofficial app\b/i, text: "Points you to the official app or the number on your card instead of a link." },
  ];

  // Points needed for each level (see "Why this level?" in the app).
  const THRESHOLDS = { some: 2.5, strong: 6 };

  function collectMatches(text, tactic) {
    const found = [];
    for (const re of tactic.patterns) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        if (m[0].length === 0) { re.lastIndex++; continue; }
        if (tactic.negatable) {
          const before = text.slice(Math.max(0, m.index - 40), m.index);
          if (NEGATION.test(before) || /^(?:never|don'?t|do not)\b/i.test(m[0])) continue;
        }
        found.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
      }
    }
    return found;
  }

  // Overlapping matches become one highlight that remembers every sign inside it, so tapping any
  // sign in the list still finds its words. A link wins the highlight's look if one is involved.
  function mergeHighlights(items) {
    items.sort((a, b) => a.start - b.start || b.end - a.end);
    const out = [];
    for (const it of items) {
      const last = out[out.length - 1];
      if (last && it.start < last.end) {
        last.end = Math.max(last.end, it.end);
        if (!last.ids.includes(it.id)) last.ids.push(it.id);
        if (it.kind === "link") last.kind = "link";
        continue;
      }
      out.push({ start: it.start, end: it.end, kind: it.kind, ids: [it.id] });
    }
    return out;
  }

  function list(words) {
    if (words.length <= 1) return words.join("");
    return words.slice(0, -1).join(", ") + " and " + words[words.length - 1];
  }

  /**
   * Analyze a message. Returns a plain object describing what we noticed and what to do.
   */
  function analyze(input, context) {
    context = context || {};
    const text = String(input || "").replace(/\r\n/g, "\n");
    const trimmed = text.trim();
    if (!trimmed) return { level: "empty", score: 0, tactics: [], links: [], highlights: [], claims: [], next: [], verify: [], caveats: [], protective: [] };

    const tactics = [];
    const highlights = [];
    const breakdown = []; // every point added, so the person can see exactly why they got this level
    let score = 0;
    const add = (points, label) => {
      score += points;
      breakdown.push({ points, label });
    };

    for (const t of TACTICS) {
      const matches = collectMatches(text, t);
      if (!matches.length) continue;
      add(t.weight, t.name);
      const quotes = [...new Set(matches.map((m) => m.text.trim()))].slice(0, 3);
      tactics.push({ id: t.id, name: t.name, icon: t.icon, plain: t.plain, weight: t.weight, quotes });
      for (const m of matches) highlights.push({ start: m.start, end: m.end, kind: "tactic", id: t.id });
    }

    const foundLinks = links.find(text);
    let linkScore = 0;
    for (const l of foundLinks) {
      const worst = l.findings.reduce((acc, f) => acc + ({ high: 3, medium: 2, low: 0.5, info: 0 }[f.severity] || 0), 0);
      linkScore = Math.max(linkScore, worst);
      highlights.push({ start: l.start, end: l.end, kind: "link", id: l.official ? "link-official" : worst >= 2 ? "link-risky" : "link" });
    }
    if (linkScore > 0) add(Math.min(linkScore, 6), "Risky link (worst one, up to 6 points)");
    // A link plus any pressure tactic is the standard scam recipe.
    if (foundLinks.length && tactics.some((t) => ["urgency", "threat", "prize", "delivery", "debt", "credentials", "curiosity"].includes(t.id))) add(1, "A link together with pressure");

    if (context.qr && context.qr.kind === "payment") {
      add(QR_PAYMENT.weight, QR_PAYMENT.name);
      tactics.push({ ...QR_PAYMENT, quotes: [context.qr.summary] });
    }

    const ids = new Set(tactics.map((t) => t.id));
    const claimsEarly = CLAIMS.filter((c) => c.re.test(text)).map((c) => c.kind);
    // A phone number in a message "from" a bank or big company is the fake-refund / fake-fraud-desk script.
    if (ids.has("callnumber") && claimsEarly.some((k) => k === "bank" || k === "tech" || k === "government")) add(1.5, "Its own phone number in a message from a bank or company");
    // Some signs are serious enough on their own, whatever the score.
    const disguisedLink = foundLinks.some((l) => l.findings.some((f) => f.id === "brand-mismatch" || f.id === "punycode" || f.id === "at-sign"));
    const critical =
      ids.has("code") ? "It asks for a security code" :
      ids.has("remote") ? "It wants control of your device" :
      ids.has("qrpay") ? "The QR code would send money from you" :
      ids.has("payment") && (ids.has("urgency") || ids.has("threat") || ids.has("secrecy") || ids.has("family")) ? "It wants a hard-to-undo payment, under pressure" :
      disguisedLink ? "A link disguises where it really goes" : null;

    let level;
    if (critical || score >= THRESHOLDS.strong) level = "strong";
    else if (score >= THRESHOLDS.some) level = "some";
    else level = "few";

    // The person knows things the text can't show. Their answers can raise concern, never lower it:
    // a scam can come from a known contact's hacked account, or arrive right when you expect a delivery.
    const contextNotes = [];
    const unexpected = context.expected === false;
    const stranger = context.knownSender === false;
    const asks = context.asks === true;
    let raisedByAnswers = false;
    if (asks && (unexpected || stranger)) {
      const before = level;
      if (unexpected && stranger) level = "strong";
      else if (level === "few") level = "some";
      raisedByAnswers = level !== before;
      if (raisedByAnswers) contextNotes.push("Raised because of your answers: it asks you to do something, and " + (unexpected && stranger ? "you weren't expecting it from someone you don't know." : unexpected ? "you weren't expecting it." : "you don't know the sender."));
    }
    if (context.knownSender === true && level !== "few") contextNotes.push("Even if you know the sender, their account could be hacked or copied. Check with them another way, like a phone call.");

    const claims = [];
    for (const c of CLAIMS) if (c.re.test(text)) claims.push(c.kind);
    for (const l of foundLinks) if (l.brand && !l.official && !claims.includes("tech")) claims.push("tech");
    if (context.qr) claims.unshift("qr");
    const verify = (claims.length ? claims : ["generic"]).map((k) => ({ kind: k, text: VERIFY[k] }));
    if (claims.length) verify.push({ kind: "generic", text: VERIFY.generic });

    const protective = PROTECTIVE.filter((p) => p.re.test(text)).map((p) => p.text);

    // What to do now, most important first.
    const next = [];
    if (level === "strong") next.push("Don't reply, tap any link, call any number in it, or send money. There's no rush, even if the message says there is.");
    else if (level === "some") next.push("Pause. Don't tap links or reply until you've checked it another way.");
    else next.push("If you weren't expecting this message, check it another way before acting on it.");
    if (ids.has("code")) next.push("Never share a code you were sent. If you already did, change that account's password now.");
    if (ids.has("remote")) next.push("Don't install anything they suggest. If you already did, disconnect from the internet and uninstall it.");
    if (ids.has("payment")) next.push("Don't pay with gift cards, crypto or wire transfer. No real business or agency requires this.");
    // The family verify tip already says "call them on the number you have", so don't say it twice.
    if (ids.has("family") && verify[0].kind !== "family") next.push("Call your family member on the number you already have saved.");
    if (ids.has("qrpay")) next.push("Don't approve this payment or enter your PIN. Receiving money never needs a scan or a PIN.");
    next.push(verify[0].text);
    if (level !== "few") next.push("Once you've checked, block the sender, report it, and delete the message.");

    const names = tactics.slice(0, 3).map((t) => SAYS[t.id]);
    const riskyLinks = foundLinks.filter((l) => l.findings.some((f) => f.severity === "high"));
    let summary;
    if (level === "strong") {
      summary = riskyLinks.length && riskyLinks[0].brand && !riskyLinks[0].official
        ? `It ${names.length ? list(names) + ", and it " : ""}links to a website pretending to be ${riskyLinks[0].brand.name}.`
        : names.length ? `It ${list(names)}. Together, these are how most scams work.`
        : "Based on your answers, treat this as a likely scam until you've checked it another way.";
    } else if (level === "some") {
      summary = names.length ? `It ${list(names)}. That doesn't prove it's a scam, but it's worth checking first.`
        : foundLinks.length && linkScore >= 2 ? "One of its links looks unusual. That doesn't prove it's a scam, but it's worth checking first."
        : "Based on your answers, it's worth checking another way before you act.";
    } else {
      summary = tactics.length ? `We only spotted a minor sign: it ${list(names)}.` : "We didn't spot any of the common pressure tactics or risky links.";
    }

    const caveats = [
      "Second Look reads only the words and links. It can't see who really sent the message, and it never opens links.",
      "Scammers change their wording. A message with no warning signs can still be a scam, and a real message can trip a warning.",
    ];
    if (trimmed.length < 40) caveats.unshift("This message is very short, so there's little to go on.");
    if (level === "few") caveats.unshift("\"Few signs\" is not the same as \"safe\". If something feels off, trust that feeling and check.");

    return {
      level, score: Math.round(score * 10) / 10, summary, contextNotes,
      breakdown, critical, raisedByAnswers, thresholds: THRESHOLDS,
      tactics, links: foundLinks, claims, verify, next, protective, caveats,
      highlights: mergeHighlights(highlights),
    };
  }

  const HEADLINES = {
    strong: "Strong warning signs",
    some: "Some warning signs",
    few: "No common warning signs found",
  };

  return { analyze, TACTICS, HEADLINES };
});
