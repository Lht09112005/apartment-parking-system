import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";

const ResidentManagement = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [message, setMessage] = useState("");
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    apartment_number: "",
    phone: "",
    email: "",
  });

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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/residents", form);
      setMessage("Tạo cư dân thành công!");
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
    } catch (err) {
      setMessage(err.response?.data?.message || "Lỗi tạo cư dân");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/residents/${editData.resident_id}`, editData);
      setMessage("Cập nhật thành công!");
      setEditData(null);
      fetchResidents();
    } catch (err) {
      setMessage("Lỗi cập nhật");
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
      <Navbar />

      <div style={styles.content}>
        <div style={styles.titleRow}>
          <h3 style={{ margin: 0 }}>Quản lý Cư dân</h3>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditData(null);
            }}
            style={styles.addBtn}
          >
            + Thêm cư dân
          </button>
        </div>

        <div style={{ display: 'flex', marginBottom: '16px', gap: '12px' }}>
          <input 
            style={{ ...styles.input, flex: 1, maxWidth: '400px' }} 
            placeholder="Tìm kiếm theo: tên, tài khoản, căn hộ, điện thoại, email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {message && <p style={styles.message}>{message}</p>}

        {showForm && (
          <div style={styles.formCard}>
            <h4 style={{ marginTop: 0 }}>Thêm cư dân mới</h4>
            <form onSubmit={handleCreate}>
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
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Họ tên</label>
                  <input
                    style={styles.input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Số căn hộ</label>
                  <input
                    style={styles.input}
                    value={form.apartment_number}
                    onChange={(e) =>
                      setForm({ ...form, apartment_number: e.target.value })
                    }
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Số điện thoại</label>
                  <input
                    style={styles.input}
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    style={styles.input}
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <button type="submit" style={styles.addBtn}>
                Tạo cư dân
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
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

        {editData && (
          <div style={styles.formCard}>
            <h4 style={{ marginTop: 0 }}>Chỉnh sửa thông tin cư dân</h4>
            <form onSubmit={handleUpdate}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Họ tên</label>
                  <input
                    style={styles.input}
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Số căn hộ</label>
                  <input
                    style={styles.input}
                    value={editData.apartment_number}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        apartment_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Số điện thoại</label>
                  <input
                    style={styles.input}
                    value={editData.phone}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    style={styles.input}
                    type="email"
                    value={editData.email}
                    onChange={(e) =>
                      setEditData({ ...editData, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <button type="submit" style={styles.addBtn}>
                Lưu thay đổi
              </button>
              <button
                type="button"
                onClick={() => setEditData(null)}
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
                <th style={{...styles.th, cursor: 'pointer'}} onClick={() => handleSort('name')}>
                  Họ tên {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={styles.th}>Tài khoản</th>
                <th style={{...styles.th, cursor: 'pointer'}} onClick={() => handleSort('apartment_number')}>
                  Căn hộ {sortConfig.key === 'apartment_number' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={styles.th}>Điện thoại</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Trạng thái</th>
                <th style={styles.th}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedResidents.map((r) => (
                <tr key={r.resident_id} style={styles.tr}>
                  <td style={styles.td}>{r.resident_id}</td>
                  <td style={styles.td}>
                    <strong>{r.name}</strong>
                  </td>
                  <td style={styles.td}>{r.username}</td>
                  <td style={styles.td}>{r.apartment_number}</td>
                  <td style={styles.td}>{r.phone}</td>
                  <td style={styles.td}>{r.email}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor:
                          r.status === "active" ? "#10b981" : "#ef4444",
                      }}
                    >
                      {r.status === "active" ? "Hoạt động" : "Bị khóa"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => {
                        setEditData(r);
                        setShowForm(false);
                      }}
                      style={{
                        ...styles.actionBtn,
                        backgroundColor: "#1a73e8",
                      }}
                    >
                      Sửa
                    </button>
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
  formRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 },
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

export default ResidentManagement;
