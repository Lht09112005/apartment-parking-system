import React, { useState, useEffect, useCallback } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";

const formatTime = (dt) => {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

const formatFee = (amount) => {
  if (!amount && amount !== 0) return "—";
  return Number(amount).toLocaleString("vi-VN") + " đ";
};

const calcDuration = (timeIn, timeOut) => {
  if (!timeIn || !timeOut) return "—";
  const diff = Math.floor((new Date(timeOut) - new Date(timeIn)) / 60000);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h > 0) return `${h}g ${m}p`;
  return `${m} phút`;
};

const STATUS_LABEL = {
  parking:   { text: "Đang đỗ",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  completed: { text: "Đã ra",     color: "#3F5E4D", bg: "rgba(63,94,77,0.08)"  },
  cancelled: { text: "Hủy",       color: "#CD5C5C", bg: "rgba(205,92,92,0.1)"  },
};

const ParkingHistory = () => {
  const { user } = useAuth();

  const [sessions, setSessions]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [vehicleTypes, setVehicleTypes] = useState([]);

  // Filters
  const [filterPlate,   setFilterPlate]   = useState("");
  const [filterType,    setFilterType]    = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo,   setFilterDateTo]   = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterPlate)    params.plate_number = filterPlate;
      if (filterType)     params.type_id      = filterType;
      if (filterDateFrom) params.date_from    = filterDateFrom;
      if (filterDateTo)   params.date_to      = filterDateTo;

      const res = await axios.get("/parking/sessions", { params });
      setSessions(res.data || []);
      setPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterPlate, filterType, filterDateFrom, filterDateTo]);

  useEffect(() => {
    // Fetch vehicle types for dropdown
    axios.get("/parking/fees").then(r => setVehicleTypes(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSearch = (e) => { e.preventDefault(); fetchSessions(); };
  const handleReset  = () => {
    setFilterPlate(""); setFilterType("");
    setFilterDateFrom(""); setFilterDateTo("");
  };

  // Summary stats
  const totalRevenue   = sessions.filter(s => s.status === "completed").reduce((acc, s) => acc + (Number(s.fee_amount) || 0), 0);
  const totalCompleted = sessions.filter(s => s.status === "completed").length;
  const totalParking   = sessions.filter(s => s.status === "parking").length;

  // Paginate
  const totalPages   = Math.ceil(sessions.length / PAGE_SIZE);
  const paginated    = sessions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            Lịch sử gửi xe
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
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>history</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Tổng phiên tìm thấy", value: sessions.length, icon: "format_list_numbered", color: "#3b82f6" },
              { label: "Phiên đã hoàn thành", value: totalCompleted, icon: "check_circle", color: "#3F5E4D" },
              { label: "Đang đỗ xe", value: totalParking, icon: "local_parking", color: "#f59e0b" },
            ].map((c, i) => (
              <div key={i} style={{
                backgroundColor: "#FFFBF5", borderRadius: 16, padding: "20px 24px",
                border: "1px solid rgba(139,115,85,0.08)", boxShadow: "0 4px 16px rgba(139,115,85,0.04)",
                display: "flex", alignItems: "center", gap: 16
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: `${c.color}14`, color: c.color,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 22 }}>{c.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</div>
                  <div style={{ fontSize: 28, fontWeight: "800", color: "#2D3327" }}>{c.value.toLocaleString("vi-VN")}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue highlight */}
          <div style={{
            backgroundColor: "#3F5E4D", borderRadius: 16, padding: "18px 24px",
            marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 8px 24px rgba(63,94,77,0.15)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 28, color: "#C39A6B" }}>payments</span>
              <div>
                <div style={{ fontSize: 11, color: "#FFF2E1", fontWeight: "700", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>
                  Tổng doanh thu (kết quả lọc)
                </div>
                <div style={{ fontSize: 26, fontWeight: "800", color: "#FFFBF5" }}>
                  {totalRevenue.toLocaleString("vi-VN")} đ
                </div>
              </div>
            </div>
            <span className="material-symbols-rounded" style={{ fontSize: 48, color: "rgba(255,255,255,0.06)" }}>bar_chart</span>
          </div>

          {/* Filter Panel */}
          <div style={{
            backgroundColor: "#FFFBF5", borderRadius: 16, padding: 20,
            border: "1px solid rgba(139,115,85,0.08)", boxShadow: "0 4px 16px rgba(139,115,85,0.04)",
            marginBottom: 20
          }}>
            <div style={{ fontSize: 12, fontWeight: "800", color: "#9E826C", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>filter_list</span>
              Bộ lọc tìm kiếm
            </div>
            <form onSubmit={handleSearch} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
              {/* Biển số */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
                <label style={styles.filterLabel}>Biển số xe</label>
                <input
                  style={styles.filterInput}
                  placeholder="VD: 51A-12345"
                  value={filterPlate}
                  onChange={e => setFilterPlate(e.target.value)}
                />
              </div>
              {/* Loại xe */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
                <label style={styles.filterLabel}>Loại xe</label>
                <select style={styles.filterInput} value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">Tất cả</option>
                  {vehicleTypes.map(v => (
                    <option key={v.type_id} value={v.type_id}>{v.type_name}</option>
                  ))}
                </select>
              </div>
              {/* Từ ngày */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={styles.filterLabel}>Từ ngày</label>
                <input type="date" style={styles.filterInput} value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
              </div>
              {/* Đến ngày */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={styles.filterLabel}>Đến ngày</label>
                <input type="date" style={styles.filterInput} value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
              </div>
              {/* Buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" style={styles.btnSearch}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>search</span>
                  Tìm kiếm
                </button>
                <button type="button" onClick={handleReset} style={styles.btnReset}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>restart_alt</span>
                  Đặt lại
                </button>
              </div>
            </form>
          </div>

          {/* Table */}
          <div style={{
            backgroundColor: "#FFFBF5", borderRadius: 16,
            border: "1px solid rgba(139,115,85,0.08)", boxShadow: "0 4px 16px rgba(139,115,85,0.04)",
            overflow: "hidden"
          }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr 100px 160px 160px 80px 140px 120px",
              gap: 0,
              backgroundColor: "#F4EFE8",
              borderBottom: "1px solid rgba(139,115,85,0.1)",
              padding: "12px 20px"
            }}>
              {["#", "Biển số", "Loại xe", "Thời gian vào", "Thời gian ra", "T.gian đỗ", "Nhân viên", "Phí / Trạng thái"].map((h, i) => (
                <div key={i} style={{
                  fontSize: 11, fontWeight: "800", color: "#9E826C",
                  textTransform: "uppercase", letterSpacing: "0.5px"
                }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
                <span className="material-symbols-rounded" style={{ fontSize: 36, display: "block", marginBottom: 8, opacity: 0.4 }}>hourglass_empty</span>
                Đang tải dữ liệu...
              </div>
            ) : paginated.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
                <span className="material-symbols-rounded" style={{ fontSize: 40, display: "block", marginBottom: 8, opacity: 0.3 }}>search_off</span>
                Không tìm thấy phiên gửi xe nào
              </div>
            ) : (
              <div style={{ maxHeight: "450px", overflowY: "auto" }}>
                {paginated.map((s, idx) => {
                  const st = STATUS_LABEL[s.status] || { text: s.status, color: "#64748b", bg: "#f8fafc" };
                  return (
                    <div key={s.session_id} style={{
                      display: "grid",
                      gridTemplateColumns: "60px 1fr 100px 160px 160px 80px 140px 120px",
                      gap: 0,
                      padding: "14px 20px",
                      borderBottom: "1px solid rgba(139,115,85,0.06)",
                      alignItems: "center",
                      backgroundColor: idx % 2 === 0 ? "#FFFBF5" : "rgba(250,248,245,0.5)",
                      transition: "background 0.15s"
                    }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(63,94,77,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#FFFBF5" : "rgba(250,248,245,0.5)"}
                    >
                      {/* # */}
                      <div style={{ fontSize: 12, color: "#9E826C", fontWeight: "600" }}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </div>
                      {/* Biển số */}
                      <div style={{
                        fontFamily: "monospace", fontWeight: "800", fontSize: 14,
                        color: "#2D3327",
                        border: "1.5px solid #DDD8CF",
                        borderRadius: 6, padding: "2px 8px",
                        display: "inline-block", width: "fit-content"
                      }}>
                        {s.plate_number}
                      </div>
                      {/* Loại xe */}
                      <div style={{ fontSize: 12, color: "#5F504B", fontWeight: "600" }}>
                        {s.type_name || "—"}
                      </div>
                      {/* Vào */}
                      <div style={{ fontSize: 12, color: "#2D3327", fontWeight: "600" }}>
                        {formatTime(s.time_in)}
                      </div>
                      {/* Ra */}
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {formatTime(s.time_out)}
                      </div>
                      {/* Thời gian đỗ */}
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {calcDuration(s.time_in, s.time_out)}
                      </div>
                      {/* Nhân viên */}
                      <div style={{ fontSize: 12, color: "#5F504B", display: "flex", alignItems: "center", gap: 4 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 14, color: "#9E826C" }}>person</span>
                        {s.security_name || "—"}
                      </div>
                      {/* Phí + Trạng thái */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: "800", color: s.status === "completed" ? "#3F5E4D" : "#9E826C" }}>
                          {s.status === "completed" ? formatFee(s.fee_amount) : "—"}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: "700", padding: "2px 8px",
                          borderRadius: 20, width: "fit-content",
                          backgroundColor: st.bg, color: st.color
                        }}>
                          {st.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ ...styles.pageBtn, opacity: page === 1 ? 0.4 : 1 }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>chevron_left</span>
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 7) p = i + 1;
                else if (page <= 4) p = i + 1;
                else if (page >= totalPages - 3) p = totalPages - 6 + i;
                else p = page - 3 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      ...styles.pageBtn,
                      backgroundColor: page === p ? "#3F5E4D" : "#FFFBF5",
                      color: page === p ? "#FFFBF5" : "#2D3327",
                      fontWeight: page === p ? "800" : "600"
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ ...styles.pageBtn, opacity: page === totalPages ? 0.4 : 1 }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>chevron_right</span>
              </button>
              <span style={{ fontSize: 12, color: "#9E826C", fontWeight: "600" }}>
                Trang {page} / {totalPages} ({sessions.length} bản ghi)
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const styles = {
  filterLabel: {
    fontSize: 11, fontWeight: "700", color: "#9E826C",
    textTransform: "uppercase", letterSpacing: "0.5px"
  },
  filterInput: {
    padding: "9px 12px",
    border: "1.5px solid #EAE5D9",
    borderRadius: 10, fontSize: 13,
    color: "#2D3327", backgroundColor: "#FAF8F5",
    outline: "none", fontFamily: "'Outfit', sans-serif",
    minWidth: 120
  },
  btnSearch: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "9px 18px",
    backgroundColor: "#3F5E4D", color: "#FFFBF5",
    border: "none", borderRadius: 10,
    fontSize: 13, fontWeight: "700", cursor: "pointer",
    fontFamily: "'Outfit', sans-serif"
  },
  btnReset: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "9px 16px",
    backgroundColor: "#F1ECE4", color: "#5F504B",
    border: "1px solid #E4DDD3", borderRadius: 10,
    fontSize: 13, fontWeight: "700", cursor: "pointer",
    fontFamily: "'Outfit', sans-serif"
  },
  pageBtn: {
    width: 36, height: 36,
    border: "1px solid #EAE5D9",
    borderRadius: 8,
    backgroundColor: "#FFFBF5",
    color: "#2D3327",
    fontWeight: "600", fontSize: 13,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Outfit', sans-serif"
  }
};

export default ParkingHistory;
