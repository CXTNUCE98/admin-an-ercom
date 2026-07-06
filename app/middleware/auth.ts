export default defineNuxtRouteMiddleware(async () => {
  const { isLoggedIn, user, fetchMe, logout } = useAuth()

  if (!isLoggedIn.value) {
    return navigateTo('/login')
  }

  // Đảm bảo đã có profile để kiểm tra role (token có thể vừa khôi phục từ cookie).
  if (!user.value) {
    await fetchMe()
  }

  // Chỉ ADMIN được vào admin panel. User thường → đăng xuất + về login.
  if (user.value && user.value.role !== 'ADMIN') {
    logout()
    return navigateTo('/login')
  }
})
