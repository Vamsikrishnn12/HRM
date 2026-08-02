import { api } from "@/lib/api";

export interface HrAccessRecord {
  id: string;
  employeeId: string;
  loginEmail: string;
  isActive: boolean;
  grantedAt: string;
  revokedAt: string | null;
  lastLoginAt: string | null;
  employee: { firstName: string; lastName: string; email: string; empId: string | null };
}

export const hrAccessApi = {
  list: () => api.get<HrAccessRecord[]>("/hr-access"),
  grant: (payload: { employeeId: string; loginEmail: string; password: string }) =>
    api.post<{ grant: HrAccessRecord; emailSent: boolean; emailError?: string }>("/hr-access", payload),
  revoke: (id: string) => api.post<{ id: string; isActive: false }>(`/hr-access/${id}/revoke`),
};
