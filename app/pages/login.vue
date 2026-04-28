<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { login, loginMutation } = useAuth()
const toast = useToast()

const form = reactive({
  email: '',
  password: ''
})

async function onSubmit() {
  try {
    await login(form.email, form.password)
  }
  catch (err: any) {
    toast.add({
      title: 'Đăng nhập thất bại',
      description: err?.data?.message || 'Email hoặc mật khẩu không chính xác',
      color: 'error',
      icon: 'i-lucide-circle-x'
    })
  }
}
</script>

<template>
  <UCard class="w-full max-w-sm">
    <template #header>
      <h1 class="text-xl font-semibold text-center">
        Đăng nhập
      </h1>
    </template>

    <UForm :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email" name="email">
        <UInput
          v-model="form.email"
          type="email"
          placeholder="you@example.com"
          class="w-full"
          autocomplete="email"
        />
      </UFormField>

      <UFormField label="Mật khẩu" name="password">
        <UInput
          v-model="form.password"
          type="password"
          placeholder="••••••••"
          class="w-full"
          autocomplete="current-password"
        />
      </UFormField>

      <UButton type="submit" class="w-full justify-center" :loading="loginMutation.isPending.value">
        Đăng nhập
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-sm text-center text-muted">
        Chưa có tài khoản?
        <NuxtLink to="/register" class="text-primary font-medium hover:underline">
          Đăng ký
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>
