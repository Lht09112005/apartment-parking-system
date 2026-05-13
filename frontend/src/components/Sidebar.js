import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = user?.role_id === 1
    ? [
        { label: "👤 Quản lý Admin", path: "/admin/users" },
        { label: "⚙️ Cấu hình hệ thống", path: "/admin/settings" },
        { label: "📊 Báo cáo tổng hợp", path: "/admin/dashboard" },
      ]
    : [
        { label: "📊 Tổng quan", path: "/admin/dashboard" },
        { label: "🏠 Quản lý Cư dân", path: "/admin/residents" },
        { label: "🚗 Quản lý Xe cộ", path: "/admin/vehicles" },
        { label: "👮 Quản lý Bảo vệ", path: "/admin/users" },
        { label: "📋 Duyệt vé tháng", path: "/admin/monthly" },
        { label: "💰 Cài đặt Phí gửi xe", path: "/admin/fees" },
      ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <h2 style={styles.sidebarTitle}>39°C</h2>
        <p style={styles.sidebarSubTitle}>
          {user?.role_id === 1 ? "Super Admin Portal" : "Admin Control Center"}
        </p>
      </div>
      <div style={styles.menuItems}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            style={{ ...styles.menuItem, ...(isActive(item.path) ? styles.menuItemActive : {}) }}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </div>
        ))}
      </div>
      <div style={styles.sidebarFooter}>
        <button style={styles.emergencyBtn}>HỆ THỐNG AN TOÀN</button>
        <div style={{ marginTop: 'auto' }}>
          <div style={styles.bottomLink} onClick={handleLogout}>Đăng xuất</div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  sidebar: { width: 260, backgroundColor: "#0f172a", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh" },
  sidebarHeader: { padding: "30px 24px", borderBottom: "1px solid #1e293b" },
  sidebarTitle: { margin: 0, fontSize: 32, fontWeight: "900", color: "#34d399", letterSpacing: 1 },
  sidebarSubTitle: { margin: 0, fontSize: 13, color: "#94a3b8", marginTop: 4 },
  menuItems: { padding: "20px 0", flex: 1 },
  menuItem: { padding: "14px 24px", color: "#cbd5e1", cursor: "pointer", fontSize: 15, fontWeight: "500", transition: "0.2s" },
  menuItemActive: { backgroundColor: "#3b82f6", color: "#fff", borderLeft: "4px solid #93c5fd" },
  sidebarFooter: { padding: "24px", borderTop: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: 16 },
  emergencyBtn: { backgroundColor: "#1e293b", color: "#34d399", border: "1px solid #34d399", padding: "12px", borderRadius: 6, fontWeight: "bold", cursor: "pointer" },
  bottomLink: { color: "#94a3b8", fontSize: 14, cursor: "pointer", marginBottom: 8, padding: "8px 0", transition: "color 0.2s" },
};

export default Sidebar;
