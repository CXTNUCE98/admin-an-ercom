import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { Product, ProductsResponse, ProductStatus } from '~/types'

interface ProductQuery {
  search?: string
  categoryId?: string
  status?: ProductStatus | 'all'
  page?: number
  pageSize?: number
  sort?: string
}

export const useProducts = (query?: Ref<ProductQuery>) => {
  const { token } = useAuth()

  const productsQuery = useQuery({
    queryKey: ['products', query],
    queryFn: async (): Promise<ProductsResponse> => {
      const q = query?.value ?? {}
      const data = await $anErcom('/products', {
        query: {
          search: q.search || undefined,
          status: (q.status && q.status !== 'all') ? q.status : undefined,
          categoryId: q.categoryId || undefined,
          page: q.page ?? 1,
          pageSize: q.pageSize ?? 20,
          sort: q.sort || undefined
        }
      })
      return data as unknown as ProductsResponse
    },
    enabled: computed(() => !!token.value)
  })

  return { productsQuery }
}

export const useProductMutations = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()

  const authHeaders = computed(() => ({
    Authorization: `Bearer ${token.value}`
  }))

  const createProduct = useMutation({
    mutationFn: (body: Omit<Product, 'id' | 'rating' | 'reviewCount' | 'images' | 'specs' | 'createdAt' | 'updatedAt'>) =>
      $anErcom('/products', {
        method: 'POST',
        body,
        headers: authHeaders.value
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.add({ title: 'Tạo sản phẩm thành công', color: 'success', icon: 'i-lucide-circle-check' })
    },
    onError: (err: any) => {
      toast.add({
        title: 'Tạo thất bại',
        description: err?.data?.message || 'Có lỗi xảy ra',
        color: 'error',
        icon: 'i-lucide-circle-x'
      })
    }
  })

  const updateProduct = useMutation({
    mutationFn: ({ id, body }: { id: string, body: Partial<Product> }) =>
      $anErcom('/products/{id}', {
        method: 'PATCH',
        path: { id },
        body,
        headers: authHeaders.value
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.add({ title: 'Cập nhật thành công', color: 'success', icon: 'i-lucide-circle-check' })
    },
    onError: (err: any) => {
      toast.add({
        title: 'Cập nhật thất bại',
        description: err?.data?.message || 'Có lỗi xảy ra',
        color: 'error',
        icon: 'i-lucide-circle-x'
      })
    }
  })

  const deleteProduct = useMutation({
    mutationFn: (id: string) =>
      $anErcom('/products/{id}', {
        method: 'DELETE',
        path: { id },
        headers: authHeaders.value
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.add({ title: 'Đã xoá sản phẩm', color: 'success', icon: 'i-lucide-circle-check' })
    },
    onError: () => {
      toast.add({ title: 'Xoá thất bại', color: 'error', icon: 'i-lucide-circle-x' })
    }
  })

  return { createProduct, updateProduct, deleteProduct }
}
