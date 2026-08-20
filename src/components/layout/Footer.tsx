import { Stagger, StaggerItem } from "@/components/kit/Reveal"

export function Footer() {
  return (
    <footer className="foot px-[var(--edge,1.5rem)] py-10 text-center">
      <Stagger gap={0.08}>
        <StaggerItem as="p" y={12} className="foot-name font-display font-extrabold text-slate">
          Aahil Shaikh
        </StaggerItem>
        <StaggerItem as="p" y={12} className="foot-meta font-mono text-[0.6875rem] uppercase text-mute mt-2">
          Built with React, Motion &amp; Tailwind. © 2026
        </StaggerItem>
      </Stagger>
    </footer>
  )
}
