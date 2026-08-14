import { axiosInstance } from "../axios";

export type Holiday = {
  id: number;
  name: string;
  date: string;
};

export const getHolidays = (params?: { mode?: string }) => {
  return axiosInstance.get<{ holidays: Holiday[] }>("holidays/", { params });
};

export const postHoliday = (data: { name: string; date: string }) => {
  return axiosInstance.post<{ holiday: Holiday }>("holidays/", data);
};

export const putHoliday = (
  id: number,
  data: { name: string; date: string }
) => {
  return axiosInstance.put<{ holiday: Holiday }>(`holidays/${id}/`, data);
};

export const deleteHoliday = (id: number) => {
  return axiosInstance.delete(`holidays/${id}/`);
};
