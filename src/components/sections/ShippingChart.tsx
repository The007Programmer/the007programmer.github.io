import { useMemo } from "react"
import { curveMonotoneX } from "@visx/curve"
import LineChart from "@/components/charts/line-chart"
import { Line } from "@/components/charts/line"
import { Grid } from "@/components/charts/grid"
import { XAxis } from "@/components/charts/x-axis"
import { ChartTooltip, TooltipContent } from "@/components/charts/tooltip"
import { TIMELINE_NODES } from "@/data/timeline"

/**
 * Cumulative things shipped, by month.
 *
 * Built from TIMELINE_NODES rather than from a second hand-kept list — the
 * trajectory figure and this chart are two views of one set of facts, and a
 * second copy is a second thing to forget to update. Anything that is not a
 * role counts: the roles are the jobs, everything else is what came out of one.
 */

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export interface ShippedPoint extends Record<string, unknown> {
  date: Date
  shipped: number
  label: string
}

/** One row per month across the whole range, so a quiet month reads as flat
    rather than vanishing and stretching the months either side of it. */
export function shippedByMonth(): ShippedPoint[] {
  const made = TIMELINE_NODES.filter((n) => n.kind !== "role")
  const months = TIMELINE_NODES.map((n) => {
    const [y, m] = n.date.split("-").map(Number)
    return y * 12 + (m - 1)
  })
  const first = Math.min(...months)
  const last = Math.max(...months)

  const perMonth = new Map<number, number>()
  for (const n of made) {
    const [y, m] = n.date.split("-").map(Number)
    const key = y * 12 + (m - 1)
    perMonth.set(key, (perMonth.get(key) ?? 0) + 1)
  }

  let running = 0
  const out: ShippedPoint[] = []
  for (let k = first; k <= last; k++) {
    running += perMonth.get(k) ?? 0
    const year = Math.floor(k / 12)
    const month = k % 12
    out.push({
      date: new Date(year, month, 1),
      shipped: running,
      label: `${MONTH_NAMES[month]} ${year}`,
    })
  }
  return out
}

export function ShippingChart() {
  const data = useMemo(() => shippedByMonth(), [])

  return (
    <div
      className="shipping-chart w-full"
      role="img"
      aria-label={`Cumulative count of projects shipped by month, from ${data[0].label} to ${
        data[data.length - 1].label
      }, rising from ${data[0].shipped} to ${data[data.length - 1].shipped}.`}
    >
      <LineChart
        data={data}
        xDataKey="date"
        aspectRatio="3 / 1"
        // The default margin clipped the first and last point markers in half
        // against the plot edge.
        margin={{ top: 28, right: 56, bottom: 40, left: 48 }}
      >
        <Grid numTicksRows={4} />
        <XAxis />
        <Line
          dataKey="shipped"
          stroke="var(--chart-line-primary)"
          strokeWidth={2.5}
          showMarkers
          // Monotone, not the default natural spline. A natural curve overshoots
          // between points, and on a running total that put a visible dip in the
          // line across two months where nothing was shipped — a cumulative
          // series that goes down is not a style choice, it is a false claim.
          curve={curveMonotoneX}
        />
        {/* The chart has no y-axis component in this set, so without a tooltip
            the line has shape but no readable values.

            `content` rather than `rows`: the default title formats the point's
            Date to the day — "Mon, Sep 1" — and these points are months, so the
            day is precision the data does not have. */}
        <ChartTooltip
          content={({ point }) => (
            <TooltipContent
              title={String(point.label)}
              rows={[
                {
                  label: "Shipped to date",
                  value: String(point.shipped),
                  color: "var(--chart-line-primary)",
                },
              ]}
            />
          )}
        />
      </LineChart>
    </div>
  )
}
