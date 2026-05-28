import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "../api/axios";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [systemName, setSystemName] = useState("Smart Parking");
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const fetchSystemName = async () => {
      try {
        const res = await axios.get("/settings");
        if (res.data && res.data.system_name) {
          setSystemName(res.data.system_name);
          document.title = res.data.system_name;
        }
      } catch (err) {
        console.error("Lỗi lấy tên hệ thống", err);
      }
    };
    
    fetchSystemName();

    window.addEventListener('settingsUpdated', fetchSystemName);
    return () => {
      window.removeEventListener('settingsUpdated', fetchSystemName);
    };
  }, []);

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      logout();
      navigate("/login");
    }
  };

  const isActive = (path) => location.pathname === path;

  // Đóng sidebar khi chuyển trang trên mobile
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const menuItems = user?.role_id === 1
    ? [
        { label: "Tổng quan", icon: "grid_view", path: "/admin/dashboard" },
        { label: "Quản lý Admin", icon: "admin_panel_settings", path: "/admin/users" },
        { label: "Quản lý Dữ liệu", icon: "cloud_upload", path: "/admin/backup" },
        { label: "Nhật ký kiểm toán", icon: "history", path: "/admin/audit" },
        { label: "Cấu hình hệ thống", icon: "settings", path: "/admin/settings" },
      ]
    : [
        { label: "Tổng quan", icon: "grid_view", path: "/admin/dashboard" },
        { label: "Quản lý Cư dân", icon: "apartment", path: "/admin/residents" },
        { label: "Quản lý Xe cộ", icon: "directions_car", path: "/admin/vehicles" },
        { label: "Quản lý Bảo vệ", icon: "shield_person", path: "/admin/users" },
        { label: "Duyệt vé tháng", icon: "calendar_month", path: "/admin/monthly" },
        { label: "Phí gửi xe", icon: "payments", path: "/admin/fees" },
      ];

  return (
    <>
      <link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Rounded" rel="stylesheet" />
      <style>{`
        .material-symbols-rounded {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        @media (max-width: 768px) {
          .mobile-hamburger { display: flex !important; }
          .sidebar-container { 
            position: fixed !important;
            z-index: 1000 !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
          }
          .sidebar-container.open {
            transform: translateX(0) !important;
          }
          .sidebar-overlay.open {
            display: block !important;
          }
          .main > div:first-child, .top-header {
            padding-left: 60px !important;
          }
        }
      `}</style>

      {/* Hamburger Button */}
      <div 
        className="mobile-hamburger" 
        style={{
          display: 'none', 
          position: 'fixed', top: 15, left: 15, zIndex: 998, 
          background: '#fff', border: '1px solid #e0e0e0', padding: 8, 
          borderRadius: 8, cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}
        onClick={() => setIsMobileOpen(true)}
      >
        <span className="material-symbols-rounded" style={{ color: '#202124' }}>menu</span>
      </div>

      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`}
        style={{
          display: 'none',
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
        }}
        onClick={() => setIsMobileOpen(false)}
      />

      <div className={`sidebar-container ${isMobileOpen ? 'open' : ''}`} style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>P</div>
            <div>
              <div style={styles.sidebarTitle} title={systemName}>
                {systemName.length > 16 ? systemName.substring(0, 16) + '…' : systemName}
              </div>
              <div style={styles.sidebarSubTitle}>
                {user?.role_id === 1 ? "Super Admin" : "Quản trị viên"}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.menuSection}>
          <div style={styles.menuLabel}>MENU</div>
          {menuItems.map((item, index) => {
            const active = isActive(item.path);
            const hovered = hoveredIndex === index;
            return (
              <div
                key={index}
                style={{
                  ...styles.menuItem,
                  ...(active ? styles.menuItemActive : {}),
                  ...(hovered && !active ? styles.menuItemHover : {}),
                }}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span className="material-symbols-rounded" style={{
                  fontSize: 20,
                  color: active ? '#1a73e8' : '#5f6368',
                }}>
                  {item.icon}
                </span>
                <span style={{
                  color: active ? '#1a73e8' : '#3c4043',
                  fontWeight: active ? '600' : '400',
                }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        <div style={styles.sidebarFooter}>
          <div style={styles.userCard}>
            <div style={styles.userAvatar}>
              {(user?.username || "A").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.userName}>{user?.username}</div>
              <div style={styles.userRole}>
                {user?.role_id === 1 ? "Super Admin" : "Admin"}
              </div>
            </div>
          </div>
          <div
            style={styles.logoutBtn}
            onClick={handleLogout}
            onMouseEnter={e => e.target.style.backgroundColor = '#fce8e6'}
            onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#c5221f' }}>logout</span>
            <span style={{ color: '#c5221f' }}>Đăng xuất</span>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  sidebar: {
    width: 256,
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    height: "100vh",
    borderRight: "1px solid #e0e0e0",
  },
  sidebarHeader: {
    padding: "20px 20px 16px",
    borderBottom: "1px solid #f0f0f0",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a73e8",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: "700",
    flexShrink: 0,
  },
  sidebarTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: "600",
    color: "#202124",
    lineHeight: "20px",
  },
  sidebarSubTitle: {
    margin: 0,
    fontSize: 12,
    color: "#5f6368",
    lineHeight: "16px",
  },
  menuSection: {
    padding: "12px 12px",
    flex: 1,
    overflowY: "auto",
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#5f6368",
    letterSpacing: "0.8px",
    padding: "8px 12px 8px",
    marginBottom: 2,
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    transition: "background-color 0.15s",
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: "#e8f0fe",
  },
  menuItemHover: {
    backgroundColor: "#f5f5f5",
  },
  sidebarFooter: {
    padding: "12px",
    borderTop: "1px solid #f0f0f0",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    backgroundColor: "#e8f0fe",
    color: "#1a73e8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#202124",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userRole: {
    fontSize: 11,
    color: "#5f6368",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "500",
    transition: "background-color 0.15s",
  },
};

export default Sidebar;
