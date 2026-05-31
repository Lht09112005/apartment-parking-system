import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/auth/login", { username, password });
      login(res.data.user, res.data.token);

      // Điều hướng theo role
      const role = res.data.user.role_name;
      if (role === "Super Admin") navigate("/admin/dashboard");
      else if (role === "Admin") navigate("/admin/dashboard");
      else if (role === "Security") navigate("/security");
      else navigate("/resident");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div style={styles.container}>
      {/* Left Branding Panel */}
      <div style={styles.leftPanel}>
        {/* Background decorative luxury green & gold shapes */}
        <div style={{
          position: "absolute",
          top: -100,
          left: -100,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.03)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          bottom: -80,
          right: -80,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(195, 154, 107, 0.05)", // gold/sand glow
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          top: "35%",
          right: "5%",
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.02)",
          pointerEvents: "none"
        }} />
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
          <div style={styles.brandContainer}>
            <h1 style={styles.brandLogo}>39°C</h1>
            <h2 style={styles.brandTitle}>Central Operations</h2>
            <p style={styles.brandSubtitle}>Intelligent Parking Management System</p>
          </div>
          <div style={styles.brandFooter}>
            <div style={styles.onlineStatus}>
               <span style={styles.onlineDot}></span> System Online - Secure Connection
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div style={styles.rightPanel}>
        <div style={styles.loginBox}>
          <h2 style={styles.loginTitle}>Welcome Back</h2>
          <p style={styles.loginSubtitle}>Please enter your credentials to access the system</p>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div style={styles.errorBox}>❌ {error}</div>}

            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? "AUTHENTICATING..." : "LOGIN TO SYSTEM"}
            </button>
          </form>

          <div style={styles.demoSection}>
            <p style={styles.demoTitle}>QUICK LOGIN (DEMO)</p>
            <div style={styles.demoButtons}>
              <button type="button" onClick={() => fillDemoAccount("superadmin", "123456")} style={styles.demoBtn}>👑 Super Admin</button>
              <button type="button" onClick={() => fillDemoAccount("admin", "123456")} style={styles.demoBtn}>🛠️ Admin</button>
              <button type="button" onClick={() => fillDemoAccount("security", "123456")} style={styles.demoBtn}>🛡️ Security</button>
              <button type="button" onClick={() => fillDemoAccount("resident", "123456")} style={styles.demoBtn}>🏠 Cư dân</button>
            </div>
          </div>
          
          <p style={styles.helpText}>Need help? Contact the IT Helpdesk at support@39c.vn</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "'Outfit', -apple-system, sans-serif",
    backgroundColor: "#FAF8F5",
  },
  leftPanel: {
    flex: 1,
    background: "linear-gradient(135deg, #3F5E4D 0%, #2A3F33 100%)", // Rich Forest Green Gradient
    color: "#FFFBF5",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "60px",
    position: "relative",
    overflow: "hidden",
  },
  brandContainer: {
    marginTop: "20%",
  },
  brandLogo: {
    fontSize: "90px",
    fontWeight: "900",
    margin: 0,
    color: "#FFFBF5", // Beautiful cream white logo
    letterSpacing: "4px",
    textShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  },
  brandTitle: {
    fontSize: "36px",
    fontWeight: "800",
    margin: "10px 0 16px 0",
    color: "#FFFBF5",
    letterSpacing: "1px",
  },
  brandSubtitle: {
    fontSize: "16px",
    color: "#FFF2E1",
    opacity: 0.9,
    lineHeight: "1.6",
    maxWidth: "400px",
    fontWeight: "500",
  },
  brandFooter: {
    marginBottom: "20px",
  },
  onlineStatus: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#FFF2E1",
    fontSize: "14px",
    fontWeight: "700",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: "8px 16px",
    borderRadius: "20px",
    alignSelf: "flex-start",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  onlineDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#6EE7B7", // Vibrant emerald dot
    borderRadius: "50%",
    boxShadow: "0 0 10px #6EE7B7",
  },
  rightPanel: {
    flex: 1,
    backgroundColor: "#FAF8F5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  loginBox: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#FFFFFF",
    padding: "50px",
    borderRadius: "24px",
    boxShadow: "0 12px 40px rgba(139, 115, 85, 0.04)", // Custom soft brown shadow
    border: "1px solid rgba(139, 115, 85, 0.08)",
  },
  loginTitle: {
    fontSize: "30px",
    fontWeight: "800",
    color: "#2D3327",
    margin: "0 0 8px 0",
  },
  loginSubtitle: {
    fontSize: "14px",
    color: "#9E826C",
    margin: "0 0 32px 0",
    fontWeight: "500",
  },
  formGroup: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "700",
    color: "#2D3327",
    fontSize: "12px",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "14px 18px",
    border: "2px solid #EAE5D9",
    borderRadius: "12px",
    fontSize: "15px",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    outline: "none",
    color: "#2D3327",
    backgroundColor: "#FFFBF5",
    fontFamily: "'Outfit', sans-serif",
  },
  button: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#3F5E4D", // Forest Green primary button
    color: "#FFFBF5",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "16px",
    letterSpacing: "1.5px",
    boxShadow: "0 4px 12px rgba(63, 94, 77, 0.15)",
    transition: "all 0.2s ease",
  },
  errorBox: {
    padding: "12px 16px",
    backgroundColor: "#FEE2E2",
    color: "#CD5C5C", // Terracotta red error text
    borderRadius: "12px",
    fontSize: "14px",
    marginBottom: "20px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid rgba(205, 92, 92, 0.2)",
  },
  demoSection: {
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "1px dashed #EAE5D9",
  },
  demoTitle: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#9E826C",
    letterSpacing: "1px",
    marginBottom: "14px",
    textAlign: "center",
  },
  demoButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  demoBtn: {
    padding: "8px 14px",
    backgroundColor: "#F1ECE4", // wood/beige background
    border: "1px solid #E4DDD3",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#5F504B",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  helpText: {
    textAlign: "center",
    fontSize: "13px",
    color: "#9E826C",
    marginTop: "32px",
    fontWeight: "500",
  }
};

export default Login;
