# Hệ thống quản lý bãi đỗ xe chung cư

Ứng dụng web hỗ trợ quản lý phương tiện, cư dân, lượt xe ra/vào và vé gửi xe tháng tại chung cư. Hệ thống gồm giao diện React, REST API viết bằng Express và cơ sở dữ liệu MySQL.

## Chức năng chính

- Phân quyền theo 4 vai trò: Super Admin, Admin, Security và Resident.
- Quản lý tài khoản, cư dân, nhân viên bảo vệ và trạng thái khóa tài khoản.
- Quản lý phương tiện, loại xe, khu vực đỗ và sức chứa.
- Ghi nhận xe vào/ra, lịch sử gửi xe và tính phí.
- Đăng ký, phê duyệt và theo dõi vé gửi xe tháng.
- Dashboard thống kê, báo cáo doanh thu và tình trạng an ninh.
- Thông báo trong hệ thống; tự động nhắc vé tháng sắp hết hạn lúc 08:00 hằng ngày.
- Quản lý mức phí, chế độ bảo trì và các thiết lập hệ thống.
- Nhật ký hoạt động, sao lưu và khôi phục dữ liệu.
- Cập nhật dữ liệu giao diện theo thời gian thực.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, React Router, Axios, SweetAlert2 |
| Backend | Node.js, Express, JWT, bcrypt, node-cron |
| Database | MySQL, mysql2 |

## Cấu trúc thư mục

```text
.
├── backend/
│   ├── config/          # Kết nối MySQL và cấu hình JWT
│   ├── controllers/     # Xử lý nghiệp vụ API
│   ├── middleware/      # Xác thực, bảo trì và realtime
│   ├── routes/          # Khai báo REST API
│   ├── services/        # Dịch vụ thông báo
│   ├── utils/           # Cron job, audit log và chuẩn hóa biển số
│   └── server.js        # Điểm khởi chạy backend
├── database/
│   ├── schema.sql       # Khởi tạo database và bảng
│   └── seed.sql         # Dữ liệu mẫu
└── frontend/
    ├── public/
    └── src/
        ├── api/         # Cấu hình Axios
        ├── components/
        ├── context/     # Trạng thái xác thực
        ├── hooks/
        └── pages/
```

## Yêu cầu

- Node.js 18 trở lên và npm.
- MySQL 8 trở lên.
- MySQL CLI nếu chạy các lệnh khởi tạo bên dưới.
- `mysqldump` và `mysql` có trong biến `PATH` nếu sử dụng chức năng sao lưu/khôi phục.

## Cài đặt

### 1. Khởi tạo cơ sở dữ liệu

Từ thư mục gốc của dự án, chạy:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

`schema.sql` tạo database mặc định là `parking_db`. `seed.sql` bổ sung vai trò, tài khoản và dữ liệu minh họa.

### 2. Cấu hình và chạy backend

```bash
cd backend
npm install
```

Tạo file `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=parking_db
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

Sau đó khởi chạy:

```bash
npm run dev
```

API mặc định hoạt động tại `http://localhost:5000`.

> Lưu ý: chức năng sao lưu hiện đọc mật khẩu từ biến `DB_PASS`. Nếu cần dùng chức năng này, hãy thêm `DB_PASS` với cùng giá trị như `DB_PASSWORD` vào file `.env`.

### 3. Cấu hình và chạy frontend

Mở terminal khác:

```bash
cd frontend
npm install
```

Tạo file `frontend/.env` nếu backend không chạy tại địa chỉ mặc định:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Khởi chạy giao diện:

```bash
npm start
```

Ứng dụng mặc định mở tại `http://localhost:3000`.

## Tài khoản mẫu

Dữ liệu trong `database/seed.sql` cung cấp các tài khoản sau:

| Vai trò | Tên đăng nhập |
| --- | --- |
| Super Admin | `superadmin` |
| Admin | `admin` |
| Security | `security` |
| Resident | `resident` |

Mật khẩu trong file seed được lưu dưới dạng bcrypt hash và không được công bố trong dự án. Hãy đặt lại mật khẩu bằng chức năng quản trị hoặc thay hash trong dữ liệu seed trước khi sử dụng. Chỉ dùng các tài khoản này cho môi trường phát triển.

## Phân quyền

- **Super Admin:** quản lý Admin, thiết lập hệ thống, nhật ký hoạt động và sao lưu dữ liệu.
- **Admin:** quản lý cư dân, phương tiện, bảo vệ, phí gửi xe, khu vực đỗ, vé tháng và báo cáo.
- **Security:** ghi nhận và giám sát xe vào/ra.
- **Resident:** xem phương tiện, thông tin gửi xe và thông báo cá nhân.

## Các lệnh thường dùng

### Backend

```bash
npm start       # Chạy bằng Node.js
npm run dev     # Chạy với nodemon
```

### Frontend

```bash
npm start       # Chạy môi trường phát triển
npm test        # Chạy kiểm thử
npm run build   # Tạo bản build production
```

## API

Các nhóm endpoint chính đều có tiền tố `/api`:

- `/auth`
- `/users`
- `/residents`
- `/vehicles`
- `/parking`
- `/dashboard`
- `/settings`
- `/audit`
- `/backup`
- `/notifications`
- `/realtime`

Các endpoint được bảo vệ yêu cầu JWT trong header:

```http
Authorization: Bearer <token>
```

## Ghi chú về migration

Các file `backend/migrate*.js` và `database/add_failed_attempts_to_users.sql` dùng để nâng cấp cơ sở dữ liệu cũ. Khi cài mới bằng `database/schema.sql`, cấu trúc chính đã bao gồm các thay đổi hiện tại nên không cần chạy toàn bộ migration.

## Xử lý lỗi thường gặp

- **Backend không kết nối được MySQL:** kiểm tra MySQL đang chạy và các biến `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- **Frontend không gọi được API:** kiểm tra `REACT_APP_API_URL`, sau đó khởi động lại frontend.
- **Lỗi sao lưu/khôi phục:** kiểm tra `DB_PASS` và bảo đảm lệnh `mysql`, `mysqldump` truy cập được từ terminal.
- **Cổng đang được sử dụng:** đổi `PORT` của backend hoặc cổng chạy frontend.

## Bảo mật khi triển khai

- Thay `JWT_SECRET` bằng chuỗi bí mật mạnh.
- Không commit các file `.env`.
- Thay toàn bộ mật khẩu mẫu.
- Chỉ cho phép CORS từ domain frontend được tin cậy.
- Sử dụng HTTPS và tài khoản MySQL có quyền tối thiểu cần thiết.
