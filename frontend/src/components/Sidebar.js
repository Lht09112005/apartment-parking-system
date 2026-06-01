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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwdMessage, setPwdMessage] = useState({ type: "", text: "" });
  const [pwdLoading, setPwdLoading] = useState(false);

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
    if (window.__unsavedSettings__) {
      setPendingAction(() => () => setShowLogoutConfirm(true));
      setShowUnsavedConfirm(true);
    } else {
      setShowLogoutConfirm(true);
    }
  };

  const handleNavigate = (path) => {
    if (window.__unsavedSettings__) {
      setPendingAction(() => () => navigate(path));
      setShowUnsavedConfirm(true);
    } else {
      navigate(path);
    }
  };

  const confirmLeave = () => {
    window.__unsavedSettings__ = false;
    setShowUnsavedConfirm(false);
    if (pendingAction) pendingAction();
  };

  const isActive = (path) => location.pathname === path;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMessage({ type: "", text: "" });

    if (pwdForm.newPassword.length < 6) {
      setPwdMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMessage({ type: "error", text: "Mật khẩu mới và xác nhận mật khẩu không khớp." });
      return;
    }

    setPwdLoading(true);
    try {
      await axios.put("/auth/change-credentials", {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });

      setPwdMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      
      setTimeout(() => {
        setShowChangePasswordModal(false);
      }, 2000);
    } catch (err) {
      setPwdMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi khi đổi mật khẩu."
      });
    } finally {
      setPwdLoading(false);
    }
  };

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
                onClick={() => handleNavigate(item.path)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span className="material-symbols-rounded" style={{
                  fontSize: 20,
                  color: active ? '#FFFBF5' : 'rgba(255, 251, 245, 0.75)',
                }}>
                  {item.icon}
                </span>
                <span style={{
                  color: active ? '#FFFBF5' : 'rgba(255, 251, 245, 0.85)',
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
            style={{
              ...styles.logoutBtn,
              borderColor: "rgba(255, 251, 245, 0.2)",
              color: "#FFFBF5",
            }}
            onClick={() => {
              setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
              setPwdMessage({ type: "", text: "" });
              setShowChangePasswordModal(true);
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#FFFBF5' }}>lock</span>
            <span style={{ color: '#FFFBF5' }}>Đổi mật khẩu</span>
          </div>
          <div
            style={styles.logoutBtn}
            onClick={handleLogout}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 209, 209, 0.08)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#FFD1D1' }}>logout</span>
            <span style={{ color: '#FFD1D1' }}>Đăng xuất</span>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(45, 51, 39, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#FFFBF5",
            borderRadius: 20,
            width: "90%",
            maxWidth: 400,
            padding: 24,
            boxShadow: "0 20px 45px rgba(0,0,0,0.15)",
            fontFamily: "'Outfit', sans-serif",
            textAlign: "center"
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "rgba(205, 92, 92, 0.1)",
              color: "#CD5C5C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              margin: "0 auto 16px"
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 32 }}>logout</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", color: "#2D3327", fontSize: 18, fontWeight: "800" }}>ĐĂNG XUẤT HỆ THỐNG</h3>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 14, lineHeight: "20px" }}>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản lý bãi đỗ xe Vinhomes?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  navigate("/login");
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#CD5C5C",
                  color: "#FFFBF5",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#b04f4f"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#CD5C5C"}
              >
                Đăng xuất
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#F1ECE4",
                  color: "#5F504B",
                  border: "1px solid #E4DDD3",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnsavedConfirm && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(45, 51, 39, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#FFFBF5",
            borderRadius: 20,
            width: "90%",
            maxWidth: 400,
            padding: 24,
            boxShadow: "0 20px 45px rgba(0,0,0,0.15)",
            fontFamily: "'Outfit', sans-serif",
            textAlign: "center"
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              backgroundColor: "rgba(205, 92, 92, 0.1)", color: "#CD5C5C",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 16px"
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 32 }}>warning</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", color: "#2D3327", fontSize: 18, fontWeight: "800" }}>CÓ THAY ĐỔI CHƯA LƯU</h3>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 14, lineHeight: "20px" }}>
              Bạn có thay đổi cấu hình nhưng chưa lưu lại. Bạn có chắc chắn muốn rời khỏi trang này không? (Các thay đổi sẽ bị mất)
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={confirmLeave}
                style={{
                  flex: 1, padding: "10px 16px", backgroundColor: "#CD5C5C", color: "#FFFBF5", border: "none",
                  borderRadius: 10, fontSize: 14, fontWeight: "700", cursor: "pointer", transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#b04f4f"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#CD5C5C"}
              >
                Rời đi
              </button>
              <button
                onClick={() => {
                  setShowUnsavedConfirm(false);
                  setPendingAction(null);
                }}
                style={{
                  flex: 1, padding: "10px 16px", backgroundColor: "#F1ECE4", color: "#5F504B", border: "1px solid #E4DDD3",
                  borderRadius: 10, fontSize: 14, fontWeight: "700", cursor: "pointer"
                }}
              >
                Ở lại
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePasswordModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(45, 51, 39, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#FFFBF5",
            borderRadius: 20,
            width: "90%",
            maxWidth: 400,
            padding: 30,
            boxShadow: "0 20px 45px rgba(0,0,0,0.15)",
            fontFamily: "'Outfit', sans-serif"
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "rgba(63, 94, 77, 0.1)",
              color: "#3F5E4D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              margin: "0 auto 16px"
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 32 }}>lock</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", color: "#2D3327", fontSize: 18, fontWeight: "800", textAlign: "center" }}>ĐỔI MẬT KHẨU TÀI KHOẢN</h3>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 13, lineHeight: "18px", textAlign: "center" }}>
              Vui lòng nhập mật khẩu hiện tại và mật khẩu mới để thay đổi bảo mật.
            </p>

            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: 16 }}>
                <label style={modalStyles.label}>Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  required
                  style={modalStyles.input}
                  value={pwdForm.currentPassword}
                  onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={modalStyles.label}>Mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  style={modalStyles.input}
                  value={pwdForm.newPassword}
                  onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={modalStyles.label}>Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  style={modalStyles.input}
                  value={pwdForm.confirmPassword}
                  onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                />
              </div>

              {pwdMessage.text && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: "600",
                  marginBottom: 20,
                  backgroundColor: pwdMessage.type === "success" ? "#dcfce7" : "#fee2e2",
                  color: pwdMessage.type === "success" ? "#166534" : "#991b1b",
                  border: `1px solid ${pwdMessage.type === "success" ? "rgba(22, 101, 52, 0.1)" : "rgba(153, 27, 27, 0.1)"}`
                }}>
                  {pwdMessage.type === "success" ? "✅" : "❌"} {pwdMessage.text}
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    backgroundColor: "#3F5E4D",
                    color: "#FFFBF5",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: "700",
                    cursor: pwdLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(63, 94, 77, 0.15)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => { if(!pwdLoading) e.currentTarget.style.backgroundColor = "#2d4437" }}
                  onMouseLeave={(e) => { if(!pwdLoading) e.currentTarget.style.backgroundColor = "#3F5E4D" }}
                >
                  {pwdLoading ? "ĐANG XỬ LÝ..." : "Cập nhật"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    backgroundColor: "#F1ECE4",
                    color: "#5F504B",
                    border: "1px solid #E4DDD3",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  sidebar: {
    width: 256,
    backgroundColor: "#9E826C", // Warm Oak Wood
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    height: "100vh",
    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
  },
  sidebarHeader: {
    padding: "24px 20px 20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFBF5",
    color: "#3F5E4D", // Forest Green
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: "800",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  sidebarTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFBF5",
    lineHeight: "20px",
    letterSpacing: "0.5px",
  },
  sidebarSubTitle: {
    margin: 0,
    fontSize: 11,
    color: "#FFFBF5",
    opacity: 0.8,
    lineHeight: "16px",
    marginTop: 2,
    fontWeight: "600",
  },
  menuSection: {
    padding: "20px 0",
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFBF5",
    opacity: 0.65,
    letterSpacing: "1.2px",
    padding: "0 20px",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 20px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s ease-in-out",
    margin: "0 12px",
    color: "#FFFBF5",
    opacity: 0.85,
  },
  menuItemActive: {
    backgroundColor: "#3F5E4D", // Forest Green
    color: "#FFFBF5",
    fontWeight: "600",
    opacity: 1,
    boxShadow: "0 4px 16px rgba(63, 94, 77, 0.25)",
  },
  menuItemHover: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#FFFBF5",
    color: "#9E826C",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 0,
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFBF5",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userRole: {
    fontSize: 12,
    color: "#FFFBF5",
    opacity: 0.75,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "600",
    transition: "all 0.2s",
    color: "#FFD1D1",
    border: "1px solid rgba(255, 209, 209, 0.2)",
  },
};

const modalStyles = {
  label: {
    display: "block",
    marginBottom: 6,
    fontWeight: "700",
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "2px solid #EAE5D9",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    backgroundColor: "#FFFBF5",
    color: "#2D3327",
    fontFamily: "'Outfit', sans-serif"
  }
};

export default Sidebar;
