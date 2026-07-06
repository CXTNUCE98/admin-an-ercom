import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

export type CouponType = 'PERCENT' | 'FIXED'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minOrder: number
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  startsAt: string | null
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

export interface CouponInput {
  code: string
  type: CouponType
  value: number
  minOrder?: number
  maxDiscount?: number | null
  usageLimit?: number | null
  startsAt?: string | null
  expiresAt?: string | null
  isActive?: boolean
}

export const useCoupons = () => {
  const { token } = useAuth()
  const authHeaders = computed(() => ({ Authorization: `Bearer ${token.value}` }))

  const couponsQuery = useQuery({
    queryKey: ['coupons'],
    queryFn: async (): Promise<Coupon[]> => {
      const data = await $anErcom('/coupons', { headers: authHeaders.value })
      return data as unknown as Coupon[]
    },
    enabled: computed(() => !!token.value)
  })

  return { couponsQuery }
}

export const useCouponMutations = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const authHeaders = computed(() => ({ Authorization: `Bearer ${token.value}` }))

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['coupons'] })

  const createCoupon = useMutation({
    mutationFn: (body: CouponInput) =>
      $anErcom('/coupons', { method: 'POST', body, headers: authHeaders.value }),
    onSuccess: () => {
      invalidate()
      toast.add({ title: 'Đã tạo mã giảm giá', color: 'success', icon: 'i-lucide-circle-check' })
    },
    onError: (err: any) => {
      toast.add({ title: 'Tạo thất bại', description: err?.data?.message || 'Có lỗi', color: 'error', icon: 'i-lucide-circle-x' })
    }
  })

  const updateCoupon = useMutation({
    mutationFn: ({ id, body }: { id: string, body: Partial<CouponInput> }) =>
      $anErcom('/coupons/{id}', { method: 'PATCH', path: { id }, body, headers: authHeaders.value }),
    onSuccess: () => {
      invalidate()
      toast.add({ title: 'Đã cập nhật', color: 'success', icon: 'i-lucide-circle-check' })
    },
    onError: (err: any) => {
      toast.add({ title: 'Cập nhật thất bại', description: err?.data?.message || 'Có lỗi', color: 'error', icon: 'i-lucide-circle-x' })
    }
  })

  const deleteCoupon = useMutation({
    mutationFn: (id: string) =>
      $anErcom('/coupons/{id}', { method: 'DELETE', path: { id }, headers: authHeaders.value }),
    onSuccess: () => {
      invalidate()
      toast.add({ title: 'Đã xoá mã', color: 'success', icon: 'i-lucide-circle-check' })
    },
    onError: () => {
      toast.add({ title: 'Xoá thất bại', color: 'error', icon: 'i-lucide-circle-x' })
    }
  })

  return { createCoupon, updateCoupon, deleteCoupon }
}
