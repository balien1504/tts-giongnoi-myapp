# VoiceStudio AI - Studio Giọng Nói & Text-to-Speech Chuyên Nghiệp

VoiceStudio AI là ứng dụng phòng thu âm thanh và chuyển văn bản thành giọng nói biểu cảm (TTS) chuyên nghiệp, tích hợp bộ lọc âm thanh phòng thu DSP tùy chỉnh (32-bit floating point) và xuất file âm thanh chất lượng cao (WAV 24-bit Hi-Res, MP3 320kbps, WebM).

---

## 🔑 Nhập API Key Trực Tiếp Trên Trình Duyệt (Không cần file .env)

Ứng dụng hỗ trợ nhập trực tiếp Gemini API Key cá nhân ngay trên giao diện web:
1. Bấm nút **"Nhập API Key"** trên thanh tiêu đề (Header) hoặc thông báo trên bảng điều khiển.
2. Dán mã khóa Gemini API Key của bạn (Lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/apikey)).
3. Bấm **"Kiểm Tra Key"** để xác thực kết nối, sau đó bấm **"Lưu & Kích Hoạt"**.
4. Khóa API được lưu trữ an toàn trong bộ nhớ trình duyệt (`localStorage`) của bạn, không bị tải lên bất kỳ máy chủ nào.

---

## 🚀 Đẩy Code Lên GitHub & Sử Dụng Online (GitHub Pages / Vercel / Render)

Khi bạn đẩy code lên GitHub để chia sẻ hoặc sử dụng online:
- Bạn **không cần phải lo lắng về việc lộ khóa bí mật** hay tạo file `.env`.
- Bất kỳ ai truy cập vào trang web online của bạn đều có thể bấm nút **"Nhập API Key"** để sử dụng khóa API cá nhân của riêng họ.
- Ứng dụng hỗ trợ cả mô hình máy chủ Node.js Express lẫn gọi trực tiếp SDK Gemini từ trình duyệt (hoạt động 100% trên cả hosting tĩnh như GitHub Pages).

### Các bước đẩy lên GitHub:
```bash
git add .
git commit -m "Deploy VoiceStudio AI with direct API Key input"
git push origin main
```

---

## 🎙️ Tính năng nổi bật

1. **Text-to-Speech Biểu Cảm Đa Dạng**: 9 sắc thái cảm xúc (Truyền Cảm, Thời Sự, Hào Hứng, Tự Nhiên, Thì Thầm, Kịch Tính, Hùng Biện, Xúc Động, Hài Hước).
2. **Tổng Hợp Audio Tags (Thẻ Cảm Xúc & Ngữ Điệu)**: Hơn 24+ thẻ âm thanh biểu cảm (`<laugh>`, `<chuckle>`, `<gasp>`, `<sigh>`, `<breath>`, `<whisper>`), đệm lời (`|yeah|`, `|mhm|`, `|oh|`), và ngắt nghỉ (`[nghỉ 1.0s]`).
3. **Thư Viện Nhân Vật Giọng Đọc (Voice Personas)**: Hơn 14+ nhân vật giọng đọc nam/nữ đa phong cách (Podcast, Thời sự chuẩn VTV, Kể chuyện cổ tích, Review/TikTok, Điện ảnh, Hoạt hình).
4. **Dàn Bộ Lọc Âm Thanh Phòng Thu (Voice DSP Rack)**: Smart Noise Gate, De-Esser khử chói, 4-Band Parametric EQ, Broadcast Compressor, Analog Tube Saturation, Room Acoustics & Reverb.
5. **Xuất File Âm Thanh Đa Định Dạng**: WAV 24-bit Hi-Res Lossless, WAV 16-bit Broadcast, MP3 320/256/128 kbps, WebM Audio với tùy chọn chuẩn hóa âm lượng Peak -0.5 dB.

---

## 💻 Hướng Dẫn Chạy Cục Bộ (Local Development)

```bash
# 1. Cài đặt thư viện
npm install

# 2. Khởi chạy
npm run dev
```

Mở trình duyệt tại: `http://localhost:3000` và bấm nút **"Nhập API Key"** để bắt đầu sử dụng!
