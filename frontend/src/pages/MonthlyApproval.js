import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const MonthlyApproval = () => {
  const location = useLocation();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [detail, setDetail] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: 'resident_name', direction: 'asc' });

  const { user } = useAuth();

  const fetchData = async () => {
    try {
      const res = await axios.get("/parking/monthly");
      setRegistrations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status");
    if (statusParam && ["all", "pending", "active", "canceled"].includes(statusParam)) {
      setFilterStatus(statusParam);
    }
  }, [location]);

  useRealtimeRefresh(fetchData, ["monthly", "residentVehicles", "residentFees"], {
    intervalMs: 10000,
  });

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, monthly_id: null, status: null });

  const confirmUpdateStatus = (monthly_id, status) => {
    setConfirmModal({ isOpen: true, monthly_id, status });
  };

  const handleUpdateStatus = async () => {
    const { monthly_id, status } = confirmModal;
    try {
      await axios.put(`/parking/monthly/${monthly_id}`, { status });
      setMessage({ type: "success", text: status === 'active' ? "Đã duyệt thành công!" : "Đã từ chối yêu cầu!" });
      setDetail(null);
      setConfirmModal({ isOpen: false, monthly_id: null, status: null });
      fetchData();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi cập nhật trạng thái" });
    }
  };

  const filtered = React.useMemo(() => {
    let result = filterStatus === "all" ? registrations : registrations.filter(r => r.status === filterStatus);
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [registrations, filterStatus, sortConfig]);
  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const activeCount = registrations.filter(r => r.status === 'active').length;

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={{ margin: 0, fontSize: 20, color: '#1e293b' }}>Duyệt đăng ký vé tháng</h2>
            <div style={styles.onlineBadge}><span style={styles.onlineDot}></span> System Online</div>
          </div>
          <div style={styles.headerRight}>
            <div style={{ textAlign: 'right', marginRight: 12 }}>
              <div style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>Admin: {user?.username}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>XÉT DUYỆT ĐĂNG KÝ</div>
            </div>
            <div style={styles.avatar}><span className="material-symbols-rounded" style={{ fontSize: 20 }}>calendar_month</span></div>
          </div>
        </div>

        <div style={styles.contentBody}>
          {/* Summary Cards */}
          <div style={styles.summaryRow}>
            <div 
              onClick={() => setFilterStatus('pending')}
              style={{ ...styles.summaryCard, borderLeftColor: '#f59e0b', cursor: 'pointer', transform: filterStatus === 'pending' ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.2s', boxShadow: filterStatus === 'pending' ? '0 12px 40px rgba(245, 158, 11, 0.15)' : '0 8px 30px rgba(139, 115, 85, 0.04)' }}
            >
              <div style={styles.summaryLabel}>Chờ duyệt</div>
              <div style={{ ...styles.summaryValue, color: '#f59e0b' }}>{pendingCount}</div>
            </div>
            <div 
              onClick={() => setFilterStatus('active')}
              style={{ ...styles.summaryCard, borderLeftColor: '#059669', cursor: 'pointer', transform: filterStatus === 'active' ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.2s', boxShadow: filterStatus === 'active' ? '0 12px 40px rgba(5, 150, 105, 0.15)' : '0 8px 30px rgba(139, 115, 85, 0.04)' }}
            >
              <div style={styles.summaryLabel}>Đang hoạt động</div>
              <div style={{ ...styles.summaryValue, color: '#059669' }}>{activeCount}</div>
            </div>
            <div 
              onClick={() => setFilterStatus('all')}
              style={{ ...styles.summaryCard, borderLeftColor: '#3b82f6', cursor: 'pointer', transform: filterStatus === 'all' ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.2s', boxShadow: filterStatus === 'all' ? '0 12px 40px rgba(59, 130, 246, 0.15)' : '0 8px 30px rgba(139, 115, 85, 0.04)' }}
            >
              <div style={styles.summaryLabel}>Tổng đăng ký</div>
              <div style={{ ...styles.summaryValue, color: '#3b82f6' }}>{registrations.length}</div>
            </div>
          </div>

          {/* Title */}
          <div style={{ ...styles.titleRow, marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Danh sách đăng ký</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Nhấn "Chi tiết" để xem đầy đủ thông tin trước khi duyệt.</p>
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14, color: '#0f172a' }}>🎯 Trạng thái:</strong>
                <div style={{ display: 'flex', gap: 8 }}>
                  {["all", "pending", "active", "canceled"].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      style={{ ...styles.filterBtn, ...(filterStatus === s ? styles.filterActive : {}) }}>
                      {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Chờ duyệt' : s === 'active' ? 'Đã duyệt' : 'Đã hủy'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: '#e2e8f0' }}></div>

              {/* Sort */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14, color: '#0f172a' }}>📶 Sắp xếp:</strong>
                <select
                  style={{ ...styles.select, width: '240px' }}
                  value={`${sortConfig.key}_${sortConfig.direction}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split('_');
                    setSortConfig({ key, direction });
                  }}
                >
                  <option value="resident_name_asc">Chủ xe (A-Z)</option>
                  <option value="resident_name_desc">Chủ xe (Z-A)</option>
                  <option value="start_date_asc">Ngày bắt đầu (Cũ - Mới)</option>
                  <option value="start_date_desc">Ngày bắt đầu (Mới - Cũ)</option>
                </select>
              </div>
            </div>
          </div>

          {message.text && (
            <div style={{ ...styles.toast, backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b' }}>
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </div>
          )}

          {/* Table */}
          <div style={styles.tableCard}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Đang tải dữ liệu...</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>Chủ xe / Căn hộ</th>
                    <th style={styles.th}>Biển số / Loại xe</th>
                    <th style={styles.th}>Thời hạn</th>
                    <th style={styles.th}>Trạng thái</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((reg) => (
                    <tr key={reg.monthly_id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{reg.resident_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Căn hộ: {reg.apartment_number}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{reg.plate_number}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{reg.type_name}</div>
                      </td>
                      <td style={styles.td}>
                        <div>{new Date(reg.start_date).toLocaleDateString('vi-VN')}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>→ {new Date(reg.end_date).toLocaleDateString('vi-VN')}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusTag,
                          backgroundColor: reg.status === 'active' ? '#ecfdf5' : reg.status === 'pending' ? '#fffbeb' : '#fef2f2',
                          color: reg.status === 'active' ? '#059669' : reg.status === 'pending' ? '#d97706' : '#dc2626'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                              {reg.status === 'active' ? 'check_circle' : reg.status === 'pending' ? 'pending' : 'cancel'}
                            </span>
                            {reg.status === 'active' ? 'Đã duyệt' : reg.status === 'pending' ? 'Chờ duyệt' : 'Đã hủy'}
                          </span>
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button onClick={() => setDetail(reg)} style={{ ...styles.detailBtn, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>visibility</span> Chi tiết
                        </button>
                        {reg.status === 'pending' && (
                          <>
                            <button onClick={() => confirmUpdateStatus(reg.monthly_id, 'active')} style={{ ...styles.actionBtn, color: '#059669', marginLeft: 8 }}>Duyệt</button>
                            <button onClick={() => confirmUpdateStatus(reg.monthly_id, 'canceled')} style={{ ...styles.actionBtn, color: '#ef4444', marginLeft: 4 }}>Từ chối</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Không có yêu cầu nào.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div style={styles.overlay} onClick={() => setDetail(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#fff' }}>📋 Chi tiết đăng ký vé tháng</h3>
              <button onClick={() => setDetail(null)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {/* Biểu mẫu CD_BM2 */}
              <div style={styles.formTitle}>BIỂU MẪU ĐĂNG KÝ GỬI XE THEO THÁNG</div>

              <div style={styles.detailGrid}>
                <div style={styles.detailGroup}>
                  <div style={styles.detailLabel}>Họ và tên cư dân</div>
                  <div style={styles.detailValue}>{detail.resident_name}</div>
                </div>
                <div style={styles.detailGroup}>
                  <div style={styles.detailLabel}>Số căn hộ</div>
                  <div style={styles.detailValue}>{detail.apartment_number}</div>
                </div>
                <div style={styles.detailGroup}>
                  <div style={styles.detailLabel}>Biển số xe</div>
                  <div style={{ ...styles.detailValue, fontSize: 20, fontWeight: '900', color: '#0f172a' }}>{detail.plate_number}</div>
                </div>
                <div style={styles.detailGroup}>
                  <div style={styles.detailLabel}>Loại xe</div>
                  <div style={styles.detailValue}>{detail.type_name}</div>
                </div>
                <div style={styles.detailGroup}>
                  <div style={styles.detailLabel}>Ngày bắt đầu</div>
                  <div style={styles.detailValue}>{new Date(detail.start_date).toLocaleDateString('vi-VN')}</div>
                </div>
                <div style={styles.detailGroup}>
                  <div style={styles.detailLabel}>Ngày kết thúc</div>
                  <div style={styles.detailValue}>{new Date(detail.end_date).toLocaleDateString('vi-VN')}</div>
                </div>
                <div style={styles.detailGroup}>
                  <div style={styles.detailLabel}>Trạng thái</div>
                  <div style={styles.detailValue}>
                    <span style={{
                      padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: '700',
                      backgroundColor: detail.status === 'active' ? '#dcfce7' : detail.status === 'pending' ? '#fef3c7' : '#fee2e2',
                      color: detail.status === 'active' ? '#059669' : detail.status === 'pending' ? '#d97706' : '#dc2626'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                          {detail.status === 'active' ? 'check_circle' : detail.status === 'pending' ? 'pending' : 'cancel'}
                        </span>
                        {detail.status === 'active' ? 'Đã duyệt' : detail.status === 'pending' ? 'Chờ duyệt' : 'Đã hủy'}
                      </span>
                    </span>
                  </div>
                </div>
                <div style={styles.detailGroup}>
                  <div style={styles.detailLabel}>Mã đăng ký</div>
                  <div style={styles.detailValue}>#{detail.monthly_id}</div>
                </div>
              </div>

              {/* Action buttons */}
              {detail.status === 'pending' && (
                <div style={styles.modalActions}>
                  <button onClick={() => confirmUpdateStatus(detail.monthly_id, 'active')}
                    style={{ ...styles.modalBtn, backgroundColor: '#059669', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18 }}>check_circle</span> Chấp nhận duyệt
                    </div>
                  </button>
                  <button onClick={() => confirmUpdateStatus(detail.monthly_id, 'canceled')}
                    style={{ ...styles.modalBtn, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18 }}>cancel</span> Từ chối
                    </div>
                  </button>
                </div>
              )}
              {detail.status === 'active' && (
                <div style={styles.modalActions}>
                  <button onClick={() => confirmUpdateStatus(detail.monthly_id, 'canceled')}
                    style={{ ...styles.modalBtn, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18 }}>lock</span> Hủy / Khóa vé tháng
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div style={styles.overlay} onClick={() => setConfirmModal({ isOpen: false, monthly_id: null, status: null })}>
          <div style={{...styles.modal, width: '400px', padding: '32px', textAlign: 'center'}} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, fontSize: 20, color: "#1e293b" }}>Xác nhận thao tác</h3>
            <p style={{ color: "#64748b", margin: "16px 0 24px 0" }}>
              Bạn có chắc chắn muốn <strong>{confirmModal.status === 'active' ? "DUYỆT" : "TỪ CHỐI"}</strong> yêu cầu này không?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                onClick={handleUpdateStatus} 
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                  backgroundColor: confirmModal.status === 'active' ? '#10b981' : '#ef4444', color: '#fff'
                }}
              >
                Xác nhận
              </button>
              <button 
                onClick={() => setConfirmModal({ isOpen: false, monthly_id: null, status: null })} 
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                  backgroundColor: '#f1f5f9', color: '#475569'
                }}
              >
                Hủy bỏ
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

  summaryRow: { display: 'flex', gap: 16, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: '16px 20px', border: '1px solid rgba(139, 115, 85, 0.08)', borderLeftWidth: 4, borderLeftColor: '#3F5E4D', boxShadow: '0 8px 30px rgba(139, 115, 85, 0.04)' },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  summaryValue: { fontSize: 28, fontWeight: '800', color: '#2D3327' },

  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 },
  filterBtn: { padding: '10px 20px', borderRadius: 10, border: '1px solid #E4DDD3', backgroundColor: '#F1ECE4', fontSize: 13, fontWeight: '700', color: '#5F504B', cursor: 'pointer', transition: 'all 0.2s' },
  filterActive: { backgroundColor: '#3F5E4D', color: '#FFFBF5', borderColor: '#3F5E4D', boxShadow: "0 4px 12px rgba(63, 94, 77, 0.15)" },
  select: { padding: "10px 16px", border: "2px solid #EAE5D9", borderRadius: 10, fontSize: 13, outline: "none", backgroundColor: "#FFFBF5", cursor: "pointer", color: "#2D3327", fontFamily: "'Outfit', sans-serif" },

  toast: { padding: "14px 24px", borderRadius: 12, marginBottom: 20, fontWeight: "600", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)" },
  tableCard: { background: "#fff", borderRadius: 20, boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)", border: "1px solid rgba(139, 115, 85, 0.08)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#EAE5D9", borderBottom: "1px solid #F1ECE4" },
  th: { padding: "16px 20px", textAlign: "left", fontWeight: "700", fontSize: 12, color: "#2D3327", textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { borderBottom: "1px solid #F1ECE4", transition: "background-color 0.15s" },
  td: { padding: "16px 20px", fontSize: 14, color: "#2D3327" },
  statusTag: { padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: "700" },
  actionBtn: { backgroundColor: "transparent", border: "none", padding: "4px 8px", cursor: "pointer", fontSize: 13, fontWeight: "bold" },
  detailBtn: { backgroundColor: '#F1ECE4', border: '1px solid #E4DDD3', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: '700', color: '#5F504B', transition: 'all 0.2s' },

  // Modal
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: 20, width: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(139, 115, 85, 0.1)' },
  modalHeader: { backgroundColor: '#3F5E4D', padding: '20px 24px', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { backgroundColor: 'transparent', border: 'none', color: '#FFFBF5', fontSize: 20, cursor: 'pointer' },
  modalBody: { padding: 24 },
  formTitle: { textAlign: 'center', fontSize: 14, fontWeight: '800', color: '#9E826C', letterSpacing: 1, marginBottom: 24, textTransform: 'uppercase', borderBottom: '2px dashed #EAE5D9', paddingBottom: 16 },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  detailGroup: { padding: '12px 16px', backgroundColor: '#FFFBF5', borderRadius: 12, border: '2px solid #EAE5D9' },
  detailLabel: { fontSize: 11, fontWeight: '800', color: '#9E826C', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  detailValue: { fontSize: 15, fontWeight: '700', color: '#2D3327' },
  modalActions: { display: 'flex', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1ECE4' },
  modalBtn: { flex: 1, padding: '14px 20px', borderRadius: 10, border: 'none', fontSize: 15, fontWeight: '700', cursor: 'pointer' },
};

export default MonthlyApproval;
