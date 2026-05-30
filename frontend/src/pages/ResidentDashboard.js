import React, { useState, useEffect } from "react";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";

const ResidentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState("vehicles");
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
      setVehicleTypes(r.data);

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
    if (view === "vehicles" || view === "monthly") {
      fetchVehicles();
    }

    if (view === "history") {
      fetchHistory();
    }

    if (view === "fees") {
      fetchFees();
    }

    if (view === "profile") {
      fetchProfile();
    }

    // Đóng sidebar trên mobile khi chuyển view
    setIsMobileOpen(false);
  }, [view]);

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

  const handleDeleteVehicle = async (plate) => {
    if (!window.confirm(`Bạn có chắc muốn xóa xe ${plate}?`)) return;

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
      fetchData();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Lỗi đăng ký vé tháng");
    }
  };

  const handleUpdateProfile = async () => {
    if (!editProfile) return;

    try {
      const r = await axios.put("/resident/profile", editProfile);

      showMsg("success", r.data.message);
      setEditProfile(null);
      fetchData();
    } catch (e) {
      showMsg("error", e.response?.data?.message || "Lỗi cập nhật");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
      logout();
      navigate("/login");
    }
  };

  const menuItems = [
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
                  onClick={() => setView(m.key)}
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
                      color: isActive ? "#1a73e8" : "#5f6368",
                      marginRight: 12,
                    }}
                  >
                    {m.icon}
                  </span>

                  <span
                    style={{
                      fontWeight: isActive ? "600" : "400",
                      color: isActive ? "#1a73e8" : "#3c4043",
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
                  <div style={S.tableWrap}>
                    <div style={S.tHeader}>
                      <div style={S.tCell}>Biển số</div>
                      <div style={S.tCell}>Căn hộ</div>
                      <div style={S.tCell}>Loại xe</div>
                      <div style={S.tCell}>Màu</div>
                      <div style={S.tCell}>Trạng thái xe</div>
                      <div style={S.tCell}>Vé tháng</div>
                      <div style={S.tCell}>Thao tác</div>
                    </div>

                    {vehicles.map((v) => (
                      <div key={v.plate_number} style={S.tRow}>
                        <div style={{ ...S.tCell, fontWeight: "700" }}>
                          {v.plate_number}
                        </div>

                        <div style={S.tCell}>
                          {profile?.apartment_number || "---"}
                        </div>

                        <div style={S.tCell}>{v.type_name}</div>

                        <div style={S.tCell}>{v.color || "---"}</div>

                        <div style={S.tCell}>
                          {v.status === "active" ? (
                            <span
                              style={{
                                ...S.badge,
                                background: "#dcfce7",
                                color: "#166534",
                              }}
                            >
                              Đã duyệt
                            </span>
                          ) : (
                            <span
                              style={{
                                ...S.badge,
                                background: "#fef3c7",
                                color: "#92400e",
                              }}
                            >
                              Chờ duyệt
                            </span>
                          )}
                        </div>

                        <div style={S.tCell}>
                          {v.monthly_status === "active" ? (
                            <span
                              style={{
                                ...S.badge,
                                background: "#dcfce7",
                                color: "#166534",
                              }}
                            >
                              Đang hoạt động
                            </span>
                          ) : v.monthly_status === "pending" ? (
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
                                background: "#f1f5f9",
                                color: "#64748b",
                              }}
                            >
                              Chưa đăng ký
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            ...S.tCell,
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          {v.monthly_status === "active" ? (
                            <button
                              disabled
                              style={{ ...S.smallBtn, background: "#94a3b8" }}
                            >
                              Đã đăng ký
                            </button>
                          ) : v.monthly_status === "pending" ? (
                            <button
                              disabled
                              style={{
                                ...S.smallBtn,
                                background: "#fbbf24",
                                color: "#92400e",
                              }}
                            >
                              Đang chờ duyệt
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRegisterMonthly(v.plate_number)}
                              disabled={v.status !== "active"}
                              style={{
                                ...S.smallBtn,
                                opacity: v.status !== "active" ? 0.5 : 1,
                                cursor:
                                  v.status !== "active"
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                              title={
                                v.status !== "active"
                                  ? "Cần được Admin duyệt xe trước khi đăng ký vé tháng"
                                  : ""
                              }
                            >
                              Đăng ký vé tháng
                            </button>
                          )}

                          <button
                            onClick={() => openEditForm(v)}
                            style={{
                              ...S.smallBtn,
                              background: "#e2e8f0",
                              color: "#1e293b",
                            }}
                          >
                            Sửa
                          </button>

                          <button
                            onClick={() => handleDeleteVehicle(v.plate_number)}
                            style={{
                              ...S.smallBtn,
                              background: "#fee2e2",
                              color: "#ef4444",
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
                <h3 style={{ margin: "0 0 20px", color: "#0f172a" }}>
                  Đăng ký gửi xe theo tháng
                </h3>

                <div style={S.infoBox}>
                  <p style={{ margin: 0, color: "#475569" }}>
                    Chọn một xe chưa đăng ký vé tháng để đăng ký. Sau khi đăng ký,
                    Admin sẽ duyệt và bạn sẽ được miễn phí gửi xe hàng ngày.
                  </p>
                </div>

                {vehicles.length === 0 ? (
                  <div style={S.empty}>Bạn chưa có xe nào. Hãy đăng ký xe trước.</div>
                ) : (
                  vehicles.map((v) => (
                    <div key={v.plate_number} style={S.vehicleCard}>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            color: "#0f172a",
                          }}
                        >
                          {v.plate_number}
                        </div>

                        <div
                          style={{
                            fontSize: 14,
                            color: "#64748b",
                            marginTop: 4,
                          }}
                        >
                          Căn hộ: {profile?.apartment_number || "---"} ·{" "}
                          {v.type_name} · {v.color || "---"}
                        </div>

                        <div style={{ marginTop: 6, fontSize: 13 }}>
                          Trạng thái xe:{" "}
                          {v.status === "active" ? (
                            <span
                              style={{
                                color: "#059669",
                                fontWeight: "bold",
                              }}
                            >
                              ✅ Đã duyệt
                            </span>
                          ) : (
                            <span
                              style={{
                                color: "#d97706",
                                fontWeight: "bold",
                              }}
                            >
                              ⏳ Chờ duyệt
                            </span>
                          )}
                        </div>

                        {v.monthly_status === "active" && (
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 13,
                              color: "#059669",
                            }}
                          >
                            ✅ Vé tháng:{" "}
                            {new Date(v.start_date).toLocaleDateString("vi-VN")} →{" "}
                            {new Date(v.end_date).toLocaleDateString("vi-VN")}
                          </div>
                        )}

                        {v.monthly_status === "pending" && (
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 13,
                              color: "#d97706",
                            }}
                          >
                            ⏳ Đang chờ duyệt
                          </div>
                        )}
                      </div>

                      {(!v.monthly_status ||
                        v.monthly_status === "expired" ||
                        v.monthly_status === "canceled") && (
                          <button
                            onClick={() => handleRegisterMonthly(v.plate_number)}
                            disabled={v.status !== "active"}
                            style={{
                              ...S.primaryBtn,
                              backgroundColor:
                                v.status !== "active" ? "#cbd5e1" : "#3b82f6",
                              cursor:
                                v.status !== "active" ? "not-allowed" : "pointer",
                            }}
                            title={
                              v.status !== "active"
                                ? "Cần được Admin duyệt xe trước khi đăng ký vé tháng"
                                : ""
                            }
                          >
                            Đăng ký vé tháng
                          </button>
                        )}
                    </div>
                  ))
                )}
              </div>
            )}

            {view === "history" && (
              <div>
                <h3 style={{ margin: "0 0 20px", color: "#0f172a" }}>
                  Lịch sử gửi xe
                </h3>

                {history.length === 0 ? (
                  <div style={S.empty}>Chưa có lịch sử gửi xe nào</div>
                ) : (
                  <div style={S.tableWrap}>
                    <div style={S.tHeader}>
                      <div style={S.tCell}>Biển số</div>
                      <div style={S.tCell}>Loại xe</div>
                      <div style={S.tCell}>Giờ vào</div>
                      <div style={S.tCell}>Giờ ra</div>
                      <div style={S.tCell}>Trạng thái</div>
                    </div>

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
                      <div style={S.tCell}>Loại xe</div>
                      <div style={S.tCell}>Giá/giờ</div>
                      <div style={S.tCell}>Vé tháng</div>
                    </div>

                    {feesData.feeConfig.map((f) => (
                      <div key={f.type_id} style={S.tRow}>
                        <div style={{ ...S.tCell, fontWeight: "700" }}>
                          {f.type_name}
                        </div>

                        <div style={S.tCell}>
                          {parseFloat(f.price_per_hour).toLocaleString()} VNĐ
                        </div>

                        <div style={S.tCell}>
                          {parseFloat(f.monthly_fee).toLocaleString()} VNĐ
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
                  )}
                </div>
              </div>
            )}

            {view === "profile" && (
              <div>
                <h3 style={{ margin: "0 0 20px", color: "#0f172a" }}>
                  Thông tin cá nhân
                </h3>

                {!profile ? (
                  <div style={S.empty}>Đang tải...</div>
                ) : editProfile ? (
                  <div style={S.formCard}>
                    <div style={S.formRow}>
                      <div style={S.formGroup}>
                        <label style={S.label}>Họ tên</label>
                        <input
                          style={{ ...S.input, backgroundColor: "#e2e8f0" }}
                          value={profile.name}
                          readOnly
                        />
                        <div
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            marginTop: 4,
                          }}
                        >
                          Liên hệ Admin để thay đổi
                        </div>
                      </div>

                      <div style={S.formGroup}>
                        <label style={S.label}>Căn hộ</label>
                        <input
                          style={{ ...S.input, backgroundColor: "#e2e8f0" }}
                          value={profile.apartment_number}
                          readOnly
                        />
                        <div
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            marginTop: 4,
                          }}
                        >
                          Liên hệ Admin để thay đổi
                        </div>
                      </div>
                    </div>

                    <div style={{ ...S.formRow, marginTop: 12 }}>
                      <div style={S.formGroup}>
                        <label style={S.label}>Số điện thoại</label>
                        <input
                          style={S.input}
                          value={editProfile.phone}
                          onChange={(e) =>
                            setEditProfile({
                              ...editProfile,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div style={S.formGroup}>
                        <label style={S.label}>Email</label>
                        <input
                          style={S.input}
                          value={editProfile.email}
                          onChange={(e) =>
                            setEditProfile({
                              ...editProfile,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                      <button onClick={handleUpdateProfile} style={S.primaryBtn}>
                        Lưu thay đổi
                      </button>

                      <button
                        onClick={() => setEditProfile(null)}
                        style={S.cancelBtn}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={S.formCard}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 20,
                      }}
                    >
                      <div>
                        <div style={S.label}>Họ tên</div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: "#0f172a",
                          }}
                        >
                          {profile.name}
                        </div>
                      </div>

                      <div>
                        <div style={S.label}>Căn hộ</div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: "#0f172a",
                          }}
                        >
                          {profile.apartment_number}
                        </div>
                      </div>

                      <div>
                        <div style={S.label}>Số điện thoại</div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: "#0f172a",
                          }}
                        >
                          {profile.phone || "---"}
                        </div>
                      </div>

                      <div>
                        <div style={S.label}>Email</div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: "#0f172a",
                          }}
                        >
                          {profile.email || "---"}
                        </div>
                      </div>

                      <div>
                        <div style={S.label}>Tài khoản</div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: "#0f172a",
                          }}
                        >
                          {profile.username}
                        </div>
                      </div>

                      <div>
                        <div style={S.label}>Trạng thái</div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: "#059669",
                          }}
                        >
                          ✅ {profile.status}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setEditProfile({
                          name: profile.name,
                          phone: profile.phone || "",
                          email: profile.email || "",
                        })
                      }
                      style={{
                        ...S.primaryBtn,
                        marginTop: 24,
                      }}
                    >
                      Chỉnh sửa thông tin
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const S = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', -apple-system, sans-serif",
    backgroundColor: "#f8f9fa",
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
    fontWeight: "700",
  },
  menuLabel: {
    padding: "4px 20px 8px",
    fontSize: 11,
    fontWeight: "700",
    color: "#5f6368",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  menuItem: {
    padding: "10px 20px",
    color: "#3c4043",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "500",
    borderRadius: 0,
    transition: "background 0.15s",
  },
  menuActive: {
    backgroundColor: "#e8f0fe",
    color: "#1a73e8",
    fontWeight: "600",
  },
  menuHover: {
    backgroundColor: "#f5f5f5",
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid #e0e0e0",
  },
  sidebarAvatar: {
    width: 36,
    height: 36,
    backgroundColor: "#e8f0fe",
    color: "#1a73e8",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 0,
  },
  logoutBtn: {
    fontSize: 13,
    color: "#d93025",
    cursor: "pointer",
    fontWeight: "500",
    paddingTop: 4,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
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
  avatar: {
    width: 36,
    height: 36,
    backgroundColor: "#e8f0fe",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#1a73e8",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  toast: {
    padding: "12px 20px",
    borderRadius: 8,
    margin: "0 24px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "2px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    backgroundColor: "#f8fafc",
  },
  primaryBtn: {
    padding: "10px 20px",
    backgroundColor: "#1a73e8",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "600",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "10px 20px",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "600",
    cursor: "pointer",
  },
  smallBtn: {
    padding: "6px 12px",
    backgroundColor: "#1a73e8",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "600",
    cursor: "pointer",
  },
  tableWrap: {
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  tHeader: {
    display: "flex",
    backgroundColor: "#0f172a",
    color: "#fff",
    padding: "14px 16px",
    fontSize: 13,
    fontWeight: "700",
  },
  tRow: {
    display: "flex",
    padding: "14px 16px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  tCell: {
    flex: 1,
    wordBreak: "break-word",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  empty: {
    padding: 48,
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
  },
  infoBox: {
    backgroundColor: "#eef2ff",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #c7d2fe",
    marginBottom: 20,
  },
  vehicleCard: {
    display: "flex",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    marginBottom: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
};

export default ResidentDashboard;
