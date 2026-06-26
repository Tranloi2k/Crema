# Crema — Kế hoạch tính năng mới (đã rà soát thực tế)

## Bối cảnh

Crema là SaaS builder email kéo-thả: Next.js 15 App Router + TypeScript + Tailwind/shadcn, Zustand (editor state), @dnd-kit, TipTap, Drizzle ORM + Turso, NextAuth (Google/GitHub/email), Cloudinary (ảnh), Resend (gửi test), Lemon Squeezy (billing Free/Pro/Pro+). Đã ở mức MVP+ hoàn chỉnh.

Kế hoạch dưới đây đã được kiểm tra trực tiếp trong code để loại bỏ tính năng không cần thiết và chỉ giữ đề xuất khả thi.

### Đính chính sau khi xác minh trong code
- **Mobile preview ĐÃ CÓ** — `src/components/builder/PreviewModal.tsx` có toggle Desktop/Mobile (600px/375px).
- **Profile page là stub read-only** — `src/app/dashboard/profile/page.tsx` chỉ hiển thị avatar/tên/email.
- **send-test** (`src/app/api/send-test/route.ts`) chỉ gửi tới 1 địa chỉ; bảng `templates` (`src/lib/db/schema.ts`) chưa có cột cho version history.

## ❌ Loại bỏ (không cần thiết / không khả thi)
- **Video block** — email client không phát video inline, nặng + dễ spam.
- **Countdown timer block** — cần server render GIF động, công sức lớn giá trị thấp.
- **Mobile preview** — đã tồn tại.
- **AMP for Email export** — niche, ít client hỗ trợ.
- **Comments / realtime collaboration** — cần hạ tầng realtime, hoãn.

## ✅ Tính năng giữ lại theo tier

### Tier 1 — ROI cao, không cần dịch vụ ngoài (TRIỂN KHAI TRƯỚC)
1. **Template gallery** — thêm mẫu sẵn (newsletter, thông báo, khuyến mãi) khi tạo template. Tái dùng pattern `src/lib/emails/welcomeEmailTemplate.ts` + `seedWelcomeTemplate.ts`; UI ở `src/app/dashboard/page.tsx` / `TemplateList.tsx`.
2. **Hoàn thiện Profile** (`src/app/dashboard/profile/page.tsx`) — đổi tên, đổi mật khẩu (tái dùng `src/lib/auth/password.ts`), xoá tài khoản. Thêm API `src/app/api/profile/route.ts`.
3. **Version history / restore** — autosave (`src/lib/hooks/useAutosave.ts`) đè liên tục. Thêm bảng `template_versions` vào schema, snapshot khi autosave, UI xem/restore.
4. **Plain-text fallback** — sinh text thuần từ block Text khi export. Mở rộng `src/lib/export/toHtml.ts`.

### Tier 2 — cần thêm tích hợp/infra
5. ✅ **Block "Social icons"** — hàng icon mạng xã hội có link (icon từ SimpleIcons CDN, tint theo màu). Block type mới `social`.
6. ✅ **Share link xem trước (read-only public)** — link công khai `/p/[slug]` tới template; toggle Share trong editor.
7. **Gửi campaign thật** — gửi tới danh sách subscriber (Resend batch / Mailchimp / Klaviyo). *(chưa làm)*

> **Migration bắt buộc cho Tier 1 + Tier 2:** chạy `npm run db:migrate-features` (KHÔNG dùng `db:push` — nó sẽ xoá nhầm cột stripe* cũ). Script này tạo bảng `template_versions` và thêm cột `publicSlug`/`isPublic`, idempotent và không phá dữ liệu.

### Tier 3 — cân nhắc sau
8. **Brand/global styles** — màu/font/logo mặc định của brand.
9. **Team/workspace** — chia sẻ template trong nhóm (thay đổi schema lớn).

## Kiểm thử
Chạy `npm run dev`; test ở `/dashboard`, `/dashboard/profile`, `/editor/[templateId]`; xác minh autosave + export HTML không vỡ; thay đổi schema chạy migration Drizzle.
