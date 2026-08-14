import { axiosInstance } from "../axios";

export type LeaveRequest = {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  reason: string;
  attachment: string | null;
  employee_name?: string;
  employee_code?: string;
  applied_at?: string;
  actioned_at?: string;
  remark?: string;
};

export const postLeaveRequest = (formData: FormData) => {
  return axiosInstance.post("leave_requests/", formData);
};

export const putLeaveRequest = (id: number, formData: FormData) => {
  return axiosInstance.put<{ leave_request: LeaveRequest }>(
    `leave_requests/${id}/`,
    formData
  );
};

export const patchCancelLeaveRequest = (id: number) => {
  return axiosInstance.patch<{ leave_request: LeaveRequest }>(
    `leave_requests/${id}/`,
    { status: "CANCELLED" }
  );
};

export const getMyLeaveRequests = () => {
  return axiosInstance.get<{ leave_requests: LeaveRequest[] }>(
    "my_leave_requests/"
  );
};

export const getTeamLeaveRequests = () => {
  return axiosInstance.get<{ leave_requests: LeaveRequest[] }>(
    "team_leave_requests/"
  );
};

export const patchTeamLeaveRequest = (
  id: number,
  data: {
    status: "PENDING" | "APPROVED" | "REJECTED";
    remark: string;
  }
) => {
  return axiosInstance.patch<{ leave_request: LeaveRequest }>(
    `team_leave_requests/${id}/`,
    data
  );
};
