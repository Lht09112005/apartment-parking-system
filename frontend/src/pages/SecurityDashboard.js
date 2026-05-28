import React, { useState, useEffect } from "react";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
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

  const refreshSecurityData = () => {
    fetchVehicleTypes();
    fetchVehicles();
    fetchVehicleLogs();
    fetchFees();
  };

  // Fetch dữ liệu lần đầu khi mở trang
  useEffect(() => {
    refreshSecurityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: khi backend có thay đổi xe / phiên gửi xe / phí thì tự cập nhật lại
  useRealtimeRefresh(
    refreshSecurityData,
    ["vehicles", "parkingSessions", "fees"],
    {
      intervalMs: 7000,
    }
  );

  useEffect(() => {
    if (viewMode === "logs") {
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
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
      logout();
      navigate("/login");
    }
  };

  const userName = user?.name || user?.username || "";
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "B";

  const menuItems = [
    { key: "gate", label: "Ghi nhận xe", icon: "directions_car" },
    { key: "logs", label: "Lịch sử gửi xe", icon: "history" },
    { key: "search", label: "Tìm kiếm xe", icon: "search" },
  ];

  const getPageTitle = () => {
    switch (viewMode) {
      case "gate":
        return "Ghi nhận xe";
      case "logs":
        return "Lịch sử gửi xe";
      case "search":
        return "Tìm kiếm xe";
      default:
        return "Ghi nhận xe";
    }
  };

  const activeMotos = vehicleLogs.filter(
    (s) => s.status === "parking" && Number(s.type_id) === 1
  ).length;

  const activeCars = vehicleLogs.filter(
    (s) => s.status === "parking" && Number(s.type_id) === 2
  ).length;

  const totalActive = activeMotos + activeCars;

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
          background: '#fff', border: '1px solid #e0e0e0', padding: 8, 
          borderRadius: 8, cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
                  onClick={() => setViewMode(item.key)}
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
                      color: viewMode === item.key ? "#1a73e8" : "#5f6368",
                      marginRight: 12,
                    }}
                  >
                    {item.icon}
                  </span>

                  <span
                    style={{
                      fontWeight: viewMode === item.key ? "600" : "400",
                      color: viewMode === item.key ? "#1a73e8" : "#3c4043",
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

            <div style={styles.headerRight}>
              <div style={{ textAlign: "right", marginRight: 12 }}>
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
              <div style={{ ...styles.capacityCard, borderColor: "#86efac" }}>
                <div style={{ flex: 1 }}>
                  <div style={styles.cardLabel}>KHU A - XE MÁY</div>
                  <div style={styles.cardNumber}>{activeMotos}/1200</div>
                </div>

                <div
                  style={{
                    ...styles.cardIcon,
                    background: "#dcfce7",
                    color: "#10b981",
                  }}
                >
                  🏍️
                </div>
              </div>

              <div style={{ ...styles.capacityCard, borderColor: "#fca5a5" }}>
                <div style={{ flex: 1 }}>
                  <div style={styles.cardLabel}>KHU B - Ô TÔ</div>
                  <div style={styles.cardNumber}>{activeCars}/150</div>
                </div>

                <div
                  style={{
                    ...styles.cardIcon,
                    background: "#fee2e2",
                    color: "#ef4444",
                  }}
                >
                  🚗
                </div>
              </div>

              <div style={{ ...styles.capacityCard, borderColor: "#7dd3fc" }}>
                <div style={{ flex: 1 }}>
                  <div style={styles.cardLabel}>TỔNG BÃI</div>
                  <div style={styles.cardNumber}>{totalActive}/1350</div>
                </div>

                <div
                  style={{
                    ...styles.cardIcon,
                    background: "#dbeafe",
                    color: "#0c4a6e",
                  }}
                >
                  📊
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
                    <div style={styles.inputLabel}>
                      NHẬP BIỂN SỐ XE / QUÉT THẺ
                    </div>

                    <input
                      autoFocus
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
                              backgroundColor: typeId === vt.type_id ? "#0f172a" : "#fff",
                              color: typeId === vt.type_id ? "#fff" : "#64748b",
                              cursor: (currentVehicle || mode === "OUT") ? "not-allowed" : "pointer",
                              opacity: (currentVehicle || mode === "OUT") && typeId !== vt.type_id ? 0.5 : 1,
                            }}
                          >
                            <div style={{ fontSize: 24, marginBottom: 4 }}>
                              {vt.type_name === "Ô tô" ? "🚘" : "🏍️"}
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
                              areaId === "A" ? "#0f172a" : "#f8fafc",
                            border:
                              areaId === "A"
                                ? "2px solid #0f172a"
                                : "1px solid #e2e8f0",
                            color: areaId === "A" ? "#fff" : "#0f172a",
                          }}
                        >
                          <div style={{ fontSize: 20 }}>A</div>
                          <div>XE MÁY</div>
                        </div>

                        <div
                          style={{
                            ...styles.selectCard,
                            backgroundColor:
                              areaId === "B" ? "#0f172a" : "#f8fafc",
                            border:
                              areaId === "B"
                                ? "2px solid #0f172a"
                                : "1px solid #e2e8f0",
                            color: areaId === "B" ? "#fff" : "#0f172a",
                          }}
                        >
                          <div style={{ fontSize: 20 }}>B</div>
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
                      : "Tìm kiếm thông tin xe"}
                  </div>

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
                        <div style={styles.tableRowHeader}>
                          <div style={styles.tableCell}>Biển số</div>
                          <div style={styles.tableCell}>Trạng thái</div>
                          <div style={styles.tableCell}>Vào</div>
                          <div style={styles.tableCell}>Ra</div>
                          <div style={styles.tableCell}>Nhân viên</div>
                        </div>

                        {vehicleLogs.length === 0 ? (
                          <div style={styles.emptyState}>
                            Chưa có bản ghi nào
                          </div>
                        ) : (
                          vehicleLogs.map((log) => (
                            <div key={log.session_id} style={styles.tableRow}>
                              <div style={styles.tableCell}>
                                {log.plate_number}
                              </div>
                              <div style={styles.tableCell}>
                                {log.status === "parking"
                                  ? "Đang gửi"
                                  : "Đã ra"}
                              </div>
                              <div style={styles.tableCell}>
                                {log.time_in
                                  ? new Date(log.time_in).toLocaleString()
                                  : "-"}
                              </div>
                              <div style={styles.tableCell}>
                                {log.time_out
                                  ? new Date(log.time_out).toLocaleString()
                                  : "-"}
                              </div>
                              <div style={styles.tableCell}>
                                {log.security_name || "N/A"}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}

                  {viewMode === "search" && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          marginBottom: 24,
                          position: "relative",
                        }}
                      >
                        <div style={{ flex: 1, position: "relative" }}>
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
                              padding: "14px 18px",
                              border: "2px solid #e2e8f0",
                              borderRadius: 10,
                              fontSize: 16,
                              outline: "none",
                              backgroundColor: "#f8fafc",
                              boxSizing: "border-box",
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
                                  backgroundColor: "#fff",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 8,
                                  marginTop: 4,
                                  boxShadow:
                                    "0 4px 6px -1px rgba(0,0,0,0.1)",
                                  zIndex: 10,
                                  overflow: "hidden",
                                }}
                              >
                                {getSuggestions().map((v) => (
                                  <div
                                    key={v.plate}
                                    onClick={() => handleSearch(v.plate)}
                                    style={{
                                      padding: "12px 18px",
                                      cursor: "pointer",
                                      borderBottom: "1px solid #f1f5f9",
                                      fontWeight: "600",
                                      color: "#0f172a",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        "#f8fafc")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        "transparent")
                                    }
                                  >
                                    {v.plate}
                                    <span
                                      style={{
                                        fontSize: 12,
                                        color: "#64748b",
                                        fontWeight: "400",
                                        marginLeft: 8,
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
                            padding: "14px 28px",
                            backgroundColor: "#0f172a",
                            color: "#fff",
                            border: "none",
                            borderRadius: 10,
                            fontSize: 15,
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          Tìm kiếm
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
                              backgroundColor: "#f8fafc",
                              borderRadius: 14,
                              padding: 24,
                              border: "1px solid #e2e8f0",
                              marginBottom: 20,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: "700",
                                color: "#64748b",
                                marginBottom: 16,
                                textTransform: "uppercase",
                                letterSpacing: 1,
                              }}
                            >
                              Thông tin xe
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: 16,
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#94a3b8",
                                    fontWeight: "600",
                                  }}
                                >
                                  BIỂN SỐ
                                </div>
                                <div
                                  style={{
                                    fontSize: 20,
                                    fontWeight: "900",
                                    color: "#0f172a",
                                    marginTop: 4,
                                  }}
                                >
                                  {searchResult.vehicle.plate_number}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#94a3b8",
                                    fontWeight: "600",
                                  }}
                                >
                                  TRẠNG THÁI
                                </div>
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: "#0f172a",
                                    marginTop: 4,
                                  }}
                                >
                                  {searchResult.latestSession ? (
                                    <span
                                      style={{
                                        padding: "4px 10px",
                                        borderRadius: 999,
                                        fontSize: 12,
                                        fontWeight: "700",
                                        backgroundColor:
                                          searchResult.latestSession.status ===
                                          "parking"
                                            ? "#dbeafe"
                                            : "#dcfce7",
                                        color:
                                          searchResult.latestSession.status ===
                                          "parking"
                                            ? "#1e40af"
                                            : "#166534",
                                      }}
                                    >
                                      {searchResult.latestSession.status ===
                                      "parking"
                                        ? "Đang gửi"
                                        : "Đã ra"}
                                    </span>
                                  ) : (
                                    <span>Chưa có lịch sử</span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#94a3b8",
                                    fontWeight: "600",
                                  }}
                                >
                                  GIỜ VÀO
                                </div>
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: "#0f172a",
                                    marginTop: 4,
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
                                    fontSize: 12,
                                    color: "#94a3b8",
                                    fontWeight: "600",
                                  }}
                                >
                                  NHÂN VIÊN
                                </div>
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: "#0f172a",
                                    marginTop: 4,
                                  }}
                                >
                                  {searchResult.latestSession?.security_name ||
                                    "N/A"}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#94a3b8",
                                    fontWeight: "600",
                                  }}
                                >
                                  CHỦ XE
                                </div>
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: "#0f172a",
                                    marginTop: 4,
                                  }}
                                >
                                  {searchResult.vehicle.resident_name ||
                                    "Chưa rõ"}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#94a3b8",
                                    fontWeight: "600",
                                  }}
                                >
                                  CĂN HỘ
                                </div>
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: "#0f172a",
                                    marginTop: 4,
                                  }}
                                >
                                  {searchResult.vehicle.apartment_number ||
                                    "---"}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#94a3b8",
                                    fontWeight: "600",
                                  }}
                                >
                                  LOẠI XE
                                </div>
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: "#0f172a",
                                    marginTop: 4,
                                  }}
                                >
                                  {searchResult.vehicle.type_name}
                                </div>
                              </div>

                              <div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#94a3b8",
                                    fontWeight: "600",
                                  }}
                                >
                                  MÀU XE
                                </div>
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: "#0f172a",
                                    marginTop: 4,
                                  }}
                                >
                                  {searchResult.vehicle.color || "---"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: "#64748b",
                              marginBottom: 12,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            Lịch sử gửi xe gần nhất
                          </div>

                          <div style={styles.logsTable}>
                            <div style={styles.tableRowHeader4}>
                              <div style={styles.tableCell}>Biển số</div>
                              <div style={styles.tableCell}>Trạng thái</div>
                              <div style={styles.tableCell}>Giờ vào</div>
                              <div style={styles.tableCell}>Nhân viên</div>
                            </div>

                            {searchResult.history.length === 0 ? (
                              <div style={styles.emptyState}>
                                Chưa có lịch sử gửi xe
                              </div>
                            ) : (
                              searchResult.history.map((h) => (
                                <div key={h.session_id} style={styles.tableRow4}>
                                  <div style={styles.tableCell}>
                                    <strong style={{ color: "#0f172a" }}>
                                      {h.plate_number ||
                                        searchResult.vehicle.plate_number}
                                    </strong>
                                  </div>

                                  <div style={styles.tableCell}>
                                    <span
                                      style={{
                                        padding: "4px 10px",
                                        borderRadius: 999,
                                        fontSize: 12,
                                        fontWeight: "600",
                                        backgroundColor:
                                          h.status === "parking"
                                            ? "#dbeafe"
                                            : "#dcfce7",
                                        color:
                                          h.status === "parking"
                                            ? "#1e40af"
                                            : "#166534",
                                      }}
                                    >
                                      {h.status === "parking"
                                        ? "Đang gửi"
                                        : "Đã ra"}
                                    </span>
                                  </div>

                                  <div style={styles.tableCell}>
                                    {h.time_in
                                      ? new Date(h.time_in).toLocaleString(
                                          "vi-VN"
                                        )
                                      : "-"}
                                  </div>

                                  <div style={styles.tableCell}>
                                    {h.security_name || "N/A"}
                                  </div>
                                </div>
                              ))
                            )}
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
    </>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f8f9fa",
    fontFamily: "'Segoe UI', -apple-system, sans-serif",
    overflow: "hidden",
  },

  sidebar: {
    width: 256,
    backgroundColor: "#fff",
    borderRight: "1px solid #e0e0e0",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: "24px 20px",
    borderBottom: "1px solid #e0e0e0",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 36,
    height: 36,
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: 700,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    color: "#202124",
  },
  logoSubText: {
    fontSize: 12,
    color: "#5f6368",
    marginTop: 1,
  },
  menuSection: {
    flex: 1,
    padding: "20px 0",
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#5f6368",
    letterSpacing: 1,
    textTransform: "uppercase",
    padding: "0 20px",
    marginBottom: 8,
  },
  menuItems: {
    display: "flex",
    flexDirection: "column",
  },
  menuItem: {
    padding: "10px 20px",
    color: "#3c4043",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 0,
    margin: "1px 0",
    transition: "background-color 0.15s",
  },
  menuItemActive: {
    backgroundColor: "#e8f0fe",
    color: "#1a73e8",
    fontWeight: 600,
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid #e0e0e0",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  footerUserRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  footerAvatar: {
    width: 36,
    height: 36,
    backgroundColor: "#e8f0fe",
    color: "#1a73e8",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 700,
    flexShrink: 0,
  },
  footerUserInfo: {
    overflow: "hidden",
  },
  footerUserName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#202124",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  footerUserRole: {
    fontSize: 12,
    color: "#5f6368",
  },
  logoutBtn: {
    backgroundColor: "#fce8e6",
    color: "#d93025",
    border: "none",
    padding: "8px 0",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  topHeader: {
    height: 56,
    backgroundColor: "#fff",
    borderBottom: "1px solid #e0e0e0",
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
    backgroundColor: "#e8f0fe",
    color: "#1a73e8",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 700,
  },
  contentBody: {
    flex: 1,
    padding: "16px 24px",
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
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    alignItems: "center",
    border: "1px solid #e2e8f0",
    borderLeftWidth: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
    backgroundColor: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    padding: "16px 24px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  modeToggle: {
    display: "flex",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
    alignSelf: "center",
    flexShrink: 0,
  },
  modeBtn: {
    padding: "10px 30px",
    borderRadius: 6,
    border: "none",
    backgroundColor: "transparent",
    fontWeight: "bold",
    fontSize: 14,
    color: "#64748b",
    cursor: "pointer",
    transition: "0.2s",
  },
  modeActiveIn: {
    backgroundColor: "#fff",
    color: "#059669",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  modeActiveOut: {
    backgroundColor: "#fff",
    color: "#dc2626",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
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
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
    letterSpacing: 1,
  },
  bigInput: {
    fontSize: 56,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
    border: "none",
    outline: "none",
    width: "100%",
    background: "transparent",
  },
  inputUnderline: {
    height: 4,
    width: 250,
    backgroundColor: "#cbd5e1",
    marginTop: 6,
  },
  selectorsRow: {
    display: "flex",
    gap: 20,
    marginBottom: 12,
    borderTop: "1px solid #f1f5f9",
    paddingTop: 12,
    flexShrink: 0,
  },
  selectorGroup: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: "12px 16px",
    borderRadius: 10,
  },
  selectorTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 10,
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
    padding: "10px 0",
    borderRadius: 12,
    fontWeight: "700",
    fontSize: 14,
    transition: "0.2s",
    border: "1px solid #e2e8f0",
    minHeight: 80,
  },
  areaHint: {
    marginTop: 10,
    color: "#475569",
    fontSize: 12,
    lineHeight: 1.5,
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
  },
  actionsRow: {
    display: "flex",
    alignItems: "stretch",
    height: 60,
    borderTop: "1px solid #f1f5f9",
    paddingTop: 12,
    flexShrink: 0,
  },
  actionBtn: {
    border: "none",
    borderRadius: 10,
    padding: "0 20px",
    fontWeight: "600",
    cursor: "pointer",
  },
  toast: {
    padding: "12px 20px",
    borderRadius: 8,
    marginBottom: 20,
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: 10,
    position: "absolute",
    top: 120,
    right: 40,
    zIndex: 100,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  dashboardPanel: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: 24,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
    overflowY: "auto",
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#0f172a",
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
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 18,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
  },
  logsTable: {
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  tableRowHeader: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1.5fr 1.5fr 1fr",
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: "700",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1.5fr 1.5fr 1fr",
    padding: "14px 16px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 14,
    color: "#0f172a",
  },
  tableRowHeader4: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1.5fr 1.5fr",
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: "700",
  },
  tableRow4: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1.5fr 1.5fr",
    padding: "14px 16px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 14,
    color: "#0f172a",
  },
  tableCell: {
    wordBreak: "break-word",
  },
  emptyState: {
    padding: 48,
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    overflowX: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  },
  ticketValidHeader: {
    backgroundColor: "#34d399",
    color: "#fff",
    padding: "16px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
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
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 50,
    color: "#94a3b8",
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
  },
  userApt: {
    fontSize: 14,
    color: "#64748b",
  },
  ticketDetails: {
    padding: "0 24px",
    marginTop: 10,
  },
  tdRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
  },
  parkingInfoBox: {
    backgroundColor: "#f8fafc",
    margin: 24,
    padding: 20,
    borderRadius: 10,
    border: "1px solid #e2e8f0",
  },
  piRow: {
    display: "flex",
  },
  piCol: {
    flex: 1,
    textAlign: "center",
    borderRight: "1px solid #e2e8f0",
  },
  piLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#94a3b8",
    marginBottom: 4,
  },
  piValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
};

export default SecurityDashboard;
