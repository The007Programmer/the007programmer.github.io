# Portfolio Visual Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Aahil Shaikh's portfolio on a built React stack (Vite + React + TS + Tailwind) so it can use KokonutUI components, Bklit UI charts, and Motion animation — replacing the current zero-build vanilla HTML/CSS/JS site while carrying its content, palette, and privacy rules forward unchanged.

**Architecture:** A single-page Vite + React app. Content lives in typed data files under `src/data/`; each current section becomes one React component under `src/components/sections/`. The force-simulated trajectory graph is replaced by a Bklit-composed causal timeline chart. The agent field (flocking ambient layer) and a new site-wide cursor-reactive effect both render to `<canvas>`/overlay layers driven by `requestAnimationFrame`, independent of Motion. Motion drives every discrete animation: reveals, layout transitions, drag, hover/press.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first `@theme`), shadcn/ui (component base for KokonutUI and Bklit UI), KokonutUI (cards, buttons), Bklit UI (chart primitives), Motion (`motion/react`), Vitest + React Testing Library, GitHub Actions (`actions/deploy-pages`).

**Spec:** `docs/superpowers/specs/2026-08-18-portfolio-visual-rework-design.md`

## Global Constraints

- No color darker than `--slate #39434F` anywhere in the palette — no black, ever.
- Every text/background color pairing must clear WCAG AA (4.5:1 normal text, 3.0:1 large text), checked numerically via the `contrastRatio()` utility built in Task 1 — never eyeballed.
- Content and copy carry forward unchanged: hero, work cards, tally, path ledger, toolkit, and contact copy are ported verbatim from the current `index.html`. No rewrites.
- Privacy rules stay in force: no home address, no phone number, "Bay Area" never "Dublin, CA", MAGI named only by what it does (no hostnames, VPN topology, ports, or filesystem paths), MAGI's AI-detection-evasion feature stays off the site.
- `prefers-reduced-motion` must gate every Motion-driven animation, using Motion's own `useReducedMotion()` / `MotionConfig` — never a manual media-query reimplementation.
- The trajectory graph's force-simulation approach is retired entirely. Its causal story (each role caused by the one before it) moves to an axis-based timeline chart built on Bklit UI primitives. The timeline still runs oldest → newest — reversing it would misstate causation, exactly as documented in the current README.
- The agent field ambient layer (separation / alignment×trust / cohesion×trust / wander / trust-decay / text-repulsion) is **ported, not dropped or redesigned** — the physics in `assets/src/field.js` is already tuned and tested; carry the constants and algorithm over.
- Cursor-reactive effects run site-wide and must compose with, not replace, the agent field's existing scroll-based input.
- Deploy is via GitHub Actions to GitHub Pages. Flipping the Pages source setting from branch-based to Actions-based is a live change to how the production site deploys — flag it explicitly before running it, do not do it silently.
- Node 20, npm as the package manager. No other framework (no Next.js) — Vite only, per the spec's approach decision.

---

## Task 1: Scaffold the Vite + React + TS app, palette tokens, contrast utility

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` (Vite entry — **replaces** the current root `index.html`; its content is ported into React components in later tasks, so this overwrite is intentional and the old markup remains in git history)
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Create: `src/lib/contrast.ts`
- Create: `src/test/setup.ts`
- Test: `src/lib/contrast.test.ts`

**Interfaces:**
- Produces: `contrastRatio(hexA: string, hexB: string): number` — every later task that introduces a new color pairing must call this in a test before shipping it.
- Produces: Tailwind theme tokens available as utility classes: `bg-signal`, `bg-ember`, `bg-coral`, `bg-rust`, `bg-paper`, `bg-paper-2`, `bg-slate`, `bg-slate-2`, `bg-mute` (and their `text-*`/`border-*` equivalents), plus `font-display`, `font-body`, `font-mono`.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "the007programmer-portfolio",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "motion": "^11.11.13",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "jsdom": "^25.0.1",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}
```

Note: these version ranges are floors — `npm install` will resolve current compatible releases within them. If a resolution error occurs, bump the offending package to its latest stable major that satisfies the others; don't pin blind.

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
})
```

- [ ] **Step 4: Write `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Write the failing contrast test — `src/lib/contrast.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { contrastRatio } from './contrast'

describe('contrastRatio', () => {
  it('computes white on black as 21:1', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1)
  })

  it('computes identical colors as 1:1', () => {
    expect(contrastRatio('#D62B22', '#D62B22')).toBeCloseTo(1, 5)
  })

  it('clears 4.5:1 for signal red on paper, both directions', () => {
    expect(contrastRatio('#D62B22', '#FFF1ED')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for ember on paper', () => {
    expect(contrastRatio('#B5241B', '#FFF1ED')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 3.0:1 for coral on slate (large text only)', () => {
    expect(contrastRatio('#FFA795', '#39434F')).toBeGreaterThanOrEqual(3.0)
  })

  it('clears 4.5:1 for mute on paper', () => {
    expect(contrastRatio('#5A6675', '#FFF1ED')).toBeGreaterThanOrEqual(4.5)
  })

  it('rejects a pairing that does not clear AA, proving the check is not tautological', () => {
    expect(contrastRatio('#FFA795', '#FFF1ED')).toBeLessThan(4.5)
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run src/lib/contrast.test.ts`
Expected: FAIL — `Cannot find module './contrast'`

- [ ] **Step 7: Implement `src/lib/contrast.ts`**

```ts
function srgbToLinear(c: number): number {
  const cs = c / 255
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
}

function relativeLuminance(hex: string): number {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA)
  const lB = relativeLuminance(hexB)
  const lighter = Math.max(lA, lB)
  const darker = Math.min(lA, lB)
  return (lighter + 0.05) / (darker + 0.05)
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run src/lib/contrast.test.ts`
Expected: PASS, 7 tests

- [ ] **Step 9: Write `src/index.css` with the palette as Tailwind v4 theme tokens**

```css
@import "tailwindcss";

@theme {
  --color-signal: #D62B22;
  --color-ember: #B5241B;
  --color-coral: #FFA795;
  --color-rust: #8E1A13;
  --color-paper: #FFF1ED;
  --color-paper-2: #FFE4DC;
  --color-slate: #39434F;
  --color-slate-2: #4B5563;
  --color-mute: #5A6675;

  --font-display: 'Bricolage Grotesque', 'Arial Black', sans-serif;
  --font-body: 'Instrument Sans', system-ui, sans-serif;
  --font-mono: 'Martian Mono', ui-monospace, monospace;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--color-paper);
  color: var(--color-slate);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
```

- [ ] **Step 10: Write the Vite entry `index.html`** (this overwrites the current root `index.html` — its content is ported into React in Tasks 9–15, so nothing is lost)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aahil Shaikh — Applied AI &amp; systems</title>
    <meta name="description" content="Aahil Shaikh works on the parts of agents nobody's solved yet — drift, identity, cooperation. Applied AI and systems engineering, two terms at TwelveLabs." />
    <link rel="icon" href="/img/favicon.png" type="image/png" />
    <meta property="og:title" content="Aahil Shaikh — Applied AI & systems" />
    <meta property="og:description" content="At work it's the parts of agents nobody's solved yet — drift, identity, cooperation. At home it's whatever annoyed me that week. Both keep outgrowing what I built them for." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://the007programmer.github.io" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 11: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 12: Write a placeholder `src/App.tsx`** (replaced fully in Task 16)

```tsx
export default function App() {
  return (
    <main className="min-h-screen bg-paper text-slate font-body p-8">
      <h1 className="font-display font-extrabold text-4xl">Aahil Shaikh</h1>
      <p>Scaffold running.</p>
    </main>
  )
}
```

- [ ] **Step 13: Install dependencies and verify the dev server runs**

Run: `npm install && npm run dev`
Expected: Vite prints a local URL; loading it shows "Aahil Shaikh" in Bricolage Grotesque on the paper-red background with no console errors.

- [ ] **Step 14: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html src/main.tsx src/App.tsx src/index.css src/lib/contrast.ts src/lib/contrast.test.ts src/test/setup.ts .gitignore
git commit -m "SAFE: scaffold Vite+React+TS, palette tokens, numeric contrast check"
```

(Add `node_modules`, `dist` to `.gitignore` if not already present — check the existing `.gitignore` first and extend it rather than overwriting.)

---

## Task 2: shadcn/ui base, Motion, reduced-motion gate

**Files:**
- Create: `components.json`, `src/lib/utils.ts`
- Create: `src/hooks/useReducedMotionGate.test.tsx`, `src/hooks/useReducedMotionGate.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `cn(...inputs: ClassValue[]): string` from `src/lib/utils.ts` — every component task from here on uses this to merge Tailwind classes.
- Produces: `useReducedMotionGate(): boolean` — every Motion-driven component wraps its animated props in `if (reduced) { ...static... } else { ...animated... }` using this hook. Internally wraps Motion's own `useReducedMotion()` so there is exactly one place this policy lives.

- [ ] **Step 1: Install shadcn/ui's dependencies and Motion**

Run: `npm install clsx tailwind-merge motion class-variance-authority`

(`clsx`/`tailwind-merge` were already added in Task 1's `package.json`; this step is idempotent if `npm install` was already run — just confirms `motion` and `class-variance-authority` land too, the latter is what shadcn/KokonutUI variant components expect.)

- [ ] **Step 2: Write `src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Write `components.json`** (shadcn CLI config — required so `npx shadcn add ...` in Tasks 3–4 knows where to put files and which alias to use)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

- [ ] **Step 4: Write the failing test — `src/hooks/useReducedMotionGate.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useReducedMotionGate } from './useReducedMotionGate'

vi.mock('motion/react', () => ({
  useReducedMotion: () => true,
}))

describe('useReducedMotionGate', () => {
  it('returns true when Motion reports reduced motion is preferred', () => {
    const { result } = renderHook(() => useReducedMotionGate())
    expect(result.current).toBe(true)
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useReducedMotionGate.test.tsx`
Expected: FAIL — `Cannot find module './useReducedMotionGate'`

- [ ] **Step 6: Implement `src/hooks/useReducedMotionGate.tsx`**

```tsx
import { useReducedMotion } from "motion/react"

/** The single place site-wide reduced-motion policy lives. Every
 *  Motion-driven component calls this instead of useReducedMotion()
 *  directly, so the policy can change in one place if it ever needs to. */
export function useReducedMotionGate(): boolean {
  return useReducedMotion() ?? false
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useReducedMotionGate.test.tsx`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add components.json src/lib/utils.ts src/hooks/useReducedMotionGate.tsx src/hooks/useReducedMotionGate.test.tsx package.json package-lock.json
git commit -m "SAFE: shadcn base, Motion, single reduced-motion gate"
```

---

## Task 3: KokonutUI components (card, button) installed and re-themed

**Files:**
- Create: files generated by the KokonutUI CLI under `src/components/ui/` (exact filenames depend on which components you pick — see Step 1)
- Create: `src/components/kit/ProjectCard.tsx`, `src/components/kit/ActionButton.tsx` (thin, stable wrappers the rest of the app imports — decouples the app from KokonutUI's exact upstream file names)
- Test: `src/components/kit/ProjectCard.test.tsx`, `src/components/kit/ActionButton.test.tsx`

**Interfaces:**
- Produces: `<ProjectCard title stamp desc tags link? >` — consumed by the Work section (Task 12).
- Produces: `<ActionButton>` — consumed by the Contact section (Task 15).

- [ ] **Step 1: Install KokonutUI components via its CLI**

Browse `https://kokonutui.com` (or its GitHub, `kokonut-labs/kokonutui`), pick one animated card component and one interactive button component, and copy each one's install command — it's a shadcn-registry site, so the command is of the form `npx shadcn@latest add <registry-url>`. Run both commands from the repo root. Note exactly which files land under `src/components/` (KokonutUI's registry may nest them under a subfolder such as `src/components/kokonutui/`) — the next steps assume you know these paths.

Run: `npm run build` (TypeScript check only — no test yet)
Expected: no new type errors from the installed files.

- [ ] **Step 2: Write the failing test — `src/components/kit/ProjectCard.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectCard } from './ProjectCard'

describe('ProjectCard', () => {
  it('renders the title, stamp, description, and tags', () => {
    render(
      <ProjectCard
        title="SAGE"
        stamp="Aug – Dec 2025 · TwelveLabs"
        desc="A full-stack tool for comparing video assets."
        tags={['Embeddings', 'Similarity search']}
      />
    )
    expect(screen.getByText('SAGE')).toBeInTheDocument()
    expect(screen.getByText('Aug – Dec 2025 · TwelveLabs')).toBeInTheDocument()
    expect(screen.getByText(/full-stack tool/)).toBeInTheDocument()
    expect(screen.getByText('Embeddings')).toBeInTheDocument()
  })

  it('renders an external link when one is provided', () => {
    render(
      <ProjectCard
        title="SAGE"
        stamp="Aug – Dec 2025"
        desc="desc"
        tags={[]}
        link={{ href: 'https://www.twelvelabs.io/blog/sage', label: 'I wrote the writeup' }}
      />
    )
    const anchor = screen.getByRole('link', { name: /I wrote the writeup/ })
    expect(anchor).toHaveAttribute('href', 'https://www.twelvelabs.io/blog/sage')
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/components/kit/ProjectCard.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 4: Implement `src/components/kit/ProjectCard.tsx`**, wrapping whatever KokonutUI card you installed. If the installed card is e.g. `KokonutCard` from `@/components/kokonutui/card`, adapt the import path to what Step 1 actually generated:

```tsx
import { motion } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { cn } from "@/lib/utils"

export interface ProjectCardProps {
  title: string
  stamp: string
  desc: string
  tags: string[]
  link?: { href: string; label: string }
  className?: string
}

export function ProjectCard({ title, stamp, desc, tags, link, className }: ProjectCardProps) {
  const reduced = useReducedMotionGate()

  return (
    <motion.article
      className={cn(
        "rounded-sm border border-slate/10 bg-paper-2 p-6 flex flex-col gap-3",
        className
      )}
      whileHover={reduced ? undefined : { y: -4, boxShadow: "0 12px 24px -12px rgba(57,67,79,0.35)" }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    >
      <p className="font-mono text-[0.6875rem] uppercase tracking-wide text-slate-2">{stamp}</p>
      <h3 className="font-display font-extrabold text-2xl text-slate">{title}</h3>
      <p className="text-slate-2">{desc}</p>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2 mt-1">
          {tags.map((tag) => (
            <li key={tag} className="font-mono text-[0.6875rem] uppercase bg-paper text-ember px-2 py-1 rounded-sm">
              {tag}
            </li>
          ))}
        </ul>
      )}
      {link && (
        <a href={link.href} className="font-mono text-[0.6875rem] uppercase text-ember mt-auto">
          {link.label} <span aria-hidden="true">↗</span>
        </a>
      )}
    </motion.article>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/kit/ProjectCard.test.tsx`
Expected: PASS, 2 tests

- [ ] **Step 6: Write the failing test — `src/components/kit/ActionButton.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionButton } from './ActionButton'

describe('ActionButton', () => {
  it('renders its label and fires onClick', () => {
    const onClick = vi.fn()
    render(<ActionButton onClick={onClick}>Send message</ActionButton>)
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders as type="submit" when specified', () => {
    render(<ActionButton type="submit">Send message</ActionButton>)
    expect(screen.getByRole('button', { name: 'Send message' })).toHaveAttribute('type', 'submit')
  })
})
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `npx vitest run src/components/kit/ActionButton.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 8: Implement `src/components/kit/ActionButton.tsx`**, wrapping the KokonutUI button installed in Step 1:

```tsx
import { motion } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { cn } from "@/lib/utils"
import type { ReactNode, MouseEventHandler } from "react"

export interface ActionButtonProps {
  children: ReactNode
  type?: "button" | "submit"
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
}

export function ActionButton({ children, type = "button", onClick, className }: ActionButtonProps) {
  const reduced = useReducedMotionGate()

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={cn(
        "font-mono text-sm uppercase tracking-wide bg-signal text-paper px-6 py-3 rounded-sm",
        className
      )}
      whileHover={reduced ? undefined : { scale: 1.03, backgroundColor: "#B5241B" }}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {children}
    </motion.button>
  )
}
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `npx vitest run src/components/kit/ActionButton.test.tsx`
Expected: PASS, 2 tests

- [ ] **Step 10: Add a contrast test for the new button pairing**

Append to `src/lib/contrast.test.ts`:

```ts
  it('clears 4.5:1 for paper text on signal button background', () => {
    expect(contrastRatio('#FFF1ED', '#D62B22')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for paper text on the button hover background', () => {
    expect(contrastRatio('#FFF1ED', '#B5241B')).toBeGreaterThanOrEqual(4.5)
  })
```

Run: `npx vitest run src/lib/contrast.test.ts`
Expected: PASS, 9 tests total

- [ ] **Step 11: Commit**

```bash
git add src/components/kit src/components/ui src/lib/contrast.test.ts package.json package-lock.json
git commit -m "SAFE: KokonutUI card and button, re-themed onto the site palette"
```

---

## Task 4: Bklit UI chart primitives, smoke-tested

**Files:**
- Create: files generated by the Bklit UI CLI under `src/components/ui/` (chart primitives — exact names depend on which pieces you install, see Step 1)
- Create: `src/components/kit/ChartSmoke.test.tsx` (throwaway smoke test proving the installed primitives render — Task 11 builds the real timeline on top of them)

**Interfaces:**
- Produces: whatever Bklit UI's `Grid`, `XAxis`, and tooltip/line primitives export — Task 11 imports these directly by the names Step 1 discovers. Record those exact export names in this task's commit message so Task 11's implementer doesn't have to re-discover them.

- [ ] **Step 1: Install Bklit UI's chart primitives via its CLI**

Browse `https://bklit.com` (or `github.com/bklit/bklit-ui`) and install the primitives needed for an axis-based multi-track timeline: a grid/axis component and a line or area chart component, plus a tooltip component. It's a shadcn registry, same pattern as Task 3: `npx shadcn@latest add <registry-url>` per component. Note the exact exported component names and their prop shapes (read the installed source — it lands in your repo as editable code) — Task 11 depends on knowing these precisely.

- [ ] **Step 2: Write a smoke test proving the primitives render — `src/components/kit/ChartSmoke.test.tsx`**

Adapt the import names below to whatever Step 1 actually installed (e.g. if the installed grid component is `ChartGrid` exported from `@/components/ui/chart-grid`, import it under that name):

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
// Replace this import with the actual path/name from Step 1:
import { ChartGrid } from '@/components/ui/chart-grid'

describe('Bklit UI chart primitives', () => {
  it('renders a grid without throwing', () => {
    const { container } = render(<ChartGrid width={400} height={200} />)
    expect(container.firstChild).not.toBeNull()
  })
})
```

- [ ] **Step 3: Run the test and adjust props until it passes**

Run: `npx vitest run src/components/kit/ChartSmoke.test.tsx`
Expected: PASS. If the primitive requires different props than guessed above (e.g. a `data` array instead of raw `width`/`height`), read its source (installed in Step 1) and adjust the test call to match — the goal is proving the import path and basic render work, not exercising every prop.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui src/components/kit/ChartSmoke.test.tsx package.json package-lock.json
git commit -m "$(cat <<'EOF'
SAFE: Bklit UI chart primitives installed and smoke-tested

Exact exports available for Task 11: <list the component names and
prop shapes you discovered in Step 1 here>.
EOF
)"
```

---

## Task 5: Font loading and the dev-only font-pairing switcher

**Files:**
- Create: `src/hooks/useFontPairing.ts`
- Test: `src/hooks/useFontPairing.test.ts`
- Modify: `index.html` (add the 4 Google Fonts `<link>` tags — Tempting, Switzer, Athelas, Vanguard, Inter, Times New Roman MT needs no web font, Archivo, Abril, STIX)

**Interfaces:**
- Produces: `useFontPairing(): 'tempting' | 'athelas' | 'inter' | 'archivo'` — reads `?font=` from the URL, defaults to `'tempting'`. Sets `data-font` on `<html>` so CSS can select the active pairing.
- Consumes: nothing.

- [ ] **Step 1: Add font loads to `index.html`'s `<head>`**, after the existing meta tags:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <!-- Tempting + Switzer -->
    <link href="https://fonts.googleapis.com/css2?family=Switzer:wght@400;500;700&display=swap" rel="stylesheet">
    <!-- Athelas + Vanguard -->
    <link href="https://fonts.googleapis.com/css2?family=Vanguard:wght@400;600&display=swap" rel="stylesheet">
    <!-- Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <!-- Archivo + Abril -->
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=Abril+Fatface&display=swap" rel="stylesheet">
```

Tempting is not on Google Fonts — if it's not otherwise licensed, source it as a self-hosted `@font-face` (check what license the user has for it) or substitute the nearest free equivalent for the dev preview only; flag this to the user explicitly rather than silently swapping the name. Times New Roman MT is a system font on Windows/macOS and needs no `<link>` — reference it directly in the font stack with a `serif` fallback. STIX Two Text is on Google Fonts if a webfont is wanted for the Abril fallback.

- [ ] **Step 2: Extend `src/index.css`'s `@theme` block with the 4 pairings, selected by `[data-font]` on `<html>`**

```css
[data-font="tempting"] {
  --font-display: 'Tempting', 'Bricolage Grotesque', sans-serif;
  --font-body: 'Switzer', system-ui, sans-serif;
}
[data-font="athelas"] {
  --font-display: 'Athelas', Georgia, serif;
  --font-body: 'Vanguard', system-ui, sans-serif;
}
[data-font="inter"] {
  --font-display: 'Inter', system-ui, sans-serif;
  --font-body: 'Times New Roman', 'Times New Roman MT', Times, serif;
}
[data-font="archivo"] {
  --font-display: 'Archivo', 'Arial Black', sans-serif;
  --font-body: 'Abril Fatface', 'STIX Two Text', Georgia, serif;
}
```

- [ ] **Step 3: Write the failing test — `src/hooks/useFontPairing.test.ts`**

```ts
import { describe, it, expect, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFontPairing } from './useFontPairing'

describe('useFontPairing', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('defaults to tempting when no ?font param is present', () => {
    const { result } = renderHook(() => useFontPairing())
    expect(result.current).toBe('tempting')
  })

  it('reads a valid ?font param', () => {
    window.history.pushState({}, '', '/?font=archivo')
    const { result } = renderHook(() => useFontPairing())
    expect(result.current).toBe('archivo')
  })

  it('falls back to tempting for an unrecognized ?font value', () => {
    window.history.pushState({}, '', '/?font=nonsense')
    const { result } = renderHook(() => useFontPairing())
    expect(result.current).toBe('tempting')
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useFontPairing.test.ts`
Expected: FAIL — module not found

- [ ] **Step 5: Implement `src/hooks/useFontPairing.ts`**

```ts
import { useEffect, useState } from "react"

export type FontPairing = "tempting" | "athelas" | "inter" | "archivo"
const PAIRINGS: FontPairing[] = ["tempting", "athelas", "inter", "archivo"]

function readPairing(): FontPairing {
  const raw = new URLSearchParams(window.location.search).get("font")
  return (PAIRINGS as string[]).includes(raw ?? "") ? (raw as FontPairing) : "tempting"
}

/** Dev-only: lets ?font=<pairing> swap the active typography across the
 *  real built layout so the 4 candidates can be compared live, in
 *  context, before one is locked in (see Task 16, Step "lock in the font"). */
export function useFontPairing(): FontPairing {
  const [pairing, setPairing] = useState<FontPairing>(readPairing)

  useEffect(() => {
    document.documentElement.setAttribute("data-font", pairing)
  }, [pairing])

  useEffect(() => {
    const onPopState = () => setPairing(readPairing())
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  return pairing
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useFontPairing.test.ts`
Expected: PASS, 3 tests

- [ ] **Step 7: Wire it into `App.tsx`** (add this line inside the `App` component body, above the `return`)

```tsx
useFontPairing()
```

(and the import: `import { useFontPairing } from "@/hooks/useFontPairing"`)

- [ ] **Step 8: Manually verify all 4 pairings in the real dev server**

Run: `npm run dev`, then visit `/?font=tempting`, `/?font=athelas`, `/?font=inter`, `/?font=archivo` in a real browser and confirm each swaps the display/body fonts visibly. This is the comparison the user asked for — don't skip it.

- [ ] **Step 9: Commit**

```bash
git add index.html src/index.css src/hooks/useFontPairing.ts src/hooks/useFontPairing.test.ts src/App.tsx
git commit -m "SAFE: dev-only font-pairing switcher, all 4 candidates loaded"
```

---

## Task 6: Data layer — timeline, work, path, toolkit content

**Files:**
- Create: `src/data/timeline.ts`, `src/data/timeline.test.ts`
- Create: `src/data/work.ts`
- Create: `src/data/path.ts`
- Create: `src/data/toolkit.ts`

**Interfaces:**
- Produces: `TimelineNode`, `TimelineEdge`, `TIMELINE_NODES: TimelineNode[]`, `TIMELINE_EDGES: TimelineEdge[]` — consumed by Task 11.
- Produces: `ProjectCard`, `OssItem`, `ELECTRA`, `PROJECT_CARDS: ProjectCardData[]`, `OSS_ITEMS: OssItem[]` — consumed by Task 12. (Type name `ProjectCardData` here, distinct from the `ProjectCard` *component* from Task 3, to avoid a name collision — Task 12 imports both.)
- Produces: `LedgerRow`, `LEDGER_ROWS: LedgerRow[]` — consumed by Task 14.
- Produces: `ToolkitGroup`, `TOOLKIT_GROUPS: ToolkitGroup[]` — consumed by Task 14.

- [ ] **Step 1: Write the failing test — `src/data/timeline.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { TIMELINE_NODES, TIMELINE_EDGES } from './timeline'

describe('timeline data integrity', () => {
  it('every edge references nodes that exist', () => {
    const ids = new Set(TIMELINE_NODES.map((n) => n.id))
    for (const edge of TIMELINE_EDGES) {
      expect(ids.has(edge.from), `edge.from "${edge.from}" is not a known node id`).toBe(true)
      expect(ids.has(edge.to), `edge.to "${edge.to}" is not a known node id`).toBe(true)
    }
  })

  it('has exactly one node per role kind for TwelveLabs (devex, agentsec)', () => {
    const roles = TIMELINE_NODES.filter((n) => n.kind === 'role')
    expect(roles.map((n) => n.id).sort()).toEqual(['agentsec', 'devex'])
  })

  it('runs oldest to newest by date', () => {
    const dates = TIMELINE_NODES.map((n) => n.date)
    const sorted = [...dates].sort()
    // Not a strict equality (nodes can share a month), but no node may be
    // dated before the node before it in the declared array — the whole
    // point of the chronology rule from the old README.
    expect(dates).toEqual(sorted)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/data/timeline.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/data/timeline.ts`**, porting `NODES`/`EDGES` from `assets/src/script.js:29-50` (already dated and labeled — this is a direct port, not new content) into 3 tracks:

```ts
export type TimelineNodeKind = "role" | "artifact" | "event"
export type TimelineTrack = "twelvelabs" | "personal" | "school"

export interface TimelineNode {
  id: string
  label: string
  sub: string
  kind: TimelineNodeKind
  track: TimelineTrack
  date: string // 'YYYY-MM', used for x-axis position and sort order
}

export interface TimelineEdge {
  from: string
  to: string
  label: string
  soft?: boolean
}

export const TIMELINE_NODES: TimelineNode[] = [
  { id: "hacks",    label: "Chinatown Hacks",              sub: "Mar 2025",           kind: "event",    track: "personal",   date: "2025-03" },
  { id: "sentinel", label: "Sentinel",                     sub: "Prototype",          kind: "artifact", track: "personal",   date: "2025-03" },
  { id: "tamu",     label: "Texas A&M",                    sub: "Aug 2025 →",         kind: "event",    track: "school",     date: "2025-08" },
  { id: "devex",    label: "TwelveLabs · DevEx",           sub: "Jun–Dec 2025",       kind: "role",     track: "twelvelabs", date: "2025-06" },
  { id: "bastion",  label: "Bastion",                      sub: "Shipped",            kind: "artifact", track: "twelvelabs", date: "2025-06" },
  { id: "sage",     label: "SAGE",                         sub: "Shipped",            kind: "artifact", track: "twelvelabs", date: "2025-08" },
  { id: "recurser", label: "Recurser",                     sub: "Proposed, then shipped", kind: "artifact", track: "twelvelabs", date: "2025-06" },
  { id: "agentsec", label: "TwelveLabs · Agent Security",  sub: "Feb–Jun 2026",       kind: "role",     track: "twelvelabs", date: "2026-02" },
  { id: "electra",  label: "Electra",                      sub: "Beta",               kind: "artifact", track: "twelvelabs", date: "2026-02" },
]

export const TIMELINE_EDGES: TimelineEdge[] = [
  { from: "hacks",    to: "sentinel", label: "prototyped" },
  { from: "sentinel", to: "devex",    label: "led to an offer" },
  { from: "devex",    to: "sage",     label: "built" },
  { from: "devex",    to: "bastion",  label: "built" },
  { from: "devex",    to: "recurser", label: "proposed" },
  { from: "devex",    to: "agentsec", label: "returned as" },
  { from: "agentsec", to: "electra",  label: "led the build" },
  { from: "devex",    to: "tamu",     label: "alongside", soft: true },
]
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/data/timeline.test.ts`
Expected: PASS, 3 tests

- [ ] **Step 5: Implement `src/data/work.ts`**, porting content verbatim from `index.html:129-343` (current repo, pre-rework):

```ts
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
```

- [ ] **Step 6: Implement `src/data/path.ts`**, porting `index.html:386-464`:

```ts
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
```

- [ ] **Step 7: Implement `src/data/toolkit.ts`**, porting `index.html:474-514`:

```ts
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
```

- [ ] **Step 8: Commit**

```bash
git add src/data
git commit -m "SAFE: port timeline, work, path, and toolkit content into typed data"
```

---

## Task 7: The agent field — port the physics core and a canvas renderer

**Files:**
- Create: `src/lib/agentField.ts` (direct port of `assets/src/field.js`)
- Create: `src/lib/agentField.test.ts` (ported from `tests/field.html`'s assertions)
- Create: `src/components/effects/AgentField.tsx`

**Interfaces:**
- Produces: `createField(opts: FieldOpts): Field`, `readBands(): Band[]`, `colourAt(bands: Band[], y: number): string`, `readRepulsors(): Rect[]`, `STANDOFF: number` — all pure/DOM-reading functions, framework-agnostic.
- Produces: `<AgentField />` — a full-viewport fixed canvas, mounted once near the root in Task 16. No props; it reads the DOM for bands/repulsors itself, exactly like the original.

- [ ] **Step 1: Write the failing test — `src/lib/agentField.test.ts`**, porting the assertions from `tests/field.html`:

```ts
import { describe, it, expect } from 'vitest'
import { createField, colourAt, readBands, readRepulsors } from './agentField'
import type { Band } from './agentField'

describe('colourAt', () => {
  const bands: Band[] = [
    { top: 0, bottom: 100, colour: 'rgb(255, 241, 237)' },
    { top: 100, bottom: 300, colour: 'rgb(214, 43, 34)' },
    { top: 300, bottom: 600, colour: 'rgb(57, 67, 79)' },
  ]

  it('returns the band colour for a point inside it', () => {
    expect(colourAt(bands, 50)).toBe('rgb(255, 241, 237)')
    expect(colourAt(bands, 200)).toBe('rgb(214, 43, 34)')
  })

  it('clamps out-of-range points to the nearest band rather than the last', () => {
    expect(colourAt(bands, -500)).toBe('rgb(255, 241, 237)')
    expect(colourAt(bands, 5000)).toBe('rgb(57, 67, 79)')
  })

  it('falls back to the body colour when there are no bands', () => {
    const result = colourAt([], 100)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('createField', () => {
  it('seeds the requested number of agents with stable identity ids', () => {
    const field = createField({ w: 1440, h: 900, n: 70, seed: 7 })
    expect(field.agents).toHaveLength(70)
    expect(new Set(field.agents.map((a) => a.id)).size).toBe(70)
  })

  it('never leaves an agent outside the canvas bounds after stepping', () => {
    const field = createField({ w: 1440, h: 900, n: 70, seed: 7 })
    for (let i = 0; i < 200; i++) field.step(16)
    for (const a of field.agents) {
      expect(a.x).toBeGreaterThanOrEqual(0)
      expect(a.x).toBeLessThanOrEqual(1440)
      expect(a.y).toBeGreaterThanOrEqual(0)
      expect(a.y).toBeLessThanOrEqual(900)
    }
  })

  it('ejects every agent that starts inside a repulsor rect', () => {
    const field = createField({ w: 1440, h: 900, n: 70, seed: 7 })
    const rects = [{ left: 0, top: 0, right: 1440, bottom: 100 }]
    field.setRepulsors(rects)
    for (const a of field.agents) {
      const inside = a.x > rects[0].left && a.x < rects[0].right && a.y > rects[0].top && a.y < rects[0].bottom
      expect(inside).toBe(false)
    }
  })
})

describe('readBands / readRepulsors', () => {
  it('read from the DOM without throwing when no matching elements exist', () => {
    expect(() => readBands()).not.toThrow()
    expect(() => readRepulsors()).not.toThrow()
    expect(readBands()).toEqual([])
    expect(readRepulsors()).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/agentField.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/lib/agentField.ts`**, a near-verbatim TypeScript port of `assets/src/field.js` (same constants, same algorithm — this physics is already tuned and tested, do not retune it):

```ts
export interface Agent {
  x: number; y: number; vx: number; vy: number
  id: number; phase: number; trust: number
}
export interface Rect { left: number; top: number; right: number; bottom: number }
export interface Band { top: number; bottom: number; colour: string }
export interface FieldOpts { w: number; h: number; n: number; seed?: number }
export interface Field {
  agents: Agent[]
  step: (dt: number) => void
  setRepulsors: (rects: Rect[]) => void
}

export const STANDOFF = 24 // px of clear air around glyphs

const BAND_SEL = "main > section, body > footer"
const TEXT_SEL = [
  ".topbar", ".hero-name", ".hero-thesis", ".hero-meta", ".eyebrow",
  ".section-title", ".card-title", ".card-desc",
  ".feature h3", ".feature p",
  ".tally-num", ".tally-label", ".tally-note",
  ".ledger-when", ".ledger-what",
  ".kit-group", ".contact-title", ".contact-copy", ".contact-links",
  ".form", ".timeline", ".timeline-caption",
  ".foot-name", ".foot-meta",
].join(",")

export function readBands(): Band[] {
  const out: Band[] = []
  document.querySelectorAll(BAND_SEL).forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.height <= 0) return
    out.push({ top: r.top, bottom: r.bottom, colour: window.getComputedStyle(el).color })
  })
  return out
}

export function colourAt(bands: Band[], y: number): string {
  if (!bands.length) return window.getComputedStyle(document.body).color
  if (y < bands[0].top) return bands[0].colour
  for (const b of bands) if (y >= b.top && y < b.bottom) return b.colour
  return bands[bands.length - 1].colour
}

export function readRepulsors(): Rect[] {
  const out: Rect[] = []
  document.querySelectorAll(TEXT_SEL).forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    out.push({ left: r.left - STANDOFF, top: r.top - STANDOFF, right: r.right + STANDOFF, bottom: r.bottom + STANDOFF })
  })
  return out
}

const SEP = 260, SEP_R = 34, ALIGN = 0.055, COH = 0.0016, NEAR = 130
const WANDER = 0.055, REP = 3.6, DAMP = 0.94, V_MAX = 1.5
const EDGE = 60, EDGE_K = 0.02
const TRUST_DECAY = 0.0022, TRUST_RECOVER = 0.003, TRUST_FLOOR = 0.06

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createField(opts: FieldOpts): Field {
  const { w, h } = opts
  const rnd = mulberry32(opts.seed ?? 1)
  const agents: Agent[] = []
  let rects: Rect[] = []
  let clock = 0

  for (let i = 0; i < opts.n; i++) {
    agents.push({
      x: EDGE + rnd() * (w - 2 * EDGE),
      y: EDGE + rnd() * (h - 2 * EDGE),
      vx: (rnd() - 0.5) * 0.6,
      vy: (rnd() - 0.5) * 0.6,
      id: i,
      phase: rnd() * Math.PI * 2,
      trust: rnd(),
    })
  }

  function escapeTarget(pos: number, other: number, axisIsY: boolean, dir: number): number {
    let p = pos, moved = true, guard = 0
    while (moved && guard < 16) {
      moved = false
      guard++
      for (const r of rects) {
        const lo = axisIsY ? r.top : r.left
        const hi = axisIsY ? r.bottom : r.right
        const oLo = axisIsY ? r.left : r.top
        const oHi = axisIsY ? r.right : r.bottom
        if (other <= oLo || other >= oHi) continue
        if (p > lo && p < hi) { p = dir < 0 ? lo - 1 : hi + 1; moved = true }
      }
    }
    return p
  }

  function ejectFromRects() {
    for (const a of agents) {
      let guard = 0
      while (guard < 8) {
        guard++
        let hit = false
        for (const r of rects) {
          if (a.x > r.left && a.x < r.right && a.y > r.top && a.y < r.bottom) { hit = true; break }
        }
        if (!hit) break

        const upY = escapeTarget(a.y, a.x, true, -1)
        const downY = escapeTarget(a.y, a.x, true, 1)
        const leftX = escapeTarget(a.x, a.y, false, -1)
        const rightX = escapeTarget(a.x, a.y, false, 1)
        const dUp = a.y - upY, dDown = downY - a.y, dLeft = a.x - leftX, dRight = rightX - a.x
        const m = Math.min(dUp, dDown, dLeft, dRight)

        if (m === dUp) a.y = upY
        else if (m === dDown) a.y = downY
        else if (m === dLeft) a.x = leftX
        else a.x = rightX

        a.vx = 0; a.vy = 0
      }
    }
  }

  function setRepulsors(next: Rect[]) {
    rects = next || []
    ejectFromRects()
  }

  function step(dt: number) {
    clock += dt
    for (const a of agents) {
      let ax = 0, ay = 0, cx = 0, cy = 0, hx = 0, hy = 0, n = 0

      for (const b of agents) {
        if (a === b) continue
        const dx = a.x - b.x, dy = a.y - b.y
        const d2 = dx * dx + dy * dy
        if (d2 > NEAR * NEAR || d2 === 0) continue
        const d = Math.sqrt(d2)
        if (d < SEP_R) { ax += (dx / d) * (SEP / d2); ay += (dy / d) * (SEP / d2) }
        cx += b.x; cy += b.y; hx += b.vx; hy += b.vy; n++
      }

      if (n > 0) {
        ax += (hx / n - a.vx) * ALIGN * a.trust
        ay += (hy / n - a.vy) * ALIGN * a.trust
        ax += (cx / n - a.x) * COH * a.trust
        ay += (cy / n - a.y) * COH * a.trust
        a.trust -= TRUST_DECAY * dt * n * 0.12
      } else {
        a.trust += TRUST_RECOVER * dt
      }
      if (a.trust < TRUST_FLOOR) a.trust = TRUST_FLOOR
      if (a.trust > 1) a.trust = 1

      ax += Math.sin(clock * 0.0016 + a.phase) * WANDER
      ay += Math.cos(clock * 0.0013 + a.phase * 1.7) * WANDER

      for (const r of rects) {
        if (a.x <= r.left || a.x >= r.right || a.y <= r.top || a.y >= r.bottom) continue
        const dl = a.x - r.left, dr = r.right - a.x, dtp = a.y - r.top, db = r.bottom - a.y
        const m = Math.min(dl, dr, dtp, db)
        if (m === dl) ax -= REP
        else if (m === dr) ax += REP
        else if (m === dtp) ay -= REP
        else ay += REP
      }

      if (a.x < EDGE) ax += (EDGE - a.x) * EDGE_K
      if (a.x > w - EDGE) ax -= (a.x - (w - EDGE)) * EDGE_K
      if (a.y < EDGE) ay += (EDGE - a.y) * EDGE_K
      if (a.y > h - EDGE) ay -= (a.y - (h - EDGE)) * EDGE_K

      a.vx = (a.vx + ax) * DAMP
      a.vy = (a.vy + ay) * DAMP
      const sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy)
      if (sp > V_MAX) { a.vx = (a.vx / sp) * V_MAX; a.vy = (a.vy / sp) * V_MAX }
      a.x += a.vx * dt
      a.y += a.vy * dt

      if (a.x < 0) { a.x = 0; a.vx = 0 }
      if (a.x > w) { a.x = w; a.vx = 0 }
      if (a.y < 0) { a.y = 0; a.vy = 0 }
      if (a.y > h) { a.y = h; a.vy = 0 }
    }
    ejectFromRects()
  }

  return { agents, step, setRepulsors }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/agentField.test.ts`
Expected: PASS, 8 tests

- [ ] **Step 5: Implement the canvas renderer — `src/components/effects/AgentField.tsx`** (this wiring — a `requestAnimationFrame` loop drawing the sim to a full-viewport canvas — did not exist in the vanilla site; the old `field.js` had the physics but was never connected to a draw loop, per its own test-only usage. This is new, on top of ported physics.)

```tsx
import { useEffect, useRef } from "react"
import { createField, readBands, readRepulsors, colourAt } from "@/lib/agentField"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

const AGENT_COUNT = 90
const AGENT_RADIUS = 1.6

export default function AgentField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reduced = useReducedMotionGate()

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const field = createField({ w: width, h: height, n: AGENT_COUNT, seed: 7 })
    field.setRepulsors(readRepulsors())

    let raf = 0
    let last = performance.now()
    let bandRefreshClock = 0

    function onResize() {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.scale(dpr, dpr)
      field.setRepulsors(readRepulsors())
    }
    window.addEventListener("resize", onResize)

    function frame(now: number) {
      const dt = Math.min(now - last, 48)
      last = now
      bandRefreshClock += dt

      // Layout only changes on scroll/resize; re-reading every 250ms
      // keeps repulsors and band colours correct without doing a
      // getBoundingClientRect pass on every frame.
      if (bandRefreshClock > 250) {
        bandRefreshClock = 0
        field.setRepulsors(readRepulsors())
      }

      field.step(dt)
      const bands = readBands()

      ctx!.clearRect(0, 0, width, height)
      for (const a of field.agents) {
        ctx!.fillStyle = colourAt(bands, a.y)
        ctx!.globalAlpha = 0.35 + a.trust * 0.45
        ctx!.beginPath()
        ctx!.arc(a.x, a.y, AGENT_RADIUS, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
    }
  }, [reduced])

  if (reduced) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-[1] pointer-events-none"
    />
  )
}
```

- [ ] **Step 6: Verify in the dev server**

Mount `<AgentField />` temporarily inside `App.tsx` (above the placeholder `<main>`), run `npm run dev`, and confirm small dots drift and cluster on screen with no console errors. Remove the temporary mount — Task 16 mounts it for real, once there's real content and text repulsors to react to.

- [ ] **Step 7: Commit**

```bash
git add src/lib/agentField.ts src/lib/agentField.test.ts src/components/effects/AgentField.tsx
git commit -m "SAFE: port the agent field physics and wire it to a canvas renderer"
```

---

## Task 8: Site-wide cursor-reactive effect layer

**Files:**
- Create: `src/components/effects/CursorEffect.tsx`
- Test: `src/components/effects/CursorEffect.test.tsx`

**Interfaces:**
- Produces: `<CursorEffect />` — mounted once near the root alongside `<AgentField />` in Task 16. No props.
- Consumes: `useReducedMotionGate` from Task 2.

- [ ] **Step 1: Write the failing test — `src/components/effects/CursorEffect.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import CursorEffect from './CursorEffect'

vi.mock('@/hooks/useReducedMotionGate', () => ({
  useReducedMotionGate: () => true,
}))

describe('CursorEffect', () => {
  it('renders nothing when reduced motion is preferred', () => {
    const { container } = render(<CursorEffect />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/effects/CursorEffect.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/components/effects/CursorEffect.tsx`**

A soft radial-gradient "lens" that follows the pointer, implemented with Motion's spring-smoothed motion values so it trails rather than snaps — the ripple/lens language from `fluid.krackeddevs.com`, reduced to a single ambient layer rather than a full parametric tool. It sits above the agent field (`z-index` higher) but still below content and still `pointer-events: none`, so it never competes with the field's own scroll-driven behavior — the two layers read independently, one reacting to the pointer, one to scroll.

```tsx
import { useEffect } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

export default function CursorEffect() {
  const reduced = useReducedMotionGate()
  const x = useMotionValue(-9999)
  const y = useMotionValue(-9999)
  const springX = useSpring(x, { stiffness: 120, damping: 20, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 120, damping: 20, mass: 0.4 })

  useEffect(() => {
    if (reduced) return
    function onMove(e: PointerEvent) {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [reduced, x, y])

  if (reduced) return null

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[3] pointer-events-none"
      style={{
        background: "radial-gradient(320px circle at var(--cx) var(--cy), rgba(214,43,34,0.10), transparent 70%)",
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          // @ts-expect-error -- CSS custom properties aren't in the style type
          "--cx": springX,
          "--cy": springY,
        }}
      />
    </motion.div>
  )
}
```

Note: Motion's `useMotionValue`/`useSpring` values render into CSS custom properties via the `style` prop's escape hatch (the `--cx`/`--cy` keys) — Motion updates them outside React's render cycle for 60fps tracking without re-rendering the tree on every pointer move. If this exact custom-property wiring doesn't type-check against the installed Motion version, the fallback is to drive `background-position` or a `transform: translate(x, y)` on an absolutely-positioned glow div directly from `springX`/`springY` via `useMotionTemplate` — same visual result, different plumbing; check Motion's current docs for whichever pattern its installed version supports.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/effects/CursorEffect.test.tsx`
Expected: PASS

- [ ] **Step 5: Verify in the dev server**

Mount `<CursorEffect />` temporarily in `App.tsx`, run `npm run dev`, move the pointer around, and confirm a soft red glow trails it smoothly with no jank. Remove the temporary mount — Task 16 mounts it for real.

- [ ] **Step 6: Commit**

```bash
git add src/components/effects/CursorEffect.tsx src/components/effects/CursorEffect.test.tsx
git commit -m "SAFE: site-wide cursor-reactive glow, composes with the agent field"
```

---

## Task 9: App shell — Topbar and Footer

**Files:**
- Create: `src/components/layout/Topbar.tsx`, `src/components/layout/Topbar.test.tsx`
- Create: `src/components/layout/Footer.tsx`

**Interfaces:**
- Produces: `<Topbar sections={{ id: string; label: string }[]} />`, `<Footer />` — both consumed by `App.tsx` in Task 16.

- [ ] **Step 1: Write the failing test — `src/components/layout/Topbar.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Topbar } from './Topbar'

const SECTIONS = [
  { id: 'work', label: 'Work' },
  { id: 'path', label: 'Path' },
  { id: 'toolkit', label: 'Toolkit' },
  { id: 'contact', label: 'Contact' },
]

describe('Topbar', () => {
  it('renders the mark and every section link', () => {
    render(<Topbar sections={SECTIONS} />)
    expect(screen.getByRole('link', { name: 'AS' })).toHaveAttribute('href', '#top')
    for (const s of SECTIONS) {
      expect(screen.getByRole('link', { name: s.label })).toHaveAttribute('href', `#${s.id}`)
    }
  })

  it('renders a skip link pointing at #main', () => {
    render(<Topbar sections={SECTIONS} />)
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/layout/Topbar.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/components/layout/Topbar.tsx`**, porting the sticky-ground + scroll-progress + active-section-marker behavior from `assets/src/script.js:771-846` and `main.css:100-186` into Motion-driven state:

```tsx
import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useSpring } from "motion/react"
import { cn } from "@/lib/utils"

export interface TopbarSection { id: string; label: string }
export interface TopbarProps { sections: TopbarSection[] }

export function Topbar({ sections }: TopbarProps) {
  const [stuck, setStuck] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll()
  const progressScaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 })

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)
    if (!targets.length || !("IntersectionObserver" in window)) return

    // The marker tracks whichever section owns the MIDDLE of the
    // viewport, not merely what's visible — tracking visibility
    // flickers between two links whenever a boundary crosses the
    // screen, and several sections can be visible at once near the
    // bottom of the page.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [sections])

  return (
    <>
      <a className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-slate focus:text-paper focus:px-4 focus:py-2 font-mono text-xs" href="#main">
        Skip to content
      </a>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-4 px-[clamp(1.25rem,5vw,5.5rem)] py-[1.1rem] transition-colors duration-300",
          stuck && "bg-slate py-[0.85rem]"
        )}
      >
        <a className="font-display font-extrabold text-lg text-paper no-underline" href="#top">AS</a>
        <nav ref={navRef} className="relative flex gap-[clamp(0.9rem,2.5vw,2rem)]" aria-label="Sections">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={cn(
                "font-mono text-[0.6875rem] uppercase tracking-wide text-paper no-underline pb-0.5 border-b border-transparent transition-opacity",
                active && active !== s.id && "opacity-55",
                active === s.id && "opacity-100 border-paper"
              )}
            >
              {s.label}
            </a>
          ))}
        </nav>
        <motion.span
          aria-hidden="true"
          className="absolute left-0 bottom-0 h-0.5 w-full bg-paper origin-left"
          style={{ scaleX: progressScaleX, opacity: stuck ? 1 : 0 }}
        />
      </header>
    </>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/layout/Topbar.test.tsx`
Expected: PASS, 2 tests

- [ ] **Step 5: Implement `src/components/layout/Footer.tsx`**, porting `index.html:560-563`:

```tsx
export function Footer() {
  return (
    <footer className="foot px-[var(--edge,1.5rem)] py-10 text-center">
      <p className="foot-name font-display font-extrabold text-slate">Aahil Shaikh</p>
      <p className="foot-meta font-mono text-[0.6875rem] uppercase text-mute mt-2">
        Built with React, Motion, KokonutUI &amp; Bklit UI. © 2026
      </p>
    </footer>
  )
}
```

(Footer copy updates "no framework" to reflect the new stack honestly — everything else in the footer's meaning stays the same.)

- [ ] **Step 6: Commit**

```bash
git add src/components/layout
git commit -m "SAFE: Topbar with scroll progress + section marker, Footer"
```

---

## Task 10: Hero section

**Files:**
- Create: `src/components/sections/Hero.tsx`, `src/components/sections/Hero.test.tsx`

**Interfaces:**
- Produces: `<Hero />` — consumed by `App.tsx` in Task 16. No props; content is inline (it's page-specific, one-off copy — doesn't need a data file).

- [ ] **Step 1: Write the failing test — `src/components/sections/Hero.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Hero } from './Hero'

describe('Hero', () => {
  it('renders the name and the thesis line', () => {
    render(<Hero />)
    expect(screen.getByText('Aahil')).toBeInTheDocument()
    expect(screen.getByText('Shaikh')).toBeInTheDocument()
    expect(screen.getByText(/parts of agents nobody's solved yet/)).toBeInTheDocument()
  })

  it('renders the meta line', () => {
    render(<Hero />)
    expect(screen.getByText(/Sophomore at Texas A&M/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/Hero.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/components/sections/Hero.tsx`**, porting `index.html:42-58`. Parallax and staggered entrance replace the vanilla `data-parallax` attribute and CSS keyframes with Motion, still as ONE block (per the old lesson in `main.css:236` / the handoff: per-line parallax reads as depth for ~200px then the lines converge and overlap):

```tsx
import { motion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

export function Hero() {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotionGate()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 120])
  const opacity = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1, 0])

  return (
    <section id="top" className="hero relative min-h-screen flex items-center bg-signal text-paper px-[var(--edge,1.5rem)] py-[clamp(7rem,14vh,9rem)] overflow-hidden">
      <motion.div ref={ref} style={{ y, opacity }} className="hero-inner w-full max-w-[1400px] mx-auto">
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="eyebrow font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] mb-5"
        >
          Applied AI &amp; systems
        </motion.p>
        <h1 className="hero-name font-display font-extrabold text-[clamp(4rem,15vw,12rem)] tracking-[-0.055em] leading-[0.95] mb-8">
          <motion.span
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="line block"
          >
            Aahil
          </motion.span>
          <motion.span
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.22 }}
            className="line block"
          >
            Shaikh
          </motion.span>
        </h1>
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
          className="hero-thesis max-w-[34ch] font-display font-semibold text-[clamp(1.35rem,3.2vw,2.35rem)] leading-[1.15] tracking-[-0.02em]"
        >
          At work it&rsquo;s the parts of agents nobody&rsquo;s solved yet &mdash; drift,
          identity, cooperation. At home it&rsquo;s whatever annoyed me that week. Both
          keep outgrowing what I built them for.
        </motion.p>
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.62 }}
          className="hero-meta font-mono text-xs tracking-wide mt-6"
        >
          Sophomore at Texas A&amp;M · Two terms at TwelveLabs · Bay Area
        </motion.p>
      </motion.div>
    </section>
  )
}
```

(The name-decode-from-noise scramble from the old site is deliberately not ported here — it's cosmetic flourish, not content-bearing, and Task 16's final pass can layer it back in as an additional entrance effect if there's time; it isn't load-bearing for any other task so it's safe to treat as optional polish rather than blocking this task.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/sections/Hero.test.tsx`
Expected: PASS, 2 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Hero.tsx src/components/sections/Hero.test.tsx
git commit -m "SAFE: Hero section ported with Motion parallax and staggered entrance"
```

---

## Task 11: Career timeline — the graph's replacement

**Files:**
- Create: `src/components/sections/Timeline.tsx`, `src/components/sections/Timeline.test.tsx`

**Interfaces:**
- Consumes: `TIMELINE_NODES`, `TIMELINE_EDGES` from Task 6; the Bklit chart primitives installed in Task 4 (exact names recorded in that task's commit message).
- Produces: `<Timeline />` — consumed by `App.tsx` in Task 16.

- [ ] **Step 1: Write the failing test — `src/components/sections/Timeline.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Timeline } from './Timeline'
import { TIMELINE_NODES } from '@/data/timeline'

describe('Timeline', () => {
  it('renders every node label', () => {
    render(<Timeline />)
    for (const node of TIMELINE_NODES) {
      expect(screen.getByText(node.label)).toBeInTheDocument()
    }
  })

  it('renders the causal caption', () => {
    render(<Timeline />)
    expect(screen.getByText(/Every job I've had was caused by the one before it/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/Timeline.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/components/sections/Timeline.tsx`**

Layout math: convert each node's `date` (`YYYY-MM`) to a month index for the x-axis, assign one y-band per `track`. Nodes render as positioned buttons (for the hover tooltip); edges render as SVG lines connecting node centers, animated in with Motion's `pathLength` as the section scrolls into view — same "builds in causal order" beat as the old graph, driven by `TIMELINE_EDGES`' declared order exactly like the old `STEP` timing was driven by `EDGES`' order.

```tsx
import { useMemo, useRef, useState } from "react"
import { motion, useInView } from "motion/react"
import { TIMELINE_NODES, TIMELINE_EDGES, type TimelineTrack } from "@/data/timeline"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

const TRACK_Y: Record<TimelineTrack, number> = { twelvelabs: 60, personal: 160, school: 260 }
const TRACK_LABEL: Record<TimelineTrack, string> = { twelvelabs: "TwelveLabs", personal: "Personal / OSS", school: "School" }

function monthIndex(date: string): number {
  const [y, m] = date.split("-").map(Number)
  return y * 12 + m
}

export function Timeline() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.2 })
  const reduced = useReducedMotionGate()
  const [hoverEdge, setHoverEdge] = useState<string | null>(null)

  const { positioned, minX, maxX } = useMemo(() => {
    const idx = TIMELINE_NODES.map((n) => monthIndex(n.date))
    const minX = Math.min(...idx)
    const maxX = Math.max(...idx)
    const positioned = TIMELINE_NODES.map((n) => ({
      ...n,
      cx: 60 + ((monthIndex(n.date) - minX) / Math.max(maxX - minX, 1)) * 840,
      cy: TRACK_Y[n.track],
    }))
    return { positioned, minX, maxX }
  }, [])

  const byId = useMemo(() => new Map(positioned.map((n) => [n.id, n])), [positioned])

  return (
    <section className="figure-section bg-slate text-paper py-24 px-[var(--edge,1.5rem)]" ref={sectionRef as any}>
      <figure className="timeline max-w-[1000px] mx-auto">
        <figcaption className="timeline-caption mb-10">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wide text-coral block mb-2">Trajectory</span>
          Every job I&rsquo;ve had was caused by the one before it. Drawn as the thing it actually is.
        </figcaption>

        <svg viewBox="0 0 960 320" className="w-full h-auto" role="img" aria-label="Career timeline, three tracks: TwelveLabs, Personal, School">
          {(Object.keys(TRACK_Y) as TimelineTrack[]).map((track) => (
            <text key={track} x={8} y={TRACK_Y[track] + 4} className="fill-mute font-mono text-[10px] uppercase">
              {TRACK_LABEL[track]}
            </text>
          ))}

          {TIMELINE_EDGES.map((edge, i) => {
            const from = byId.get(edge.from)
            const to = byId.get(edge.to)
            if (!from || !to) return null
            const key = `${edge.from}-${edge.to}`
            return (
              <g key={key} onMouseEnter={() => setHoverEdge(key)} onMouseLeave={() => setHoverEdge(null)}>
                <motion.line
                  x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
                  stroke={edge.soft ? "#5A6675" : "#FFA795"}
                  strokeDasharray={edge.soft ? "4 4" : undefined}
                  strokeWidth={hoverEdge === key ? 2.5 : 1.5}
                  initial={reduced ? false : { pathLength: 0 }}
                  animate={inView ? { pathLength: 1 } : {}}
                  transition={{ duration: 0.55, delay: reduced ? 0 : i * 0.12, ease: "easeOut" }}
                />
                {hoverEdge === key && (
                  <text x={(from.cx + to.cx) / 2} y={(from.cy + to.cy) / 2 - 8} className="fill-paper font-mono text-[10px]" textAnchor="middle">
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}

          {positioned.map((node, i) => (
            <motion.g
              key={node.id}
              initial={reduced ? false : { opacity: 0, scale: 0.6 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: reduced ? 0 : 0.15 + i * 0.08 }}
            >
              <circle cx={node.cx} cy={node.cy} r={node.kind === "role" ? 7 : 5} fill={node.kind === "role" ? "#D62B22" : "#FFF1ED"} />
              <text x={node.cx} y={node.cy - 12} textAnchor="middle" className="fill-paper font-mono text-[9px]">
                {node.label}
              </text>
            </motion.g>
          ))}
        </svg>
      </figure>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/sections/Timeline.test.tsx`
Expected: PASS, 2 tests

- [ ] **Step 5: Replace the hand-rolled SVG with the installed Bklit primitives where they fit**

The hand-rolled `<svg>` above proves the layout and content are correct and gives Task 16 something real to assemble against. Now swap the raw `<line>`/`<circle>`/`<text>` elements for the Bklit `Grid`/axis components installed in Task 4 wherever they cover the same job (grid lines, axis ticks) — keep the custom edge/node rendering, since Bklit's chart types don't have a "causal graph" preset. Re-run the Step 4 test after swapping to confirm nothing broke.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/Timeline.tsx src/components/sections/Timeline.test.tsx
git commit -m "SAFE: causal timeline chart replaces the force-simulated graph"
```

---

## Task 12: Work section — Electra feature, project grid, drag interactions

**Files:**
- Create: `src/components/sections/Work.tsx`, `src/components/sections/Work.test.tsx`

**Interfaces:**
- Consumes: `ELECTRA`, `PROJECT_CARDS`, `OSS_ITEMS` from Task 6; `ProjectCard` component from Task 3.
- Produces: `<Work />` — consumed by `App.tsx` in Task 16.

- [ ] **Step 1: Write the failing test — `src/components/sections/Work.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Work } from './Work'
import { PROJECT_CARDS, ELECTRA } from '@/data/work'

describe('Work', () => {
  it('renders the Electra feature and every project card title', () => {
    render(<Work />)
    expect(screen.getByText(ELECTRA.title)).toBeInTheDocument()
    for (const p of PROJECT_CARDS) {
      expect(screen.getByText(p.title)).toBeInTheDocument()
    }
  })

  it('renders every OSS item', () => {
    render(<Work />)
    expect(screen.getByText('MAGI')).toBeInTheDocument()
    expect(screen.getByText('clair')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/Work.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/components/sections/Work.tsx`**

Two drag interactions, per the spec's "keep all candidates" resolution:
1. **Drag-to-reorder** the project grid, using Motion's built-in `Reorder.Group`/`Reorder.Item`.
2. **Drag-to-expand**: dragging a card downward past a threshold expands it in place to show its full description at a larger size (a `layout` animation via `layoutId`), then a tap collapses it again.

```tsx
import { useState } from "react"
import { Reorder, motion } from "motion/react"
import { ProjectCard } from "@/components/kit/ProjectCard"
import { ELECTRA, PROJECT_CARDS, OSS_ITEMS, type ProjectCardData } from "@/data/work"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

export function Work() {
  const reduced = useReducedMotionGate()
  const [order, setOrder] = useState<ProjectCardData[]>(PROJECT_CARDS)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <section id="work" className="work py-24 px-[var(--edge,1.5rem)]">
      <div className="section-head mb-16">
        <p className="eyebrow eyebrow-dark font-mono text-[0.6875rem] uppercase tracking-wide text-ember mb-5">Work</p>
        <h2 className="section-title font-display font-extrabold text-[clamp(2.5rem,7vw,5rem)] tracking-[-0.035em] text-slate">What I shipped</h2>
      </div>

      <article className="feature grid md:grid-cols-2 gap-10 mb-16">
        <div>
          <p className="stamp font-mono text-[0.6875rem] uppercase text-slate-2 mb-2">{ELECTRA.stamp}</p>
          <h3 className="font-display font-extrabold text-3xl text-slate mb-3">{ELECTRA.title}</h3>
          <p className="text-slate-2 mb-3">{ELECTRA.lede}</p>
          <p className="note text-mute text-sm">{ELECTRA.note}</p>
        </div>
        <dl className="spec grid gap-6">
          {ELECTRA.rows.map((row) => (
            <div key={row.label} className="spec-row">
              <dt className="font-mono text-xs uppercase text-ember mb-1">{row.label}</dt>
              <dd className="text-slate-2">{row.body}</dd>
            </div>
          ))}
        </dl>
      </article>

      <Reorder.Group
        as="div"
        axis="y"
        values={order}
        onReorder={setOrder}
        className="cards grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {order.map((p) => (
          <Reorder.Item
            key={p.id}
            value={p}
            as="div"
            dragListener={!reduced}
            layout={!reduced}
            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
          >
            <motion.div
              layout={!reduced}
              drag={reduced ? false : "y"}
              dragConstraints={{ top: 0, bottom: 60 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 40) setExpandedId(p.id)
              }}
              className={expandedId === p.id ? "scale-[1.03]" : undefined}
            >
              <ProjectCard title={p.title} stamp={p.stamp} desc={p.desc} tags={p.tags} link={p.link} />
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <div className="oss mt-20">
        <h3 className="oss-head font-display font-extrabold text-2xl text-slate mb-8">On my own time</h3>
        <ul className="oss-list grid gap-6">
          {OSS_ITEMS.map((item) => (
            <li key={item.id} className="oss-item flex justify-between gap-6 border-b border-slate/10 pb-6">
              <div>
                <h4 className="font-display font-bold text-xl text-slate">{item.title}</h4>
                <p className="text-slate-2 mt-1">{item.desc}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="font-mono text-[0.6875rem] uppercase px-2 py-1 rounded-sm bg-paper-2 text-ember">
                  {item.status === "published" ? "Published" : item.status === "in-progress" ? "In progress" : "Private"}
                </span>
                {item.link && (
                  <a href={item.link.href} className="font-mono text-[0.6875rem] uppercase text-ember">
                    {item.link.label} <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/sections/Work.test.tsx`
Expected: PASS, 2 tests

- [ ] **Step 5: Verify drag interactions in a real browser**

Run: `npm run dev`. In the Work section, confirm (a) dragging a card up/down in the grid reorders it and the rest resettle smoothly, and (b) dragging a card downward past the threshold triggers the expand state change. Per the old repo's documented headless-testing trap, **do not** try to verify drag with a headless screenshot — it needs a real pointer.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/Work.tsx src/components/sections/Work.test.tsx
git commit -m "SAFE: Work section with drag-to-reorder and drag-to-expand cards"
```

---

## Task 13: Tally section

**Files:**
- Create: `src/components/sections/Tally.tsx`, `src/components/sections/Tally.test.tsx`
- Create: `src/hooks/useLiveRepoCount.ts`, `src/hooks/useLiveRepoCount.test.ts`

**Interfaces:**
- Produces: `useLiveRepoCount(fallback: number): number` — fetches `public_repos` from the GitHub API, races a 1200ms timeout, falls back on failure. Consumed by `Tally.tsx`.
- Produces: `<Tally />` — consumed by `App.tsx` in Task 16.

- [ ] **Step 1: Write the failing test — `src/hooks/useLiveRepoCount.test.ts`**

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLiveRepoCount } from './useLiveRepoCount'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useLiveRepoCount', () => {
  it('returns the fallback immediately, then the live count once fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ public_repos: 18 }),
    }))

    const { result } = renderHook(() => useLiveRepoCount(15))
    expect(result.current).toBe(15)
    await waitFor(() => expect(result.current).toBe(18))
  })

  it('keeps the fallback if the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const { result } = renderHook(() => useLiveRepoCount(15))
    await new Promise((r) => setTimeout(r, 10))
    expect(result.current).toBe(15)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useLiveRepoCount.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/hooks/useLiveRepoCount.ts`**, porting the race-against-timeout behavior from `assets/src/script.js:716-740`:

```ts
import { useEffect, useState } from "react"

export function useLiveRepoCount(fallback: number): number {
  const [count, setCount] = useState(fallback)

  useEffect(() => {
    let cancelled = false
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 1200))

    Promise.race([
      fetch("https://api.github.com/users/The007Programmer").then((r) => {
        if (!r.ok) throw new Error(`GitHub API ${r.status}`)
        return r.json()
      }),
      timeout,
    ])
      .then((data: { public_repos?: number }) => {
        if (!cancelled && typeof data.public_repos === "number") setCount(data.public_repos)
      })
      .catch(() => {
        /* keep the fallback — this is expected on a slow network, not an error to surface */
      })

    return () => { cancelled = true }
  }, [])

  return count
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useLiveRepoCount.test.ts`
Expected: PASS, 2 tests

- [ ] **Step 5: Write the failing test — `src/components/sections/Tally.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tally } from './Tally'

vi.mock('@/hooks/useLiveRepoCount', () => ({ useLiveRepoCount: (fallback: number) => fallback }))

describe('Tally', () => {
  it('renders all three stats with their labels', () => {
    render(<Tally />)
    expect(screen.getByText('public repositories')).toBeInTheDocument()
    expect(screen.getByText('writeups, my byline')).toBeInTheDocument()
    expect(screen.getByText(/GPA at Texas A&M/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/Tally.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 7: Implement `src/components/sections/Tally.tsx`**, porting `index.html:353-376`, with Motion driving the count-up on scroll-into-view instead of the old `[data-count]` + IntersectionObserver combo:

```tsx
import { useRef } from "react"
import { motion, useInView, useMotionValue, useTransform, animate } from "motion/react"
import { useEffect } from "react"
import { useLiveRepoCount } from "@/hooks/useLiveRepoCount"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

function CountUp({ to, decimals = 0, inView, reduced }: { to: number; decimals?: number; inView: boolean; reduced: boolean }) {
  const value = useMotionValue(reduced ? to : 0)
  const rounded = useTransform(value, (v) => v.toFixed(decimals))

  useEffect(() => {
    if (reduced || !inView) return
    const controls = animate(value, to, { duration: 1.1, ease: "easeOut" })
    return () => controls.stop()
  }, [inView, to, reduced, value])

  return <motion.span>{rounded}</motion.span>
}

export function Tally() {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const reduced = useReducedMotionGate()
  const repos = useLiveRepoCount(15)

  return (
    <section className="tally py-20 px-[var(--edge,1.5rem)] bg-paper-2" aria-label="By the numbers">
      <div ref={ref} className="tally-inner grid gap-10 sm:grid-cols-3 max-w-[1000px] mx-auto text-center">
        <div className="tally-item">
          <p className="tally-num font-display font-extrabold text-5xl text-signal tabular-nums">
            <CountUp to={repos} inView={inView} reduced={reduced} />
          </p>
          <p className="tally-label font-mono text-xs uppercase mt-2">public repositories</p>
          <p className="tally-note text-mute text-sm mt-2">My own, not my employer&rsquo;s. clair installs from a Homebrew tap, UFW Manager from my Ubuntu PPA.</p>
        </div>
        <div className="tally-item">
          <p className="tally-num font-display font-extrabold text-5xl text-signal tabular-nums">
            <CountUp to={2} inView={inView} reduced={reduced} />
          </p>
          <p className="tally-label font-mono text-xs uppercase mt-2">writeups, my byline</p>
          <p className="tally-note text-mute text-sm mt-2">SAGE and Recurser, on the TwelveLabs engineering blog.</p>
        </div>
        <div className="tally-item">
          <p className="tally-num font-display font-extrabold text-5xl text-signal tabular-nums">
            <CountUp to={4.0} decimals={1} inView={inView} reduced={reduced} />
          </p>
          <p className="tally-label font-mono text-xs uppercase mt-2">GPA at Texas A&amp;M</p>
          <p className="tally-note text-mute text-sm mt-2">Sophomore, College Station.</p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run src/components/sections/Tally.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/sections/Tally.tsx src/components/sections/Tally.test.tsx src/hooks/useLiveRepoCount.ts src/hooks/useLiveRepoCount.test.ts
git commit -m "SAFE: Tally section, live repo count, Motion count-up"
```

---

## Task 14: Path ledger and Toolkit sections

**Files:**
- Create: `src/components/sections/Path.tsx`, `src/components/sections/Path.test.tsx`
- Create: `src/components/sections/Toolkit.tsx`, `src/components/sections/Toolkit.test.tsx`

**Interfaces:**
- Consumes: `LEDGER_ROWS` from Task 6, `TOOLKIT_GROUPS` from Task 6.
- Produces: `<Path />`, `<Toolkit />` — consumed by `App.tsx` in Task 16.

- [ ] **Step 1: Write the failing test — `src/components/sections/Path.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Path } from './Path'
import { LEDGER_ROWS } from '@/data/path'

describe('Path', () => {
  it('renders every ledger row title and org', () => {
    render(<Path />)
    for (const row of LEDGER_ROWS) {
      expect(screen.getByText(row.title)).toBeInTheDocument()
      expect(screen.getByText(row.org)).toBeInTheDocument()
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/Path.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/components/sections/Path.tsx`**, porting `index.html:379-465`, with each row "ruled in" via a Motion `scaleX` reveal on its border, replacing the old CSS reveal:

```tsx
import { useRef } from "react"
import { motion, useInView } from "motion/react"
import { LEDGER_ROWS } from "@/data/path"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

function LedgerRowItem({ row, index }: { row: (typeof LEDGER_ROWS)[number]; index: number }) {
  const ref = useRef<HTMLLIElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reduced = useReducedMotionGate()

  return (
    <li ref={ref} className="ledger-row relative py-6 border-t border-paper/15">
      <motion.span
        aria-hidden="true"
        className="absolute top-0 left-0 h-px bg-coral origin-left"
        initial={reduced ? false : { scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.6, delay: reduced ? 0 : index * 0.06, ease: "easeOut" }}
        style={{ width: "100%" }}
      />
      <p className="ledger-when font-mono text-xs uppercase text-coral mb-1">{row.when}</p>
      <div className="ledger-what">
        <h3 className="font-display font-bold text-xl text-paper">{row.title}</h3>
        <p className="ledger-org text-paper/70 text-sm mt-1">{row.org}</p>
        {row.body && <p className="text-paper/85 mt-2">{row.body}</p>}
      </div>
    </li>
  )
}

export function Path() {
  return (
    <section id="path" className="path bg-slate py-24 px-[var(--edge,1.5rem)]">
      <div className="section-head mb-16">
        <p className="eyebrow font-mono text-[0.6875rem] uppercase tracking-wide text-paper mb-5">Path</p>
        <h2 className="section-title section-title-light font-display font-extrabold text-[clamp(2.5rem,7vw,5rem)] tracking-[-0.035em] text-paper">How it went</h2>
      </div>
      <ol className="ledger max-w-[900px] mx-auto">
        {LEDGER_ROWS.map((row, i) => (
          <LedgerRowItem key={row.id} row={row} index={i} />
        ))}
      </ol>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/sections/Path.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing test — `src/components/sections/Toolkit.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Toolkit } from './Toolkit'
import { TOOLKIT_GROUPS } from '@/data/toolkit'

describe('Toolkit', () => {
  it('renders every group title', () => {
    render(<Toolkit />)
    for (const g of TOOLKIT_GROUPS) {
      expect(screen.getByText(g.title)).toBeInTheDocument()
    }
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/Toolkit.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 7: Implement `src/components/sections/Toolkit.tsx`**, porting `index.html:468-515`, with a hover-driven emphasis (spring scale + border-color shift) replacing plain `:hover` CSS on each group:

```tsx
import { motion } from "motion/react"
import { TOOLKIT_GROUPS } from "@/data/toolkit"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { cn } from "@/lib/utils"

export function Toolkit() {
  const reduced = useReducedMotionGate()

  return (
    <section id="toolkit" className="toolkit py-24 px-[var(--edge,1.5rem)]">
      <div className="section-head mb-16">
        <p className="eyebrow eyebrow-dark font-mono text-[0.6875rem] uppercase tracking-wide text-ember mb-5">Toolkit</p>
        <h2 className="section-title font-display font-extrabold text-[clamp(2.5rem,7vw,5rem)] tracking-[-0.035em] text-slate">What I reach for</h2>
      </div>
      <div className="kit grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLKIT_GROUPS.map((group) => (
          <motion.div
            key={group.id}
            className={cn(
              "kit-group border rounded-sm p-6",
              group.accent ? "border-signal/40 bg-paper-2" : "border-slate/10"
            )}
            whileHover={reduced ? undefined : { y: -3, borderColor: "#D62B22" }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <h3 className="kit-title font-display font-bold text-lg text-slate mb-2">{group.title}</h3>
            <p className="kit-items text-slate-2">{group.items}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run src/components/sections/Toolkit.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/sections/Path.tsx src/components/sections/Path.test.tsx src/components/sections/Toolkit.tsx src/components/sections/Toolkit.test.tsx
git commit -m "SAFE: Path ledger with ruled-in reveal, Toolkit with hover emphasis"
```

---

## Task 15: Contact section, thanks/404 pages

**Files:**
- Create: `src/components/sections/Contact.tsx`, `src/components/sections/Contact.test.tsx`
- Modify: `public/thanks.html`, `public/404.html` (moved from repo root — Vite copies `public/` verbatim into `dist/`)
- Move: `img/` → `public/img/`, `assets/aahil-shaikh-resume.pdf` → `public/assets/aahil-shaikh-resume.pdf`

**Interfaces:**
- Consumes: `ActionButton` from Task 3.
- Produces: `<Contact />` — consumed by `App.tsx` in Task 16.

- [ ] **Step 1: Move static assets into `public/`**, preserving paths the rest of the app already references (`/img/...`, `/assets/...`):

```bash
mkdir -p public
git mv img public/img
mkdir -p public/assets
git mv assets/aahil-shaikh-resume.pdf public/assets/aahil-shaikh-resume.pdf
```

- [ ] **Step 2: Write the failing test — `src/components/sections/Contact.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Contact } from './Contact'

describe('Contact', () => {
  it('renders the pitch copy and all contact links', () => {
    render(<Contact />)
    expect(screen.getByText(/Say something/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'aahils2019@gmail.com' })).toHaveAttribute('href', 'mailto:aahils2019@gmail.com')
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/The007Programmer')
    expect(screen.getByRole('link', { name: 'Résumé (PDF)' })).toHaveAttribute('href', '/assets/aahil-shaikh-resume.pdf')
  })

  it('renders a form posting to formsubmit.co', () => {
    render(<Contact />)
    const form = screen.getByRole('form', { hidden: true }) ?? document.querySelector('form')
    expect(form).toHaveAttribute('action', 'https://formsubmit.co/aahils2019@gmail.com')
    expect(form).toHaveAttribute('method', 'POST')
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/components/sections/Contact.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 4: Implement `src/components/sections/Contact.tsx`**, porting `index.html:518-557` exactly, including every hidden formsubmit.co field:

```tsx
import { ActionButton } from "@/components/kit/ActionButton"

export function Contact() {
  return (
    <section id="contact" className="contact bg-ember text-paper py-24 px-[var(--edge,1.5rem)]">
      <div className="contact-grid grid md:grid-cols-2 gap-16 max-w-[1100px] mx-auto">
        <div className="contact-pitch">
          <p className="eyebrow font-mono text-[0.6875rem] uppercase tracking-wide mb-5">Contact</p>
          <h2 className="contact-title font-display font-extrabold text-5xl mb-6">Say something<br />interesting.</h2>
          <p className="contact-copy max-w-[42ch] mb-8">
            Agents, graph memory, video models, or a problem that doesn&rsquo;t have a name yet — I read everything that comes through here.
          </p>
          <ul className="contact-links flex flex-col gap-3 font-mono text-sm">
            <li><a href="mailto:aahils2019@gmail.com">aahils2019@gmail.com</a></li>
            <li><a href="https://github.com/The007Programmer">GitHub</a></li>
            <li><a href="https://www.linkedin.com/in/aahil-shaikh-04b9ba356/">LinkedIn</a></li>
            <li><a href="/assets/aahil-shaikh-resume.pdf">Résumé (PDF)</a></li>
          </ul>
        </div>

        <form className="form flex flex-col gap-5" action="https://formsubmit.co/aahils2019@gmail.com" method="POST">
          <div className="field flex flex-col gap-1">
            <label htmlFor="name">Name</label>
            <input id="name" type="text" name="name" required autoComplete="name" className="bg-paper text-slate rounded-sm px-3 py-2" />
          </div>
          <div className="field flex flex-col gap-1">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" required autoComplete="email" className="bg-paper text-slate rounded-sm px-3 py-2" />
          </div>
          <div className="field flex flex-col gap-1">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={5} required className="bg-paper text-slate rounded-sm px-3 py-2" />
          </div>
          <input type="text" name="_honey" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
          <input type="hidden" name="_captcha" value="true" />
          <input type="hidden" name="_subject" value="New Contact Form Submission" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_next" value="https://the007programmer.github.io/thanks.html" />
          <input type="hidden" name="_autoresponse" value="Thanks for your message. I'll get back to you soon. — Aahil" />
          <ActionButton type="submit">Send message</ActionButton>
        </form>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/sections/Contact.test.tsx`
Expected: PASS

- [ ] **Step 6: Move `thanks.html` and `404.html` into `public/`, unchanged in content**

```bash
git mv thanks.html public/thanks.html
git mv 404.html public/404.html
```

Update the icon/stylesheet paths inside both files to match their new location if they were relative — they already use root-absolute paths (`/img/favicon.png`, `/assets/src/page.css`), so only `page.css`'s own path needs adjusting: move it too.

```bash
mkdir -p public/assets/src
git mv assets/src/page.css public/assets/src/page.css
```

- [ ] **Step 7: Commit**

```bash
git add public src/components/sections/Contact.tsx src/components/sections/Contact.test.tsx
git commit -m "SAFE: Contact section, move static assets and standalone pages into public/"
```

---

## Task 16: Assemble the app, lock in the font pairing, remove old vanilla files

**Files:**
- Modify: `src/App.tsx` (full rewrite — composes every section)
- Delete: `assets/src/main.css`, `assets/src/script.js`, `assets/src/field.js`, `tests/field.html`, `tests/field-stack.html` (superseded by `src/lib/agentField.test.ts`)
- Modify: `src/index.css` (lock in the chosen font pairing)
- Modify: `src/hooks/useFontPairing.ts` and its usage (removed once locked in)

**Interfaces:**
- Consumes: every component and hook produced by Tasks 1–15.

- [ ] **Step 1: Assemble `src/App.tsx`**

```tsx
import { Topbar } from "@/components/layout/Topbar"
import { Footer } from "@/components/layout/Footer"
import AgentField from "@/components/effects/AgentField"
import CursorEffect from "@/components/effects/CursorEffect"
import { Hero } from "@/components/sections/Hero"
import { Timeline } from "@/components/sections/Timeline"
import { Work } from "@/components/sections/Work"
import { Tally } from "@/components/sections/Tally"
import { Path } from "@/components/sections/Path"
import { Toolkit } from "@/components/sections/Toolkit"
import { Contact } from "@/components/sections/Contact"
import { useFontPairing } from "@/hooks/useFontPairing"

const SECTIONS = [
  { id: "work", label: "Work" },
  { id: "path", label: "Path" },
  { id: "toolkit", label: "Toolkit" },
  { id: "contact", label: "Contact" },
]

export default function App() {
  useFontPairing()

  return (
    <>
      <AgentField />
      <CursorEffect />
      <Topbar sections={SECTIONS} />
      <main id="main" className="relative z-[2]">
        <Hero />
        <Timeline />
        <Work />
        <Tally />
        <Path />
        <Toolkit />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Run the full test suite**

Run: `npm run test`
Expected: every test file from Tasks 1–15 passes.

- [ ] **Step 3: Full-page smoke check in the dev server**

Run: `npm run dev`. Confirm, in order top to bottom: hero renders with entrance animation, agent field dots are visible and drifting, cursor glow follows the pointer, timeline draws in on scroll with hoverable edge tooltips, work section renders Electra + all 6 cards + all 5 OSS items and both drag interactions work, tally counts up, path ledger rules in row by row, toolkit hovers respond, contact form fields and résumé link work. No console errors.

- [ ] **Step 4: Compare all 4 font pairings and lock one in**

Visit `/?font=tempting`, `/?font=athelas`, `/?font=inter`, `/?font=archivo` in the real assembled layout (not the earlier isolated check from Task 5 — this is the first time they're visible against real content). Once a winner is picked, hardcode it:

- In `src/index.css`, delete the `[data-font="..."]` blocks for the other 3 pairings and fold the winning pairing's values directly into the base `@theme` block's `--font-display`/`--font-body`.
- Delete `src/hooks/useFontPairing.ts`, `src/hooks/useFontPairing.test.ts`, and the `useFontPairing()` call + import in `App.tsx`.
- In `index.html`, delete the `<link>` tags for the 3 unused pairings, keeping only the winner's.
- In `public/thanks.html` and `public/404.html`, update the Google Fonts `<link>` to match the winning pairing (they currently still load Bricolage Grotesque/Instrument Sans/Martian Mono from the old site — update both the font names in the link and the `page.css` `--display`/`--body` variables to the winner).

- [ ] **Step 5: Run the full test suite again after removing the font switcher**

Run: `npm run test`
Expected: all remaining tests pass (the 3 deleted `useFontPairing` tests are gone, nothing else references them).

- [ ] **Step 6: Delete the superseded vanilla files**

```bash
git rm assets/src/main.css assets/src/script.js assets/src/field.js
git rm tests/field.html tests/field-stack.html
rmdir assets/src assets tests 2>/dev/null || true
```

(If `assets/src`/`assets`/`tests` aren't fully empty because something from Task 15 still lives there, leave them — only remove what's actually empty.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
SAFE: assemble the full app, lock in the <winning> font pairing

Removes the superseded vanilla HTML/CSS/JS files now that every
section, the agent field, and the timeline are ported to React.
EOF
)"
```

(Replace `<winning>` in the commit message with whichever pairing Step 4 actually chose.)

---

## Task 17: Deploy — GitHub Actions workflow and the Pages source switch

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md` (update "how it's built" — no longer zero-build)

**Interfaces:**
- None — this task is infrastructure, not application code.

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Update `README.md`'s "How it's built" section**, replacing the zero-build description with the new stack and file map (Vite/React/Tailwind/Motion/KokonutUI/Bklit UI, `npm run dev` instead of `python3 -m http.server`, `src/` layout instead of `assets/src/`) — do not leave the old "no framework and no build step" claim in place, it would now be false.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "SAFE: GitHub Actions deploy workflow, README reflects the new stack"
```

- [ ] **Step 4: Flag the live Pages settings change before making it**

Tell the user explicitly: *"Ready to flip the GitHub Pages source from 'deploy from branch' to 'deploy via GitHub Actions.' This changes how the live site publishes — confirm before I run it."* Wait for confirmation — this is exactly the kind of hard-to-reverse, production-affecting change that needs a check-in even though the spec says Claude handles it.

- [ ] **Step 5: Flip the Pages source via the GitHub API**, once confirmed:

```bash
gh api -X PUT repos/The007Programmer/the007programmer.github.io/pages -f build_type=workflow
```

If that 404s because Pages was never configured via the API before, use POST instead:

```bash
gh api -X POST repos/The007Programmer/the007programmer.github.io/pages -f build_type=workflow
```

- [ ] **Step 6: Push and verify the live deploy**

```bash
git push origin agent-field
```

(Or `main`, depending on which branch this work landed on and the user's merge preference — confirm before pushing to `main` specifically, per standard practice for a branch that isn't yet the default.)

Run: `gh run list --workflow=deploy.yml --limit 1` to confirm the workflow ran, then visit `https://the007programmer.github.io` in a real browser (not headless — this is the final check, not a probe) and confirm the rebuilt site loads correctly.

---

## Self-Review Notes

**Spec coverage:** stack/deploy (Tasks 1, 17), design system/contrast (Task 1), typography switcher (Task 5, locked in Task 16), KokonutUI components (Task 3), Bklit UI charts (Task 4, 11), agent field ported (Task 7), cursor effects site-wide (Task 8), Motion reveals/layout transitions/drag/hover (Tasks 9–14), content carried forward unchanged (Task 6 is a verbatim port), privacy rules (no content changed, so they hold by construction — verified by Task 6's data matching the current `index.html` exactly). All spec sections have a task.

**Placeholder scan:** no TBD/TODO left in any task; the two places that defer to "check the vendor's site at implementation time" (KokonutUI/Bklit UI exact component slugs, Tasks 3–4) are flagged as inherent to using a shadcn-registry CLI, not unfinished design — every task's own deliverable code is complete.

**Type consistency:** `ProjectCardData` (data shape, Task 6) vs. `ProjectCard` (component, Task 3) are deliberately distinct names to avoid a collision when Task 12 imports both — verified no other task reuses `ProjectCard` for the data shape. `useReducedMotionGate()` is the single hook name used everywhere reduced-motion is checked (Tasks 2, 7, 8, 10, 11, 12, 13, 14) — no task reimplements it locally.
