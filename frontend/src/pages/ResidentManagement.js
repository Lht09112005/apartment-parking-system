import React, { useEffect, useState } from "react";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const ResidentManagement = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'resident_id', direction: 'asc' });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    apartment_number: "",
    phone: "",
    email: "",
  });

  const { user } = useAuth();

  const fetchResidents = async () => {
    try {
      const res = await axios.get("/residents");
      setResidents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  useRealtimeRefresh(fetchResidents, ["residents", "users"], {
    intervalMs: 12000,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/residents", form);
      setMessage({ type: "success", text: "Tạo cư dân thành công!" });
      setShowForm(false);
      setForm({
        username: "",
        password: "",
        name: "",
        apartment_number: "",
        phone: "",
        email: "",
      });
      fetchResidents();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi tạo cư dân" });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/residents/${editData.resident_id}`, editData);
      setMessage({ type: "success", text: "Cập nhật thành công!" });
      setEditData(null);
      fetchResidents();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi cập nhật" });
    }
  };

  const filteredAndSortedResidents = React.useMemo(() => {
    let result = residents.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (r.username && r.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.apartment_number && r.apartment_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.phone && r.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.email && r.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
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
  }, [residents, searchTerm, sortConfig]);

  return (
    <div style={styles.container}>
      <Sidebar />

      {/* Main Content */}
      <div style={styles.main}>
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={{margin: 0, fontSize: 20, color: '#1e293b'}}>Quản lý Cư dân</h2>
            <div style={styles.onlineBadge}>
              <span style={styles.onlineDot}></span> System Online
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={{textAlign: 'right', marginRight: 12}}>
              <div style={{fontSize: 14, fontWeight: '600', color: '#1e293b'}}>Admin: {user?.username}</div>
              <div style={{fontSize: 12, color: '#64748b'}}>QUẢN LÝ DÂN CƯ</div>
            </div>
            <div style={styles.avatar}>👥</div>
          </div>
        </div>

        {/* Content Body */}
        <div style={styles.contentBody}>
          
          <div style={styles.titleRow}>
            <div>
               <h3 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>Danh sách cư dân</h3>
               <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>Quản lý thông tin và tài khoản của cư dân chung cư.</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditData(null);
              }}
              style={styles.addBtn}
            >
              + Thêm cư dân mới
            </button>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap' }}>🎯 Tìm kiếm:</strong>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '500px' }}>
                   <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                   <input 
                    style={{ ...styles.input, paddingLeft: 40 }} 
                    placeholder="Nhập tên, căn hộ, SĐT..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: '#e2e8f0' }}></div>

              {/* Sort */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap' }}>📶 Sắp xếp:</strong>
                <select
                  style={{ ...styles.select, width: '240px' }}
                  value={`${sortConfig.key}_${sortConfig.direction}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split('_');
                    setSortConfig({ key, direction });
                  }}
                >
                  <option value="resident_id_asc">ID (Tăng dần)</option>
                  <option value="resident_id_desc">ID (Giảm dần)</option>
                  <option value="name_asc">Tên (A-Z)</option>
                  <option value="name_desc">Tên (Z-A)</option>
                  <option value="apartment_number_asc">Căn hộ (A-Z)</option>
                  <option value="apartment_number_desc">Căn hộ (Z-A)</option>
                </select>
              </div>
            </div>
          </div>

          {message.text && (
             <div style={{...styles.toast, backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b'}}>
                {message.type === 'success' ? '✅' : '❌'} {message.text}
             </div>
          )}

          {(showForm || editData) && (
            <div style={styles.formCard}>
              <h4 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, color: '#0f172a' }}>
                {editData ? "Chỉnh sửa thông tin cư dân" : "Thêm cư dân mới"}
              </h4>
              <form onSubmit={editData ? handleUpdate : handleCreate}>
                <div style={styles.formRow}>
                  {!editData && (
                    <>
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
                          required
                        />
                      </div>
                    </>
                  )}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Họ tên</label>
                    <input
                      style={styles.input}
                      value={editData ? editData.name : form.name}
                      onChange={(e) =>
                        editData 
                          ? setEditData({ ...editData, name: e.target.value })
                          : setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Số căn hộ</label>
                    <input
                      style={styles.input}
                      value={editData ? editData.apartment_number : form.apartment_number}
                      onChange={(e) =>
                        editData
                          ? setEditData({ ...editData, apartment_number: e.target.value })
                          : setForm({ ...form, apartment_number: e.target.value })
                      }
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Số điện thoại</label>
                    <input
                      style={styles.input}
                      value={editData ? editData.phone : form.phone}
                      onChange={(e) =>
                        editData
                          ? setEditData({ ...editData, phone: e.target.value })
                          : setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input
                      style={styles.input}
                      type="email"
                      value={editData ? editData.email : form.email}
                      onChange={(e) =>
                        editData
                          ? setEditData({ ...editData, email: e.target.value })
                          : setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div style={{ marginTop: 24 }}>
                  <button type="submit" style={styles.submitBtn}>
                    {editData ? "Lưu thay đổi" : "Tạo cư dân"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditData(null);
                    }}
                    style={styles.cancelBtn}
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
                    <th style={styles.th}>Họ tên</th>
                    <th style={styles.th}>Tài khoản</th>
                    <th style={styles.th}>Căn hộ</th>
                    <th style={styles.th}>Điện thoại</th>
                    <th style={styles.th}>Trạng thái</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedResidents.map((r) => (
                    <tr key={r.resident_id} style={styles.tr}>
                      <td style={styles.td}>#{r.resident_id}</td>
                      <td style={styles.td}>
                        <strong style={{ color: '#0f172a' }}>{r.name}</strong>
                      </td>
                      <td style={styles.td}>{r.username}</td>
                      <td style={styles.td}>{r.apartment_number}</td>
                      <td style={styles.td}>{r.phone}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: r.status === "active" ? "#ecfdf5" : "#fef2f2",
                            color: r.status === "active" ? "#10b981" : "#ef4444",
                            border: `1px solid ${r.status === "active" ? "#a7f3d0" : "#fecaca"}`
                          }}
                        >
                          {r.status === "active" ? "● Hoạt động" : "○ Bị khóa"}
                        </span>
                      </td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        <button
                          onClick={() => {
                            setEditData(r);
                            setShowForm(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          style={styles.actionBtn}
                        >
                          ✎ Sửa
                        </button>
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
  avatar: { width: 40, height: 40, backgroundColor: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginLeft: 12 },
  
  contentBody: { flex: 1, padding: 30, overflowY: "auto" },
  
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 },
  addBtn: { backgroundColor: "#0f172a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: 14, transition: "0.2s" },
  
  toast: { padding: "12px 20px", borderRadius: 8, marginBottom: 20, fontWeight: "600", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
  
  formCard: { background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: 24, border: "1px solid #e2e8f0" },
  formRow: { display: "flex", gap: 24, flexWrap: "wrap" },
  formGroup: { flex: 1, minWidth: 200 },
  label: { display: "block", marginBottom: 8, fontWeight: "600", fontSize: 13, color: "#475569" },
  input: { width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: 14, boxSizing: "border-box", outline: "none" },
  select: { padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: 14, outline: "none", backgroundColor: "#fff", cursor: "pointer", color: "#475569" },
  
  submitBtn: { backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: 14 },
  cancelBtn: { backgroundColor: "#f1f5f9", color: "#475569", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: 14, marginLeft: 12 },

  tableCard: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "16px 20px", textAlign: "left", fontWeight: "600", fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s" },
  td: { padding: "16px 20px", fontSize: 14, color: "#334155" },
  
  badge: { padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: "600" },
  
  actionBtn: { backgroundColor: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "600", transition: "0.2s" },
};

export default ResidentManagement;
