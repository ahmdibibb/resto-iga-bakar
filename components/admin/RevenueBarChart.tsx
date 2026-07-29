'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

export interface RevenueChartPoint {
  date: string
  revenue: number
  orders: number
}

const chartConfig = {
  revenue: {
    label: 'Pendapatan',
    color: '#15110F',
  },
  orders: {
    label: 'Order',
    color: '#8A8077',
  },
} satisfies ChartConfig

interface RevenueBarChartProps {
  data: RevenueChartPoint[]
  title?: string
  description?: string
  className?: string
  period?: 'today' | 'week' | 'month'
}

export function RevenueBarChart({
  data,
  title = 'Grafik Pendapatan',
  description = 'Performa penjualan pada periode terpilih',
  className,
  period = 'month',
}: RevenueBarChartProps) {
  const [activeChart, setActiveChart] =
    React.useState<keyof Pick<RevenueChartPoint, 'revenue' | 'orders'>>('revenue')

  const total = React.useMemo(
    () => ({
      revenue: data.reduce((acc, curr) => acc + curr.revenue, 0),
      orders: data.reduce((acc, curr) => acc + curr.orders, 0),
    }),
    [data]
  )

  const formatXLabel = (value: string) => {
    if (period === 'today') {
      return value
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTooltipLabel = (value: string) => {
    if (period === 'today') {
      return `Jam ${value}`
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (data.length === 0) {
    return (
      <Card className={`bg-canvas border border-hairline rounded-none shadow-none ${className ?? ''}`}>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-ink font-jakarta">{title}</CardTitle>
          <CardDescription className="text-xs text-charcoal">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-xs text-charcoal font-semibold uppercase tracking-wider">
            Belum ada data penjualan pada periode ini
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`py-0 bg-canvas border border-hairline rounded-none shadow-none ${className ?? ''}`}>
      <CardHeader className="flex flex-col items-stretch border-b border-hairline p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 sm:py-5">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-ink font-jakarta">{title}</CardTitle>
          <CardDescription className="text-xs text-charcoal">{description}</CardDescription>
        </div>
        <div className="flex border-t border-hairline sm:border-t-0">
          {(['revenue', 'orders'] as const).map((key) => (
            <button
              key={key}
              type="button"
              data-active={activeChart === key}
              className="relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors even:border-l border-hairline data-[active=true]:bg-soft-cloud sm:border-t-0 sm:border-l sm:px-8 sm:py-5 cursor-pointer"
              onClick={() => setActiveChart(key)}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-mute">{chartConfig[key].label}</span>
              <span className="text-sm font-bold leading-none sm:text-lg text-ink mt-1">
                {key === 'revenue'
                  ? `Rp ${total.revenue.toLocaleString('id-ID')}`
                  : total.orders.toLocaleString('id-ID')}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6 bg-canvas">
        <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 8, right: 8 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#D2C9BF" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={formatXLabel}
              tick={{ fill: '#8A8077', fontSize: 10, fontWeight: 600 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[180px] bg-canvas border border-hairline rounded-none shadow-none text-ink text-xs"
                  formatter={(value, name) => {
                    if (name === 'revenue') {
                      return [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']
                    }
                    return [String(value), 'Order']
                  }}
                  labelFormatter={(value) => formatTooltipLabel(String(value))}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill={activeChart === 'revenue' ? '#15110F' : '#8A8077'}
              radius={[0, 0, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
