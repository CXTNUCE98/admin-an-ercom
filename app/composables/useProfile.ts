import { useMutation } from '@tanstack/vue-query'

/** Cập nhật hồ sơ + đổi mật khẩu admin (PATCH /users/profile, /users/password). */
export const useProfileMutations = () => {
  const { token, fetchMe } = useAuth()
  const toast = useToast()

  const authHeaders = computed(() => ({
    Authorization: `Bearer ${token.value}`
  }))

  const updateProfile = useMutation({
    mutationFn: (body: { fullName?: string, phone?: string, address?: string }) =>
      $anErcom('/users/profile', {
        method: 'PATCH',
        body,
        headers: authHeaders.value
      }),
    onSuccess: async () => {
      await fetchMe()
      toast.add({ title: 'Đã cập nhật hồ sơ', color: 'success', icon: 'i-lucide-circle-check' })
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

  const changePassword = useMutation({
    mutationFn: (body: { oldPassword: string, newPassword: string }) =>
      $anErcom('/users/password', {
        method: 'PATCH',
        body,
        headers: authHeaders.value
      }),
    onSuccess: () => {
      toast.add({ title: 'Đã đổi mật khẩu', color: 'success', icon: 'i-lucide-circle-check' })
    },
    onError: (err: any) => {
      toast.add({
        title: 'Đổi mật khẩu thất bại',
        description: err?.data?.message || 'Có lỗi xảy ra',
        color: 'error',
        icon: 'i-lucide-circle-x'
      })
    }
  })

  return { updateProfile, changePassword }
}
