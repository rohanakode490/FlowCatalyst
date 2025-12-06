import axios from "axios";
import { BACKEND_URL } from "./config";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear cookies and localStorage
      document.cookie = "token=; Max-Age=0";
      localStorage.removeItem("token");

      // Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
