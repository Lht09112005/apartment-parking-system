import React, { useEffect, useState } from "react";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";

const BackupManagement = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [purgeDate, setPurgeDate] = useState("");

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/backup");
      setBackups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  useRealtimeRefresh(fetchBackups, ["backups"], {
    intervalMs: 15000,
  });

  const handleCreateBackup = async () => {
    try {
      setMessage({ type: "info", text: "Đang tạo bản sao lưu, vui lòng đợi..." });
      await axios.post("/backup/create");
      setMessage({ type: "success", text: "Tạo bản sao lưu thành công!" });
      fetchBackups();
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi khi tạo bản sao lưu." });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleRestore = async (filename) => {
    if (window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn phục hồi dữ liệu từ bản sao lưu ${filename}? Toàn bộ dữ liệu hiện tại sẽ bị ghi đè.`)) {
      try {
        setMessage({ type: "info", text: "Đang phục hồi dữ liệu, vui lòng đợi..." });
        await axios.post(`/backup/restore/${filename}`);
        setMessage({ type: "success", text: "Phục hồi dữ liệu thành công!" });
      } catch (err) {
        setMessage({ type: "error", text: "Lỗi khi phục hồi dữ liệu." });
      }
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleDownload = async (filename) => {
    try {
      setMessage({ type: "info", text: "Đang chuẩn bị file tải về..." });
      const res = await axios.get(`/backup/download/${filename}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setMessage({ type: "success", text: "Đã tải file thành công!" });
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi khi tải file." });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handlePurge = async () => {
    if (!purgeDate) {
      alert("Vui lòng chọn ngày mốc để dọn dẹp.");
      return;
    }

    const hasRecentBackup = backups.some(b => {
      const backupDate = new Date(b.created_at);
      const now = new Date();
      return (now - backupDate) < 24 * 60 * 60 * 1000;
    });

    if (!hasRecentBackup) {
      if (!window.confirm("⚠️ CẢNH BÁO NGUY HIỂM ⚠️\nBạn CHƯA TẠO BẢN SAO LƯU nào trong 24 giờ qua.\nNếu hệ thống xóa nhầm, dữ liệu sẽ MẤT VĨNH VIỄN không thể khôi phục.\n\nBạn có muốn HỦY thao tác này để ra ngoài ấn 'Tạo bản sao lưu' trước không? (Nhấn Cancel/Hủy để quay lại, OK để tiếp tục xóa)")) {
        return;
      }
    }

    if (window.confirm(`XÁC NHẬN CUỐI CÙNG:\nBạn có chắc muốn xóa VĨNH VIỄN các lịch sử gửi xe, log hệ thống và thông báo cũ trước ngày ${purgeDate}?`)) {
      try {
        const res = await axios.delete("/backup/purge", { data: { before_date: purgeDate } });
        setMessage({ type: "success", text: res.data.message });
      } catch (err) {
        setMessage({ type: "error", text: "Lỗi khi dọn dẹp dữ liệu." });
      }
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={{margin: 0, fontSize: 20, color: '#1e293b'}}>Quản lý Dữ liệu Hệ thống</h2>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.avatar}><span className="material-symbols-rounded" style={{ fontSize: 20 }}>cloud_upload</span></div>
          </div>
        </div>

        <div style={styles.contentBody}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <h3 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>Sao lưu & Phục hồi CSDL</h3>
               <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>
                 Tạo bản sao lưu dữ liệu hiện tại hoặc phục hồi hệ thống từ bản sao lưu cũ.
               </p>
            </div>
            <button onClick={handleCreateBackup} style={styles.primaryBtn}>
              + Tạo bản sao lưu mới
            </button>
          </div>

          {message.text && (
            <div style={{...styles.toast, 
              backgroundColor: message.type === 'success' ? '#dcfce7' : message.type === 'error' ? '#fee2e2' : '#e0f2fe', 
              color: message.type === 'success' ? '#166534' : message.type === 'error' ? '#991b1b' : '#0369a1'
            }}>
              {message.text}
            </div>
          )}

          <div style={styles.tableCard}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Đang tải lịch sử backup...</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>Tên File Backup</th>
                    <th style={styles.th}>Thời gian tạo</th>
                    <th style={styles.th}>Người tạo</th>
                    <th style={styles.th}>Dung lượng</th>
                    <th style={styles.th}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{textAlign: "center", padding: "30px", color: "#64748b"}}>Chưa có bản sao lưu nào.</td>
                    </tr>
                  ) : backups.map((bk) => (
                    <tr key={bk.backup_id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong style={{ color: '#0f172a' }}>{bk.filename}</strong>
                      </td>
                      <td style={styles.td}>
                        {new Date(bk.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td style={styles.td}>{bk.created_by}</td>
                      <td style={styles.td}>{(bk.size_bytes / 1024).toFixed(2)} KB</td>
                      <td style={{...styles.td, display: 'flex', gap: '8px'}}>
                        <button 
                          onClick={() => handleRestore(bk.filename)}
                          style={styles.restoreBtn}
                        >
                          🔄 Phục hồi
                        </button>
                        <button 
                          onClick={() => handleDownload(bk.filename)}
                          style={styles.downloadBtn}
                        >
                          ⬇️ Tải về
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{...styles.tableCard, marginTop: 40, padding: 30, border: '1px solid #fee2e2'}}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#991b1b' }}>Dọn dẹp dữ liệu rác (Data Purge)</h4>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
              Xóa vĩnh viễn các bản ghi lịch sử xe ra vào (parking_session) đã hoàn thành trước một ngày nhất định để giảm tải cho CSDL. <br/>
              <strong>Lưu ý: Không thể hoàn tác hành động này trừ khi bạn có bản sao lưu (Backup) tương ứng!</strong>
            </p>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: '600' }}>Xóa dữ liệu cũ hơn ngày:</span>
              <input 
                type="date" 
                value={purgeDate}
                onChange={(e) => setPurgeDate(e.target.value)}
                style={styles.input}
              />
              <button onClick={handlePurge} style={styles.dangerBtn}>
                🗑️ Thực thi dọn dẹp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: "flex", height: "100vh", backgroundColor: "#FAF8F5", fontFamily: "'Outfit', sans-serif" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topHeader: { height: 64, backgroundColor: "#FFFBF5", borderBottom: "1px solid rgba(139, 115, 85, 0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 24 },
  headerRight: { display: "flex", alignItems: "center" },
  avatar: { width: 36, height: 36, backgroundColor: "#3F5E4D", color: "#FFFBF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: "700", boxShadow: "0 4px 10px rgba(63, 94, 77, 0.15)", marginLeft: 12 },
  contentBody: { flex: 1, padding: 24, overflowY: "auto" },
  
  toast: { padding: "14px 24px", borderRadius: 12, marginBottom: 20, fontWeight: "600", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)" },
  
  primaryBtn: { backgroundColor: '#3F5E4D', color: '#FFFBF5', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: '700', cursor: 'pointer', boxShadow: "0 4px 12px rgba(63, 94, 77, 0.15)" },
  restoreBtn: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#0f172a',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: 14,
    transition: 'all 0.2s',
  },
  downloadBtn: {
    padding: '8px 16px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    color: '#166534',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: 14,
    transition: 'all 0.2s',
  },
  dangerBtn: {
    padding: '10px 20px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)',
  },
  
  tableCard: { background: "#fff", borderRadius: 20, boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)", border: "1px solid rgba(139, 115, 85, 0.08)", overflowY: "auto", maxHeight: "550px" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#EAE5D9", borderBottom: "1px solid #F1ECE4" },
  th: { padding: "16px 20px", textAlign: "left", fontWeight: "700", fontSize: 12, color: "#2D3327", textTransform: "uppercase", letterSpacing: 0.5, position: "sticky", top: 0, backgroundColor: "#EAE5D9", zIndex: 1 },
  tr: { borderBottom: "1px solid #F1ECE4", transition: "background-color 0.15s" },
  td: { padding: "16px 20px", fontSize: 14, color: "#2D3327" },
  
  input: { padding: '10px 16px', borderRadius: 10, border: '2px solid #EAE5D9', fontSize: 14, outline: 'none', backgroundColor: "#FFFBF5", color: "#2D3327", fontFamily: "'Outfit', sans-serif" },
};

export default BackupManagement;
