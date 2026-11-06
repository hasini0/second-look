/*
 * Second Look — QR code X-ray.
 * Reads a QR code from the camera or a photo using the browser's built-in BarcodeDetector
 * (no library, nothing uploaded), then explains what the code would do if you scanned it
 * with a normal camera app: open a website, start a payment, join a Wi-Fi network, and so on.
 *
 * parse() is pure and works in Node for tests. decode() needs a browser.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === "object" && module.exports) module.exports = mod;
  else (root.SecondLook = root.SecondLook || {}).qr = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /** Whether this browser can read QR codes by itself (Chrome and Edge on Android, Mac and ChromeOS). */
  async function isSupported() {
    if (typeof BarcodeDetector === "undefined") return false;
    try {
      const formats = await BarcodeDetector.getSupportedFormats();
      return formats.includes("qr_code");
    } catch (e) {
      return false;
    }
  }

  /** Find a QR code in an image, video frame or canvas. Returns its text, or null if there isn't one. */
  async function decode(source) {
    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    const codes = await detector.detect(source);
    return codes.length ? codes[0].rawValue : null;
  }

  function params(query) {
    const out = {};
    for (const [k, v] of new URLSearchParams(query)) out[k.toLowerCase()] = v;
    return out;
  }

  const money = (amount, currency) => (amount ? `${currency ? currency + " " : ""}${amount}` : "an amount you choose");

  /**
   * Explain what a QR code's contents would do.
   * Returns { kind, summary, details: [[label, value]], text } where `text` is what to run the
   * message checker on, and kind is "payment" | "link" | "wifi" | "phone" | "sms" | "email" | "contact" | "text".
   */
  function parse(raw) {
    const value = String(raw || "").trim();
    const lower = value.toLowerCase();

    // Payment requests. Scanning these sends money FROM you, the opposite of what "scan to receive" scams claim.
    if (lower.startsWith("upi://pay")) {
      const p = params(value.slice(value.indexOf("?") + 1));
      return {
        kind: "payment",
        summary: `UPI payment of ${money(p.am, p.cu || "INR")} to ${p.pn || p.pa || "an unknown account"}`,
        details: [["Pays", p.pn || "(no name given)"], ["Account", p.pa || "(none)"], ["Amount", money(p.am, p.cu || "INR")], ["Note", p.tn || "(none)"]],
        text: `QR code payment request: pay ${money(p.am, p.cu || "INR")} to ${p.pn || p.pa || "an unknown account"}${p.tn ? `. Note: ${p.tn}` : ""}`,
      };
    }
    const crypto = lower.match(/^(bitcoin|ethereum|litecoin|tron|solana):([^?]+)(?:\?(.*))?$/);
    if (crypto) {
      const p = params(crypto[3] || "");
      const coin = crypto[1][0].toUpperCase() + crypto[1].slice(1);
      return {
        kind: "payment",
        summary: `${coin} payment of ${money(p.amount, "")} to wallet ${crypto[2].slice(0, 10)}…`,
        details: [["Currency", coin], ["Wallet", crypto[2]], ["Amount", money(p.amount, "")]],
        text: `QR code payment request: send ${coin} ${p.amount || ""} to a crypto wallet`,
      };
    }

    if (/^https?:\/\//i.test(value) || /^www\./i.test(value)) {
      return { kind: "link", summary: "Opens a website", details: [["Address", value]], text: value };
    }

    if (lower.startsWith("wifi:")) {
      const ssid = (value.match(/(?:^wifi:|;)S:((?:\\.|[^;])*)/i) || [])[1] || "(unnamed)";
      const type = (value.match(/(?:^wifi:|;)T:([^;]*)/i) || [])[1] || "open";
      return {
        kind: "wifi",
        summary: `Joins the Wi-Fi network "${ssid}"`,
        details: [["Network", ssid], ["Security", type.toUpperCase() === "NOPASS" ? "none (open)" : type.toUpperCase()]],
        text: "",
      };
    }

    const tel = value.match(/^tel:(.+)$/i);
    if (tel) return { kind: "phone", summary: `Calls ${tel[1]}`, details: [["Number", tel[1]]], text: `Call ${tel[1]}` };

    const sms = value.match(/^(?:smsto|sms):([^:?]*)[:?](?:body=)?([\s\S]*)$/i);
    if (sms) {
      return { kind: "sms", summary: `Texts ${sms[1] || "a number"}`, details: [["To", sms[1]], ["Message", sms[2]]], text: sms[2] };
    }

    if (lower.startsWith("mailto:")) {
      const addr = value.slice(7).split("?")[0];
      return { kind: "email", summary: `Emails ${addr}`, details: [["To", addr]], text: value.slice(7) };
    }

    if (lower.startsWith("begin:vcard") || lower.startsWith("mecard:")) {
      const name = (value.match(/\nFN:(.*)/i) || value.match(/MECARD:N:([^;]*)/i) || [])[1] || "a contact";
      return { kind: "contact", summary: `Adds ${name.trim()} to your contacts`, details: [["Name", name.trim()]], text: value };
    }

    // Plain text, or a bare domain like "pay-parking.top/zone4": let the message checker find any link.
    return { kind: "text", summary: "Contains text", details: [], text: value };
  }

  return { isSupported, decode, parse };
});
