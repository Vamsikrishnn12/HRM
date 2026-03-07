import { api } from "@/lib/api";

// ─── Types ───

export interface PayrollComponent {
  name: string;
  amount: number;
}

export interface PayrollPreview {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  email: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  month: number;
  year: number;
  earnings: PayrollComponent[];
  deductions: PayrollComponent[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  workingDays: number;
  eligibleWorkingDays: number;
  payableDays: number;
  presentDays: number;
  leaveDays: number;
  lopDays: number;
  bankAccount: string;
  uan: string;
  pfEmployeeContribution: number;
  pfEmployerContribution: number;
}

export interface PayrollRecord {
  id: string;
  payrollRunId: string | null;
  employeeId: string;
  month: number;
  year: number;
  employeeSnapshot: {
    employeeName?: string;
    employeeCode?: string;
    email?: string;
    designation?: string;
    department?: string;
    [key: string]: unknown;
  };
  attendanceSnapshot: Record<string, unknown>;
  earnings: PayrollComponent[];
  deductions: PayrollComponent[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  workingDays: number;
  eligibleWorkingDays: number;
  payableDays: number;
  presentDays: number;
  leaveDays: number;
  lopDays: number;
  status: "DRAFT" | "GENERATED" | "EMAILED" | "FAILED";
  source: "MANUAL" | "BULK_UPLOAD" | "SYSTEM_AUTO";
  remarks: string | null;
  hasPayslip: boolean;
  payslipFileName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  totalEmployees: number;
  successCount: number;
  failedCount: number;
  createdBy: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ImportJobStatus {
  id: string;
  payrollRunId: string;
  originalFileName: string;
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  status: string;
  progressPercentage: number;
  errorSummary: { row: number; employeeId?: string; message: string }[];
  createdAt: string;
}

export interface PayrollSummary {
  totalRecords: number;
  generated: number;
  emailed: number;
  draft: number;
  failed: number;
  totalPayout: number;
}

// ─── API ───

const BASE = "/payroll";

export const payrollApi = {
  // Admin
  preview: (data: { employeeId: string; month: number; year: number }) =>
    api.post<PayrollPreview>(`${BASE}/preview`, data),

  generate: (data: {
    employeeId: string;
    month: number;
    year: number;
    earnings: PayrollComponent[];
    deductions: PayrollComponent[];
    workingDays?: number;
    payableDays?: number;
    presentDays?: number;
    leaveDays?: number;
    lopDays?: number;
    remarks?: string;
  }) => api.post<PayrollRecord>(`${BASE}/generate`, data),

  bulkImport: (formData: FormData) =>
    api.postFormData<{ runId: string; jobId: string; totalRows: number; parseErrors: number }>(
      `${BASE}/import`,
      formData,
    ),

  importStatus: (jobId: string) =>
    api.get<ImportJobStatus>(`${BASE}/import/${jobId}`),

  summary: (month: number, year: number) =>
    api.get<PayrollSummary>(`${BASE}/summary?month=${month}&year=${year}`),

  listRuns: (filters?: { month?: number; year?: number }) => {
    const params = new URLSearchParams();
    if (filters?.month) params.set("month", String(filters.month));
    if (filters?.year) params.set("year", String(filters.year));
    const qs = params.toString();
    return api.get<PayrollRun[]>(`${BASE}/runs${qs ? `?${qs}` : ""}`);
  },

  listRecords: (filters?: { month?: number; year?: number; status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.month) params.set("month", String(filters.month));
    if (filters?.year) params.set("year", String(filters.year));
    if (filters?.status) params.set("status", filters.status);
    if (filters?.search) params.set("search", filters.search);
    const qs = params.toString();
    return api.get<PayrollRecord[]>(`${BASE}/records${qs ? `?${qs}` : ""}`);
  },

  getRecord: (id: string) => api.get<PayrollRecord>(`${BASE}/records/${id}`),

  emailPayslip: (id: string) => api.post(`${BASE}/records/${id}/email`),

  downloadTemplate: () => `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}${BASE}/template`,

  downloadTemplateFile: () =>
    api.downloadBlob(`${BASE}/template`, 'payroll_template.xlsx'),

  downloadPayslipUrl: (id: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}${BASE}/records/${id}/download`,

  downloadPayslip: (id: string) =>
    api.downloadBlob(`${BASE}/records/${id}/download`, `payslip_${id}.pdf`),

  downloadMyPayslipPdf: (id: string) =>
    api.downloadBlob(`${BASE}/my-payslips/${id}/download`, `payslip_${id}.pdf`),

  // Employee
  myPayslips: (year?: number) => {
    const qs = year ? `?year=${year}` : "";
    return api.get<PayrollRecord[]>(`${BASE}/my-payslips${qs}`);
  },

  myPayslipDetail: (id: string) =>
    api.get<PayrollRecord>(`${BASE}/my-payslips/${id}`),

  myPayslipDownloadUrl: (id: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}${BASE}/my-payslips/${id}/download`,
};
