import { api } from "@/lib/api";
import type {
  EmployeeFromAPI,
  DropdownEmployee,
  CreateEmployeePayload,
  CreateEmployeeResult,
  PersonalForm,
  PersonalDetailsRow,
  SalaryForm,
  SalaryDetailsRow,
  DocumentRow,
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

export const personalDetailsApi = {
  list: () =>
    api.get<{ data: PersonalDetailsRow[]; total: number }>("/personal-details"),

  getById: (id: string) =>
    api.get<PersonalDetailsRow>(`/personal-details/${id}`),

  getByUserId: (userId: string) =>
    api.get<PersonalDetailsRow>(`/personal-details/user/${userId}`),

  save: (userId: string, data: PersonalForm) =>
    api.put<PersonalDetailsRow>(`/personal-details/user/${userId}`, data),

  update: (id: string, data: PersonalForm) =>
    api.patch<PersonalDetailsRow>(`/personal-details/${id}`, data),
};

export const salaryDetailsApi = {
  list: () =>
    api.get<{ data: SalaryDetailsRow[]; total: number }>("/salary-details"),

  getById: (id: string) =>
    api.get<SalaryDetailsRow>(`/salary-details/${id}`),

  getByUserId: (userId: string) =>
    api.get<SalaryDetailsRow>(`/salary-details/user/${userId}`),

  save: (userId: string, data: Record<string, unknown>) =>
    api.put<SalaryDetailsRow>(`/salary-details/user/${userId}`, data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch<SalaryDetailsRow>(`/salary-details/${id}`, data),
};

export const documentsApi = {
  list: () =>
    api.get<{ data: DocumentRow[]; total: number }>("/documents"),

  getByUserId: (userId: string) =>
    api.get<{ data: DocumentRow[]; total: number }>(`/documents/user/${userId}`),

  upload: (userId: string, formData: FormData) =>
    api.postFormData<DocumentRow[]>(`/documents/user/${userId}`, formData),

  remove: (id: string) =>
    api.delete(`/documents/${id}`),
};
