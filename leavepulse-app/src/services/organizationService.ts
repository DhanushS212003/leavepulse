import { axiosInstance } from "../axios";

export type Organization = {
  name: string;
  is_leave_balance_generated: boolean;
};

export type OrganizationResponse = {
  organization: Organization;
};

export const getOrganization = (id: number) => {
  return axiosInstance.get<OrganizationResponse>(`organizations/${id}/`);
};

export const patchOrganization = (
  id: number,
  data: {
    name: string;
  }
) => {
  return axiosInstance.patch<OrganizationResponse>(
    `organizations/${id}/`,
    data
  );
};

export const generateLeaveBalances = (id: number) => {
  return axiosInstance.post<OrganizationResponse>(
    `organizations/${id}/generate_leave_balances/`
  );
};
