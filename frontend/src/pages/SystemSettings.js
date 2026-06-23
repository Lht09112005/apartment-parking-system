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
    system_name: "39°C Management System",
    max_login_attempts: 5
  });

  const [initialSettings, setInitialSettings] = useState(null);

  const [message, setMessage] = useState({ type: "", text: "" });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get("/settings");
      setSettings(res.data);
      setInitialSettings(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Không thể tải cấu hình." });
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (initialSettings && settings) {
      window.__unsavedSettings__ = JSON.stringify(initialSettings) !== JSON.stringify(settings);
    }
  }, [settings, initialSettings]);

  useEffect(() => {
    return () => { window.__unsavedSettings__ = false; };
  }, []);

  useRealtimeRefresh(fetchSettings, ["settings"], {
    intervalMs: 15000,
  });

  const handleSave = () => {
    if (JSON.stringify(settings) === JSON.stringify(initialSettings)) {
      setShowInfoModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSave = async () => {
    setShowConfirmModal(false);
    try {
      await axios.put("/settings", { settings });

      setShowSuccessModal(true);

      setInitialSettings(settings);
      window.__unsavedSettings__ = false;
      window.dispatchEvent(new Event('settingsUpdated'));
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
            <h2 style={{ margin: 0, fontSize: 20, color: '#1e293b' }}>Cấu hình hệ thống toàn cục</h2>
          </div>
          <div style={styles.headerRight}>
            <div style={{ textAlign: 'right', marginRight: 12 }}>
              <div style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>Super Admin: {user?.username}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>HỆ THỐNG</div>
            </div>
            <div style={styles.avatar}><span className="material-symbols-rounded" style={{ fontSize: 20 }}>settings</span></div>
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
            <div style={{ ...styles.toast, backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b' }}>
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </div>
          )}

          <div style={styles.card}>
            <h4 style={{ marginTop: 0, color: '#0f172a' }}>Thông tin chung</h4>
            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Tên hệ thống</div>
                <div style={styles.settingDesc}>Tên hiển thị của hệ thống bãi đỗ xe.</div>
              </div>
              <input
                type="text"
                value={settings.system_name}
                onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
                style={{ ...styles.input, width: 250, textAlign: 'left' }}
              />
            </div>

            <h4 style={{ marginTop: 32, color: '#0f172a' }}>Giới hạn hệ thống</h4>
            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Số lượng Bảo vệ tối đa</div>
                <div style={styles.settingDesc}>Giới hạn số tài khoản Security mà Admin được phép tạo.</div>
              </div>
              <input
                type="number"
                value={settings.max_security_accounts}
                onChange={(e) => setSettings({ ...settings, max_security_accounts: parseInt(e.target.value) })}
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
                onChange={(e) => setSettings({ ...settings, max_resident_accounts: parseInt(e.target.value) })}
                style={styles.input}
              />
            </div>

            <h4 style={{ marginTop: 32, color: '#0f172a' }}>Bảo mật & Bảo trì</h4>
            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Chế độ bảo trì (Maintenance Mode)</div>
                <div style={styles.settingDesc}>Khi bật, hệ thống sẽ chặn tất cả yêu cầu, ngoại trừ SuperAdmin.</div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                style={{ ...styles.toggleBtn, backgroundColor: settings.maintenance_mode ? '#ef4444' : '#cbd5e1' }}
              >
                <div style={{ ...styles.toggleCircle, transform: settings.maintenance_mode ? 'translateX(20px)' : 'translateX(0)' }} />
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
                onChange={(e) => setSettings({ ...settings, data_retention_years: parseInt(e.target.value) })}
                style={styles.input}
              />
            </div>

            <div style={styles.settingGroup}>
              <div style={styles.settingInfo}>
                <div style={styles.settingTitle}>Số lần đăng nhập sai tối đa</div>
                <div style={styles.settingDesc}>Số lần nhập mật khẩu sai liên tục tối đa trước khi tài khoản bị khóa.</div>
              </div>
              <input
                type="number"
                value={settings.max_login_attempts ?? 5}
                onChange={(e) => setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) || 5 })}
                style={styles.input}
              />
            </div>

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSave} style={styles.saveBtn}>Lưu cấu hình</button>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(45, 51, 39, 0.6)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000, backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#FFFBF5", borderRadius: 20, width: "90%", maxWidth: 400, padding: 24,
            boxShadow: "0 20px 45px rgba(0,0,0,0.15)", fontFamily: "'Outfit', sans-serif", textAlign: "center"
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", backgroundColor: "rgba(205, 92, 92, 0.1)",
              color: "#CD5C5C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px"
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 32 }}>save</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", color: "#2D3327", fontSize: 18, fontWeight: "800" }}>LƯU CẤU HÌNH HỆ THỐNG</h3>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 14, lineHeight: "20px" }}>
              Bạn có chắc chắn muốn áp dụng các thay đổi cấu hình này cho toàn hệ thống không?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={confirmSave}
                style={{
                  flex: 1, padding: "10px 16px", backgroundColor: "#CD5C5C", color: "#FFFBF5", border: "none",
                  borderRadius: 10, fontSize: 14, fontWeight: "700", cursor: "pointer", transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#b04f4f"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#CD5C5C"}
              >
                Lưu thay đổi
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1, padding: "10px 16px", backgroundColor: "#F1ECE4", color: "#5F504B", border: "1px solid #E4DDD3",
                  borderRadius: 10, fontSize: 14, fontWeight: "700", cursor: "pointer"
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(45, 51, 39, 0.6)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000, backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#FFFBF5", borderRadius: 20, width: "90%", maxWidth: 400, padding: 24,
            boxShadow: "0 20px 45px rgba(0,0,0,0.15)", fontFamily: "'Outfit', sans-serif", textAlign: "center"
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", backgroundColor: "rgba(205, 92, 92, 0.1)",
              color: "#CD5C5C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px"
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 32 }}>check_circle</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", color: "#2D3327", fontSize: 18, fontWeight: "800" }}>ĐÃ LƯU CẤU HÌNH</h3>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 14, lineHeight: "20px" }}>
              Hệ thống đã lưu cấu hình thành công! Vui lòng tải lại trang (F5) để thấy thay đổi (nếu cần).
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  flex: 1, padding: "10px 16px", backgroundColor: "#CD5C5C", color: "#FFFBF5", border: "none",
                  borderRadius: 10, fontSize: 14, fontWeight: "700", cursor: "pointer", transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#b04f4f"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#CD5C5C"}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(45, 51, 39, 0.6)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000, backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#FFFBF5", borderRadius: 20, width: "90%", maxWidth: 400, padding: 24,
            boxShadow: "0 20px 45px rgba(0,0,0,0.15)", fontFamily: "'Outfit', sans-serif", textAlign: "center"
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", backgroundColor: "rgba(205, 92, 92, 0.1)",
              color: "#CD5C5C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px"
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 32 }}>info</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", color: "#2D3327", fontSize: 18, fontWeight: "800" }}>CHƯA CÓ THAY ĐỔI</h3>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 14, lineHeight: "20px" }}>
              Bạn chưa thay đổi thông số nào so với cấu hình hiện tại.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowInfoModal(false)}
                style={{
                  flex: 1, padding: "10px 16px", backgroundColor: "#CD5C5C", color: "#FFFBF5", border: "none",
                  borderRadius: 10, fontSize: 14, fontWeight: "700", cursor: "pointer", transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#b04f4f"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#CD5C5C"}
              >
                Đã hiểu
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
  headerRight: { display: "flex", alignItems: "center" },
  avatar: { width: 36, height: 36, backgroundColor: "#3F5E4D", color: "#FFFBF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: "700", boxShadow: "0 4px 10px rgba(63, 94, 77, 0.15)", marginLeft: 12 },
  contentBody: { flex: 1, padding: 24, overflowY: "auto" },

  toast: { padding: "14px 24px", borderRadius: 12, marginBottom: 20, fontWeight: "600", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)" },

  card: { backgroundColor: "#fff", borderRadius: 20, padding: 30, boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)", border: "1px solid rgba(139, 115, 85, 0.08)", maxWidth: 800 },
  settingGroup: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #F1ECE4' },
  settingInfo: { flex: 1, paddingRight: 40 },
  settingTitle: { fontSize: 16, fontWeight: '700', color: '#2D3327', marginBottom: 4 },
  settingDesc: { fontSize: 14, color: '#64748b' },

  toggleBtn: { width: 44, height: 24, borderRadius: 12, border: 'none', position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s' },
  toggleCircle: { width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 2, left: 2, transition: 'transform 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },

  input: { padding: '8px 16px', borderRadius: 10, border: '2px solid #EAE5D9', fontSize: 15, width: 200, textAlign: 'left', outline: 'none', backgroundColor: "#FFFBF5", color: "#2D3327", fontFamily: "'Outfit', sans-serif" },
  saveBtn: { backgroundColor: '#3F5E4D', color: '#FFFBF5', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 15, fontWeight: '700', cursor: 'pointer', boxShadow: "0 4px 12px rgba(63, 94, 77, 0.15)", transition: "all 0.2s" },
  fieldLabel: { display: "block", fontSize: 11, fontWeight: "700", color: "#9E826C", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }
};

export default SystemSettings;
