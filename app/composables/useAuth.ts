import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

const TOKEN_KEY = 'auth_token'

interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
}

export const useAuth = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  const token = useCookie<string | null>(TOKEN_KEY, {
    default: () => null,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax'
  })

  const user = useState<AuthUser | null>('auth_user', () => null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  const queryFn = async (): Promise<AuthUser> => {
    const data = await $anErcom('/auth/me', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    return data as unknown as AuthUser
  }

  // Query: lấy thông tin user hiện tại
  const { refetch: refetchMe, data: authData } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn,
    enabled: isLoggedIn,
    retry: false
  })

  // Sync user state từ query result
  watch(
    authData,
    (data) => {
      if (data) user.value = data
    },
    { immediate: true }
  )

  // Mutation: đăng nhập
  const loginMutation = useMutation({
    mutationFn: (vars: { email: string, password: string }) =>
      $anErcom('/auth/login', {
        method: 'POST',
        body: { email: vars.email, password: vars.password }
      }),
    onSuccess: async (data) => {
      token.value = (data as unknown as { accessToken: string }).accessToken
      await fetchMe()
      toast.add({
        title: 'Đăng nhập thành công',
        description: 'Chào mừng bạn trở lại!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      await navigateTo('/')
    }
  })

  async function login(email: string, password: string) {
    await loginMutation.mutateAsync({ email, password })
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const data = await queryClient.fetchQuery({
        queryKey: ['auth', 'me'],
        queryFn,
        staleTime: 0
      })
      if (data) user.value = data
    } catch (e) {
      console.error(e)
    }
  }

  function logout() {
    token.value = null
    user.value = null
    queryClient.removeQueries({ queryKey: ['auth'] })
    toast.add({
      title: 'Đã đăng xuất',
      description: 'Hẹn gặp lại bạn!',
      color: 'info',
      icon: 'i-lucide-log-out'
    })
    navigateTo('/login')
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    login,
    fetchMe,
    logout,
    loginMutation
  }
}
