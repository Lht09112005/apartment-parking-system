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
  const [pendingVehicles, setPendingVehicles] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get("/dashboard/stats");
      setStats(res.data);

      const vehRes = await axios.get("/vehicles");
      if (vehRes.data && Array.isArray(vehRes.data)) {
        const pending = vehRes.data.filter(v => v.status === "pending");
        setPendingVehicles(pending.slice(0, 3));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApprove = async (plate_number) => {
    try {
      await axios.put(`/vehicles/${plate_number}/approve`);
      fetchStats();
    } catch (err) {
      alert("Lỗi phê duyệt: " + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (plate_number) => {
    try {
      await axios.put(`/vehicles/${plate_number}/reject`);
      fetchStats();
    } catch (err) {
      alert("Lỗi từ chối: " + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useRealtimeRefresh(
    fetchStats,
    ["dashboard", "residents", "vehicles", "parkingSessions", "monthly"],
    { intervalMs: 10000 }
  );

  const cards = stats
    ? user?.role_id === 1
      ? [
        {
          label: "Admin & Super Admin hoạt động",
          value: stats.activeAdminCount ?? 0,
          color: "#ec4899",
          icon: <span className="material-symbols-rounded" style={{ fontSize: 24 }}>admin_panel_settings</span>,
          path: "/admin/users"
        },
        {
          label: "Số lượng logs trạng thái",
          value: stats.totalLogs ?? 0,
          color: "#f97316",
          icon: <span className="material-symbols-rounded" style={{ fontSize: 24 }}>receipt_long</span>,
          path: "/admin/audit"
        }
      ]
      : [
        {
          label: "Tổng cư dân",
          value: stats.totalResidents,
          color: "#3b82f6",
          icon: <span className="material-symbols-rounded" style={{ fontSize: 24 }}>group</span>
        },
        {
          label: "Tổng xe đăng ký",
          value: stats.totalVehicles,
          color: "#10b981",
          icon: <span className="material-symbols-rounded" style={{ fontSize: 24 }}>directions_car</span>
        },
        {
          label: "Xe đang trong bãi",
          value: stats.activeSessions,
          color: "#f59e0b",
          icon: <span className="material-symbols-rounded" style={{ fontSize: 24 }}>local_parking</span>
        },
        {
          label: "Gói tháng còn hạn",
          value: stats.monthlyActive,
          color: "#8b5cf6",
          icon: <span className="material-symbols-rounded" style={{ fontSize: 24 }}>event</span>
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
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: '800', color: '#2D3327' }}>Tổng quan</h2>
          </div>
          <div style={styles.headerRight}>
            <NotificationBell />
            <div style={{ textAlign: 'right', marginRight: 12, marginLeft: 16 }}>
              <div style={{ fontSize: 13, fontWeight: '700', color: '#2D3327' }}>{user?.username}</div>
              <div style={{ fontSize: 11, color: '#9E826C', fontWeight: "600" }}>
                {user?.role_id === 1 ? 'Super Admin' : 'Quản trị viên'}
              </div>
            </div>
            <div style={styles.avatar}>
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>grid_view</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={styles.contentBody}>
          <div style={styles.welcomeRow}>
            {/* Decorative radial lighting gradient */}
            <div style={{
              position: "absolute",
              top: "-50%",
              left: "-20%",
              width: "80%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%)",
              pointerEvents: "none"
            }} />

            <div style={{ position: "relative", zIndex: 2, flex: 1 }}>
              <div style={{
                fontSize: 12,
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#FFF2E1",
                opacity: 0.85,
                marginBottom: 8,
              }}>
                CHÀO BUỒI SÁNG · BAN QUẢN LÝ VINHOMES
              </div>
              <h3 style={{ margin: 0, fontSize: 26, fontWeight: '800', color: '#FFFBF5' }}>
                Xin chào, {user?.username}
              </h3>
              <p style={{ margin: '8px 0 0 0', color: '#FFF2E1', opacity: 0.9, fontSize: 14, lineHeight: "20px", maxWidth: "60%" }}>
                Hôm nay là một ngày tuyệt vời để vận hành bãi đỗ xe Eco-Green. <br />
                Thời tiết tại dự án: <span style={{ fontWeight: "700" }}>☀️ Nắng nhẹ, 28°C</span> · Tình trạng kết nối bãi đỗ xe: <span style={{ fontWeight: "700", color: "#6EE7B7" }}>● Ổn định</span>
              </p>
            </div>

            {/* Skyscapers Pure CSS graphics */}
            <div style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
              height: "100%",
              position: "absolute",
              bottom: 0,
              right: 40,
              opacity: 0.95,
              zIndex: 1,
              pointerEvents: "none"
            }}>
              {/* Tower 1 */}
              <div style={{
                width: 45,
                height: 120,
                backgroundColor: "rgba(255, 253, 245, 0.12)",
                borderRadius: "8px 8px 0 0",
                padding: "8px 6px",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 4,
                backdropFilter: "blur(1px)"
              }}>
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} style={{
                    backgroundColor: i % 3 === 0 ? "transparent" : "#FFFBF5",
                    opacity: i % 4 === 0 ? 0.2 : 0.8,
                    height: 6,
                    borderRadius: 1
                  }} />
                ))}
              </div>
              {/* Tower 2 */}
              <div style={{
                width: 55,
                height: 150,
                backgroundColor: "rgba(255, 253, 245, 0.2)",
                borderRadius: "10px 10px 0 0",
                padding: "10px 8px",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 4,
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                backdropFilter: "blur(2px)"
              }}>
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} style={{
                    backgroundColor: i % 5 === 0 ? "transparent" : "#FFFBF5",
                    opacity: i % 3 === 0 ? 0.3 : 0.9,
                    height: 7,
                    borderRadius: 1
                  }} />
                ))}
              </div>
              {/* Tower 3 */}
              <div style={{
                width: 40,
                height: 100,
                backgroundColor: "rgba(255, 253, 245, 0.08)",
                borderRadius: "6px 6px 0 0",
                padding: "6px 5px",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 4,
                backdropFilter: "blur(1px)"
              }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={{
                    backgroundColor: i % 2 === 0 ? "transparent" : "#FFFBF5",
                    opacity: i % 3 === 0 ? 0.15 : 0.7,
                    height: 6,
                    borderRadius: 1
                  }} />
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontWeight: "600" }}>Đang tải dữ liệu...</div>
          ) : (
            <div style={styles.grid}>
              {cards.map((card, i) => {
                const isClickable = !!card.path;
                return (
                  <div
                    key={i}
                    onClick={() => isClickable && navigate(card.path)}
                    style={{
                      ...styles.card,
                      cursor: isClickable ? "pointer" : "default",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (isClickable) {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 12px 30px rgba(139, 115, 85, 0.12)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isClickable) {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 8px 30px rgba(139, 115, 85, 0.04)";
                      }
                    }}
                  >
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
                );
              })}
            </div>
          )}

          {!loading && stats && user?.role_id !== 1 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
              marginTop: 24
            }}>
              {/* Left Panel: visual occupancy */}
              <div style={{
                backgroundColor: "#FFFBF5",
                borderRadius: 20,
                padding: 24,
                border: "1px solid rgba(139, 115, 85, 0.08)",
                boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)"
              }}>
                <h3 style={{ margin: "0 0 20px 0", color: "#2D3327", fontSize: 15, fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center" }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, marginRight: 8 }}>bar_chart</span> Công suất & Hoạt động Hầm đỗ
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: "700", color: "#2D3327", marginBottom: 8 }}>
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 16, marginRight: 6 }}>directions_car</span> Bãi đỗ Ô tô (Tầng B1)
                      </span>
                      <span>
                        {Math.min(100, Math.round((stats.activeSessions || 0) * 0.4))} / 100 xe ({Math.min(100, Math.round((stats.activeSessions || 0) * 0.4)) * 1}%)
                      </span>
                    </div>
                    <div style={{ height: 10, backgroundColor: "#EAE5D9", borderRadius: 5, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min(100, Math.round((stats.activeSessions || 0) * 0.4))}%`,
                        backgroundColor: Math.round((stats.activeSessions || 0) * 0.4) > 85 ? "#CD5C5C" : "#3F5E4D",
                        borderRadius: 5,
                        transition: "width 0.4s ease-in-out"
                      }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: "700", color: "#2D3327", marginBottom: 8 }}>
                      <span style={{ display: "flex", alignItems: "center" }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 16, marginRight: 6 }}>two_wheeler</span> Bãi đỗ Xe máy (Tầng B2)
                      </span>
                      <span>
                        {Math.min(300, Math.round((stats.activeSessions || 0) * 0.6))} / 300 xe ({Math.round(Math.min(300, Math.round((stats.activeSessions || 0) * 0.6)) / 3)}%)
                      </span>
                    </div>
                    <div style={{ height: 10, backgroundColor: "#EAE5D9", borderRadius: 5, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.round(Math.min(300, Math.round((stats.activeSessions || 0) * 0.6)) / 3)}%`,
                        backgroundColor: Math.round((stats.activeSessions || 0) * 0.6) > 250 ? "#CD5C5C" : "#C39A6B",
                        borderRadius: 5,
                        transition: "width 0.4s ease-in-out"
                      }} />
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-around",
                    fontSize: 11,
                    fontWeight: "700",
                    color: "#64748b",
                    borderTop: "1px dashed #EAE5D9",
                    paddingTop: 16,
                    marginTop: 8
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#3F5E4D" }} /> Ô tô trống
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#C39A6B" }} /> Xe máy trống
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#CD5C5C" }} /> Quá tải (>85%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Pending approvals */}
              <div style={{
                backgroundColor: "#FFFBF5",
                borderRadius: 20,
                padding: 24,
                border: "1px solid rgba(139, 115, 85, 0.08)",
                boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)",
                display: "flex",
                flexDirection: "column"
              }}>
                <h3 style={{ margin: "0 0 20px 0", color: "#2D3327", fontSize: 15, fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center" }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, marginRight: 8 }}>pending</span> Phê duyệt phương tiện nhanh
                </h3>

                {pendingVehicles.length === 0 ? (
                  <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "32px 16px",
                    textAlign: "center",
                    border: "2px dashed #EAE5D9",
                    borderRadius: 16,
                    backgroundColor: "rgba(139, 115, 85, 0.01)"
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 48, marginBottom: 12, color: "#10b981" }}>celebration</span>
                    <strong style={{ fontSize: 14, color: "#3F5E4D" }}>Tuyệt vời!</strong>
                    <span style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      Không có yêu cầu đăng ký xe nào đang chờ phê duyệt.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                    {pendingVehicles.map((v) => (
                      <div key={v.plate_number} style={{
                        padding: 12,
                        borderRadius: 12,
                        border: "1.5px solid rgba(139, 115, 85, 0.12)",
                        backgroundColor: "#FFFBF5",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{
                            fontSize: 14,
                            fontWeight: "800",
                            color: "#2D3327",
                            fontFamily: "monospace",
                            border: "1.5px solid #2D3327",
                            borderRadius: 6,
                            padding: "2px 8px",
                            backgroundColor: "#FFFBF5"
                          }}>
                            {v.plate_number}
                          </span>
                          <span style={{
                            backgroundColor: "#F1ECE4",
                            color: "#5F504B",
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontWeight: "700"
                          }}>
                            {v.type_name}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Chủ xe: <strong>{v.resident_name || "—"}</strong> · CH: {v.apartment_number}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          <button
                            onClick={() => handleApprove(v.plate_number)}
                            style={{
                              flex: 1,
                              padding: "6px 12px",
                              backgroundColor: "#3F5E4D",
                              color: "#FFFBF5",
                              border: "none",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(v.plate_number)}
                            style={{
                              flex: 1,
                              padding: "6px 12px",
                              backgroundColor: "#CD5C5C",
                              color: "#FFFBF5",
                              border: "none",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: "700",
                              cursor: "pointer"
                            }}
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: "flex", height: "100vh", backgroundColor: "#FAF8F5", fontFamily: "'Outfit', -apple-system, sans-serif" },

  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topHeader: {
    height: 64,
    backgroundColor: "#FFFBF5",
    borderBottom: "1px solid rgba(139, 115, 85, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    flexShrink: 0,
  },
  headerRight: { display: "flex", alignItems: "center" },
  avatar: {
    width: 36,
    height: 36,
    backgroundColor: "#3F5E4D",
    color: "#FFFBF5",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: "700",
    boxShadow: "0 4px 10px rgba(63, 94, 77, 0.15)",
  },

  contentBody: { flex: 1, padding: 24, overflowY: "auto" },
  welcomeRow: { marginBottom: 24, padding: "28px 32px", borderRadius: 20, backgroundColor: "#3F5E4D", color: "#FFFBF5", boxShadow: "0 10px 30px rgba(63, 94, 77, 0.15)", position: "relative", overflow: "hidden" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 },
  card: {
    background: "#FFFBF5",
    borderRadius: 20,
    padding: 24,
    border: "1px solid rgba(139, 115, 85, 0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)"
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  iconContainer: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 },
  cardLabel: { fontSize: 12, color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 },
  cardValue: { fontSize: 32, fontWeight: "800", color: "#2D3327" },
};

export default Dashboard;

