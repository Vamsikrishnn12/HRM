import { api } from "@/lib/api";
import type {
  EmployeeFromAPI,
  DropdownEmployee,
  CreateEmployeePayload,
  CreateEmployeeResult,
  PersonalForm,
} from "@/types";

export const employeeApi = {
  list: () =>
    api.get<{ data: EmployeeFromAPI[]; total: number }>("/employees"),

  getByUserId: (userId: string) =>
    api.get<any>(`/employees/user/${userId}`),

  getById: (id: string) =>
    api.get<EmployeeFromAPI>(`/employees/${id}`),

  create: (payload: CreateEmployeePayload) =>
    api.post<CreateEmployeeResult>("/employees", payload),

  update: (id: string, payload: Record<string, unknown>) =>
    api.patch(`/employees/${id}`, payload),

  dropdown: () =>
    api.get<DropdownEmployee[]>("/employees/dropdown"),

  savePersonal: (userId: string, data: PersonalForm) =>
    api.put(`/employees/${userId}/personal`, data),

  saveSalary: (userId: string, data: Record<string, unknown>) =>
    api.put(`/employees/${userId}/salary`, data),

  uploadDocuments: (userId: string, formData: FormData) =>
    api.postFormData(`/employees/${userId}/documents`, formData),
};
