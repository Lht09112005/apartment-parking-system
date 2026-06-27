import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const features = [
  {
    icon: "directions_car",
    title: "Quản lý phương tiện",
    description: "Theo dõi đăng ký xe, trạng thái duyệt và lịch sử ra vào tập trung.",
  },
  {
    icon: "local_parking",
    title: "Vận hành bãi đỗ",
    description: "Cập nhật sức chứa, phiên gửi xe và tình trạng từng khu vực theo thời gian thực.",
  },
  {
    icon: "shield",
    title: "An toàn & phân quyền",
    description: "Phân quyền theo vai trò, kiểm soát tài khoản và lưu vết mọi hoạt động quan trọng.",
  },
];

const roles = [
  { icon: "workspace_premium", title: "Super Admin", text: "Quản trị cấu hình, tài khoản, sao lưu và nhật ký toàn hệ thống." },
  { icon: "admin_panel_settings", title: "Ban quản lý", text: "Quản lý cư dân, phương tiện, phí gửi xe và báo cáo doanh thu." },
  { icon: "security", title: "Bảo vệ", text: "Xác nhận xe ra vào và theo dõi tình trạng bãi đỗ theo thời gian thực." },
  { icon: "home", title: "Cư dân", text: "Đăng ký phương tiện, theo dõi vé tháng và lịch sử gửi xe cá nhân." },
];

const workflow = [
  { icon: "app_registration", title: "Đăng ký", text: "Cư dân gửi hồ sơ phương tiện trực tuyến." },
  { icon: "fact_check", title: "Xét duyệt", text: "Ban quản lý kiểm tra và phê duyệt minh bạch." },
  { icon: "qr_code_scanner", title: "Vận hành", text: "Bảo vệ ghi nhận lượt xe vào và ra khỏi bãi." },
  { icon: "analytics", title: "Báo cáo", text: "Dữ liệu được tổng hợp thành báo cáo trực quan." },
];

const LandingPage = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="landing">
      <header className="landing__header">
        <Link className="landing__brand" to="/" aria-label="Trang chủ 39°C">
          <span className="landing__brand-mark">39°C</span>
          <span>
            <strong>Smart Parking</strong>
            <small>Trung tâm vận hành</small>
          </span>
        </Link>

        <nav className="landing__actions" aria-label="Điều hướng chính">
          <button className="landing__contact-button" onClick={scrollToContact}>
            Liên hệ
          </button>
          <Link className="landing__login-button" to="/login">
            Đăng nhập
            <span className="material-symbols-rounded">arrow_forward</span>
          </Link>
        </nav>
      </header>

      <section className="landing__hero">
        <div className="landing__hero-copy">
          <span className="landing__eyebrow">
            <i />
            Hệ thống đang trực tuyến
          </span>
          <h1>Giải pháp quản lý bãi đỗ xe thông minh cho khu dân cư hiện đại.</h1>
          <p>
            Một nền tảng thống nhất giúp ban quản lý, bảo vệ và cư dân phối hợp
            hiệu quả — từ đăng ký phương tiện đến kiểm soát vận hành và doanh thu.
          </p>
          <div className="landing__hero-actions">
            <Link className="landing__primary-cta" to="/login">
              Truy cập hệ thống
              <span className="material-symbols-rounded">login</span>
            </Link>
            <a className="landing__secondary-cta" href="#overview">
              Khám phá dự án
            </a>
          </div>
        </div>

        <div className="landing__visual" aria-label="Mô phỏng trung tâm vận hành">
          <div className="landing__visual-grid" />
          <div className="landing__status-card landing__status-card--main">
            <div className="landing__status-heading">
              <span className="material-symbols-rounded">space_dashboard</span>
              <div>
                <small>TỔNG QUAN VẬN HÀNH</small>
                <strong>Trung tâm 39°C</strong>
              </div>
              <i />
            </div>
            <div className="landing__status-stats">
              <div><strong>24/7</strong><span>Giám sát</span></div>
              <div><strong>04</strong><span>Vai trò</span></div>
              <div><strong>100%</strong><span>Trực tuyến</span></div>
            </div>
          </div>
          <div className="landing__floating-card landing__floating-card--top">
            <span className="material-symbols-rounded">verified_user</span>
            <div><strong>Bảo mật nhiều lớp</strong><small>Phân quyền rõ ràng</small></div>
          </div>
          <div className="landing__floating-card landing__floating-card--bottom">
            <span className="material-symbols-rounded">sync</span>
            <div><strong>Dữ liệu thời gian thực</strong><small>Luôn được đồng bộ</small></div>
          </div>
        </div>
      </section>

      <section className="landing__overview" id="overview">
        <div className="landing__section-heading">
          <span>GIÁ TRỊ CỐT LÕI</span>
          <h2>Mọi hoạt động trong một hệ thống duy nhất</h2>
          <p>Đơn giản hóa vận hành hằng ngày nhưng vẫn đảm bảo kiểm soát chặt chẽ.</p>
        </div>
        <div className="landing__feature-grid">
          {features.map((feature, index) => (
            <article className="landing__feature" key={feature.title}>
              <div className="landing__feature-number">0{index + 1}</div>
              <span className="material-symbols-rounded landing__feature-icon">
                {feature.icon}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing__roles">
        <div className="landing__section-heading landing__section-heading--left">
          <span>HỆ SINH THÁI NGƯỜI DÙNG</span>
          <h2>Mỗi vai trò có đúng công cụ mình cần</h2>
          <p>Giao diện và quyền truy cập được thiết kế riêng cho từng nhóm người dùng.</p>
        </div>
        <div className="landing__role-grid">
          {roles.map((role) => (
            <article className="landing__role" key={role.title}>
              <span className="material-symbols-rounded">{role.icon}</span>
              <div>
                <h3>{role.title}</h3>
                <p>{role.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing__workflow">
        <div className="landing__section-heading">
          <span>QUY TRÌNH KHÉP KÍN</span>
          <h2>Từ đăng ký đến báo cáo trong bốn bước</h2>
          <p>Mọi thay đổi đều được cập nhật tập trung và có thể truy vết khi cần.</p>
        </div>
        <div className="landing__workflow-grid">
          {workflow.map((step, index) => (
            <article className="landing__workflow-step" key={step.title}>
              <div className="landing__workflow-icon">
                <span className="material-symbols-rounded">{step.icon}</span>
                <b>{index + 1}</b>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing__platform">
        <div className="landing__platform-copy">
          <span>NỀN TẢNG VẬN HÀNH</span>
          <h2>Dữ liệu rõ ràng, quyết định nhanh hơn</h2>
          <p>
            Dashboard tập hợp các chỉ số quan trọng về cư dân, phương tiện,
            sức chứa và doanh thu để ban quản lý nắm tình hình ngay khi đăng nhập.
          </p>
          <ul>
            <li><span className="material-symbols-rounded">check_circle</span> Cập nhật dữ liệu gần thời gian thực</li>
            <li><span className="material-symbols-rounded">check_circle</span> Nhật ký hoạt động và lịch sử thay đổi</li>
            <li><span className="material-symbols-rounded">check_circle</span> Báo cáo doanh thu và phí gửi xe</li>
            <li><span className="material-symbols-rounded">check_circle</span> Sao lưu dữ liệu và cấu hình hệ thống</li>
          </ul>
        </div>
        <div className="landing__metric-board">
          <div className="landing__metric-board-head">
            <div><small>BÁO CÁO HỆ THỐNG</small><strong>Hiệu suất vận hành</strong></div>
            <span>Tháng này</span>
          </div>
          <div className="landing__metric-row">
            <div><small>Phương tiện</small><strong>1.284</strong><em>+8,4%</em></div>
            <div><small>Lượt ra vào</small><strong>8.936</strong><em>+12,1%</em></div>
          </div>
          <div className="landing__chart" aria-label="Biểu đồ hiệu suất minh họa">
            {[45, 62, 54, 76, 68, 88, 82, 96].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="landing__chart-labels"><span>Tuần 1</span><span>Tuần 2</span><span>Tuần 3</span><span>Tuần 4</span></div>
        </div>
      </section>

      <section className="landing__trust">
        <div><strong>24/7</strong><span>Theo dõi vận hành</span></div>
        <div><strong>4</strong><span>Nhóm người dùng</span></div>
        <div><strong>8+</strong><span>Phân hệ nghiệp vụ</span></div>
        <div><strong>1</strong><span>Nền tảng thống nhất</span></div>
      </section>

      <section className="landing__contact" id="contact">
        <div>
          <span>LIÊN HỆ DỰ ÁN</span>
          <h2>Cần hỗ trợ hoặc muốn tìm hiểu thêm?</h2>
          <p>Đội ngũ kỹ thuật sẵn sàng đồng hành cùng quá trình vận hành hệ thống.</p>
        </div>
        <a href="mailto:support@39c.vn">
          <span className="material-symbols-rounded">mail</span>
          support@39c.vn
        </a>
      </section>

      <footer className="landing__footer">
        <span>© 2026 39°C Smart Parking System</span>
        <span>Vận hành an toàn · Kết nối thông minh</span>
      </footer>
    </main>
  );
};

export default LandingPage;
