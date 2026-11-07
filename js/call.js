/*
 * Second Look — "On a call right now?"
 * Phone scams take the most money from older adults, and they happen live: there's no message to paste.
 * A short checklist the person can tick while the caller is talking, and a clear answer: hang up or not.
 *
 * To add a warning sign, add an entry to SIGNS. `hangUp: true` means that sign alone is enough.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === "object" && module.exports) module.exports = mod;
  else (root.SecondLook = root.SecondLook || {}).call = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const SIGNS = [
    { id: "code", label: "They want a code sent to your phone", why: "No real bank, company or agency ever asks for one of those codes.", hangUp: true },
    { id: "money", label: "They want you to move, send or withdraw money", why: "Real banks never ask you to move money to a 'safe account' or hand cash to anyone.", hangUp: true },
    { id: "giftcard", label: "They want payment in gift cards, crypto or a wire", why: "Only scammers ask to be paid that way.", hangUp: true },
    { id: "remote", label: "They want you to install an app or share your screen", why: "That would let them control your phone or computer.", hangUp: true },
    { id: "secret", label: "They say don't hang up, or don't tell anyone", why: "Keeping you on the line and alone stops you from checking.", hangUp: true },
    { id: "threat", label: "They threaten arrest, a fine or a closed account", why: "Real agencies send letters and give you time. They don't threaten you by phone.", hangUp: true },
    { id: "personal", label: "They ask for passwords, PINs or ID numbers", why: "Callers who really are your bank already know who you are.", hangUp: true },
    { id: "urgent", label: "They say it must happen right now", why: "Pressure is the scammer's main tool. Anything real can wait 10 minutes." },
    { id: "claims", label: "They say they're from your bank, the police, the government or tech support", why: "Caller ID can be faked to show any name or number." },
    { id: "family", label: "They say a family member is in trouble", why: "Voices can be faked. Call your family member on the number you already have." },
  ];

  /** What to do, given the ids of the signs the person ticked. */
  function advise(ticked) {
    const picked = SIGNS.filter((s) => ticked.includes(s.id));
    const hangUp = picked.some((s) => s.hangUp) || picked.length >= 2;
    return {
      hangUp,
      headline: hangUp ? "Hang up now. It's OK to hang up." : picked.length ? "Be careful. You can hang up and check." : "If anything feels off, you can still hang up.",
      reasons: picked.map((s) => s.why),
      say: "\"I'll call you back on the official number.\" Then hang up. You don't have to explain or be polite.",
      then: [
        "Wait a minute before calling anyone. Scammers can stay on the line, so use a different phone if you can.",
        "Call back using a number you find yourself: the back of your card, a statement, the official website, or your family member's saved number.",
        "Don't call back any number the caller gave you.",
      ],
    };
  }

  return { SIGNS, advise };
});
