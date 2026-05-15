import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  })

function mapChartPeriod(period: string): string {
  switch (period) {
    case 'today':
      return 'today'
    case 'weekly':
      return 'week'
    case 'monthly':
      return 'month'
    default:
      return period
  }
}

function getWibTodayString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

export function useAdminStats(period: string = 'monthly') {
  const apiPeriod = mapChartPeriod(period)
  const { data, error, isLoading, mutate } = useSWR(
    `/api/dashboard/stats?period=${apiPeriod}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  return {
    stats: data,
    chartData: data?.chartData ?? [],
    isLoading,
    isError: error,
    mutate,
  }
}

export function useTodayStats() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/dashboard/stats?period=today',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    }
  )

  return {
    todayOrders: data?.today?.totalOrders ?? 0,
    todayRevenue: data?.today?.revenue ?? 0,
    todayProductsSold: data?.today?.productsSold ?? 0,
    isLoading,
    isError: error,
    mutate,
  }
}

/** Completed orders for today (WIB) — matches Reports "Hari Ini" */
export function useRecentOrders() {
  const today = getWibTodayString()
  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/orders?period=daily&date=${today}&status=COMPLETED&limit=5`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  return {
    orders: data?.orders || [],
    isLoading,
    isError: error,
    mutate,
  }
}

export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR('/api/products', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  return {
    products: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}
