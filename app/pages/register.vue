<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { register, registerMutation } = useAuth()
const toast = useToast()

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

async function onSubmit() {
  if (form.password !== form.confirmPassword) {
    toast.add({
      title: 'Mật khẩu xác nhận không khớp',
      color: 'error',
      icon: 'i-lucide-circle-x'
    })
    return
  }

  try {
    await register(form.email, form.password, form.fullName)
  }
  catch (err: any) {
    toast.add({
      title: 'Đăng ký thất bại',
      description: err?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại',
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
        Đăng ký tài khoản
      </h1>
    </template>

    <UForm :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField label="Họ và tên" name="fullName">
        <UInput
          v-model="form.fullName"
          placeholder="Nguyễn Văn A"
          class="w-full"
          autocomplete="name"
        />
      </UFormField>

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
          placeholder="Tối thiểu 6 ký tự"
          class="w-full"
          autocomplete="new-password"
        />
      </UFormField>

      <UFormField label="Xác nhận mật khẩu" name="confirmPassword">
        <UInput
          v-model="form.confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu"
          class="w-full"
          autocomplete="new-password"
        />
      </UFormField>

      <UButton type="submit" class="w-full justify-center" :loading="registerMutation.isPending.value">
        Đăng ký
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-sm text-center text-muted">
        Đã có tài khoản?
        <NuxtLink to="/login" class="text-primary font-medium hover:underline">
          Đăng nhập
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>
