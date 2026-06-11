import React, { useState, useEffect } from "react";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";

const SecurityDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: "IN" or "OUT"
  const [mode, setMode] = useState("IN");

  const [plate, setPlate] = useState("");
  const [typeId, setTypeId] = useState(1);
  const [areaId, setAreaId] = useState("A");

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [viewMode, setViewMode] = useState("gate");
  const [vehicleLogs, setVehicleLogs] = useState([]);
  const [searchPlate, setSearchPlate] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchDone, setSearchDone] = useState(false);
  const [fees, setFees] = useState([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeSearchPlate, setActiveSearchPlate] = useState("");
  const [activeSearchType, setActiveSearchType] = useState("");

  const [areas, setAreas] = useState([]);

  const fetchFees = async () => {
    try {
      const res = await axios.get("/parking/fees");
      setFees(res.data);
    } catch (err) {
      console.error("Lỗi tải bảng giá:", err);
    }
  };

  const [message, setMessage] = useState({ type: "", text: "" });
  const [ticketInfo, setTicketInfo] = useState(null);

  const fetchVehicleTypes = async () => {
    try {
      const res = await axios.get("/vehicles/types");

      const filteredTypes = res.data.filter(
        (t) => t.type_name.toLowerCase() !== "xe điện"
      );

      setVehicleTypes(filteredTypes);

      if (filteredTypes.length > 0) {
        setTypeId((prevTypeId) => prevTypeId || filteredTypes[0].type_id);
      }
    } catch (err) {
      console.error("Lỗi tải loại phương tiện:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await axios.get("/vehicles");
      setVehicles(res.data);
    } catch (err) {
      console.error("Lỗi tải danh sách xe:", err);
    }
  };

  const fetchVehicleLogs = async () => {
    try {
      const res = await axios.get("/parking/sessions");
      setVehicleLogs(res.data);
    } catch (err) {
      console.error("Lỗi tải lịch sử gửi xe:", err);
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await axios.get("/parking/areas");
      setAreas(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách bãi đỗ:", err);
    }
  };

  const refreshSecurityData = () => {
    fetchVehicleTypes();
    fetchVehicles();
    fetchVehicleLogs();
    fetchFees();
    fetchAreas();
  };

  // Fetch dữ liệu lần đầu khi mở trang
  useEffect(() => {
    refreshSecurityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get("view");
    if (viewParam && ["gate", "active", "logs", "search"].includes(viewParam)) {
      setViewMode(viewParam);
    }
  }, [location]);

  // Realtime: khi backend có thay đổi xe / phiên gửi xe / phí thì tự cập nhật lại
  useRealtimeRefresh(
    refreshSecurityData,
    ["vehicles", "parkingSessions", "fees", "areas"],
    {
      intervalMs: 7000,
    }
  );

  useEffect(() => {
    if (viewMode === "logs" || viewMode === "active") {
      fetchVehicleLogs();
    }

    if (viewMode === "search") {
      setSearchResult(null);
      setSearchDone(false);
      setSearchPlate("");
    }
    
    // Đóng sidebar trên mobile khi chuyển view
    setIsMobileOpen(false);
  }, [viewMode]);

  useEffect(() => {
    const selectedType = vehicleTypes.find((vt) => vt.type_id === typeId);

    if (selectedType) {
      const normalized = selectedType.type_name.toLowerCase();

      if (normalized.includes("xe máy") || normalized.includes("xe điện")) {
        setAreaId("A");
      } else {
        setAreaId("B");
      }
    }
  }, [typeId, vehicleTypes]);

  const normalizePlate = (p) =>
    (p || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const handleSearch = async (overridePlate) => {
    const query =
      typeof overridePlate === "string" ? overridePlate : searchPlate;

    if (!query.trim()) return;

    setSearchDone(false);
    setSearchResult(null);

    try {
      const res = await axios.get("/vehicles");

      const found = res.data.find(
        (v) => normalizePlate(v.plate_number) === normalizePlate(query)
      );

      const sessions = await axios.get("/parking/sessions");

      const history = sessions.data.filter(
        (s) =>
          s.plate_number &&
          normalizePlate(s.plate_number) === normalizePlate(query)
      );

      const recentHistory = history.slice(0, 10);
      const latestSession = recentHistory[0] || null;

      if (found) {
        setSearchResult({
          vehicle: found,
          history: recentHistory,
          latestSession,
        });
      } else if (history.length > 0) {
        setSearchResult({
          vehicle: {
            plate_number: history[0].plate_number,
            resident_name: "Khách vãng lai",
            apartment_number: "---",
            type_name: "Chưa rõ",
            color: "---",
          },
          history: recentHistory,
          latestSession,
        });
      }

      setSearchDone(true);
      setSearchPlate(query);
    } catch (err) {
      console.error("Lỗi tìm kiếm xe:", err);
      setSearchDone(true);
    }
  };

  const getSuggestions = () => {
    if (!searchPlate.trim()) return [];

    const term = normalizePlate(searchPlate);

    const matches = vehicles
      .filter((v) => normalizePlate(v.plate_number).includes(term))
      .map((v) => ({
        plate: v.plate_number,
        name: v.resident_name,
      }));

    const logMatches = vehicleLogs
      .filter((l) => l.plate_number && normalizePlate(l.plate_number).includes(term))
      .map((l) => ({
        plate: l.plate_number,
        name: "Khách vãng lai / Lịch sử",
      }));

    const combined = [...matches, ...logMatches];
    const unique = [];
    const seen = new Set();

    for (let item of combined) {
      const p = normalizePlate(item.plate);

      if (!seen.has(p)) {
        seen.add(p);
        unique.push(item);
      }
    }

    return unique.slice(0, 5);
  };

  const currentVehicle = plate.trim()
    ? vehicles.find(
        (v) => normalizePlate(v.plate_number) === normalizePlate(plate)
      )
    : null;

  // Auto-switch mode based on whether the vehicle is already parking
  useEffect(() => {
    if (plate.trim().length > 0) {
      const isParking = vehicleLogs.some(
        (v) =>
          v.status === "parking" &&
          normalizePlate(v.plate_number) === normalizePlate(plate)
      );
      
      if (isParking && mode !== "OUT") {
        setMode("OUT");
      } else if (!isParking && mode !== "IN") {
        setMode("IN");
      }
    }
  }, [plate, vehicleLogs, mode]);

  const activeSessionForPlate = plate.trim()
    ? vehicleLogs.find(
        (v) =>
          v.status === "parking" &&
          normalizePlate(v.plate_number) === normalizePlate(plate)
      )
    : null;

  useEffect(() => {
    if (currentVehicle) {
      setTypeId(currentVehicle.type_id);
    } else if (activeSessionForPlate) {
      setTypeId(activeSessionForPlate.type_id);
    }
  }, [currentVehicle, activeSessionForPlate]);

  const getActualPlate = () => {
    if (currentVehicle) return currentVehicle.plate_number;

    if (mode === "OUT" && activeSessionForPlate) {
      return activeSessionForPlate.plate_number;
    }

    return plate.trim().toUpperCase();
  };

  let estimatedDuration = 0;
  let estimatedFee = 0;
  if (activeSessionForPlate && fees.length > 0) {
    const timeIn = new Date(activeSessionForPlate.time_in);
    const timeOut = new Date();
    const feeConfig = fees.find(f => f.type_id === activeSessionForPlate.type_id);

    if (feeConfig) {
      let blocksCount = 0;
      let totalFee = 0;
      let currentTime = new Date(timeIn);
      const day_block_price = parseFloat(feeConfig.day_block_price) || 0;
      const night_block_price = parseFloat(feeConfig.night_block_price) || 0;
      const block_hours = parseInt(feeConfig.block_hours) || 4;

      while (currentTime < timeOut) {
        blocksCount++;
        const currentHour = currentTime.getHours();
        const isDayTime = currentHour >= 6 && currentHour < 18;
        
        if (isDayTime) {
          totalFee += day_block_price;
        } else {
          totalFee += night_block_price;
        }
        
        currentTime.setHours(currentTime.getHours() + block_hours);
      }
      
      estimatedFee = totalFee;
      estimatedDuration = blocksCount * block_hours;
    }
  }

  const handleAction = async () => {
    setMessage({ type: "", text: "" });
    setTicketInfo(null);

    const actualPlate = getActualPlate();

    if (!actualPlate) {
      setMessage({
        type: "error",
        text: "Vui lòng nhập biển số xe",
      });
      return;
    }

    if (mode === "IN") {
      try {
        const res = await axios.post("/parking/check-in", {
          plate_number: actualPlate,
          type_id: currentVehicle ? currentVehicle.type_id : typeId,
        });

        if (res.data.warning) {
          setMessage({
            type: "warning", 
            text: `Cho vào thành công - Lưu ý: ${res.data.warning}`,
          });
        } else {
          setMessage({
            type: "success",
            text: res.data.message,
          });
        }

        refreshSecurityData();

        setTimeout(() => {
          setPlate("");
          setMessage({ type: "", text: "" });
        }, 3000);
      } catch (err) {
        setMessage({
          type: "error",
          text: err.response?.data?.message || "Lỗi check-in",
        });
      }
    } else {
      try {
        const res = await axios.post("/parking/check-out", {
          plate_number: actualPlate,
        });

        setMessage({
          type: "success",
          text: res.data.message,
        });

        refreshSecurityData();

        setTicketInfo({
          fee: res.data.fee,
          duration: res.data.duration_hours,
          time_in: new Date(res.data.time_in).toLocaleString(),
          time_out: new Date(res.data.time_out).toLocaleString(),
          is_resident: res.data.is_resident,
          is_monthly: res.data.is_monthly,
        });

        setTimeout(() => {
          setPlate("");
          setMessage({ type: "", text: "" });
        }, 8000);
      } catch (err) {
        setMessage({
          type: "error",
          text: err.response?.data?.message || "Lỗi check-out",
        });
      }
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const userName = user?.name || user?.username || "";
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "B";

  const menuItems = [
    { key: "gate", label: "Ghi nhận xe", icon: "directions_car" },
    { key: "active", label: "Xe trong bãi", icon: "local_parking" },
    { key: "logs", label: "Lịch sử gửi xe", icon: "history" },
    { key: "search", label: "Tìm kiếm xe", icon: "search" },
  ];

  const getPageTitle = () => {
    switch (viewMode) {
      case "gate":
        return "Ghi nhận xe";
      case "active":
        return "Danh sách xe đang trong bãi";
      case "logs":
        return "Lịch sử gửi xe";
      case "search":
        return "Tìm kiếm xe";
      default:
        return "Ghi nhận xe";
    }
  };

  const activeMotosList = vehicleLogs.filter(
    (s) => s.status === "parking" && Number(s.type_id) === 1
  );
  const activeMotosParked = activeMotosList.length;

  const activeCarsList = vehicleLogs.filter(
    (s) => s.status === "parking" && Number(s.type_id) === 2
  );
  const activeCarsParked = activeCarsList.length;

  const motoArea = areas.find(a => a.type_id === 1);
  const carArea = areas.find(a => a.type_id === 2);

  const motoCapacity = motoArea ? motoArea.capacity : 1200;
  const carCapacity = carArea ? carArea.capacity : 150;

  // Sử dụng current_count từ API (bao gồm vé tháng + xe vãng lai đang đỗ)
  const activeMotos = motoArea ? (motoArea.current_count || 0) : activeMotosParked;
  const activeCars = carArea ? (carArea.current_count || 0) : activeCarsParked;
  const totalActive = activeMotos + activeCars;

  const motoPct = motoCapacity > 0 ? Math.round((activeMotos / motoCapacity) * 100) : 0;
  const carPct = carCapacity > 0 ? Math.round((activeCars / carCapacity) * 100) : 0;
  const totalCapacity = motoCapacity + carCapacity;
  const totalPct = totalCapacity > 0 ? Math.round((totalActive / totalCapacity) * 100) : 0;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Symbols+Rounded"
        rel="stylesheet"
      />

      <style>{`
        .material-symbols-rounded {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        @media (max-width: 768px) {
          .mobile-hamburger { display: flex !important; }
          .sidebar-container { 
            position: fixed !important;
            z-index: 1000 !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
          }
          .sidebar-container.open {
            transform: translateX(0) !important;
          }
          .sidebar-overlay.open {
            display: block !important;
          }
          .main-content > div:first-child, .top-header {
            padding-left: 60px !important;
          }
        }
      `}</style>

      {/* Hamburger Button */}
      <div 
        className="mobile-hamburger" 
        style={{
          display: 'none', 
          position: 'fixed', top: 15, left: 15, zIndex: 998, 
          background: '#FFFBF5', border: '1px solid #EAE5D9', padding: 8, 
          borderRadius: 8, cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
        onClick={() => setIsMobileOpen(true)}
      >
        <span className="material-symbols-rounded" style={{ color: '#202124' }}>menu</span>
      </div>

      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'open' : ''}`}
        style={{
          display: 'none',
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
        }}
        onClick={() => setIsMobileOpen(false)}
      />

      <div style={styles.container}>
        <div className={`sidebar-container ${isMobileOpen ? 'open' : ''}`} style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.logoRow}>
              <div style={styles.logoIcon}>P</div>
              <div>
                <div style={styles.logoText}>Parking</div>
                <div style={styles.logoSubText}>Bảo vệ</div>
              </div>
            </div>
          </div>

          <div style={styles.menuSection}>
            <div style={styles.menuLabel}>MENU</div>

            <div style={styles.menuItems}>
              {menuItems.map((item) => (
                <div
                  key={item.key}
                  style={{
                    ...styles.menuItem,
                    ...(viewMode === item.key ? styles.menuItemActive : {}),
                  }}
                  onClick={() => navigate("?view=" + item.key)}
                  onMouseEnter={(e) => {
                    if (viewMode !== item.key) {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== item.key) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{
                      fontSize: 20,
                      color: viewMode === item.key ? "#FFFBF5" : "rgba(255, 255, 255, 0.75)",
                      marginRight: 12,
                    }}
                  >
                    {item.icon}
                  </span>

                  <span
                    style={{
                      fontWeight: viewMode === item.key ? "600" : "400",
                      color: viewMode === item.key ? "#FFFBF5" : "rgba(255, 255, 255, 0.85)",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.sidebarFooter}>
            <div style={styles.footerUserRow}>
              <div style={styles.footerAvatar}>{userInitial}</div>

              <div style={styles.footerUserInfo}>
                <div style={styles.footerUserName}>{userName}</div>
                <div style={styles.footerUserRole}>Bảo vệ</div>
              </div>
            </div>

            <div
              style={{
                ...styles.logoutBtn,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onClick={handleLogout}
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 18, color: "#c5221f" }}
              >
                logout
              </span>
              <span style={{ color: "#c5221f" }}>Đăng xuất</span>
            </div>
          </div>
        </div>

        <div className="main-content" style={styles.main}>
          <div className="top-header" style={styles.topHeader}>
            <div style={styles.headerLeft}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#202124",
                }}
              >
                {getPageTitle()}
              </h2>
            </div>

            <div style={{ ...styles.headerRight, gap: 16 }}>
              <NotificationBell />
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#202124",
                  }}
                >
                  {userName}
                </div>
                <div style={{ fontSize: 12, color: "#5f6368" }}>Bảo vệ</div>
              </div>

              <div style={styles.avatar}>{userInitial}</div>
            </div>
          </div>

          <div style={styles.contentBody}>
            <div style={styles.capacityRow}>
              {/* Card 1: Xe máy */}
              <div style={{
                ...styles.capacityCard,
                borderColor: motoPct >= 100 ? "#ef4444" : motoPct >= 90 ? "#f59e0b" : "#3F5E4D",
                borderLeftColor: motoPct >= 100 ? "#ef4444" : motoPct >= 90 ? "#f59e0b" : "#3F5E4D"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={styles.cardLabel}>KHU A - XE MÁY</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={styles.cardNumber}>{activeMotos}/{motoCapacity}</span>
                    <span style={{ fontSize: 13, fontWeight: "600", color: motoPct >= 100 ? "#ef4444" : motoPct >= 90 ? "#f59e0b" : "#64748b" }}>
                      ({motoPct}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '90%', height: 6, backgroundColor: '#EAE5D9', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, motoPct)}%`,
                      height: '100%',
                      backgroundColor: motoPct >= 100 ? "#ef4444" : motoPct >= 90 ? "#f59e0b" : "#3F5E4D",
                      borderRadius: 3,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  {/* Status/Warning text */}
                  {motoPct >= 100 ? (
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: "800", color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>block</span>
                      ĐẦY! KHÔNG CHO XE VÃNG LAI VÀO
                    </div>
                  ) : motoPct >= 90 ? (
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: "700", color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>warning</span>
                      SẮP ĐẦY SỨ CHỨA
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: "600", color: "#9E826C" }}>
                      Còn trống {Math.max(0, motoCapacity - activeMotos)} chỗ
                    </div>
                  )}
                </div>

                <div
                  style={{
                    ...styles.cardIcon,
                    background: motoPct >= 100 ? "rgba(239, 68, 68, 0.12)" : motoPct >= 90 ? "rgba(245, 158, 11, 0.12)" : "rgba(63, 94, 77, 0.12)",
                    color: motoPct >= 100 ? "#ef4444" : motoPct >= 90 ? "#f59e0b" : "#3F5E4D",
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 26 }}>motorcycle</span>
                </div>
              </div>

              {/* Card 2: Ô tô */}
              <div style={{
                ...styles.capacityCard,
                borderColor: carPct >= 100 ? "#ef4444" : carPct >= 90 ? "#f59e0b" : "#CD5C5C",
                borderLeftColor: carPct >= 100 ? "#ef4444" : carPct >= 90 ? "#f59e0b" : "#CD5C5C"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={styles.cardLabel}>KHU B - Ô TÔ</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={styles.cardNumber}>{activeCars}/{carCapacity}</span>
                    <span style={{ fontSize: 13, fontWeight: "600", color: carPct >= 100 ? "#ef4444" : carPct >= 90 ? "#f59e0b" : "#64748b" }}>
                      ({carPct}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '90%', height: 6, backgroundColor: '#EAE5D9', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, carPct)}%`,
                      height: '100%',
                      backgroundColor: carPct >= 100 ? "#ef4444" : carPct >= 90 ? "#f59e0b" : "#CD5C5C",
                      borderRadius: 3,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  {/* Status/Warning text */}
                  {carPct >= 100 ? (
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: "800", color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>block</span>
                      ĐẦY! KHÔNG CHO XE VÃNG LAI VÀO
                    </div>
                  ) : carPct >= 90 ? (
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: "700", color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>warning</span>
                      SẮP ĐẦY SỨ CHỨA
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: "600", color: "#9E826C" }}>
                      Còn trống {Math.max(0, carCapacity - activeCars)} chỗ
                    </div>
                  )}
                </div>

                <div
                  style={{
                    ...styles.cardIcon,
                    background: carPct >= 100 ? "rgba(239, 68, 68, 0.12)" : carPct >= 90 ? "rgba(245, 158, 11, 0.12)" : "rgba(205, 92, 92, 0.12)",
                    color: carPct >= 100 ? "#ef4444" : carPct >= 90 ? "#f59e0b" : "#CD5C5C",
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 26 }}>directions_car</span>
                </div>
              </div>

              {/* Card 3: Tổng bãi */}
              <div style={{
                ...styles.capacityCard,
                borderColor: totalPct >= 100 ? "#ef4444" : totalPct >= 90 ? "#f59e0b" : "#C39A6B",
                borderLeftColor: totalPct >= 100 ? "#ef4444" : totalPct >= 90 ? "#f59e0b" : "#C39A6B"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={styles.cardLabel}>TỔNG BÃI</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={styles.cardNumber}>{totalActive}/{totalCapacity}</span>
                    <span style={{ fontSize: 13, fontWeight: "600", color: totalPct >= 100 ? "#ef4444" : totalPct >= 90 ? "#f59e0b" : "#64748b" }}>
                      ({totalPct}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '90%', height: 6, backgroundColor: '#EAE5D9', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, totalPct)}%`,
                      height: '100%',
                      backgroundColor: totalPct >= 100 ? "#ef4444" : totalPct >= 90 ? "#f59e0b" : "#C39A6B",
                      borderRadius: 3,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  {/* Status/Warning text */}
                  {totalPct >= 100 ? (
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: "800", color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>block</span>
                      TOÀN BỘ BÃI XE ĐÃ ĐẦY
                    </div>
                  ) : totalPct >= 90 ? (
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: "700", color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>warning</span>
                      TỔNG THỂ SẮP ĐẦY
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: "600", color: "#9E826C" }}>
                      Còn trống {Math.max(0, totalCapacity - totalActive)} chỗ
                    </div>
                  )}
                </div>

                <div
                  style={{
                    ...styles.cardIcon,
                    background: totalPct >= 100 ? "rgba(239, 68, 68, 0.12)" : totalPct >= 90 ? "rgba(245, 158, 11, 0.12)" : "rgba(195, 154, 107, 0.12)",
                    color: totalPct >= 100 ? "#ef4444" : totalPct >= 90 ? "#f59e0b" : "#C39A6B",
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 26 }}>analytics</span>
                </div>
              </div>
            </div>

            {viewMode === "gate" ? (
              <div style={styles.mainPanelRow}>
                <div style={styles.leftPanel}>
                  <div style={styles.modeToggle}>
                    <button
                      onClick={() => {
                        setMode("IN");
                        setMessage({ type: "", text: "" });
                        setTicketInfo(null);
                      }}
                      style={{
                        ...styles.modeBtn,
                        ...(mode === "IN" ? styles.modeActiveIn : {}),
                      }}
                    >
                      XE VÀO (CHECK-IN)
                    </button>

                    <button
                      onClick={() => {
                        setMode("OUT");
                        setMessage({ type: "", text: "" });
                        setTicketInfo(null);
                      }}
                      style={{
                        ...styles.modeBtn,
                        ...(mode === "OUT" ? styles.modeActiveOut : {}),
                      }}
                    >
                      XE RA (CHECK-OUT)
                    </button>
                  </div>

                  <div style={styles.inputContainer}>
                    {/* Label removed per user request */}
                    <input
                      autoFocus
                      maxLength={15}
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      style={styles.bigInput}
                      placeholder="--- ---"
                    />

                    <div style={styles.inputUnderline}></div>
                  </div>

                  <div style={styles.selectorsRow}>
                    <div style={styles.selectorGroup}>
                      <div style={styles.selectorTitle}>Loại Phương Tiện</div>

                      <div style={styles.cardsWrap}>
                        {vehicleTypes.map((vt) => (
                          <div
                            key={vt.type_id}
                            onClick={() => {
                              if (!currentVehicle && mode !== "OUT") {
                                setTypeId(vt.type_id);
                              }
                            }}
                            style={{
                              ...styles.selectCard,
                              backgroundColor: typeId === vt.type_id ? "#3F5E4D" : "#FFFBF5",
                              color: typeId === vt.type_id ? "#FFFBF5" : "#64748b",
                              cursor: (currentVehicle || mode === "OUT") ? "not-allowed" : "pointer",
                              opacity: (currentVehicle || mode === "OUT") && typeId !== vt.type_id ? 0.5 : 1,
                              border: typeId === vt.type_id ? "2px solid #3F5E4D" : "2px solid #EAE5D9"
                            }}
                          >
                            <div style={{ fontSize: 24, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {vt.type_name === "Ô tô" ? (
                                <span className="material-symbols-rounded" style={{ fontSize: 28 }}>directions_car</span>
                              ) : (
                                <span className="material-symbols-rounded" style={{ fontSize: 28 }}>motorcycle</span>
                              )}
                            </div>
                            <div>{vt.type_name}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={styles.selectorGroup}>
                      <div style={styles.selectorTitle}>Khu Vực Đỗ</div>

                      <div style={styles.cardsWrap}>
                        <div
                          style={{
                            ...styles.selectCard,
                            backgroundColor:
                              areaId === "A" ? "#3F5E4D" : "#FFFBF5",
                            border:
                              areaId === "A"
                                ? "2px solid #3F5E4D"
                                : "2px solid #EAE5D9",
                            color: areaId === "A" ? "#FFFBF5" : "#2D3327",
                          }}
                        >
                          <div style={{ fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 26 }}>motorcycle</span>
                          </div>
                          <div>XE MÁY</div>
                        </div>

                        <div
                          style={{
                            ...styles.selectCard,
                            backgroundColor:
                              areaId === "B" ? "#3F5E4D" : "#FFFBF5",
                            border:
                              areaId === "B"
                                ? "2px solid #3F5E4D"
                                : "2px solid #EAE5D9",
                            color: areaId === "B" ? "#FFFBF5" : "#2D3327",
                          }}
                        >
                          <div style={{ fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 26 }}>directions_car</span>
                          </div>
                          <div>Ô TÔ</div>
                        </div>
                      </div>

                      <div style={styles.areaHint}>
                        Khu A dành cho xe máy, khu B dành cho ô tô. Chức năng
                        được chọn tự động theo loại phương tiện.
                      </div>
                    </div>
                  </div>

                  {message.text && (
                    <div
                      style={{
                        ...styles.toast,
                        backgroundColor:
                          message.type === "success" ? "#dcfce7" : message.type === "warning" ? "#fef3c7" : "#fee2e2",
                        color:
                          message.type === "success" ? "#166534" : message.type === "warning" ? "#92400e" : "#991b1b",
                      }}
                    >
                      {message.type === "success" ? "✅" : message.type === "warning" ? "⚠️" : "❌"} {message.text}
                    </div>
                  )}

                  <div style={styles.actionsRow}>
                    <button
                      style={{
                        ...styles.actionBtn,
                        backgroundColor: "#fee2e2",
                        color: "#ef4444",
                        marginRight: 20,
                        fontSize: 18,
                        padding: "0 40px",
                      }}
                      onClick={() => {
                        setPlate("");
                        setTicketInfo(null);
                      }}
                    >
                      ⊗ Hủy Bỏ
                    </button>

                    <button
                      onClick={handleAction}
                      style={{
                        ...styles.actionBtn,
                        backgroundColor: mode === "IN" ? "#047857" : "#be123c",
                        color: "#fff",
                        fontSize: 24,
                        fontWeight: "bold",
                        padding: "0 60px",
                        minWidth: "40%",
                        letterSpacing: 1,
                      }}
                    >
                      {mode === "IN"
                        ? "⨀ CHO VÀO (ENTER)"
                        : "⨀ CHO RA (EXIT)"}
                    </button>
                  </div>
                </div>

                <div style={styles.rightPanel}>
                  {currentVehicle ? (
                    <>
                      <div style={{
                        ...styles.ticketValidHeader,
                        backgroundColor: currentVehicle.status === 'pending' ? "#f59e0b" : "#34d399"
                      }}>
                        {currentVehicle.status === 'pending' ? 'XE ĐĂNG KÝ (CHỜ DUYỆT)' : 'VÉ THÁNG - HỢP LỆ ✓'}
                      </div>

                      <div style={styles.userInfo}>
                        <div style={styles.userPhotoPlaceholder}>👤</div>
                        <div style={styles.userName}>
                          {currentVehicle.resident_name || "Cư dân nội khu"}
                        </div>
                        <div style={styles.userApt}>
                          Căn hộ: {currentVehicle.apartment_number || "---"}
                        </div>
                      </div>

                      <div style={styles.ticketDetails}>
                        <div style={styles.tdRow}>
                          <span>Đăng ký:</span>
                          <strong>
                            {currentVehicle.type_name} ({currentVehicle.color})
                          </strong>
                        </div>

                        <div style={styles.tdRow}>
                          <span>Biển số ĐK:</span>
                          <strong>{currentVehicle.plate_number}</strong>
                        </div>

                        <div style={styles.tdRow}>
                          <span>Trạng thái:</span>
                          <strong style={{ color: currentVehicle.status === 'pending' ? "#f59e0b" : "#047857" }}>
                            {currentVehicle.status === 'pending' ? 'Chưa duyệt' : 'Đã duyệt / Hợp lệ'}
                          </strong>
                        </div>
                      </div>
                    </>
                  ) : plate.trim() ? (
                    <>
                      <div
                        style={{
                          ...styles.ticketValidHeader,
                          backgroundColor: "#f59e0b",
                          color: "#fff",
                        }}
                      >
                        KHÁCH VÃNG LAI
                      </div>

                      {activeSessionForPlate ? (
                        <div style={{ marginTop: 20, padding: "0 24px" }}>
                          <div style={styles.tdRow}>
                            <span>Tình trạng:</span>
                            <strong style={{ color: "#0f172a" }}>Đang trong bãi</strong>
                          </div>
                          <div style={styles.tdRow}>
                            <span>Thời gian đã gửi:</span>
                            <strong style={{ color: "#0f172a" }}>{estimatedDuration} giờ</strong>
                          </div>
                          <div style={styles.tdRow}>
                            <span>Tạm tính (vé lượt):</span>
                            <strong style={{ color: "#be123c", fontSize: 16 }}>{estimatedFee.toLocaleString()} VNĐ</strong>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            textAlign: "center",
                            marginTop: 40,
                            color: "#64748b",
                          }}
                        >
                          Xe này không có trong danh sách vé tháng. Tính phí theo
                          giờ (Vé lượt).
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "#94a3b8",
                      }}
                    >
                      Chưa có thông tin xe
                    </div>
                  )}

                  {ticketInfo && mode === "OUT" && (
                    <div style={styles.parkingInfoBox}>
                      <div
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          marginBottom: 12,
                          color: "#1e293b",
                        }}
                      >
                        HÓA ĐƠN CHECK-OUT
                      </div>

                      <div style={styles.piRow}>
                        <div style={styles.piCol}>
                          <div style={styles.piLabel}>GIỜ VÀO</div>
                          <div style={styles.piValue}>
                            {ticketInfo.time_in.split(" ")[1]}
                          </div>
                        </div>

                        <div style={styles.piCol}>
                          <div style={styles.piLabel}>GIỜ RA</div>
                          <div style={styles.piValue}>
                            {ticketInfo.time_out.split(" ")[1]}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "center", marginTop: 16 }}>
                        <div style={styles.piLabel}>
                          TỔNG TIỀN ({ticketInfo.duration} giờ)
                        </div>
                        <div
                          style={{
                            fontSize: 24,
                            fontWeight: "bold",
                            color: "#be123c",
                          }}
                        >
                          {ticketInfo.fee.toLocaleString()} VNĐ
                        </div>
                      </div>
                    </div>
                  )}

                  {!ticketInfo && (
                    <div style={{ ...styles.parkingInfoBox, marginTop: "auto" }}>
                      <div
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          marginBottom: 12,
                          color: "#1e293b",
                        }}
                      >
                        {activeSessionForPlate ? "THÔNG TIN GỬI XE" : "THÔNG TIN BÃI ĐỖ"}
                      </div>

                      <div style={styles.piRow}>
                        <div style={styles.piCol}>
                          <div style={styles.piLabel}>GIỜ VÀO</div>
                          <div style={styles.piValue}>
                            {activeSessionForPlate && activeSessionForPlate.time_in 
                              ? new Date(activeSessionForPlate.time_in).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                              : "--:--"}
                          </div>
                        </div>

                        <div style={styles.piCol}>
                          <div style={styles.piLabel}>NGÀY</div>
                          <div style={styles.piValue}>
                            {activeSessionForPlate && activeSessionForPlate.time_in 
                              ? new Date(activeSessionForPlate.time_in).toLocaleDateString('vi-VN') 
                              : "--/--"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={styles.mainPanelRow}>
                <div style={styles.dashboardPanel}>
                  <div style={styles.sectionHeader}>
                    {viewMode === "logs"
                      ? "Lịch sử gửi xe"
                      : viewMode === "active"
                      ? "Danh sách xe đang trong bãi"
                      : viewMode === "notifications"
                      ? "Thông báo từ hệ thống"
                      : "Tìm kiếm thông tin xe"}
                  </div>

                  {viewMode === "active" && (
                    <>
                      <div style={styles.sectionSummaryRow}>
                        <div style={styles.summaryCard}>
                          <div style={styles.summaryLabel}>Xe đang gửi</div>
                          <div style={styles.summaryValue}>{totalActive}</div>
                        </div>
                        <div style={styles.summaryCard}>
                          <div style={styles.summaryLabel}>Xe máy</div>
                          <div style={styles.summaryValue}>{activeMotos}</div>
                        </div>
                        <div style={styles.summaryCard}>
                          <div style={styles.summaryLabel}>Ô tô</div>
                          <div style={styles.summaryValue}>{activeCars}</div>
                        </div>
                      </div>

                      {/* Filter / Search Bar */}
                      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                          <span className="material-symbols-rounded" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9E826C", fontSize: 20 }}>search</span>
                          <input
                            placeholder="Tìm kiếm biển số xe..."
                            value={activeSearchPlate}
                            onChange={(e) => setActiveSearchPlate(e.target.value.toUpperCase())}
                            style={{
                              width: "100%",
                              padding: "10px 12px 10px 40px",
                              border: "2px solid #EAE5D9",
                              borderRadius: 10,
                              fontSize: 14,
                              outline: "none",
                              backgroundColor: "#FFFBF5",
                              color: "#2D3327",
                              boxSizing: "border-box"
                            }}
                          />
                        </div>
                        <div style={{ minWidth: 150 }}>
                          <select
                            value={activeSearchType}
                            onChange={(e) => setActiveSearchType(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              border: "2px solid #EAE5D9",
                              borderRadius: 10,
                              fontSize: 14,
                              outline: "none",
                              backgroundColor: "#FFFBF5",
                              color: "#2D3327",
                              fontWeight: "600"
                            }}
                          >
                            <option value="">Tất cả phương tiện</option>
                            <option value="Xe máy">Xe máy</option>
                            <option value="Ô tô">Ô tô</option>
                          </select>
                        </div>
                      </div>

                      {/* Active Parking Table */}
                      <div style={styles.logsTable}>
                        <div style={{...styles.tableRowHeader, backgroundColor: "#3F5E4D", color: "#FFFBF5", borderBottom: "none", fontSize: 12, letterSpacing: 1}}>
                          <div style={styles.tableCell}>BIỂN SỐ</div>
                          <div style={styles.tableCell}>LOẠI XE</div>
                          <div style={styles.tableCell}>THỜI GIAN VÀO</div>
                          <div style={styles.tableCell}>THỜI GIAN ĐÃ ĐỖ</div>
                          <div style={styles.tableCell}>NHÂN VIÊN VÀO</div>
                        </div>

                        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                          {(() => {
                            const filteredActiveLogs = vehicleLogs
                              .filter((log) => log.status === "parking")
                              .filter((log) => {
                                const matchesPlate = !activeSearchPlate.trim() || log.plate_number.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().includes(activeSearchPlate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
                                const matchesType = !activeSearchType || (log.type_name || "").toLowerCase().includes(activeSearchType.toLowerCase());
                                return matchesPlate && matchesType;
                              });

                            if (filteredActiveLogs.length === 0) {
                              return (
                                <div style={{...styles.emptyState, backgroundColor: "#FFFBF5"}}>
                                  Không tìm thấy xe nào đang ở trong bãi
                                </div>
                              );
                            }

                            return filteredActiveLogs.map((log) => {
                              const timeIn = new Date(log.time_in);
                              const now = new Date();
                              const diffMs = now - timeIn;
                              const diffMins = Math.floor(diffMs / 60000);
                              const hours = Math.floor(diffMins / 60);
                              const mins = diffMins % 60;
                              const durationStr = hours > 0 ? `${hours}g ${mins}p` : `${mins} phút`;

                              return (
                                <div key={log.session_id} style={{...styles.tableRow, backgroundColor: "#FFFBF5", alignItems: "center"}}>
                                  <div style={{...styles.tableCell, fontWeight: "800", fontSize: 18, color: "#2D3327", fontFamily: "'Outfit', sans-serif"}}>
                                    {log.plate_number}
                                  </div>
                                  <div style={styles.tableCell}>
                                    <span style={{ 
                                      padding: "6px 12px", 
                                      borderRadius: 8, 
                                      fontSize: 12, 
                                      fontWeight: "700", 
                                      backgroundColor: log.type_name?.toLowerCase().includes("máy") ? "rgba(63, 94, 77, 0.1)" : "rgba(205, 92, 92, 0.1)", 
                                      color: log.type_name?.toLowerCase().includes("máy") ? "#3F5E4D" : "#CD5C5C", 
                                      border: log.type_name?.toLowerCase().includes("máy") ? "1px solid rgba(63, 94, 77, 0.2)" : "1px solid rgba(205, 92, 92, 0.2)",
                                      display: "inline-block" 
                                    }}>
                                      {log.type_name}
                                    </span>
                                  </div>
                                  <div style={styles.tableCell}>
                                    {log.time_in ? (
                                      <>
                                        <div style={{ fontWeight: "800", color: "#2D3327", fontSize: 15 }}>{new Date(log.time_in).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div style={{ fontSize: 12, color: "#9E826C", fontWeight: "600", marginTop: 2 }}>{new Date(log.time_in).toLocaleDateString("vi-VN")}</div>
                                      </>
                                    ) : <div style={{ color: "#9E826C", fontWeight: "600" }}>---</div>}
                                  </div>
                                  <div style={{...styles.tableCell, fontWeight: "700", color: "#3F5E4D"}}>
                                    {durationStr}
                                  </div>
                                  <div style={{...styles.tableCell, display: "flex", alignItems: "center", gap: 8, fontWeight: "700", color: "#5F504B"}}>
                                    {log.security_name ? (
                                      <><span className="material-symbols-rounded" style={{ fontSize: 18, color: "#9E826C" }}>badge</span> {log.security_name}</>
                                    ) : <div style={{ color: "#9E826C" }}>---</div>}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </>
                  )}

                  {viewMode === "logs" && (
                    <>
                      <div style={styles.sectionSummaryRow}>
                        <div style={styles.summaryCard}>
                          <div style={styles.summaryLabel}>
                            Phiên gửi gần nhất
                          </div>
                          <div style={styles.summaryValue}>
                            {vehicleLogs.length}
                          </div>
                        </div>

                        <div style={styles.summaryCard}>
                          <div style={styles.summaryLabel}>Xe đang gửi</div>
                          <div style={styles.summaryValue}>
                            {
                              vehicleLogs.filter(
                                (item) => item.status === "parking"
                              ).length
                            }
                          </div>
                        </div>

                        <div style={styles.summaryCard}>
                          <div style={styles.summaryLabel}>Xe đã ra</div>
                          <div style={styles.summaryValue}>
                            {
                              vehicleLogs.filter(
                                (item) => item.status === "completed"
                              ).length
                            }
                          </div>
                        </div>
                      </div>

                      <div style={styles.logsTable}>
                        <div style={{...styles.tableRowHeader, backgroundColor: "#3F5E4D", color: "#FFFBF5", borderBottom: "none", fontSize: 12, letterSpacing: 1}}>
                          <div style={styles.tableCell}>BIỂN SỐ</div>
                          <div style={styles.tableCell}>TRẠNG THÁI</div>
                          <div style={styles.tableCell}>THỜI GIAN VÀO</div>
                          <div style={styles.tableCell}>THỜI GIAN RA</div>
                          <div style={styles.tableCell}>NHÂN VIÊN</div>
                        </div>

                        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                          {vehicleLogs.length === 0 ? (
                            <div style={{...styles.emptyState, backgroundColor: "#FFFBF5"}}>
                              Chưa có bản ghi nào
                            </div>
                          ) : (
                            vehicleLogs.map((log) => (
                              <div key={log.session_id} style={{...styles.tableRow, backgroundColor: "#FFFBF5", alignItems: "center"}}>
                                <div style={{...styles.tableCell, fontWeight: "800", fontSize: 18, color: "#2D3327", fontFamily: "'Outfit', sans-serif"}}>
                                  {log.plate_number}
                                </div>
                                <div style={styles.tableCell}>
                                  {log.status === "parking" ? (
                                    <span style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: "700", backgroundColor: "#EAE5D9", color: "#9E826C", border: "1px solid #D5CCBE", display: "inline-block" }}>
                                      Đang trong bãi
                                    </span>
                                  ) : (
                                    <span style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: "700", backgroundColor: "rgba(63, 94, 77, 0.1)", color: "#3F5E4D", border: "1px solid rgba(63, 94, 77, 0.2)", display: "inline-block" }}>
                                      Đã ra khỏi bãi
                                    </span>
                                  )}
                                </div>
                                <div style={styles.tableCell}>
                                  {log.time_in ? (
                                    <>
                                      <div style={{ fontWeight: "800", color: "#2D3327", fontSize: 15 }}>{new Date(log.time_in).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</div>
                                      <div style={{ fontSize: 12, color: "#9E826C", fontWeight: "600", marginTop: 2 }}>{new Date(log.time_in).toLocaleDateString("vi-VN")}</div>
                                    </>
                                  ) : <div style={{ color: "#9E826C", fontWeight: "600" }}>---</div>}
                                </div>
                                <div style={styles.tableCell}>
                                  {log.time_out ? (
                                    <>
                                      <div style={{ fontWeight: "800", color: "#2D3327", fontSize: 15 }}>{new Date(log.time_out).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</div>
                                      <div style={{ fontSize: 12, color: "#9E826C", fontWeight: "600", marginTop: 2 }}>{new Date(log.time_out).toLocaleDateString("vi-VN")}</div>
                                    </>
                                  ) : <div style={{ color: "#9E826C", fontWeight: "600" }}>---</div>}
                                </div>
                                <div style={{...styles.tableCell, display: "flex", alignItems: "center", gap: 8, fontWeight: "700", color: "#5F504B"}}>
                                  {log.security_name ? (
                                    <><span className="material-symbols-rounded" style={{ fontSize: 18, color: "#9E826C" }}>badge</span> {log.security_name}</>
                                  ) : <div style={{ color: "#9E826C" }}>---</div>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {viewMode === "search" && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          marginBottom: 32,
                          position: "relative",
                        }}
                      >
                        <div style={{ flex: 1, position: "relative" }}>
                          <span className="material-symbols-rounded" style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", color: "#9E826C", fontSize: 24 }}>search</span>
                          <input
                            value={searchPlate}
                            onChange={(e) => {
                              setSearchPlate(e.target.value.toUpperCase());
                              setSearchDone(false);
                              setSearchResult(null);
                            }}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSearch()
                            }
                            placeholder="Nhập biển số xe cần tìm..."
                            style={{
                              width: "100%",
                              padding: "16px 20px 16px 56px",
                              border: "2px solid #EAE5D9",
                              borderRadius: 16,
                              fontSize: 16,
                              fontWeight: "600",
                              outline: "none",
                              backgroundColor: "#FFFBF5",
                              color: "#2D3327",
                              boxSizing: "border-box",
                              fontFamily: "'Outfit', sans-serif",
                              boxShadow: "0 4px 12px rgba(139, 115, 85, 0.05)",
                              transition: "all 0.2s"
                            }}
                          />

                          {searchPlate.trim() &&
                            !searchDone &&
                            getSuggestions().length > 0 && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "100%",
                                  left: 0,
                                  right: 0,
                                  backgroundColor: "#FFFBF5",
                                  border: "2px solid #EAE5D9",
                                  borderRadius: 12,
                                  marginTop: 8,
                                  boxShadow: "0 10px 25px rgba(139, 115, 85, 0.1)",
                                  zIndex: 10,
                                  overflow: "hidden",
                                }}
                              >
                                {getSuggestions().map((v) => (
                                  <div
                                    key={v.plate}
                                    onClick={() => handleSearch(v.plate)}
                                    style={{
                                      padding: "14px 20px",
                                      cursor: "pointer",
                                      borderBottom: "1px solid #F1ECE4",
                                      fontWeight: "700",
                                      color: "#2D3327",
                                      display: "flex",
                                      alignItems: "center",
                                      transition: "0.2s"
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.backgroundColor = "#F1ECE4")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.backgroundColor = "transparent")
                                    }
                                  >
                                    <span className="material-symbols-rounded" style={{ marginRight: 10, color: "#3F5E4D" }}>directions_car</span>
                                    {v.plate}
                                    <span
                                      style={{
                                        fontSize: 13,
                                        color: "#9E826C",
                                        fontWeight: "500",
                                        marginLeft: 12,
                                      }}
                                    >
                                      {v.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>

                        <button
                          onClick={handleSearch}
                          style={{
                            padding: "0 32px",
                            backgroundColor: "#3F5E4D",
                            color: "#FFFBF5",
                            border: "none",
                            borderRadius: 16,
                            fontSize: 16,
                            fontWeight: "800",
                            cursor: "pointer",
                            fontFamily: "'Outfit', sans-serif",
                            boxShadow: "0 4px 12px rgba(63, 94, 77, 0.2)",
                            transition: "all 0.2s",
                            letterSpacing: 0.5
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          TÌM KIẾM
                        </button>
                      </div>

                      {searchDone && !searchResult && (
                        <div style={styles.emptyState}>
                          Không tìm thấy xe với biển số "{searchPlate}". Xe này
                          có thể là khách vãng lai.
                        </div>
                      )}

                      {searchResult && (
                        <>
                          <div
                            style={{
                              backgroundColor: "#FFFBF5",
                              borderRadius: 20,
                              padding: 32,
                              border: "2px solid #EAE5D9",
                              marginBottom: 24,
                              boxShadow: "0 8px 24px rgba(139, 115, 85, 0.06)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                marginBottom: 24,
                                borderBottom: "2px dashed #EAE5D9",
                                paddingBottom: 16
                              }}
                            >
                              <span className="material-symbols-rounded" style={{ color: "#9E826C", fontSize: 28 }}>info</span>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: "800",
                                  color: "#9E826C",
                                  textTransform: "uppercase",
                                  letterSpacing: 2,
                                }}
                              >
                                THÔNG TIN XE
                              </div>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: 24,
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#9E826C",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: 1
                                  }}
                                >
                                  BIỂN SỐ
                                </div>
                                <div
                                  style={{
                                    fontSize: 28,
                                    fontWeight: "900",
                                    color: "#2D3327",
                                    marginTop: 8,
                                    fontFamily: "'Outfit', sans-serif"
                                  }}
                                >
                                  {searchResult.vehicle.plate_number}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#9E826C",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: 1
                                  }}
                                >
                                  TRẠNG THÁI
                                </div>
                                <div
                                  style={{
                                    marginTop: 12,
                                  }}
                                >
                                  {searchResult.latestSession ? (
                                    <span
                                      style={{
                                        padding: "6px 14px",
                                        borderRadius: 12,
                                        fontSize: 14,
                                        fontWeight: "800",
                                        backgroundColor:
                                          searchResult.latestSession.status ===
                                          "parking"
                                            ? "#EAE5D9"
                                            : "rgba(63, 94, 77, 0.1)",
                                        color:
                                          searchResult.latestSession.status ===
                                          "parking"
                                            ? "#9E826C"
                                            : "#3F5E4D",
                                        border: searchResult.latestSession.status === "parking" 
                                          ? "1px solid #D5CCBE" 
                                          : "1px solid rgba(63, 94, 77, 0.2)",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6
                                      }}
                                    >
                                      {searchResult.latestSession.status === "parking" 
                                        ? <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>local_parking</span> Đang trong bãi</>
                                        : <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>logout</span> Đã ra khỏi bãi</>
                                      }
                                    </span>
                                  ) : (
                                    <span style={{ color: "#64748b", fontWeight: "600" }}>Chưa có lịch sử</span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#9E826C",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: 1
                                  }}
                                >
                                  GIỜ VÀO GẦN NHẤT
                                </div>
                                <div
                                  style={{
                                    fontSize: 18,
                                    fontWeight: "700",
                                    color: "#2D3327",
                                    marginTop: 8,
                                  }}
                                >
                                  {searchResult.latestSession?.time_in
                                    ? new Date(
                                        searchResult.latestSession.time_in
                                      ).toLocaleString("vi-VN")
                                    : "---"}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#9E826C",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: 1
                                  }}
                                >
                                  NHÂN VIÊN GHI NHẬN
                                </div>
                                <div
                                  style={{
                                    fontSize: 18,
                                    fontWeight: "700",
                                    color: "#2D3327",
                                    marginTop: 8,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8
                                  }}
                                >
                                  {searchResult.latestSession?.security_name ? (
                                    <><span className="material-symbols-rounded" style={{ color: "#3F5E4D", fontSize: 20 }}>badge</span> {searchResult.latestSession.security_name}</>
                                  ) : (
                                    "---"
                                  )}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#9E826C",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: 1
                                  }}
                                >
                                  CHỦ XE
                                </div>
                                <div
                                  style={{
                                    fontSize: 18,
                                    fontWeight: "700",
                                    color: "#2D3327",
                                    marginTop: 8,
                                  }}
                                >
                                  {searchResult.vehicle.resident_name || "Khách vãng lai"}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#9E826C",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: 1
                                  }}
                                >
                                  CĂN HỘ
                                </div>
                                <div
                                  style={{
                                    fontSize: 18,
                                    fontWeight: "700",
                                    color: "#2D3327",
                                    marginTop: 8,
                                  }}
                                >
                                  {searchResult.vehicle.apartment_number ? (
                                    <span style={{ backgroundColor: "#F1ECE4", padding: "4px 10px", borderRadius: 8, border: "1px solid #E4DDD3" }}>
                                      {searchResult.vehicle.apartment_number}
                                    </span>
                                  ) : "---"}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#9E826C",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: 1
                                  }}
                                >
                                  LOẠI XE
                                </div>
                                <div
                                  style={{
                                    fontSize: 18,
                                    fontWeight: "700",
                                    color: "#2D3327",
                                    marginTop: 8,
                                  }}
                                >
                                  {searchResult.vehicle.type_name || "---"}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#9E826C",
                                    fontWeight: "700",
                                    textTransform: "uppercase",
                                    letterSpacing: 1
                                  }}
                                >
                                  MÀU XE
                                </div>
                                <div
                                  style={{
                                    fontSize: 18,
                                    fontWeight: "700",
                                    color: "#2D3327",
                                    marginTop: 8,
                                  }}
                                >
                                  {searchResult.vehicle.color || "---"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: "800",
                              color: "#9E826C",
                              marginBottom: 16,
                              textTransform: "uppercase",
                              letterSpacing: 2,
                              display: "flex",
                              alignItems: "center",
                              gap: 8
                            }}
                          >
                            <span className="material-symbols-rounded" style={{ fontSize: 24 }}>history</span>
                            LỊCH SỬ RA/VÀO GẦN ĐÂY
                          </div>

                          <div style={styles.logsTable}>
                            <div style={{...styles.tableRowHeader, backgroundColor: "#3F5E4D", color: "#FFFBF5", borderBottom: "none", fontSize: 12, letterSpacing: 1}}>
                              <div style={styles.tableCell}>BIỂN SỐ</div>
                              <div style={styles.tableCell}>TRẠNG THÁI</div>
                              <div style={styles.tableCell}>THỜI GIAN VÀO</div>
                              <div style={styles.tableCell}>THỜI GIAN RA</div>
                              <div style={styles.tableCell}>NHÂN VIÊN</div>
                            </div>

                            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                              {searchResult.history.length === 0 ? (
                                <div style={{...styles.emptyState, backgroundColor: "#FFFBF5"}}>
                                  Chưa có lịch sử gửi xe
                                </div>
                              ) : (
                                searchResult.history.map((h) => (
                                  <div key={h.session_id} style={{...styles.tableRow, backgroundColor: "#FFFBF5", alignItems: "center"}}>
                                    <div style={{...styles.tableCell, fontWeight: "800", fontSize: 18, color: "#2D3327", fontFamily: "'Outfit', sans-serif"}}>
                                      {h.plate_number || searchResult.vehicle.plate_number}
                                    </div>
                                    <div style={styles.tableCell}>
                                      {h.status === "parking" ? (
                                        <span style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: "700", backgroundColor: "#EAE5D9", color: "#9E826C", border: "1px solid #D5CCBE", display: "inline-block" }}>
                                          Đang trong bãi
                                        </span>
                                      ) : (
                                        <span style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: "700", backgroundColor: "rgba(63, 94, 77, 0.1)", color: "#3F5E4D", border: "1px solid rgba(63, 94, 77, 0.2)", display: "inline-block" }}>
                                          Đã ra khỏi bãi
                                        </span>
                                      )}
                                    </div>
                                    <div style={styles.tableCell}>
                                      {h.time_in ? (
                                        <>
                                          <div style={{ fontWeight: "800", color: "#2D3327", fontSize: 15 }}>{new Date(h.time_in).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</div>
                                          <div style={{ fontSize: 12, color: "#9E826C", fontWeight: "600", marginTop: 2 }}>{new Date(h.time_in).toLocaleDateString("vi-VN")}</div>
                                        </>
                                      ) : <div style={{ color: "#9E826C", fontWeight: "600" }}>---</div>}
                                    </div>
                                    <div style={styles.tableCell}>
                                      {h.time_out ? (
                                        <>
                                          <div style={{ fontWeight: "800", color: "#2D3327", fontSize: 15 }}>{new Date(h.time_out).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</div>
                                          <div style={{ fontSize: 12, color: "#9E826C", fontWeight: "600", marginTop: 2 }}>{new Date(h.time_out).toLocaleDateString("vi-VN")}</div>
                                        </>
                                      ) : <div style={{ color: "#9E826C", fontWeight: "600" }}>---</div>}
                                    </div>
                                    <div style={{...styles.tableCell, display: "flex", alignItems: "center", gap: 8, fontWeight: "700", color: "#5F504B"}}>
                                      {h.security_name ? (
                                        <><span className="material-symbols-rounded" style={{ fontSize: 18, color: "#9E826C" }}>badge</span> {h.security_name}</>
                                      ) : <div style={{ color: "#9E826C" }}>---</div>}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(45, 51, 39, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#FFFBF5",
            borderRadius: 20,
            width: "90%",
            maxWidth: 400,
            padding: 24,
            boxShadow: "0 20px 45px rgba(0,0,0,0.15)",
            fontFamily: "'Outfit', sans-serif",
            textAlign: "center"
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "rgba(205, 92, 92, 0.1)",
              color: "#CD5C5C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              margin: "0 auto 16px"
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 32 }}>logout</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", color: "#2D3327", fontSize: 18, fontWeight: "800" }}>ĐĂNG XUẤT HỆ THỐNG</h3>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 14, lineHeight: "20px" }}>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản lý bãi đỗ xe Vinhomes?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  navigate("/login");
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#CD5C5C",
                  color: "#FFFBF5",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#b04f4f"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#CD5C5C"}
              >
                Đăng xuất
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#F1ECE4",
                  color: "#5F504B",
                  border: "1px solid #E4DDD3",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#FAF8F5",
    fontFamily: "'Outfit', -apple-system, sans-serif",
    overflow: "hidden",
  },

  sidebar: {
    width: 256,
    backgroundColor: "#9E826C", // Warm Oak Wood
    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    height: "100%",
  },
  sidebarHeader: {
    padding: "24px 20px 20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 38,
    height: 38,
    backgroundColor: "#FFFBF5",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#3F5E4D", // Forest Green
    fontSize: 20,
    fontWeight: "800",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  logoText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFBF5",
    lineHeight: "20px",
    letterSpacing: "0.5px",
  },
  logoSubText: {
    fontSize: 11,
    color: "#FFFBF5",
    opacity: 0.8,
    lineHeight: "16px",
    marginTop: 2,
    fontWeight: "600",
  },
  menuSection: {
    flex: 1,
    padding: "20px 0",
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFBF5",
    opacity: 0.65,
    letterSpacing: "1.2px",
    padding: "0 20px",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  menuItems: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 20px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.2s ease-in-out",
    margin: "0 12px",
    color: "#FFFBF5",
    opacity: 0.85,
    fontWeight: "500",
  },
  menuItemActive: {
    backgroundColor: "#3F5E4D", // Forest Green active background
    color: "#FFFBF5",
    fontWeight: "600",
    opacity: 1,
    boxShadow: "0 4px 16px rgba(63, 94, 77, 0.25)",
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  footerUserRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
  },
  footerAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#FFFBF5",
    color: "#9E826C",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 0,
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  footerUserInfo: {
    overflow: "hidden",
  },
  footerUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFBF5",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  footerUserRole: {
    fontSize: 12,
    color: "#FFFBF5",
    opacity: 0.75,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "600",
    transition: "all 0.2s",
    color: "#FFD1D1",
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 209, 209, 0.2)",
    textAlign: "center",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  topHeader: {
    height: 64,
    backgroundColor: "#FFFBF5",
    borderBottom: "1px solid rgba(139, 115, 85, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    backgroundColor: "#3F5E4D",
    color: "#FFFBF5",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: "700",
    boxShadow: "0 4px 10px rgba(63, 94, 77, 0.15)",
  },
  contentBody: {
    flex: 1,
    padding: 24,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  capacityRow: {
    display: "flex",
    gap: 20,
    marginBottom: 16,
    flexShrink: 0,
  },
  capacityCard: {
    flex: 1,
    backgroundColor: "#FFFBF5",
    borderRadius: 20,
    padding: 20,
    display: "flex",
    alignItems: "center",
    border: "1px solid rgba(139, 115, 85, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#3F5E4D",
    boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)",
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2D3327",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
  },
  mainPanelRow: {
    display: "flex",
    gap: 24,
    flex: 1,
    minHeight: 0,
  },
  leftPanel: {
    flex: 2,
    backgroundColor: "#FFFBF5",
    borderRadius: 20,
    border: "1px solid rgba(139, 115, 85, 0.08)",
    display: "flex",
    flexDirection: "column",
    padding: 24,
    boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)",
    overflow: "hidden",
  },
  modeToggle: {
    display: "flex",
    backgroundColor: "#F1ECE4",
    borderRadius: 10,
    padding: 4,
    marginBottom: 8,
    alignSelf: "center",
    flexShrink: 0,
    border: "1px solid #E4DDD3",
  },
  modeBtn: {
    padding: "10px 30px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "transparent",
    fontWeight: "800",
    fontSize: 14,
    color: "#5F504B",
    cursor: "pointer",
    transition: "0.2s",
  },
  modeActiveIn: {
    backgroundColor: "#FFFBF5",
    color: "#3F5E4D", // green for entry
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    border: "2px solid #3F5E4D",
  },
  modeActiveOut: {
    backgroundColor: "#FFFBF5",
    color: "#CD5C5C", // terracotta red for exit
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    border: "2px solid #CD5C5C",
  },
  inputContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9E826C",
    marginBottom: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  bigInput: {
    fontSize: 72,
    fontWeight: "900",
    color: "#1E293B",
    textAlign: "center",
    border: "none",
    outline: "none",
    width: "100%",
    background: "transparent",
    fontFamily: "'Outfit', sans-serif",
    letterSpacing: 4,
    textShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  inputUnderline: {
    height: 6,
    width: 320,
    backgroundColor: "#3F5E4D",
    marginTop: 8,
    borderRadius: 3,
    boxShadow: "0 4px 12px rgba(63, 94, 77, 0.4)",
  },
  selectorsRow: {
    display: "flex",
    gap: 20,
    marginBottom: 12,
    borderTop: "1px solid #F1ECE4",
    paddingTop: 12,
    flexShrink: 0,
  },
  selectorGroup: {
    flex: 1,
    backgroundColor: "#FFFBF5",
    padding: "8px 12px",
    borderRadius: 12,
    border: "2px solid #EAE5D9",
  },
  selectorTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9E826C",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  cardsWrap: {
    display: "flex",
    gap: 12,
  },
  selectCard: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 0",
    borderRadius: 10,
    fontWeight: "700",
    fontSize: 13,
    transition: "all 0.2s ease-in-out",
    border: "2px solid #EAE5D9",
    minHeight: 65,
    backgroundColor: "#FFFBF5",
    cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
  },
  areaHint: {
    marginTop: 6,
    color: "#5F504B",
    fontSize: 11,
    lineHeight: 1.4,
    backgroundColor: "#F1ECE4",
    borderRadius: 8,
    padding: "6px 10px",
    border: "1px solid #E4DDD3",
    fontWeight: "500",
  },
  actionsRow: {
    display: "flex",
    alignItems: "stretch",
    height: 60,
    borderTop: "1px solid #F1ECE4",
    paddingTop: 12,
    flexShrink: 0,
  },
  actionBtn: {
    border: "none",
    borderRadius: 10,
    padding: "0 24px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
    transition: "all 0.2s",
  },
  toast: {
    padding: "14px 24px",
    borderRadius: 12,
    marginBottom: 20,
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: 10,
    position: "absolute",
    top: 120,
    right: 40,
    zIndex: 100,
    boxShadow: "0 8px 30px rgba(139, 115, 85, 0.12)",
  },
  dashboardPanel: {
    flex: 1,
    backgroundColor: "#FFFBF5",
    borderRadius: 20,
    border: "1px solid rgba(139, 115, 85, 0.08)",
    padding: 24,
    boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)",
    overflowY: "auto",
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    color: "#2D3327",
  },
  sectionSummaryRow: {
    display: "flex",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  summaryCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: "#FFFBF5",
    borderRadius: 16,
    padding: 18,
    border: "2px solid #EAE5D9",
    boxShadow: "0 4px 12px rgba(139, 115, 85, 0.02)",
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9E826C",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D3327",
  },
  logsTable: {
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #F1ECE4",
  },
  tableRowHeader: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1.5fr 1.5fr 1fr",
    backgroundColor: "#EAE5D9",
    color: "#2D3327",
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: "700",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1.5fr 1.5fr 1fr",
    padding: "14px 16px",
    borderBottom: "1px solid #F1ECE4",
    fontSize: 14,
    color: "#2D3327",
  },
  tableRowHeader4: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1.5fr 1.5fr",
    backgroundColor: "#EAE5D9",
    color: "#2D3327",
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: "700",
  },
  tableRow4: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1.5fr 1.5fr",
    padding: "14px 16px",
    borderBottom: "1px solid #F1ECE4",
    fontSize: 14,
    color: "#2D3327",
  },
  tableCell: {
    wordBreak: "break-word",
  },
  emptyState: {
    padding: 48,
    textAlign: "center",
    color: "#9E826C",
    fontSize: 14,
    fontWeight: "500",
  },
  rightPanel: {
    flex: 1,
    backgroundColor: "#FFFBF5",
    borderRadius: 20,
    border: "1px solid rgba(139, 115, 85, 0.08)",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    overflowX: "hidden",
    boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)",
  },
  ticketValidHeader: {
    backgroundColor: "#3F5E4D", // Forest green
    color: "#FFFBF5",
    padding: "16px",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "30px 20px",
  },
  userPhotoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: "#FAF8F5",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 50,
    color: "#EAE5D9",
    marginBottom: 16,
    border: "2px solid #EAE5D9",
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2D3327",
    marginBottom: 6,
  },
  userApt: {
    fontSize: 14,
    color: "#9E826C",
    fontWeight: "500",
  },
  ticketDetails: {
    padding: "0 24px",
    marginTop: 10,
  },
  tdRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #F1ECE4",
    fontSize: 14,
    color: "#2D3327",
  },
  parkingInfoBox: {
    backgroundColor: "#FFFBF5",
    margin: 24,
    padding: 20,
    borderRadius: 16,
    border: "2px solid #EAE5D9",
  },
  piRow: {
    display: "flex",
  },
  piCol: {
    flex: 1,
    textAlign: "center",
    borderRight: "1px solid #EAE5D9",
  },
  piLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9E826C",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  piValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2D3327",
  },
};

export default SecurityDashboard;
