import api from './api'; // Giả định bạn đã có file cấu hình axios (api.js)

export const notificationService = {
  // Lấy danh sách thông báo
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Đánh dấu 1 thông báo đã đọc
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Đánh dấu tất cả đã đọc
  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  }
};