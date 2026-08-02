import { AppDataSource } from '../config/database';
import { HrPortalAccess } from '../entities/HrPortalAccess.entity';
import { User, UserRole } from '../entities/User.entity';
import { ApiError } from '../utils/apiError';
import { hashPassword } from '../utils/password';
import { EmailService } from './email.service';
import { env } from '../config/env';

export class HrAccessService {
  private repo = AppDataSource.getRepository(HrPortalAccess);
  private users = AppDataSource.getRepository(User);
  private email = new EmailService();

  async list() {
    const grants = await this.repo.find({ relations: ['employee'], order: { grantedAt: 'DESC' } });
    return grants.filter((g) => !g.employee.deletedAt).map((g) => ({
      id: g.id,
      employeeId: g.employeeId,
      loginEmail: g.loginEmail,
      isActive: g.isActive,
      grantedAt: g.grantedAt,
      revokedAt: g.revokedAt,
      lastLoginAt: g.lastLoginAt,
      employee: {
        firstName: g.employee.firstName,
        lastName: g.employee.lastName,
        email: g.employee.email,
        empId: g.employee.empId,
      },
    }));
  }

  async grant(input: { employeeId: string; loginEmail: string; password: string }, adminId: string) {
    const employee = await this.users.findOne({ where: { id: input.employeeId } });
    if (!employee || employee.deletedAt || !employee.isActive || employee.role !== UserRole.EMPLOYEE) {
      throw ApiError.badRequest('Select an active employee', 'HR_ACCESS_EMPLOYEE_INVALID');
    }
    const loginEmail = input.loginEmail.trim().toLowerCase();
    const emailOwner = await this.repo.findOne({ where: { loginEmail } });
    if (emailOwner && emailOwner.employeeId !== employee.id) {
      throw ApiError.conflict('This HR login email is already assigned', 'HR_ACCESS_EMAIL_EXISTS');
    }
    const normalAccountOwner = await this.users.findOne({ where: { email: loginEmail } });
    if (normalAccountOwner && normalAccountOwner.id !== employee.id) {
      throw ApiError.conflict(
        'This email belongs to another portal account',
        'HR_ACCESS_EMAIL_ACCOUNT_CONFLICT',
      );
    }
    let grant = await this.repo.findOne({ where: { employeeId: employee.id } });
    const passwordHash = await hashPassword(input.password);
    if (grant) {
      Object.assign(grant, { loginEmail, passwordHash, isActive: true, grantedBy: adminId, grantedAt: new Date(), revokedBy: null, revokedAt: null });
    } else {
      grant = this.repo.create({ employeeId: employee.id, loginEmail, passwordHash, isActive: true, grantedBy: adminId, grantedAt: new Date(), revokedBy: null, revokedAt: null });
    }
    grant = await this.repo.save(grant);
    let emailSent = true;
    let emailError: string | undefined;
    try {
      if (!this.email.isConfigured()) {
        throw new Error('SMTP is not configured in the backend environment');
      }
      await this.email.sendGenericEmail(loginEmail, 'Your Connect HR portal access', 'hrPortalAccess', {
        firstName: employee.firstName,
        loginEmail,
        password: input.password,
        loginUrl: `${env.APP_URL}/login`,
        year: new Date().getFullYear().toString(),
      });
    } catch (error: any) {
      emailSent = false;
      emailError = error?.message || 'Email could not be delivered';
    }
    return { grant: { id: grant.id, employeeId: grant.employeeId, loginEmail, isActive: true }, emailSent, emailError };
  }

  async revoke(id: string, adminId: string) {
    const grant = await this.repo.findOne({ where: { id } });
    if (!grant) throw ApiError.notFound('HR access record not found', 'HR_ACCESS_NOT_FOUND');
    grant.isActive = false;
    grant.revokedBy = adminId;
    grant.revokedAt = new Date();
    await this.repo.save(grant);
    return { id: grant.id, isActive: false };
  }
}
