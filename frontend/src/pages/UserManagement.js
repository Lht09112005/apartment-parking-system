import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role_id: 2 });
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState("");
  const { user } = useAuth();

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
        setMessage("Cập nhật tài khoản thành công!");
      } else {
        await axios.post("/users", form);
        setMessage("Tạo tài khoản thành công!");
      }
      setShowForm(false);
      setEditingUser(null);
      setForm({ username: "", password: "", role_id: 2 });
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || (editingUser ? "Lỗi cập nhật tài khoản" : "Lỗi tạo tài khoản"));
    }
  };

  const handleEdit = (u) => {
    setEditingUser(u);
    setForm({ username: u.username, password: "", role_id: u.role_id });
    setShowForm(true);
    setMessage("");
  };

  const handleToggleStatus = async (u) => {
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
  };

  const roleColors = {
    "Super Admin": "#7c3aed",
    Admin: "#1a73e8",
    Security: "#f59e0b",
    Resident: "#10b981",
  };

  return (
    <div style={styles.container}>
      <Navbar />

      <div style={styles.content}>
        <div style={styles.titleRow}>
          <h3 style={{ margin: 0 }}>Quản lý Tài khoản Admin</h3>
          <button
            onClick={() => {
              setEditingUser(null);
              setForm({ username: "", password: "", role_id: 2 });
              setShowForm(!showForm);
              setMessage("");
            }}
            style={styles.addBtn}
          >
            + Thêm tài khoản
          </button>
        </div>

        {message && <p style={styles.message}>{message}</p>}

        {showForm && (
          <div style={styles.formCard}>
            <h4 style={{ marginTop: 0 }}>{editingUser ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</h4>
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
                <div style={styles.formGroup}>
                  <label style={styles.label}>Role</label>
                  <input
                    style={{ ...styles.input, backgroundColor: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }}
                    value="Admin"
                    readOnly
                  />
                </div>
              </div>
              <button type="submit" style={styles.addBtn}>
                {editingUser ? "Lưu thay đổi" : "Tạo tài khoản"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setForm({ username: "", password: "", role_id: 2 });
                }}
                style={{
                  ...styles.addBtn,
                  backgroundColor: "#6b7280",
                  marginLeft: 8,
                }}
              >
                Hủy
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Tên đăng nhập</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Trạng thái</th>
                <th style={styles.th}>Ngày tạo</th>
                <th style={styles.th}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} style={styles.tr}>
                  <td style={styles.td}>{u.user_id}</td>
                  <td style={styles.td}>
                    <strong>{u.username}</strong>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: roleColors[u.role_name] || "#888",
                      }}
                    >
                      {u.role_name}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor:
                          u.status === "active" ? "#10b981" : "#ef4444",
                      }}
                    >
                      {u.status === "active" ? "Hoạt động" : "Bị khóa"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(u.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td style={styles.td}>
                    {u.username !== "superadmin" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEdit(u)}
                          style={{
                            ...styles.actionBtn,
                            backgroundColor: "#1a73e8",
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          style={{
                            ...styles.actionBtn,
                            backgroundColor:
                              u.status === "active" ? "#ef4444" : "#10b981",
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
  );
};

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f0f2f5" },
  content: { padding: "24px" },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addBtn: {
    backgroundColor: "#1a73e8",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
  message: { color: "#10b981", fontWeight: "500", marginBottom: 12 },
  formCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: 20,
  },
  formRow: { display: "flex", gap: 16, flexWrap: "wrap" },
  formGroup: { flex: 1, minWidth: 180 },
  label: { display: "block", marginBottom: 4, fontWeight: "500", fontSize: 13 },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: 14,
    boxSizing: "border-box",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  thead: { backgroundColor: "#f8fafc" },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: "600",
    fontSize: 13,
    color: "#555",
    borderBottom: "1px solid #e5e7eb",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 16px", fontSize: 14 },
  badge: {
    color: "#fff",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "500",
  },
  actionBtn: {
    color: "#fff",
    border: "none",
    padding: "5px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
  },
};

export default UserManagement;
