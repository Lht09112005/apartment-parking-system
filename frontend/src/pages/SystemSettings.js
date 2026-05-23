import React, { useCallback, useState, useEffect } from "react";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import axios from "../api/axios";

const SystemSettings = () => {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState({
    max_security_accounts: 10,
    max_resident_accounts: 500,
    maintenance_mode: false,
    session_timeout_minutes: 480,
    data_retention_years: 3,
    system_name: "39°C Management System"
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get("/settings");
      setSettings(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Không thể tải cấu hình." });
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useRealtimeRefresh(fetchSettings, ["settings"], {
    intervalMs: 15000,
  });

  const handleSave = async () => {
    try {
      await axios.put("/settings", { settings });
      setMessage({ type: "success", text: "Cập nhật cấu hình hệ thống thành công! Vui lòng tải lại trang (F5) để thấy thay đổi." });
      window.dispatchEvent(new Event('settingsUpdated'));
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi khi lưu cấu hình." });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={{margin: 0, fontSize: 20, color: '#1e293b'}}>Cấu hình hệ thống toàn cục</h2>
          </div>
          <div style={styles.headerRight}>
            <div style={{textAlign: 'right', marginRight: 12}}>
              <div style={{fontSize: 14, fontWeight: '600', color: '#1e293b'}}>Super Admin: {user?.username}</div>
              <div style={{fontSize: 12, color: '#64748b'}}>HỆ THỐNG</div>
            </div>
            <div style={styles.avatar}>⚙️</div>
          </div>
        </div>

        {/* Content Body */}
        <div style={styles.contentBody}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>Thiết lập hệ thống</h3>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>
              Các thông số cấu hình hoạt động của toàn hệ thống bãi đỗ xe thông minh.
            </p>
          </div>

          {message.text && (
            <div style={{...styles.toast, backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b'}}>
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </div>
          )}

          <div style={styles.card}>
            <h4 style={{marginTop: 0, color: '#0f172a'}}>Thông tin chung</h4>
            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Tên hệ thống</div>
                <div style={styles.settingDesc}>Tên hiển thị của hệ thống bãi đỗ xe.</div>
              </div>
              <input 
                type="text" 
                value={settings.system_name} 
                onChange={(e) => setSettings({...settings, system_name: e.target.value})}
                style={{...styles.input, width: 250, textAlign: 'left'}}
              />
            </div>

            <h4 style={{marginTop: 32, color: '#0f172a'}}>Giới hạn hệ thống</h4>
            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Số lượng Bảo vệ tối đa</div>
                <div style={styles.settingDesc}>Giới hạn số tài khoản Security mà Admin được phép tạo.</div>
              </div>
              <input 
                type="number" 
                value={settings.max_security_accounts} 
                onChange={(e) => setSettings({...settings, max_security_accounts: parseInt(e.target.value)})}
                style={styles.input}
              />
            </div>

            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Số lượng Cư dân tối đa</div>
                <div style={styles.settingDesc}>Giới hạn số tài khoản Resident tối đa.</div>
              </div>
              <input 
                type="number" 
                value={settings.max_resident_accounts} 
                onChange={(e) => setSettings({...settings, max_resident_accounts: parseInt(e.target.value)})}
                style={styles.input}
              />
            </div>

            <h4 style={{marginTop: 32, color: '#0f172a'}}>Bảo mật & Bảo trì</h4>
            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Chế độ bảo trì (Maintenance Mode)</div>
                <div style={styles.settingDesc}>Khi bật, hệ thống sẽ chặn tất cả yêu cầu, ngoại trừ SuperAdmin.</div>
              </div>
              <button 
                onClick={() => setSettings({...settings, maintenance_mode: !settings.maintenance_mode})}
                style={{...styles.toggleBtn, backgroundColor: settings.maintenance_mode ? '#ef4444' : '#cbd5e1'}}
              >
                <div style={{...styles.toggleCircle, transform: settings.maintenance_mode ? 'translateX(20px)' : 'translateX(0)'}} />
              </button>
            </div>

            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Thời gian lưu trữ dữ liệu (Năm)</div>
                <div style={styles.settingDesc}>Số năm giữ lại lịch sử ra vào và dữ liệu cũ trước khi bị xóa dọn dẹp.</div>
              </div>
              <input 
                type="number" 
                value={settings.data_retention_years} 
                onChange={(e) => setSettings({...settings, data_retention_years: parseInt(e.target.value)})}
                style={styles.input}
              />
            </div>

            <div style={{marginTop: 32, display: 'flex', justifyContent: 'flex-end'}}>
              <button onClick={handleSave} style={styles.saveBtn}>Lưu cấu hình</button>
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
  avatar: { width: 40, height: 40, backgroundColor: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginLeft: 12 },
  contentBody: { flex: 1, padding: 30, overflowY: "auto" },
  
  toast: { padding: "12px 20px", borderRadius: 8, marginBottom: 20, fontWeight: "600", display: "flex", alignItems: "center", gap: 10 },
  
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 30, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", maxWidth: 800 },
  settingGroup: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #f1f5f9' },
  settingInfo: { flex: 1, paddingRight: 40 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  settingDesc: { fontSize: 14, color: '#64748b' },
  
  toggleBtn: { width: 44, height: 24, borderRadius: 12, border: 'none', position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s' },
  toggleCircle: { width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 2, left: 2, transition: 'transform 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  
  input: { padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, width: 100, textAlign: 'center', outline: 'none' },
  saveBtn: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 15, fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }
};

export default SystemSettings;
