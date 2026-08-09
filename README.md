# Giải tích Trực quan

Ứng dụng web tiếng Việt hỗ trợ khám phá đạo hàm, nguyên hàm, tích phân xác định, khai triển chuỗi và đồ thị 2D/3D ngay trong trình duyệt.

**Dùng trực tuyến:** [nguyencunghoangnam.github.io/giai-tich-truc-quan](https://nguyencunghoangnam.github.io/giai-tich-truc-quan/)

## Nguồn gốc và quyền Việt hóa

Dự án này là bản Việt hóa và điều chỉnh từ [Calculus Suite Pro](https://github.com/ibrahimalee/Calculus-Suite), do Ibrahemeogoblin phát hành theo giấy phép MIT.

Giấy phép MIT cho phép sử dụng, sao chép, sửa đổi và phân phối phần mềm, bao gồm việc tạo và phát hành bản dịch, với điều kiện giữ lại thông báo bản quyền và nội dung giấy phép. File [`LICENSE`](LICENSE) trong repository này được giữ nguyên từ dự án gốc.

Những thay đổi của bản tiếng Việt:

- Việt hóa giao diện, thông báo lỗi, kết quả và hướng dẫn từng bước.
- Đổi tên hiển thị thành **Giải tích Trực quan**.
- Bổ sung cảnh báo rõ ràng cho các chức năng còn ở mức thử nghiệm.
- Sửa thao tác chuyển tab để không phụ thuộc vào biến sự kiện toàn cục của trình duyệt.
- Bổ sung ghi công nguồn gốc và liên kết giấy phép ngay trên giao diện.
- Bổ sung hồ sơ giấy phép của các thư viện bên thứ ba.

## Tính năng

- Đạo hàm cấp một và cấp hai.
- Nguyên hàm và tích phân xác định.
- Tính gần đúng bằng quy tắc Simpson.
- Khai triển Taylor và Maclaurin.
- Đạo hàm riêng và vectơ gradient.
- Đồ thị hàm một biến và mặt 3D hai biến.
- Giao diện sáng/tối và tự động lưu biểu thức gần nhất.

> [!WARNING]
> Chế độ phương trình vi phân chưa có bộ giải hoàn chỉnh. Các phép phân kỳ, độ xoáy và tích phân kép vẫn ở mức thử nghiệm. Không nên dùng kết quả từ các phần này làm đáp án chính thức nếu chưa kiểm chứng độc lập.

## Chạy ứng dụng

Ứng dụng là một website tĩnh, không cần cài đặt:

1. Tải repository về máy.
2. Mở `index.html` hoặc `CalculusSuite.html` bằng trình duyệt hiện đại.
3. Kết nối Internet để tải Math.js, Plotly.js và Algebrite từ CDN.

## Triển khai trên GitHub Pages

Trong repository GitHub, mở **Settings → Pages**, chọn triển khai từ nhánh `main` và thư mục gốc `/`.

## Thư viện bên thứ ba

Ứng dụng sử dụng Math.js, Plotly.js và Algebrite. Phiên bản và giấy phép được ghi tại [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Giấy phép

Phần mềm được phân phối theo giấy phép MIT. Xem [`LICENSE`](LICENSE).

Bản Việt hóa giữ nguyên quyền tác giả của dự án gốc. Việc ghi tên người Việt hóa không thay thế hoặc làm mất quyền của tác giả ban đầu.
