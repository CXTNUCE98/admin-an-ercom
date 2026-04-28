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

  // Query: lấy thông tin user hiện tại
  const { refetch: refetchMe } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<AuthUser> => {
      const data = await $anErcom('/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      return data as unknown as AuthUser
    },
    enabled: isLoggedIn,
    retry: false
  })

  // Sync user state từ query result
  watch(
    () => queryClient.getQueryData<AuthUser>(['auth', 'me']),
    (data) => {
      if (data) user.value = data
    }
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
      const result = await refetchMe()
      if (result.data) user.value = result.data
      toast.add({
        title: 'Đăng nhập thành công',
        description: 'Chào mừng bạn trở lại!',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      await navigateTo('/')
    }
  })

  // Mutation: đăng ký
  const registerMutation = useMutation({
    mutationFn: (vars: { email: string, password: string, fullName: string }) =>
      $anErcom('/auth/register', {
        method: 'POST',
        body: { email: vars.email, password: vars.password, fullName: vars.fullName }
      }),
    onSuccess: async (_, variables) => {
      toast.add({
        title: 'Đăng ký thành công',
        description: 'Đang đăng nhập...',
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      await loginMutation.mutateAsync({ email: variables.email, password: variables.password })
    }
  })

  async function login(email: string, password: string) {
    await loginMutation.mutateAsync({ email, password })
  }

  async function register(email: string, password: string, fullName: string) {
    await registerMutation.mutateAsync({ email, password, fullName })
  }

  async function fetchMe() {
    if (!token.value) return
    const result = await refetchMe()
    if (result.data) user.value = result.data
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
    login,
    register,
    fetchMe,
    logout,
    loginMutation,
    registerMutation
  }
}
