import { axiosInstance } from "../axios";

export type LeaveType = {
  id: number;
  name: string;
  days_per_year: number;
  requires_attachment: boolean;
  is_active: boolean;
};

export type ActiveLeaveType = {
  id: number;
  name: string;
  requires_attachment: boolean;
};

export const getLeaveTypes = () => {
  return axiosInstance.get<{ leave_types: LeaveType[] }>("leave_types/");
};

export const getActiveLeaveTypes = () => {
  return axiosInstance.get<{ leave_types: ActiveLeaveType[] }>(
    "active_leave_types/"
  );
};

export const postLeaveTypes = (data: {
  name: string;
  days: number;
  attachment_required: boolean;
}) => {
  return axiosInstance.post<{ leave_type: LeaveType }>("leave_types/", data);
};

export const putLeaveTypes = (
  id: number,
  data: {
    name: string;
    days: number;
    attachment_required: boolean;
  }
) => {
  return axiosInstance.put<{ leave_type: LeaveType }>(
    `leave_types/${id}/`,
    data
  );
};

export const patchLeaveTypes = (
  id: number,
  data: {
    is_active: boolean;
  }
) => {
  return axiosInstance.patch<{ leave_type: LeaveType }>(
    `leave_types/${id}/`,
    data
  );
};
