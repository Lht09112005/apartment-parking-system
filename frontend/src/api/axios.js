import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const instance = axios.create({
  baseURL: API_BASE_URL,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 503) {
      console.error("[Axios 503 Interceptor] Request Config:", error.config);
      console.error("[Axios 503 Interceptor] Response Data:", error.response.data);
      console.error("[Axios 503 Interceptor] Response Headers:", error.response.headers);
      localStorage.removeItem("token");
      window.dispatchEvent(new Event('maintenanceMode'));
    }

    return Promise.reject(error);
  }
);

export default instance;