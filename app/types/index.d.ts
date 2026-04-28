import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

// ─── Product domain ───────────────────────────────────────────────────────────

export type CategorySlug = 'watches' | 'zippo' | 'glasses' | 'belts' | 'wallets' | 'hats'

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'

export interface ProductSpec {
  label: string
  value: string
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
}

export interface Product {
  id: string
  slug: string
  name: string
  brand: string
  price: number
  salePrice?: number | null
  description?: string | null
  images: string[]
  specs: ProductSpec[]
  tags: string[]
  highlights: string[]
  rating: number
  reviewCount: number
  stock: number
  status: ProductStatus
  isNew: boolean
  isBestSeller: boolean
  isLuxury: boolean
  videoUrl?: string | null
  videoPoster?: string | null
  categoryId?: string | null
  category?: ProductCategory | null
  createdAt: string
  updatedAt: string
}

export interface ProductsResponse {
  items: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export interface Customer {
  id: string
  email: string
  fullName: string
  phone: string | null
  address: string | null
  avatar: string | null
  isActive: boolean
  createdAt: string
  _count: { orders: number }
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}
