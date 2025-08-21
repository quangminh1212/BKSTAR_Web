# Hướng dẫn đóng góp

Cảm ơn bạn đã quan tâm đến dự án. Quy tắc chung:

- Dùng Node.js LTS (>= 20)
- Cài bằng `npm ci`
- Chạy `npm run dev` để dev, `npm run build` để build
- Giữ định dạng bằng `npm run format` (Prettier) và `npm run lint` (ESLint)
- Commit theo Conventional Commits: `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`
- PR phải pass CI (build + visual test)

## Quy trình phát triển
1. Fork (hoặc branch) từ `main`
2. Tạo branch mới: `feat/ten-tinh-nang` hoặc `fix/ten-loi`
3. Code + viết/điều chỉnh test nếu cần
4. Chạy kiểm tra nhanh:
   - `npm run snapshot`
   - `npm run test:visual:pages`
5. Tạo Pull Request, mô tả ngắn gọn thay đổi, đính kèm ảnh/chú thích nếu có

## Quy ước mã nguồn
- .editorconfig kiểm soát indent (2 spaces), EOF, trim trailing whitespace
- Ưu tiên tên file và biến rõ ràng, tiếng Anh, snake/camel-case thống nhất
- Không commit build artifacts (dist/), tránh commit nặng (node_modules/)

## Câu hỏi/Trao đổi
Mở Issue hoặc PR kèm nội dung mô tả rõ ràng.

