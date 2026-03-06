import * as XLSX from 'xlsx';
import type { PayrollComponent } from '../entities/PayrollRecord.entity';

// Column alias map — normalize different column header formats to canonical names
const COLUMN_ALIASES: Record<string, string> = {
  // Identity
  employeeid: 'employeeId',
  employee_id: 'employeeId',
  emp_id: 'employeeId',
  empid: 'employeeId',
  employeecode: 'employeeCode',
  employee_code: 'employeeCode',
  emp_code: 'employeeCode',
  empcode: 'employeeCode',
  employeename: 'employeeName',
  employee_name: 'employeeName',
  name: 'employeeName',
  email: 'email',
  emailid: 'email',
  email_id: 'email',

  // Salary structure
  ctc: 'ctc',
  gross: 'gross',
  grosssalary: 'gross',
  gross_salary: 'gross',
  basic: 'basic',
  basicsalary: 'basic',
  basic_salary: 'basic',
  hra: 'hra',
  conveyance: 'conveyance',
  conveyanceallowance: 'conveyance',
  specialallowance: 'specialAllowance',
  special_allowance: 'specialAllowance',
  allowances: 'allowances',
  bonus: 'bonus',
  incentive: 'incentive',
  incentives: 'incentive',
  arrears: 'arrears',
  otherearnings: 'otherEarnings',
  other_earnings: 'otherEarnings',
  retentionbonus: 'retentionBonus',
  retention_bonus: 'retentionBonus',
  joiningbonus: 'joiningBonus',
  joining_bonus: 'joiningBonus',
  reimbursement: 'reimbursement',

  // Deductions
  pf: 'pf',
  providentfund: 'pf',
  provident_fund: 'pf',
  epf: 'pf',
  esi: 'esi',
  pt: 'pt',
  professionaltax: 'pt',
  professional_tax: 'pt',
  tds: 'tds',
  tax: 'tds',
  incometax: 'tds',
  income_tax: 'tds',
  lopdeduction: 'lopDeduction',
  lop_deduction: 'lopDeduction',
  salaryadvance: 'salaryAdvance',
  salary_advance: 'salaryAdvance',
  otherdeductions: 'otherDeductions',
  other_deductions: 'otherDeductions',
  penalty: 'penalty',

  // Work info
  lopdays: 'lopDays',
  lop_days: 'lopDays',
  lop: 'lopDays',
  workingdays: 'workingDays',
  working_days: 'workingDays',
  payabledays: 'payableDays',
  payable_days: 'payableDays',
  presentdays: 'presentDays',
  present_days: 'presentDays',
  leavedays: 'leaveDays',
  leave_days: 'leaveDays',
  netpay: 'netPay',
  net_pay: 'netPay',
  netsalary: 'netPay',
  net_salary: 'netPay',
};

// Earning fields (canonical names)
const EARNING_FIELDS = new Set([
  'basic', 'hra', 'conveyance', 'specialAllowance', 'allowances', 'bonus',
  'incentive', 'arrears', 'otherEarnings', 'retentionBonus', 'joiningBonus',
  'reimbursement',
]);

// Deduction fields (canonical names)
const DEDUCTION_FIELDS = new Set([
  'pf', 'esi', 'pt', 'tds', 'lopDeduction', 'salaryAdvance',
  'otherDeductions', 'penalty',
]);

export interface ParsedRow {
  rowNumber: number;
  employeeId?: string;
  employeeCode?: string;
  employeeName?: string;
  email?: string;
  earnings: PayrollComponent[];
  deductions: PayrollComponent[];
  gross?: number;
  netPay?: number;
  ctc?: number;
  lopDays?: number;
  workingDays?: number;
  payableDays?: number;
  presentDays?: number;
  leaveDays?: number;
  rawData: Record<string, unknown>;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: { row: number; message: string }[];
  totalRows: number;
}

export function parsePayrollExcel(filePath: string): ParseResult {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: [{ row: 0, message: 'No sheets found in workbook' }], totalRows: 0 };
  }

  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: null,
  });

  if (rawRows.length === 0) {
    return { rows: [], errors: [{ row: 0, message: 'Excel sheet is empty' }], totalRows: 0 };
  }

  // Build column map from first row headers
  const headers = Object.keys(rawRows[0]);
  const columnMap: Record<string, string> = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/[\s\-_.]+/g, '');
    const canonical = COLUMN_ALIASES[normalized];
    if (canonical) {
      columnMap[header] = canonical;
    }
  }

  const rows: ParsedRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const rowNum = i + 2; // 1-indexed + header row

    // Normalize row using column map
    const mapped: Record<string, unknown> = {};
    for (const [origKey, val] of Object.entries(raw)) {
      const canonical = columnMap[origKey];
      if (canonical) {
        mapped[canonical] = val;
      } else {
        mapped[origKey] = val;
      }
    }

    // Must have at least one identity field
    const empId = strVal(mapped.employeeId);
    const empCode = strVal(mapped.employeeCode);
    const email = strVal(mapped.email);
    const empName = strVal(mapped.employeeName);

    if (!empId && !empCode && !email) {
      errors.push({ row: rowNum, message: 'Missing identity field (employeeId, employeeCode, or email)' });
      continue;
    }

    // Build earnings array from mapped fields
    const earnings: PayrollComponent[] = [];
    for (const field of EARNING_FIELDS) {
      const val = numVal(mapped[field]);
      if (val !== null && val > 0) {
        earnings.push({ name: toLabel(field), amount: val });
      }
    }

    // Build deductions array from mapped fields
    const deductions: PayrollComponent[] = [];
    for (const field of DEDUCTION_FIELDS) {
      const val = numVal(mapped[field]);
      if (val !== null && val > 0) {
        deductions.push({ name: toLabel(field), amount: val });
      }
    }

    rows.push({
      rowNumber: rowNum,
      employeeId: empId || undefined,
      employeeCode: empCode || undefined,
      employeeName: empName || undefined,
      email: email || undefined,
      earnings,
      deductions,
      gross: numVal(mapped.gross) ?? undefined,
      netPay: numVal(mapped.netPay) ?? undefined,
      ctc: numVal(mapped.ctc) ?? undefined,
      lopDays: numVal(mapped.lopDays) ?? undefined,
      workingDays: numVal(mapped.workingDays) ?? undefined,
      payableDays: numVal(mapped.payableDays) ?? undefined,
      presentDays: numVal(mapped.presentDays) ?? undefined,
      leaveDays: numVal(mapped.leaveDays) ?? undefined,
      rawData: mapped,
    });
  }

  return { rows, errors, totalRows: rawRows.length };
}

function strVal(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s.length > 0 ? s : null;
}

function numVal(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function toLabel(field: string): string {
  // camelCase → Title Case
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
