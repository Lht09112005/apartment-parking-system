import React, { useCallback, useEffect, useState } from "react";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NotificationBell from "../components/NotificationBell";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get("/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // axios
    //   .get("/dashboard/stats")
    //   .then((res) => setStats(res.data))
    //   .catch((err) => console.error(err))
    //   .finally(() => setLoading(false));
    fetchStats();
  }, [fetchStats]);

  useRealtimeRefresh(
    fetchStats,
    ["dashboard", "residents", "vehicles", "parkingSessions", "monthly"],
    { intervalMs: 10000 }
  );

  const cards = stats
    ? [
        {
          label: "Tổng cư dân",
          value: stats.totalResidents,
          color: "#3b82f6",
          icon: "👥"
        },
        {
          label: "Tổng xe đăng ký",
          value: stats.totalVehicles,
          color: "#10b981",
          icon: "🚗"
        },
        {
          label: "Xe đang trong bãi",
          value: stats.activeSessions,
          color: "#f59e0b",
          icon: "🅿️"
        },
        {
          label: "Gói tháng còn hạn",
          value: stats.monthlyActive,
          color: "#8b5cf6",
          icon: "📅"
        },
      ]
    : [];

  return (
    <div style={styles.container}>
      <Sidebar />

      <div style={styles.main}>
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div>
            <h2 style={{margin: 0, fontSize: 18, fontWeight: '600', color: '#202124'}}>Tổng quan</h2>
          </div>
          <div style={styles.headerRight}>
            <NotificationBell />
            <div style={{textAlign: 'right', marginRight: 12, marginLeft: 16}}>
              <div style={{fontSize: 13, fontWeight: '500', color: '#202124'}}>{user?.username}</div>
              <div style={{fontSize: 11, color: '#5f6368'}}>
                {user?.role_id === 1 ? 'Super Admin' : 'Quản trị viên'}
              </div>
            </div>
            <div style={styles.avatar}>
              {(user?.username || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={styles.contentBody}>
          <div style={styles.welcomeRow}>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: '600', color: '#202124' }}>
              Xin chào, {user?.username}
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#5f6368', fontSize: 14 }}>
              Tóm tắt hoạt động bãi đỗ xe hôm nay.
            </p>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#5f6368" }}>Đang tải dữ liệu...</div>
          ) : (
            <div style={styles.grid}>
              {cards.map((card, i) => (
                <div key={i} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={{ ...styles.iconContainer, backgroundColor: `${card.color}12`, color: card.color }}>
                      {card.icon}
                    </div>
                  </div>
                  <div>
                    <div style={styles.cardLabel}>{card.label}</div>
                    <div style={styles.cardValue}>
                      {card.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 32 }}>
            <h4 style={{ color: '#202124', marginBottom: 16, fontSize: 15, fontWeight: '600' }}>Lối tắt</h4>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {user?.role_id === 1 ? (
                <>
                  <button style={styles.quickActionBtn} onClick={() => navigate("/admin/users")}>Quản lý Admin</button>
                  <button style={styles.quickActionBtn} onClick={() => navigate("/admin/backup")}>Quản lý Dữ liệu</button>
                  <button style={styles.quickActionBtn} onClick={() => navigate("/admin/audit")}>Nhật ký kiểm toán</button>
                  <button style={styles.quickActionBtn} onClick={() => navigate("/admin/settings")}>Cấu hình hệ thống</button>
                </>
              ) : (
                <>
                  <button style={styles.quickActionBtn} onClick={() => navigate("/admin/residents")}>Quản lý Cư dân</button>
                  <button style={styles.quickActionBtn} onClick={() => navigate("/admin/vehicles")}>Quản lý Xe cộ</button>
                  <button style={styles.quickActionBtn} onClick={() => navigate("/admin/users")}>Quản lý Bảo vệ</button>
                  <button style={styles.quickActionBtn} onClick={() => navigate("/admin/monthly")}>Duyệt vé tháng</button>
                  <button style={styles.quickActionBtn} onClick={() => navigate("/admin/fees")}>Phí gửi xe</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: "flex", height: "100vh", backgroundColor: "#f8f9fa", fontFamily: "'Segoe UI', -apple-system, sans-serif" },

  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topHeader: {
    height: 56,
    backgroundColor: "#fff",
    borderBottom: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    flexShrink: 0,
  },
  headerRight: { display: "flex", alignItems: "center" },
  avatar: {
    width: 32,
    height: 32,
    backgroundColor: "#e8f0fe",
    color: "#1a73e8",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: "600",
  },

  contentBody: { flex: 1, padding: 24, overflowY: "auto" },
  welcomeRow: { marginBottom: 24 },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    border: "1px solid #e0e0e0",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  iconContainer: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  cardLabel: { fontSize: 13, color: "#5f6368", fontWeight: "500", marginBottom: 4 },
  cardValue: { fontSize: 28, fontWeight: "600", color: "#202124" },

  quickActionBtn: {
    backgroundColor: "#1a73e8",
    color: "#fff",
    border: "none",
    padding: "9px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "500",
    fontSize: 13,
  },
};

export default Dashboard;

