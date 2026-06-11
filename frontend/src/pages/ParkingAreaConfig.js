import React, { useState, useEffect, useCallback } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";

const ParkingAreaConfig = () => {
  const { user } = useAuth();

  const [areas, setAreas]         = useState([]);
  const [areaEdits, setAreaEdits] = useState({});
  const [areaSaving, setAreaSaving] = useState({});
  const [areaMsg, setAreaMsg]     = useState({});
  const [loading, setLoading]     = useState(true);

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/parking/areas");
      setAreas(res.data || []);
      const edits = {};
      (res.data || []).forEach(a => {
        edits[a.area_id] = { area_name: a.area_name, capacity: a.capacity };
      });
      setAreaEdits(edits);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  const handleSave = async (area_id) => {
    const edit = areaEdits[area_id];
    const cap = parseInt(edit?.capacity);
    if (!edit?.area_name || isNaN(cap) || cap < 1) return;
    setAreaSaving(s => ({ ...s, [area_id]: true }));
    try {
      await axios.put(`/parking/areas/${area_id}`, {
        area_name: edit.area_name,
        capacity: cap
      });
      setAreaMsg(m => ({ ...m, [area_id]: "success" }));
      fetchAreas();
      setTimeout(() => setAreaMsg(m => ({ ...m, [area_id]: "" })), 2500);
    } catch {
      setAreaMsg(m => ({ ...m, [area_id]: "error" }));
      setTimeout(() => setAreaMsg(m => ({ ...m, [area_id]: "" })), 2500);
    } finally {
      setAreaSaving(s => ({ ...s, [area_id]: false }));
    }
  };

  const totalCapacity = areas.reduce((s, a) => s + (a.capacity || 0), 0);
  const totalOccupied = areas.reduce((s, a) => s + (a.current_count || 0), 0);
  const totalPct      = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#FAF8F5", fontFamily: "'Outfit', sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          height: 64, backgroundColor: "#FFFBF5",
          borderBottom: "1px solid rgba(139,115,85,0.1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", flexShrink: 0
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: "800", color: "#2D3327" }}>
            Cấu hình sức chứa bãi đỗ xe
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <NotificationBell />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: "700", color: "#2D3327" }}>{user?.username}</div>
              <div style={{ fontSize: 11, color: "#9E826C", fontWeight: "600" }}>Quản trị viên</div>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", backgroundColor: "#3F5E4D",
              color: "#FFFBF5", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>garage</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>

          {/* Tổng quan */}
          <div style={{
            backgroundColor: "#3F5E4D", borderRadius: 20, padding: "24px 32px",
            marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 10px 30px rgba(63,94,77,0.15)", position: "relative", overflow: "hidden"
          }}>
            <div style={{ position: "absolute", top: "-40%", left: "-10%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px", color: "#FFF2E1", opacity: 0.8, marginBottom: 6 }}>
                TỔNG SỨC CHỨA TOÀN BÃI
              </div>
              <div style={{ fontSize: 32, fontWeight: "800", color: "#FFFBF5" }}>
                {totalOccupied.toLocaleString("vi-VN")}
                <span style={{ fontSize: 16, fontWeight: "600", opacity: 0.7 }}> / {totalCapacity.toLocaleString("vi-VN")} xe</span>
              </div>
              <div style={{ marginTop: 12, height: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 4, width: 280, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(100, totalPct)}%`,
                  backgroundColor: totalPct >= 90 ? "#CD5C5C" : totalPct >= 70 ? "#f59e0b" : "#6EE7B7",
                  borderRadius: 4, transition: "width 0.5s"
                }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: "#FFF2E1", opacity: 0.85, fontWeight: "600" }}>
                {totalPct}% lấp đầy toàn bộ hệ thống
              </div>
            </div>
            <span className="material-symbols-rounded" style={{ fontSize: 72, color: "rgba(255,255,255,0.06)", position: "relative", zIndex: 1 }}>garage</span>
          </div>

          {/* Từng khu bãi */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 48, color: "#64748b" }}>
              <span className="material-symbols-rounded" style={{ fontSize: 36, display: "block", marginBottom: 8, opacity: 0.4 }}>hourglass_empty</span>
              Đang tải dữ liệu...
            </div>
          ) : areas.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "#64748b" }}>
              <span className="material-symbols-rounded" style={{ fontSize: 48, display: "block", marginBottom: 12, opacity: 0.3 }}>garage</span>
              <div style={{ fontWeight: "700", fontSize: 15, marginBottom: 6 }}>Chưa có dữ liệu bãi đỗ xe</div>
              <div style={{ fontSize: 13 }}>Vui lòng kiểm tra cấu hình bảng <code>parking_area</code> trong cơ sở dữ liệu.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 20 }}>
              {areas.map(area => {
                const edit     = areaEdits[area.area_id] || {};
                const occupied = area.current_count || 0;
                const cap      = area.capacity || 1;
                const pct      = Math.round((occupied / cap) * 100);
                const barColor = pct >= 90 ? "#CD5C5C" : pct >= 70 ? "#f59e0b" : "#3F5E4D";
                const msgState = areaMsg[area.area_id];
                const isMotorbike = area.type_name?.toLowerCase().includes("máy") || area.type_id === 1;

                return (
                  <div key={area.area_id} style={{
                    backgroundColor: "#FFFBF5", borderRadius: 20, padding: 24,
                    border: "1px solid rgba(139,115,85,0.08)",
                    boxShadow: "0 8px 30px rgba(139,115,85,0.04)"
                  }}>
                    {/* Card header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          backgroundColor: `${barColor}14`, color: barColor,
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 24 }}>
                            {isMotorbike ? "two_wheeler" : "directions_car"}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: "800", color: "#2D3327" }}>{area.type_name}</div>
                          <div style={{ fontSize: 12, color: "#9E826C", fontWeight: "600" }}>{area.area_name}</div>
                        </div>
                      </div>
                      <span style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: "700",
                        backgroundColor: pct >= 90 ? "rgba(205,92,92,0.1)" : pct >= 70 ? "rgba(245,158,11,0.1)" : "rgba(63,94,77,0.08)",
                        color: barColor
                      }}>
                        {pct >= 90 ? "⚠️ Gần đầy" : pct >= 70 ? "🔶 Trung bình" : "✅ Còn trống"}
                      </span>
                    </div>

                    {/* Số liệu */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                      {[
                        { label: "Đang đỗ", value: occupied, color: barColor },
                        { label: "Còn trống", value: Math.max(0, cap - occupied), color: "#3F5E4D" },
                        { label: "Sức chứa", value: cap, color: "#64748b" },
                      ].map((s, i) => (
                        <div key={i} style={{
                          flex: 1, backgroundColor: "#FAF8F5", borderRadius: 10,
                          padding: "10px 12px", border: "1px solid rgba(139,115,85,0.08)", textAlign: "center"
                        }}>
                          <div style={{ fontSize: 22, fontWeight: "800", color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 11, color: "#9E826C", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 10, backgroundColor: "#EAE5D9", borderRadius: 5, overflow: "hidden", marginBottom: 20 }}>
                      <div style={{
                        height: "100%", width: `${Math.min(100, pct)}%`,
                        backgroundColor: barColor, borderRadius: 5, transition: "width 0.5s"
                      }} />
                    </div>

                    {/* Edit fields */}
                    <div style={{ borderTop: "1px dashed #EAE5D9", paddingTop: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: "800", color: "#9E826C", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
                        ✏️ Chỉnh sửa cấu hình
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                        <div style={{ flex: 2 }}>
                          <label style={styles.label}>Tên bãi</label>
                          <input
                            style={styles.input}
                            value={edit.area_name || ""}
                            onChange={e => setAreaEdits(prev => ({ ...prev, [area.area_id]: { ...prev[area.area_id], area_name: e.target.value } }))}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={styles.label}>Sức chứa tối đa</label>
                          <input
                            type="number" min={1}
                            style={styles.input}
                            value={edit.capacity !== undefined ? edit.capacity : ""}
                            onChange={e => {
                              const val = e.target.value;
                              setAreaEdits(prev => ({
                                ...prev,
                                [area.area_id]: {
                                  ...prev[area.area_id],
                                  capacity: val === "" ? "" : (parseInt(val) || 0)
                                }
                              }));
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                        <button
                          onClick={() => handleSave(area.area_id)}
                          disabled={areaSaving[area.area_id]}
                          style={{
                            padding: "9px 22px", backgroundColor: "#3F5E4D", color: "#FFFBF5",
                            border: "none", borderRadius: 10, fontSize: 13, fontWeight: "700",
                            cursor: "pointer", opacity: areaSaving[area.area_id] ? 0.6 : 1,
                            display: "flex", alignItems: "center", gap: 6
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>save</span>
                          {areaSaving[area.area_id] ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                        {msgState === "success" && (
                          <span style={{ fontSize: 13, color: "#3F5E4D", fontWeight: "700", display: "flex", alignItems: "center", gap: 4 }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>check_circle</span> Đã lưu
                          </span>
                        )}
                        {msgState === "error" && (
                          <span style={{ fontSize: 13, color: "#CD5C5C", fontWeight: "700", display: "flex", alignItems: "center", gap: 4 }}>
                            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>error</span> Lỗi lưu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  label: {
    display: "block", fontSize: 11, fontWeight: "700", color: "#9E826C",
    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6
  },
  input: {
    width: "100%", padding: "9px 12px", boxSizing: "border-box",
    border: "1.5px solid #EAE5D9", borderRadius: 10, fontSize: 13,
    color: "#2D3327", backgroundColor: "#FAF8F5",
    outline: "none", fontFamily: "'Outfit', sans-serif"
  }
};

export default ParkingAreaConfig;
