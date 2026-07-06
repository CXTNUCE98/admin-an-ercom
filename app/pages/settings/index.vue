<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useProfileMutations } from '~/composables/useProfile'

const { user, fetchMe } = useAuth()
const { updateProfile } = useProfileMutations()

const profileSchema = z.object({
  fullName: z.string().min(2, 'Tối thiểu 2 ký tự'),
  phone: z.string().optional(),
  address: z.string().optional()
})

type ProfileSchema = z.output<typeof profileSchema>

const profile = reactive<Partial<ProfileSchema>>({
  fullName: '',
  phone: '',
  address: ''
})

onMounted(async () => {
  if (!user.value) await fetchMe()
})

watchEffect(() => {
  if (user.value) {
    profile.fullName = user.value.fullName ?? ''
    profile.phone = (user.value as any).phone ?? ''
    profile.address = (user.value as any).address ?? ''
  }
})

async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
  await updateProfile.mutateAsync(event.data)
}
</script>

<template>
  <UForm
    id="settings-profile"
    :schema="profileSchema"
    :state="profile"
    @submit="onSubmit"
  >
    <UPageCard
      title="Hồ sơ"
      description="Thông tin tài khoản quản trị viên."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="settings-profile"
        label="Lưu thay đổi"
        color="neutral"
        type="submit"
        :loading="updateProfile.isPending.value"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        name="email"
        label="Email"
        description="Email đăng nhập (không thể đổi)."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput :model-value="user?.email" disabled />
      </UFormField>
      <USeparator />
      <UFormField
        name="fullName"
        label="Họ tên"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="profile.fullName" autocomplete="off" />
      </UFormField>
      <USeparator />
      <UFormField
        name="phone"
        label="Số điện thoại"
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="profile.phone" autocomplete="off" />
      </UFormField>
      <USeparator />
      <UFormField
        name="address"
        label="Địa chỉ"
        class="flex max-sm:flex-col justify-between items-start gap-4"
        :ui="{ container: 'w-full' }"
      >
        <UInput v-model="profile.address" class="w-full" autocomplete="off" />
      </UFormField>
    </UPageCard>
  </UForm>
</template>
