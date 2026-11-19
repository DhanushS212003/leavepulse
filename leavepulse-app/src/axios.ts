import axios from "axios";
import { getAccessToken } from "./authToken";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      axios.isAxiosError(error) &&
      (error.response?.data?.message || error.response?.data?.detail);
    const status = axios.isAxiosError(error) && error.response?.status;

    return Promise.reject(
      Object.assign(new Error(message || "Something went wrong"), { status })
    );
  }
);
