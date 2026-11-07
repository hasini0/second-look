/*
 * Second Look — where to report a scam, by country.
 * Shown as plain text (never as links): reporting is done by the person, on their own, from the
 * official site or number they type in.
 *
 * To add a country: add an entry to REGIONS with the same fields (key = its two-letter country code,
 * which guess() matches against the browser language, e.g. "en-AU" -> "au"). Set urgentReport if
 * its helpline can freeze stolen money when called quickly; that report step then moves to "Right now".
 * Only add services you've checked on the official government site.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === "object" && module.exports) module.exports = mod;
  else (root.SecondLook = root.SecondLook || {}).regions = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const REGIONS = {
    us: {
      name: "United States",
      emergency: "911",
      spam: "Forward scam texts to 7726 (SPAM). It's free.",
      report: ["Report the scam to the FTC at ReportFraud.ftc.gov.", "For online crime, also report to the FBI at ic3.gov."],
      identity: "Make an identity recovery plan at IdentityTheft.gov, and freeze your credit with each credit bureau. It's free.",
    },
    uk: {
      name: "United Kingdom",
      emergency: "999",
      spam: "Forward scam texts to 7726 and scam emails to report@phishing.gov.uk. Both are free.",
      report: ["Report fraud to Action Fraud (actionfraud.police.uk, 0300 123 2040) in England, Wales and Northern Ireland, or to Police Scotland on 101."],
      identity: "Tell your bank, and consider Cifas Protective Registration so lenders double-check applications in your name.",
    },
    in: {
      name: "India",
      emergency: "112",
      urgentReport: true, // 1930 can freeze money still moving between accounts, so it's a "right now" step
      spam: "Report suspected fraud calls and messages on Chakshu at sancharsaathi.gov.in.",
      report: ["If money was taken, call the National Cyber Crime Helpline on 1930 straight away. Speed matters.", "File a complaint at cybercrime.gov.in."],
      identity: "Lock your Aadhaar biometrics in the mAadhaar app or at myaadhaar.uidai.gov.in, and tell your bank.",
    },
    ca: {
      name: "Canada",
      emergency: "911",
      spam: "Forward scam texts to 7726 (SPAM). It's free.",
      report: ["Report to the Canadian Anti-Fraud Centre: 1-888-495-8501 or antifraudcentre-centreantifraude.ca.", "Also report to your local police."],
      identity: "Ask Equifax Canada and TransUnion Canada to add a fraud alert to your credit file.",
    },
    au: {
      name: "Australia",
      emergency: "000",
      spam: "Report scam texts, calls and emails to Scamwatch at scamwatch.gov.au.",
      report: ["Report cybercrime through ReportCyber at cyber.gov.au."],
      identity: "Contact IDCARE on 1800 595 160 for free identity theft support.",
    },
    other: {
      name: "Another country",
      emergency: "",
      spam: "Check whether your phone company has a free number you can forward scam texts to.",
      report: ["Report it to your national fraud or cybercrime reporting service, or your local police."],
      identity: "Tell your bank, and ask your national identity or credit agency how to protect your ID.",
    },
  };

  /** A sensible default from the browser's language, e.g. "en-IN" -> "in". The person can change it. */
  function guess(languages) {
    const tags = (languages || []).map((l) => String(l).toLowerCase());
    for (const tag of tags) {
      const country = tag.split("-")[1];
      if (country === "gb") return "uk";
      if (country && REGIONS[country]) return country;
    }
    return "other";
  }

  return { REGIONS, guess };
});
