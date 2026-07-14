import { api } from "@/lib/api";
import type {
  OrganizationSalaryConfig,
  SalaryComputation,
  SalaryConfigVersion,
  SalaryPreviewInput,
} from "@/types";

export interface OrgSettings {
  id: string;
  companyName: string;
  companyAddress: string;
  workStartTime: string;
  workEndTime: string;
  lateGraceMinutes: number;
  halfDayMinMinutes: number;
  fullDayMinMinutes: number;
  weekOffDays: string;
  alternateSaturdayOffRule: "NONE" | "SECOND_FOURTH" | "FIRST_THIRD";
  officeLatitude: number | null;
  officeLongitude: number | null;
  officeRadiusMeters: number | null;
  geoFenceRequired: boolean;
  allowRemoteAttendance: boolean;
  updatedAt: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const settingsApi = {
  get: () => api.get<OrgSettings>("/settings"),

  update: (data: Partial<OrgSettings>) =>
    api.put<OrgSettings>("/settings", data),

  listHolidays: () =>
    api.get<{ data: Holiday[]; total: number }>("/settings/holidays"),

  createHoliday: (data: { date: string; name: string }) =>
    api.post<Holiday>("/settings/holidays", data),

  updateHoliday: (id: string, data: { date: string; name: string }) =>
    api.put<Holiday>(`/settings/holidays/${id}`, data),

  deleteHoliday: (id: string) =>
    api.delete(`/settings/holidays/${id}`),

  getSalaryConfig: () =>
    api.get<OrganizationSalaryConfig>("/settings/salary-config"),

  listSalaryConfigVersions: () =>
    api.get<SalaryConfigVersion[]>("/settings/salary-config/versions"),

  saveSalaryConfig: (payload: Omit<OrganizationSalaryConfig, "id" | "organizationId" | "version" | "active" | "createdAt" | "updatedAt">) =>
    api.put<OrganizationSalaryConfig>("/settings/salary-config", payload),

  previewSalaryConfig: (payload: {
    configInput?: Omit<OrganizationSalaryConfig, "id" | "organizationId" | "version" | "active" | "createdAt" | "updatedAt">;
    previewInput: SalaryPreviewInput;
  }) => api.post<SalaryComputation>("/settings/salary-config/preview", payload),

};
