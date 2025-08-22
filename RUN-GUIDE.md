# 🚀 BKSTAR_Web - Hướng dẫn chạy dự án

## 📋 Tổng quan

Dự án BKSTAR_Web cung cấp nhiều cách khác nhau để chạy development server với các tính năng phong phú.

## 🛠️ Các file chạy dự án

### 1. `run-simple.bat` ⭐ (Khuyên dùng)
```bash
.\run-simple.bat
```
- ✅ **Nhanh và đơn giản**
- ✅ **Giao diện đẹp với emoji và màu sắc**
- ✅ **Tự động kiểm tra port availability**
- ✅ **Hiển thị thông tin server rõ ràng**

### 2. `run-enhanced.bat` 🌟 (Đầy đủ tính năng)
```bash
.\run-enhanced.bat
```
- ✅ **Menu lựa chọn 6 modes khác nhau**
- ✅ **Port detection và server monitoring**
- ✅ **Auto browser opening**
- ✅ **Full build + preview mode**
- ✅ **Server status monitor**

### 3. `run.bat` 🏗️ (Build + Preview)
```bash
.\run.bat
```
- ✅ **Menu lựa chọn 2 modes**
- ✅ **Quick dev hoặc full build**
- ✅ **Snapshot generation**
- ✅ **Preview với snapshot**

## 🎯 Các npm scripts mới

### Development
```bash
npm run dev                # Standard Vite dev server
npm run dev:open          # Dev server + auto browser open
npm run dev:info          # Dev server + port information
```

### Server Information
```bash
npm run server:info       # Hiển thị thông tin server chi tiết
npm run server:monitor    # Monitor server status real-time
npm run server:check      # Check port 5173 availability
```

### Utility Scripts
```bash
node scripts/detect-server.js info      # Server information
node scripts/detect-server.js monitor   # Monitor server
node scripts/detect-server.js port      # Check port
```

## 🌐 Port Information

### Default Port
- **Port mặc định**: `5173`
- **URL**: `http://localhost:5173`

### Port Detection
- ✅ Tự động detect port đang sử dụng
- ✅ Tìm port available tiếp theo nếu 5173 bị chiếm
- ✅ Hiển thị tất cả network interfaces
- ✅ Show localhost và IP addresses

### Port Logs Example
```
🔍 Checking port availability...
✅ Port 5173 is available

📍 Server URLs:
   Local:    http://localhost:5173
   Local:    http://127.0.0.1:5173
   Network:  http://192.168.1.113:5173
```

## 🎨 Enhanced Features

### 1. **Visual Interface**
- Colorful ASCII art boxes
- Emoji indicators
- Progress indicators
- Status messages

### 2. **Smart Port Management**
```bash
⚠️  Port 5173 is busy - Vite will find another port
🔄 Next available port: 5174
```

### 3. **Network Detection**
- Local addresses
- Network IP addresses  
- All available interfaces

### 4. **Development Info**
```
🛠️  Development Features:
   • Hot Module Replacement (HMR)
   • Fast Refresh
   • Source Maps
   • Error Overlay
```

## 🚦 Cách sử dụng

### Cho người dùng thông thường
```bash
# Cách nhanh nhất
.\run-simple.bat

# Hoặc
npm run dev
```

### Cho developer
```bash
# Full featured với menu
.\run-enhanced.bat

# Kiểm tra port trước khi chạy
npm run server:check
```

### Cho production testing
```bash
# Full build + preview
.\run.bat
```

## 🔧 Troubleshooting

### Port đã được sử dụng
- ✅ Script tự động tìm port available
- ✅ Vite sẽ increment port number (5174, 5175, ...)

### Dependencies issues
- ✅ Script tự động install dependencies nếu chưa có
- ✅ Fallback từ `npm install` sang `npm ci`

### Network access
- ✅ Server expose trên tất cả network interfaces
- ✅ Accessible từ mobile devices trên cùng WiFi

## 💡 Tips

1. **Để dev nhanh**: Dùng `.\run-simple.bat`
2. **Để có control đầy đủ**: Dùng `.\run-enhanced.bat`
3. **Để test production build**: Dùng `.\run.bat`
4. **Monitor server status**: `npm run server:monitor`
5. **Check port availability**: `npm run server:check`

---

**🎉 Happy Coding with BKSTAR_Web!**
