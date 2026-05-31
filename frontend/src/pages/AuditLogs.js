import React, { useCallback, useEffect, useState } from "react";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/audit/logs${filterAction ? `?action=${filterAction}` : ""}`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useRealtimeRefresh(fetchLogs, ["audit"], {
    intervalMs: 15000,
  });

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={{margin: 0, fontSize: 20, color: '#1e293b'}}>Nhật ký kiểm toán hệ thống</h2>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.avatar}>📋</div>
          </div>
        </div>

        <div style={styles.contentBody}>
          <div style={styles.titleRow}>
            <div>
               <h3 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>Giám sát hoạt động Admin</h3>
               <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>
                 Lưu trữ mọi thao tác thay đổi dữ liệu của tài khoản quản trị.
               </p>
            </div>
            
            <div>
              <select 
                value={filterAction} 
                onChange={(e) => setFilterAction(e.target.value)}
                style={styles.select}
              >
                <option value="">Tất cả thao tác</option>
                <option value="CREATE">Tạo mới (CREATE)</option>
                <option value="UPDATE">Cập nhật (UPDATE)</option>
                <option value="DELETE">Xóa (DELETE)</option>
                <option value="RESET_PASSWORD">Reset Pass (RESET_PASSWORD)</option>
              </select>
            </div>
          </div>

          <div style={styles.tableCard}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Đang tải nhật ký...</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>Thời gian</th>
                    <th style={styles.th}>Người dùng</th>
                    <th style={styles.th}>Hành động</th>
                    <th style={styles.th}>Mục tiêu</th>
                    <th style={styles.th}>Mô tả chi tiết</th>
                    <th style={styles.th}>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{textAlign: "center", padding: "30px", color: "#64748b"}}>Không có dữ liệu nhật ký.</td>
                    </tr>
                  ) : logs.map((log) => (
                    <tr key={log.log_id} style={styles.tr}>
                      <td style={styles.td}>
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td style={styles.td}>
                        <strong style={{ color: '#0f172a' }}>{log.username}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: log.action === 'CREATE' ? '#dcfce7' : log.action === 'DELETE' ? '#fee2e2' : '#e0e7ff',
                          color: log.action === 'CREATE' ? '#166534' : log.action === 'DELETE' ? '#991b1b' : '#3730a3'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {log.target_type} (#{log.target_id})
                      </td>
                      <td style={{...styles.td, maxWidth: 300}}>
                        {log.description}
                      </td>
                      <td style={styles.td}>
                        {log.ip_address}
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
  container: { display: "flex", height: "100vh", backgroundColor: "#FAF8F5", fontFamily: "'Outfit', sans-serif" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topHeader: { height: 64, backgroundColor: "#FFFBF5", borderBottom: "1px solid rgba(139, 115, 85, 0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 24 },
  headerRight: { display: "flex", alignItems: "center" },
  avatar: { width: 36, height: 36, backgroundColor: "#3F5E4D", color: "#FFFBF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: "700", boxShadow: "0 4px 10px rgba(63, 94, 77, 0.15)", marginLeft: 12 },
  contentBody: { flex: 1, padding: 24, overflowY: "auto" },
  
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 },
  select: { padding: "10px 16px", border: "2px solid #EAE5D9", borderRadius: 10, fontSize: 14, outline: "none", backgroundColor: "#FFFBF5", cursor: "pointer", color: "#2D3327", fontFamily: "'Outfit', sans-serif" },
  
  tableCard: { background: "#fff", borderRadius: 20, boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)", border: "1px solid rgba(139, 115, 85, 0.08)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#EAE5D9", borderBottom: "1px solid #F1ECE4" },
  th: { padding: "16px 20px", textAlign: "left", fontWeight: "700", fontSize: 12, color: "#2D3327", textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { borderBottom: "1px solid #F1ECE4", transition: "background-color 0.15s" },
  td: { padding: "16px 20px", fontSize: 14, color: "#2D3327" },
  badge: { padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: "700" }
};

export default AuditLogs;
