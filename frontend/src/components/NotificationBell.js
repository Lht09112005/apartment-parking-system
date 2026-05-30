import React, { useState, useEffect, useRef } from "react";
import { notificationService } from "../services/notification.service";
import { API_BASE_URL } from "../api/axios";

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      if (data) {
        setUnreadCount(data.unread_count || 0);
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách thông báo:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Connect SSE for Real-time notification updates
    const token = localStorage.getItem("token");
    let eventSource = null;
    if (token) {
      const sseUrl = `${API_BASE_URL}/realtime/events?token=${token}`;
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener("data-changed", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.action === "new_notification") {
            const newNotif = data.resources[0];
            // Add new notification at the top and increment count
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        } catch (err) {
          console.error("Lỗi xử lý dữ liệu SSE:", err);
        }
      });
    }

    // Close dropdown on click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationService.markAsRead(id);
      // Update state locally
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", err);
    }
  };

  // Format time beautifully
  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get visual config based on notification type
  const getTypeStyles = (type) => {
    switch (type) {
      case "PARKING_CHECKIN":
        return { icon: "login", color: "#10b981", bg: "#e6f8f1" }; // Green
      case "PARKING_CHECKOUT":
        return { icon: "logout", color: "#3b82f6", bg: "#e8f0fe" }; // Blue
      case "PARKING_FULL_WARNING":
      case "TICKET_EXPIRING_WARNING":
        return { icon: "warning", color: "#f59e0b", bg: "#fef3c7" }; // Amber/Yellow
      case "VEHICLE_APPROVAL_REQUEST":
        return { icon: "app_registration", color: "#8b5cf6", bg: "#f3e8ff" }; // Purple
      case "MONTHLY_STATUS_UPDATED":
        return { icon: "assignment_turned_in", color: "#06b6d4", bg: "#ecfeff" }; // Cyan
      default:
        return { icon: "notifications", color: "#64748b", bg: "#f1f5f9" }; // Slate
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Bell Button with Micro-animation on Hover */}
      <button
        onClick={toggleDropdown}
        style={styles.bellButton}
        className="notif-bell-btn"
        title="Thông báo"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 24 }}>
          notifications
        </span>
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Styled CSS Hover Rule */}
      <style>{`
        .notif-bell-btn {
          background: none;
          border: none;
          color: #5f6368;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          transition: background-color 0.2s, transform 0.1s;
          position: relative;
        }
        .notif-bell-btn:hover {
          background-color: #f1f3f4;
          color: #1a73e8;
          transform: scale(1.05);
        }
        .notif-bell-btn:active {
          transform: scale(0.95);
        }
        .notif-item {
          transition: background-color 0.2s;
        }
        .notif-item:hover {
          background-color: #f8f9fa;
        }
      `}</style>

      {/* Notifications Dropdown Drawer */}
      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <span style={styles.headerTitle}>Thông báo ({unreadCount})</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} style={styles.markAllBtn}>
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>
                <span className="material-symbols-rounded" style={{ fontSize: 40, color: "#94a3b8", marginBottom: 8 }}>
                  notifications_off
                </span>
                <div>Không có thông báo mới</div>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = getTypeStyles(notif.type);
                return (
                  <div
                    key={notif.notification_id}
                    className="notif-item"
                    onClick={() => handleMarkAsRead(notif.notification_id, notif.is_read)}
                    style={{
                      ...styles.item,
                      backgroundColor: notif.is_read ? "#fff" : "#f0f4f9",
                      cursor: notif.is_read ? "default" : "pointer",
                    }}
                  >
                    {/* Circle Icon Badge */}
                    <div style={{ ...styles.iconContainer, backgroundColor: config.bg }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: config.color }}>
                        {config.icon}
                      </span>
                    </div>

                    <div style={styles.body}>
                      <div style={{ ...styles.title, fontWeight: notif.is_read ? "500" : "600" }}>
                        {notif.title}
                      </div>
                      <div style={styles.content}>{notif.content}</div>
                      <div style={styles.time}>{formatTime(notif.created_at)}</div>
                    </div>

                    {!notif.is_read && <div style={styles.unreadDot} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  bellButton: {
    padding: 0,
    outline: "none",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ea4335", // Material Red
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    borderRadius: "10px",
    padding: "1px 5px",
    lineHeight: "12px",
    minWidth: 12,
    textAlign: "center",
    border: "2px solid #fff",
  },
  dropdown: {
    position: "absolute",
    top: 45,
    right: 0,
    width: 360,
    maxHeight: 480,
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    border: "1px solid #e0e0e0",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #f0f0f0",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#202124",
  },
  markAllBtn: {
    background: "none",
    border: "none",
    color: "#1a73e8",
    fontSize: 12,
    fontWeight: "500",
    cursor: "pointer",
    padding: 0,
  },
  list: {
    overflowY: "auto",
    flex: 1,
    maxHeight: 420,
  },
  item: {
    display: "flex",
    padding: "14px 16px",
    borderBottom: "1px solid #f5f5f5",
    position: "relative",
    alignItems: "flex-start",
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    color: "#202124",
    marginBottom: 4,
  },
  content: {
    fontSize: 12,
    color: "#5f6368",
    lineHeight: "16px",
    marginBottom: 6,
    wordBreak: "break-word",
  },
  time: {
    fontSize: 11,
    color: "#94a3b8",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: "#1a73e8",
    position: "absolute",
    right: 16,
    top: "50%",
    transform: "translateY(-50%)",
  },
  empty: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#5f6368",
    fontSize: 13,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default NotificationBell;
