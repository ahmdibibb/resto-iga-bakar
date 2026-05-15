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
    color: 'hsl(24 95% 53%)',
  },
  orders: {
    label: 'Order',
    color: 'hsl(221 83% 53%)',
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
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center text-sm text-gray-500">
            Belum ada data penjualan pada periode ini
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`py-0 ${className ?? ''}`}>
      <CardHeader className="flex flex-col items-stretch border-b border-gray-100 p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 sm:py-5">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex">
          {(['revenue', 'orders'] as const).map((key) => (
            <button
              key={key}
              type="button"
              data-active={activeChart === key}
              className="relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors even:border-l data-[active=true]:bg-orange-50 sm:border-t-0 sm:border-l sm:px-8 sm:py-5"
              onClick={() => setActiveChart(key)}
            >
              <span className="text-xs text-gray-500">{chartConfig[key].label}</span>
              <span className="text-lg font-bold leading-none sm:text-2xl">
                {key === 'revenue'
                  ? `Rp ${total.revenue.toLocaleString('id-ID')}`
                  : total.orders.toLocaleString('id-ID')}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 8, right: 8 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={formatXLabel}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[180px]"
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
              fill={activeChart === 'revenue' ? '#F97316' : '#3B82F6'}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
