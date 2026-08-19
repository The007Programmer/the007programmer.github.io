export interface ToolkitGroup {
  id: string
  title: string
  items: string
  accent?: boolean
}

export const TOOLKIT_GROUPS: ToolkitGroup[] = [
  { id: "languages", title: "Languages", items: "Python · TypeScript · JavaScript · HTML · CSS" },
  {
    id: "ai-ml",
    title: "AI & ML",
    items:
      "Computer vision · Object detection (YOLO) · Video embeddings · Vector and similarity search · Local model inference · Prompt engineering",
  },
  {
    id: "agents",
    title: "Agents",
    items:
      "Multi-agent orchestration · Memory and context · Knowledge graphs · Behavior drift · Inter-agent communication · Task routing and model selection · Prompt-injection and jailbreak defense · RBAC and auth · Anomaly detection and logging",
    accent: true,
  },
  { id: "systems", title: "Systems", items: "Linux · macOS · Windows · Git · RESTful APIs · Real-time video streams" },
  { id: "hardware", title: "Hardware", items: "Microcontrollers · Avionics systems · Soldering" },
  {
    id: "people",
    title: "Working with people",
    items: "Cross-functional collaboration · Technical documentation · Live product demos · Team management",
  },
]
