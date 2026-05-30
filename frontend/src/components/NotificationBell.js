import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notification.service';
// Bạn có thể import icon từ thư viện bạn đang dùng (lucide-react, react-icons...)
// import { Bell } from 'lucide-react'; 

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Lấy dữ liệu ban đầu
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getNotifications();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } catch (error) {
        console.error("Lỗi lấy thông báo:", error);
      }
    };

    fetchNotifications();

    // 2. Kết nối SSE để nhận Real-time (Lấy token từ localStorage)
    const token = localStorage.getItem('token'); 
    const eventSource = new EventSource(`http://localhost:5000/api/realtime/events?token=${token}`);

    eventSource.addEventListener('data-changed', (event) => {
      const data = JSON.parse(event.data);
      if (data.action === 'new_notification') {
        const newNotif = data.resources[0];
        // Thêm thông báo mới lên đầu danh sách và tăng số đếm
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Nút bấm quả chuông */}
      <button onClick={() => setIsOpen(!isOpen)} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer' }}>
        <span style={{ fontSize: '24px' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            background: 'red', color: 'white', borderRadius: '50%',
            padding: '2px 6px', fontSize: '12px', fontWeight: 'bold'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Danh sách thông báo (Dropdown) */}
      {isOpen && (
        <div style={{
          position: 'absolute', right: 0, top: '40px', width: '300px',
          background: 'white', border: '1px solid #ccc', borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: '400px', overflowY: 'auto'
        }}>
          <h4 style={{ padding: '10px', margin: 0, borderBottom: '1px solid #eee' }}>Thông báo</h4>
          {notifications.length === 0 ? (
             <p style={{ padding: '10px', textAlign: 'center', color: '#888' }}>Không có thông báo nào.</p>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.notification_id} 
                onClick={() => handleMarkAsRead(notif.notification_id)}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  background: notif.is_read ? 'white' : '#f0f8ff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: notif.is_read ? 'normal' : 'bold', marginBottom: '4px' }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: '14px', color: '#555' }}>{notif.content}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  {new Date(notif.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;