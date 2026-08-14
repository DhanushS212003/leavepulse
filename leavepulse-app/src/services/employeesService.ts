import { axiosInstance } from "../axios";

export type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  code: string;
  manager: string | null;
  joined_date: string;
  is_active: boolean;
};

export const getEmployees = () => {
  return axiosInstance.get<{ employees: Employee[] }>("employees/");
};

export const getTeamMembers = () => {
  return axiosInstance.get<{ team_members: Employee[] }>("team_members/");
};

export const postEmployees = (data: {
  first_name: string;
  last_name: string;
  email: string;
  role: number;
  manager_code: string;
  password: string;
  joining_date: string;
}) => {
  return axiosInstance.post("employees/", data);
};

export const putEmployees = (
  id: number,
  data: {
    first_name: string;
    last_name: string;
    email: string;
    role: number;
    manager_code: string;
    joining_date: string;
  }
) => {
  return axiosInstance.put(`employees/${id}/`, data);
};

export const patchEmployees = (
  id: number,
  data: {
    is_active: boolean;
  }
) => {
  return axiosInstance.patch(`employees/${id}/`, data);
};

export const getEmployee = (id: number) => {
  return axiosInstance.get<{ employee: Employee }>(`employees/${id}/`);
};

export const patchEmployeeProfile = (
  id: number,
  data: {
    first_name: string;
    last_name: string;
  }
) => {
  return axiosInstance.patch<{ employee: Employee }>(
    `employees/${id}/profile_update/`,
    data
  );
};

export const patchEmployeePassword = (
  id: number,
  data: {
    password: string;
  }
) => {
  return axiosInstance.patch(`employees/${id}/password_update/`, data);
};

export const getLeaveSummary = (id: number) => {
  return axiosInstance.get<{
    summary: {
      leave: string;
      available: number;
      used: number;
    }[];
  }>(`employees/${id}/leave_summary/`);
};

export type CalendarRequestEvent = {
  type: "request" | "team_request";
  leave_type: string;
  start_date: string;
  end_date: string;
};

export type CalendarTeamRequestEvent = CalendarRequestEvent & {
  type: "team_request";
  employee_name: string;
};

export type CalendarHolidayEvent = {
  type: "holiday";
  name: string;
  date: string;
};

export type CalendarEventsResponse = {
  my_requests: CalendarRequestEvent[];
  team_requests?: CalendarTeamRequestEvent[];
  holidays: CalendarHolidayEvent[];
};

export const getCalendarEvents = () => {
  return axiosInstance.get<CalendarEventsResponse>("calendar_events/");
};
