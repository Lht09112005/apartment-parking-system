import React, { useState, useEffect } from "react";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";

const ResidentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [view, setView] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [history, setHistory] = useState([]);
  const [feesData, setFeesData] = useState({
    feeConfig: [],
    monthlyRegistrations: [],
  });

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    plate_number: "",
    type_id: 1,
    color: "",
  });
  const [editProfile, setEditProfile] = useState(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [renewVehicle, setRenewVehicle] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapZone, setMapZone] = useState("car");
  const [modalLevel, setModalLevel] = useState("B1");
  const [searchSlot, setSearchSlot] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [accountForm, setAccountForm] = useState({
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchProfile = async () => {
    try {
      const r = await axios.get("/resident/profile");
      setProfile(r.data);
    } catch (e) {
      console.error("Lỗi tải profile:", e);
    }
  };

  const fetchVehicles = async () => {
    try {
      const r = await axios.get("/resident/vehicles");
      setVehicles(r.data);
    } catch (e) {
      console.error("Lỗi tải xe cư dân:", e);
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      const r = await axios.get("/resident/vehicle-types");
      setVehicleTypes(r.data.filter(vt => vt.type_id !== 3));

      if (r.data.length > 0) {
        setNewVehicle((p) => ({
          ...p,
          type_id: p.type_id || r.data[0].type_id,
        }));
      }
    } catch (e) {
      console.error("Lỗi tải loại xe:", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const r = await axios.get("/resident/history");
      setHistory(r.data);
    } catch (e) {
      console.error("Lỗi tải lịch sử gửi xe:", e);
    }
  };

  const fetchFees = async () => {
    try {
      const r = await axios.get("/resident/fees");
      setFeesData(r.data);
    } catch (e) {
      console.error("Lỗi tải phí:", e);
    }
  };

  const fetchData = () => {
    fetchProfile();
    fetchVehicleTypes();
    fetchVehicles();
    fetchHistory();
    fetchFees();
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get("view");
    if (viewParam && ["overview", "vehicles", "monthly", "history", "fees", "profile"].includes(viewParam)) {
      setView(viewParam);
    }
  }, [location]);

  useRealtimeRefresh(
    fetchData,
    [
      "residentProfile",
      "residentVehicles",
      "residentFees",
      "vehicles",
      "monthly",
      "fees",
      "parkingSessions",
    ],
    {
      intervalMs: 10000,
    }
  );

  useEffect(() => {
    if (vehicles.length > 0) {
      const hasCar = vehicles.some(v => v.type_name === "Ô tô");
      const hasBike = vehicles.some(v => v.type_name === "Xe máy" || v.type_name === "Xe đạp");
      if (hasBike && !hasCar) {
        setMapZone("motorbike");
      } else {
        setMapZone("car");
      }
    }
  }, [vehicles]);

  useEffect(() => {
    if (view === "vehicles" || view === "monthly" || view === "overview") {
      fetchVehicles();
    }

    if (view === "history" || view === "overview") {
      fetchHistory();
    }

    if (view === "fees" || view === "overview") {
      fetchFees();
    }

    if (view === "profile") {
      fetchProfile();
    }

    // Đóng sidebar trên mobile khi chuyển view
    setIsMobileOpen(false);
  }, [view]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (editProfile !== null) {
        setEditProfile(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [editProfile]);

  const showMsg = (type, text) => {
    setMsg({ type, text });

    setTimeout(() => {
      setMsg({ type: "", text: "" });
    }, 4000);
  };

  const handleRegisterVehicle = async () => {
    try {
      if (isEditingVehicle) {
        await axios.put(`/resident/vehicles/${newVehicle.old_plate_number}`, {
          new_plate_number: newVehicle.plate_number,
          type_id: newVehicle.type_id,
          color: newVehicle.color,
        });

        showMsg("success", "Cập nhật thành công, đang chờ duyệt lại");
      } else {
        await axios.post("/resident/vehicles", newVehicle);
        showMsg("success", "Đăng ký xe thành công");
      }

      setShowVehicleForm(false);
      setIsEditingVehicle(false);
      setNewVehicle({
        plate_number: "",
        type_id: vehicleTypes[0]?.type_id || 1,
        color: "",
      });

      fetchData();
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Lỗi");
    }
  };

  const handleDeleteVehicle = (plate) => {
    setVehicleToDelete(plate);
  };

  const executeDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    const plate = vehicleToDelete;
    setVehicleToDelete(null);

    try {
      await axios.delete(`/resident/vehicles/${plate}`);
      showMsg("success", "Xóa xe thành công");
      fetchData();
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Lỗi xóa xe");
    }
  };

  const openEditForm = (v) => {
    setNewVehicle({
      old_plate_number: v.plate_number,
      plate_number: v.plate_number,
      type_id: v.type_id,
      color: v.color || "",
    });

    setIsEditingVehicle(true);
    setShowVehicleForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleRegisterMonthly = async (plate) => {
    try {
      const r = await axios.post("/resident/monthly", {
        plate_number: plate,
      });

      showMsg("success", r.data.message);
      setRenewVehicle(null);
      fetchData();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Lỗi đăng ký vé tháng");
    }
  };

  const handleRenewMonthly = async (plate) => {
    try {
      const r = await axios.post("/resident/monthly/renew", {
        plate_number: plate,
      });
      showMsg("success", r.data.message || "Gửi yêu cầu gia hạn thành công!");
      setRenewVehicle(null);
      fetchData();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Lỗi gửi yêu cầu gia hạn");
    }
  };

  const getVehicleMonthlyFee = (typeId) => {
    if (!feesData || !feesData.feeConfig) return 0;
    const fee = feesData.feeConfig.find((f) => f.type_id === typeId);
    return fee ? parseFloat(fee.monthly_fee) : 0;
  };

  const handleUpdateProfile = async () => {
    if (!editProfile) return;

    try {
      const r = await axios.put("/resident/profile", editProfile);

      showMsg("success", r.data.message);
      window.history.back(); // Pop the dummy history state
      fetchData();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Lỗi cập nhật");
    }
  };

  const handleChangeAccount = async (e) => {
    e.preventDefault();
    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      showMsg("error", "Mật khẩu mới không khớp!");
      return;
    }
    try {
      const res = await axios.put("/auth/change-credentials", {
        currentPassword: accountForm.currentPassword,
        newUsername: accountForm.newUsername || undefined,
        newPassword: accountForm.newPassword || undefined,
      });
      showMsg("success", res.data.message);
      setShowAccountSettings(false);
      setAccountForm({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
      fetchProfile();
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Lỗi cập nhật tài khoản");
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const getSlotState = (slotName) => {
    let charCodeSum = 0;
    for (let i = 0; i < slotName.length; i++) {
      charCodeSum += slotName.charCodeAt(i);
    }
    const mod = charCodeSum % 3;
    if (mod === 0) return "available";
    if (mod === 1) return "occupied";
    return "guest";
  };

  const renderOverview = () => {
    const displayHistory = history.slice(0, 3);

    const carSlots = Array.from({ length: 10 }, (_, i) => `A-${String(i + 1).padStart(2, '0')}`);
    const motoSlots = Array.from({ length: 20 }, (_, i) => `M-${String(i + 1).padStart(2, '0')}`);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Luxury greeting banner with CSS towers */}
        <div style={{
          backgroundColor: "#3F5E4D",
          borderRadius: 24,
          padding: "32px 40px",
          color: "#FFFBF5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(63,94,77,0.15)",
          minHeight: 180
        }}>
          <div style={{
            position: "absolute",
            top: "-50%",
            left: "-20%",
            width: "80%",
            height: "200%",
            background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)",
            pointerEvents: "none"
          }} />

          <div style={{ flex: 1, zIndex: 2 }}>
            <div style={{
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: "2px",
              opacity: 0.8,
              textTransform: "uppercase",
              marginBottom: 8
            }}>
              CHÀO BUỒI SÁNG · VINHOMES ECO-GREEN RESIDENT
            </div>
            <h1 style={{
              fontSize: 32,
              fontWeight: "800",
              margin: "0 0 12px 0",
              letterSpacing: "-0.5px"
            }}>
              Xin chào, {profile?.name || user?.username || "Cư dân"} 👋
            </h1>
            <p style={{
              margin: 0,
              fontSize: 14,
              opacity: 0.9,
              maxWidth: 500,
              lineHeight: "22px"
            }}>
              Hệ thống bãi đỗ xe thông minh Vinhomes đang hoạt động ổn định. Hôm nay bãi xe còn trống <strong>45 chỗ</strong> (Hầm B1: 30, B2: 15).
            </p>
          </div>

          {/* Skyscapers Pure CSS graphics */}
          <div style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            height: "100%",
            alignSelf: "flex-end",
            marginTop: -32,
            marginBottom: -32,
            opacity: 0.9,
            zIndex: 1,
            pointerEvents: "none"
          }}>
            {/* Tower 1 */}
            <div style={{
              width: 45,
              height: 120,
              backgroundColor: "rgba(255, 253, 245, 0.12)",
              borderRadius: "8px 8px 0 0",
              padding: "8px 6px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 4,
              backdropFilter: "blur(1px)"
            }}>
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} style={{
                  backgroundColor: i % 3 === 0 ? "transparent" : "#FFFBF5",
                  opacity: i % 4 === 0 ? 0.2 : 0.8,
                  height: 6,
                  borderRadius: 1
                }} />
              ))}
            </div>
            {/* Tower 2 */}
            <div style={{
              width: 55,
              height: 150,
              backgroundColor: "rgba(255, 253, 245, 0.2)",
              borderRadius: "10px 10px 0 0",
              padding: "10px 8px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 4,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              backdropFilter: "blur(2px)"
            }}>
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} style={{
                  backgroundColor: i % 5 === 0 ? "transparent" : "#FFFBF5",
                  opacity: i % 3 === 0 ? 0.3 : 0.9,
                  height: 7,
                  borderRadius: 1
                }} />
              ))}
            </div>
            {/* Tower 3 */}
            <div style={{
              width: 40,
              height: 100,
              backgroundColor: "rgba(255, 253, 245, 0.08)",
              borderRadius: "6px 6px 0 0",
              padding: "6px 5px",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 4,
              backdropFilter: "blur(1px)"
            }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{
                  backgroundColor: i % 2 === 0 ? "transparent" : "#FFFBF5",
                  opacity: i % 3 === 0 ? 0.15 : 0.7,
                  height: 6,
                  borderRadius: 1
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Resident vehicle wallet */}
        <div style={{
          backgroundColor: "#FFFBF5",
          borderRadius: 24,
          padding: 24,
          border: "1px solid rgba(139, 115, 85, 0.08)",
          boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, color: "#2D3327", fontSize: 18, fontWeight: "800" }}>Ví xe của tôi</h3>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>Các phương tiện giao thông đã được phê duyệt</p>
            </div>
            <button
              onClick={() => navigate("?view=vehicles")}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#3F5E4D",
                fontWeight: "700",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              Xem tất cả <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_forward</span>
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div style={{
              padding: "32px 16px",
              textAlign: "center",
              border: "2px dashed #EAE5D9",
              borderRadius: 16,
              color: "#64748b",
              backgroundColor: "rgba(139, 115, 85, 0.02)"
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 48, color: "#9E826C", marginBottom: 12 }}>directions_car</span>
              <p style={{ margin: "0 0 16px", fontSize: 14 }}>Bạn chưa đăng ký phương tiện nào trong hệ thống.</p>
              <button
                onClick={() => {
                  navigate("?view=vehicles");
                  setShowVehicleForm(true);
                }}
                style={S.primaryBtn}
              >
                + Đăng ký xe đầu tiên
              </button>
            </div>
          ) : (
            <div style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              paddingBottom: 4,
              margin: "0 -4px"
            }}>
              {vehicles.map((v) => (
                <div
                  key={v.plate_number}
                  style={{
                    flex: "0 0 280px",
                    backgroundColor: "#FFFBF5",
                    borderRadius: 18,
                    border: "1.5px solid rgba(139, 115, 85, 0.12)",
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    boxShadow: "0 4px 12px rgba(139, 115, 85, 0.02)",
                    transition: "transform 0.2s ease-in-out"
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: "#F1ECE4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      boxShadow: "inset 0 1px 4px rgba(0,0,0,0.05)"
                    }}>
                      {v.type_name === "Ô tô" ? (
                        <span className="material-symbols-rounded" style={{ fontSize: 32, color: "#3F5E4D" }}>directions_car</span>
                      ) : (
                        <span className="material-symbols-rounded" style={{ fontSize: 32, color: "#9E826C" }}>motorcycle</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: "800", color: "#2D3327", letterSpacing: "0.5px" }}>{v.plate_number}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{v.type_name} · {v.color || "Không màu"}</div>
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px dashed #EAE5D9",
                    paddingTop: 10,
                    fontSize: 12
                  }}>
                    <span style={{
                      color: v.status === "active" ? "#3F5E4D" : v.status === "rejected" ? "#991b1b" : "#d97706",
                      fontWeight: "700"
                    }}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {v.status === "active" ? (
                            <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>check_circle</span> ĐÃ PHÊ DUYỆT</>
                          ) : v.status === "rejected" ? (
                            <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>cancel</span> BỊ TỪ CHỐI</>
                          ) : (
                            <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>pending</span> CHỜ DUYỆT</>
                          )}
                        </span>
                        {v.status === "rejected" && v.rejection_reason && (
                          <span style={{ fontSize: 10, color: '#991b1b', fontWeight: '500', fontStyle: 'italic' }}>
                            {v.rejection_reason}
                          </span>
                        )}
                      </span>
                    </span>
                    {v.monthly_status === "active" ? (
                      <span style={{
                        backgroundColor: "#E2ECE9",
                        color: "#3F5E4D",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontWeight: "700",
                        fontSize: 10
                      }}>
                        VÉ THÁNG
                      </span>
                    ) : (
                      <span style={{
                        backgroundColor: "#F1ECE4",
                        color: "#5F504B",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontWeight: "600",
                        fontSize: 10
                      }}>
                        VÉ LƯỢT
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map grid and Activities timeline combined */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {/* Parking Area Mini View */}
          <div style={{
            backgroundColor: "#FFFBF5",
            borderRadius: 24,
            padding: 24,
            border: "1px solid rgba(139, 115, 85, 0.08)",
            boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, color: "#2D3327", fontSize: 18, fontWeight: "800" }}>Sơ đồ bãi xe</h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>Tình trạng hầm gửi xe trực quan</p>
              </div>
              <button
                onClick={() => setShowMapModal(true)}
                style={{
                  ...S.primaryBtn,
                  padding: "6px 14px",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>fullscreen</span> Vào sơ đồ xe
              </button>
            </div>

            {/* Smart Switcher Tab */}
            <div style={{
              display: "flex",
              backgroundColor: "#EAE5D9",
              padding: 4,
              borderRadius: 10,
              gap: 4
            }}>
              <button
                onClick={() => setMapZone("car")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: 8,
                  backgroundColor: mapZone === "car" ? "#3F5E4D" : "transparent",
                  color: mapZone === "car" ? "#FFFBF5" : "#5F504B",
                  fontWeight: "700",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.2s"
                }}
              >
                🚗 Khu đỗ Ô tô
              </button>
              <button
                onClick={() => setMapZone("motorbike")}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: 8,
                  backgroundColor: mapZone === "motorbike" ? "#3F5E4D" : "transparent",
                  color: mapZone === "motorbike" ? "#FFFBF5" : "#5F504B",
                  fontWeight: "700",
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.2s"
                }}
              >
                🏍️ Khu đỗ Xe máy
              </button>
            </div>

            {/* Parking space grid simulation */}
            <div
              onClick={() => setShowMapModal(true)}
              style={{
                border: "1px solid #EAE5D9",
                borderRadius: 16,
                padding: 16,
                backgroundColor: "rgba(139, 115, 85, 0.01)",
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative"
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#9E826C"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#EAE5D9"}
            >
              {mapZone === "car" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                  {carSlots.map((slot) => {
                    const state = getSlotState(slot);
                    return (
                      <div key={slot} style={{
                        height: 52,
                        borderRadius: 8,
                        border: `1.5px solid ${state === "available" ? "#3F5E4D" : state === "occupied" ? "#CD5C5C" : "#C39A6B"}`,
                        backgroundColor: state === "available" ? "rgba(63, 94, 77, 0.15)" : state === "occupied" ? "rgba(205, 92, 92, 0.15)" : "rgba(195, 154, 107, 0.15)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 2
                      }}>
                        <span style={{ fontSize: 11, fontWeight: "800", color: "#2D3327" }}>{slot}</span>
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: state === "available" ? "#3F5E4D" : state === "occupied" ? "#CD5C5C" : "#C39A6B"
                        }} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                  {motoSlots.map((slot) => {
                    const state = getSlotState(slot);
                    return (
                      <div key={slot} style={{
                        height: 40,
                        borderRadius: 6,
                        border: `1px solid ${state === "available" ? "#3F5E4D" : state === "occupied" ? "#CD5C5C" : "#C39A6B"}`,
                        backgroundColor: state === "available" ? "rgba(63, 94, 77, 0.1)" : state === "occupied" ? "rgba(205, 92, 92, 0.1)" : "rgba(195, 154, 107, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: "700",
                        color: "#2D3327"
                      }}>
                        {slot}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Overlay hover prompt */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "rgba(63, 94, 77, 0.02)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.2s",
                fontWeight: "700",
                fontSize: 13,
                color: "#3F5E4D",
                backdropFilter: "blur(0.5px)"
              }}
              className="map-overlay-hover"
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
              >
                🔍 CLICK ĐỂ XEM CHI TIẾT HẦM B1 & B2
              </div>
            </div>

            {/* Legends */}
            <div style={{ display: "flex", justifyContent: "space-around", fontSize: 11, fontWeight: "700", color: "#64748b", borderTop: "1px dashed #EAE5D9", paddingTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#3F5E4D" }} /> Trống
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#CD5C5C" }} /> Đang đỗ
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#C39A6B" }} /> Khách
              </div>
            </div>
          </div>

          {/* Activities Timeline */}
          <div style={{
            backgroundColor: "#FFFBF5",
            borderRadius: 24,
            padding: 24,
            border: "1px solid rgba(139, 115, 85, 0.08)",
            boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}>
            <div>
              <h3 style={{ margin: 0, color: "#2D3327", fontSize: 18, fontWeight: "800" }}>Nhật ký ra vào</h3>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>3 hoạt động gửi xe gần đây nhất</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
              {displayHistory.length === 0 ? (
                <div style={{
                  padding: "28px 16px",
                  textAlign: "center",
                  border: "2px dashed #EAE5D9",
                  borderRadius: 16,
                  color: "#64748b",
                  backgroundColor: "rgba(139, 115, 85, 0.02)"
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 40, color: "#9E826C", marginBottom: 8 }}>history</span>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: "600" }}>Chưa có lịch sử vào ra</p>
                </div>
              ) : displayHistory.map((item, index) => {
                const isIn = item.status === "parking" || !item.time_out;
                const eventTime = isIn ? item.time_in : item.time_out;
                return (
                  <div key={item.session_id} style={{ display: "flex", gap: 14, position: "relative" }}>
                    {/* Visual node */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: isIn ? "#E2ECE9" : "#F8F1E5",
                        color: isIn ? "#3F5E4D" : "#C39A6B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        fontWeight: "800",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                      }}>
                        {isIn ? "↓" : "↑"}
                      </div>
                      {index < displayHistory.length - 1 && (
                        <div style={{
                          width: 2,
                          flex: 1,
                          borderLeft: "2px dashed #EAE5D9",
                          margin: "6px 0"
                        }} />
                      )}
                    </div>

                    {/* Node details */}
                    <div style={{ flex: 1, paddingBottom: index < displayHistory.length - 1 ? 16 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: 14, fontWeight: "800", color: "#2D3327" }}>{item.plate_number}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: "600" }}>
                          {eventTime ? new Date(eventTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "---"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 2 }}>
                        <span style={{ color: "#64748b" }}>{item.type_name} · {isIn ? "Lượt xe VÀO" : "Lượt xe RA"}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          {eventTime ? new Date(eventTime).toLocaleDateString("vi-VN") : "---"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMapModal = () => {
    const levelCarSlots = modalLevel === "B1"
      ? Array.from({ length: 24 }, (_, i) => `A-${String(i + 1).padStart(2, '0')}`)
      : Array.from({ length: 24 }, (_, i) => `B-${String(i + 1).padStart(2, '0')}`);

    const levelMotoSlots = modalLevel === "B1"
      ? Array.from({ length: 48 }, (_, i) => `M-${String(i + 1).padStart(2, '0')}`)
      : Array.from({ length: 48 }, (_, i) => `K-${String(i + 1).padStart(2, '0')}`);

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(45, 51, 39, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          backdropFilter: "blur(4px)"
        }}
        onClick={() => setShowMapModal(false)}
      >
        <div
          style={{
            backgroundColor: "#FFFBF5",
            borderRadius: 24,
            width: "90%",
            maxWidth: 960,
            height: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
            fontFamily: "'Outfit', sans-serif"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            backgroundColor: "#3F5E4D",
            padding: "20px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h3 style={{ margin: 0, color: "#FFFBF5", fontSize: 20, fontWeight: "800", letterSpacing: "0.5px" }}>
                🗺️ SƠ ĐỒ CHI TIẾT BÃI ĐỖ XE
              </h3>
              <p style={{ margin: "2px 0 0", color: "rgba(255,251,245,0.75)", fontSize: 12 }}>
                Khu đô thị Vinhomes Luxury Eco-Green
              </p>
            </div>
            <button
              onClick={() => setShowMapModal(false)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#FFFBF5",
                fontSize: 24,
                fontWeight: "300",
                cursor: "pointer",
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              ✕
            </button>
          </div>

          {/* Modal Controls Section */}
          <div style={{
            padding: "20px 28px",
            borderBottom: "1.5px solid #F1ECE4",
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(139, 115, 85, 0.02)"
          }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", backgroundColor: "#EAE5D9", padding: 3, borderRadius: 8, gap: 2 }}>
                <button
                  onClick={() => setModalLevel("B1")}
                  style={{
                    padding: "6px 16px",
                    border: "none",
                    borderRadius: 6,
                    backgroundColor: modalLevel === "B1" ? "#3F5E4D" : "transparent",
                    color: modalLevel === "B1" ? "#FFFBF5" : "#5F504B",
                    fontWeight: "700",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Tầng Hầm B1
                </button>
                <button
                  onClick={() => setModalLevel("B2")}
                  style={{
                    padding: "6px 16px",
                    border: "none",
                    borderRadius: 6,
                    backgroundColor: modalLevel === "B2" ? "#3F5E4D" : "transparent",
                    color: modalLevel === "B2" ? "#FFFBF5" : "#5F504B",
                    fontWeight: "700",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Tầng Hầm B2
                </button>
              </div>

              <div style={{ display: "flex", backgroundColor: "#EAE5D9", padding: 3, borderRadius: 8, gap: 2 }}>
                <button
                  onClick={() => setMapZone("car")}
                  style={{
                    padding: "6px 16px",
                    border: "none",
                    borderRadius: 6,
                    backgroundColor: mapZone === "car" ? "#3F5E4D" : "transparent",
                    color: mapZone === "car" ? "#FFFBF5" : "#5F504B",
                    fontWeight: "700",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  🚗 Khu Ô tô
                </button>
                <button
                  onClick={() => setMapZone("motorbike")}
                  style={{
                    padding: "6px 16px",
                    border: "none",
                    borderRadius: 6,
                    backgroundColor: mapZone === "motorbike" ? "#3F5E4D" : "transparent",
                    color: mapZone === "motorbike" ? "#FFFBF5" : "#5F504B",
                    fontWeight: "700",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  🏍️ Khu Xe máy
                </button>
              </div>
            </div>

            <div style={{ position: "relative", minWidth: 240 }}>
              <span className="material-symbols-rounded" style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 18,
                color: "#9E826C"
              }}>
                search
              </span>
              <input
                style={{
                  ...S.input,
                  paddingLeft: 38,
                  height: 38,
                  fontSize: 13,
                  width: "100%"
                }}
                value={searchSlot}
                onChange={(e) => setSearchSlot(e.target.value)}
                placeholder="Tìm slot đỗ xe (VD: 03, 14)..."
              />
            </div>
          </div>

          {/* Modal Grid Map Body */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: 28,
            backgroundColor: "#FAF8F5"
          }}>
            {mapZone === "car" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #EAE5D9", paddingBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: "800", color: "#3F5E4D" }}>LÀN XE 01</span>
                  <div style={{ height: 2, flex: 1, backgroundColor: "#EAE5D9", margin: "0 16px", borderStyle: "dashed" }} />
                  <span style={{ fontSize: 13, fontWeight: "800", color: "#3F5E4D" }}>LÀN XE 02</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: 16 }}>
                  {/* Left Column slots */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {levelCarSlots.slice(0, 12).map((slot) => {
                      const state = getSlotState(slot);
                      const isHighlighted = searchSlot && slot.toLowerCase().includes(searchSlot.toLowerCase());
                      return (
                        <div key={slot} style={{
                          height: 70,
                          borderRadius: 12,
                          border: isHighlighted ? "3px solid #C39A6B" : `1.5px solid ${state === "available" ? "#3F5E4D" : state === "occupied" ? "#CD5C5C" : "#C39A6B"}`,
                          backgroundColor: state === "available" ? "rgba(63, 94, 77, 0.12)" : state === "occupied" ? "rgba(205, 92, 92, 0.12)" : "rgba(195, 154, 107, 0.12)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: isHighlighted ? "0 0 12px rgba(195,154,107,0.6)" : "none",
                          transition: "all 0.2s"
                        }}>
                          <span style={{ fontSize: 13, fontWeight: "800", color: "#2D3327" }}>{slot}</span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: "700",
                            marginTop: 4,
                            color: state === "available" ? "#3F5E4D" : state === "occupied" ? "#CD5C5C" : "#C39A6B"
                          }}>
                            {state === "available" ? "Trống" : state === "occupied" ? "Đang đỗ" : "Khách"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Virtual Driveway */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-around",
                    alignItems: "center",
                    backgroundColor: "#EAE5D9",
                    borderRadius: 8,
                    color: "#5F504B",
                    fontSize: 11,
                    fontWeight: "800",
                    letterSpacing: "1px",
                    writingMode: "vertical-rl",
                    textTransform: "uppercase",
                    opacity: 0.8,
                    padding: "12px 0"
                  }}>
                    <span>↑ LỐI ĐI CHUNG ↓</span>
                  </div>

                  {/* Right Column slots */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {levelCarSlots.slice(12, 24).map((slot) => {
                      const state = getSlotState(slot);
                      const isHighlighted = searchSlot && slot.toLowerCase().includes(searchSlot.toLowerCase());
                      return (
                        <div key={slot} style={{
                          height: 70,
                          borderRadius: 12,
                          border: isHighlighted ? "3px solid #C39A6B" : `1.5px solid ${state === "available" ? "#3F5E4D" : state === "occupied" ? "#CD5C5C" : "#C39A6B"}`,
                          backgroundColor: state === "available" ? "rgba(63, 94, 77, 0.12)" : state === "occupied" ? "rgba(205, 92, 92, 0.12)" : "rgba(195, 154, 107, 0.12)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: isHighlighted ? "0 0 12px rgba(195,154,107,0.6)" : "none",
                          transition: "all 0.2s"
                        }}>
                          <span style={{ fontSize: 13, fontWeight: "800", color: "#2D3327" }}>{slot}</span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: "700",
                            marginTop: 4,
                            color: state === "available" ? "#3F5E4D" : state === "occupied" ? "#CD5C5C" : "#C39A6B"
                          }}>
                            {state === "available" ? "Trống" : state === "occupied" ? "Đang đỗ" : "Khách"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                  {levelMotoSlots.map((slot) => {
                    const state = getSlotState(slot);
                    const isHighlighted = searchSlot && slot.toLowerCase().includes(searchSlot.toLowerCase());
                    return (
                      <div key={slot} style={{
                        height: 52,
                        borderRadius: 10,
                        border: isHighlighted ? "2.5px solid #C39A6B" : `1px solid ${state === "available" ? "#3F5E4D" : state === "occupied" ? "#CD5C5C" : "#C39A6B"}`,
                        backgroundColor: state === "available" ? "rgba(63, 94, 77, 0.08)" : state === "occupied" ? "rgba(205, 92, 92, 0.08)" : "rgba(195, 154, 107, 0.08)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isHighlighted ? "0 0 8px rgba(195,154,107,0.5)" : "none",
                        transition: "all 0.2s"
                      }}>
                        <span style={{ fontSize: 11, fontWeight: "800", color: "#2D3327" }}>{slot}</span>
                        <span style={{
                          fontSize: 8,
                          fontWeight: "700",
                          marginTop: 2,
                          color: state === "available" ? "#3F5E4D" : state === "occupied" ? "#CD5C5C" : "#C39A6B"
                        }}>
                          {state === "available" ? "Trống" : "Đầy"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Legends */}
          <div style={{
            padding: "20px 28px",
            borderTop: "1.5px solid #F1ECE4",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "rgba(139, 115, 85, 0.02)"
          }}>
            <div style={{ display: "flex", gap: 24, fontSize: 13, fontWeight: "700", color: "#64748b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#3F5E4D" }} />
                <span>Available (Trống)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#CD5C5C" }} />
                <span>Occupied (Đầy)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#C39A6B" }} />
                <span>Guest (Vãng lai)</span>
              </div>
            </div>
            <button
              onClick={() => setShowMapModal(false)}
              style={S.cancelBtn}
            >
              Đóng sơ đồ
            </button>
          </div>
        </div>
      </div>
    );
  };

  const menuItems = [
    { key: "overview", label: "Tổng quan", icon: "grid_view" },
    { key: "vehicles", label: "Xe của tôi", icon: "directions_car" },
    { key: "monthly", label: "Vé tháng", icon: "receipt_long" },
    { key: "history", label: "Lịch sử gửi xe", icon: "history" },
    { key: "fees", label: "Phí & Hóa đơn", icon: "payments" },
    { key: "profile", label: "Thông tin cá nhân", icon: "person" },
  ];

  const userInitial = (profile?.name || user?.username || "?")
    .charAt(0)
    .toUpperCase();

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

      <div style={S.container}>
        <div className={`sidebar-container ${isMobileOpen ? 'open' : ''}`} style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={S.logoIcon}>P</div>

              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#202124",
                  }}
                >
                  ParkingMS
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#5f6368",
                    marginTop: 2,
                  }}
                >
                  Cư dân
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "20px 0", flex: 1 }}>
            <div style={S.menuLabel}>MENU</div>

            {menuItems.map((m, idx) => {
              const isActive = view === m.key;
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={m.key}
                  onClick={() => navigate("?view=" + m.key)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    ...S.menuItem,
                    ...(isActive ? S.menuActive : {}),
                    ...(!isActive && isHovered ? S.menuHover : {}),
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{
                      fontSize: 20,
                      color: isActive ? "#FFFBF5" : "rgba(255, 255, 255, 0.75)",
                      marginRight: 12,
                    }}
                  >
                    {m.icon}
                  </span>

                  <span
                    style={{
                      fontWeight: isActive ? "600" : "400",
                      color: isActive ? "#FFFBF5" : "rgba(255, 255, 255, 0.85)",
                    }}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={S.sidebarFooter}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={S.sidebarAvatar}>{userInitial}</div>

              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#202124",
                  }}
                >
                  {profile?.name || user?.username}
                </div>
                <div style={{ fontSize: 12, color: "#5f6368" }}>
                  Căn hộ: {profile?.apartment_number || "---"}
                </div>
              </div>
            </div>

            <div
              style={{
                ...S.logoutBtn,
                display: "flex",
                alignItems: "center",
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

        <div className="main-content" style={S.main}>
          <div className="top-header" style={S.topHeader}>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: "600",
                color: "#202124",
              }}
            >
              {menuItems.find((m) => m.key === view)?.label}
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <NotificationBell />
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#202124",
                  }}
                >
                  {profile?.name || user?.username}
                </div>
                <div style={{ fontSize: 12, color: "#5f6368" }}>
                  {profile?.apartment_number || "Cư dân"}
                </div>
              </div>

              <div style={S.avatar}>{userInitial}</div>
            </div>
          </div>

          {msg.text && (
            <div
              style={{
                ...S.toast,
                backgroundColor: msg.type === "success" ? "#dcfce7" : "#fee2e2",
                color: msg.type === "success" ? "#166534" : "#991b1b",
              }}
            >
              {msg.type === "success" ? "✅" : "❌"} {msg.text}
            </div>
          )}

          <div style={S.content}>
            {view === "overview" && renderOverview()}

            {view === "vehicles" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <h3 style={{ margin: 0, color: "#0f172a" }}>
                    Danh sách xe đã đăng ký
                  </h3>

                  <button
                    onClick={() => {
                      setIsEditingVehicle(false);
                      setNewVehicle({
                        plate_number: "",
                        type_id: vehicleTypes[0]?.type_id || 1,
                        color: "",
                      });
                      setShowVehicleForm(!showVehicleForm);
                    }}
                    style={S.primaryBtn}
                  >
                    + Đăng ký xe mới
                  </button>
                </div>

                {showVehicleForm && (
                  <div style={S.formCard}>
                    <h4 style={{ margin: "0 0 16px", color: "#0f172a" }}>
                      {isEditingVehicle ? "Cập nhật xe" : "Đăng ký xe mới"}
                    </h4>

                    <div style={S.formRow}>
                      <div style={S.formGroup}>
                        <label style={S.label}>Chủ sở hữu</label>
                        <input
                          style={{ ...S.input, backgroundColor: "#e2e8f0" }}
                          value={profile?.name || ""}
                          readOnly
                        />
                      </div>

                      <div style={S.formGroup}>
                        <label style={S.label}>Số căn hộ</label>
                        <input
                          style={{ ...S.input, backgroundColor: "#e2e8f0" }}
                          value={profile?.apartment_number || ""}
                          readOnly
                        />
                      </div>
                    </div>

                    <div style={{ ...S.formRow, marginTop: 12 }}>
                      <div style={S.formGroup}>
                        <label style={S.label}>Biển số xe *</label>
                        <input
                          style={S.input}
                          value={newVehicle.plate_number}
                          placeholder="VD: 29A-12345"
                          onChange={(e) =>
                            setNewVehicle({
                              ...newVehicle,
                              plate_number: e.target.value.toUpperCase(),
                            })
                          }
                        />
                      </div>

                      <div style={S.formGroup}>
                        <label style={S.label}>Loại xe *</label>
                        <select
                          style={S.input}
                          value={newVehicle.type_id}
                          onChange={(e) =>
                            setNewVehicle({
                              ...newVehicle,
                              type_id: parseInt(e.target.value),
                            })
                          }
                        >
                          {vehicleTypes.map((vt) => (
                            <option key={vt.type_id} value={vt.type_id}>
                              {vt.type_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={S.formGroup}>
                        <label style={S.label}>Màu xe</label>
                        <input
                          style={S.input}
                          value={newVehicle.color}
                          placeholder="VD: Đỏ"
                          onChange={(e) =>
                            setNewVehicle({
                              ...newVehicle,
                              color: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                      <button onClick={handleRegisterVehicle} style={S.primaryBtn}>
                        {isEditingVehicle ? "Cập nhật" : "Đăng ký"}
                      </button>

                      <button
                        onClick={() => {
                          setShowVehicleForm(false);
                          setIsEditingVehicle(false);
                        }}
                        style={S.cancelBtn}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                {vehicles.length === 0 ? (
                  <div style={S.empty}>
                    Bạn chưa đăng ký xe nào. Hãy nhấn "Đăng ký xe mới" để bắt đầu.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
                    {vehicles.map((v) => (
                      <div
                        key={v.plate_number}
                        style={{
                          ...S.vehicleCard,
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: 16,
                          margin: 0,
                        }}
                      >
                        {/* Vehicle illustration backdrop */}
                        <div style={{
                          height: 120,
                          backgroundColor: "#FAF8F5",
                          borderRadius: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 54,
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.02)"
                        }}>
                          {v.type_name === "Ô tô" ? (
                            <span className="material-symbols-rounded" style={{ fontSize: 64, color: "#3F5E4D" }}>directions_car</span>
                          ) : (
                            <span className="material-symbols-rounded" style={{ fontSize: 64, color: "#9E826C" }}>motorcycle</span>
                          )}
                        </div>

                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: "800",
                              color: "#2D3327",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {v.plate_number}
                          </div>

                          <div
                            style={{
                              fontSize: 13,
                              color: "#64748b",
                              fontWeight: "600",
                            }}
                          >
                            Căn hộ: {profile?.apartment_number || "---"} · {v.type_name} · {v.color || "---"}
                          </div>

                          <div style={{ marginTop: 4, fontSize: 13, display: "flex", flexDirection: "column", gap: 2 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ color: "#64748b", fontWeight: "500" }}>Trạng thái xe:</span>
                              {v.status === "active" ? (
                                <span style={{ color: "#3F5E4D", fontWeight: "700", display: "flex", alignItems: "center", gap: 4 }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>check_circle</span> Đã duyệt</span>
                              ) : v.status === "rejected" ? (
                                <span style={{ color: "#991b1b", fontWeight: "700", display: "flex", alignItems: "center", gap: 4 }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>cancel</span> Bị từ chối</span>
                              ) : (
                                <span style={{ color: "#d97706", fontWeight: "700", display: "flex", alignItems: "center", gap: 4 }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>pending</span> Chờ duyệt</span>
                              )}
                            </div>
                            {v.status === "rejected" && v.rejection_reason && (
                              <div style={{ fontSize: 11, color: '#991b1b', fontWeight: '500', fontStyle: 'italic', paddingLeft: 84 }}>
                                Lý do: {v.rejection_reason}
                              </div>
                            )}
                          </div>

                          <div style={{ marginTop: 4, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "#64748b", fontWeight: "500" }}>Vé tháng:</span>
                            {v.monthly_status === "active" ? (
                              <span style={{ color: "#3F5E4D", fontWeight: "700", display: "flex", alignItems: "center", gap: 4 }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>check_circle</span> Đang hoạt động</span>
                            ) : v.monthly_status === "pending" ? (
                              <span style={{ color: "#d97706", fontWeight: "700", display: "flex", alignItems: "center", gap: 4 }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>pending</span> Chờ duyệt</span>
                            ) : v.monthly_status === "expired" ? (
                              <span style={{ color: "#ef4444", fontWeight: "700", display: "flex", alignItems: "center", gap: 4 }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>cancel</span> Đã hết hạn</span>
                            ) : (
                              <span style={{ color: "#64748b", fontWeight: "600", display: "flex", alignItems: "center", gap: 4 }}>Chưa đăng ký</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          {v.monthly_status === "active" ? (
                            <button
                              disabled
                              style={{ ...S.smallBtn, background: "#cbd5e1", color: "#64748b", cursor: "not-allowed", flex: 1 }}
                            >
                              Đã có vé
                            </button>
                          ) : v.monthly_status === "pending" ? (
                            <button
                              disabled
                              style={{
                                ...S.smallBtn,
                                background: "#FEF3C7",
                                color: "#92400e",
                                cursor: "not-allowed",
                                flex: 1
                              }}
                            >
                              Chờ duyệt vé
                            </button>
                          ) : (
                            <button
                              onClick={() => setRenewVehicle(v)}
                              disabled={v.status !== "active"}
                              style={{
                                ...S.smallBtn,
                                backgroundColor: v.status !== "active" ? "#cbd5e1" : "#3F5E4D",
                                color: "#FFFBF5",
                                opacity: v.status !== "active" ? 0.5 : 1,
                                cursor: v.status !== "active" ? "not-allowed" : "pointer",
                                flex: 1
                              }}
                              title={v.status !== "active" ? "Cần được Admin duyệt xe trước khi đăng ký vé tháng" : ""}
                            >
                              Đăng ký vé
                            </button>
                          )}

                          <button
                            onClick={() => openEditForm(v)}
                            style={{
                              ...S.smallBtn,
                              background: "#F1ECE4",
                              color: "#5F504B",
                              border: "1px solid #E4DDD3",
                            }}
                          >
                            Sửa
                          </button>

                          <button
                            onClick={() => handleDeleteVehicle(v.plate_number)}
                            style={{
                              ...S.smallBtn,
                              background: "#FEE2E2",
                              color: "#CD5C5C",
                              border: "1px solid #FCA5A5",
                            }}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === "monthly" && (
              <div>
                <h3 style={{ margin: "0 0 20px", color: "#2D3327", fontWeight: "800" }}>
                  Đăng ký gửi xe theo tháng
                </h3>

                <div style={S.infoBox}>
                  <p style={{ margin: 0, color: "#1E3A8A" }}>
                    Chọn một xe đã được duyệt để đăng ký hoặc gia hạn vé tháng. Sau khi gửi yêu cầu, 
                    Ban quản lý sẽ duyệt vé và bạn sẽ được gửi xe không giới hạn hàng ngày.
                  </p>
                </div>

                {vehicles.length === 0 ? (
                  <div style={S.empty}>Bạn chưa có xe nào. Hãy đăng ký xe trước.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
                    {vehicles.map((v) => (
                      <div
                        key={v.plate_number}
                        style={{
                          ...S.vehicleCard,
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: 16,
                          margin: 0,
                        }}
                      >
                        {/* Vehicle illustration backdrop */}
                        <div style={{
                          height: 120,
                          backgroundColor: "#FAF8F5",
                          borderRadius: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 54,
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.02)"
                        }}>
                          {v.type_name === "Ô tô" ? (
                            <span className="material-symbols-rounded" style={{ fontSize: 64, color: "#3F5E4D" }}>directions_car</span>
                          ) : (
                            <span className="material-symbols-rounded" style={{ fontSize: 64, color: "#9E826C" }}>motorcycle</span>
                          )}
                        </div>

                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: "800",
                              color: "#2D3327",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {v.plate_number}
                          </div>

                          <div
                            style={{
                              fontSize: 13,
                              color: "#64748b",
                              fontWeight: "600",
                            }}
                          >
                            Căn hộ: {profile?.apartment_number || "---"} · {v.type_name} · {v.color || "---"}
                          </div>

                          <div style={{ marginTop: 4, fontSize: 13, display: "flex", flexDirection: "column", gap: 2 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ color: "#64748b", fontWeight: "500" }}>Trạng thái xe:</span>
                              {v.status === "active" ? (
                                <span style={{ color: "#3F5E4D", fontWeight: "700", display: "flex", alignItems: "center", gap: 4 }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>check_circle</span> Đã duyệt</span>
                              ) : v.status === "rejected" ? (
                                <span style={{ color: "#991b1b", fontWeight: "700", display: "flex", alignItems: "center", gap: 4 }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>cancel</span> Bị từ chối</span>
                              ) : (
                                <span style={{ color: "#d97706", fontWeight: "700", display: "flex", alignItems: "center", gap: 4 }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>pending</span> Chờ duyệt</span>
                              )}
                            </div>
                            {v.status === "rejected" && v.rejection_reason && (
                              <div style={{ fontSize: 11, color: '#991b1b', fontWeight: '500', fontStyle: 'italic', paddingLeft: 84 }}>
                                Lý do: {v.rejection_reason}
                              </div>
                            )}
                          </div>

                          {v.monthly_status === "active" && (
                            <div
                              style={{
                                marginTop: 6,
                                padding: "8px 12px",
                                backgroundColor: "#EFF6FF",
                                borderRadius: 8,
                                fontSize: 12,
                                color: "#1E3A8A",
                                fontWeight: "700",
                                display: "inline-block",
                                border: "1px solid #BFDBFE",
                              }}
                            >
                              📅 Vé tháng: {new Date(v.start_date).toLocaleDateString("vi-VN")} → {new Date(v.end_date).toLocaleDateString("vi-VN")}
                            </div>
                          )}

                          {v.monthly_status === "pending" && (
                            <div
                              style={{
                                marginTop: 6,
                                padding: "8px 12px",
                                backgroundColor: "#FEF3C7",
                                borderRadius: 8,
                                fontSize: 12,
                                color: "#92400e",
                                fontWeight: "700",
                                display: "inline-block",
                                border: "1px solid #FDE68A",
                              }}
                            >
                              ⏳ Đang chờ duyệt vé tháng
                            </div>
                          )}

                          {(v.monthly_status === "expired" || v.monthly_status === "canceled") && (
                            <div
                              style={{
                                marginTop: 6,
                                padding: "8px 12px",
                                backgroundColor: "#FEE2E2",
                                borderRadius: 8,
                                fontSize: 12,
                                color: "#CD5C5C",
                                fontWeight: "700",
                                display: "inline-block",
                                border: "1px solid #FCA5A5",
                              }}
                            >
                              🚫 Vé tháng đã hết hạn / bị hủy
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", marginTop: 8 }}>
                          {v.monthly_status === "active" && (
                            <button
                              onClick={() => setRenewVehicle(v)}
                              style={{
                                ...S.primaryBtn,
                                backgroundColor: "#3F5E4D",
                                color: "#FFFBF5",
                                cursor: "pointer",
                                width: "100%",
                                borderRadius: 10,
                                padding: "10px 16px",
                              }}
                            >
                              Gia hạn vé
                            </button>
                          )}

                          {v.monthly_status === "pending" && (
                            <button
                              disabled
                              style={{
                                ...S.primaryBtn,
                                backgroundColor: "#cbd5e1",
                                color: "#64748b",
                                cursor: "not-allowed",
                                width: "100%",
                                borderRadius: 10,
                                padding: "10px 16px",
                              }}
                            >
                              Đang chờ duyệt...
                            </button>
                          )}

                          {(v.monthly_status === "expired" || v.monthly_status === "canceled") && (
                            <button
                              onClick={() => setRenewVehicle(v)}
                              disabled={v.status !== "active"}
                              style={{
                                ...S.primaryBtn,
                                backgroundColor: v.status !== "active" ? "#cbd5e1" : "#CD5C5C",
                                cursor: v.status !== "active" ? "not-allowed" : "pointer",
                                width: "100%",
                                borderRadius: 10,
                                padding: "10px 16px",
                              }}
                            >
                              Gia hạn vé tháng mới
                            </button>
                          )}

                          {!v.monthly_status && (
                            <button
                              onClick={() => setRenewVehicle(v)}
                              disabled={v.status !== "active"}
                              style={{
                                ...S.primaryBtn,
                                backgroundColor: v.status !== "active" ? "#cbd5e1" : "#3F5E4D",
                                cursor: v.status !== "active" ? "not-allowed" : "pointer",
                                width: "100%",
                                borderRadius: 10,
                                padding: "10px 16px",
                              }}
                            >
                              Đăng ký vé tháng
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === "history" && (
              <div>
                <h3 style={{ margin: "0 0 20px", color: "#0f172a" }}>
                  Lịch sử gửi xe
                </h3>

                {history.length === 0 ? (
                  <div style={S.empty}>Chưa có lịch sử vào ra</div>
                ) : (
                  <div style={S.tableWrap}>
                    <div style={S.tHeader}>
                      <div style={S.tCell}>Biển số</div>
                      <div style={S.tCell}>Loại xe</div>
                      <div style={S.tCell}>Giờ vào</div>
                      <div style={S.tCell}>Giờ ra</div>
                      <div style={S.tCell}>Trạng thái</div>
                    </div>

                    <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                      {history.map((h) => (
                        <div key={h.session_id} style={S.tRow}>
                          <div style={{ ...S.tCell, fontWeight: "700" }}>
                            {h.plate_number}
                          </div>

                          <div style={S.tCell}>{h.type_name || "---"}</div>

                          <div style={S.tCell}>
                            {h.time_in
                              ? new Date(h.time_in).toLocaleString("vi-VN")
                              : "-"}
                          </div>

                          <div style={S.tCell}>
                            {h.time_out
                              ? new Date(h.time_out).toLocaleString("vi-VN")
                              : "-"}
                          </div>

                          <div style={S.tCell}>
                            {h.status === "parking" ? (
                              <span
                                style={{
                                  ...S.badge,
                                  background: "#dbeafe",
                                  color: "#1e40af",
                                }}
                              >
                                Đang gửi
                              </span>
                            ) : (
                              <span
                                style={{
                                  ...S.badge,
                                  background: "#dcfce7",
                                  color: "#166534",
                                }}
                              >
                                Đã ra
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {view === "fees" && (
              <div>
                <h3 style={{ margin: "0 0 20px", color: "#0f172a" }}>
                  Tra cứu phí & hóa đơn
                </h3>

                <div style={S.formCard}>
                  <h4 style={{ margin: "0 0 16px", color: "#0f172a" }}>
                    Bảng giá gửi xe
                  </h4>

                  <div style={S.tableWrap}>
                    <div style={S.tHeader}>
                      <div style={{ ...S.tCell, flex: 1.2 }}>Loại xe</div>
                      <div style={{ ...S.tCell, flex: 1.5 }}>Giá lượt ngày</div>
                      <div style={{ ...S.tCell, flex: 1.5 }}>Giá lượt đêm</div>
                      <div style={{ ...S.tCell, flex: 1.5 }}>Vé tháng</div>
                    </div>

                    {feesData.feeConfig.map((f) => (
                      <div key={f.type_id} style={S.tRow}>
                        <div style={{ ...S.tCell, flex: 1.2, fontWeight: "700" }}>
                          {f.type_name}
                        </div>

                        <div style={{ ...S.tCell, flex: 1.5 }}>
                          {parseFloat(f.day_block_price || 0).toLocaleString()} VNĐ / {f.block_hours}h
                        </div>

                        <div style={{ ...S.tCell, flex: 1.5 }}>
                          {parseFloat(f.night_block_price || 0).toLocaleString()} VNĐ / {f.block_hours}h
                        </div>

                        <div style={{ ...S.tCell, flex: 1.5 }}>
                          {parseFloat(f.monthly_fee || 0).toLocaleString()} VNĐ
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ ...S.formCard, marginTop: 20 }}>
                  <h4 style={{ margin: "0 0 16px", color: "#0f172a" }}>
                    Vé tháng của bạn
                  </h4>

                  {feesData.monthlyRegistrations.length === 0 ? (
                    <div style={S.empty}>Chưa có vé tháng nào</div>
                  ) : (
                    <div style={S.tableWrap}>
                      <div style={S.tHeader}>
                        <div style={S.tCell}>Biển số</div>
                        <div style={S.tCell}>Loại xe</div>
                        <div style={S.tCell}>Phí/tháng</div>
                        <div style={S.tCell}>Từ ngày</div>
                        <div style={S.tCell}>Đến ngày</div>
                        <div style={S.tCell}>Trạng thái</div>
                      </div>

                      <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                        {feesData.monthlyRegistrations.map((m) => (
                          <div key={m.monthly_id} style={S.tRow}>
                            <div style={{ ...S.tCell, fontWeight: "700" }}>
                              {m.plate_number}
                            </div>

                            <div style={S.tCell}>{m.type_name}</div>

                            <div style={S.tCell}>
                              {parseFloat(m.monthly_fee).toLocaleString()} VNĐ
                            </div>

                            <div style={S.tCell}>
                              {new Date(m.start_date).toLocaleDateString("vi-VN")}
                            </div>

                            <div style={S.tCell}>
                              {new Date(m.end_date).toLocaleDateString("vi-VN")}
                            </div>

                            <div style={S.tCell}>
                              {m.status === "active" ? (
                                <span
                                  style={{
                                    ...S.badge,
                                    background: "#dcfce7",
                                    color: "#166534",
                                  }}
                                >
                                  Hoạt động
                                </span>
                              ) : m.status === "pending" ? (
                                <span
                                  style={{
                                    ...S.badge,
                                    background: "#fef3c7",
                                    color: "#92400e",
                                  }}
                                >
                                  Chờ duyệt
                                </span>
                              ) : (
                                <span
                                  style={{
                                    ...S.badge,
                                    background: "#fee2e2",
                                    color: "#991b1b",
                                  }}
                                >
                                  Hết hạn
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === "profile" && (
              <div style={{ animation: "fadeIn 0.4s ease-out" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h3 style={{ margin: 0, color: "#2d3748", fontSize: "24px", fontWeight: "700" }}>
                    Thẻ Cư Dân Điện Tử
                  </h3>
                </div>

                {!profile ? (
                  <div style={S.empty}>Đang tải...</div>
                ) : editProfile ? (
                  <div style={{...S.formCard, background: "#FFFBF5", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "30px", boxShadow: "0 10px 25px rgba(0,0,0,0.02)"}}>
                    <h4 style={{ margin: "0 0 20px", color: "#3F5E4D", fontSize: "18px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>Cập nhật liên hệ</h4>
                    <div style={S.formRow}>
                      <div style={S.formGroup}>
                        <label style={{...S.label, color: "#64748b"}}>Họ tên (Mặc định)</label>
                        <input
                          style={{ ...S.input, backgroundColor: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed", border: "1px solid #e2e8f0" }}
                          value={profile.name}
                          readOnly
                        />
                      </div>

                      <div style={S.formGroup}>
                        <label style={{...S.label, color: "#64748b"}}>Căn hộ (Mặc định)</label>
                        <input
                          style={{ ...S.input, backgroundColor: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed", border: "1px solid #e2e8f0" }}
                          value={profile.apartment_number}
                          readOnly
                        />
                      </div>
                    </div>

                    <div style={{ ...S.formRow, marginTop: 20 }}>
                      <div style={S.formGroup}>
                        <label style={{...S.label, color: "#2d3748", fontWeight: "600"}}>Số điện thoại mới</label>
                        <input
                          style={{...S.input, border: "2px solid #e2e8f0", transition: "all 0.3s"}}
                          value={editProfile.phone}
                          onChange={(e) =>
                            setEditProfile({
                              ...editProfile,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Nhập số điện thoại..."
                        />
                      </div>

                      <div style={S.formGroup}>
                        <label style={{...S.label, color: "#2d3748", fontWeight: "600"}}>Email mới</label>
                        <input
                          style={{...S.input, border: "2px solid #e2e8f0", transition: "all 0.3s"}}
                          value={editProfile.email}
                          onChange={(e) =>
                            setEditProfile({
                              ...editProfile,
                              email: e.target.value,
                            })
                          }
                          placeholder="Nhập email..."
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
                      <button onClick={handleUpdateProfile} style={{...S.primaryBtn, background: "#3F5E4D", color: "#FFFBF5", padding: "12px 24px", borderRadius: "12px", fontWeight: "600", border: "none", cursor: "pointer"}}>
                        <span style={{marginRight: 8}}>💾</span> Lưu thay đổi
                      </button>

                      <button
                        onClick={() => window.history.back()}
                        style={{...S.cancelBtn, background: "#f1f5f9", color: "#475569", padding: "12px 24px", borderRadius: "12px", fontWeight: "600", border: "none", cursor: "pointer"}}
                      >
                        Hủy bỏ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                    {/* Left Column: ID Card */}
                    <div style={{ background: "linear-gradient(135deg, #3F5E4D 0%, #2a4034 100%)", borderRadius: "24px", padding: "30px", color: "#FFFBF5", position: "relative", overflow: "hidden", boxShadow: "0 20px 40px rgba(63, 94, 77, 0.2)" }}>
                      <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: "rgba(255, 255, 255, 0.05)", borderRadius: "50%" }}></div>
                      <div style={{ position: "absolute", bottom: -30, left: -30, width: 100, height: 100, background: "rgba(255, 255, 255, 0.05)", borderRadius: "50%" }}></div>
                      
                      <div style={{ display: "flex", alignItems: "center", marginBottom: "30px", position: "relative", zIndex: 1 }}>
                        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#FFFBF5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", boxShadow: "0 10px 20px rgba(0,0,0,0.1)", border: "4px solid rgba(255, 255, 255, 0.2)", color: "#3F5E4D" }}>
                          👤
                        </div>
                        <div style={{ marginLeft: "20px" }}>
                          <div style={{ fontSize: "14px", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Cư Dân</div>
                          <div style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "0.5px" }}>{profile.name}</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", position: "relative", zIndex: 1, background: "rgba(255, 255, 255, 0.1)", padding: "20px", borderRadius: "16px", backdropFilter: "blur(10px)" }}>
                        <div>
                          <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>MÃ CĂN HỘ</div>
                          <div style={{ fontSize: "18px", fontWeight: "600" }}>{profile.apartment_number}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}>TRẠNG THÁI</div>
                          <div style={{ fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 10px #4ade80" }}></span>
                            {profile.status === "active" ? "Hoạt động" : profile.status}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Contact Details */}
                    <div style={{ background: "#FFFBF5", borderRadius: "24px", padding: "30px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                      <div>
                        <h4 style={{ margin: "0 0 24px 0", color: "#2d3748", fontSize: "18px", borderBottom: "2px solid #f1f5f9", paddingBottom: "12px" }}>Chi tiết liên hệ</h4>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                              <span className="material-symbols-rounded" style={{ color: "#3b82f6" }}>smartphone</span>
                            </div>
                            <div>
                              <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "2px" }}>Số điện thoại</div>
                              <div style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a" }}>{profile.phone || "Chưa cập nhật"}</div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                              <span className="material-symbols-rounded" style={{ color: "#10b981" }}>mail</span>
                            </div>
                            <div>
                              <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "2px" }}>Địa chỉ Email</div>
                              <div style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", wordBreak: "break-all" }}>{profile.email || "Chưa cập nhật"}</div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                              <span className="material-symbols-rounded" style={{ color: "#f59e0b" }}>key</span>
                            </div>
                            <div>
                              <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "2px" }}>Tên đăng nhập (Username)</div>
                              <div style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a" }}>{profile.username}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: "30px" }}>
                        <button
                          onClick={() => {
                            window.history.pushState({ editProfile: true }, "");
                            setEditProfile({
                              name: profile.name,
                              phone: profile.phone || "",
                              email: profile.email || "",
                            });
                          }}
                          style={{
                            ...S.primaryBtn,
                            width: "100%",
                            background: "#e2e8f0",
                            color: "#3F5E4D",
                            border: "none",
                            borderRadius: "12px",
                            padding: "14px",
                            fontWeight: "700",
                            fontSize: "15px",
                            cursor: "pointer",
                            transition: "all 0.3s",
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = "#cbd5e1" }}
                          onMouseOut={(e) => { e.currentTarget.style.background = "#e2e8f0" }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>edit</span> Cập nhật thông tin
                        </button>
                        <button
                          onClick={() => setShowAccountSettings(true)}
                          style={{
                            ...S.primaryBtn,
                            width: "100%",
                            background: "#f1f5f9",
                            color: "#475569",
                            border: "none",
                            borderRadius: "12px",
                            padding: "14px",
                            fontWeight: "700",
                            fontSize: "15px",
                            cursor: "pointer",
                            transition: "all 0.3s",
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = "#e2e8f0" }}
                          onMouseOut={(e) => { e.currentTarget.style.background = "#f1f5f9" }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>manage_accounts</span> Đổi Mật khẩu / Tên đăng nhập
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAccountSettings && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowAccountSettings(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFBF5",
              borderRadius: 16,
              width: 500,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              fontFamily: "'Outfit', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "24px 32px",
                borderBottom: "1px solid #EAE5D9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 20, color: "#202124" }}>
                Cài đặt tài khoản
              </h3>
              <span
                className="material-symbols-rounded"
                style={{ cursor: "pointer", color: "#5f6368" }}
                onClick={() => setShowAccountSettings(false)}
              >
                close
              </span>
            </div>

            <div style={{ padding: "32px" }}>
              <form onSubmit={handleChangeAccount}>
                <div style={S.formGroup}>
                  <label style={S.label}>Mật khẩu hiện tại (*)</label>
                  <input
                    type="password"
                    style={S.input}
                    value={accountForm.currentPassword}
                    onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                    required
                  />
                </div>
                
                <div style={{ padding: 16, backgroundColor: '#f1f5f9', borderRadius: 8, marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
                    Chỉ điền vào các ô bên dưới nếu bạn muốn thay đổi. Nếu để trống, thông tin đó sẽ được giữ nguyên.
                  </p>
                </div>

                <div style={S.formGroup}>
                  <label style={S.label}>Tên đăng nhập mới (Tùy chọn)</label>
                  <input
                    style={S.input}
                    placeholder={profile?.username}
                    value={accountForm.newUsername}
                    onChange={(e) => setAccountForm({ ...accountForm, newUsername: e.target.value })}
                  />
                </div>

                <div style={S.formGroup}>
                  <label style={S.label}>Mật khẩu mới (Tùy chọn)</label>
                  <input
                    type="password"
                    style={S.input}
                    value={accountForm.newPassword}
                    onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                  />
                </div>

                <div style={S.formGroup}>
                  <label style={S.label}>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    style={S.input}
                    value={accountForm.confirmPassword}
                    onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button type="submit" style={S.primaryBtn}>Lưu thay đổi</button>
                  <button type="button" onClick={() => setShowAccountSettings(false)} style={{...S.cancelBtn, backgroundColor: '#f1f5f9', border: 'none'}}>Hủy</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {renewVehicle && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setRenewVehicle(null)}
        >
          <div
            style={{
              backgroundColor: "#FFFBF5",
              borderRadius: 16,
              width: 500,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              fontFamily: "'Outfit', sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: "#3F5E4D",
                padding: "20px 24px",
                borderRadius: "16px 16px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: "600" }}>
                {renewVehicle.monthly_status ? "📑 GIA HẠN VÉ GỬI XE THÁNG" : "📑 ĐĂNG KÝ VÉ GỬI XE THÁNG"}
              </h3>
              <button
                onClick={() => setRenewVehicle(null)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24 }}>
              <div
                style={{
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#5f6368",
                  letterSpacing: 1,
                  marginBottom: 20,
                  textTransform: "uppercase",
                  borderBottom: "2px dashed #e2e8f0",
                  paddingBottom: 16,
                }}
              >
                {renewVehicle.monthly_status ? "BIỂU MẪU GIA HẠN GỬI XE CD_BM2" : "BIỂU MẪU ĐĂNG KÝ GỬI XE CD_BM1"}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Biển số xe</div>
                  <div style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>{renewVehicle.plate_number}</div>
                </div>

                <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Loại xe</div>
                  <div style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>{renewVehicle.type_name}</div>
                </div>

                <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Căn hộ</div>
                  <div style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>{profile?.apartment_number || "---"}</div>
                </div>

                <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 }}>Phí gửi tháng</div>
                  <div style={{ fontSize: 14, fontWeight: "700", color: "#2563eb" }}>
                    {getVehicleMonthlyFee(renewVehicle.type_id).toLocaleString()} VNĐ
                  </div>
                </div>
              </div>

              {/* Date calculation info */}
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#eff6ff",
                  borderLeft: "4px solid #3b82f6",
                  color: "#1e3a8a",
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 20,
                  lineHeight: "18px",
                }}
              >
                📅 <strong>Thời hạn mới dự kiến:</strong><br />
                {renewVehicle.monthly_status === "active" ? (
                  <>
                    Nối tiếp thời gian hết hạn hiện tại:<br />
                    <strong>
                      {(() => {
                        const activeEnd = new Date(renewVehicle.end_date);
                        const nextStart = new Date(activeEnd);
                        nextStart.setDate(activeEnd.getDate() + 1);
                        const nextEnd = new Date(nextStart);
                        nextEnd.setMonth(nextStart.getMonth() + 1);
                        return `${nextStart.toLocaleDateString("vi-VN")} → ${nextEnd.toLocaleDateString("vi-VN")}`;
                      })()}
                    </strong>
                  </>
                ) : (
                  <>
                    Tính từ ngày hiện tại:<br />
                    <strong>
                      {(() => {
                        const nextStart = new Date();
                        const nextEnd = new Date(nextStart);
                        nextEnd.setMonth(nextStart.getMonth() + 1);
                        return `${nextStart.toLocaleDateString("vi-VN")} → ${nextEnd.toLocaleDateString("vi-VN")}`;
                      })()}
                    </strong>
                  </>
                )}
              </div>

              {/* Payment Instructions */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fef3c7",
                  border: "1px solid #fde68a",
                  borderRadius: 12,
                  fontSize: 13,
                  color: "#78350f",
                  lineHeight: "20px",
                  marginBottom: 20,
                }}
              >
                <strong style={{ fontSize: 14, color: "#92400e", display: "block", marginBottom: 8 }}>
                  🏦 HƯỚNG DẪN CHUYỂN KHOẢN THANH TOÁN:
                </strong>
                • <strong>Ngân hàng:</strong> BIDV (Ngân hàng TMCP Đầu tư và Phát triển VN)<br />
                • <strong>Số tài khoản:</strong> <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: 14 }}>1234567890</span><br />
                • <strong>Tên tài khoản:</strong> BAN QUAN LY CHUNG CU PARKING SYSTEM<br />
                • <strong>Số tiền:</strong> <span style={{ fontWeight: "700", color: "#b45309" }}>{getVehicleMonthlyFee(renewVehicle.type_id).toLocaleString()} VNĐ</span><br />
                • <strong>Nội dung chuyển khoản:</strong> <span style={{ fontFamily: "monospace", backgroundColor: "#fffbeb", padding: "2px 6px", border: "1px solid #fcd34d", borderRadius: 4, fontWeight: "700" }}>{renewVehicle.plate_number} {renewVehicle.monthly_status ? "GIA HAN VE THANG" : "DANG KY VE THANG"}</span>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  textAlign: "center",
                  marginBottom: 20,
                  fontStyle: "italic",
                }}
              >
                * Sau khi chuyển khoản thành công, hãy bấm nút Xác nhận bên dưới để gửi yêu cầu đến Ban Quản Lý đối soát.
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => {
                    if (renewVehicle.monthly_status) {
                      handleRenewMonthly(renewVehicle.plate_number);
                    } else {
                      handleRegisterMonthly(renewVehicle.plate_number);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    backgroundColor: "#3F5E4D",
                    color: "#FFFBF5",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2e4639"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#3F5E4D"}
                >
                  ✅ Tôi đã chuyển khoản, Gửi yêu cầu
                </button>
                <button
                  onClick={() => setRenewVehicle(null)}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showMapModal && renderMapModal()}
      {vehicleToDelete && (
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
              <span className="material-symbols-rounded" style={{ fontSize: 32 }}>delete</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", color: "#2D3327", fontSize: 18, fontWeight: "800" }}>XÓA PHƯƠNG TIỆN</h3>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 14, lineHeight: "20px" }}>
              Bạn có chắc chắn muốn xóa phương tiện biển số <strong>{vehicleToDelete}</strong> khỏi tài khoản của mình?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={executeDeleteVehicle}
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
                Xác nhận xóa
              </button>
              <button
                onClick={() => setVehicleToDelete(null)}
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

const S = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Outfit', -apple-system, sans-serif",
    backgroundColor: "#FAF8F5", // Warm Cream
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
  logoIcon: {
    width: 38,
    height: 38,
    backgroundColor: "#FFFBF5",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#3F5E4D",
    fontSize: 20,
    fontWeight: "800",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  menuLabel: {
    padding: "16px 20px 8px",
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFBF5",
    opacity: 0.65,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
  },
  menuItem: {
    padding: "12px 20px",
    color: "#FFFBF5",
    opacity: 0.85,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "500",
    borderRadius: 12,
    transition: "all 0.2s ease-in-out",
    margin: "0 12px 4px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  menuActive: {
    backgroundColor: "#3F5E4D", // Forest Green
    color: "#FFFBF5",
    fontWeight: "600",
    opacity: 1,
    boxShadow: "0 4px 16px rgba(63, 94, 77, 0.25)",
  },
  menuHover: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  sidebarAvatar: {
    width: 36,
    height: 36,
    backgroundColor: "#FFFBF5",
    color: "#9E826C",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 0,
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  logoutBtn: {
    fontSize: 13,
    color: "#FFD1D1",
    cursor: "pointer",
    fontWeight: "600",
    paddingTop: 4,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
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
  avatar: {
    width: 36,
    height: 36,
    backgroundColor: "#3F5E4D",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFBF5",
    boxShadow: "0 4px 10px rgba(63, 94, 77, 0.15)",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  toast: {
    padding: "12px 20px",
    borderRadius: 12,
    margin: "0 24px 20px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  formCard: {
    backgroundColor: "#FFFBF5",
    borderRadius: 20,
    padding: 24,
    border: "1px solid rgba(139, 115, 85, 0.08)",
    boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)",
    marginBottom: 24,
  },
  formRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  formGroup: {
    flex: 1,
    minWidth: 200,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "2px solid #EAE5D9",
    borderRadius: 10,
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    backgroundColor: "#FFFBF5",
    color: "#2D3327",
    fontFamily: "'Outfit', sans-serif",
    transition: "all 0.2s",
  },
  primaryBtn: {
    padding: "10px 20px",
    backgroundColor: "#3F5E4D", // Forest Green
    color: "#FFFBF5",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(63, 94, 77, 0.15)",
    transition: "all 0.2s",
  },
  cancelBtn: {
    padding: "10px 20px",
    backgroundColor: "#F1ECE4",
    color: "#5F504B",
    border: "1px solid #E4DDD3",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  smallBtn: {
    padding: "6px 12px",
    backgroundColor: "#3F5E4D",
    color: "#FFFBF5",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "600",
    cursor: "pointer",
  },
  tableWrap: {
    borderRadius: 20,
    overflow: "hidden",
    border: "1px solid rgba(139, 115, 85, 0.08)",
    boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)",
  },
  tHeader: {
    display: "flex",
    backgroundColor: "#EAE5D9", // Warm light grey beige
    color: "#2D3327",
    padding: "16px 20px",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  tRow: {
    display: "flex",
    padding: "16px 20px",
    borderBottom: "1px solid #F1ECE4",
    fontSize: 14,
    color: "#2D3327",
    backgroundColor: "#FFFBF5",
    alignItems: "center",
  },
  tCell: {
    flex: 1,
    wordBreak: "break-word",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "700",
  },
  empty: {
    padding: 48,
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
    backgroundColor: "#FFFBF5",
    borderRadius: 20,
    border: "1px solid rgba(139, 115, 85, 0.08)",
    boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)",
  },
  infoBox: {
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #BFDBFE",
    color: "#1E3A8A",
    marginBottom: 20,
    fontSize: 14,
    lineHeight: "20px",
  },
  vehicleCard: {
    display: "flex",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFBF5",
    borderRadius: 20,
    border: "1px solid rgba(139, 115, 85, 0.08)",
    marginBottom: 16,
    boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)",
  },
};

export default ResidentDashboard;
