import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";

const SecurityDashboard = () => {
  const [plateIn, setPlateIn] = useState("");
  const [typeIdIn, setTypeIdIn] = useState(1);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [plateOut, setPlateOut] = useState("");
  const [messageIn, setMessageIn] = useState({ type: "", text: "" });
  const [messageOut, setMessageOut] = useState({ type: "", text: "" });
  const [checkoutInfo, setCheckoutInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [searchPlate, setSearchPlate] = useState("");

  const fetchSessions = async () => {
    try {
      const res = await axios.get("/parking/sessions");
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      const res = await axios.get("/vehicles/types");
      setVehicleTypes(res.data);
      if (res.data.length > 0) setTypeIdIn(res.data[0].type_id);
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

  useEffect(() => {
    fetchSessions();
    fetchVehicleTypes();
    fetchVehicles();
  }, []);

  const isResidentPlate = plateIn.trim() !== "" && vehicles.some((v) => v.plate_number === plateIn.trim());

  const filteredParkedSessions = React.useMemo(() => {
    return sessions.filter(s => {
      const isParked = s.status === "parking";
      const matchesSearch = searchPlate === "" || s.plate_number.toLowerCase().includes(searchPlate.toLowerCase());
      return isParked && matchesSearch;
    });
  }, [sessions, searchPlate]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setMessageIn({ type: "", text: "" });
    try {
      const res = await axios.post("/parking/check-in", {
        plate_number: plateIn,
        type_id: typeIdIn,
      });
      setMessageIn({ type: "success", text: res.data.message });
      setPlateIn("");
      fetchSessions();
    } catch (err) {
      setMessageIn({
        type: "error",
        text: err.response?.data?.message || "Lỗi check-in",
      });
    }
  };

  const handleCheckOut = async (e) => {
    e.preventDefault();
    setMessageOut({ type: "", text: "" });
    setCheckoutInfo(null);
    try {
      const res = await axios.post("/parking/check-out", {
        plate_number: plateOut,
      });
      setMessageOut({ type: "success", text: res.data.message });
      setCheckoutInfo({
        fee: res.data.fee,
        duration: res.data.duration_hours,
        time_in: new Date(res.data.time_in).toLocaleString(),
        time_out: new Date(res.data.time_out).toLocaleString(),
        is_resident: res.data.is_resident,
        is_monthly: res.data.is_monthly,
      });
      setPlateOut("");
      fetchSessions();
    } catch (err) {
      setMessageOut({
        type: "error",
        text: err.response?.data?.message || "Lỗi check-out",
      });
    }
  };

  return (
    <div style={styles.container}>
      <Navbar />

      <div style={styles.content}>
        <h3 style={{ marginBottom: 24 }}>Hệ Thống Kiểm Soát Xe Ra/Vào</h3>

        <div style={styles.cardsRow}>
          {/* Form Check-in */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Check-in (Xe vào)</h4>
            <form onSubmit={handleCheckIn}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Biển số xe</label>
                <input
                  style={styles.input}
                  value={plateIn}
                  onChange={(e) => setPlateIn(e.target.value)}
                  placeholder="Nhập biển số xe (VD: 29A-12345)"
                  required
                />
              </div>
              {plateIn.trim() !== "" && !isResidentPlate && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Loại xe</label>
                  <select
                    style={styles.input}
                    value={typeIdIn}
                    onChange={(e) => setTypeIdIn(Number(e.target.value))}
                  >
                    {vehicleTypes.map((vt) => (
                      <option key={vt.type_id} value={vt.type_id}>
                        {vt.type_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" style={{ ...styles.btn, backgroundColor: "#10b981" }}>
                Ghi nhận xe vào
              </button>
            </form>
            {messageIn.text && (
              <p
                style={{
                  ...styles.message,
                  color: messageIn.type === "success" ? "#10b981" : "#ef4444",
                }}
              >
                {messageIn.text}
              </p>
            )}
          </div>

          {/* Form Check-out */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Check-out (Xe ra)</h4>
            <form onSubmit={handleCheckOut}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Biển số xe</label>
                <input
                  style={styles.input}
                  value={plateOut}
                  onChange={(e) => setPlateOut(e.target.value)}
                  placeholder="Nhập biển số xe (VD: 29A-12345)"
                  required
                />
              </div>
              <button type="submit" style={{ ...styles.btn, backgroundColor: "#ef4444" }}>
                Ghi nhận xe ra
              </button>
            </form>
            {messageOut.text && (
              <p
                style={{
                  ...styles.message,
                  color: messageOut.type === "success" ? "#10b981" : "#ef4444",
                }}
              >
                {messageOut.text}
              </p>
            )}

            {checkoutInfo && (
              <div style={styles.receipt}>
                <h5>Hóa đơn thanh toán</h5>
                <p>
                  <strong>Loại xe:</strong>{" "}
                  {checkoutInfo.is_resident
                    ? checkoutInfo.is_monthly
                      ? "Cư dân (Vé tháng)"
                      : "Cư dân (Vé lượt)"
                    : "Khách vãng lai"}
                </p>
                <p><strong>Thời gian vào:</strong> {checkoutInfo.time_in}</p>
                <p><strong>Thời gian ra:</strong> {checkoutInfo.time_out}</p>
                <p><strong>Thời gian gửi:</strong> {checkoutInfo.duration} giờ</p>
                <h3 style={{ color: "#ef4444", marginTop: 10 }}>
                  Tổng tiền: {checkoutInfo.fee.toLocaleString()} VNĐ
                </h3>
              </div>
            )}
          </div>
        </div>

        <div style={{ ...styles.card, marginTop: 24, padding: 0 }}>
          <h4 style={{ ...styles.cardTitle, padding: "20px 20px 10px" }}>Xe đang đỗ</h4>
          <div style={{ padding: "20px 20px 0" }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tìm kiếm theo biển số xe</label>
              <input 
                style={styles.input}
                type="text"
                placeholder="Nhập biển số xe..."
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
              />
            </div>
          </div>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Biển số</th>
                <th style={styles.th}>Thời gian vào</th>
                <th style={styles.th}>Trạng thái</th>
                <th style={styles.th}>Nhân viên</th>
              </tr>
            </thead>
            <tbody>
              {filteredParkedSessions.length > 0 ? (
                filteredParkedSessions.map((s) => (
                  <tr key={s.session_id} style={styles.tr}>
                    <td style={styles.td}>{s.session_id}</td>
                    <td style={styles.td}><strong>{s.plate_number}</strong></td>
                    <td style={styles.td}>{new Date(s.time_in).toLocaleString()}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: "#f59e0b",
                        }}
                      >
                        Đang đỗ
                      </span>
                    </td>
                    <td style={styles.td}>{s.security_name || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr style={styles.tr}>
                  <td style={{...styles.td, textAlign: 'center', color: '#999'}} colSpan="5">
                    {searchPlate ? "Không tìm thấy xe đang đỗ khớp với tìm kiếm" : "Không có xe nào đang đỗ"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ ...styles.card, marginTop: 24, padding: 0 }}>
          <h4 style={{ ...styles.cardTitle, padding: "20px 20px 10px" }}>Lịch sử Phiên gửi xe (Tất cả)</h4>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Biển số</th>
                <th style={styles.th}>Thời gian vào</th>
                <th style={styles.th}>Thời gian ra</th>
                <th style={styles.th}>Trạng thái</th>
                <th style={styles.th}>Nhân viên</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.session_id} style={styles.tr}>
                  <td style={styles.td}>{s.session_id}</td>
                  <td style={styles.td}><strong>{s.plate_number}</strong></td>
                  <td style={styles.td}>{new Date(s.time_in).toLocaleString()}</td>
                  <td style={styles.td}>{s.time_out ? new Date(s.time_out).toLocaleString() : "-"}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: s.status === "parking" ? "#f59e0b" : "#10b981",
                      }}
                    >
                      {s.status === "parking" ? "Đang đỗ" : "Đã lấy"}
                    </span>
                  </td>
                  <td style={styles.td}>{s.security_name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f0f2f5" },
  content: { padding: "24px" },
  cardsRow: { display: "flex", gap: "24px", flexWrap: "wrap" },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    flex: 1,
    minWidth: "300px",
  },
  cardTitle: { marginTop: 0, marginBottom: 16, color: "#333", borderBottom: "1px solid #eee", paddingBottom: 10 },
  formGroup: { marginBottom: 16 },
  label: { display: "block", marginBottom: 6, fontWeight: "500", fontSize: 13 },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: 14,
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: 14,
  },
  message: { marginTop: 12, fontWeight: "500", fontSize: 14 },
  receipt: {
    marginTop: 20,
    padding: "15px",
    backgroundColor: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "6px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  thead: { backgroundColor: "#f8fafc" },
  th: {
    padding: "12px 20px",
    textAlign: "left",
    fontWeight: "600",
    fontSize: 13,
    color: "#555",
    borderBottom: "1px solid #e5e7eb",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 20px", fontSize: 14 },
  badge: {
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "500",
  },
};

export default SecurityDashboard;
