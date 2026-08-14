import axios from "axios";
import { getAccessToken } from "./authToken";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api/",
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
