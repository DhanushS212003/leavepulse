import { axiosInstance } from "../axios";

export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  return axiosInstance.post("/auth/login/", { email, password });
};

export const refreshToken = async () => {
  return axiosInstance.post("/auth/refresh/");
};

export const getUser = async () => {
  return axiosInstance.get("/auth/me/");
};

export const logout = async () => {
  return axiosInstance.post("/auth/logout/");
};
