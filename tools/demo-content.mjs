/**
 * DesignOps · demo content catalogue
 * ─────────────────────────────────────────────────────────────
 * Two demos for each of our twenty categories — the product types a
 * design system actually gets pointed at:
 *
 *   SaaS · Education · Pet Services · AI/Chatbot · E-commerce
 *   Fintech/Crypto · Healthcare · Creative · Real Estate · Gaming
 *   Food & Restaurant · Fitness · Travel · NFT/Web3 · Beauty/Spa
 *   Developer Tools · Entertainment · Legal · Events · Other
 *
 * Entries are written with short keys and expanded by `expand()`, so the
 * catalogue stays readable at forty entries. Every field is real copy — a
 * demo that says "lorem ipsum" is not a demo of anything.
 */

const SHORT = {
  b: "brand",
  t: "tag",
  h: "headline",
  l: "lead",
  c: "cta",
  ca: "ctaAlt",
  s: "stats",
  f: "features",
  p: "pricing",
  q: "quote",
  a: "author",
}

function expand(raw) {
  const out = {}
  for (const [key, value] of Object.entries(raw)) {
    out[SHORT[key] || key] = value
  }
  return out
}

/**
 * Each category: { name, demos: [raw, raw] }.
 * `cat` is stamped on for the gallery filter; `mode` is derived at build
 * time from the proposal's background, not guessed here.
 */
export const CATEGORIES = [
  {
    name: "SaaS",
    demos: [
      {
        b: "DataPulse",
        t: "Real-time analytics",
        h: ["Transform data into", "actionable insights"],
        l: "Track every metric that matters, spot the trend before it breaks, and make the call with numbers you trust.",
        c: "Start free trial",
        ca: "Watch demo",
        s: [["10K+", "Active users"], ["99.9%", "Uptime"], ["50M+", "Data points"], ["124", "Countries"]],
        f: [
          ["Live streaming", "Metrics land the moment they happen, not on the hour."],
          ["Custom dashboards", "Drag, drop, resize. Built for the way your team works."],
          ["Smart alerts", "Threshold breached? You know before your customers do."],
          ["Cohort analysis", "Follow a group over time and see what really retains."],
          ["Warehouse sync", "Push to Snowflake, BigQuery or Redshift on a schedule."],
          ["Enterprise security", "SOC 2 Type II, SSO, and encryption at rest by default."],
        ],
        p: [
          ["Starter", "$29", ["5 team members", "10k events / month", "7-day retention", "Email support"]],
          ["Professional", "$79", ["20 team members", "100k events / month", "90-day retention", "Priority support"], true],
          ["Enterprise", "$199", ["Unlimited members", "Unlimited events", "Dedicated CSM", "SLA guarantee"]],
        ],
        q: "We caught a 12% drop in activation the week it happened, not the quarter after.",
        a: "Sarah Johnson · CEO, TechStart",
      },
      {
        b: "Flowdeck",
        t: "Workflow automation",
        h: ["Stop doing", "the boring parts"],
        l: "Connect the tools you already use and let the handoffs run themselves. No engineering ticket required.",
        c: "Automate a workflow",
        ca: "Browse templates",
        s: [["300+", "Integrations"], ["2.4M", "Tasks automated"], ["0", "Lines of code"], ["4.8★", "User rating"]],
        f: [
          ["Visual builder", "Drag the steps, see the path. Branching included."],
          ["Conditional logic", "Route on any field, with fallbacks when data is missing."],
          ["Retry and alert", "Failures retry with backoff, then page a human."],
          ["Version history", "Every change is saved, diffable and one click from rollback."],
          ["Team libraries", "Publish a workflow once and let the whole org reuse it."],
          ["Audit log", "Who changed what, when, and what ran as a result."],
        ],
        p: [
          ["Solo", "$19", ["1 user", "500 tasks / month", "10 workflows", "Community support"]],
          ["Team", "$69", ["10 users", "25k tasks / month", "Unlimited workflows", "Priority support"], true],
          ["Scale", "$229", ["Unlimited users", "250k tasks / month", "SSO & audit log", "Dedicated support"]],
        ],
        q: "The ops team shipped eleven automations in a month without asking engineering for anything.",
        a: "Daniel Osei · Head of Ops, Kestrel",
      },
    ],
  },
  {
    name: "Education",
    demos: [
      {
        b: "Lumen Academy",
        t: "Learn at your pace",
        h: ["The classroom", "comes to you"],
        l: "Cohort-based courses with real feedback, mentor office hours, and a certificate that means something.",
        c: "Browse courses",
        ca: "Meet the mentors",
        s: [["48K", "Learners"], ["120", "Courses"], ["92%", "Completion"], ["4.7★", "Average rating"]],
        f: [
          ["Live cohorts", "Start together, finish together, with a cohort that keeps pace."],
          ["Mentor feedback", "Real comments on real work, not a multiple-choice grade."],
          ["Project portfolio", "Leave with five pieces you would actually show an employer."],
          ["Office hours", "Weekly drop-in sessions with practitioners in the field."],
          ["Offline mode", "Download lessons and keep going without a connection."],
          ["Financial aid", "Sliding-scale places on every cohort, no essay required."],
        ],
        p: [
          ["Single course", "$149", ["One cohort", "All materials", "Peer community", "Certificate"]],
          ["Annual", "$399", ["All 120 courses", "Unlimited cohorts", "Mentor office hours", "Portfolio review"], true],
          ["Teams", "Custom", ["Seats for your org", "Progress dashboards", "Invoicing", "Custom paths"]],
        ],
        q: "I changed careers at thirty-four with the portfolio I built here. That is not a cliché — it is what happened.",
        a: "Nadia Farouk · Product Designer",
      },
      {
        b: "Skillbridge",
        t: "Bootcamp, reimagined",
        h: ["Twelve weeks", "to a new career"],
        l: "An intensive, mentor-led bootcamp built around the stack companies are actually hiring for right now.",
        c: "Apply now",
        ca: "Download syllabus",
        s: [["12", "Weeks"], ["8:1", "Student to mentor"], ["89%", "Hired in 6 months"], ["£0", "Upfront"]],
        f: [
          ["Mentor-led", "Every student paired with a working engineer, not a Teaching Assistant."],
          ["Real codebase", "You contribute to an open-source project from week four."],
          ["Interview prep", "Mock technicals weekly from week eight onwards."],
          ["Career support", "Introductions to hiring partners, and help negotiating."],
          ["Pay when hired", "Nothing upfront; pay a share of salary once you land."],
          ["Lifetime access", "Come back and retake any cohort, forever."],
        ],
        p: [
          ["Self-paced", "Free", ["All written material", "Community access", "No mentor time"]],
          ["Bootcamp", "£0 upfront", ["Full 12 weeks", "Mentor pairing", "Career support", "Pay when hired"], true],
          ["Employer", "£4,500", ["Sponsored seat", "Progress reporting", "Hiring introduction"]],
        ],
        q: "The mentor time was the whole thing. Being stuck for twenty minutes instead of two days changes everything.",
        a: "Kwame Adeyemi · Software Engineer",
      },
    ],
  },
  {
    name: "Pet Services",
    demos: [
      {
        b: "Pawsome Care",
        t: "Gentle, expert care",
        h: ["Your pet's second", "favourite place"],
        l: "Routine checkups, urgent care and dental work — delivered by people who remember your dog's name.",
        c: "Book an appointment",
        ca: "Meet the team",
        s: [["12K", "Pets cared for"], ["8", "Vets on staff"], ["24/7", "Urgent line"], ["4.9★", "Average rating"]],
        f: [
          ["Wellness exams", "A full nose-to-tail check, with time to talk it through."],
          ["Dentistry", "Scaling, polishing and extractions under full anaesthesia monitoring."],
          ["Surgery", "Two theatres, on-site recovery, and a vet on call overnight."],
          ["Vaccinations", "Core and lifestyle vaccines on a schedule that suits you."],
          ["Diagnostics", "Digital x-ray, ultrasound and an in-house lab for same-day results."],
          ["Urgent care", "Walk in during hours; a vet answers the phone after them."],
        ],
        p: [
          ["Puppy & Kitten", "$180", ["First two visits", "Core vaccinations", "Microchipping", "Starter toolkit"]],
          ["Adult Annual", "$240", ["Full wellness exam", "Core vaccinations", "Dental check", "Blood screen"], true],
          ["Senior", "$320", ["Twice-yearly exams", "Full blood panel", "Joint assessment", "Diet planning"]],
        ],
        q: "They stayed an hour past closing to stabilise our cat. I have never been more grateful for a phone number.",
        a: "Thabo Mokoena · Milo's human",
      },
      {
        b: "The Groom Room",
        t: "Calm, unhurried grooming",
        h: ["Good hair days,", "for everyone"],
        l: "One dog at a time, no cage dryers, and a groomer who texts you a photo when it is done.",
        c: "Book a groom",
        ca: "See our work",
        s: [["1 dog", "At a time"], ["9 yrs", "Grooming experience"], ["20 min", "Average handover"], ["100%", "Cage-dryer free"]],
        f: [
          ["One at a time", "No waiting kennels, no barking chorus. Just your dog."],
          ["No cage dryers", "Hand-dried throughout, which is slower and much kinder."],
          ["Breed and mix", "From poodle clips to double-coat de-shedding."],
          ["Nails and ears", "Included in every groom, never an upsell."],
          ["Photo updates", "A message when they are in, and one when they are done."],
          ["Nervous dogs", "Desensitisation visits so the table stops being scary."],
        ],
        p: [
          ["Small breed", "$55", ["Wash and dry", "Full clip", "Nails and ears", "Photo update"]],
          ["Large breed", "$85", ["Wash and dry", "De-shedding treatment", "Nails and ears", "Photo update"], true],
          ["Full spa", "$120", ["Everything in Large", "Teeth cleaning", "Paw balm", "Bandana or bow"]],
        ],
        q: "Our rescue used to shake at the door. Now she walks in and lies down. That is the whole review.",
        a: "Priya Naidoo · Juno's human",
      },
    ],
  },
  {
    name: "AI/Chatbot",
    demos: [
      {
        b: "Cortex Desk",
        t: "Support that answers",
        h: ["Resolve 70% of tickets", "before a human sees them"],
        l: "An assistant grounded in your docs, your policies and your tone — with a clean handover when it is out of its depth.",
        c: "Start free trial",
        ca: "See a live demo",
        s: [["70%", "Deflection rate"], ["1.8s", "Median reply"], ["31", "Languages"], ["4.6★", "CSAT"]],
        f: [
          ["Grounded answers", "Trained only on your content, with citations on every claim."],
          ["Knows its limits", "Confidence-scored, and escalates rather than guessing."],
          ["Full handover", "The human sees the transcript and the attempted answers."],
          ["Actions, not chat", "Refund, reschedule, cancel — via your existing APIs."],
          ["Tone matching", "Sounds like your team wrote it, because it learned from them."],
          ["Analytics", "What people ask, where the bot fails, what to fix next."],
        ],
        p: [
          ["Starter", "$79", ["1,000 resolutions", "2 agents", "Email support", "Docs grounding"]],
          ["Growth", "$249", ["10,000 resolutions", "10 agents", "API actions", "Analytics"], true],
          ["Enterprise", "Custom", ["Unlimited volume", "SSO & SCIM", "On-prem option", "SLA"]],
        ],
        q: "Deflection was the pitch, but the analytics turned out to be the product. We fixed forty help articles in a month.",
        a: "Marta Silva · Support Lead, Vela",
      },
      {
        b: "Promptly",
        t: "Your writing copilot",
        h: ["Write the thing", "you are avoiding"],
        l: "Draft, rewrite and tighten anything — in your voice, with the arguments in the order you would put them.",
        c: "Try it free",
        ca: "Watch a walkthrough",
        s: [["2.1M", "Drafts written"], ["14", "Tone presets"], ["0", "Data retention"], ["4.8★", "Rating"]],
        f: [
          ["Voice matching", "Give it three samples and it stops sounding like a robot."],
          ["Structural edits", "Move the argument, not just the adjectives."],
          ["Length control", "Same draft, five lengths, one click each."],
          ["Citations", "Every factual claim traced back to a source."],
          ["Nothing retained", "Your text is not used for training, ever."],
          ["Everywhere", "Browser extension, desktop app, and a CLI for the terminal."],
        ],
        p: [
          ["Free", "$0", ["20 drafts / month", "3 tones", "Browser extension"]],
          ["Pro", "$18", ["Unlimited drafts", "All 14 tones", "Citations", "Desktop app"], true],
          ["Team", "$42", ["Everything in Pro", "Shared voice library", "Brand rules", "Admin controls"]],
        ],
        q: "It does not write for me. It argues with me, which is what I actually needed.",
        a: "Jonas Berger · Founder, Tidewater",
      },
    ],
  },
  {
    name: "E-commerce",
    demos: [
      {
        b: "Maison Lume",
        t: "Considered objects",
        h: ["Fewer things,", "chosen well"],
        l: "Small-batch homeware from makers we have met, shipped in packaging you can compost.",
        c: "Shop the collection",
        ca: "Our story",
        s: [["84", "Makers"], ["100%", "Plastic-free"], ["48h", "Dispatch"], ["30-day", "Returns"]],
        f: [
          ["Made in small runs", "Nothing here was produced by the million."],
          ["Plastic-free", "Paper, card and mycelium. That is the whole list."],
          ["Repairable", "Spare parts stocked for every product we sell."],
          ["Traceable", "Every item names the workshop that made it."],
          ["Carbon accounted", "Emissions measured per order, not estimated yearly."],
          ["Fair terms", "Makers set their price. We take a published margin."],
        ],
        p: [
          ["The Starter", "$45", ["1 hand-thrown mug", "Linen tea towel", "Recycled card box"]],
          ["The Kitchen", "$180", ["4-piece stoneware set", "Oak board", "Cotton aprons"], true],
          ["The Home", "$420", ["Full table setting", "Throw & cushions", "Brass lighting", "Styling guide"]],
        ],
        q: "I have bought three of the same mug over four years. They just last, and look better each year.",
        a: "Ingrid Sørensen · Copenhagen",
      },
      {
        b: "Thread & Co",
        t: "Made to measure",
        h: ["Clothes that fit", "the first time"],
        l: "Send us two measurements and a photo. We send back a shirt that fits, or we make it again for free.",
        c: "Build your shirt",
        ca: "Fabric guide",
        s: [["6", "Measurements"], ["41", "Fabrics"], ["14-day", "Delivery"], ["Free", "Remake"]],
        f: [
          ["Six measurements", "No tailor's tape gymnastics, no appointment needed."],
          ["Fit guarantee", "Wrong first time? We remake it, on us."],
          ["Fabric library", "41 mills, from Oxford cotton to Irish linen."],
          ["Collar and cuff", "Twelve collar shapes, six cuffs, monogram optional."],
          ["Reorder in one tap", "Your pattern is saved; new fabric, same fit."],
          ["Repairs for life", "Send it back and we will mend it, free, forever."],
        ],
        p: [
          ["First shirt", "$89", ["Any fabric", "Saved pattern", "Fit guarantee", "Free remake"]],
          ["Three-pack", "$239", ["Three shirts", "Any fabrics", "Monogramming", "Free shipping"], true],
          ["Subscription", "$75/qtr", ["One shirt a quarter", "Seasonal fabrics", "Early access", "Free repairs"]],
        ],
        q: "Off-the-rack never fit my shoulders. This is the first shirt I have owned that I forget I am wearing.",
        a: "Marcus Bell · Melbourne",
      },
    ],
  },
  {
    name: "Fintech/Crypto",
    demos: [
      {
        b: "Ledgerline",
        t: "Built for finance teams",
        h: ["Close the books", "in days, not weeks"],
        l: "Reconciliation, approvals and reporting in one ledger your auditors can actually read.",
        c: "Start free trial",
        ca: "Talk to sales",
        s: [["$4.2B", "Processed"], ["99.99%", "Ledger uptime"], ["3 days", "Avg. close"], ["60+", "Integrations"]],
        f: [
          ["Continuous close", "Reconcile daily so month-end is a review, not a project."],
          ["Audit trail", "Every entry immutable, timestamped and attributable."],
          ["Approval chains", "Route by amount, entity or cost centre."],
          ["Multi-entity", "Consolidate across subsidiaries and currencies."],
          ["Bank feeds", "Direct connections to 12,000 institutions worldwide."],
          ["Controls", "Segregation of duties and role-scoped access by default."],
        ],
        p: [
          ["Team", "$99", ["1 entity", "2 approvers", "Bank feeds", "Email support"]],
          ["Business", "$349", ["5 entities", "Unlimited approvers", "Multi-currency", "Audit export"], true],
          ["Enterprise", "Custom", ["Unlimited entities", "SSO & SCIM", "Dedicated CSM", "SLA & DPA"]],
        ],
        q: "Month-end went from nine days to three, and the audit pack builds itself now.",
        a: "Amelia Hart · Controller, Northwind",
      },
      {
        b: "Satoshi Vault",
        t: "Self-custody, simplified",
        h: ["Your keys.", "Your coins. Finally usable."],
        l: "Hardware-grade key management with an interface your family could actually operate.",
        c: "Set up a vault",
        ca: "How it works",
        s: [["$3.1B", "Secured"], ["0", "Custodial hacks"], ["3-of-5", "Default policy"], ["12", "Chains"]],
        f: [
          ["Multi-signature", "3-of-5 by default, with your own key holders."],
          ["Recovery that works", "Social recovery with named guardians, not a seed phrase under the mattress."],
          ["Policy engine", "Spend limits, allowlists and time-locks on every vault."],
          ["Inheritance", "A documented path for heirs, tested before it is needed."],
          ["Twelve chains", "Bitcoin, Ethereum and the majors, one interface."],
          ["Open source", "The firmware and the app are public and reproducible."],
        ],
        p: [
          ["Personal", "$0", ["Software vault", "2-of-3 recovery", "2 chains", "Community support"]],
          ["Pro", "$149", ["Hardware bundle", "3-of-5 policy", "All 12 chains", "Priority support"], true],
          ["Institution", "Custom", ["Bespoke policy", "Audit support", "Dedicated engineer", "SLA"]],
        ],
        q: "My mother can now recover her own vault. That is the highest compliment I can pay a security product.",
        a: "Ravi Menon · CISO, Arbor",
      },
    ],
  },
  {
    name: "Healthcare",
    demos: [
      {
        b: "Meridian Health",
        t: "Care that keeps up",
        h: ["See a doctor", "in fifteen minutes"],
        l: "Same-day appointments, records that follow you, and a care team that already knows your history.",
        c: "Book a consultation",
        ca: "Our services",
        s: [["15 min", "Median wait"], ["24/7", "Virtual care"], ["96%", "Would recommend"], ["1", "Record, everywhere"]],
        f: [
          ["Same-day slots", "Mornings are held back for urgent appointments, every day."],
          ["One record", "Your history, imaging and prescriptions in one place."],
          ["Virtual first", "Most things can be handled without a waiting room."],
          ["Specialist referral", "Referred in-app, with the notes sent ahead of you."],
          ["Repeat prescriptions", "Request, approve and collect without a phone call."],
          ["Transparent pricing", "You see the cost before you agree to anything."],
        ],
        p: [
          ["Pay as you go", "$65", ["One consultation", "Virtual or in person", "Digital notes", "Prescription service"]],
          ["Membership", "$29/mo", ["Unlimited virtual", "2 in-person visits", "Priority booking", "Family sharing"], true],
          ["Family", "$79/mo", ["Up to 6 people", "Unlimited virtual", "Paediatric care", "Annual screening"]],
        ],
        q: "I was diagnosed on a Sunday evening. That would have been a three-week wait anywhere else.",
        a: "Chloe Williams · Bristol",
      },
      {
        b: "Mindful",
        t: "Therapy, without the waitlist",
        h: ["Talk to someone", "this week"],
        l: "Licensed therapists, matched to you, with sessions that fit around a working day.",
        c: "Find a therapist",
        ca: "How matching works",
        s: [["4 days", "Average to first session"], ["340", "Licensed therapists"], ["18", "Languages"], ["4.9★", "Member rating"]],
        f: [
          ["Real matching", "A short intake, then three therapists who actually fit."],
          ["Switch freely", "Not the right fit? Change therapist without explaining yourself."],
          ["Flexible hours", "Evenings and weekends, because that is when people are free."],
          ["Video, voice or text", "Whatever you can manage that week."],
          ["Between sessions", "Journaling prompts and check-ins from your therapist."],
          ["Confidential", "Encrypted end to end, and never sold to anyone."],
        ],
        p: [
          ["Pay per session", "$85", ["50-minute session", "Any therapist", "Secure messaging"]],
          ["Monthly", "$260", ["4 sessions / month", "Between-session messaging", "Switch anytime"], true],
          ["Intensive", "$720", ["12 sessions", "One dedicated therapist", "Structured programme", "Progress review"]],
        ],
        q: "The waitlist everywhere else was four months. Here it was four days, and the match was right first time.",
        a: "Anonymous member · Leeds",
      },
    ],
  },
  {
    name: "Creative",
    demos: [
      {
        b: "Studio Aperture",
        t: "Photography with intent",
        h: ["Pictures that", "outlast the trend"],
        l: "Editorial, architectural and portrait work from a studio that shoots on film as often as digital.",
        c: "View portfolio",
        ca: "Start a project",
        s: [["14 yrs", "Practising"], ["6", "Countries shot"], ["3", "Awards"], ["100%", "Film or digital, your call"]],
        f: [
          ["Editorial", "Commissioned work for magazines and independent titles."],
          ["Architecture", "Spaces photographed with patience for the right light."],
          ["Portrait", "Sittings that are conversations, not assemblies."],
          ["Film and digital", "Same eye, either medium, chosen per project."],
          ["Retouching in-house", "Grading and retouching done by the person who shot it."],
          ["Print sales", "Archival prints, editioned and signed."],
        ],
        p: [
          ["Portrait sitting", "$450", ["2 hours", "One location", "25 retouched frames", "Print credit"]],
          ["Editorial day", "$1,800", ["Full day", "Pre-production", "Unlimited frames", "30 retouched"], true],
          ["Commission", "Custom", ["Multi-day", "Travel included", "Usage licensing", "Print package"]],
        ],
        q: "They spent twenty minutes waiting for the light instead of fixing it afterwards. You can see the difference.",
        a: "Elena Rossi · Art Director, Vessel",
      },
      {
        b: "Pigment",
        t: "Brand and digital",
        h: ["Design that", "does a job"],
        l: "A small studio building identities and products for companies that have something specific to say.",
        c: "Start a project",
        ca: "See our work",
        s: [["9 yrs", "In practice"], ["60+", "Brands built"], ["2", "Studios, one team"], ["100%", "Senior-led"]],
        f: [
          ["Identity", "Marks, type systems and the rules that keep them standing."],
          ["Product design", "Interfaces designed with the engineers who build them."],
          ["Design systems", "Tokens, components and documentation your team maintains."],
          ["Motion", "Movement that explains, rather than decorates."],
          ["Naming and voice", "What you are called, and how you sound."],
          ["Senior-led", "The person who pitches is the person who does the work."],
        ],
        p: [
          ["Identity sprint", "$12K", ["2 weeks", "Mark and type", "Usage rules", "Brand sheet"]],
          ["Full identity", "$38K", ["6 weeks", "Full system", "Design tokens", "Guidelines"], true],
          ["Product partner", "From $9K/mo", ["Embedded designer", "Design system", "Ongoing delivery"]],
        ],
        q: "They argued with our brief, which was uncomfortable and exactly what we needed.",
        a: "Tom Aldridge · CMO, Fathom",
      },
    ],
  },
  {
    name: "Real Estate",
    demos: [
      {
        b: "Havenly Estates",
        t: "Homes, not listings",
        h: ["Find the one", "you stop searching in"],
        l: "Every property visited, photographed properly and described by someone who has stood in the room.",
        c: "Browse homes",
        ca: "Book a viewing",
        s: [["1,240", "Homes sold"], ["18", "Years local"], ["4 days", "Median to offer"], ["100%", "Visited in person"]],
        f: [
          ["Visited first", "No listing goes up before an agent has been inside."],
          ["Honest descriptions", "If the kitchen is small, the listing says so."],
          ["Floor plans", "Measured plans on every property, not marketing sketches."],
          ["Local knowledge", "School catchments, flood risk and the street at 8pm."],
          ["Virtual tours", "Walk it before you travel, in your own time."],
          ["Offer support", "We handle the chain, the survey and the awkward phone calls."],
        ],
        p: [
          ["Sales", "1.2%", ["Valuation", "Professional photos", "Floor plan", "Negotiation"]],
          ["Premium", "1.8%", ["Everything in Sales", "Virtual tour", "Video walkthrough", "Dedicated agent"], true],
          ["Lettings", "8% /mo", ["Tenant finding", "References", "Inventory", "Ongoing management"]],
        ],
        q: "They told us not to buy the second house. That is when we knew they were on our side.",
        a: "Ruth and Peter K. · Buyers, Leeds",
      },
      {
        b: "Northkey",
        t: "Rentals, sorted",
        h: ["Rent without", "the runaround"],
        l: "Verified listings, deposits protected by law, and a maintenance team that answers the phone.",
        c: "Find a rental",
        ca: "List a property",
        s: [["8,400", "Homes listed"], ["92%", "Renewals"], ["48h", "Repair response"], ["0", "Hidden fees"]],
        f: [
          ["Verified listings", "Every property checked against the register before it goes live."],
          ["Protected deposits", "Held in a government scheme, every time, no exceptions."],
          ["Repairs that happen", "Report in-app; median first visit is 48 hours."],
          ["Fair fees", "No admin charges, no renewal fees, no surprises."],
          ["Flexible terms", "Six, twelve or twenty-four months, your choice."],
          ["Room-by-room", "House shares with proper agreements between housemates."],
        ],
        p: [
          ["Tenant", "Free", ["Verified listings", "Protected deposit", "Repair reporting", "Contract storage"]],
          ["Landlord", "9% /mo", ["Tenant finding", "References", "Rent collection", "Repair coordination"], true],
          ["Portfolio", "6% /mo", ["5+ properties", "Compliance monitoring", "Dedicated manager", "Annual review"]],
        ],
        q: "The boiler broke on a Sunday. Someone answered, and someone came. That is the entire review.",
        a: "Sam Okafor · Tenant, Manchester",
      },
    ],
  },
  {
    name: "Gaming",
    demos: [
      {
        b: "Pixelforge",
        t: "Games with a spine",
        h: ["Small studio,", "stubborn ideas"],
        l: "An independent studio making games that trust the player to work things out.",
        c: "Wishlist now",
        ca: "Watch the trailer",
        s: [["6", "Games shipped"], ["2.4M", "Players"], ["11", "Awards"], ["0", "Microtransactions"]],
        f: [
          ["No microtransactions", "You buy the game. You get the game."],
          ["Hand-drawn", "Every frame drawn by a person, not generated."],
          ["Original score", "Recorded with a live ensemble, not a sample library."],
          ["Full accessibility", "Remappable everything, scalable text, and no QTEs."],
          ["Mod support", "Documented tools shipped on day one."],
          ["Cross-save", "Start on Steam, finish on console, keep your progress."],
        ],
        p: [
          ["Supporter", "$15", ["Digital edition", "Soundtrack", "Art book PDF"]],
          ["Collector", "$55", ["Everything in Supporter", "Physical art book", "Vinyl soundtrack"], true],
          ["Patron", "$120", ["Everything in Collector", "Your name in the credits", "Studio updates"]],
        ],
        q: "Forty hours in and I have not been asked to buy anything once. I had forgotten that was possible.",
        a: "Reviewer, Left Click Weekly",
      },
      {
        b: "Arena Rank",
        t: "Competitive coaching",
        h: ["Climb the ladder", "with evidence"],
        l: "Replay analysis, coaching and team tools for players who want to improve, not just play more.",
        c: "Analyse a replay",
        ca: "Find a coach",
        s: [["1.8M", "Replays analysed"], ["620", "Verified coaches"], ["+180", "Avg. rating gain"], ["9", "Titles supported"]],
        f: [
          ["Replay analysis", "Upload a match, get timestamped decisions handed back."],
          ["Verified coaches", "Rank-checked and reviewed before they can take bookings."],
          ["Team tools", "Shared VOD review, drills and a practice schedule."],
          ["Progress tracking", "See the specific thing you improved, not just a number."],
          ["Draft helper", "Composition and counter-pick data, updated weekly."],
          ["Scrim finder", "Match with teams at your level in under five minutes."],
        ],
        p: [
          ["Free", "$0", ["10 analyses / month", "Basic stats", "Community access"]],
          ["Ranked", "$12/mo", ["Unlimited analyses", "Draft helper", "Progress tracking"], true],
          ["Team", "$49/mo", ["6 members", "Team tools", "Scrim finder", "Shared review"]],
        ],
        q: "It told me I was losing every fight at 40 seconds. I did not believe it until I watched the reel.",
        a: "K. Tanaka · Diamond II",
      },
    ],
  },
  {
    name: "Food & Restaurant",
    demos: [
      {
        b: "Ember & Oak",
        t: "Fire-cooked, seasonal",
        h: ["Cooked over fire,", "served without fuss"],
        l: "A neighbourhood restaurant with one menu, written daily, and a grill that never goes out.",
        c: "Reserve a table",
        ca: "See the menu",
        s: [["12", "Tables only"], ["1", "Menu, daily"], ["90%", "Local produce"], ["4.8★", "Guest rating"]],
        f: [
          ["One daily menu", "Written that morning based on what arrived."],
          ["Fire-led", "Everything touches the grill, including the vegetables."],
          ["Local sourcing", "Nine suppliers within thirty miles."],
          ["Natural wine", "Low-intervention list, chosen to go with smoke."],
          ["No tipping", "Service is included and staff are paid properly."],
          ["Counter seating", "Six seats at the pass, if you like watching."],
        ],
        p: [
          ["Lunch", "$38", ["Three courses", "Bread and butter", "Filtered water"]],
          ["Dinner", "$72", ["Five courses", "Snacks to start", "Petit fours"], true],
          ["Counter", "$95", ["Seven courses", "At the pass", "Kitchen conversation", "Wine pairing optional"]],
        ],
        q: "The best meal I have had this year, in a room with twelve tables and no music worth mentioning.",
        a: "Food & Fire magazine",
      },
      {
        b: "Pantry",
        t: "Cook real food, faster",
        h: ["Dinner sorted", "in twenty minutes"],
        l: "Recipe kits with pre-measured ingredients and instructions that assume you are tired.",
        c: "Choose this week",
        ca: "How it works",
        s: [["20 min", "Average cook"], ["68", "Recipes"], ["0", "Plastic packaging"], ["skip", "Any week"]],
        f: [
          ["Pre-measured", "Nothing to weigh, nothing left over to go slimy."],
          ["Genuinely fast", "Every recipe tested to a twenty-minute median."],
          ["Zero plastic", "Paper, card and compostable film throughout."],
          ["Skip any week", "Pause in two taps, no phone call, no retention offer."],
          ["Surplus boxes", "Cheaper boxes built from whatever needs using."],
          ["Technique cards", "Each kit teaches one thing you will use again."],
        ],
        p: [
          ["Two meals", "$28", ["2 recipes", "2 people", "Recipe cards"]],
          ["Family", "$54", ["4 recipes", "4 people", "Kid-friendly options"], true],
          ["Surplus", "$21", ["3 recipes", "Seasonal produce", "Cheaper by design"]],
        ],
        q: "It is the only subscription I have not cancelled, mostly because cancelling a week is genuinely easy.",
        a: "Hannah Bruce · Glasgow",
      },
    ],
  },
  {
    name: "Fitness",
    demos: [
      {
        b: "Ironwood",
        t: "Strength, coached properly",
        h: ["Get strong", "without guessing"],
        l: "A strength gym with coaching on the floor, not a tablet telling you what to do.",
        c: "Book an intro",
        ca: "Meet the coaches",
        s: [["1:6", "Coach to member"], ["240", "Members, capped"], ["3", "Squat racks per member"], ["11 yrs", "Coaching"]],
        f: [
          ["Coached sessions", "A coach is on the floor every hour the gym is open."],
          ["Capped membership", "We stop at 240 so the racks are always free."],
          ["Individual programming", "Your progression written for you, reviewed monthly."],
          ["Beginner pathway", "A six-week intro before you touch a barbell."],
          ["Open gym", "Uncoached hours for members who know their way round."],
          ["Physio on site", "Weekly clinic, and coaches who actually refer."],
        ],
        p: [
          ["Off-peak", "$49/mo", ["Open gym hours", "App programming", "Locker and towel"]],
          ["Coached", "$99/mo", ["Everything off-peak", "4 coached sessions / week", "Monthly review"], true],
          ["1-to-1", "$240/mo", ["Weekly 1-to-1", "Individual programming", "Physio access"]],
        ],
        q: "I have been at three gyms. This is the first where somebody noticed I stopped coming.",
        a: "Grace Mahlangu · Member, 2 yrs",
      },
      {
        b: "Cadence",
        t: "Running, planned",
        h: ["Train for something", "and arrive ready"],
        l: "Adaptive running plans that move around your week instead of breaking when you miss a session.",
        c: "Start a plan",
        ca: "How plans adapt",
        s: [["340K", "Runs logged"], ["5K–Ultra", "Distances"], ["91%", "Finish their race"], ["4.7★", "Rating"]],
        f: [
          ["Adaptive plans", "Miss a run, and the plan rewrites itself without guilt."],
          ["Pace zones", "From a simple time trial, no lab required."],
          ["Strength and mobility", "The bits runners skip, scheduled properly."],
          ["Race strategy", "Pacing, fuelling and a plan for the last third."],
          ["Weather aware", "Heat, wind and hills folded into the week."],
          ["Any watch", "Syncs from Garmin, Coros, Apple or Strava."],
        ],
        p: [
          ["Free", "$0", ["One plan", "Basic tracking", "Community"]],
          ["Pro", "$9/mo", ["Adaptive plans", "Pace zones", "Strength sessions", "Race strategy"], true],
          ["Coach", "$39/mo", ["Human coach review", "Weekly feedback", "Unlimited plans"]],
        ],
        q: "I missed two weeks with flu and the plan just absorbed it. I still finished my marathon.",
        a: "Oliver Grant · Manchester",
      },
    ],
  },
  {
    name: "Travel",
    demos: [
      {
        b: "Wanderlane",
        t: "Trips that fit you",
        h: ["Stop planning.", "Start going."],
        l: "Tell us how you like to travel; we build the itinerary, book it, and stay reachable the whole time.",
        c: "Plan a trip",
        ca: "See sample trips",
        s: [["82", "Countries"], ["4.9★", "Traveller rating"], ["24/7", "On-trip support"], ["100%", "Tailor-made"]],
        f: [
          ["Tailor-made", "No templates. Every trip built from how you answered."],
          ["One point of contact", "The person who planned it is reachable while you are away."],
          ["Realistic pacing", "Two bases a week, not six cities in ten days."],
          ["Vetted stays", "Every property visited by someone we employ."],
          ["Disruption cover", "Missed connection, rebooked before you land."],
          ["Local guides", "Residents, not buses, for the parts that matter."],
        ],
        p: [
          ["Weekend", "From $420", ["3 days", "One base", "Vetted stay", "Support line"]],
          ["Signature", "From $2,400", ["10–14 days", "Two or three bases", "Guided days", "24/7 support"], true],
          ["Bespoke", "Custom", ["Any duration", "Fully tailored", "Private guides", "Concierge"]],
        ],
        q: "Our train was cancelled in Bologna and it was already rebooked before we saw the notice board.",
        a: "The Hartley family · Travellers",
      },
      {
        b: "Aviary",
        t: "Flights, honest about cost",
        h: ["The fare", "you actually pay"],
        l: "Search that shows the real price including bags, seats and the airport transfer nobody mentions.",
        c: "Search flights",
        ca: "Price breakdown",
        s: [["900+", "Airlines"], ["100%", "Total price shown"], ["0", "Booking fees"], ["4.6★", "Rating"]],
        f: [
          ["Total price first", "Bags, seats and card fees in the headline number."],
          ["No booking fee", "We are paid by the airline, transparently disclosed."],
          ["Transfer cost", "What it costs to get from that airport to the city."],
          ["Disruption rights", "Your entitlements shown before you book, plainly."],
          ["Carbon per flight", "Compare emissions alongside price and duration."],
          ["Price prediction", "Whether to book now or wait, with the reasoning shown."],
        ],
        p: [
          ["Free", "$0", ["Total-price search", "Carbon data", "Price prediction"]],
          ["Alerts", "$0", ["Price drop alerts", "Flexible date scan", "Disruption notices"], true],
          ["Premium", "$29/yr", ["Hidden-city routing", "Lounge access deals", "Priority support"]],
        ],
        q: "First time a search engine has shown me the same number the airline charged me.",
        a: "Lucy Whitfield · Frequent flyer",
      },
    ],
  },
  {
    name: "NFT/Web3",
    demos: [
      {
        b: "Prism Mint",
        t: "Creators first",
        h: ["Mint without", "the minefield"],
        l: "A marketplace with honest fees, gasless minting and contracts you can read before you sign.",
        c: "Start creating",
        ca: "Explore collections",
        s: [["0%", "Minting fee"], ["2.5%", "Marketplace fee"], ["100%", "Contracts verified"], ["48K", "Creators"]],
        f: [
          ["Gasless minting", "Create without paying gas upfront; settled on sale."],
          ["Honest fees", "2.5%, displayed before you confirm. Nothing hidden."],
          ["Verified contracts", "Human-readable and audited before listing."],
          ["Royalties enforced", "Creator royalties respected at protocol level."],
          ["Fiat on-ramp", "Buy with a card; no exchange account needed."],
          ["Portable identity", "Your collection history follows your wallet, not our platform."],
        ],
        p: [
          ["Creator", "Free", ["Gasless minting", "Collection page", "Royalty settings"]],
          ["Studio", "$19/mo", ["Drop scheduling", "Allowlist tools", "Analytics"], true],
          ["Enterprise", "Custom", ["Custom contracts", "Dedicated support", "White-label"]],
        ],
        q: "I read the contract before signing. That has literally never happened to me on a marketplace.",
        a: "Zoe Keane · Generative artist",
      },
      {
        b: "Chainproof",
        t: "Audit before you deploy",
        h: ["Ship contracts", "you can defend"],
        l: "Automated analysis, human review and a report your investors can actually read.",
        c: "Request an audit",
        ca: "Read a sample report",
        s: [["1,400+", "Contracts audited"], ["0", "Post-audit exploits"], ["5 days", "Median turnaround"], ["3", "Reviewers per report"]],
        f: [
          ["Automated analysis", "Symbolic execution and fuzzing before a human looks."],
          ["Human review", "Three reviewers minimum, named on every report."],
          ["Readable reports", "Findings ranked by exploitability, with the fix shown."],
          ["Re-review included", "Fix it and we check again at no extra cost."],
          ["Monitoring", "Post-deployment alerts on your live contracts."],
          ["Disclosure policy", "Findings published after 90 days, coordinated with you."],
        ],
        p: [
          ["Express", "$4,500", ["Automated analysis", "One reviewer", "3 days", "PDF report"]],
          ["Standard", "$12,000", ["Full analysis", "Three reviewers", "Re-review included", "Fix guidance"], true],
          ["Retainer", "From $9K/mo", ["Continuous review", "Monitoring", "Priority scheduling"]],
        ],
        q: "The report found two things our own tests missed, and explained them well enough that we fixed them in an afternoon.",
        a: "Dev lead, Meridian Protocol",
      },
    ],
  },
  {
    name: "Beauty/Spa",
    demos: [
      {
        b: "Serene Spa",
        t: "Quiet, properly",
        h: ["An hour", "that is actually yours"],
        l: "Treatments with no upsell, no hard sell on products, and a quiet room you can sit in afterwards.",
        c: "Book a treatment",
        ca: "View treatments",
        s: [["9", "Treatment rooms"], ["0", "Sales pressure"], ["60 min", "Minimum treatment"], ["4.9★", "Guest rating"]],
        f: [
          ["No upsell", "Nobody will try to sell you a serum on the way out."],
          ["Real durations", "Sixty minutes means sixty minutes, not forty-five."],
          ["Quiet room", "Stay as long as you like afterwards. Tea, no talking."],
          ["Therapist choice", "Pick your therapist and keep them."],
          ["Clean formulations", "Full ingredient list published for everything used."],
          ["Accessible", "Step-free throughout, with hoist-assisted treatments."],
        ],
        p: [
          ["Express", "$75", ["30 minutes", "Any express treatment", "Quiet room access"]],
          ["Signature", "$140", ["60 minutes", "Full body", "Scalp ritual", "Quiet room"], true],
          ["Half day", "$320", ["Three treatments", "Lunch included", "Full-day quiet room"]],
        ],
        q: "Nobody tried to sell me anything. I nearly asked whether something was wrong.",
        a: "Fatima Rahman · Regular guest",
      },
      {
        b: "Glow Lab",
        t: "Skincare that says what it does",
        h: ["Fewer products.", "Better skin."],
        l: "A short routine with the actives disclosed, the percentages published and the evidence linked.",
        c: "Build a routine",
        ca: "See the evidence",
        s: [["9", "Products, total"], ["100%", "Actives disclosed"], ["0", "Fragrance"], ["4.7★", "Customer rating"]],
        f: [
          ["Nine products", "The whole line. If it is not here, you do not need it."],
          ["Percentages published", "Every active, with the concentration on the box."],
          ["Evidence linked", "Every claim cites the study it comes from."],
          ["Fragrance-free", "No masking fragrance, in anything, ever."],
          ["Refillable", "Glass bottles, refill pouches, half the price."],
          ["Skin-type honest", "The routine says who it will not suit."],
        ],
        p: [
          ["Starter", "$58", ["Cleanser", "Moisturiser", "SPF 50", "Routine card"]],
          ["Complete", "$124", ["Everything in Starter", "Serum", "Treatment", "Refill credit"], true],
          ["Refill", "From $22", ["Any product", "Half-price refill", "Return envelope"]],
        ],
        q: "It says on the box what percentage of the active is in it. That should be normal and somehow is not.",
        a: "Dermatology Weekly",
      },
    ],
  },
  {
    name: "Developer Tools",
    demos: [
      {
        b: "Shipyard",
        t: "CI that does not fight you",
        h: ["Green builds", "in under four minutes"],
        l: "Pipelines that cache properly, fail clearly and cost a fraction of what you are paying now.",
        c: "Connect a repo",
        ca: "See a sample run",
        s: [["3.8 min", "Median pipeline"], ["94%", "Cache hit rate"], ["0", "Config files required"], ["5×", "Cheaper than incumbent"]],
        f: [
          ["Fast by default", "Layer caching and a warm runner pool, no tuning."],
          ["Clear failures", "The error, the file, and the diff that caused it."],
          ["Zero-config start", "Detects your stack and writes a sensible first pipeline."],
          ["Reproducible locally", "Run the exact same pipeline on your laptop."],
          ["Matrix builds", "Every version, in parallel, without a YAML novella."],
          ["Honest pricing", "Per-second billing, no seat minimums, no surprises."],
        ],
        p: [
          ["Open source", "Free", ["Unlimited minutes", "Public repos", "Community support"]],
          ["Team", "$29/mo", ["10,000 minutes", "Private repos", "Matrix builds", "Local runner"], true],
          ["Enterprise", "Custom", ["Self-hosted runners", "SSO & audit", "Dedicated support", "SLA"]],
        ],
        q: "We deleted four hundred lines of YAML and the builds got faster. I do not know why we waited so long.",
        a: "Staff engineer, Northbank",
      },
      {
        b: "Tracepoint",
        t: "See what production sees",
        h: ["Find it in minutes,", "not in the morning"],
        l: "Traces, logs and metrics in one timeline, sampled intelligently so the bill stays sane.",
        c: "Start free",
        ca: "Live sandbox",
        s: [["<50ms", "Ingest latency"], ["100%", "Trace retention, 7 days"], ["1/4", "The cost of the incumbent"], ["4.8★", "Rating"]],
        f: [
          ["One timeline", "Trace, logs and metrics on the same clock, no tab-switching."],
          ["Tail sampling", "Keeps every error and the slow 1%, drops the boring rest."],
          ["No agent required", "OpenTelemetry in, nothing to install on the host."],
          ["Query without a DSL", "Ask in plain language, get a query you can edit."],
          ["Alert on symptoms", "SLO burn rate, not CPU thresholds."],
          ["Cost guardrails", "A hard cap, and it tells you what it dropped."],
        ],
        p: [
          ["Free", "$0", ["50GB ingest", "3-day retention", "1 user"]],
          ["Team", "$89/mo", ["500GB ingest", "14-day retention", "Unlimited users", "Tail sampling"], true],
          ["Enterprise", "Custom", ["Unlimited ingest", "Custom retention", "Self-hosted", "SLA"]],
        ],
        q: "MTTR went from about forty minutes to about six. The timeline is the whole reason.",
        a: "SRE lead, Contour",
      },
    ],
  },
  {
    name: "Entertainment",
    demos: [
      {
        b: "Cineville",
        t: "Films worth leaving the house for",
        h: ["The best seat", "in the dark"],
        l: "An independent cinema with reclining seats, proper sound and a programme chosen by people who watch films.",
        c: "See what's on",
        ca: "Become a member",
        s: [["3", "Screens"], ["4K", "Laser projection"], ["62", "Reclining seats"], ["7", "Films a week"]],
        f: [
          ["Curated programme", "Chosen weekly, with a reason written for each film."],
          ["Proper sound", "Atmos in all three screens, calibrated monthly."],
          ["Reclining seats", "Sixty-two of them. Every seat is a good seat."],
          ["No adverts", "The film starts at the advertised time."],
          ["Members' bar", "Open an hour before and long after."],
          ["Director Q&As", "Monthly, with the person who actually made it."],
        ],
        p: [
          ["Standard", "$14", ["Any screening", "Reclining seat", "Bar access"]],
          ["Member", "$22/mo", ["4 films / month", "Priority booking", "Guest tickets", "Q&A access"], true],
          ["Patron", "$60/mo", ["Unlimited films", "Two guests", "Programme input", "Private hires"]],
        ],
        q: "The film started at the time it said. After twenty years of adverts, that still feels like a luxury.",
        a: "Member since 2019",
      },
      {
        b: "Soundwave",
        t: "Music, paid fairly",
        h: ["Stream it.", "Pay the artist."],
        l: "A streaming service that publishes the split, pays per-play not per-pool, and lets you tip directly.",
        c: "Start listening",
        ca: "How payouts work",
        s: [["82%", "To artists"], ["4.1M", "Tracks"], ["Lossless", "Included"], ["$0", "Free tier ads"]],
        f: [
          ["Published split", "Exactly where your subscription goes, every month."],
          ["Per-play payout", "Your money follows your listening, not a global pool."],
          ["Lossless included", "FLAC at no extra cost, because storage is cheap now."],
          ["Direct tips", "Send an artist money, with nothing skimmed."],
          ["No free ads", "The free tier has no advertising at all."],
          ["Offline forever", "Downloads stay yours if you cancel."],
        ],
        p: [
          ["Free", "$0", ["Ad-free listening", "Standard quality", "Offline"]],
          ["Listener", "$11/mo", ["Lossless audio", "Offline forever", "Direct tips"], true],
          ["Supporter", "$25/mo", ["Everything", "3× artist payout", "Early releases", "Lyrics and credits"]],
        ],
        q: "I can see which of my money went to which band. That turns out to change how you listen.",
        a: "Subscriber · 3 years",
      },
    ],
  },
  {
    name: "Legal",
    demos: [
      {
        b: "Blackwell Legal",
        t: "Plain-speaking solicitors",
        h: ["Legal help", "in words you understand"],
        l: "Fixed fees, a named solicitor, and an answer within a day — not a billable-hour mystery.",
        c: "Request a callback",
        ca: "Our practice areas",
        s: [["1 day", "Response time"], ["100%", "Fixed-fee first"], ["4.8★", "Client rating"], ["26 yrs", "Practising"]],
        f: [
          ["Fixed fees quoted", "You know the cost before you instruct us."],
          ["Named solicitor", "One person, who answers their own email."],
          ["Plain English", "No Latin where an English word will do."],
          ["Employment", "Contracts, settlements and tribunal representation."],
          ["Property", "Residential and commercial conveyancing."],
          ["Wills and probate", "Written properly, stored securely, revisited with you."],
        ],
        p: [
          ["Consultation", "Free", ["30 minutes", "Any practice area", "No obligation"]],
          ["Fixed fee", "From $450", ["Document review", "Written advice", "One round of changes"], true],
          ["Representation", "By quote", ["Tribunal or court", "Full case management", "Regular updates"]],
        ],
        q: "They told me what it would cost on the first call and then charged exactly that. I assumed there was a catch.",
        a: "Client · Employment matter",
      },
      {
        b: "Clausewise",
        t: "Contracts, reviewed in minutes",
        h: ["Know what", "you are signing"],
        l: "Upload a contract and get the risks, the odd clauses and the missing protections — in plain English.",
        c: "Review a contract",
        ca: "See a sample",
        s: [["4 min", "Median review"], ["240", "Clause types"], ["31", "Jurisdictions"], ["0", "Data retained after review"]],
        f: [
          ["Risk ranked", "Red, amber, green — with the reason for each."],
          ["Missing protections", "What is not in the contract, flagged too."],
          ["Plain English", "Every clause explained without the jargon."],
          ["Redline suggestions", "Suggested wording you can paste straight back."],
          ["Comparison mode", "Diff two versions of the same agreement."],
          ["Nothing retained", "Deleted after review unless you ask us to keep it."],
        ],
        p: [
          ["Pay per review", "$29", ["One contract", "Full risk report", "Redline suggestions"]],
          ["Professional", "$79/mo", ["40 reviews", "Comparison mode", "Team sharing"], true],
          ["Firm", "Custom", ["Unlimited reviews", "API access", "Custom playbooks", "SSO"]],
        ],
        q: "It found an auto-renewal clause I had read twice and completely missed.",
        a: "Founder, small agency",
      },
    ],
  },
  {
    name: "Events",
    demos: [
      {
        b: "Gatherly",
        t: "Events people attend",
        h: ["Fill the room", "and keep it full"],
        l: "Ticketing, check-in and engagement tools for events where showing up is the whole point.",
        c: "Create an event",
        ca: "Browse events",
        s: [["28K", "Events hosted"], ["1.4M", "Tickets sold"], ["0%", "Fee on free tickets"], ["4.7★", "Organiser rating"]],
        f: [
          ["Free events free", "No fee at all on free tickets, ever."],
          ["Fast check-in", "QR or name lookup, offline-capable at the door."],
          ["Waitlists", "Auto-release when someone cancels, in order."],
          ["Attendee messaging", "Reach everyone without an email platform."],
          ["Session scheduling", "Multi-track agendas attendees can build."],
          ["Payouts next day", "Money in your account the day after."],
        ],
        p: [
          ["Free events", "$0", ["Unlimited tickets", "Check-in app", "Attendee messaging"]],
          ["Paid", "1.9% + $0.79", ["Everything free", "Card processing", "Next-day payout", "Waitlists"], true],
          ["Professional", "$99/mo", ["Multi-track", "Branding removal", "API access", "Dedicated support"]],
        ],
        q: "Sold out in nine days with a waitlist of two hundred. The auto-release filled every cancellation.",
        a: "Conference organiser · Lisbon",
      },
      {
        b: "Stagewright",
        t: "Production, end to end",
        h: ["From load-in", "to get-out"],
        l: "Technical production for live events, with the paperwork as tight as the rigging.",
        c: "Request a quote",
        ca: "Recent productions",
        s: [["340", "Shows delivered"], ["0", "Incidents in 5 years"], ["4", "Crews available"], ["100%", "Risk-assessed"]],
        f: [
          ["Technical design", "Drawings, power plans and rigging plots before load-in."],
          ["Risk assessments", "Written, shared and actually followed on site."],
          ["Crewing", "Trusted technicians who have worked together before."],
          ["Equipment", "Owned and maintained, not sub-hired at the last minute."],
          ["Rehearsal support", "Technical rehearsal time built into the schedule."],
          ["Get-out and debrief", "Struck properly, with a written debrief after."],
        ],
        p: [
          ["Single day", "$3,200", ["Crew of four", "Standard rig", "Risk assessment", "Debrief"]],
          ["Production week", "$18,000", ["Full crew", "Equipment package", "Rehearsal support", "On-site lead"], true],
          ["Touring", "By quote", ["Multi-venue", "Advance work", "Tour manager", "Full logistics"]],
        ],
        q: "The risk assessment matched what actually happened on site. In this industry that is rare enough to mention.",
        a: "Venue manager · Barbican North",
      },
    ],
  },
  {
    name: "Other",
    demos: [
      {
        b: "Civic Trust",
        t: "Community, funded",
        h: ["Small grants,", "measurable change"],
        l: "A community foundation giving out small grants and publishing exactly where every pound went.",
        c: "Apply for a grant",
        ca: "See our impact",
        s: [["£2.4M", "Granted"], ["410", "Projects funded"], ["100%", "Spending published"], ["0", "Admin taken from grants"]],
        f: [
          ["Small grants", "£500 to £10,000, decided within six weeks."],
          ["Open process", "Scoring criteria published before you apply."],
          ["Full transparency", "Every grant and every outcome on the public site."],
          ["No admin skim", "Overheads funded separately, grants paid in full."],
          ["Support, not just money", "Help with the application if you ask for it."],
          ["Local panels", "Decided by people who live where the money lands."],
        ],
        p: [
          ["Micro grant", "£500", ["One-off project", "6-week decision", "No reporting burden"]],
          ["Community grant", "Up to £10K", ["Year-long project", "Panel review", "Light-touch reporting"], true],
          ["Partner", "By agreement", ["Multi-year funding", "Capacity support", "Joint evaluation"]],
        ],
        q: "They published the scoring before we applied. First funder I have trusted enough not to guess what they wanted.",
        a: "Youth club coordinator · Sheffield",
      },
      {
        b: "Greenpath",
        t: "Sustainability, measured",
        h: ["Cut carbon", "with evidence"],
        l: "Measure what your organisation actually emits, then cut it — with the numbers published either way.",
        c: "Start measuring",
        ca: "Methodology",
        s: [["1,100", "Organisations"], ["-34%", "Median emissions"], ["100%", "Method published"], ["3", "Scopes covered"]],
        f: [
          ["Real measurement", "Meter and invoice data, not industry averages."],
          ["All three scopes", "Including the supply chain everyone leaves out."],
          ["Published method", "Our assumptions, in full, so you can disagree."],
          ["Reduction plans", "Ranked by cost per tonne, not by how easy they look."],
          ["Supplier engagement", "Tools to get data from people who do not want to give it."],
          ["Progress reporting", "Year-on-year, with the bad years shown too."],
        ],
        p: [
          ["Starter", "Free", ["Scope 1 & 2", "Basic reporting", "Method access"]],
          ["Organisation", "$290/mo", ["All three scopes", "Supplier engagement", "Reduction plans"], true],
          ["Enterprise", "Custom", ["Multi-site", "Assurance-ready", "Dedicated analyst"]],
        ],
        q: "They published a year where our emissions went up. That is how I know the rest of the numbers are real.",
        a: "Sustainability lead · Manufacturer",
      },
    ],
  },
]

/**
 * Two distinct style directions per category, so the pair never lands on
 * the same look. Without this the query is dominated by the product type
 * and both demos in a category come back identical — which is what
 * happened on the first run.
 *
 * Every value is a real Style ID from packages/advisory/data/styles.csv,
 * verified against the searchable (active + supplemental) set.
 */
const MOODS = {
  SaaS: ["glassmorphism", "data-dense-dashboard"],
  Education: ["claymorphism", "editorial-grid-magazine"],
  "Pet Services": ["soft-ui-evolution", "organic-biophilic"],
  "AI/Chatbot": ["ai-native-ui", "zero-interface"],
  "E-commerce": ["liquid-glass", "vintage-analog-retro-film"],
  "Fintech/Crypto": ["financial-dashboard", "cyberpunk-ui"],
  Healthcare: ["accessible-and-ethical", "nature-distilled"],
  Creative: ["bento-box-grid", "kinetic-typography"],
  "Real Estate": ["editorial-grid-magazine", "spatial-ui-visionos"],
  Gaming: ["pixel-art", "hud-sci-fi-fui"],
  "Food & Restaurant": ["vintage-analog-retro-film", "tactile-digital-deformable-ui"],
  Fitness: ["motion-driven", "neubrutalism"],
  Travel: ["parallax-storytelling", "e-ink-paper"],
  "NFT/Web3": ["cyberpunk-ui", "chromatic-aberration-rgb-split"],
  "Beauty/Spa": ["soft-ui-evolution", "nature-distilled"],
  "Developer Tools": ["dark-mode-oled", "hud-sci-fi-fui"],
  Entertainment: ["kinetic-typography", "vaporwave"],
  Legal: ["swiss-modernism-2-0", "e-ink-paper"],
  Events: ["memphis-design", "gradient-mesh-aurora-evolved"],
  Other: ["flat-design", "inclusive-design"],
}

/** Flatten to the build list, stamping category, mood and a stable slug. */
export function demoSpecs() {
  const out = []
  for (const cat of CATEGORIES) {
    const moods = MOODS[cat.name] || ["flat-design", "glassmorphism"]
    cat.demos.forEach((raw, i) => {
      const demo = expand(raw)
      demo.category = cat.name
      demo.mood = moods[i] || moods[0]
      demo.slug = slugify(demo.brand)
      demo.index = i
      out.push(demo)
    })
  }
  return out
}

export function slugify(text) {
  return (
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "demo"
  )
}

/** The `mode` filter, derived from how light the proposal's surface is. */
export function modeFor(backgroundHex, relativeLuminance) {
  try {
    return relativeLuminance(backgroundHex) > 0.35 ? "Light" : "Dark"
  } catch {
    return "Light"
  }
}
