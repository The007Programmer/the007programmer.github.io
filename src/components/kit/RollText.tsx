import { cn } from "@/lib/utils"

export interface RollTextProps {
  children: string
  className?: string
}

/**
 * Odometer hover. The label slides up and out, an identical copy rolls in from
 * below, letter by letter. Pure CSS: hover or focus on the nearest `.group`
 * ancestor (the parent link) drives it, so it costs no JS and honours reduced
 * motion through the media query.
 */
export function RollText({ children, className }: RollTextProps) {
  const chars = Array.from(children)
  const letter = (ch: string, i: number, second: boolean) => (
    <span
      key={i}
      className={cn(
        "inline-block whitespace-pre transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        second
          ? "translate-y-[110%] group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:translate-y-[110%]"
          : "group-hover:-translate-y-[110%] group-focus-visible:-translate-y-[110%] motion-reduce:transform-none"
      )}
      style={{ transitionDelay: `${i * 18}ms` }}
    >
      {ch}
    </span>
  )
  return (
    <span className={cn("relative inline-flex overflow-hidden align-bottom", className)}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">{chars.map((c, i) => letter(c, i, false))}</span>
      <span aria-hidden="true" className="absolute inset-0 text-signal">
        {chars.map((c, i) => letter(c, i, true))}
      </span>
    </span>
  )
}
