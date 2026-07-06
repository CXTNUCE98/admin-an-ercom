# AN ERCOM — Kế hoạch cải tiến hệ thống

> Tài liệu roadmap cải tiến cho hệ thống IRONMAN storefront (FE + Admin + BE).
> Ghi lại các vấn đề đã phát hiện, việc đã làm, và các giai đoạn phát triển tiếp theo.
> Cập nhật lần cuối: 2026-07-06.

---

## 0. Kiến trúc tổng thể

| Phần | Stack | Vai trò | Trạng thái |
|------|-------|---------|-----------|
| **FE** (`FE/`) | Nuxt 3 SSR, UnoCSS, Pinia, vue-query | Storefront công khai | ⚠️ Chạy bằng data hardcode, **chưa nối BE** cho catalog |
| **Admin** (`admin-an-ercom/`) | Nuxt 3, Nuxt UI dashboard, vue-query | Quản trị sản phẩm | ✅ Đã nối BE (auth, products, categories, upload) |
| **BE** (`BE-An-ercom/`) | NestJS 11, Prisma 7, PostgreSQL, Vercel serverless | REST API | ✅ Chạy được, còn lệch docs nhiều chỗ |

**Vấn đề nền tảng lớn nhất:** FE đọc dữ liệu từ file tĩnh `FE/src/constants/products/*.ts`, không gọi API. Admin ghi vào DB nhưng storefront không hiển thị → SEO vô nghĩa và admin panel chưa có tác dụng thực với mặt tiền. Đây là điều kiện tiên quyết phải xử lý (Giai đoạn 0).

---

## 1. Đã hoàn thành — Vá bảo mật Backend (2026-07-06)

Build đã sạch (`nest build` exit 0). Có cài thêm: `@nestjs/throttler`, `helmet`, `compression`, `@types/compression`.

| Fix | File |
|-----|------|
| IDOR `GET /orders/:id` — thêm kiểm tra ownership (chủ đơn / ADMIN) | `src/order/order.service.ts`, `src/order/order.controller.ts` |
| Bỏ fallback `JWT_SECRET='defaultSecret'`, fail-fast khi thiếu env; đọc `JWT_EXPIRES_IN` | `src/auth/auth.module.ts`, `src/auth/strategies/jwt.strategy.ts` |
| Rate limiting global 100 req/60s + login/register 5 req/60s | `src/app.module.ts`, `src/auth/auth.controller.ts` |
| `helmet` + `compression` | `src/setup.ts` |
| `@Max(100)` cho `pageSize` | `src/product/dto/product.dto.ts`, `order/dto/order.dto.ts`, `user/dto/user.dto.ts` |
| Null-check `user` trong RolesGuard | `src/common/guards/roles.guard.ts` |

> ⚠️ **Deploy:** sau thay đổi này, nếu Vercel chưa set env `JWT_SECRET` thì app **không khởi động** (hành vi mong muốn). Đảm bảo `JWT_SECRET` đã có trong Vercel env trước khi deploy.

---

## 2. GIAI ĐOẠN 0 — Nối FE ↔ BE (ưu tiên cao nhất)

> Không hoàn thành bước này thì mọi tối ưu SEO/performance đều vô nghĩa, vì Google sẽ index nội dung tĩnh không khớp kho hàng thật, và admin panel không có tác dụng.

### 2.1 Backend chuẩn bị
- [ ] **`select` projection cho `GET /products`**: hiện `include: { category: true }` trả nguyên `description`, `images`, `specs`, `tags`, `highlights` cho từng item lưới → payload phình. Chỉ trả các field card cần (id, slug, name, brand, price, salePrice, ảnh đầu, rating, badges, categorySlug/Name). Giữ full field cho `/products/:id` và `/products/slug/:slug`.
  - File: `src/product/product.service.ts`
- [ ] **Phẳng hoá category** trong response: trả thêm `categorySlug` + `categoryName` thay vì chỉ `category: { ... }` nested, để khớp hợp đồng FE.
- [ ] **Thống nhất casing**: BE hiện trả **camelCase** nhưng `docs.md` §4 ghi snake_case. Quyết định: **giữ camelCase** và sửa lại `docs.md` cho khớp (đơn giản hơn là viết interceptor chuyển đổi).
- [ ] **`Cache-Control` cho các GET công khai** (xem Giai đoạn 3.4 — làm chung tiện hơn).

### 2.2 Frontend chuyển sang gọi API
- [ ] Sửa `FE/src/features/catalog/repositories/productRepository.ts`: thay vì `return CATALOG_PRODUCTS`, gọi API qua `$anErcom` / `useAsyncData` (SSR-friendly, không mất SEO).
- [ ] Sửa `FE/src/components/sections/ProductsShowcase.vue`: hiện import thẳng `CATALOG_PRODUCTS` — chuyển sang dùng store/service để đi qua API.
- [ ] Trang chi tiết `FE/src/pages/products/[slug].vue`: chuyển `catalog.getProduct(slug)` (đồng bộ) sang `useAsyncData(() => $anErcom('/products/slug/' + slug))` để fetch SSR có 404 đúng.
- [ ] Trang combo `FE/src/pages/combos/[slug].vue`: tương tự (phụ thuộc BE dựng combos — Giai đoạn 4).
- [ ] Bỏ `enabled: isAuthenticated` trong `FE/src/composables/useCategory.ts` cho dữ liệu công khai (khách chưa đăng nhập vẫn phải load được).
- [ ] Cấu hình vue-query SSR hydration (`dehydrate`/`hydrate`) trong `FE/src/plugins/vue-query.ts`, hoặc dùng thẳng `useAsyncData` để tận dụng cache SSR.
- [ ] Seed data hardcode hiện tại (`constants/products/*.ts`) vào DB qua admin hoặc script seed, rồi có thể xoá dần file tĩnh.

### 2.3 Rủi ro cần lưu ý
- Kiểm tra kỹ mapping field FE ↔ BE (đặc biệt `categorySlug`, `salePrice`, `images`).
- Đảm bảo `NUXT_PUBLIC_API_BASE` trỏ đúng BE ở cả dev và production.

---

## 3. GIAI ĐOẠN 2 — SEO Frontend (thế mạnh cần xây)

> Hiện tại grep toàn FE: **0** occurrence của `useSeoMeta`, `og:`, `twitter:`, `application/ld+json`, `canonical`. Không có sitemap/robots.

### 3.1 Meta & Social
- [ ] Thay `useHead` rời rạc bằng `useSeoMeta` (title, description, OG, Twitter Card) trên mọi trang.
- [ ] Trang chi tiết sản phẩm: OG image = ảnh sản phẩm, description = mô tả ngắn.
- [ ] Thêm canonical URL cho từng trang; đặt `<html lang="vi">`.

### 3.2 Structured Data (JSON-LD) — quan trọng nhất cho e-commerce
- [ ] JSON-LD `Product` trên trang chi tiết: `name`, `image`, `brand`, `offers` (price, priceCurrency VND, availability theo stock), `aggregateRating` (rating + reviewCount).
- [ ] JSON-LD `BreadcrumbList` (đã có breadcrumb UI, cần thêm structured data).
- [ ] JSON-LD `Organization` + `WebSite` ở `app.vue` / layout.

### 3.3 Sitemap & Robots & Routing
- [ ] Cài `@nuxtjs/sitemap` + `@nuxtjs/robots`; sitemap động sinh từ danh sách sản phẩm/danh mục (gọi BE).
- [ ] **Tạo route danh mục thật** `/categories/[slug]` với URL riêng + phân trang SSR. Hiện điều hướng chỉ dựa trên anchor `#cat-watches` trên trang chủ → không có URL riêng để SEO từng danh mục.
- [ ] Tạo trang 404 tuỳ biến (`error.vue`) thân thiện.

---

## 4. GIAI ĐOẠN 3 — Performance Frontend

### 4.1 Ảnh (đã cài `@nuxt/image` nhưng chưa dùng)
- [ ] Thay `<img>` thô trong `FE/src/components/common/ProductMedia.vue` bằng `<NuxtImg>`/`<NuxtPicture>`: responsive `sizes`, `loading="lazy"`, format AVIF/WebP, `width`/`height` chống layout shift (CLS).
- [ ] Bỏ trò chế URL ảnh giả bằng query `?sat=-30&flip=h` trong `pages/products/[slug].vue` (vô nghĩa với ảnh không phải Unsplash) — thay bằng ảnh thật từ mảng `images`.
- [ ] Cấu hình `image.domains` trong `nuxt.config.ts` cho domain Cloudinary (BE upload qua Cloudinary).

### 4.2 Font
- [ ] `FE/nuxt.config.ts` đang nạp đồng bộ **6 họ font Google** với nhiều weight qua `<link rel=stylesheet>` → chặn render, hại LCP. Chuyển sang `@nuxt/fonts` hoặc `@nuxtjs/google-fonts` với preload + subset + `display=swap`, giảm số weight thực dùng.

### 4.3 Bundle & Loading
- [ ] Gỡ bớt lib fetch dư: hiện có cả `axios` + `ofetch` + `nuxt-api-party`. Chọn một (khuyến nghị `nuxt-api-party` + `$fetch`).
- [ ] Lazy-load các section dưới màn hình đầu của trang chủ (trang chủ hiện render toàn bộ 6 danh mục cùng lúc, DOM nặng khi kho lớn).
- [ ] Cân nhắc phân trang / infinite scroll cho danh sách sản phẩm thay vì render tất cả.

### 4.4 Backend hỗ trợ (làm chung với Giai đoạn 0)
- [ ] Thêm `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` (+ ETag) cho các GET công khai (`/products`, `/products/slug/:slug`, `/product-categories`). Đây là đòn bẩy lớn nhất cho SSR/SEO vì hiện **không có cache header nào** → mỗi lần SSR render là 1 lượt hit DB + cold start.
- [ ] Thêm index Prisma cho các cột lọc/sort: `Product.status`, `categoryId`, `brand`, `price`, `createdAt`; và FK `Order.userId`, `Order.status`, `Order.createdAt`, `OrderItem.productId`.
- [ ] Cấu hình Prisma pooling cho serverless: dùng connection string pooled cho runtime, `DIRECT_URL` cho migrations, `pg.Pool max: 1`. Hiện `DIRECT_URL` khai báo trong `.env` nhưng không được đọc.
- [ ] Thiết lập Prisma migrations (hiện chỉ `db push`, không reproducible).

---

## 5. GIAI ĐOẠN 4 — Hoàn thiện nghiệp vụ & dọn dẹp

### 5.1 Backend
- [ ] **Dựng model + endpoint `combos` / `combo_items`**: `docs.md` §2.3–2.4 mô tả đầy đủ nhưng BE **chưa có** (FE có trang combo). Cần model Prisma, service, controller, tính `savings = original_price - combo_price`.
- [ ] **Fix `specs`**: `create()` hard-code `specs: []` (bỏ input), `CreateProductDto` **không có field `specs`**. Thêm field `specs` (mảng `{label, value}`) vào DTO + service. Tương tự đảm bảo `videoUrl`, `videoPoster`, `ratingBreakdown`, `highlights` lưu được.
- [ ] **Soft delete**: hiện `DELETE` xoá cứng → xoá sản phẩm đã có `OrderItem` sẽ lỗi FK (500), và hỏng SEO URL. Thêm `deletedAt` + filter.
- [ ] **Sort token lệch**: BE nhận `price-asc` (gạch nối) nhưng docs/FE dùng `price_asc` (gạch dưới) → im lặng fallback. Thống nhất một chuẩn.
- [ ] Thêm filter `price_min` / `price_max` / `tags` cho `GET /products` (docs §3.1 có, BE thiếu).
- [ ] Thêm global prefix `/api/v1` (docs quy định) — lưu ý `/api` đang bị Swagger UI chiếm, cần xử lý xung đột.
- [ ] `DELETE` trả `204 No Content` thay vì trả object đã xoá.
- [ ] Global exception filter chuẩn hoá error shape về `{ error, code, details }` (docs §7) thay vì default NestJS `{ statusCode, message, error }`.
- [ ] Tự động set `status = OUT_OF_STOCK` khi `stock = 0` (docs §5 rule).
- [ ] `getMonthlySales` chạy 12 query tuần tự (`dashboard.service.ts`) → gộp thành 1 query `groupBy`/`date_trunc` hoặc `Promise.all`.
- [ ] Xoá file chết `src/vercel.ts` (trùng `api/index.ts`, không ai import).
- [ ] Viết test cho controller/service (`.agent/rules` yêu cầu nhưng hiện chỉ có scaffolding).

### 5.2 Admin
- [ ] **Form sản phẩm nhập được specs/tags/highlights**: `app/components/products/FormModal.vue` hiện hard-code `tags: []`, `highlights: []` và không gửi `specs` → cả pipeline hỏng đầu-cuối. Cần editor mảng JSON cho các trường này (quan trọng cho SEO: thông số, tag).
- [ ] Thêm màn quản lý **combos** (phụ thuộc BE Giai đoạn 5.1).
- [ ] Hoàn thiện màn **orders** (admin xem/cập nhật trạng thái đơn).
- [ ] Dọn rác template Nuxt UI dashboard: `inbox`, `mails`, `members`, `teams`, `notifications` + `server/api/*.ts` mock — không liên quan e-commerce.
- [ ] Đặt `ssr: false` trong `nuxt.config.ts` (admin nên chạy SPA cho nhẹ, không cần SEO).

### 5.3 Frontend — dọn dẹp
- [ ] **Nối checkout thật**: `FE/src/features/checkout/services/checkoutService.ts` hiện giả lập `setTimeout(1200)` → gọi `POST /orders` thật (BE đã có).
- [ ] Dọn `FE/src/pages/login.vue`: đang dùng theme slate/amber + tiêu đề "GENTLEMEN", lệch hoàn toàn design system IRONMAN (leftover template).
- [ ] Xoá import rác `~/types/practice-math` trong `FE/src/composables/useAuth.ts` (từ dự án khác).
- [ ] Thống nhất `import.meta.client` thay cho `process.client` (deprecated).
- [ ] Auth: profile hiện lưu localStorage (không dùng được khi SSR) — cân nhắc dời sang cookie/`useState`.

---

## 6. Thứ tự thực hiện đề xuất

1. ✅ **Bảo mật BE** (đã xong)
2. **Giai đoạn 0** — Nối FE↔BE (bắt buộc trước, gồm cả `select` + `Cache-Control` + index ở BE)
3. **Giai đoạn 2** — SEO FE (sitemap, JSON-LD, OG, route danh mục)
4. **Giai đoạn 3** — Performance FE (NuxtImg, font, bundle)
5. **Giai đoạn 4** — Hoàn thiện nghiệp vụ (combos, specs, soft-delete, checkout thật, dọn rác)

> Ghi chú: các mục ở Giai đoạn 3.4 (BE cache/index/pooling) nên gộp làm cùng Giai đoạn 0 vì liên quan trực tiếp tới việc FE gọi API.

