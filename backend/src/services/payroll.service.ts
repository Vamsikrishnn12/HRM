import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User.entity';
import { EmployeeProfile } from '../entities/EmployeeProfile.entity';
import { SalaryDetails } from '../entities/SalaryDetails.entity';
import { Attendance, AttendanceStatus } from '../entities/Attendance.entity';
import { LeaveRequest, LeaveStatus, LeaveType } from '../entities/LeaveRequest.entity';
import { PayrollRecord, PayrollRecordStatus, PayrollSource, PayrollComponent } from '../entities/PayrollRecord.entity';
import { PayrollRun, PayrollRunStatus } from '../entities/PayrollRun.entity';
import { ImportJobStatus } from '../entities/PayrollImportJob.entity';
import { PayrollRepository } from '../repositories/payroll.repository';
import { generatePayslipPdf, PayslipData } from './pdf.service';
import { parsePayrollExcel, ParsedRow } from './excel.service';
import { EmailService } from './email.service';
import { ApiError } from '../utils/apiError';
import { env } from '../config/env';
import { transporter } from '../config/mail';

const emailService = new EmailService();

export class PayrollService {
  private repo: PayrollRepository;

  constructor() {
    this.repo = new PayrollRepository();
  }

  // ─── Preview payroll for a single employee (auto-fill from system data) ───

  async previewPayroll(employeeId: string, month: number, year: number) {
    const { user, profile, salary } = await this.resolveEmployee(employeeId);
    const attendance = await this.computeAttendance(employeeId, month, year);

    const earnings: PayrollComponent[] = [];
    const deductions: PayrollComponent[] = [];

    if (salary) {
      // Prefer dynamic JSONB arrays; fall back to legacy fixed fields
      if (Array.isArray(salary.earnings) && salary.earnings.length > 0) {
        salary.earnings.forEach((e: any) => {
          if (Number(e.amount) > 0) earnings.push({ name: e.name, amount: Number(e.amount) });
        });
      } else {
        if (Number(salary.basic) > 0) earnings.push({ name: 'Basic', amount: Number(salary.basic) });
        if (Number(salary.hra) > 0) earnings.push({ name: 'HRA', amount: Number(salary.hra) });
        if (Number(salary.allowances) > 0) earnings.push({ name: 'Allowances', amount: Number(salary.allowances) });
      }

      if (Array.isArray(salary.deductions) && salary.deductions.length > 0) {
        salary.deductions.forEach((d: any) => {
          if (Number(d.amount) > 0) deductions.push({ name: d.name, amount: Number(d.amount) });
        });
      } else if (salary.pfApplicable && Number(salary.pfEmployeeContribution) > 0) {
        deductions.push({ name: 'PF', amount: Number(salary.pfEmployeeContribution) });
      }
    }

    const grossEarnings = earnings.reduce((s, e) => s + e.amount, 0);
    const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
    const netPay = grossEarnings - totalDeductions;

    return {
      employeeId: user.id,
      employeeName: `${user.firstName} ${user.lastName}`,
      employeeCode: user.empId || '',
      email: user.email,
      designation: profile?.designation || '',
      department: profile?.department || '',
      dateOfJoining: profile?.dateOfJoining || '',
      month,
      year,
      earnings,
      deductions,
      grossEarnings: round2(grossEarnings),
      totalDeductions: round2(totalDeductions),
      netPay: round2(netPay),
      ...attendance,
      pan: salary?.panNumber || '',
      bankAccount: salary?.accountNumber || '',
      uan: salary?.uanNumber || '',
    };
  }

  // ─── Generate single manual payroll ───

  async generateManual(input: {
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
    adminId?: string;
  }) {
    const { user, profile, salary } = await this.resolveEmployee(input.employeeId);

    // Check for duplicate
    const existing = await this.repo.findExistingRecord(input.employeeId, input.month, input.year);
    if (existing && existing.status !== PayrollRecordStatus.DRAFT) {
      throw ApiError.conflict(
        `Payroll already generated for ${user.firstName} ${user.lastName} — ${input.month}/${input.year}`,
        'PAYROLL_DUPLICATE',
      );
    }

    const attendance = await this.computeAttendance(input.employeeId, input.month, input.year);

    const grossEarnings = round2(input.earnings.reduce((s, e) => s + e.amount, 0));
    const totalDeductions = round2(input.deductions.reduce((s, d) => s + d.amount, 0));
    const netPay = round2(grossEarnings - totalDeductions);

    const employeeSnapshot = {
      employeeName: `${user.firstName} ${user.lastName}`,
      employeeCode: user.empId || '',
      email: user.email,
      designation: profile?.designation || '',
      department: profile?.department || '',
      dateOfJoining: profile?.dateOfJoining || '',
      pan: salary?.panNumber || '',
      bankAccount: salary?.accountNumber || '',
      uan: salary?.uanNumber || '',
    };

    const record = existing
      ? Object.assign(existing, {
          earnings: input.earnings,
          deductions: input.deductions,
          grossEarnings,
          totalDeductions,
          netPay,
          workingDays: input.workingDays ?? attendance.workingDays,
          payableDays: input.payableDays ?? attendance.payableDays,
          presentDays: input.presentDays ?? attendance.presentDays,
          leaveDays: input.leaveDays ?? attendance.leaveDays,
          lopDays: input.lopDays ?? attendance.lopDays,
          employeeSnapshot,
          attendanceSnapshot: attendance,
          source: PayrollSource.MANUAL,
          status: PayrollRecordStatus.GENERATED,
          remarks: input.remarks || null,
        })
      : await this.repo.createRecord({
          employeeId: input.employeeId,
          month: input.month,
          year: input.year,
          earnings: input.earnings,
          deductions: input.deductions,
          grossEarnings,
          totalDeductions,
          netPay,
          workingDays: input.workingDays ?? attendance.workingDays,
          payableDays: input.payableDays ?? attendance.payableDays,
          presentDays: input.presentDays ?? attendance.presentDays,
          leaveDays: input.leaveDays ?? attendance.leaveDays,
          lopDays: input.lopDays ?? attendance.lopDays,
          employeeSnapshot,
          attendanceSnapshot: attendance,
          source: PayrollSource.MANUAL,
          status: PayrollRecordStatus.GENERATED,
          remarks: input.remarks || null,
        });

    const saved = existing ? await this.repo.saveRecord(record) : record;

    // Generate PDF
    await this.generateAndAttachPdf(saved, employeeSnapshot);

    return this.formatRecord(await this.repo.findRecordById(saved.id) as PayrollRecord);
  }

  // ─── Bulk import ───

  async startBulkImport(filePath: string, originalFileName: string, month: number, year: number, adminId?: string) {
    // Create payroll run
    const run = await this.repo.createRun({
      month,
      year,
      status: PayrollRunStatus.PROCESSING,
      createdBy: adminId || null,
    });

    // Parse Excel
    const parseResult = parsePayrollExcel(filePath);

    // Create import job
    const job = await this.repo.createJob({
      payrollRunId: run.id,
      originalFileName,
      filePath,
      totalRows: parseResult.totalRows,
      status: ImportJobStatus.PROCESSING,
      errorSummary: parseResult.errors,
      failedRows: parseResult.errors.length,
    });

    // Process asynchronously
    this.processBulkInBackground(run.id, job.id, parseResult.rows, month, year).catch((err) =>
      console.error('Bulk payroll processing error:', err),
    );

    return { runId: run.id, jobId: job.id, totalRows: parseResult.totalRows, parseErrors: parseResult.errors.length };
  }

  private async processBulkInBackground(
    runId: string,
    jobId: string,
    rows: ParsedRow[],
    month: number,
    year: number,
  ) {
    const BATCH_SIZE = 20;
    let successCount = 0;
    let failedCount = 0;
    const errors: { row: number; employeeId?: string; message: string }[] = [];

    const job = await this.repo.findJobById(jobId);
    const existingErrors = job?.errorSummary || [];
    errors.push(...existingErrors);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      for (const row of batch) {
        try {
          await this.processOneRow(row, month, year, runId);
          successCount++;
        } catch (err: any) {
          failedCount++;
          errors.push({
            row: row.rowNumber,
            employeeId: row.employeeId || row.employeeCode || row.email,
            message: err.message || 'Unknown error',
          });
        }
      }

      // Update progress
      const processed = Math.min(i + BATCH_SIZE, rows.length);
      const pct = Math.round((processed / rows.length) * 100);
      await this.repo.updateJob(jobId, {
        processedRows: processed,
        successRows: successCount,
        failedRows: failedCount + (existingErrors.length),
        progressPercentage: pct,
        errorSummary: errors,
      } as any);
    }

    // Finalize
    const finalStatus =
      failedCount === 0 && existingErrors.length === 0
        ? ImportJobStatus.COMPLETED
        : successCount === 0
          ? ImportJobStatus.FAILED
          : ImportJobStatus.PARTIAL_SUCCESS;

    await this.repo.updateJob(jobId, {
      status: finalStatus,
      processedRows: rows.length,
      successRows: successCount,
      failedRows: failedCount + existingErrors.length,
      progressPercentage: 100,
      errorSummary: errors,
    } as any);

    const runStatus =
      finalStatus === ImportJobStatus.COMPLETED
        ? PayrollRunStatus.COMPLETED
        : finalStatus === ImportJobStatus.FAILED
          ? PayrollRunStatus.FAILED
          : PayrollRunStatus.PARTIAL_SUCCESS;

    await this.repo.updateRun(runId, {
      status: runStatus,
      totalEmployees: rows.length,
      successCount,
      failedCount: failedCount + existingErrors.length,
      completedAt: new Date(),
    } as any);
  }

  private async processOneRow(row: ParsedRow, month: number, year: number, runId: string) {
    // Resolve employee
    const user = await this.findUserByRow(row);
    if (!user) throw new Error(`Employee not found for row ${row.rowNumber}`);

    const { profile, salary } = await this.resolveEmployeeData(user.id);
    const attendance = await this.computeAttendance(user.id, month, year);

    // Smart merge: Excel fields override system, missing fields fallback to system
    const earnings = this.mergeEarnings(row.earnings, salary);
    const deductions = this.mergeDeductions(row.deductions, salary);

    const grossEarnings = round2(earnings.reduce((s, e) => s + e.amount, 0));
    const totalDeductions = round2(deductions.reduce((s, d) => s + d.amount, 0));
    const netPay = round2(grossEarnings - totalDeductions);

    const employeeSnapshot = {
      employeeName: `${user.firstName} ${user.lastName}`,
      employeeCode: user.empId || '',
      email: user.email,
      designation: profile?.designation || '',
      department: profile?.department || '',
      dateOfJoining: profile?.dateOfJoining || '',
      pan: salary?.panNumber || '',
      bankAccount: salary?.accountNumber || '',
      uan: salary?.uanNumber || '',
    };

    // Check for existing
    const existing = await this.repo.findExistingRecord(user.id, month, year);
    if (existing && existing.status !== PayrollRecordStatus.DRAFT) {
      throw new Error(`Payroll already exists for ${user.empId || user.email} — ${month}/${year}`);
    }

    const record = existing
      ? await this.repo.saveRecord(
          Object.assign(existing, {
            payrollRunId: runId,
            earnings,
            deductions,
            grossEarnings,
            totalDeductions,
            netPay,
            workingDays: row.workingDays ?? attendance.workingDays,
            payableDays: row.payableDays ?? attendance.payableDays,
            presentDays: row.presentDays ?? attendance.presentDays,
            leaveDays: row.leaveDays ?? attendance.leaveDays,
            lopDays: row.lopDays ?? attendance.lopDays,
            employeeSnapshot,
            attendanceSnapshot: attendance,
            source: PayrollSource.BULK_UPLOAD,
            status: PayrollRecordStatus.GENERATED,
          }),
        )
      : await this.repo.createRecord({
          payrollRunId: runId,
          employeeId: user.id,
          month,
          year,
          earnings,
          deductions,
          grossEarnings,
          totalDeductions,
          netPay,
          workingDays: row.workingDays ?? attendance.workingDays,
          payableDays: row.payableDays ?? attendance.payableDays,
          presentDays: row.presentDays ?? attendance.presentDays,
          leaveDays: row.leaveDays ?? attendance.leaveDays,
          lopDays: row.lopDays ?? attendance.lopDays,
          employeeSnapshot,
          attendanceSnapshot: attendance,
          source: PayrollSource.BULK_UPLOAD,
          status: PayrollRecordStatus.GENERATED,
        });

    // Generate PDF
    await this.generateAndAttachPdf(record, employeeSnapshot);
  }

  // ─── PDF generation helper ───

  private async generateAndAttachPdf(
    record: PayrollRecord,
    snapshot: Record<string, unknown>,
  ) {
    const data: PayslipData = {
      companyName: 'HRMS',
      companyAddress: '',
      employeeName: String(snapshot.employeeName || ''),
      employeeCode: String(snapshot.employeeCode || ''),
      designation: String(snapshot.designation || ''),
      department: String(snapshot.department || ''),
      dateOfJoining: String(snapshot.dateOfJoining || ''),
      pan: String(snapshot.pan || ''),
      bankAccount: String(snapshot.bankAccount || ''),
      uan: String(snapshot.uan || ''),
      month: record.month,
      year: record.year,
      workingDays: Number(record.workingDays) || 0,
      payableDays: Number(record.payableDays) || 0,
      presentDays: Number(record.presentDays) || 0,
      leaveDays: Number(record.leaveDays) || 0,
      lopDays: Number(record.lopDays) || 0,
      earnings: record.earnings,
      deductions: record.deductions,
      grossEarnings: Number(record.grossEarnings),
      totalDeductions: Number(record.totalDeductions),
      netPay: Number(record.netPay),
    };

    // Try to get org settings for company name
    try {
      const settingsRepo = AppDataSource.getRepository('org_settings');
      const org = await settingsRepo.findOne({ where: { key: 'companyName' } });
      if (org) data.companyName = (org as any).value;
      const addr = await settingsRepo.findOne({ where: { key: 'companyAddress' } });
      if (addr) data.companyAddress = (addr as any).value;
    } catch {
      // OrgSettings might not have these keys — use defaults
    }

    const fileName = `payslip_${String(snapshot.employeeCode || record.employeeId).replace(/[^a-zA-Z0-9]/g, '_')}_${record.month}_${record.year}.pdf`;
    const result = await generatePayslipPdf(data, fileName);

    // Check if document already exists
    const existingDoc = await this.repo.findDocByRecordId(record.id);
    if (existingDoc) {
      await this.repo.updateDocument(existingDoc.id, {
        fileName: result.fileName,
        filePath: result.filePath,
      } as any);
    } else {
      await this.repo.createDocument({
        payrollRecordId: record.id,
        fileName: result.fileName,
        filePath: result.filePath,
      });
    }
  }

  // ─── Email payslip ───

  async emailPayslip(recordId: string) {
    const record = await this.repo.findRecordById(recordId);
    if (!record) throw ApiError.notFound('Payroll record not found');
    if (record.status === PayrollRecordStatus.DRAFT)
      throw ApiError.badRequest('Cannot email a draft payslip');

    const email = (record.employeeSnapshot as any)?.email;
    if (!email) throw ApiError.badRequest('Employee email not available');

    const doc = record.payslipDocument || (await this.repo.findDocByRecordId(recordId));
    if (!doc || !fs.existsSync(doc.filePath))
      throw ApiError.badRequest('Payslip PDF not found — regenerate first');

    const empName = (record.employeeSnapshot as any)?.employeeName || 'Employee';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const periodStr = `${monthNames[record.month - 1]} ${record.year}`;

    if (transporter && env.SMTP_FROM) {
      await transporter.sendMail({
        from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM}>`,
        to: email,
        subject: `Your Payslip for ${periodStr}`,
        html: buildPayslipEmailHtml(empName, periodStr),
        attachments: [{ filename: doc.fileName, path: doc.filePath }],
      });

      await this.repo.updateRecord(record.id, { status: PayrollRecordStatus.EMAILED } as any);
      await this.repo.updateDocument(doc.id, { emailedAt: new Date() } as any);
    } else {
      console.log(`SMTP not configured — payslip email for ${empName}:`, { email, file: doc.filePath });
      await this.repo.updateRecord(record.id, { status: PayrollRecordStatus.EMAILED } as any);
    }

    return { message: `Payslip emailed to ${email}` };
  }

  // ─── List endpoints ───

  async listRuns(filters?: { month?: number; year?: number }) {
    const runs = await this.repo.findRuns(filters);
    return runs.map((r) => ({
      id: r.id,
      month: r.month,
      year: r.year,
      status: r.status,
      totalEmployees: r.totalEmployees,
      successCount: r.successCount,
      failedCount: r.failedCount,
      createdBy: r.createdBy,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
    }));
  }

  async listRecords(filters?: {
    month?: number;
    year?: number;
    status?: PayrollRecordStatus;
    search?: string;
  }) {
    const records = await this.repo.findRecords(filters);
    return records.map((r) => this.formatRecord(r));
  }

  async getRecord(recordId: string) {
    const record = await this.repo.findRecordById(recordId);
    if (!record) throw ApiError.notFound('Payroll record not found');
    return this.formatRecord(record);
  }

  async getEmployeePayslips(employeeId: string, year?: number) {
    const records = await this.repo.findRecordsByEmployee(employeeId, { year });
    return records.map((r) => this.formatRecord(r));
  }

  async getImportJobStatus(jobId: string) {
    const job = await this.repo.findJobById(jobId);
    if (!job) throw ApiError.notFound('Import job not found');
    return {
      id: job.id,
      payrollRunId: job.payrollRunId,
      originalFileName: job.originalFileName,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      successRows: job.successRows,
      failedRows: job.failedRows,
      status: job.status,
      progressPercentage: job.progressPercentage,
      errorSummary: job.errorSummary,
      createdAt: job.createdAt,
    };
  }

  async getSummary(month: number, year: number) {
    const total = await this.repo.countRecords({ month, year });
    const generated = await this.repo.countRecords({ month, year, status: PayrollRecordStatus.GENERATED });
    const emailed = await this.repo.countRecords({ month, year, status: PayrollRecordStatus.EMAILED });
    const draft = await this.repo.countRecords({ month, year, status: PayrollRecordStatus.DRAFT });
    const failed = await this.repo.countRecords({ month, year, status: PayrollRecordStatus.FAILED });

    // Sum net pay from records
    const records = await this.repo.findRecords({ month, year });
    const totalPayout = records.reduce((s, r) => s + Number(r.netPay), 0);

    return {
      totalRecords: total,
      generated,
      emailed,
      draft,
      failed,
      totalPayout: round2(totalPayout),
    };
  }

  // ─── Download Excel template ───

  generateExcelTemplate(): Buffer {
    const wb = XLSX.utils.book_new();
    const headers = [
      'Employee ID', 'Employee Name', 'Email',
      'Basic', 'HRA', 'Allowances', 'Special Allowance', 'Bonus', 'Incentive', 'Arrears', 'Other Earnings',
      'PF', 'ESI', 'PT', 'TDS', 'LOP Deduction', 'Salary Advance', 'Other Deductions',
      'Working Days', 'Payable Days', 'Present Days', 'Leave Days', 'LOP Days',
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  // ─── Helpers ───

  private async resolveEmployee(employeeId: string) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: employeeId, isActive: true } });
    if (!user) throw ApiError.notFound('Employee not found');
    const { profile, salary } = await this.resolveEmployeeData(user.id);
    return { user, profile, salary };
  }

  private async resolveEmployeeData(userId: string) {
    const profileRepo = AppDataSource.getRepository(EmployeeProfile);
    const salaryRepo = AppDataSource.getRepository(SalaryDetails);
    const [profile, salary] = await Promise.all([
      profileRepo.findOne({ where: { userId } }),
      salaryRepo.findOne({ where: { userId } }),
    ]);
    return { profile, salary };
  }

  private async findUserByRow(row: ParsedRow): Promise<User | null> {
    const userRepo = AppDataSource.getRepository(User);
    if (row.employeeId) {
      // Try by empId first
      const u = await userRepo.findOne({ where: { empId: row.employeeId, isActive: true } });
      if (u) return u;
    }
    if (row.employeeCode) {
      const u = await userRepo.findOne({ where: { empId: row.employeeCode, isActive: true } });
      if (u) return u;
    }
    if (row.email) {
      const u = await userRepo.findOne({ where: { email: row.email, isActive: true } });
      if (u) return u;
    }
    return null;
  }

  private async computeAttendance(employeeId: string, month: number, year: number) {
    const attRepo = AppDataSource.getRepository(Attendance);
    const leaveRepo = AppDataSource.getRepository(LeaveRequest);

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Count total working days (exclude weekends — Sat/Sun)
    let workingDays = 0;
    for (let d = 1; d <= lastDay; d++) {
      const dayOfWeek = new Date(year, month - 1, d).getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++;
    }

    const attendances = await attRepo
      .createQueryBuilder('a')
      .where('a.employeeId = :employeeId', { employeeId })
      .andWhere('a.date >= :start AND a.date <= :end', { start: startDate, end: endDate })
      .getMany();

    let presentDays = 0;
    let leaveDays = 0;
    let lopDays = 0;

    for (const a of attendances) {
      if (a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE) {
        presentDays++;
      } else if (a.status === AttendanceStatus.HALF_DAY) {
        presentDays += 0.5;
      } else if (a.status === AttendanceStatus.LEAVE) {
        leaveDays++;
      }
    }

    // Count approved LOP leaves
    const lopLeaves = await leaveRepo
      .createQueryBuilder('lr')
      .where('lr.employeeId = :employeeId', { employeeId })
      .andWhere('lr.leaveType = :lop', { lop: LeaveType.LOP })
      .andWhere('lr.status = :approved', { approved: LeaveStatus.APPROVED })
      .andWhere(
        '((lr.startDate >= :start AND lr.startDate <= :end) OR (lr.date >= :start AND lr.date <= :end))',
        { start: startDate, end: endDate },
      )
      .getMany();

    for (const leave of lopLeaves) {
      lopDays += Number(leave.totalDays) || 0;
    }

    const payableDays = Math.max(0, workingDays - lopDays);

    return { workingDays, payableDays, presentDays, leaveDays, lopDays };
  }

  private mergeEarnings(excelEarnings: PayrollComponent[], salary: SalaryDetails | null): PayrollComponent[] {
    if (excelEarnings.length > 0) return excelEarnings;
    // Fallback: prefer dynamic JSONB array, then legacy fixed fields
    if (salary && Array.isArray(salary.earnings) && salary.earnings.length > 0) {
      return salary.earnings.filter((e: any) => Number(e.amount) > 0).map((e: any) => ({ name: e.name, amount: Number(e.amount) }));
    }
    const earnings: PayrollComponent[] = [];
    if (salary) {
      if (Number(salary.basic) > 0) earnings.push({ name: 'Basic', amount: Number(salary.basic) });
      if (Number(salary.hra) > 0) earnings.push({ name: 'HRA', amount: Number(salary.hra) });
      if (Number(salary.allowances) > 0) earnings.push({ name: 'Allowances', amount: Number(salary.allowances) });
    }
    return earnings;
  }

  private mergeDeductions(excelDeductions: PayrollComponent[], salary: SalaryDetails | null): PayrollComponent[] {
    if (excelDeductions.length > 0) return excelDeductions;
    if (salary && Array.isArray(salary.deductions) && salary.deductions.length > 0) {
      return salary.deductions.filter((d: any) => Number(d.amount) > 0).map((d: any) => ({ name: d.name, amount: Number(d.amount) }));
    }
    const deductions: PayrollComponent[] = [];
    if (salary && salary.pfApplicable && Number(salary.pfEmployeeContribution) > 0) {
      deductions.push({ name: 'PF', amount: Number(salary.pfEmployeeContribution) });
    }
    return deductions;
  }

  private formatRecord(r: PayrollRecord) {
    return {
      id: r.id,
      payrollRunId: r.payrollRunId,
      employeeId: r.employeeId,
      month: r.month,
      year: r.year,
      employeeSnapshot: r.employeeSnapshot,
      attendanceSnapshot: r.attendanceSnapshot,
      earnings: r.earnings,
      deductions: r.deductions,
      grossEarnings: Number(r.grossEarnings),
      totalDeductions: Number(r.totalDeductions),
      netPay: Number(r.netPay),
      workingDays: Number(r.workingDays),
      payableDays: Number(r.payableDays),
      presentDays: Number(r.presentDays),
      leaveDays: Number(r.leaveDays),
      lopDays: Number(r.lopDays),
      status: r.status,
      source: r.source,
      remarks: r.remarks,
      hasPayslip: !!r.payslipDocument,
      payslipFileName: r.payslipDocument?.fileName || null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildPayslipEmailHtml(empName: string, period: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;margin:0;padding:0;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
  <div style="background:#4F46E5;padding:24px 28px;"><h1 style="margin:0;color:#fff;font-size:20px;">HRMS</h1></div>
  <div style="padding:28px;">
    <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;">Hello <strong>${empName}</strong>,</p>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;">Your payslip for <strong>${period}</strong> is attached to this email.</p>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;">You can also view and download your payslips from the HRMS portal.</p>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">This is an automated message. Please do not reply.</p>
  </div>
  <div style="background:#f8fafc;padding:14px 28px;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-size:11px;color:#94a3b8;">&copy; ${new Date().getFullYear()} HRMS. All rights reserved.</p>
  </div>
</div>
</body></html>`;
}
