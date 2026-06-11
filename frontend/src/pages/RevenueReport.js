import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const RevenueReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("transactions");
  const [exportModal, setExportModal] = useState({ isOpen: false, type: null });
  const { user } = useAuth();
  
  const formatVND = (num) => {
    return Number(num || 0).toLocaleString("vi-VN") + " ₫";
  };

  const fetchData = async () => {
    try {
      const res = await axios.get("/parking/report/revenue");
      setData(res.data);
    } catch (err) {
      console.error("Lỗi lấy báo cáo doanh thu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.main}>
          {/* Top Header */}
          <div style={styles.topHeader}>
            <div style={styles.headerLeft}>
              <h2 style={{margin: 0, fontSize: 20, color: '#1e293b'}}>Báo cáo doanh thu</h2>
            </div>
          </div>
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "'Outfit', sans-serif" }}>
            <div style={{ textAlign: "center" }}>
              <span className="material-symbols-rounded" style={{ fontSize: 48, color: "#3F5E4D", animation: "spin 2s linear infinite" }}>sync</span>
              <p style={{ marginTop: 12, fontWeight: "600" }}>Đang tính toán số liệu tài chính...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { summary, byVehicleType, history, recentTransactions, recentMonthlyCards } = data || {};

  // Combine monthly histories into unified list
  const allMonthsMap = {};
  if (history?.shortTerm) {
    history.shortTerm.forEach(h => {
      allMonthsMap[h.month] = { ...allMonthsMap[h.month], shortTerm: parseFloat(h.shortTermRevenue || 0) };
    });
  }
  if (history?.monthly) {
    history.monthly.forEach(h => {
      allMonthsMap[h.month] = { ...allMonthsMap[h.month], monthly: parseFloat(h.monthlyRevenue || 0) };
    });
  }

  const mergedHistory = Object.keys(allMonthsMap).map(m => ({
    month: m,
    shortTerm: allMonthsMap[m].shortTerm || 0,
    monthly: allMonthsMap[m].monthly || 0,
    total: (allMonthsMap[m].shortTerm || 0) + (allMonthsMap[m].monthly || 0)
  })).sort((a, b) => a.month.localeCompare(b.month));

  const maxTotal = Math.max(...mergedHistory.map(h => h.total), 100000);

  const exportToCSV = () => {
    if (!data) return;
    
    let csvContent = "\uFEFF"; // Vietnamese UTF-8 BOM
    
    // Header
    csvContent += "BÁO CÁO DOANH THU HỆ THỐNG GỬI XE VINHOMES\n";
    csvContent += `Thời gian báo cáo: ${new Date().toLocaleString("vi-VN")}\n\n`;
    
    // Summary
    csvContent += "TỔNG QUAN TÀI CHÍNH\n";
    csvContent += `Tổng doanh thu,${summary.totalRevenue} VNĐ\n`;
    csvContent += `Doanh thu vãng lai ngắn hạn,${summary.totalShortTermRevenue} VNĐ (${summary.totalShortTermSessions} lượt xe)\n`;
    csvContent += `Doanh thu vé tháng cư dân,${summary.totalMonthlyRevenue} VNĐ (${summary.totalMonthlyTickets} thẻ active)\n\n`;
    
    // Vehicle breakdown
    csvContent += "PHÂN TÍCH THEO PHƯƠNG TIỆN\n";
    csvContent += "Loại xe,Doanh thu vãng lai,Số lượt vãng lai,Doanh thu vé tháng,Số vé tháng,Tổng doanh thu\n";
    csvContent += `Xe máy,${byVehicleType.motorcycle.shortTermRevenue},${byVehicleType.motorcycle.shortTermCount},${byVehicleType.motorcycle.monthlyRevenue},${byVehicleType.motorcycle.monthlyCount},${byVehicleType.motorcycle.totalRevenue}\n`;
    csvContent += `Ô tô,${byVehicleType.car.shortTermRevenue},${byVehicleType.car.shortTermCount},${byVehicleType.car.monthlyRevenue},${byVehicleType.car.monthlyCount},${byVehicleType.car.totalRevenue}\n\n`;
    
    // Monthly history
    csvContent += "LỊCH SỬ DOANH THU THEO THÁNG\n";
    csvContent += "Tháng,Doanh thu vãng lai,Doanh thu vé tháng,Tổng doanh thu\n";
    mergedHistory.forEach(h => {
      csvContent += `${h.month},${h.shortTerm},${h.monthly},${h.total}\n`;
    });
    csvContent += "\n";
    
    // Recent transactions
    csvContent += "DANH SÁCH GIAO DỊCH VÃNG LAI GẦN ĐÂY\n";
    csvContent += "Mã Phiên,Biển Số,Loại Xe,Giờ Vào,Giờ Ra,Số Tiền\n";
    recentTransactions?.forEach(t => {
      csvContent += `#${t.session_id},${t.plate_number},${t.type_name},"${new Date(t.time_in).toLocaleString("vi-VN")}","${new Date(t.time_out).toLocaleString("vi-VN")}",${t.fee_amount}\n`;
    });
    
    csvContent += "\n";
    // Recent monthly active cards
    csvContent += "DANH SÁCH THẺ VÉ THÁNG HOẠT ĐỘNG MỚI NHẤT\n";
    csvContent += "Mã Đăng Ký,Biển Số,Chủ Xe,Căn Hộ,Loại Xe,Bắt Đầu,Kết Thúc,Giá Trị\n";
    recentMonthlyCards?.forEach(c => {
      csvContent += `#${c.monthly_id},${c.plate_number},"${c.resident_name}",${c.apartment_number},${c.type_name},"${new Date(c.start_date).toLocaleDateString("vi-VN")}","${new Date(c.end_date).toLocaleDateString("vi-VN")}",${c.monthly_fee}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bao_cao_doanh_thu_vinhomes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!data) return;
    const printWindow = window.open("", "_blank");
    
    const rowsHtml = mergedHistory.map(h => 
      "<tr>" +
        "<td>" + h.month + "</td>" +
        "<td class=\"right\">" + formatVND(h.shortTerm) + "</td>" +
        "<td class=\"right\">" + formatVND(h.monthly) + "</td>" +
        "<td class=\"right\"><strong>" + formatVND(h.total) + "</strong></td>" +
      "</tr>"
    ).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Báo cáo doanh thu Vinhomes</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #2D3327; background-color: #FFFBF5; }
            h1 { text-align: center; color: #3F5E4D; margin-bottom: 5px; }
            .sub { text-align: center; font-size: 14px; color: #64748b; margin-bottom: 30px; }
            .section-title { border-bottom: 2px solid #3F5E4D; padding-bottom: 5px; color: #3F5E4D; margin-top: 30px; font-size: 18px; text-transform: uppercase; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #EAE5D9; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #EAE5D9; color: #2D3327; }
            .right { text-align: right; }
            .summary-grid { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px; }
            .summary-card { flex: 1; border: 1px solid #3F5E4D; border-radius: 8px; padding: 15px; background-color: #fff; }
            .summary-card.primary { background-color: #3F5E4D; color: #fff; }
            .summary-card h4 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; }
            .summary-card div { font-size: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>BÁO CÁO DOANH THU HỆ THỐNG GỬI XE VINHOMES</h1>
          <div class="sub">Ngày kết xuất: ${new Date().toLocaleString("vi-VN")}</div>
          
          <div class="summary-grid">
            <div class="summary-card primary">
              <h4>Tổng doanh thu</h4>
              <div>${formatVND(summary.totalRevenue)}</div>
            </div>
            <div class="summary-card">
              <h4>Vé vãng lai ngắn hạn</h4>
              <div>${formatVND(summary.totalShortTermRevenue)}</div>
              <small style="font-size:11px; opacity:0.8;">${summary.totalShortTermSessions} lượt xe</small>
            </div>
            <div class="summary-card">
              <h4>Vé tháng cư dân</h4>
              <div>${formatVND(summary.totalMonthlyRevenue)}</div>
              <small style="font-size:11px; opacity:0.8;">${summary.totalMonthlyTickets} thẻ hoạt động</small>
            </div>
          </div>

          <div class="section-title">Phân tích theo loại phương tiện</div>
          <table>
            <thead>
              <tr>
                <th>Loại xe</th>
                <th class="right">Vé ngắn hạn</th>
                <th class="right">Lượt ngắn hạn</th>
                <th class="right">Vé tháng cư dân</th>
                <th class="right">Số lượng vé tháng</th>
                <th class="right">Tổng doanh thu</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Xe máy</strong></td>
                <td class="right">${formatVND(byVehicleType.motorcycle.shortTermRevenue)}</td>
                <td class="right">${byVehicleType.motorcycle.shortTermCount}</td>
                <td class="right">${formatVND(byVehicleType.motorcycle.monthlyRevenue)}</td>
                <td class="right">${byVehicleType.motorcycle.monthlyCount}</td>
                <td class="right"><strong>${formatVND(byVehicleType.motorcycle.totalRevenue)}</strong></td>
              </tr>
              <tr>
                <td><strong>Ô tô</strong></td>
                <td class="right">${formatVND(byVehicleType.car.shortTermRevenue)}</td>
                <td class="right">${byVehicleType.car.shortTermCount}</td>
                <td class="right">${formatVND(byVehicleType.car.monthlyRevenue)}</td>
                <td class="right">${byVehicleType.car.monthlyCount}</td>
                <td class="right"><strong>${formatVND(byVehicleType.car.totalRevenue)}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">Lịch sử doanh thu theo tháng</div>
          <table>
            <thead>
              <tr>
                <th>Tháng</th>
                <th class="right">Doanh thu ngắn hạn</th>
                <th class="right">Doanh thu vé tháng</th>
                <th class="right">Tổng cộng</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const triggerExport = (type) => {
    if (type === "Excel") {
      exportToCSV();
    } else if (type === "PDF") {
      exportToPDF();
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />

      {/* Main Content */}
      <div style={styles.main}>
        {/* Top Header */}
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={{margin: 0, fontSize: 20, color: '#1e293b'}}>Báo cáo doanh thu</h2>
            <div style={styles.onlineBadge}>
              <span style={styles.onlineDot}></span> Live Ledger
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={{textAlign: 'right', marginRight: 12}}>
              <div style={{fontSize: 14, fontWeight: '600', color: '#1e293b'}}>{user?.username}</div>
              <div style={{fontSize: 12, color: '#9E826C', fontWeight: "700"}}>BAN QUẢN LÝ</div>
            </div>
            <div style={styles.avatar}><span className="material-symbols-rounded" style={{ fontSize: 20 }}>leaderboard</span></div>
          </div>
        </div>

        {/* Content Body */}
        <div style={styles.contentBody}>
          {/* Header Row */}
          <div style={styles.titleRow}>
            <div>
              <h3 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>Tình hình tài chính</h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>Phân tích doanh thu từ vé đỗ xe ngắn hạn và đăng ký vé tháng của cư dân.</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => triggerExport("Excel")} style={styles.secondaryBtn}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>table_view</span> Xuất Excel
              </button>
              <button onClick={() => triggerExport("PDF")} style={styles.primaryBtn}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>picture_as_pdf</span> Xuất PDF
              </button>
            </div>
          </div>

          {/* Cards Section */}
          <div style={styles.grid}>
            {/* Total Revenue */}
            <div style={{ ...styles.card, background: "linear-gradient(135deg, #3F5E4D 0%, #2d4437 100%)", color: "#FFFBF5" }}>
              <div style={styles.cardHeader}>
                <span style={{ fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.85 }}>TỔNG DOANH THU</span>
                <div style={{ ...styles.iconContainer, backgroundColor: "rgba(255,255,255,0.12)", color: "#FFFBF5" }}>
                  <span className="material-symbols-rounded">monetization_on</span>
                </div>
              </div>
              <div style={{ ...styles.cardValue, color: "#FFFBF5", marginTop: 8 }}>{formatVND(summary?.totalRevenue)}</div>
              <p style={{ margin: "8px 0 0 0", fontSize: 12, opacity: 0.8 }}>Lũy kế từ toàn bộ các nguồn thu hệ thống</p>
            </div>

            {/* Short-term Revenue */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardLabel}>VÉ VÃNG LAI (NGẮN HẠN)</span>
                <div style={{ ...styles.iconContainer, backgroundColor: "rgba(195,154,107,0.12)", color: "#C39A6B" }}>
                  <span className="material-symbols-rounded">confirmation_number</span>
                </div>
              </div>
              <div style={{ ...styles.cardValue, marginTop: 8 }}>{formatVND(summary?.totalShortTermRevenue)}</div>
              <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#64748b" }}>
                <strong>{summary?.totalShortTermSessions}</strong> lượt xe vãng lai đã check-out
              </p>
            </div>

            {/* Monthly Card Revenue */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardLabel}>VÉ THÁNG (CƯ DÂN)</span>
                <div style={{ ...styles.iconContainer, backgroundColor: "rgba(63,94,77,0.12)", color: "#3F5E4D" }}>
                  <span className="material-symbols-rounded">card_membership</span>
                </div>
              </div>
              <div style={{ ...styles.cardValue, marginTop: 8 }}>{formatVND(summary?.totalMonthlyRevenue)}</div>
              <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#64748b" }}>
                <strong>{summary?.totalMonthlyTickets}</strong> thẻ vé tháng đang hoạt động
              </p>
            </div>
          </div>

          {/* Graphical Section & Vehicle Breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24, marginTop: 24 }}>
            {/* Chart Panel */}
            <div style={styles.panelCard}>
              <h4 style={styles.panelTitle}>
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>analytics</span> Lịch sử doanh thu theo tháng
              </h4>
              
              {mergedHistory.length === 0 ? (
                <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                  Chưa có dữ liệu giao dịch lịch sử.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                  {/* Vertical bar chart rendering */}
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 200, paddingBottom: 16, borderBottom: "2px solid #EAE5D9", marginTop: 20 }}>
                    {mergedHistory.map((h, index) => {
                      const stPercent = (h.shortTerm / maxTotal) * 100;
                      const mPercent = (h.monthly / maxTotal) * 100;
                      return (
                        <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "15%", position: "relative" }}>
                          {/* Visual Stacked Bar */}
                          <div style={{ width: 24, height: 160, display: "flex", flexDirection: "column-reverse", backgroundColor: "#FAF8F5", borderRadius: 4, overflow: "hidden" }}>
                            {/* Short term block (brown) */}
                            <div 
                              style={{ height: `${stPercent}%`, backgroundColor: "#C39A6B", transition: "all 0.3s" }} 
                              title={`Vé vãng lai: ${formatVND(h.shortTerm)}`}
                            />
                            {/* Monthly block (forest green) */}
                            <div 
                              style={{ height: `${mPercent}%`, backgroundColor: "#3F5E4D", transition: "all 0.3s" }} 
                              title={`Vé tháng: ${formatVND(h.monthly)}`}
                            />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: "700", color: "#64748b", marginTop: 8 }}>{h.month}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 24, fontSize: 12, fontWeight: "700", color: "#64748b", paddingTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#3F5E4D" }} /> Vé tháng cư dân
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#C39A6B" }} /> Vé vãng lai
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Breakdown Panel */}
            <div style={styles.panelCard}>
              <h4 style={styles.panelTitle}>
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>directions_car</span> Phân tích theo phương tiện
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
                {/* Motorcycle breakdown */}
                <div style={styles.breakdownItem}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ ...styles.iconSmall, backgroundColor: "rgba(195,154,107,0.12)", color: "#C39A6B" }}>
                        <span className="material-symbols-rounded">two_wheeler</span>
                      </div>
                      <div>
                        <strong style={{ color: "#2D3327", fontSize: 14 }}>Xe máy (Motorcycles)</strong>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {byVehicleType?.motorcycle?.shortTermCount || 0} lượt vãng lai · {byVehicleType?.motorcycle?.monthlyCount || 0} thẻ vé tháng
                        </div>
                      </div>
                    </div>
                    <strong style={{ color: "#3F5E4D", fontSize: 16 }}>
                      {formatVND(byVehicleType?.motorcycle?.totalRevenue)}
                    </strong>
                  </div>
                  {/* Progress ratio */}
                  <div style={{ height: 6, backgroundColor: "#EAE5D9", borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.round(((byVehicleType?.motorcycle?.totalRevenue || 0) / (summary?.totalRevenue || 1)) * 100)}%`,
                      backgroundColor: "#C39A6B",
                      borderRadius: 3
                    }} />
                  </div>
                </div>

                {/* Car breakdown */}
                <div style={styles.breakdownItem}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ ...styles.iconSmall, backgroundColor: "rgba(63,94,77,0.12)", color: "#3F5E4D" }}>
                        <span className="material-symbols-rounded">directions_car</span>
                      </div>
                      <div>
                        <strong style={{ color: "#2D3327", fontSize: 14 }}>Ô tô (Cars)</strong>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {byVehicleType?.car?.shortTermCount || 0} lượt vãng lai · {byVehicleType?.car?.monthlyCount || 0} thẻ vé tháng
                        </div>
                      </div>
                    </div>
                    <strong style={{ color: "#3F5E4D", fontSize: 16 }}>
                      {formatVND(byVehicleType?.car?.totalRevenue)}
                    </strong>
                  </div>
                  {/* Progress ratio */}
                  <div style={{ height: 6, backgroundColor: "#EAE5D9", borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.round(((byVehicleType?.car?.totalRevenue || 0) / (summary?.totalRevenue || 1)) * 100)}%`,
                      backgroundColor: "#3F5E4D",
                      borderRadius: 3
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tables Section */}
          <div style={{ ...styles.panelCard, marginTop: 24 }}>
            {/* Table Tabs */}
            <div style={{ display: "flex", borderBottom: "2px solid #EAE5D9", marginBottom: 20 }}>
              <button 
                onClick={() => setActiveSubTab("transactions")}
                style={{
                  ...styles.tabBtn,
                  color: activeSubTab === "transactions" ? "#3F5E4D" : "#64748b",
                  borderBottom: activeSubTab === "transactions" ? "3px solid #3F5E4D" : "none"
                }}
              >
                💸 Giao dịch vãng lai gần đây
              </button>
              <button 
                onClick={() => setActiveSubTab("monthlyCards")}
                style={{
                  ...styles.tabBtn,
                  color: activeSubTab === "monthlyCards" ? "#3F5E4D" : "#64748b",
                  borderBottom: activeSubTab === "monthlyCards" ? "3px solid #3F5E4D" : "none"
                }}
              >
                💳 Vé tháng kích hoạt mới nhất
              </button>
            </div>

            {activeSubTab === "transactions" ? (
              <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "400px" }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      <th style={styles.th}>Mã Phiên</th>
                      <th style={styles.th}>Biển Số Xe</th>
                      <th style={styles.th}>Loại Xe</th>
                      <th style={styles.th}>Giờ Vào</th>
                      <th style={styles.th}>Giờ Ra (Thanh Toán)</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>Số Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions?.map((t) => (
                      <tr key={t.session_id} style={styles.tr}>
                        <td style={styles.td}>#{t.session_id}</td>
                        <td style={styles.td}>
                          <span style={styles.plateBadge}>{t.plate_number}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.typeTag}>{t.type_name}</span>
                        </td>
                        <td style={styles.td}>{new Date(t.time_in).toLocaleString("vi-VN")}</td>
                        <td style={styles.td}>{new Date(t.time_out).toLocaleString("vi-VN")}</td>
                        <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#C39A6B" }}>
                          {formatVND(t.fee_amount)}
                        </td>
                      </tr>
                    ))}
                    {(!recentTransactions || recentTransactions.length === 0) && (
                      <tr>
                        <td colSpan="6" style={{ padding: 30, textAlign: "center", color: "#64748b" }}>
                          Không có giao dịch thanh toán vãng lai nào gần đây.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "400px" }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      <th style={styles.th}>Mã Đăng Ký</th>
                      <th style={styles.th}>Biển Số</th>
                      <th style={styles.th}>Chủ Xe (Cư Dân)</th>
                      <th style={styles.th}>Căn Hộ</th>
                      <th style={styles.th}>Loại Phương Tiện</th>
                      <th style={styles.th}>Thời Hạn Hợp Đồng</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>Giá Trị Hợp Đồng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMonthlyCards?.map((c) => (
                      <tr key={c.monthly_id} style={styles.tr}>
                        <td style={styles.td}>#{c.monthly_id}</td>
                        <td style={styles.td}>
                          <span style={styles.plateBadge}>{c.plate_number}</span>
                        </td>
                        <td style={styles.td}>
                          <strong style={{ color: "#2D3327" }}>{c.resident_name}</strong>
                        </td>
                        <td style={styles.td}>{c.apartment_number}</td>
                        <td style={styles.td}>
                          <span style={styles.typeTag}>{c.type_name}</span>
                        </td>
                        <td style={styles.td}>
                          {new Date(c.start_date).toLocaleDateString("vi-VN")} - {new Date(c.end_date).toLocaleDateString("vi-VN")}
                        </td>
                        <td style={{ ...styles.td, textAlign: "right", fontWeight: "700", color: "#3F5E4D" }}>
                          {formatVND(c.monthly_fee)}
                        </td>
                      </tr>
                    ))}
                    {(!recentMonthlyCards || recentMonthlyCards.length === 0) && (
                      <tr>
                        <td colSpan="7" style={{ padding: 30, textAlign: "center", color: "#64748b" }}>
                          Không tìm thấy đăng ký vé tháng nào đang kích hoạt.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Confirmation Modal */}
      {exportModal.isOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(45, 51, 39, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          backdropFilter: "blur(4px)"
        }} onClick={() => setExportModal({ isOpen: false, type: null })}>
          <div style={{
            backgroundColor: "#FFFBF5",
            borderRadius: 20,
            width: "90%",
            maxWidth: 400,
            padding: 24,
            boxShadow: "0 20px 45px rgba(0,0,0,0.15)",
            fontFamily: "'Outfit', sans-serif",
            textAlign: "center"
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "rgba(63, 94, 77, 0.1)",
              color: "#3F5E4D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              margin: "0 auto 16px"
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 32 }}>download</span>
            </div>
            <h3 style={{ margin: "0 0 8px 0", color: "#2D3327", fontSize: 18, fontWeight: "800" }}>XUẤT BÁO CÁO {exportModal.type}</h3>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 14, lineHeight: "20px" }}>
              Hệ thống đang chuẩn bị kết xuất dữ liệu tài chính của dự án Vinhomes ra file <strong>{exportModal.type}</strong>. Báo cáo hoàn chỉnh sẽ tự động được gửi về email của Ban quản lý đính kèm!
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setExportModal({ isOpen: false, type: null })}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#3F5E4D",
                  color: "#FFFBF5",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Đồng ý
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
  topHeader: { height: 64, backgroundColor: "#FFFBF5", borderBottom: "1px solid rgba(139, 115, 85, 0.1)", display: "flex", alignItems: "center", justifyBetween: "space-between", padding: "0 24px", flexShrink: 0, justifyContent: "space-between" },
  headerLeft: { display: "flex", alignItems: "center", gap: 24 },
  onlineBadge: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#3F5E4D", fontWeight: "700", backgroundColor: "#EAE5D9", padding: "4px 12px", borderRadius: 20 },
  onlineDot: { width: 8, height: 8, backgroundColor: "#3F5E4D", borderRadius: "50%" },
  headerRight: { display: "flex", alignItems: "center" },
  avatar: { width: 36, height: 36, backgroundColor: "#3F5E4D", color: "#FFFBF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: "700", boxShadow: "0 4px 10px rgba(63, 94, 77, 0.15)", marginLeft: 12 },
  
  contentBody: { flex: 1, padding: 24, overflowY: "auto" },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 },
  
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 },
  card: { background: "#FFFBF5", borderRadius: 20, padding: 24, border: "1px solid rgba(139, 115, 85, 0.08)", display: "flex", flexDirection: "column", boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  iconContainer: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 },
  cardLabel: { fontSize: 12, color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" },
  cardValue: { fontSize: 28, fontWeight: "800", color: "#2D3327" },
  
  primaryBtn: { display: "flex", alignItems: "center", gap: 8, backgroundColor: "#3F5E4D", color: "#FFFBF5", border: "none", padding: "12px 24px", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 14, boxShadow: "0 4px 12px rgba(63, 94, 77, 0.15)" },
  secondaryBtn: { display: "flex", alignItems: "center", gap: 8, backgroundColor: "#FFFBF5", color: "#3F5E4D", border: "2px solid #3F5E4D", padding: "10px 22px", borderRadius: 10, cursor: "pointer", fontWeight: "bold", fontSize: 14 },
  
  panelCard: { background: "#fff", padding: 24, borderRadius: 20, boxShadow: "0 8px 30px rgba(139, 115, 85, 0.04)", border: "1px solid rgba(139, 115, 85, 0.08)" },
  panelTitle: { margin: "0 0 20px 0", color: "#2D3327", fontSize: 15, fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 8 },
  
  breakdownItem: { padding: 16, border: "1px solid rgba(139, 115, 85, 0.12)", borderRadius: 16, backgroundColor: "#FFFBF5" },
  iconSmall: { width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  
  tabBtn: { padding: "12px 20px", border: "none", background: "none", fontWeight: "bold", cursor: "pointer", fontSize: 14, marginBottom: -2 },
  
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#EAE5D9", borderBottom: "1px solid #F1ECE4" },
  th: { padding: "16px 20px", textAlign: "left", fontWeight: "700", fontSize: 11, color: "#2D3327", textTransform: "uppercase", letterSpacing: 0.5, position: "sticky", top: 0, backgroundColor: "#EAE5D9", zIndex: 1 },
  tr: { borderBottom: "1px solid #F1ECE4", transition: "background-color 0.15s" },
  td: { padding: "16px 20px", fontSize: 13, color: "#2D3327" },
  
  plateBadge: { display: "inline-block", padding: "4px 12px", backgroundColor: "#FFFBF5", border: "1.5px solid #2D3327", borderRadius: "6px", fontWeight: "800", fontSize: 12, color: "#2D3327", letterSpacing: "0.5px", fontFamily: "monospace" },
  typeTag: { padding: "4px 10px", backgroundColor: "#F1ECE4", borderRadius: 6, fontSize: 11, fontWeight: "700", color: "#5F504B" },
};

export default RevenueReport;
