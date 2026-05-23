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

  const handlePurge = async () => {
    if (!purgeDate) {
      alert("Vui lòng chọn ngày mốc để dọn dẹp.");
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa VĨNH VIỄN các lịch sử gửi xe trước ngày ${purgeDate}?`)) {
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
            <div style={styles.avatar}>💾</div>
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
                      <td style={styles.td}>
                        <button 
                          onClick={() => handleRestore(bk.filename)}
                          style={styles.restoreBtn}
                        >
                          🔄 Phục hồi
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
  container: { display: "flex", height: "100vh", backgroundColor: "#f1f5f9", fontFamily: "sans-serif" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topHeader: { height: 70, backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 24 },
  headerRight: { display: "flex", alignItems: "center" },
  avatar: { width: 40, height: 40, backgroundColor: "#e0e7ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginLeft: 12 },
  contentBody: { flex: 1, padding: 30, overflowY: "auto" },
  
  toast: { padding: "12px 20px", borderRadius: 8, marginBottom: 20, fontWeight: "600", display: "flex", alignItems: "center", gap: 10 },
  
  primaryBtn: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: '600', cursor: 'pointer' },
  restoreBtn: { backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: '600', cursor: 'pointer' },
  dangerBtn: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: '600', cursor: 'pointer' },
  
  tableCard: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "16px 20px", textAlign: "left", fontWeight: "600", fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s", "&:hover": { backgroundColor: "#f8fafc" } },
  td: { padding: "16px 20px", fontSize: 14, color: "#334155" },
  
  input: { padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' },
};

export default BackupManagement;
