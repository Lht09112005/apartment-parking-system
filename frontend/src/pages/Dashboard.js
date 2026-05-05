import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>🅿️ Hệ thống Quản lý Bãi Đỗ Xe</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Đăng xuất
        </button>
      </div>
      <div style={styles.content}>
        <h3>Xin chào, {user?.username}!</h3>
        <p>
          Role: <strong>{user?.role_name}</strong>
        </p>
        <p>Trang dashboard đang được phát triển...</p>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f0f2f5" },
  header: {
    background: "#1a73e8",
    color: "#fff",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #fff",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  content: {
    padding: "32px",
  },
};

export default Dashboard;
