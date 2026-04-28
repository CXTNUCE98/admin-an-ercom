export const useUpload = () => {
  const { token } = useAuth()
  const config = useRuntimeConfig()
  const apiBase = (config.public.apiBase as string) || 'http://localhost:9001/'

  const uploading = ref(false)

  async function uploadImages(files: File[]): Promise<string[]> {
    if (!files.length) return []
    uploading.value = true
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('images', f))

      // Dùng native fetch để browser tự set Content-Type: multipart/form-data với boundary
      const res = await fetch(`${apiBase}upload/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
        body: formData
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || `Upload failed: ${res.status}`)
      }

      const data: { urls: string[] } = await res.json()
      return data.urls
    } finally {
      uploading.value = false
    }
  }

  return { uploadImages, uploading }
}
