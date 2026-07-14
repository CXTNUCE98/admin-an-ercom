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

// ─── Order domain ───────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED'
export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'MOMO'

export interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    slug: string
    images: string[]
    brand: string
  } | null
  combo?: {
    id: string
    name: string
    slug: string
    image: string | null
  } | null
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  subtotal?: number
  discount?: number
  shippingFee?: number
  couponCode?: string | null
  totalPrice: number
  shippingAddress: string
  phone: string
  note?: string | null
  paymentMethod: PaymentMethod
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  user: {
    id: string
    fullName: string
    email: string
    phone: string | null
  } | null
}

export interface OrdersResponse {
  items: Order[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface OrderStats {
  total: number
  pending: number
  confirmed: number
  shipping: number
  delivered: number
  cancelled: number
  totalRevenue: number
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

