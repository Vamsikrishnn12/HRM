import { SalaryDetailsRepository } from '../repositories/salaryDetails.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
import { ApiError } from '../utils/apiError';

interface SalaryInput {
  ctc?: number;
  basic?: number;
  hra?: number;
  allowances?: number;
  pfApplicable?: boolean;
  pfEmployeeContribution?: number;
  pfEmployerContribution?: number;
  taxRegime?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
  panNumber?: string;
  uanNumber?: string;
}

export class SalaryDetailsService {
  private salaryRepo: SalaryDetailsRepository;
  private employeeRepo: EmployeeRepository;

  constructor() {
    this.salaryRepo = new SalaryDetailsRepository();
    this.employeeRepo = new EmployeeRepository();
  }

  async listAll() {
    const records = await this.salaryRepo.findAll();
    return {
      data: records.map((r) => this.formatRecord(r)),
      total: records.length,
    };
  }

  async getById(id: string) {
    const record = await this.salaryRepo.findById(id);
    if (!record) {
      throw ApiError.notFound('Salary details not found', 'SALARY_NOT_FOUND');
    }
    return this.formatRecord(record);
  }

  async getByUserId(userId: string) {
    const record = await this.salaryRepo.findByUserId(userId);
    if (!record) {
      throw ApiError.notFound('Salary details not found', 'SALARY_NOT_FOUND');
    }
    return this.formatRecord(record);
  }

  async saveSalary(userId: string, input: SalaryInput) {
    const profile = await this.employeeRepo.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Employee not found', 'EMPLOYEE_NOT_FOUND');
    }

    const record = await this.salaryRepo.upsertByUserId(userId, {
      ctc: input.ctc ?? 0,
      basic: input.basic ?? 0,
      hra: input.hra ?? 0,
      allowances: input.allowances ?? 0,
      pfApplicable: input.pfApplicable ?? true,
      pfEmployeeContribution: input.pfEmployeeContribution ?? 0,
      pfEmployerContribution: input.pfEmployerContribution ?? 0,
      taxRegime: input.taxRegime || 'New',
      accountNumber: input.accountNumber || null,
      ifscCode: input.ifscCode || null,
      bankName: input.bankName || null,
      branchName: input.branchName || null,
      panNumber: input.panNumber || null,
      uanNumber: input.uanNumber || null,
    });

    return this.formatRecord(record);
  }

  async updateById(id: string, input: SalaryInput) {
    const existing = await this.salaryRepo.findById(id);
    if (!existing) {
      throw ApiError.notFound('Salary details not found', 'SALARY_NOT_FOUND');
    }

    await this.salaryRepo.update(id, {
      ctc: input.ctc ?? 0,
      basic: input.basic ?? 0,
      hra: input.hra ?? 0,
      allowances: input.allowances ?? 0,
      pfApplicable: input.pfApplicable ?? true,
      pfEmployeeContribution: input.pfEmployeeContribution ?? 0,
      pfEmployerContribution: input.pfEmployerContribution ?? 0,
      taxRegime: input.taxRegime || 'New',
      accountNumber: input.accountNumber || null,
      ifscCode: input.ifscCode || null,
      bankName: input.bankName || null,
      branchName: input.branchName || null,
      panNumber: input.panNumber || null,
      uanNumber: input.uanNumber || null,
    });

    return this.getById(id);
  }

  private formatRecord(r: any) {
    return {
      id: r.id,
      userId: r.userId,
      ctc: parseFloat(r.ctc) || 0,
      basic: parseFloat(r.basic) || 0,
      hra: parseFloat(r.hra) || 0,
      allowances: parseFloat(r.allowances) || 0,
      pfApplicable: r.pfApplicable ?? true,
      pfEmployeeContribution: parseFloat(r.pfEmployeeContribution) || 0,
      pfEmployerContribution: parseFloat(r.pfEmployerContribution) || 0,
      taxRegime: r.taxRegime || 'New',
      accountNumber: r.accountNumber || '',
      ifscCode: r.ifscCode || '',
      bankName: r.bankName || '',
      branchName: r.branchName || '',
      panNumber: r.panNumber || '',
      uanNumber: r.uanNumber || '',
      employeeName: r.user ? `${r.user.firstName} ${r.user.lastName}` : '',
      empId: r.user?.empId || '',
      email: r.user?.email || '',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}
