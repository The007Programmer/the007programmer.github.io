import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LineChart } from '@/components/charts/line-chart'
import { Line } from '@/components/charts/line'
import { Grid } from '@/components/charts/grid'
import { XAxis } from '@/components/charts/x-axis'
import { ChartTooltip } from '@/components/charts/tooltip'

const data = [
  { date: new Date('2024-01-01'), value: 10 },
  { date: new Date('2024-02-01'), value: 20 },
  { date: new Date('2024-03-01'), value: 15 },
]

describe('Bklit UI chart primitives', () => {
  it('renders Grid, Line, XAxis, and ChartTooltip inside a LineChart without throwing', () => {
    const { container } = render(
      <LineChart data={data}>
        <Grid horizontal />
        <Line dataKey="value" />
        <XAxis />
        <ChartTooltip />
      </LineChart>
    )
    expect(container.firstChild).not.toBeNull()
  })
})
