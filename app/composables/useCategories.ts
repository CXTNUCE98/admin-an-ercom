import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { ProductCategory } from '~/types'

export const useCategories = () => {
  const categoriesQuery = useQuery({
    queryKey: ['product-categories'],
    queryFn: async (): Promise<ProductCategory[]> => {
      const data = await $anErcom('/product-categories')
      return data as unknown as ProductCategory[]
    },
    staleTime: 1000 * 60 * 10
  })

  const categoryOptions = computed(() => [
    { label: 'Không có danh mục', value: null },
    ...(categoriesQuery.data.value ?? []).map(c => ({
      label: c.name,
      value: c.id
    }))
  ])

  const filterOptions = computed(() => [
    { label: 'Tất cả danh mục', value: 'all' },
    ...(categoriesQuery.data.value ?? []).map(c => ({
      label: c.name,
      value: c.id
    }))
  ])

  return { categoriesQuery, categoryOptions, filterOptions }
}

export const useCategoryMutations = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()

  const authHeaders = computed(() => ({
    Authorization: `Bearer ${token.value}`
  }))

  const createCategory = useMutation({
    mutationFn: (body: { name: string, slug: string, description?: string }) =>
      $anErcom('/product-categories', {
        method: 'POST',
        body,
        headers: authHeaders.value
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] })
      toast.add({ title: 'Tạo danh mục thành công', color: 'success', icon: 'i-lucide-circle-check' })
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

  const updateCategory = useMutation({
    mutationFn: ({ id, body }: { id: string, body: { name?: string, slug?: string, description?: string } }) =>
      $anErcom('/product-categories/{id}', {
        method: 'PATCH',
        path: { id },
        body,
        headers: authHeaders.value
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] })
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

  const deleteCategory = useMutation({
    mutationFn: (id: string) =>
      $anErcom('/product-categories/{id}', {
        method: 'DELETE',
        path: { id },
        headers: authHeaders.value
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] })
      toast.add({ title: 'Đã xoá danh mục', color: 'success', icon: 'i-lucide-circle-check' })
    },
    onError: () => {
      toast.add({ title: 'Xoá thất bại', color: 'error', icon: 'i-lucide-circle-x' })
    }
  })

  return { createCategory, updateCategory, deleteCategory }
}
