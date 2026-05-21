import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Tự động đính token vào mỗi request
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Bắt lỗi 503 (Bảo trì) trên toàn cục
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 503) {
      alert("Hệ thống hiện đang được bảo trì. Vui lòng quay lại sau!");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default instance;
