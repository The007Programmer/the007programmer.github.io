export interface ElectraSpec {
  stamp: string
  title: string
  lede: string
  note: string
  rows: { label: string; body: string }[]
}

export const ELECTRA: ElectraSpec = {
  stamp: "Feb – Jun 2026 · TwelveLabs · Shipped to beta",
  title: "Electra",
  lede:
    "An internal AI agent built on top of the company's IT ticketing system. I owned most of the implementation alongside my manager, and shipped it to beta before my term ended.",
  note: "Internal tool — no public repo.",
  rows: [
    {
      label: "Memory",
      body: "Every conversation, interaction, and thought links into a graph-based knowledge network — prototyped in Obsidian, then migrated to GBrain, our internal graph memory. Context persists across sessions and the reasoning stays traceable.",
    },
    {
      label: "Defense",
      body: "Hardened against prompt injection, jailbreaks, and token-bomb exploits: rate limiting, input sanitization and validation, RBAC-style permissions, and anomaly detection with logging.",
    },
    {
      label: "Next",
      body: "Designed the foundational architecture for a Hermes-style self-learning structure, so agent behavior improves on its own over time.",
    },
  ],
}

export interface ProjectCardData {
  id: string
  stamp: string
  title: string
  desc: string
  tags: string[]
  link?: { href: string; label: string }
}

// Newest-first, per the existing content decision — do not reverse.
export const PROJECT_CARDS: ProjectCardData[] = [
  {
    id: "sage",
    stamp: "Aug – Dec 2025 · TwelveLabs",
    title: "SAGE",
    desc: "A full-stack tool for comparing video assets. Runs Marengo embeddings through cosine similarity over 2-second segments, across a 1024-dimensional space.",
    tags: ["Embeddings", "Similarity search", "Full-stack"],
    link: { href: "https://www.twelvelabs.io/blog/sage", label: "I wrote the writeup" },
  },
  {
    id: "recurser",
    stamp: "Jun – Aug 2025 · TwelveLabs",
    title: "Recurser",
    desc: "My proposal, then my ship. Analyzes AI-generated video, refines the prompt, and runs it again — each pass closer to the intent.",
    tags: ["Prompt engineering", "Iterative systems"],
    link: { href: "https://www.twelvelabs.io/blog/recurser", label: "I wrote the writeup" },
  },
  {
    id: "jockey",
    stamp: "Jun – Jul 2025 · TwelveLabs",
    title: "Jockey",
    desc: "Bug fixes and feature work on the conversational video agent built on Marengo and Pegasus.",
    tags: ["Contributor", "Video agents"],
  },
  {
    id: "bastion",
    stamp: "Jun 2025 · TwelveLabs",
    title: "Bastion",
    desc: "A real-time security dashboard for live HTTPS video streams. Pushed monitoring past the fixed-length-video workflows the platform assumed.",
    tags: ["Real-time video", "Monitoring"],
  },
  {
    id: "sentinel",
    stamp: "Mar 2025 · Chinatown Hacks",
    title: "Sentinel",
    desc: "An AI security application on the TwelveLabs API. Started as a hackathon prototype, became a one-week technical project, then became the internship.",
    tags: ["Computer vision", "TwelveLabs API"],
  },
  {
    id: "density",
    stamp: "Mar 2025 · Chinatown Hacks",
    title: "Density tracker",
    desc: "Real-time population density with YOLO detection and custom rasterization. Vector-to-bitmap conversion means the data can never carry a face out with it.",
    tags: ["YOLO", "Rasterization", "Privacy by design"],
  },
]

export interface OssItem {
  id: string
  title: string
  desc: string
  status: "private" | "published" | "in-progress"
  link?: { href: string; label: string }
}

export const OSS_ITEMS: OssItem[] = [
  {
    id: "magi",
    title: "MAGI",
    desc: "A multi-agent system on hardware I own, with no cloud in the path. An orchestrator scores each task for complexity, picks a local model to match, and hands it to the agent for that domain. Every task clears a security assessor first — 35+ patterns for prompt injection, jailbreaks, and system-prompt extraction, graded safe through critical, where a hit either downgrades the model the task is allowed to reach or blocks it outright.",
    status: "private",
  },
  {
    id: "clair",
    title: "clair",
    desc: "My Claude Code environment as code. One dependency-free Python tool rebuilds the whole setup — settings, hooks, commands, skills, plugins — on a fresh macOS, Linux, or Windows machine, and re-running it converges to the same state. Anything personal or secret lives in a private overlay and never touches the public repo. MIT, installs from a Homebrew tap.",
    status: "published",
    link: { href: "https://github.com/The007Programmer/clair", label: "GitHub" },
  },
  {
    id: "ufw",
    title: "UFW Manager",
    desc: "A Python tool that makes UFW firewall rules bearable — add, remove, and list IP bans without the ceremony. Published to my PPA, so Ubuntu installs it straight from apt.",
    status: "published",
    link: { href: "https://github.com/The007Programmer/UFW-Manager", label: "GitHub" },
  },
  {
    id: "flashguard",
    title: "FlashGuard",
    desc: "Watches USB storage for unauthorized access and malware, and stops the transfers you didn't ask for.",
    status: "in-progress",
    link: { href: "https://github.com/The007Programmer/FlashGuard", label: "GitHub" },
  },
  {
    id: "mailsmith",
    title: "Mailsmith",
    desc: "Give it a prompt, get a written email, sent through the Gmail API to the person you meant.",
    status: "in-progress",
    link: { href: "https://github.com/The007Programmer/Mailsmith", label: "GitHub" },
  },
]
