/*
 * Second Look — synthetic messages.
 * Every message here was written for this project. Names, numbers (555 numbers) and
 * accounts are made up. Links are never rendered as clickable anywhere in the app.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === "object" && module.exports) module.exports = mod;
  else (root.SecondLook = root.SecondLook || {}).samples = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Shown in the "Try an example" menu on the check screen.
  const EXAMPLES = [
    {
      label: "Fake PayPal alert",
      text: "PayPal: We detected unusual sign-in activity. Your account will be suspended within 24 hours unless you verify your identity at https://paypal.com.account-verify.top/login\n\nDear Customer, act now to avoid permanent closure.",
    },
    {
      label: "\"Hi Mum\" on a new number",
      text: "Hi Mum it's me, I dropped my phone in the bath so this is my new number. Can you do me a favour? I need to pay a bill today but my banking app is locked on the new phone. Can you send £480 and I'll pay you back tomorrow. Don't tell dad yet x",
    },
    {
      label: "Code request from a \"friend\"",
      text: "Hey! Sorry, I accidentally sent you a 6 digit code by mistake, it was meant for my account. Could you send it back to me please? It's urgent",
    },
    {
      label: "Toll payment text",
      text: "E-ZPass Final Notice: You have an unpaid toll balance of $6.99. To avoid a late fee of $50 and suspension of your license, pay within 12 hours: ezpass-tollpay.icu/pay",
    },
    {
      label: "Real-looking bank alert",
      text: "Chase: Did you attempt a $212.40 purchase at Corner Market on card ending in 4417? Reply YES or NO. If this wasn't you, call the number on the back of your card. We will never ask for your PIN or a code.",
    },
    {
      label: "Ordinary message",
      text: "Hi! Just a reminder that the book club is meeting at Priya's place on Thursday at 7. Bring a snack if you can. See you there!",
    },
  ];

  // Practice mode. answer: "scam" | "real" | "verify" (can't tell from the message alone; check another way).
  const PRACTICE = [
    {
      from: "+1 (555) 013-2291", channel: "Text",
      text: "USPS: Your package is on hold due to an incomplete address. Update your details within 48 hours or it will be returned: usps-redelivery-help.com/track",
      answer: "scam",
      why: "USPS doesn't text you a link to fix an address or pay a fee. The website is not usps.com, and the deadline is there to rush you.",
    },
    {
      from: "Bank of America", channel: "Text",
      text: "BofA: Your one-time code is 448210. It expires in 10 min. We'll never call or text you for this code. Don't share it with anyone.",
      answer: "real",
      why: "This is what a real code message looks like: it gives you a code you asked for and tells you never to share it. It doesn't ask you to do anything. The danger comes if someone then contacts you asking for it.",
    },
    {
      from: "Unknown number", channel: "WhatsApp",
      text: "Hi Dad, this is my new number, old phone broke. I need to pay a supplier urgently and my bank app isn't working. Can you send $950 by Zelle? I'll explain later, please keep this between us for now",
      answer: "scam",
      why: "New number, a sudden money need, a fast payment app and a request for secrecy: this is the classic 'family emergency' scam. Call your child on their old number.",
    },
    {
      from: "Netflix", channel: "Email",
      text: "Your Netflix membership will renew on 14 Dec. No action is needed. To manage your plan, open the Netflix app or go to netflix.com/account.",
      answer: "real",
      why: "No pressure, no request for details, and it tells you to use the app or the official site. Even so, you lose nothing by opening the app yourself instead of tapping.",
    },
    {
      from: "Microsoft Support", channel: "Phone call (you took notes)",
      text: "Caller said my computer has a virus and is sending out errors. They need me to install AnyDesk so a technician can fix it right now, then pay $299 with Google Play gift cards.",
      answer: "scam",
      why: "Microsoft never calls you unprompted. Remote access plus gift-card payment is the tech-support scam playbook. Hang up.",
    },
    {
      from: "Jordan (coworker)", channel: "Work chat",
      text: "Hey, are you around? I'm stuck in a meeting and need a quick favour. Can you pick up some gift cards for a client? I'll reimburse you today",
      answer: "verify",
      why: "This might really be Jordan's account, or it might be hacked or faked. The gift-card request is a big warning sign, so check with Jordan by phone or in person before doing anything.",
    },
    {
      from: "+1 (555) 019-7734", channel: "Text",
      text: "Congratulations! You've been selected for a $1000 Walmart reward. Claim your gift now before it expires tonight: bit.ly/wm-rwd77",
      answer: "scam",
      why: "You didn't enter anything, so you didn't win anything. A hidden link and an 'expires tonight' deadline finish the picture.",
    },
    {
      from: "Dr. Alvarez Dental", channel: "Text",
      text: "Reminder: you have a dental cleaning on Tue 18 Nov at 3:30 PM. Reply C to confirm or call the office to reschedule.",
      answer: "real",
      why: "If you have a dentist by that name, this is an ordinary reminder: no link, no payment, no personal details requested. If you don't, just ignore it.",
    },
    {
      from: "HR Recruiting", channel: "Text",
      text: "Hello, I'm a recruiter. Your profile was recommended for a remote part-time job, earn $300 per day doing simple tasks. Contact me on Telegram @hr_mia_jobs to start",
      answer: "scam",
      why: "High pay for 'simple tasks', from someone you never applied to, who wants you on Telegram. These 'task' scams later ask you to pay to unlock your earnings.",
    },
    {
      from: "Apple", channel: "Email",
      text: "Your Apple ID was used to sign in on a new device near Austin, TX. If this was you, you can ignore this email. If not, open Settings on your iPhone and change your password.",
      answer: "verify",
      why: "It reads like a real alert and has no link, which is good. Because it's about your account, the safe move is still to check in Settings yourself, which is exactly what it suggests. Never sign in through an email link.",
    },
  ];

  // Labeled set for the evaluation script and the in-app "test on this device" button.
  // "scam" = should get at least "some" warning signs. "legit" = ideally "few".
  const EVAL = [
    // --- scams ---
    ["scam", "Amazon: Your order #112-48 could not be delivered. Confirm your payment details here to reschedule: amazon-orders-support.com/redeliver"],
    ["scam", "IRS Notice: You owe back taxes. A warrant will be issued for your arrest unless you pay today with Google Play gift cards. Call 555-0143."],
    ["scam", "Your Apple ID has been locked for security reasons. Verify your account immediately at appleid.apple.com.verify-user.xyz"],
    ["scam", "Hi mom, new number! Lost my phone. Can you help me pay a bill? I'll send the details"],
    ["scam", "Netflix: Payment declined. Your membership will be cancelled. Update your billing information: http://netf1ix-billing.com"],
    ["scam", "We noticed suspicious activity on your Wells Fargo account. Reply with the code we just sent you to confirm it's you."],
    ["scam", "Congratulations! You won an iPhone 17 in our customer survey. Pay a small shipping fee to claim your prize: tinyurl.com/claim-ip17"],
    ["scam", "This is Coinbase security. Your wallet is compromised. Move your funds to this safe wallet address now and don't tell anyone, it's an active investigation."],
    ["scam", "FedEx: shipment awaiting customs fee of $2.99. Pay within 24 hours or it will be returned. fedex-customs.click"],
    ["scam", "Microsoft Defender: Your PC is infected. Call our technicians now and install AnyDesk so we can remove the virus."],
    ["scam", "Earn $500 per day working from home! Simple tasks, no experience. WhatsApp me +1 555 0188"],
    ["scam", "Final notice: unpaid toll of $4.15. Pay now to avoid a $45 penalty: tolls-service-payment.top"],
    ["scam", "Your Social Security number has been suspended due to suspicious activity. Press 1 to speak to an officer or legal action will be taken."],
    ["scam", "Dear valued customer, your bank account access is restricted. Log in here to restore: https://secure-chase-login.online/restore"],
    ["scam", "Hey it's Sam, I sent a code to your phone by mistake, can you forward it to me?"],
    ["scam", "Investment opportunity: guaranteed returns of 30% weekly with our crypto trading bot. Message me on Telegram to get started."],
    ["scam", "PayPal: you have received a refund of $389.00. Claim it within 12 hours at paypal-refunds.support"],
    ["scam", "Steam: a friend sent you a $50 gift. Log in to accept: steamcommunlty.com/gift/accept"],
    ["scam", "Grandma, it's me. I'm in jail and need bail money. Please don't tell mom and dad. My lawyer will call you to arrange a bitcoin payment."],
    ["scam", "Your parcel delivery failed. Reschedule now: https://dhl.parcel-help.xyz/r/4421"],
    ["scam", "Security alert: unauthorized login to your Instagram. If this wasn't you, verify here: instagram-verify-account.com"],
    ["scam", "You've been hired! To receive your training kit, buy a $200 prepaid card and send us the numbers."],
    ["scam", "Medicare: you are eligible for a free back brace. Confirm your Medicare number and date of birth to ship today."],
    ["scam", "Hello, I am a lawyer representing the estate of your late relative. You are entitled to an inheritance of $4.2M. Keep this confidential and send your bank details."],
    ["scam", "Geek Squad: your annual subscription of $399.99 will renew today. To cancel and get a refund, call 555-0122 and we'll connect via remote support."],
    ["scam", "Wrong number? Anyway you seem nice. I'm a crypto trader, let's chat on WhatsApp and I can teach you to double your money"],
    ["scam", "ALERT: your card has been blocked. Visit www.bank-secure-unlock.info and enter your card number and PIN to unblock."],
    ["scam", "Your Roblox account will be deleted within 24 hours for breaking the rules. Appeal here: roblox-appeals.live"],
    // --- legitimate ---
    ["legit", "Your verification code is 381920. It expires in 10 minutes. Never share this code with anyone."],
    ["legit", "Hi, running 10 minutes late, order me a coffee if you get there first!"],
    ["legit", "Your Amazon order of 'USB-C cable' has shipped and arrives Thursday. Track it in the Amazon app."],
    ["legit", "Reminder: your appointment with Dr. Lee is tomorrow at 9:15 AM. Reply C to confirm."],
    ["legit", "Chase: A $54.10 charge at Green Grocer on card ending 4417 was approved. If you don't recognize it, call the number on the back of your card."],
    ["legit", "Thanks for your payment of $82.30 to City Water. No further action is needed."],
    ["legit", "Mom can you grab milk on the way home? Thanks love you"],
    ["legit", "Your library book 'The Overstory' is due back on 22 Nov. Renew online through your library account."],
    ["legit", "Team lunch moved to 1pm Friday because of the all-hands. Same place."],
    ["legit", "Your package was delivered to the front porch at 2:14 PM. Photo in the UPS app."],
    ["legit", "Hey, here's the link to the slides from today: docs.google.com/presentation/d/abc123"],
    ["legit", "School closure: due to snow, Lincoln Elementary will be closed Monday. Updates on the district website."],
    ["legit", "Your monthly statement is ready. Sign in to the app to view it."],
    ["legit", "Happy birthday!! Hope you have the best day, dinner on me this weekend"],
    ["legit", "Spotify: your Premium plan renews on 3 Dec for $11.99. Manage it anytime in your account settings."],
    ["legit", "Pharmacy: your prescription is ready for pickup at the Main St store until 9 PM."],
    ["legit", "Did you get home ok? Text me when you're back"],
    ["legit", "Your flight UA 482 to Denver departs at 6:05 AM from gate B12. Check in through the United app."],
    ["legit", "Microsoft account: we noticed a new sign-in from Windows in Chicago. If this was you, you can ignore this. If not, review your activity in your account settings."],
    ["legit", "Reminder: rent is due on the 1st. Pay through the resident portal as usual."],
  ].map(([label, text]) => ({ label, text }));

  // Held-out set: written after the rules above were tuned, and deliberately NOT used for tuning.
  // Includes hard cases on purpose (scams with no keywords, real messages that sound urgent).
  const HOLDOUT = [
    ["scam", "lol is this you in this video?? 😳 vid-share.cc/v/8812"],
    ["scam", "Your Venmo account is under review. To avoid losing your balance, confirm your login at venmo-review-center.com"],
    ["scam", "Hello dear, I am a doctor working with the UN in Syria. I would like to get to know you better. Can we talk on Google Chat?"],
    ["scam", "UPS: We tried to deliver your parcel today. A $1.95 redelivery charge applies. Pay at ups-reschedule-pkg.top"],
    ["scam", "Hi, this is Officer Daniels with the county sheriff. You missed jury duty and there is a warrant out. You can settle it today by paying a bond through a bitcoin ATM."],
    ["scam", "Your iCloud storage is full and your photos will be deleted tomorrow. Upgrade for $0.99: icloud-storage-plans.net"],
    ["scam", "Apple Pay: card suspended. Call 555-0177 now to reactivate."],
    ["scam", "Hey! Is this still Megan's number? Got your contact from the hiking group"],
    ["scam", "Dear student, your tuition refund of $1,250 has been approved. Provide your bank login so we can deposit it."],
    ["scam", "Walmart: your recent order was flagged. Call our fraud desk at 555-0109 within the hour to stop a $1,499 charge."],
    ["scam", "I'm with Comcast billing. We're offering 50% off your bill if you prepay 6 months with a Target gift card."],
    ["scam", "Your WhatsApp will be deactivated. Verify by sending the 6-digit code you receive."],
    ["scam", "Get a 0% interest loan approved instantly, no credit check! Just pay the $99 processing fee first."],
    ["scam", "Hey grandpa it's Tyler, I got in a car accident and need $2,000 for the other driver. please don't tell mom"],
    // --- legitimate ---
    ["legit", "Your flight to Boston is delayed 2 hours. You can rebook for free in the Delta app."],
    ["legit", "URGENT: water main break on Elm St, boil water before drinking until further notice. - City Utilities"],
    ["legit", "Your Venmo payment of $18.00 to Alex for 'pizza' was completed."],
    ["legit", "Hey, did you finish the lab report? It's due tonight at midnight, don't forget!"],
    ["legit", "Costco: your membership expires on 30 Nov. Renew at any warehouse or in the app."],
    ["legit", "Final reminder: parent-teacher conferences are this Thursday. Sign up through the school portal."],
    ["legit", "Your Uber is arriving in 3 minutes. Look for a grey Toyota Camry."],
    ["legit", "Thanks for applying to the Library Assistant position. We'll be in touch within two weeks."],
    ["legit", "Your PayPal account: you sent $25.00 to Jamie Lee. View details in the PayPal app."],
    ["legit", "Emergency alert: tornado warning in your area until 7:45 PM. Take shelter now."],
  ].map(([label, text]) => ({ label, text }));

  // Round 2 held-out set: written after the round-1 fixes. Frozen; never used for tuning.
  // The score on this set is the one we quote.
  const HOLDOUT2 = [
    ["scam", "Hi, this is Lisa from Chase fraud prevention. To stop the transfer we need you to move your savings into a protected account. I'll stay on the line."],
    ["scam", "Your Amazon Prime has been charged $139. If you did not authorize this, call 555-0150 for a refund."],
    ["scam", "We're giving away 5 BTC to celebrate our launch! Send 0.1 BTC and receive 0.2 BTC back instantly."],
    ["scam", "Hello, your car's extended warranty is about to expire. Reply YES to renew before coverage ends today."],
    ["scam", "HMRC: You are due a tax rebate of £326.40. Submit your claim here: hmrc-rebate-online.co"],
    ["scam", "I saw your post about selling the bike. I'll pay full price, but I'm away so my courier will pick it up. I sent you a Zelle payment, just verify your email to receive it."],
    ["scam", "This is your landlord, I changed banks. Please send this month's rent to the new account below instead."],
    ["scam", "Your Facebook page will be permanently removed for copyright violation. Appeal within 24h: meta-appeal-center.com"],
    ["scam", "Hey friend, I'm stuck in Manila and lost my wallet. Can you wire me $600? Will pay back when I'm home"],
    ["scam", "Congrats on your new job offer! Please deposit the attached check and send $1,800 to our equipment vendor for your laptop."],
    ["scam", "Your Google account password expires today. Keep your current password: g00gle-security.com/keep"],
    ["scam", "Mr. Patel from the bank here. Someone is using your card. Read me the code we just texted so we can block it."],
    ["scam", "DMV: your license will be suspended on Nov 30 due to unpaid traffic tickets. Settle now: dmv-ticket-pay.site"],
    ["scam", "Hi, I'm Emma 😊 I think I added you by mistake, but you seem interesting. Where are you from?"],
    ["scam", "Final attempt: your package from Temu is waiting. Confirm delivery for $0.30: tinyurl.com/temu-dlv"],
    // --- legitimate ---
    ["legit", "Your debit card has been locked after 3 incorrect PIN attempts. You can unlock it in the app or at any branch."],
    ["legit", "Reminder: your car's registration expires on 15 Dec. Renew at the DMV office or on the official state website."],
    ["legit", "Your order from Target is ready for pickup. Show your barcode in the Target app at the Guest Services desk."],
    ["legit", "Hey, sent you $40 on Venmo for the concert tickets, thanks for getting them!"],
    ["legit", "Account notice: we've updated our privacy policy. No action is needed."],
    ["legit", "Your Google account password was changed. If this was you, no action needed. If not, go to your Google Account settings to secure it."],
    ["legit", "Hi it's Coach Rivera, practice is cancelled tonight because of the rain. See everyone Saturday."],
    ["legit", "Power outage reported in your area. Estimated restoration 8:30 PM. We're working on it."],
    ["legit", "Your 2-step verification code is 220415. Don't share this code. We'll never ask for it."],
    ["legit", "Can you call me when you get a sec? It's about Thanksgiving plans, nothing urgent"],
    ["legit", "The dentist office called, you need to reschedule Tuesday. Their number is on the fridge."],
    ["legit", "Your electricity bill of $96.12 is due on 5 Dec. Pay in the app or set up autopay in your account."],
  ].map(([label, text]) => ({ label, text }));

  // Round 3 held-out set: written after the round-2 fixes, scored once, frozen.
  // The score on this set is the one we quote. Do not tune against it.
  const HOLDOUT3 = [
    ["scam", "Attention: your Costco membership reward of $250 is about to expire. Answer a 30-second survey to redeem: costco-rewards-club.vip"],
    ["scam", "This is the fraud department at Capital One. We blocked a suspicious wire. For your protection, please confirm your full card number and the 3 digits on the back."],
    ["scam", "Hi Aunty, it's Priya, I'm using a friend's phone. I'm in a bit of trouble and need $350 for a train ticket home, can you send it on Cash App? $priya2025"],
    ["scam", "Your Norton subscription has been renewed for $449.99. Didn't order this? Call our billing team at 1-555-0164 to cancel."],
    ["scam", "Good news! Your student loan qualifies for full forgiveness. Pay a one-time enrollment fee of $199 to secure your spot."],
    ["scam", "Dear account holder, due to a system upgrade all users must re-verify. Failure to do so will result in account termination. login-update-center.net"],
    ["scam", "I'm a crypto mentor. My students make 5x in a week. DM me and I'll add you to my private signals group."],
    ["scam", "Instagram: someone tried to log in from Russia. If this wasn't you, reply with the 6-digit code to secure your account."],
    ["scam", "Hi, we found your resume online. We have a data entry role paying $45/hr. Download the Signal app and message our HR to schedule."],
    ["scam", "Your phone bill has an overcharge. To get your $87 credit, give us your online banking username so we can deposit it."],
    ["scam", "Royal Mail: your parcel is held at our depot. A fee of £1.45 is required: royalmail-parcelfee.com"],
    ["scam", "Mum I'm on my mate's phone, mine's dead. Can you transfer £200 to his account? I'll sort it tomorrow, it's an emergency"],
    ["scam", "Your Apple Pay was used for $612.98 at Best Buy. If you did not make this purchase, call Apple Support 555-0199 immediately."],
    ["scam", "Hi there, quick question - are you the owner of the domain listed on our records? We need to verify your identity to avoid a lawsuit."],
    ["scam", "Sweet! Saw your listing. I'll send a cashier's check for more than the price, just send the difference back to my mover."],
    // --- legitimate ---
    ["legit", "Your Capital One card was declined at Shell for $48.20. If this was you, try again. Questions? Use the Capital One app."],
    ["legit", "Hey Aunty! Landed safe in Chicago, will call you tonight ❤️"],
    ["legit", "Your Norton subscription renews on Jan 4. Manage auto-renewal in your Norton account."],
    ["legit", "Reminder from Westside Clinic: flu shots are available walk-in until 5pm this week."],
    ["legit", "Your package from Etsy will arrive tomorrow between 10am and 2pm."],
    ["legit", "Instagram: your account was logged in from a new device. If this was you, you don't need to do anything."],
    ["legit", "Your bank statement for October is now available. View it by signing in to online banking."],
    ["legit", "Hi, it's Mrs. Okafor from the front office. Lunch money balance is low, you can top it up in the parent app."],
    ["legit", "Urgent: we need everyone to finish the safety training by Friday. Link is on the company intranet homepage."],
    ["legit", "Your T-Mobile bill of $65.00 is due Dec 2. Autopay is on, no action needed."],
    ["legit", "Got your text! Yes I can lend you the ladder, swing by after 6"],
    ["legit", "Your appointment at the DMV is confirmed for 21 Nov at 10:40 AM. Bring your ID and proof of address."],
  ].map(([label, text]) => ({ label, text }));

  return { EXAMPLES, PRACTICE, EVAL, HOLDOUT, HOLDOUT2, HOLDOUT3 };
});
