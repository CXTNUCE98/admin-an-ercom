import { useQuery } from '@tanstack/vue-query'

export interface DashboardOverview {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
}

export interface MonthlySale {
  month: string
  revenue: number
  orders: number
}

export interface TopProduct {
  product?: { id: string, name: string, images: string[], price: number, brand: string }
  totalSold: number
}

export interface RecentOrder {
  id: string
  totalPrice: number
  status: string
  createdAt: string
  user: { id: string, fullName: string, email: string } | null
  items: { product: { name: string } | null }[]
}

/** Gộp toàn bộ dữ liệu dashboard thật từ BE (/dashboard/*). */
export const useDashboardData = () => {
  const { token } = useAuth()
  const authHeaders = computed(() => ({ Authorization: `Bearer ${token.value}` }))
  const enabled = computed(() => !!token.value)

  const overviewQuery = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async (): Promise<DashboardOverview> => {
      const data = await $anErcom('/dashboard/overview', { headers: authHeaders.value })
      return data as unknown as DashboardOverview
    },
    enabled
  })

  const monthlyQuery = useQuery({
    queryKey: ['dashboard', 'monthly-sales'],
    queryFn: async (): Promise<MonthlySale[]> => {
      const data = await $anErcom('/dashboard/monthly-sales', { headers: authHeaders.value })
      return data as unknown as MonthlySale[]
    },
    enabled
  })

  const topProductsQuery = useQuery({
    queryKey: ['dashboard', 'top-products'],
    queryFn: async (): Promise<TopProduct[]> => {
      const data = await $anErcom('/dashboard/top-products', { headers: authHeaders.value })
      return data as unknown as TopProduct[]
    },
    enabled
  })

  const recentOrdersQuery = useQuery({
    queryKey: ['dashboard', 'recent-orders'],
    queryFn: async (): Promise<RecentOrder[]> => {
      const data = await $anErcom('/dashboard/recent-orders', { headers: authHeaders.value })
      return data as unknown as RecentOrder[]
    },
    enabled
  })

  return { overviewQuery, monthlyQuery, topProductsQuery, recentOrdersQuery }
}
