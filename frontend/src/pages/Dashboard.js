import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const cards = stats
    ? [
        {
          label: "Tổng cư dân",
          value: stats.totalResidents,
          color: "#3b82f6",
          icon: "👥",
          trend: "+2% so với tháng trước"
        },
        {
          label: "Tổng xe đăng ký",
          value: stats.totalVehicles,
          color: "#10b981",
          icon: "🚗",
          trend: "+5% so với tháng trước"
        },
        {
          label: "Xe đang trong bãi",
          value: stats.activeSessions,
          color: "#f59e0b",
          icon: "🅿️",
          trend: "85% công suất"
        },
        {
          label: "Gói tháng còn hạn",
          value: stats.monthlyActive,
          color: "#8b5cf6",
          icon: "📅",
          trend: "Ổn định"
        },
      ]
    : [];

  return (
    <div style={styles.container}>
      <Sidebar />

      {/* Main Content */}
      <div style={styles.main}>
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={{margin: 0, fontSize: 20, color: '#1e293b'}}>Tổng quan hệ thống</h2>
            <div style={styles.onlineBadge}>
              <span style={styles.onlineDot}></span> System Online
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={{textAlign: 'right', marginRight: 12}}>
              <div style={{fontSize: 14, fontWeight: '600', color: '#1e293b'}}>Admin: {user?.username}</div>
              <div style={{fontSize: 12, color: '#64748b'}}>TRẠM ĐIỀU HÀNH TRUNG TÂM</div>
            </div>
            <div style={styles.avatar}>👤</div>
          </div>
        </div>

        {/* Content Body */}
        <div style={styles.contentBody}>
          <div style={styles.welcomeRow}>
            <h3 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>Chào buổi chiều, {user?.username}! 👋</h3>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>Dưới đây là tóm tắt hoạt động của bãi đỗ xe hôm nay.</p>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Đang tải dữ liệu...</div>
          ) : (
            <div style={styles.grid}>
              {cards.map((card, i) => (
                <div key={i} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={{ ...styles.iconContainer, backgroundColor: `${card.color}15`, color: card.color }}>
                      {card.icon}
                    </div>
                    <div style={styles.trendTag}>{card.trend}</div>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.cardLabel}>{card.label}</div>
                    <div style={{ ...styles.cardValue, color: '#0f172a' }}>
                      {card.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions or Recent Activity could go here */}
          <div style={{ marginTop: 32 }}>
            <h4 style={{ color: '#0f172a', marginBottom: 16 }}>Lối tắt nhanh</h4>
            <div style={{ display: 'flex', gap: 16 }}>
              {user?.role_id !== 1 && (
                <>
                  <button style={styles.quickActionBtn} onClick={() => navigate("/admin/residents")}>+ Thêm cư dân mới</button>
                  <button style={styles.quickActionBtn} onClick={() => navigate("/admin/vehicles")}>+ Đăng ký xe mới</button>
                </>
              )}
              <button style={{...styles.quickActionBtn, backgroundColor: '#fff', color: '#0f172a', border: '1px solid #e2e8f0'}}>Xuất báo cáo ngày</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: "flex", height: "100vh", backgroundColor: "#f1f5f9", fontFamily: "sans-serif" },
  sidebar: { width: 260, backgroundColor: "#0f172a", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0 },
  sidebarHeader: { padding: "30px 24px", borderBottom: "1px solid #1e293b" },
  sidebarTitle: { margin: 0, fontSize: 32, fontWeight: "900", color: "#34d399", letterSpacing: 1 },
  sidebarSubTitle: { margin: 0, fontSize: 13, color: "#94a3b8", marginTop: 4 },
  menuItems: { padding: "20px 0", flex: 1 },
  menuItem: { padding: "14px 24px", color: "#cbd5e1", cursor: "pointer", fontSize: 15, fontWeight: "500", transition: "0.2s" },
  menuItemActive: { backgroundColor: "#3b82f6", color: "#fff", borderLeft: "4px solid #93c5fd" },
  sidebarFooter: { padding: "24px", borderTop: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: 16 },
  emergencyBtn: { backgroundColor: "#1e293b", color: "#34d399", border: "1px solid #34d399", padding: "12px", borderRadius: 6, fontWeight: "bold", cursor: "pointer" },
  bottomLink: { color: "#94a3b8", fontSize: 14, cursor: "pointer", marginBottom: 8, padding: "8px 0", transition: "color 0.2s" },
  
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topHeader: { height: 70, backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 24 },
  onlineBadge: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#059669", fontWeight: "600", backgroundColor: "#ecfdf5", padding: "4px 12px", borderRadius: 20 },
  onlineDot: { width: 8, height: 8, backgroundColor: "#059669", borderRadius: "50%" },
  headerRight: { display: "flex", alignItems: "center" },
  avatar: { width: 40, height: 40, backgroundColor: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginLeft: 12 },
  
  contentBody: { flex: 1, padding: 30, overflowY: "auto" },
  welcomeRow: { marginBottom: 32 },
  
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 },
  card: { background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 16 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  iconContainer: { width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 },
  trendTag: { fontSize: 12, color: "#64748b", backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: 6 },
  cardBody: {},
  cardLabel: { fontSize: 14, color: "#64748b", fontWeight: "500", marginBottom: 4 },
  cardValue: { fontSize: 32, fontWeight: "700" },
  
  quickActionBtn: { backgroundColor: "#0f172a", color: "#fff", border: "none", padding: "12px 20px", borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 14, transition: "0.2s" },
};

export default Dashboard;
