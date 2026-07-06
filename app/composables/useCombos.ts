import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

export interface ComboItemInput {
  productId: string
  quantity: number
}

export interface ComboItem {
  id: string
  quantity: number
  product: { id: string, slug: string, name: string, brand: string, price: number, salePrice: number | null, images: string[] }
}

export interface Combo {
  id: string
  slug: string
  name: string
  description: string | null
  image: string | null
  comboPrice: number
  originalPrice: number
  savings: number
  isActive: boolean
  items: ComboItem[]
  createdAt: string
}

export interface ComboInput {
  name: string
  slug: string
  description?: string
  image?: string
  comboPrice: number
  isActive?: boolean
  items: ComboItemInput[]
}

export const useCombos = () => {
  const { token } = useAuth()
  const authHeaders = computed(() => ({ Authorization: `Bearer ${token.value}` }))

  const combosQuery = useQuery({
    queryKey: ['combos'],
    queryFn: async (): Promise<Combo[]> => {
      const data = await $anErcom('/combos/all', { headers: authHeaders.value })
      return data as unknown as Combo[]
    },
    enabled: computed(() => !!token.value)
  })

  return { combosQuery }
}

export const useComboMutations = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const authHeaders = computed(() => ({ Authorization: `Bearer ${token.value}` }))
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['combos'] })

  const createCombo = useMutation({
    mutationFn: (body: ComboInput) =>
      $anErcom('/combos', { method: 'POST', body, headers: authHeaders.value }),
    onSuccess: () => {
      invalidate()
      toast.add({ title: 'Đã tạo combo', color: 'success', icon: 'i-lucide-circle-check' })
    },
    onError: (err: any) => {
      toast.add({ title: 'Tạo thất bại', description: err?.data?.message || 'Có lỗi', color: 'error', icon: 'i-lucide-circle-x' })
    }
  })

  const updateCombo = useMutation({
    mutationFn: ({ id, body }: { id: string, body: Partial<ComboInput> }) =>
      $anErcom('/combos/{id}', { method: 'PATCH', path: { id }, body, headers: authHeaders.value }),
    onSuccess: () => {
      invalidate()
      toast.add({ title: 'Đã cập nhật', color: 'success', icon: 'i-lucide-circle-check' })
    },
    onError: (err: any) => {
      toast.add({ title: 'Cập nhật thất bại', description: err?.data?.message || 'Có lỗi', color: 'error', icon: 'i-lucide-circle-x' })
    }
  })

  const deleteCombo = useMutation({
    mutationFn: (id: string) =>
      $anErcom('/combos/{id}', { method: 'DELETE', path: { id }, headers: authHeaders.value }),
    onSuccess: () => {
      invalidate()
      toast.add({ title: 'Đã xoá combo', color: 'success', icon: 'i-lucide-circle-check' })
    },
    onError: () => {
      toast.add({ title: 'Xoá thất bại', color: 'error', icon: 'i-lucide-circle-x' })
    }
  })

  return { createCombo, updateCombo, deleteCombo }
}
