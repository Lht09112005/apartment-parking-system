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
  container: { display: "flex", height: "100vh", backgroundColor: "#f1f5f9", fontFamily: "sans-serif" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topHeader: { height: 70, backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 24 },
  headerRight: { display: "flex", alignItems: "center" },
  avatar: { width: 40, height: 40, backgroundColor: "#e0e7ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginLeft: 12 },
  contentBody: { flex: 1, padding: 30, overflowY: "auto" },
  
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 },
  select: { padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: 14, outline: "none", backgroundColor: "#fff" },
  
  tableCard: { background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  th: { padding: "16px 20px", textAlign: "left", fontWeight: "600", fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s", "&:hover": { backgroundColor: "#f8fafc" } },
  td: { padding: "16px 20px", fontSize: 14, color: "#334155" },
  badge: { padding: "4px 10px", borderRadius: "6px", fontSize: 12, fontWeight: "600" }
};

export default AuditLogs;
