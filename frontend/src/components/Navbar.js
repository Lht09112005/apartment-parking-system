import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = {
    "Super Admin": [{ label: "Quản lý tài khoản", path: "/admin/users" }],
    Admin: [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "Cư dân", path: "/admin/residents" },
    ],
    Security: [{ label: "Check-in/out", path: "/security" }],
    Resident: [{ label: "Xe của tôi", path: "/resident" }],
  };

  const items = menuItems[user?.role_name] || [];

  return (
    <div style={styles.navbar}>
      <div style={styles.brand}>🅿️ Parking System</div>
      <div style={styles.menu}>
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              ...styles.menuItem,
              backgroundColor:
                location.pathname === item.path
                  ? "rgba(255,255,255,0.2)"
                  : "transparent",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={styles.right}>
        <span style={styles.username}>{user?.username}</span>
        <span style={styles.role}>{user?.role_name}</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

const styles = {
  navbar: {
    background: "#1a73e8",
    color: "#fff",
    padding: "0 24px",
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  brand: {
    fontWeight: "700",
    fontSize: 18,
    minWidth: 180,
  },
  menu: {
    display: "flex",
    gap: 4,
  },
  menuItem: {
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "500",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 180,
    justifyContent: "flex-end",
  },
  username: {
    fontWeight: "600",
    fontSize: 14,
  },
  role: {
    fontSize: 12,
    background: "rgba(255,255,255,0.2)",
    padding: "2px 8px",
    borderRadius: 10,
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #fff",
    color: "#fff",
    padding: "5px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
};

export default Navbar;
