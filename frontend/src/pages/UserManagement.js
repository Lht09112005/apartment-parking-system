import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role_id: 2, name: "", phone: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [sortConfig, setSortConfig] = useState({ key: 'user_id', direction: 'asc' });
  const [confirmTarget, setConfirmTarget] = useState(null);
  
  const { user } = useAuth();
  const isSuperAdmin = user?.role_id === 1;

  const canEditUser = (targetUser) =>
    user?.role_id === 2 || (isSuperAdmin && targetUser.role_id === 2);

  const canToggleUserStatus = (targetUser) => {
    if (targetUser.username === "superadmin") return false;
    if (isSuperAdmin) return targetUser.role_id === 2;
    return targetUser.role_id === 3;
  };

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

  useRealtimeRefresh(fetchUsers, ["users", "audit"], {
    intervalMs: 12000,
  });

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
    if (!canEditUser(u)) {
      setMessage({ type: "error", text: "Super Admin chỉ được sửa tài khoản Admin" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return;
    }

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

  const handleToggleStatus = (u) => {
    if (!canToggleUserStatus(u)) {
      setMessage({ type: "error", text: isSuperAdmin ? "Super Admin chỉ được khóa/mở khóa tài khoản Admin" : "Admin chỉ được khóa/mở khóa tài khoản Security" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return;
    }

    setConfirmTarget({ user: u, action: u.status === "active" ? "locked" : "active" });
  };

  const executeToggleStatus = async () => {
    if (!confirmTarget) return;
    const { user: targetUser, action } = confirmTarget;
    setConfirmTarget(null);

    try {
      await axios.put(`/users/${targetUser.user_id}`, {
        role_id: targetUser.role_id,
        status: action,
      });
      setMessage({ type: "success", text: `${action === "locked" ? "Khóa" : "Mở khóa"} tài khoản thành công!` });
      fetchUsers();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi thay đổi trạng thái tài khoản" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const sortedUsers = React.useMemo(() => {
    let result = isSuperAdmin ? users.filter((u) => u.role_id === 2) : [...users];
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [users, sortConfig, isSuperAdmin]);

  return (
    <div style={styles.container}>
      <Sidebar />

      {/* Main Content */}
      <div style={styles.main}>
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={{margin: 0, fontSize: 18, fontWeight: '800', color: '#2D3327'}}>Quản trị hệ thống</h2>
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
            <div style={styles.avatar}><span className="material-symbols-rounded" style={{ fontSize: 20 }}>{user?.role_id === 1 ? "admin_panel_settings" : "shield_person"}</span></div>
          </div>
        </div>

        {/* Content Body */}
        <div style={styles.contentBody}>
          
          <div style={styles.titleRow}>
            <div>
               <h3 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>
                 {isSuperAdmin ? "Danh sách tài khoản Admin" : "Quản lý tài khoản Bảo vệ"}
               </h3>
               <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>
                 {isSuperAdmin ? "Cấp quyền truy cập cho nhân viên quản trị hệ thống." : "Quản lý nhân sự đội ngũ an ninh tòa nhà."}
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

          <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap' }}>📶 Sắp xếp danh sách:</strong>
              <div style={{ width: '280px' }}>
                <select
                  style={styles.select}
                  value={`${sortConfig.key}_${sortConfig.direction}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split('_');
                    setSortConfig({ key, direction });
                  }}
                >
                  <option value="user_id_asc">ID (Tăng dần)</option>
                  <option value="user_id_desc">ID (Giảm dần)</option>
                  <option value="username_asc">Tên đăng nhập (A-Z)</option>
                  <option value="username_desc">Tên đăng nhập (Z-A)</option>
                  {user?.role_id === 2 && (
                    <>
                      <option value="staff_name_asc">Họ tên (A-Z)</option>
                      <option value="staff_name_desc">Họ tên (Z-A)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
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
                    {isSuperAdmin && <th style={styles.th}>Vai trò</th>}
                    {user?.role_id === 2 && <th style={styles.th}>Họ và tên</th>}
                    {user?.role_id === 2 && <th style={styles.th}>Số điện thoại</th>}
                    <th style={styles.th}>Trạng thái</th>
                    <th style={styles.th}>Ngày tạo</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((u) => (
                    <tr key={u.user_id} style={styles.tr}>
                      <td style={styles.td}>#{u.user_id}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                           <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
                           <strong style={{ color: '#0f172a' }}>{u.username}</strong>
                        </div>
                      </td>
                      {isSuperAdmin && <td style={styles.td}>{u.role_name}</td>}
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
                        {(canEditUser(u) || canToggleUserStatus(u)) ? (
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            {canEditUser(u) && (
                              <button
                                onClick={() => handleEdit(u)}
                                style={{
                                  ...styles.actionBtn,
                                  backgroundColor: "#F1ECE4",
                                  color: "#5F504B",
                                  border: "1px solid #E4DDD3"
                                }}
                              >
                                ✎ Sửa
                              </button>
                            )}
                            {canToggleUserStatus(u) && (
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
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
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

      {confirmTarget && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(45, 51, 39, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#FFFBF5",
            borderRadius: 20,
            width: "90%",
            maxWidth: 400,
            padding: 24,
            boxShadow: "0 20px 45px rgba(0,0,0,0.15)",
            fontFamily: "'Outfit', sans-serif",
            textAlign: "center"
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: confirmTarget.action === "locked" ? "rgba(205, 92, 92, 0.1)" : "rgba(63, 94, 77, 0.1)",
              color: confirmTarget.action === "locked" ? "#CD5C5C" : "#3F5E4D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              margin: "0 auto 16px"
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 32 }}>
                {confirmTarget.action === "locked" ? "lock" : "lock_open"}
              </span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", color: "#2D3327", fontSize: 18, fontWeight: "800" }}>
              {confirmTarget.action === "locked" ? "KHÓA TÀI KHOẢN" : "MỞ KHÓA TÀI KHOẢN"}
            </h3>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 14, lineHeight: "20px" }}>
              Bạn có chắc chắn muốn {confirmTarget.action === "locked" ? "KHÓA" : "MỞ KHÓA"} tài khoản của{" "}
              <strong>{confirmTarget.user.username}</strong> ({confirmTarget.user.role_name})?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={executeToggleStatus}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: confirmTarget.action === "locked" ? "#CD5C5C" : "#3F5E4D",
                  color: "#FFFBF5",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = confirmTarget.action === "locked" ? "#b04f4f" : "#2d4437"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = confirmTarget.action === "locked" ? "#CD5C5C" : "#3F5E4D"}
              >
                Xác nhận
              </button>
              <button
                onClick={() => setConfirmTarget(null)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#F1ECE4",
                  color: "#5F504B",
                  border: "1px solid #E4DDD3",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { display: "flex", height: "100vh", backgroundColor: "#FAF8F5", fontFamily: "'Outfit', sans-serif" },
  
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topHeader: { height: 64, backgroundColor: "#FFFBF5", borderBottom: "1px solid rgba(139, 115, 85, 0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 24 },
  onlineBadge: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#3F5E4D", fontWeight: "700", backgroundColor: "#EAE5D9", padding: "4px 12px", borderRadius: 20 },
  onlineDot: { width: 8, height: 8, backgroundColor: "#3F5E4D", borderRadius: "50%" },
  headerRight: { display: "flex", alignItems: "center" },
  avatar: { width: 36, height: 36, backgroundColor: "#3F5E4D", color: "#FFFBF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: "700", boxShadow: "0 4px 10px rgba(63, 94, 77, 0.15)", marginLeft: 12 },
  
  contentBody: { flex: 1, padding: 24, overflowY: "auto" },
  
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 },
  addBtn: { backgroundColor: "#3F5E4D", color: "#FFFBF5", border: "none", padding: "12px 24px", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 14, boxShadow: "0 4px 12px rgba(63, 94, 77, 0.15)", transition: "all 0.2s" },
  
  toast: { padding: "14px 24px", borderRadius: 12, marginBottom: 20, fontWeight: "600", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)" },
  
  formCard: { background: "#fff", padding: "30px", borderRadius: 20, boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)", marginBottom: 24, border: "1px solid rgba(139, 115, 85, 0.08)" },
  formRow: { display: "flex", gap: 24, flexWrap: "wrap" },
  formGroup: { flex: 1, minWidth: 200 },
  label: { display: "block", marginBottom: 8, fontWeight: "700", fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" },
  input: { width: "100%", padding: "12px 16px", border: "2px solid #EAE5D9", borderRadius: 10, fontSize: 14, boxSizing: "border-box", outline: "none", backgroundColor: "#FFFBF5", color: "#2D3327", fontFamily: "'Outfit', sans-serif" },
  select: { width: "100%", padding: "12px 16px", border: "2px solid #EAE5D9", borderRadius: 10, fontSize: 14, outline: "none", backgroundColor: "#FFFBF5", cursor: "pointer", color: "#2D3327", fontFamily: "'Outfit', sans-serif" },
  
  submitBtn: { backgroundColor: "#3F5E4D", color: "#FFFBF5", border: "none", padding: "12px 24px", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 14, boxShadow: "0 4px 12px rgba(63, 94, 77, 0.15)" },
  cancelBtn: { backgroundColor: "#F1ECE4", color: "#5F504B", border: "1px solid #E4DDD3", padding: "12px 24px", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 14 },

  tableCard: { background: "#fff", borderRadius: 20, boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)", border: "1px solid rgba(139, 115, 85, 0.08)", overflowY: "auto", maxHeight: "550px" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#EAE5D9", borderBottom: "1px solid #F1ECE4" },
  th: { padding: "16px 20px", textAlign: "left", fontWeight: "700", fontSize: 12, color: "#2D3327", textTransform: "uppercase", letterSpacing: 0.5, position: "sticky", top: 0, backgroundColor: "#EAE5D9", zIndex: 1 },
  tr: { borderBottom: "1px solid #F1ECE4", transition: "background-color 0.15s" },
  td: { padding: "16px 20px", fontSize: 14, color: "#2D3327" },
  
  badge: { padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: "700" },
  
  actionBtn: { backgroundColor: "#F1ECE4", color: "#5F504B", border: "1px solid #E4DDD3", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: "600", transition: "0.2s" },
};

export default UserManagement;
