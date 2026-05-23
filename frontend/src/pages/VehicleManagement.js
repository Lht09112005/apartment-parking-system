import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [residents, setResidents] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editData, setEditData] = useState(null);
  const [filterVehicleType, setFilterVehicleType] = useState("");
  const [filterApartment, setFilterApartment] = useState("");
  const [filterPlate, setFilterPlate] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'plate_number', direction: 'asc' });
  const [activeTab, setActiveTab] = useState("active");
  const [form, setForm] = useState({
    plate_number: "",
    resident_id: "",
    type_id: "",
    color: "",
  });

  const { user } = useAuth();

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

  useRealtimeRefresh(fetchData, ["vehicles", "residents", "monthly"], {
    intervalMs: 10000,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    const resident = residents.find(r => r.apartment_number === form.apartment_number);
    if (!resident) {
      setMessage({ type: "error", text: "Số căn hộ không tồn tại trong hệ thống!" });
      return;
    }

    try {
      await axios.post("/vehicles", {
        ...form,
        resident_id: resident.resident_id
      });
      setMessage({ type: "success", text: "Thêm xe thành công!" });
      setShowForm(false);
      setForm({ plate_number: "", apartment_number: "", type_id: "", color: "" });
      fetchData();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi thêm xe" });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const resident = residents.find(r => r.apartment_number === editData.apartment_number);
    if (!resident) {
      setMessage({ type: "error", text: "Số căn hộ không tồn tại!" });
      return;
    }

    try {
      await axios.put(`/vehicles/${editData.plate_number}`, {
        resident_id: resident.resident_id,
        type_id: editData.type_id,
        color: editData.color,
      });
      setMessage({ type: "success", text: "Cập nhật thành công!" });
      setEditData(null);
      fetchData();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi cập nhật" });
    }
  };

  const handleApprove = async (plate_number) => {
    try {
      const res = await axios.put(`/vehicles/${plate_number}/approve`);
      setMessage({ type: "success", text: res.data.message || "Duyệt đăng ký xe thành công!" });
      fetchData();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi duyệt xe" });
    }
  };

  const handleReject = async (plate_number) => {
    if (window.confirm(`Bạn có chắc chắn muốn TỪ CHỐI yêu cầu đăng ký xe ${plate_number}?`)) {
      try {
        const res = await axios.put(`/vehicles/${plate_number}/reject`);
        setMessage({ type: "success", text: res.data.message || "Từ chối duyệt xe thành công!" });
        fetchData();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } catch (err) {
        setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi từ chối xe" });
      }
    }
  };

  const handleDelete = async (plate_number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa xe này?")) {
      try {
        await axios.delete(`/vehicles/${plate_number}`);
        setMessage({ type: "success", text: "Xóa xe thành công!" });
        fetchData();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } catch (err) {
        setMessage({ type: "error", text: "Lỗi khi xóa xe" });
      }
    }
  };

  const filteredAndSortedVehicles = React.useMemo(() => {
    let result = vehicles.filter(v => {
      const status = v.status || 'active';
      const matchesTab = status === activeTab;
      const matchesType = !filterVehicleType || v.type_id === parseInt(filterVehicleType);
      const matchesApartment = !filterApartment || (v.apartment_number && v.apartment_number.toLowerCase().includes(filterApartment.toLowerCase()));
      const matchesPlate = !filterPlate || (v.plate_number && v.plate_number.toLowerCase().includes(filterPlate.toLowerCase()));
      return matchesTab && matchesType && matchesApartment && matchesPlate;
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
  }, [vehicles, activeTab, filterVehicleType, filterApartment, filterPlate, sortConfig]);

  return (
    <div style={styles.container}>
      <Sidebar />

      {/* Main Content */}
      <div style={styles.main}>
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={{margin: 0, fontSize: 20, color: '#1e293b'}}>Quản lý Xe cộ</h2>
            <div style={styles.onlineBadge}>
              <span style={styles.onlineDot}></span> System Online
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={{textAlign: 'right', marginRight: 12}}>
              <div style={{fontSize: 14, fontWeight: '600', color: '#1e293b'}}>Admin: {user?.username}</div>
              <div style={{fontSize: 12, color: '#64748b'}}>QUẢN LÝ PHƯƠNG TIỆN</div>
            </div>
            <div style={styles.avatar}>🚗</div>
          </div>
        </div>

        {/* Content Body */}
        <div style={styles.contentBody}>
          
          <div style={styles.titleRow}>
            <div>
               <h3 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>Hồ sơ phương tiện</h3>
               <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>Quản lý thông tin xe đăng ký của cư dân trong tòa nhà.</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditData(null);
                setForm({ plate_number: "", apartment_number: "", type_id: "", color: "" });
              }}
              style={styles.addBtn}
            >
              + Đăng ký xe mới
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: 24 }}>
            <button
              onClick={() => setActiveTab("active")}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'none',
                fontWeight: 'bold',
                color: activeTab === 'active' ? '#3b82f6' : '#64748b',
                borderBottom: activeTab === 'active' ? '2px solid #3b82f6' : 'none',
                cursor: 'pointer',
                marginBottom: -2,
                fontSize: 15
              }}
            >
              🚗 Xe đang hoạt động ({vehicles.filter(v => (v.status || 'active') === 'active').length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'none',
                fontWeight: 'bold',
                color: activeTab === 'pending' ? '#3b82f6' : '#64748b',
                borderBottom: activeTab === 'pending' ? '2px solid #3b82f6' : 'none',
                cursor: 'pointer',
                marginBottom: -2,
                fontSize: 15
              }}
            >
              ⏳ Yêu cầu chờ duyệt ({vehicles.filter(v => v.status === 'pending').length})
            </button>
          </div>
          
          <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Filters Section */}
              <div>
                <strong style={{ fontSize: 14, color: '#0f172a', display: 'block', marginBottom: '12px' }}>🎯 Bộ lọc tìm kiếm:</strong>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={styles.filterLabel}>Biển số</label>
                    <input style={styles.input} type="text" placeholder="Nhập biển số..." value={filterPlate} onChange={(e) => setFilterPlate(e.target.value)} />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={styles.filterLabel}>Căn hộ</label>
                    <input style={styles.input} type="text" placeholder="Số căn hộ..." value={filterApartment} onChange={(e) => setFilterApartment(e.target.value)} />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={styles.filterLabel}>Loại xe</label>
                    <select style={styles.input} value={filterVehicleType} onChange={(e) => setFilterVehicleType(e.target.value)}>
                      <option value="">Tất cả loại xe</option>
                      {vehicleTypes.map((vt) => <option key={vt.type_id} value={vt.type_id}>{vt.type_name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: '#e2e8f0' }}></div>

              {/* Sorting Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <strong style={{ fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap' }}>📶 Sắp xếp:</strong>
                <div style={{ width: '240px' }}>
                  <select
                    style={styles.select}
                    value={`${sortConfig.key}_${sortConfig.direction}`}
                    onChange={(e) => {
                      const [key, direction] = e.target.value.split('_');
                      setSortConfig({ key, direction });
                    }}
                  >
                    <option value="plate_number_asc">Biển số (A-Z)</option>
                    <option value="plate_number_desc">Biển số (Z-A)</option>
                    <option value="resident_name_asc">Chủ xe (A-Z)</option>
                    <option value="resident_name_desc">Chủ xe (Z-A)</option>
                    <option value="apartment_number_asc">Căn hộ (A-Z)</option>
                    <option value="apartment_number_desc">Căn hộ (Z-A)</option>
                  </select>
                </div>
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
                {editData ? `Chỉnh sửa xe: ${editData.plate_number}` : "Đăng ký xe mới"}
              </h4>
              <form onSubmit={editData ? handleUpdate : handleCreate}>
                <div style={styles.formRow}>
                  {!editData && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Biển số xe</label>
                      <input
                        style={styles.input}
                        placeholder="VD: 29A-12345"
                        value={form.plate_number}
                        onChange={(e) =>
                          setForm({ ...form, plate_number: e.target.value })
                        }
                        required
                      />
                    </div>
                  )}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Số căn hộ</label>
                    <input
                      style={styles.input}
                      placeholder="Nhập số căn hộ..."
                      value={editData ? editData.apartment_number : form.apartment_number}
                      onChange={(e) =>
                        editData
                          ? setEditData({ ...editData, apartment_number: e.target.value })
                          : setForm({ ...form, apartment_number: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Loại phương tiện</label>
                    <select
                      style={styles.input}
                      value={editData ? editData.type_id : form.type_id}
                      onChange={(e) =>
                        editData
                          ? setEditData({ ...editData, type_id: e.target.value })
                          : setForm({ ...form, type_id: e.target.value })
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
                      placeholder="VD: Trắng, Đen..."
                      value={editData ? editData.color : form.color}
                      onChange={(e) =>
                        editData
                          ? setEditData({ ...editData, color: e.target.value })
                          : setForm({ ...form, color: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div style={{ marginTop: 24 }}>
                  <button type="submit" style={styles.submitBtn}>
                    {editData ? "Lưu thay đổi" : "Đăng ký xe"}
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
                    <th style={styles.th}>Biển số</th>
                    <th style={styles.th}>Chủ xe</th>
                    <th style={styles.th}>Căn hộ</th>
                    <th style={styles.th}>Loại xe</th>
                    <th style={styles.th}>Màu sắc</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedVehicles.map((v) => (
                    <tr key={v.plate_number} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.plateBadge}>{v.plate_number}</div>
                      </td>
                      <td style={styles.td}>
                        <strong style={{ color: '#0f172a' }}>{v.resident_name}</strong>
                      </td>
                      <td style={styles.td}>{v.apartment_number}</td>
                      <td style={styles.td}>
                         <span style={styles.typeTag}>{v.type_name}</span>
                      </td>
                      <td style={styles.td}>{v.color || "—"}</td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        {activeTab === 'active' ? (
                          <>
                            <button
                              onClick={() => {
                                setEditData(v);
                                setShowForm(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              style={styles.actionBtn}
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(v.plate_number)}
                              style={{ ...styles.actionBtn, color: '#ef4444', marginLeft: 8 }}
                            >
                              Xóa
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(v.plate_number)}
                              style={{ ...styles.actionBtn, color: '#10b981' }}
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleReject(v.plate_number)}
                              style={{ ...styles.actionBtn, color: '#ef4444', marginLeft: 8 }}
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredAndSortedVehicles.length === 0 && (
                     <tr>
                        <td colSpan="6" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Không tìm thấy phương tiện nào.</td>
                     </tr>
                  )}
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
  
  filterLabel: { display: "block", marginBottom: 6, fontWeight: "600", fontSize: 13, color: "#64748b" },
  toast: { padding: "12px 20px", borderRadius: 8, marginBottom: 20, fontWeight: "600", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
  
  formCard: { background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: 24, border: "1px solid #e2e8f0" },
  formRow: { display: "flex", gap: 24, flexWrap: "wrap" },
  formGroup: { flex: 1, minWidth: 200 },
  label: { display: "block", marginBottom: 8, fontWeight: "600", fontSize: 13, color: "#475569" },
  input: { width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: 14, boxSizing: "border-box", outline: "none" },
  select: { width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: 14, outline: "none", backgroundColor: "#fff", cursor: "pointer", color: "#475569" },
  
  submitBtn: { backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: 14 },
  cancelBtn: { backgroundColor: "#f1f5f9", color: "#475569", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: 14, marginLeft: 12 },

  tableCard: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "16px 20px", textAlign: "left", fontWeight: "600", fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s" },
  td: { padding: "16px 20px", fontSize: 14, color: "#334155" },
  
  plateBadge: { display: "inline-block", padding: "4px 12px", backgroundColor: "#fff", border: "2px solid #0f172a", borderRadius: "4px", fontWeight: "bold", fontSize: 14, color: "#0f172a" },
  typeTag: { padding: "4px 10px", backgroundColor: "#f1f5f9", borderRadius: "6px", fontSize: 12, fontWeight: "600", color: "#475569" },
  actionBtn: { backgroundColor: "transparent", border: "none", color: "#3b82f6", padding: "4px 8px", cursor: "pointer", fontSize: 13, fontWeight: "bold" },
};

export default VehicleManagement;
