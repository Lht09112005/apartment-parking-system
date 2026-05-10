import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const SecurityDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Mode: "IN" or "OUT"
  const [mode, setMode] = useState("IN"); 

  const [plate, setPlate] = useState("");
  const [typeId, setTypeId] = useState(1);
  const [areaId, setAreaId] = useState("A"); // Mocking area A or B

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [message, setMessage] = useState({ type: "", text: "" });
  const [ticketInfo, setTicketInfo] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchVehicleTypes();
    fetchVehicles();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      const res = await axios.get("/vehicles/types");
      setVehicleTypes(res.data);
      if (res.data.length > 0) setTypeId(res.data[0].type_id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await axios.get("/vehicles");
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Find if plate is resident
  const currentVehicle = plate.trim() ? vehicles.find(v => v.plate_number.toLowerCase() === plate.trim().toLowerCase()) : null;

  const handleAction = async () => {
    setMessage({ type: "", text: "" });
    setTicketInfo(null);
    
    if (mode === "IN") {
      try {
        const res = await axios.post("/parking/check-in", {
          plate_number: plate,
          type_id: currentVehicle ? currentVehicle.type_id : typeId,
        });
        setMessage({ type: "success", text: res.data.message });
        // Clear after a few seconds
        setTimeout(() => { setPlate(""); setMessage({ type: "", text: "" }) }, 3000);
      } catch (err) {
        setMessage({ type: "error", text: err.response?.data?.message || "Lỗi check-in" });
      }
    } else {
      try {
        const res = await axios.post("/parking/check-out", {
          plate_number: plate,
        });
        setMessage({ type: "success", text: res.data.message });
        setTicketInfo({
          fee: res.data.fee,
          duration: res.data.duration_hours,
          time_in: new Date(res.data.time_in).toLocaleString(),
          time_out: new Date(res.data.time_out).toLocaleString(),
          is_resident: res.data.is_resident,
          is_monthly: res.data.is_monthly,
        });
        // Clear after a few seconds
        setTimeout(() => { setPlate(""); setMessage({ type: "", text: "" }) }, 8000);
      } catch (err) {
        setMessage({ type: "error", text: err.response?.data?.message || "Lỗi check-out" });
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ----- RENDER -----
  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Central HQ</h2>
          <p style={styles.sidebarSubTitle}>Security Operations</p>
        </div>
        <div style={styles.menuItems}>
          <div style={styles.menuItem}>Dashboard</div>
          <div style={{ ...styles.menuItem, ...styles.menuItemActive }}>Gate Control</div>
          <div style={styles.menuItem}>Vehicle Logs</div>
          <div style={styles.menuItem}>Financial Reports</div>
          <div style={styles.menuItem}>System Settings</div>
        </div>
        <div style={styles.sidebarFooter}>
          <button style={styles.emergencyBtn}>EMERGENCY LOCK</button>
          <div style={{marginTop: 'auto'}}>
            <div style={styles.bottomLink}>Help Center</div>
            <div style={styles.bottomLink} onClick={handleLogout}>Logout</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={{margin: 0, fontSize: 20, color: '#1e293b'}}>SmartPark Pro</h2>
            <div style={styles.onlineBadge}>
              <span style={styles.onlineDot}></span> System Online
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={{textAlign: 'right', marginRight: 12}}>
              <div style={{fontSize: 14, fontWeight: '600', color: '#1e293b'}}>Operator: {user?.username}</div>
              <div style={{fontSize: 12, color: '#64748b'}}>SHIFT A (06:00 - 14:00)</div>
            </div>
            <div style={styles.avatar}>👤</div>
          </div>
        </div>

        {/* Content Body */}
        <div style={styles.contentBody}>
          
          {/* Capacity Cards */}
          <div style={styles.capacityRow}>
            <div style={{...styles.capacityCard, borderColor: '#fca5a5'}}>
              <div style={{flex: 1}}>
                <div style={styles.cardLabel}>KHU A - Ô TÔ</div>
                <div style={styles.cardNumber}>142/150</div>
              </div>
              <div style={{...styles.cardIcon, background: '#fee2e2', color: '#ef4444'}}>⚠️</div>
            </div>
            <div style={{...styles.capacityCard, borderColor: '#86efac'}}>
              <div style={{flex: 1}}>
                <div style={styles.cardLabel}>KHU B - Ô TÔ</div>
                <div style={styles.cardNumber}>45/120</div>
              </div>
              <div style={{...styles.cardIcon, background: '#dcfce7', color: '#10b981'}}>✓</div>
            </div>
            <div style={{...styles.capacityCard, borderColor: '#86efac'}}>
              <div style={{flex: 1}}>
                <div style={styles.cardLabel}>KHU A - XE MÁY</div>
                <div style={styles.cardNumber}>890/1200</div>
              </div>
              <div style={{...styles.cardIcon, background: '#dcfce7', color: '#10b981'}}>✓</div>
            </div>
          </div>

          {/* Main Interaction Area */}
          <div style={styles.mainPanelRow}>
            {/* Left Box */}
            <div style={styles.leftPanel}>
              
              {/* Mode Toggle */}
              <div style={styles.modeToggle}>
                <button 
                  onClick={() => {setMode("IN"); setMessage({type: "", text: ""}); setTicketInfo(null)}} 
                  style={{...styles.modeBtn, ...(mode === "IN" ? styles.modeActiveIn : {})}}
                >
                  XẾ VÀO (CHECK-IN)
                </button>
                <button 
                  onClick={() => {setMode("OUT"); setMessage({type: "", text: ""}); setTicketInfo(null)}} 
                  style={{...styles.modeBtn, ...(mode === "OUT" ? styles.modeActiveOut : {})}}
                >
                  XE RA (CHECK-OUT)
                </button>
              </div>

              {/* Big Input */}
              <div style={styles.inputContainer}>
                <div style={styles.inputLabel}>NHẬP BIỂN SỐ XE / QUÉT THẺ</div>
                <input 
                  autoFocus
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  style={styles.bigInput}
                  placeholder="--- ---"
                />
                <div style={styles.inputUnderline}></div>
              </div>

              {/* Selectors */}
              <div style={styles.selectorsRow}>
                <div style={styles.selectorGroup}>
                  <div style={styles.selectorTitle}>Loại Phương Tiện</div>
                  <div style={styles.cardsWrap}>
                    {vehicleTypes.map(vt => (
                      <div 
                        key={vt.type_id}
                        onClick={() => !currentVehicle && setTypeId(vt.type_id)}
                        style={{
                          ...styles.selectCard,
                          backgroundColor: (currentVehicle ? currentVehicle.type_id === vt.type_id : typeId === vt.type_id) ? '#0f172a' : '#fff',
                          color: (currentVehicle ? currentVehicle.type_id === vt.type_id : typeId === vt.type_id) ? '#fff' : '#64748b',
                          cursor: currentVehicle ? 'not-allowed' : 'pointer',
                          opacity: currentVehicle && currentVehicle.type_id !== vt.type_id ? 0.5 : 1
                        }}
                      >
                        <div style={{fontSize: 24, marginBottom: 4}}>{vt.type_name === 'Ô tô' ? '🚘' : '🏍️'}</div>
                        <div>{vt.type_name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.selectorGroup}>
                  <div style={styles.selectorTitle}>Khu Vực Đỗ</div>
                  <div style={styles.cardsWrap}>
                    <div 
                      onClick={() => setAreaId("A")}
                      style={{...styles.selectCard, backgroundColor: areaId === "A" ? '#fff' : '#f8fafc', border: areaId === "A" ? '2px solid #0f172a' : '1px solid #e2e8f0', color: '#0f172a'}}
                    >
                      KHU A
                    </div>
                    <div 
                      onClick={() => setAreaId("B")}
                      style={{...styles.selectCard, backgroundColor: areaId === "B" ? '#fff' : '#f8fafc', border: areaId === "B" ? '2px solid #0f172a' : '1px solid #e2e8f0', color: '#0f172a'}}
                    >
                      KHU B
                    </div>
                  </div>
                </div>
              </div>

              {/* Toast Message inside Left Panel */}
              {message.text && (
                 <div style={{...styles.toast, backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b'}}>
                    {message.type === 'success' ? '✅' : '❌'} {message.text}
                 </div>
              )}

              {/* Bottom Actions */}
              <div style={styles.actionsRow}>
                <button style={{...styles.actionBtn, backgroundColor: '#64748b', color: '#fff', fontSize: 18, padding: '0 30px'}} onClick={() => {setPlate(""); setTicketInfo(null)}}>
                  🖨 In Vé Lẻ
                </button>
                <div style={{flex: 1}}></div>
                <button style={{...styles.actionBtn, backgroundColor: '#fee2e2', color: '#ef4444', marginRight: 20, fontSize: 18, padding: '0 40px'}} onClick={() => {setPlate(""); setTicketInfo(null)}}>
                  ⊗ Hủy Bỏ
                </button>
                <button 
                  onClick={handleAction}
                  style={{
                    ...styles.actionBtn, 
                    backgroundColor: mode === "IN" ? '#047857' : '#be123c', 
                    color: '#fff', 
                    fontSize: 24, 
                    fontWeight: 'bold', 
                    padding: '0 60px',
                    minWidth: '40%',
                    letterSpacing: 1
                  }}
                >
                  {mode === "IN" ? '⨀ CHO VÀO (ENTER)' : '⨀ CHO RA (EXIT)'}
                </button>
              </div>

            </div>

            {/* Right Panel */}
            <div style={styles.rightPanel}>
              {currentVehicle ? (
                <>
                  <div style={styles.ticketValidHeader}>VÉ THÁNG - HỢP LỆ ✓</div>
                  <div style={styles.userInfo}>
                    <div style={styles.userPhotoPlaceholder}>👤</div>
                    <div style={styles.userName}>{currentVehicle.resident_name || "Cư dân nội khu"}</div>
                    <div style={styles.userApt}>Căn hộ: {currentVehicle.apartment_number || "---"}</div>
                  </div>
                  <div style={styles.ticketDetails}>
                    <div style={styles.tdRow}><span>Đăng ký:</span> <strong>{currentVehicle.type_name} ({currentVehicle.color})</strong></div>
                    <div style={styles.tdRow}><span>Biển số ĐK:</span> <strong>{currentVehicle.plate_number}</strong></div>
                    <div style={styles.tdRow}><span>Hạn dùng:</span> <strong style={{color: '#047857'}}>Còn hạn</strong></div>
                  </div>
                </>
              ) : plate.trim() ? (
                <>
                   <div style={{...styles.ticketValidHeader, backgroundColor: '#f59e0b', color: '#fff'}}>KHÁCH VÃNG LAI</div>
                   <div style={{textAlign: 'center', marginTop: 40, color: '#64748b'}}>
                     Xe này không có trong danh sách vé tháng. Tính phí theo giờ (Vé lượt).
                   </div>
                </>
              ) : (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8'}}>
                  Chưa có thông tin xe
                </div>
              )}

              {ticketInfo && mode === "OUT" && (
                <div style={styles.parkingInfoBox}>
                  <div style={{textAlign: 'center', fontWeight: 'bold', marginBottom: 12, color: '#1e293b'}}>HÓA ĐƠN CHECK-OUT</div>
                  <div style={styles.piRow}>
                    <div style={styles.piCol}>
                      <div style={styles.piLabel}>GIỜ VÀO</div>
                      <div style={styles.piValue}>{ticketInfo.time_in.split(' ')[1]}</div>
                    </div>
                    <div style={styles.piCol}>
                      <div style={styles.piLabel}>GIỜ RA</div>
                      <div style={styles.piValue}>{ticketInfo.time_out.split(' ')[1]}</div>
                    </div>
                  </div>
                  <div style={{textAlign: 'center', marginTop: 16}}>
                    <div style={styles.piLabel}>TỔNG TIỀN ({ticketInfo.duration} giờ)</div>
                    <div style={{fontSize: 24, fontWeight: 'bold', color: '#be123c'}}>{ticketInfo.fee.toLocaleString()} VNĐ</div>
                  </div>
                </div>
              )}

              {!ticketInfo && (
                <div style={{...styles.parkingInfoBox, marginTop: 'auto'}}>
                  <div style={{textAlign: 'center', fontWeight: 'bold', marginBottom: 12, color: '#1e293b'}}>THÔNG TIN BÃI ĐỖ</div>
                  <div style={styles.piRow}>
                    <div style={styles.piCol}>
                      <div style={styles.piLabel}>LƯỢT VÀO</div>
                      <div style={styles.piValue}>--:--</div>
                    </div>
                    <div style={styles.piCol}>
                      <div style={styles.piLabel}>NGÀY</div>
                      <div style={styles.piValue}>--/--</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
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
  sidebarTitle: { margin: 0, fontSize: 22, fontWeight: "bold" },
  sidebarSubTitle: { margin: 0, fontSize: 13, color: "#94a3b8", marginTop: 4 },
  menuItems: { padding: "20px 0", flex: 1 },
  menuItem: { padding: "14px 24px", color: "#cbd5e1", cursor: "pointer", fontSize: 15, fontWeight: "500", transition: "0.2s" },
  menuItemActive: { backgroundColor: "#059669", color: "#fff", borderLeft: "4px solid #34d399" },
  sidebarFooter: { padding: "24px", borderTop: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: 16 },
  emergencyBtn: { backgroundColor: "#dc2626", color: "#fff", border: "none", padding: "12px", borderRadius: 6, fontWeight: "bold", cursor: "pointer" },
  bottomLink: { color: "#94a3b8", fontSize: 14, cursor: "pointer", marginBottom: 8 },
  
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topHeader: { height: 70, backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", flexShrink: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 24 },
  onlineBadge: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#059669", fontWeight: "600", backgroundColor: "#ecfdf5", padding: "4px 12px", borderRadius: 20 },
  onlineDot: { width: 8, height: 8, backgroundColor: "#059669", borderRadius: "50%" },
  headerRight: { display: "flex", alignItems: "center" },
  avatar: { width: 40, height: 40, backgroundColor: "#e2e8f0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  
  contentBody: { flex: 1, padding: 24, overflow: "hidden", display: "flex", flexDirection: "column" },
  capacityRow: { display: "flex", gap: 20, marginBottom: 20, flexShrink: 0 },
  capacityCard: { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 16, display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderLeftWidth: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  cardLabel: { fontSize: 13, fontWeight: "600", color: "#64748b", marginBottom: 4 },
  cardNumber: { fontSize: 24, fontWeight: "bold", color: "#0f172a" },
  cardIcon: { width: 48, height: 48, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 },
  
  mainPanelRow: { display: "flex", gap: 24, flex: 1, minHeight: 0 },
  leftPanel: { flex: 2, backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", padding: "24px 30px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", overflow: "hidden" },
  
  modeToggle: { display: "flex", backgroundColor: "#f1f5f9", borderRadius: 8, padding: 4, marginBottom: 16, alignSelf: "center", flexShrink: 0 },
  modeBtn: { padding: "10px 30px", borderRadius: 6, border: "none", backgroundColor: "transparent", fontWeight: "bold", fontSize: 14, color: "#64748b", cursor: "pointer", transition: "0.2s" },
  modeActiveIn: { backgroundColor: "#fff", color: "#059669", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  modeActiveOut: { backgroundColor: "#fff", color: "#dc2626", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },

  inputContainer: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 0 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#64748b", marginBottom: 16, letterSpacing: 1 },
  bigInput: { fontSize: 70, fontWeight: "900", color: "#0f172a", textAlign: "center", border: "none", outline: "none", width: "100%", background: "transparent" },
  inputUnderline: { height: 4, width: 300, backgroundColor: "#cbd5e1", marginTop: 10 },
  
  selectorsRow: { display: "flex", gap: 30, marginBottom: 20, borderTop: "1px solid #f1f5f9", paddingTop: 20, flexShrink: 0 },
  selectorGroup: { flex: 1, backgroundColor: "#f8fafc", padding: "16px 20px", borderRadius: 10 },
  selectorTitle: { fontSize: 13, fontWeight: "600", color: "#64748b", marginBottom: 12 },
  cardsWrap: { display: "flex", gap: 12 },
  selectCard: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px 0", borderRadius: 8, fontWeight: "600", fontSize: 14, transition: "0.2s", border: "1px solid #e2e8f0" },
  
  actionsRow: { display: "flex", alignItems: "stretch", height: 75, borderTop: "1px solid #f1f5f9", paddingTop: 20, flexShrink: 0 },
  actionBtn: { border: "none", borderRadius: 10, padding: "0 20px", fontWeight: "600", cursor: "pointer" },
  
  toast: { padding: "12px 20px", borderRadius: 8, marginBottom: 20, fontWeight: "600", display: "flex", alignItems: "center", gap: 10, position: "absolute", top: 120, right: 40, zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },

  rightPanel: { flex: 1, backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 0, display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
  ticketValidHeader: { backgroundColor: "#34d399", color: "#fff", padding: "16px", textAlign: "center", fontWeight: "bold", fontSize: 16, letterSpacing: 1 },
  userInfo: { display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 20px" },
  userPhotoPlaceholder: { width: 100, height: 100, backgroundColor: "#e2e8f0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, color: "#94a3b8", marginBottom: 16 },
  userName: { fontSize: 18, fontWeight: "bold", color: "#0f172a", marginBottom: 6 },
  userApt: { fontSize: 14, color: "#64748b" },
  ticketDetails: { padding: "0 24px", marginTop: 10 },
  tdRow: { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9", fontSize: 14 },
  parkingInfoBox: { backgroundColor: "#f8fafc", margin: 24, padding: 20, borderRadius: 10, border: "1px solid #e2e8f0" },
  piRow: { display: "flex" },
  piCol: { flex: 1, textAlign: "center", borderRight: "1px solid #e2e8f0" },
  piLabel: { fontSize: 11, fontWeight: "bold", color: "#94a3b8", marginBottom: 4 },
  piValue: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
};

export default SecurityDashboard;
