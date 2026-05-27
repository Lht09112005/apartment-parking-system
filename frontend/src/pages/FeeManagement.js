import React, { useEffect, useState } from "react";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const FeeManagement = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editData, setEditData] = useState(null);
  
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      const res = await axios.get("/parking/fees");
      setFees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useRealtimeRefresh(fetchData, ["fees", "residentFees"], {
    intervalMs: 12000,
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put("/parking/fees", editData);
      setMessage({ type: "success", text: "Cập nhật bảng giá thành công!" });
      setEditData(null);
      fetchData();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi cập nhật bảng giá" });
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />

      {/* Main Content */}
      <div style={styles.main}>
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={{margin: 0, fontSize: 20, color: '#1e293b'}}>Cấu hình phí gửi xe</h2>
            <div style={styles.onlineBadge}>
              <span style={styles.onlineDot}></span> System Online
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={{textAlign: 'right', marginRight: 12}}>
              <div style={{fontSize: 14, fontWeight: '600', color: '#1e293b'}}>Admin: {user?.username}</div>
              <div style={{fontSize: 12, color: '#64748b'}}>QUẢN LÝ BẢNG GIÁ</div>
            </div>
            <div style={styles.avatar}>💰</div>
          </div>
        </div>

        {/* Content Body */}
        <div style={styles.contentBody}>
          <div style={styles.titleRow}>
            <div>
               <h3 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>Bảng phí dịch vụ</h3>
               <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>Thiết lập đơn giá gửi xe theo giờ và phí đăng ký vé tháng cho từng loại phương tiện.</p>
            </div>
          </div>

          {message.text && (
             <div style={{...styles.toast, backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b'}}>
                {message.type === 'success' ? '✅' : '❌'} {message.text}
             </div>
          )}

          {editData && (
            <div style={styles.formCard}>
              <h4 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, color: '#0f172a' }}>
                Chỉnh sửa đơn giá: {editData.type_name}
              </h4>
              <form onSubmit={handleUpdate}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Giá ban ngày (VNĐ/{editData.block_hours}h)</label>
                    <input
                      style={styles.input}
                      type="number"
                      value={editData.day_block_price}
                      onChange={(e) => setEditData({ ...editData, day_block_price: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Giá ban đêm (VNĐ/{editData.block_hours}h)</label>
                    <input
                      style={styles.input}
                      type="number"
                      value={editData.night_block_price}
                      onChange={(e) => setEditData({ ...editData, night_block_price: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Số giờ mỗi Block</label>
                    <input
                      style={styles.input}
                      type="number"
                      value={editData.block_hours}
                      onChange={(e) => setEditData({ ...editData, block_hours: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Giá vé tháng (VNĐ/tháng)</label>
                    <input
                      style={styles.input}
                      type="number"
                      value={editData.monthly_fee}
                      onChange={(e) => setEditData({ ...editData, monthly_fee: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ marginTop: 24 }}>
                  <button type="submit" style={styles.submitBtn}>Lưu thay đổi</button>
                  <button type="button" onClick={() => setEditData(null)} style={styles.cancelBtn}>Hủy bỏ</button>
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
                    <th style={styles.th}>Loại phương tiện</th>
                    <th style={styles.th}>Block (Giờ)</th>
                    <th style={styles.th}>Giá ban ngày</th>
                    <th style={styles.th}>Giá ban đêm</th>
                    <th style={styles.th}>Giá vé tháng</th>
                    <th style={{...styles.th, textAlign: 'right'}}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee) => (
                    <tr key={fee.type_id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong style={{ color: '#0f172a' }}>{fee.type_name}</strong>
                      </td>
                      <td style={styles.td}>{fee.block_hours}h</td>
                      <td style={styles.td}>{Number(fee.day_block_price).toLocaleString()}</td>
                      <td style={styles.td}>{Number(fee.night_block_price).toLocaleString()}</td>
                      <td style={styles.td}>{Number(fee.monthly_fee).toLocaleString()}</td>
                      <td style={{...styles.td, textAlign: 'right'}}>
                        <button
                          onClick={() => {
                            setEditData(fee);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          style={styles.actionBtn}
                        >
                          Chỉnh sửa
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
  
  toast: { padding: "12px 20px", borderRadius: 8, marginBottom: 20, fontWeight: "600", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
  formCard: { background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: 24, border: "1px solid #e2e8f0" },
  formRow: { display: "flex", gap: 24, flexWrap: "wrap" },
  formGroup: { flex: 1, minWidth: 200 },
  label: { display: "block", marginBottom: 8, fontWeight: "600", fontSize: 13, color: "#475569" },
  input: { width: "100%", padding: "12px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: 14, boxSizing: "border-box", outline: "none" },
  submitBtn: { backgroundColor: "#3b82f6", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: 14 },
  cancelBtn: { backgroundColor: "#f1f5f9", color: "#475569", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: 14, marginLeft: 12 },

  tableCard: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "16px 20px", textAlign: "left", fontWeight: "600", fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s" },
  td: { padding: "16px 20px", fontSize: 14, color: "#334155" },
  actionBtn: { backgroundColor: "transparent", border: "none", color: "#3b82f6", padding: "4px 8px", cursor: "pointer", fontSize: 13, fontWeight: "bold" },
};

export default FeeManagement;
