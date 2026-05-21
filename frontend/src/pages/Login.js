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
    fontFamily: "sans-serif",
  },
  leftPanel: {
    flex: 1,
    backgroundColor: "#0f172a",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "60px",
  },
  brandContainer: {
    marginTop: "20%",
  },
  brandLogo: {
    fontSize: "80px",
    fontWeight: "900",
    margin: 0,
    color: "#34d399",
    letterSpacing: "2px",
  },
  brandTitle: {
    fontSize: "32px",
    fontWeight: "bold",
    margin: "10px 0 20px 0",
    color: "#f8fafc",
  },
  brandSubtitle: {
    fontSize: "18px",
    color: "#94a3b8",
    lineHeight: "1.5",
    maxWidth: "400px",
  },
  brandFooter: {
    marginBottom: "20px",
  },
  onlineStatus: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#cbd5e1",
    fontSize: "14px",
    fontWeight: "500",
  },
  onlineDot: {
    width: "10px",
    height: "10px",
    backgroundColor: "#10b981",
    borderRadius: "50%",
    boxShadow: "0 0 10px #10b981",
  },
  rightPanel: {
    flex: 1,
    backgroundColor: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  loginBox: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#fff",
    padding: "50px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
  },
  loginTitle: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#0f172a",
    margin: "0 0 8px 0",
  },
  loginSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 32px 0",
  },
  formGroup: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#334155",
    fontSize: "13px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
    outline: "none",
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  button: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#0f172a",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "16px",
    letterSpacing: "1px",
    transition: "background-color 0.2s",
  },
  errorBox: {
    padding: "12px 16px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "20px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  demoSection: {
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "1px dashed #e2e8f0",
  },
  demoTitle: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#94a3b8",
    letterSpacing: "1px",
    marginBottom: "12px",
    textAlign: "center",
  },
  demoButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  demoBtn: {
    padding: "8px 12px",
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: "#e2e8f0",
      borderColor: "#cbd5e1",
    }
  },
  helpText: {
    textAlign: "center",
    fontSize: "13px",
    color: "#94a3b8",
    marginTop: "32px",
  }
};

export default Login;
