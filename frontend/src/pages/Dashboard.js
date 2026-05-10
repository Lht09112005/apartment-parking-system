import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "../api/axios";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        {
          label: "Tổng cư dân",
          value: stats.totalResidents,
          color: "#1a73e8",
          icon: "👥",
        },
        {
          label: "Tổng xe đăng ký",
          value: stats.totalVehicles,
          color: "#10b981",
          icon: "🚗",
        },
        {
          label: "Xe đang trong bãi",
          value: stats.activeSessions,
          color: "#f59e0b",
          icon: "🅿️",
        },
        {
          label: "Gói tháng còn hạn",
          value: stats.monthlyActive,
          color: "#7c3aed",
          icon: "📅",
        },
      ]
    : [];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <Navbar />
      <div style={{ padding: "24px" }}>
        <h3 style={{ marginBottom: 24 }}>Tổng quan hệ thống</h3>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div style={styles.grid}>
            {cards.map((card, i) => (
              <div key={i} style={styles.card}>
                <div style={{ fontSize: 36 }}>{card.icon}</div>
                <div style={{ ...styles.value, color: card.color }}>
                  {card.value}
                </div>
                <div style={styles.label}>{card.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: "24px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  value: {
    fontSize: 42,
    fontWeight: "700",
    margin: "8px 0 4px",
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
};

export default Dashboard;
