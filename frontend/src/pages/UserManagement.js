import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role_id: 2, name: "", phone: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`/users/${editingUser.user_id}`, {
          ...form,
          status: editingUser.status,
        });
        setMessage({ type: "success", text: "Cập nhật tài khoản thành công!" });
      } else {
        await axios.post("/users", form);
        setMessage({ type: "success", text: "Tạo tài khoản thành công!" });
      }
      setShowForm(false);
      setEditingUser(null);
      setForm({ username: "", password: "", role_id: user?.role_id === 1 ? 2 : 3, name: "", phone: "" });
      fetchUsers();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || (editingUser ? "Lỗi cập nhật tài khoản" : "Lỗi tạo tài khoản") });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleEdit = (u) => {
    setEditingUser(u);
    setForm({ 
      username: u.username, 
      password: "", 
      role_id: u.role_id,
      name: u.staff_name || "",
      phone: u.staff_phone || ""
    });
    setShowForm(true);
    setMessage({ type: "", text: "" });
  };

  const handleToggleStatus = async (u) => {
    const action = u.status === "active" ? "khóa" : "mở khóa";
    if (window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản này?`)) {
      const newStatus = u.status === "active" ? "locked" : "active";
      try {
        await axios.put(`/users/${u.user_id}`, {
          role_id: u.role_id,
          status: newStatus,
        });
        fetchUsers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleColors = {
    "Super Admin": "#7c3aed",
    Admin: "#1a73e8",
    Security: "#f59e0b",
    Resident: "#10b981",
  };

  return (
    <div style={styles.container}>
      <Sidebar />

      {/* Main Content */}
      <div style={styles.main}>
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={{margin: 0, fontSize: 20, color: '#1e293b'}}>39°C Management</h2>
            <div style={styles.onlineBadge}>
              <span style={styles.onlineDot}></span> System Online
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={{textAlign: 'right', marginRight: 12}}>
              <div style={{fontSize: 14, fontWeight: '600', color: '#1e293b'}}>
                {user?.role_id === 1 ? "Super Admin" : "Admin"}: {user?.username}
              </div>
              <div style={{fontSize: 12, color: '#64748b'}}>
                {user?.role_id === 1 ? "TOÀN QUYỀN HỆ THỐNG" : "QUẢN TRỊ VIÊN"}
              </div>
            </div>
            <div style={styles.avatar}>{user?.role_id === 1 ? "👑" : "🛡️"}</div>
          </div>
        </div>

        {/* Content Body */}
        <div style={styles.contentBody}>
          
          <div style={styles.titleRow}>
            <div>
               <h3 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>
                 {user?.role_id === 1 ? "Danh sách tài khoản Admin" : "Quản lý tài khoản Bảo vệ"}
               </h3>
               <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>
                 {user?.role_id === 1 ? "Cấp quyền truy cập cho nhân viên quản trị hệ thống." : "Quản lý nhân sự đội ngũ an ninh tòa nhà."}
               </p>
            </div>
            <button
              onClick={() => {
                setEditingUser(null);
                setForm({ username: "", password: "", role_id: user?.role_id === 1 ? 2 : 3, name: "", phone: "" });
                setShowForm(!showForm);
                setMessage({ type: "", text: "" });
              }}
              style={styles.addBtn}
            >
              + {user?.role_id === 1 ? "Tạo Admin mới" : "Thêm Bảo vệ mới"}
            </button>
          </div>

          {message.text && (
             <div style={{...styles.toast, backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b'}}>
                {message.type === 'success' ? '✅' : '❌'} {message.text}
             </div>
          )}

          {showForm && (
            <div style={styles.formCard}>
              <h4 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, color: '#0f172a' }}>
                {editingUser ? "Chỉnh sửa tài khoản" : (user?.role_id === 1 ? "Đăng ký Admin mới" : "Thêm Bảo vệ mới")}
              </h4>
              <form onSubmit={handleSubmit}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Tên đăng nhập</label>
                    <input
                      style={styles.input}
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Mật khẩu</label>
                    <input
                      style={styles.input}
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      required={!editingUser}
                      placeholder={editingUser ? "Để trống nếu không muốn đổi" : ""}
                    />
                  </div>
                </div>

                {user?.role_id === 2 && (
                  <div style={{ ...styles.formRow, marginTop: 16 }}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Họ và tên bảo vệ *</label>
                      <input
                        style={styles.input}
                        value={form.name}
                        placeholder="Nhập tên bảo vệ..."
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Số điện thoại *</label>
                      <input
                        style={styles.input}
                        value={form.phone}
                        placeholder="Nhập số điện thoại..."
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 24 }}>
                  <button type="submit" style={styles.submitBtn}>
                    {editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingUser(null);
                      setForm({ username: "", password: "", role_id: user?.role_id === 1 ? 2 : 3, name: "", phone: "" });
                    }}
                    style={{
                      ...styles.cancelBtn,
                      marginLeft: 12,
                    }}
                  >
                    Hủy bỏ
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={styles.tableCard}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Đang tải dữ liệu...</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Tên đăng nhập</th>
                    {user?.role_id === 2 && <th style={styles.th}>Họ và tên</th>}
                    {user?.role_id === 2 && <th style={styles.th}>Số điện thoại</th>}
                    <th style={styles.th}>Trạng thái</th>
                    <th style={styles.th}>Ngày tạo</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} style={styles.tr}>
                      <td style={styles.td}>#{u.user_id}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                           <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
                           <strong style={{ color: '#0f172a' }}>{u.username}</strong>
                        </div>
                      </td>
                      {user?.role_id === 2 && <td style={styles.td}>{u.staff_name || "—"}</td>}
                      {user?.role_id === 2 && <td style={styles.td}>{u.staff_phone || "—"}</td>}

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: u.status === "active" ? "#ecfdf5" : "#fef2f2",
                            color: u.status === "active" ? "#10b981" : "#ef4444",
                            border: `1px solid ${u.status === "active" ? "#a7f3d0" : "#fecaca"}`
                          }}
                        >
                          {u.status === "active" ? "● Hoạt động" : "○ Bị khóa"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(u.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        {u.username !== "superadmin" && (
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button
                              onClick={() => handleEdit(u)}
                              style={{
                                ...styles.actionBtn,
                                backgroundColor: "#f1f5f9",
                                color: "#0f172a",
                                border: "1px solid #e2e8f0"
                              }}
                            >
                              ✎ Sửa
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              style={{
                                ...styles.actionBtn,
                                backgroundColor: u.status === "active" ? "#fee2e2" : "#dcfce7",
                                color: u.status === "active" ? "#ef4444" : "#10b981",
                              }}
                            >
                              {u.status === "active" ? "Khóa" : "Mở khóa"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
  avatar: { width: 40, height: 40, backgroundColor: "#fef3c7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginLeft: 12 },
  
  contentBody: { flex: 1, padding: 30, overflowY: "auto", display: "flex", flexDirection: "column" },
  
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 },
  addBtn: { backgroundColor: "#0f172a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: 14, transition: "0.2s" },
  
  toast: { padding: "12px 20px", borderRadius: 8, marginBottom: 20, fontWeight: "600", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
  
  formCard: { background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: 24, border: "1px solid #e2e8f0" },
  formRow: { display: "flex", gap: 24, flexWrap: "wrap" },
  formGroup: { flex: 1, minWidth: 200 },
  label: { display: "block", marginBottom: 8, fontWeight: "600", fontSize: 13, color: "#475569" },
  input: { width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: 14, boxSizing: "border-box", outline: "none" },
  
  submitBtn: { backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: 14 },
  cancelBtn: { backgroundColor: "#f1f5f9", color: "#475569", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: 14 },

  tableCard: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "16px 20px", textAlign: "left", fontWeight: "600", fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s", "&:hover": { backgroundColor: "#f8fafc" } },
  td: { padding: "16px 20px", fontSize: 14, color: "#334155" },
  
  badge: { color: "#fff", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: "600" },
  
  actionBtn: { border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "600", transition: "0.2s" },
};

export default UserManagement;
