import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

export interface AdminReview {
  id: string
  rating: number
  comment: string | null
  isApproved: boolean
  createdAt: string
  user: { id: string, fullName: string, email: string } | null
  product: { id: string, name: string, slug: string, images: string[] } | null
}

interface ReviewsResponse {
  items: AdminReview[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface ReviewQuery {
  approved?: boolean | 'all'
  page?: number
  pageSize?: number
}

export const useReviews = (query?: Ref<ReviewQuery>) => {
  const { token } = useAuth()
  const authHeaders = computed(() => ({ Authorization: `Bearer ${token.value}` }))

  const reviewsQuery = useQuery({
    queryKey: ['reviews', query],
    queryFn: async (): Promise<ReviewsResponse> => {
      const q = query?.value ?? {}
      const data = await $anErcom('/reviews', {
        query: {
          approved: q.approved !== undefined && q.approved !== 'all' ? q.approved : undefined,
          page: q.page ?? 1,
          pageSize: q.pageSize ?? 20
        },
        headers: authHeaders.value
      })
      return data as unknown as ReviewsResponse
    },
    enabled: computed(() => !!token.value)
  })

  return { reviewsQuery }
}

export const useReviewMutations = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const authHeaders = computed(() => ({ Authorization: `Bearer ${token.value}` }))
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reviews'] })

  const approve = useMutation({
    mutationFn: (id: string) =>
      $anErcom('/reviews/{id}/approve', { method: 'PATCH', path: { id }, headers: authHeaders.value }),
    onSuccess: () => {
      invalidate()
      toast.add({ title: 'Đã duyệt đánh giá', color: 'success', icon: 'i-lucide-circle-check' })
    }
  })

  const reject = useMutation({
    mutationFn: (id: string) =>
      $anErcom('/reviews/{id}/reject', { method: 'PATCH', path: { id }, headers: authHeaders.value }),
    onSuccess: () => {
      invalidate()
      toast.add({ title: 'Đã ẩn đánh giá', color: 'info', icon: 'i-lucide-eye-off' })
    }
  })

  const remove = useMutation({
    mutationFn: (id: string) =>
      $anErcom('/reviews/{id}', { method: 'DELETE', path: { id }, headers: authHeaders.value }),
    onSuccess: () => {
      invalidate()
      toast.add({ title: 'Đã xoá đánh giá', color: 'success', icon: 'i-lucide-circle-check' })
    }
  })

  return { approve, reject, remove }
}
