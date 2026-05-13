import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

const SystemSettings = () => {
  const { user } = useAuth();
  
  // Dummy state for global settings since we don't have an API for this yet
  const [settings, setSettings] = useState({
    autoGateOpen: true,
    allowVisitorCheckIn: true,
    overloadAlert: true,
    maxCapacityRatio: 90
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSave = () => {
    setMessage({ type: "success", text: "Cập nhật cấu hình hệ thống thành công!" });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
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
            <div style={{...styles.toast, backgroundColor: '#dcfce7', color: '#166534'}}>
              ✅ {message.text}
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Tự động mở Barrier (Auto-Gate)</div>
                <div style={styles.settingDesc}>Hệ thống tự động nhận diện biển số và mở cổng khi xe lại gần.</div>
              </div>
              <button 
                onClick={() => setSettings({...settings, autoGateOpen: !settings.autoGateOpen})}
                style={{...styles.toggleBtn, backgroundColor: settings.autoGateOpen ? '#059669' : '#cbd5e1'}}
              >
                <div style={{...styles.toggleCircle, transform: settings.autoGateOpen ? 'translateX(20px)' : 'translateX(0)'}} />
              </button>
            </div>

            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Cho phép Khách vãng lai gửi xe</div>
                <div style={styles.settingDesc}>Mở chức năng ghi nhận xe không cần đăng ký trước cho Bảo vệ.</div>
              </div>
              <button 
                onClick={() => setSettings({...settings, allowVisitorCheckIn: !settings.allowVisitorCheckIn})}
                style={{...styles.toggleBtn, backgroundColor: settings.allowVisitorCheckIn ? '#059669' : '#cbd5e1'}}
              >
                <div style={{...styles.toggleCircle, transform: settings.allowVisitorCheckIn ? 'translateX(20px)' : 'translateX(0)'}} />
              </button>
            </div>

            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Cảnh báo quá tải (Overload Alert)</div>
                <div style={styles.settingDesc}>Thông báo cho quản trị viên khi sức chứa bãi đỗ đạt ngưỡng tối đa.</div>
              </div>
              <button 
                onClick={() => setSettings({...settings, overloadAlert: !settings.overloadAlert})}
                style={{...styles.toggleBtn, backgroundColor: settings.overloadAlert ? '#059669' : '#cbd5e1'}}
              >
                <div style={{...styles.toggleCircle, transform: settings.overloadAlert ? 'translateX(20px)' : 'translateX(0)'}} />
              </button>
            </div>

            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Ngưỡng cảnh báo quá tải (%)</div>
                <div style={styles.settingDesc}>Hệ thống sẽ cảnh báo nếu sức chứa đạt tỷ lệ này.</div>
              </div>
              <input 
                type="number" 
                value={settings.maxCapacityRatio} 
                onChange={(e) => setSettings({...settings, maxCapacityRatio: e.target.value})}
                style={styles.input}
              />
            </div>

            <div style={{marginTop: 24, display: 'flex', justifyContent: 'flex-end'}}>
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
  contentBody: { flex: 1, padding: 30, overflowY: "auto", display: "flex", flexDirection: "column" },
  
  toast: { padding: "12px 20px", borderRadius: 8, marginBottom: 20, fontWeight: "600", display: "flex", alignItems: "center", gap: 10 },
  
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 30, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", maxWidth: 800 },
  settingGroup: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #f1f5f9' },
  settingInfo: { flex: 1, paddingRight: 40 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  settingDesc: { fontSize: 14, color: '#64748b' },
  
  toggleBtn: { width: 44, height: 24, borderRadius: 12, border: 'none', position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s' },
  toggleCircle: { width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 2, left: 2, transition: 'transform 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  
  input: { padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, width: 100, textAlign: 'center', outline: 'none' },
  saveBtn: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 15, fontWeight: '600', cursor: 'pointer' }
};

export default SystemSettings;
