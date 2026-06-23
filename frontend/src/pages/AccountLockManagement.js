import React, { useEffect, useMemo, useState } from "react";
import axios from "../api/axios";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useRealtimeRefresh } from "../hooks/useRealtimeRefresh";

const AccountLockManagement = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("2");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmTarget, setConfirmTarget] = useState(null);

  const fetchAccounts = async () => {
    try {
      const res = await axios.get("/users");
      setAccounts(res.data.filter((account) => account.role_id === 2));
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi tải danh sách tài khoản" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useRealtimeRefresh(fetchAccounts, ["users", "audit"], {
    intervalMs: 12000,
  });

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesRole = roleFilter === "all" || String(account.role_id) === roleFilter;
      const matchesStatus = statusFilter === "all" || account.status === statusFilter;
      return matchesRole && matchesStatus;
    });
  }, [accounts, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: accounts.length,
      active: accounts.filter((account) => account.status === "active").length,
      locked: accounts.filter((account) => account.status === "locked").length,
    };
  }, [accounts]);

  const askToggleAccount = (account) => {
    setConfirmTarget({
      account,
      action: account.status === "active" ? "locked" : "active",
    });
  };

  const executeToggleAccount = async () => {
    if (!confirmTarget) return;

    const { account, action } = confirmTarget;
    setConfirmTarget(null);

    try {
      await axios.put(`/users/${account.user_id}`, { status: action });
      setMessage({
        type: "success",
        text: `${action === "locked" ? "Khóa" : "Mở khóa"} tài khoản ${account.username} thành công`,
      });
      fetchAccounts();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi thay đổi trạng thái tài khoản" });
    } finally {
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const roleLabel = (roleId, roleName) => {
    if (roleId === 2) return "Admin";
    if (roleId === 3) return "Security";
    if (roleId === 4) return "Cư dân";
    return roleName || "---";
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.topHeader}>
          <div style={styles.headerLeft}>
            <h2 style={styles.pageKicker}>Quản trị hệ thống</h2>
            <div style={styles.onlineBadge}>
              <span style={styles.onlineDot}></span> System Online
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={{ textAlign: "right", marginRight: 12 }}>
              <div style={styles.headerUser}>Super Admin: {user?.username}</div>
              <div style={styles.headerRole}>TOÀN QUYỀN HỆ THỐNG</div>
            </div>
            <div style={styles.avatar}>
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>lock_person</span>
            </div>
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.titleRow}>
            <div>
              <h1 style={styles.title}>Khóa / Mở khóa tài khoản</h1>
              <p style={styles.subtitle}>
                Quản lý trạng thái tài khoản Admin khi nhập sai mật khẩu nhiều lần hoặc cần khóa thủ công.
              </p>
            </div>
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <span style={styles.statIcon} className="material-symbols-rounded">groups</span>
              <div>
                <div style={styles.statValue}>{stats.total}</div>
                <div style={styles.statLabel}>Tổng tài khoản</div>
              </div>
            </div>
            <div style={styles.statBox}>
              <span style={{ ...styles.statIcon, color: "#10b981", backgroundColor: "#ecfdf5" }} className="material-symbols-rounded">verified_user</span>
              <div>
                <div style={styles.statValue}>{stats.active}</div>
                <div style={styles.statLabel}>Đang hoạt động</div>
              </div>
            </div>
            <div style={styles.statBox}>
              <span style={{ ...styles.statIcon, color: "#ef4444", backgroundColor: "#fef2f2" }} className="material-symbols-rounded">lock</span>
              <div>
                <div style={styles.statValue}>{stats.locked}</div>
                <div style={styles.statLabel}>Đang bị khóa</div>
              </div>
            </div>
          </div>

          <div style={styles.filterBar}>
            <label style={styles.filterLabel}>Vai trò</label>
            <select style={styles.select} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="2">Admin</option>
            </select>

            <label style={styles.filterLabel}>Trạng thái</label>
            <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="locked">Bị khóa</option>
            </select>
          </div>

          {message.text && (
            <div style={{
              ...styles.toast,
              backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2",
              color: message.type === "success" ? "#166534" : "#991b1b",
            }}>
              {message.text}
            </div>
          )}

          <div style={styles.tableCard}>
            {loading ? (
              <div style={styles.empty}>Đang tải danh sách tài khoản...</div>
            ) : filteredAccounts.length === 0 ? (
              <div style={styles.empty}>Không có tài khoản phù hợp với bộ lọc</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Tài khoản</th>
                    <th style={styles.th}>Vai trò</th>
                    <th style={styles.th}>Trạng thái</th>
                    <th style={styles.th}>Sai mật khẩu</th>
                    <th style={styles.th}>Ngày tạo</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((account) => (
                    <tr key={account.user_id} style={styles.tr}>
                      <td style={styles.td}>#{account.user_id}</td>
                      <td style={styles.td}>
                        <div style={styles.accountCell}>
                          <div style={styles.accountAvatar}>{account.username.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={styles.username}>{account.username}</div>
                            <div style={styles.secondaryText}>{account.staff_name || account.staff_phone || "Chưa có thông tin bổ sung"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{roleLabel(account.role_id, account.role_name)}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: account.status === "active" ? "#ecfdf5" : "#fef2f2",
                          color: account.status === "active" ? "#10b981" : "#ef4444",
                          borderColor: account.status === "active" ? "#a7f3d0" : "#fecaca",
                        }}>
                          {account.status === "active" ? "Hoạt động" : "Bị khóa"}
                        </span>
                      </td>
                      <td style={styles.td}>{account.failed_attempts || 0}</td>
                      <td style={styles.td}>{new Date(account.created_at).toLocaleDateString("vi-VN")}</td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <button
                          onClick={() => askToggleAccount(account)}
                          style={{
                            ...styles.actionBtn,
                            backgroundColor: account.status === "active" ? "#fee2e2" : "#dcfce7",
                            color: account.status === "active" ? "#ef4444" : "#10b981",
                            borderColor: account.status === "active" ? "#fecaca" : "#bbf7d0",
                          }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                            {account.status === "active" ? "lock" : "lock_open"}
                          </span>
                          {account.status === "active" ? "Khóa" : "Mở khóa"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {confirmTarget && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <div style={{
              ...styles.modalIcon,
              backgroundColor: confirmTarget.action === "locked" ? "rgba(205, 92, 92, 0.1)" : "rgba(63, 94, 77, 0.1)",
              color: confirmTarget.action === "locked" ? "#CD5C5C" : "#3F5E4D",
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 32 }}>
                {confirmTarget.action === "locked" ? "lock" : "lock_open"}
              </span>
            </div>
            <h3 style={styles.modalTitle}>
              {confirmTarget.action === "locked" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
            </h3>
            <p style={styles.modalText}>
              Bạn có chắc chắn muốn {confirmTarget.action === "locked" ? "khóa" : "mở khóa"} tài khoản{" "}
              <strong>{confirmTarget.account.username}</strong> ({roleLabel(confirmTarget.account.role_id, confirmTarget.account.role_name)})?
            </p>
            <div style={styles.modalActions}>
              <button onClick={executeToggleAccount} style={{
                ...styles.modalPrimary,
                backgroundColor: confirmTarget.action === "locked" ? "#CD5C5C" : "#3F5E4D",
              }}>
                Xác nhận
              </button>
              <button onClick={() => setConfirmTarget(null)} style={styles.modalCancel}>
                Hủy
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
  pageKicker: { margin: 0, fontSize: 18, fontWeight: "800", color: "#2D3327" },
  onlineBadge: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#3F5E4D", fontWeight: "700", backgroundColor: "#EAE5D9", padding: "4px 12px", borderRadius: 20 },
  onlineDot: { width: 8, height: 8, backgroundColor: "#3F5E4D", borderRadius: "50%" },
  headerRight: { display: "flex", alignItems: "center" },
  headerUser: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  headerRole: { fontSize: 12, color: "#64748b" },
  avatar: { width: 36, height: 36, backgroundColor: "#3F5E4D", color: "#FFFBF5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(63, 94, 77, 0.15)" },
  content: { flex: 1, padding: 24, overflowY: "auto" },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 },
  title: { margin: 0, fontSize: 28, color: "#0f172a", fontWeight: "800" },
  subtitle: { margin: "6px 0 0", color: "#64748b", fontSize: 14 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(160px, 1fr))", gap: 16, marginBottom: 20 },
  statBox: { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 },
  statIcon: { width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F1ECE4", color: "#3F5E4D" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: "700", textTransform: "uppercase" },
  filterBar: { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" },
  filterLabel: { fontSize: 13, fontWeight: "800", color: "#2D3327" },
  select: { width: 220, padding: "12px 14px", border: "2px solid #EAE5D9", borderRadius: 10, backgroundColor: "#FFFBF5", color: "#2D3327", fontSize: 14, outline: "none" },
  toast: { padding: "12px 18px", borderRadius: 10, marginBottom: 16, fontWeight: "700" },
  tableCard: { backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#EAE5D9" },
  th: { padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: "800", color: "#2D3327", textTransform: "uppercase" },
  tr: { borderBottom: "1px solid #F1ECE4" },
  td: { padding: "16px 20px", fontSize: 14, color: "#2D3327" },
  accountCell: { display: "flex", alignItems: "center", gap: 12 },
  accountAvatar: { width: 34, height: 34, borderRadius: "50%", backgroundColor: "#f1f5f9", color: "#3F5E4D", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" },
  username: { fontWeight: "800", color: "#0f172a" },
  secondaryText: { fontSize: 12, color: "#64748b", marginTop: 2 },
  badge: { display: "inline-flex", padding: "6px 12px", borderRadius: 8, border: "1px solid", fontSize: 12, fontWeight: "800" },
  actionBtn: { display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: "800", cursor: "pointer" },
  empty: { padding: 40, textAlign: "center", color: "#64748b", fontWeight: "700" },
  modalBackdrop: { position: "fixed", inset: 0, backgroundColor: "rgba(45, 51, 39, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(4px)" },
  modal: { backgroundColor: "#FFFBF5", borderRadius: 20, width: "90%", maxWidth: 420, padding: 24, boxShadow: "0 20px 45px rgba(0,0,0,0.15)", textAlign: "center" },
  modalIcon: { width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  modalTitle: { margin: "0 0 8px", color: "#2D3327", fontSize: 18, fontWeight: "800" },
  modalText: { margin: "0 0 24px", color: "#64748b", fontSize: 14, lineHeight: "20px" },
  modalActions: { display: "flex", gap: 12 },
  modalPrimary: { flex: 1, padding: "10px 16px", color: "#FFFBF5", border: "none", borderRadius: 10, fontSize: 14, fontWeight: "800", cursor: "pointer" },
  modalCancel: { flex: 1, padding: "10px 16px", backgroundColor: "#F1ECE4", color: "#5F504B", border: "1px solid #E4DDD3", borderRadius: 10, fontSize: 14, fontWeight: "800", cursor: "pointer" },
};

export default AccountLockManagement;
