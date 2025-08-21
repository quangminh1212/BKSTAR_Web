# BKSTAR Website Clone

[![CI - Visual Regression](https://github.com/quangminh1212/BKSTAR_Web/actions/workflows/visual-regression.yml/badge.svg?branch=main)](https://github.com/quangminh1212/BKSTAR_Web/actions/workflows/visual-regression.yml)
[![Release](https://img.shields.io/github/v/release/quangminh1212/BKSTAR_Web?sort=semver)](https://github.com/quangminh1212/BKSTAR_Web/releases)
[![Pages](https://img.shields.io/badge/Pages-deployed-blue)](https://quangminh1212.github.io/BKSTAR_Web/)

Dự án clone giao diện BKSTAR (https://bkstar.com.vn/) nhằm mục đích học tập và kiểm thử giao diện tự động.

## Cấu trúc thư mục

```
.
├─ public/                # Tài nguyên tĩnh (PWA manifest, sw), snapshot được lưu tại public/snapshot
├─ src/                   # Nguồn giao diện demo (nếu cần mở rộng)
├─ scripts/               # Tiện ích: snapshot site, hậu xử lý font, đổi tên thân thiện, so sánh hình ảnh
├─ visual-diff/           # Kết quả so sánh (live/local/diff + report.json + report.html)
├─ vite.config.js         # Cấu hình Vite (dev/build/preview)
├─ package.json           # Scripts npm
└─ .editorconfig          # Quy ước định dạng mã nguồn
```

## Release tự động (semantic-release)

- Dùng Conventional Commits để semantic-release tính version và tạo changelog (header ≤ 100 ký tự).
- Workflow: .github/workflows/release.yml chạy khi push vào main/master.
- Secrets:
  - GITHUB_TOKEN: có sẵn trong Actions (dùng tạo release/changelog)
  - NPM_TOKEN: nếu muốn publish npm (không bắt buộc)

## Cách chạy

### Development server

- npm run dev

### Snapshot nội dung trang live về local

- npm run snapshot
  - Tải về các trang whitelist và tài nguyên cần thiết
  - Hậu xử lý font và tự động đổi tên file theo slug canonical (dễ hiểu)

### So sánh giao diện (Visual Regression Testing)

- Toàn site: npm run visual:test
- Chỉ các trang chính (nhanh): npm run test:visual:pages
  - Lệnh này dùng biến môi trường PAGES_ONLY=1 để chỉ so sánh các trang chính

### Build/Preview

- npm run build
- npm run preview

## Ghi chú

- scripts/visual-compare.js đã cấu hình mask/clamp để loại trừ vùng động (ticker, share, comments, related, meta…) giúp so sánh tập trung vào layout.
- Báo cáo trực quan mở ở: visual-diff/report.html
- Cấu hình visual test nằm trong: scripts/visual-config.json (dễ chỉnh sửa, không cần sửa mã JS)

## License

Dự án chỉ dùng cho mục đích học tập. Nội dung và tài sản thuộc về BKSTAR.

### ✅ Đã hoàn thành:

- **Responsive Design**: Tương thích với mọi thiết bị (desktop, tablet, mobile)
- **Header với Navigation**: Menu dropdown, thông tin liên hệ, social links
- **Hero Slider**: Carousel tự động chuyển slide với điều khiển manual
- **Stats Counter**: Hiệu ứng đếm số liệu thống kê khi scroll
- **Testimonials Slider**: Carousel hiển thị thành tích học viên
- **About Section**: Giới thiệu với video YouTube embed
- **News Section**: Khu vực tin tức báo chí
- **Competitions Section**: Danh sách cuộc thi quốc tế
- **Blog Section**: Bài viết blog du học
- **Achievements Section**: Thành tích học viên
- **Services Section**: Các dịch vụ của BKSTAR
- **Contact Form**: Form liên hệ với validation
- **Footer**: Thông tin công ty và liên hệ
- **Floating Contact**: Nút cuộn lên đầu trang và liên hệ nhanh
- **Smooth Scrolling**: Cuộn mượt mà giữa các section
- **Loading Animations**: Hiệu ứng fade-in khi scroll
- **Form Validation**: Kiểm tra dữ liệu form trước khi submit

### 🎨 Thiết kế:

- **Màu sắc chính**:
  - Primary Blue: #046bd2
  - Secondary Blue: #6ec4e4
  - Dark Gray: #1e293b
  - Light Gray: #64748b
- **Typography**: Font Inter với các weight khác nhau
- **Layout**: Grid system responsive
- **Icons**: Font Awesome 6.0

### 📱 Responsive Breakpoints:

- Desktop: > 768px
- Tablet: 768px - 1024px
- Mobile: < 768px

## Cấu trúc file

```
BKSTAR_Web/
├── index.html          # File HTML chính
├── styles.css          # Stylesheet chính
├── script.js           # JavaScript functionality
├── images/             # Thư mục chứa hình ảnh
│   ├── logo.png        # Logo BKSTAR
│   ├── slide1.jpg      # Hình slider 1
│   ├── slide2.jpg      # Hình slider 2
│   ├── slide3.jpg      # Hình slider 3
│   ├── slide4.jpg      # Hình slider 4
│   ├── student1.jpg    # Ảnh học viên 1
│   ├── student2.jpg    # Ảnh học viên 2
│   ├── student3.jpg    # Ảnh học viên 3
│   ├── student4.jpg    # Ảnh học viên 4
│   └── student5.jpg    # Ảnh học viên 5
└── README.md           # File hướng dẫn này
```

## Hướng dẫn sử dụng

### 1. Chuẩn bị hình ảnh:

Thêm các file hình ảnh vào thư mục `images/`:

- `logo.png`: Logo BKSTAR (khuyến nghị 200x60px)
- `slide1.jpg` đến `slide4.jpg`: Hình slider (khuyến nghị 1200x500px)
- `student1.jpg` đến `student5.jpg`: Ảnh học viên (khuyến nghị 120x120px, hình vuông)

### 2. Chạy website:

- Mở file `index.html` trong trình duyệt web
- Hoặc sử dụng live server để development

### 3. Tùy chỉnh nội dung:

- **Thông tin liên hệ**: Sửa trong header và footer của `index.html`
- **Nội dung các section**: Cập nhật text trong các section tương ứng
- **Màu sắc**: Thay đổi CSS variables trong `styles.css`
- **Testimonials**: Cập nhật mảng `testimonials` trong `script.js`

## Tính năng JavaScript

### Hero Slider:

- Tự động chuyển slide mỗi 5 giây
- Điều khiển manual với nút prev/next
- Smooth transition giữa các slide

### Stats Counter:

- Animation đếm số khi section xuất hiện trong viewport
- Sử dụng Intersection Observer API

### Testimonials Slider:

- Tự động chuyển testimonial mỗi 4 giây
- Hiển thị thông tin học viên và trường đại học

### Form Validation:

- Kiểm tra các trường bắt buộc
- Validation email và số điện thoại
- Hiển thị thông báo success/error

### Mobile Menu:

- Menu responsive cho thiết bị mobile
- Click outside để đóng menu

### Scroll Effects:

- Smooth scrolling cho anchor links
- Fade-in animation khi scroll
- Parallax effect cho hero section
- Scroll to top button

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Performance

- **Optimized CSS**: Sử dụng CSS Grid và Flexbox
- **Lazy Loading**: Images load với fade-in effect
- **Smooth Animations**: Hardware-accelerated transitions
- **Responsive Images**: Placeholder fallback cho missing images

## Customization

### Thay đổi màu sắc:

```css
:root {
  --primary-color: #046bd2;
  --secondary-color: #6ec4e4;
  --dark-color: #1e293b;
  --light-color: #64748b;
}
```

### Thêm testimonial mới:

```javascript
const newTestimonial = {
  university: 'Tên trường đại học',
  name: 'Tên học viên',
  school: 'Trường phổ thông',
  image: 'images/student_new.jpg',
};
testimonials.push(newTestimonial);
```

## Deployment

### GitHub Pages:

- Workflow .github/workflows/deploy-pages.yml đã cấu hình sẵn. Khi push vào main, Actions sẽ build bằng `npm run build:gh` (BASE=/BKSTAR_Web/) và deploy dist lên Pages.
- URL trang: https://quangminh1212.github.io/BKSTAR_Web/
- Nếu đổi tên repo, cập nhật script `build:gh` (hoặc đặt biến BASE) cho đúng base path.

### Netlify:

1. Kéo thả thư mục project vào Netlify
2. Hoặc connect với GitHub repository
3. Auto-deploy khi có commit mới

## License

Đây là project clone cho mục đích học tập. Vui lòng tôn trọng bản quyền của website gốc BKSTAR.

## Contact

Nếu có thắc mắc về code, vui lòng tạo issue trong repository này.
