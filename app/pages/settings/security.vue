<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useProfileMutations } from '~/composables/useProfile'

const { changePassword } = useProfileMutations()

const schema = z.object({
  oldPassword: z.string().min(1, 'Bắt buộc'),
  newPassword: z.string().min(6, 'Tối thiểu 6 ký tự'),
  confirm: z.string()
}).refine(d => d.newPassword === d.confirm, {
  message: 'Xác nhận mật khẩu không khớp',
  path: ['confirm']
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  oldPassword: '',
  newPassword: '',
  confirm: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  await changePassword.mutateAsync({
    oldPassword: event.data.oldPassword,
    newPassword: event.data.newPassword
  })
  state.oldPassword = ''
  state.newPassword = ''
  state.confirm = ''
}
</script>

<template>
  <UForm
    id="settings-security"
    :schema="schema"
    :state="state"
    @submit="onSubmit"
  >
    <UPageCard
      title="Bảo mật"
      description="Đổi mật khẩu tài khoản quản trị."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="settings-security"
        label="Đổi mật khẩu"
        color="neutral"
        type="submit"
        :loading="changePassword.isPending.value"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        name="oldPassword"
        label="Mật khẩu hiện tại"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="state.oldPassword" type="password" autocomplete="current-password" />
      </UFormField>
      <USeparator />
      <UFormField
        name="newPassword"
        label="Mật khẩu mới"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="state.newPassword" type="password" autocomplete="new-password" />
      </UFormField>
      <USeparator />
      <UFormField
        name="confirm"
        label="Xác nhận mật khẩu mới"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="state.confirm" type="password" autocomplete="new-password" />
      </UFormField>
    </UPageCard>
  </UForm>
</template>
