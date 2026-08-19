export interface LedgerRow {
  id: string
  when: string
  title: string
  org: string
  body?: string
}

// Newest-first, matching the existing ledger order.
export const LEDGER_ROWS: LedgerRow[] = [
  {
    id: "agentsec",
    when: "Feb – Jun 2026",
    title: "Software Engineering Intern — Agent Security & Internal Tools",
    org: "TwelveLabs",
    body: "Came back for a second term, this time pointed squarely at agent security and applied AI architecture. Led Electra end to end and proposed features past the original scope. Shipped to beta.",
  },
  {
    id: "devex",
    when: "Jun – Dec 2025",
    title: "Software Engineering Intern — DevEx",
    org: "TwelveLabs",
    body: "Built SAGE, Bastion, and Recurser, and contributed to Jockey. Ran live demos, made product and UX calls, and wrote the docs and blogs that explained it all. The internship was extended from three months to six.",
  },
  {
    id: "tamu",
    when: "Aug 2025 → now",
    title: "Texas A&M University",
    org: "College Station, TX · Sophomore · 4.0 GPA",
  },
  {
    id: "avionics",
    when: "Mar 2025",
    title: "Avionics Lead",
    org: "Blinn Propulsion Laboratory",
    body: "Owned avionics end to end — design, integration, and the troubleshooting at 2am — with directors rather than over my shoulder.",
  },
  {
    id: "hacks",
    when: "Mar 2025",
    title: "Chinatown Hacks",
    org: "Participant",
    body: "Presented to a judging panel and to sponsors from TwelveLabs. Left with a site-visit invitation, which turned into everything above.",
  },
  {
    id: "frc",
    when: "Aug 2024 – Mar 2025",
    title: "Manager & Co-Lead",
    org: "Circuit Bakers FRC",
    body: "Took a rookie team to competition standard. Managed a sub-team of 10, co-led finances, ran mechanical, and programmed.",
  },
  {
    id: "berkeley",
    when: "Jun – Aug 2024",
    title: "CS61A",
    org: "UC Berkeley Pre-College Studies",
    body: "Eight weeks on campus in Structure and Interpretation of Computer Programs — recursion, abstraction, inheritance, and the habits that stuck.",
  },
]
