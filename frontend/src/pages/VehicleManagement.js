import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [residents, setResidents] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [editData, setEditData] = useState(null);
  const [filterVehicleType, setFilterVehicleType] = useState("");
  const [filterApartment, setFilterApartment] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [form, setForm] = useState({
    plate_number: "",
    resident_id: "",
    type_id: "",
    color: "",
  });

  const fetchData = async () => {
    try {
      const [resVehicles, resResidents, resTypes] = await Promise.all([
        axios.get("/vehicles"),
        axios.get("/residents"),
        axios.get("/vehicles/types"),
      ]);
      setVehicles(resVehicles.data);
      setResidents(resResidents.data);
      setVehicleTypes(resTypes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/vehicles", form);
      setMessage("Thêm xe thành công!");
      setShowForm(false);
      setForm({ plate_number: "", resident_id: "", type_id: "", color: "" });
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Lỗi thêm xe");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/vehicles/${editData.plate_number}`, {
        resident_id: editData.resident_id,
        type_id: editData.type_id,
        color: editData.color,
      });
      setMessage("Cập nhật thành công!");
      setEditData(null);
      fetchData();
    } catch (err) {
      setMessage("Lỗi cập nhật");
    }
  };

  const handleDelete = async (plate_number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa xe này?")) {
      try {
        await axios.delete(`/vehicles/${plate_number}`);
        setMessage("Xóa xe thành công!");
        fetchData();
      } catch (err) {
        setMessage("Lỗi khi xóa xe");
      }
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedVehicles = React.useMemo(() => {
    let result = vehicles.filter(v => {
      const matchesType = !filterVehicleType || v.type_id === parseInt(filterVehicleType);
      const matchesApartment = !filterApartment || (v.apartment_number && v.apartment_number.toLowerCase().includes(filterApartment.toLowerCase()));
      return matchesType && matchesApartment;
    });

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
  }, [vehicles, filterVehicleType, filterApartment, sortConfig]);

  return (
    <div style={styles.container}>
      <Navbar />

      <div style={styles.content}>
        <div style={styles.titleRow}>
          <h3 style={{ margin: 0 }}>Quản lý Xe cộ</h3>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditData(null);
            }}
            style={styles.addBtn}
          >
            + Thêm xe
          </button>
        </div>

        {message && <p style={styles.message}>{message}</p>}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 1 200px' }}>
            <label style={styles.label}>Lọc theo loại xe</label>
            <select 
              style={styles.input}
              value={filterVehicleType}
              onChange={(e) => setFilterVehicleType(e.target.value)}
            >
              <option value="">-- Tất cả loại xe --</option>
              {vehicleTypes.map((vt) => (
                <option key={vt.type_id} value={vt.type_id}>
                  {vt.type_name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '0 1 200px' }}>
            <label style={styles.label}>Lọc theo căn hộ</label>
            <input 
              style={styles.input}
              type="text"
              placeholder="Nhập số căn hộ..."
              value={filterApartment}
              onChange={(e) => setFilterApartment(e.target.value)}
            />
          </div>
        </div>

        {showForm && (
          <div style={styles.formCard}>
            <h4 style={{ marginTop: 0 }}>Thêm xe mới</h4>
            <form onSubmit={handleCreate}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Biển số</label>
                  <input
                    style={styles.input}
                    value={form.plate_number}
                    onChange={(e) =>
                      setForm({ ...form, plate_number: e.target.value })
                    }
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Căn hộ</label>
                  <select
                    style={styles.input}
                    value={form.resident_id}
                    onChange={(e) =>
                      setForm({ ...form, resident_id: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Chọn căn hộ --</option>
                    {residents.map((r) => (
                      <option key={r.resident_id} value={r.resident_id}>
                        Căn hộ: {r.apartment_number}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Loại xe</label>
                  <select
                    style={styles.input}
                    value={form.type_id}
                    onChange={(e) =>
                      setForm({ ...form, type_id: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Chọn loại xe --</option>
                    {vehicleTypes.map((vt) => (
                      <option key={vt.type_id} value={vt.type_id}>
                        {vt.type_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Màu sắc</label>
                  <input
                    style={styles.input}
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                  />
                </div>
              </div>
              <button type="submit" style={styles.addBtn}>
                Thêm xe
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
            <h4 style={{ marginTop: 0 }}>Chỉnh sửa thông tin xe: {editData.plate_number}</h4>
            <form onSubmit={handleUpdate}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Căn hộ</label>
                  <select
                    style={styles.input}
                    value={editData.resident_id}
                    onChange={(e) =>
                      setEditData({ ...editData, resident_id: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Chọn căn hộ --</option>
                    {residents.map((r) => (
                      <option key={r.resident_id} value={r.resident_id}>
                        Căn hộ: {r.apartment_number} - {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Loại xe</label>
                  <select
                    style={styles.input}
                    value={editData.type_id}
                    onChange={(e) =>
                      setEditData({ ...editData, type_id: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Chọn loại xe --</option>
                    {vehicleTypes.map((vt) => (
                      <option key={vt.type_id} value={vt.type_id}>
                        {vt.type_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Màu sắc</label>
                  <input
                    style={styles.input}
                    value={editData.color}
                    onChange={(e) =>
                      setEditData({ ...editData, color: e.target.value })
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
                <th style={{...styles.th, cursor: 'pointer'}} onClick={() => handleSort('plate_number')}>
                  Biển số {sortConfig.key === 'plate_number' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{...styles.th, cursor: 'pointer'}} onClick={() => handleSort('resident_name')}>
                  Chủ xe {sortConfig.key === 'resident_name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{...styles.th, cursor: 'pointer'}} onClick={() => handleSort('apartment_number')}>
                  Căn hộ {sortConfig.key === 'apartment_number' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{...styles.th, cursor: 'pointer'}} onClick={() => handleSort('type_name')}>
                  Loại xe {sortConfig.key === 'type_name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={styles.th}>Màu sắc</th>
                <th style={styles.th}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedVehicles.map((v) => (
                <tr key={v.plate_number} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{v.plate_number}</strong>
                  </td>
                  <td style={styles.td}>{v.resident_name}</td>
                  <td style={styles.td}>{v.apartment_number}</td>
                  <td style={styles.td}>{v.type_name}</td>
                  <td style={styles.td}>{v.color}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => {
                        setEditData(v);
                        setShowForm(false);
                      }}
                      style={{
                        ...styles.actionBtn,
                        backgroundColor: "#1a73e8",
                        marginRight: 8,
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(v.plate_number)}
                      style={{
                        ...styles.actionBtn,
                        backgroundColor: "#ef4444",
                      }}
                    >
                      Xóa
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
  actionBtn: {
    color: "#fff",
    border: "none",
    padding: "5px 12px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
  },
};

export default VehicleManagement;
