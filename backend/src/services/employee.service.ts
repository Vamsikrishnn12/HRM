import crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
import { TokenService } from './token.service';
import { EmailService } from './email.service';
import { hashPassword } from '../utils/password';
import { ApiError } from '../utils/apiError';
import { UserRole } from '../entities/User.entity';
import fs from 'fs';
import path from 'path';

interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  employmentType: string;
  dateOfJoining: string;
  reportingManager: string;
  shiftSchedule: string;
  allowLoginOnlyInsideOffice: boolean;
  officeLatitude?: number;
  officeLongitude?: number;
  officeRadiusMeters?: number;
}

interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  department?: string;
  designation?: string;
  employmentType?: string;
  dateOfJoining?: string;
  reportingManager?: string;
  shiftSchedule?: string;
  isActive?: boolean;
  officeLocationRequired?: boolean;
  officeLatitude?: number | null;
  officeLongitude?: number | null;
  officeRadiusMeters?: number | null;
}

export class EmployeeService {
  private userRepo: UserRepository;
  private employeeRepo: EmployeeRepository;
  private tokenService: TokenService;
  private emailService: EmailService;

  constructor() {
    this.userRepo = new UserRepository();
    this.employeeRepo = new EmployeeRepository();
    this.tokenService = new TokenService();
    this.emailService = new EmailService();
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return `Emp@${result}`;
  }

  async createEmployee(input: CreateEmployeeInput) {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict(
        'An employee with this email already exists',
        'EMPLOYEE_DUPLICATE_EMAIL',
      );
    }

    if (input.allowLoginOnlyInsideOffice) {
      if (
        input.officeLatitude == null ||
        input.officeLongitude == null ||
        input.officeRadiusMeters == null
      ) {
        throw ApiError.badRequest(
          'Office coordinates and radius are required when location-based login is enabled',
          'EMPLOYEE_LOCATION_REQUIRED',
        );
      }
    }

    const empId = await this.userRepo.generateNextEmpId();
    const generatedPassword = this.generatePassword();
    const hashedPassword = await hashPassword(generatedPassword);

    const user = await this.userRepo.create({
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      empId,
      role: UserRole.EMPLOYEE,
      isActive: true,
      officeLocationRequired: input.allowLoginOnlyInsideOffice,
      officeLatitude: input.allowLoginOnlyInsideOffice ? input.officeLatitude! : null,
      officeLongitude: input.allowLoginOnlyInsideOffice ? input.officeLongitude! : null,
      officeRadiusMeters: input.allowLoginOnlyInsideOffice ? input.officeRadiusMeters! : null,
    });

    const profile = await this.employeeRepo.create({
      userId: user.id,
      department: input.department,
      designation: input.designation,
      employmentType: input.employmentType,
      dateOfJoining: input.dateOfJoining,
      reportingManager: input.reportingManager,
      shiftSchedule: input.shiftSchedule,
    });

    // Send credentials email in background — don't block employee creation
    this.emailService
      .sendCredentials(input.email, empId, generatedPassword, input.firstName)
      .catch((err) =>
        console.error('Failed to send credentials email', (err as Error).message),
      );

    return {
      empId,
      generatedPassword,
      profile: {
        id: profile.id,
        department: profile.department,
        designation: profile.designation,
        userId: user.id,
      },
    };
  }

  async listEmployees() {
    const profiles = await this.employeeRepo.findAll();
    const data = profiles.map((p) => ({
      id: p.id,
      department: p.department,
      designation: p.designation,
      employmentType: p.employmentType,
      dateOfJoining: p.dateOfJoining,
      reportingManager: p.reportingManager,
      shiftSchedule: p.shiftSchedule,
      user: {
        id: p.user.id,
        email: p.user.email,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        isActive: p.user.isActive,
        empId: p.user.empId,
        profilePhotoUrl: p.user.profilePhotoUrl,
        officeLocationRequired: p.user.officeLocationRequired,
        officeLatitude: p.user.officeLatitude,
        officeLongitude: p.user.officeLongitude,
        officeRadiusMeters: p.user.officeRadiusMeters,
        lastLoginAt: p.user.lastLoginAt,
      },
    }));
    return { data, total: data.length };
  }

  async dropdownEmployees() {
    const profiles = await this.employeeRepo.findAll();
    return profiles
      .filter((p) => p.user?.isActive)
      .map((p) => ({
        userId: p.user.id,
        empId: p.user.empId,
        firstName: p.user.firstName,
        lastName: p.user.lastName,
      }));
  }

  async getEmployee(id: string) {
    const profile = await this.employeeRepo.findById(id);
    if (!profile) {
      throw ApiError.notFound('Employee not found', 'EMPLOYEE_NOT_FOUND');
    }
    return {
      id: profile.id,
      department: profile.department,
      designation: profile.designation,
      employmentType: profile.employmentType,
      dateOfJoining: profile.dateOfJoining,
      reportingManager: profile.reportingManager,
      shiftSchedule: profile.shiftSchedule,
      user: {
        id: profile.user.id,
        email: profile.user.email,
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        isActive: profile.user.isActive,
        empId: profile.user.empId,
        profilePhotoUrl: profile.user.profilePhotoUrl,
        officeLocationRequired: profile.user.officeLocationRequired,
        officeLatitude: profile.user.officeLatitude,
        officeLongitude: profile.user.officeLongitude,
        officeRadiusMeters: profile.user.officeRadiusMeters,
        lastLoginAt: profile.user.lastLoginAt,
      },
    };
  }

  async updateEmployee(id: string, input: UpdateEmployeeInput) {
    const profile = await this.employeeRepo.findById(id);
    if (!profile) {
      throw ApiError.notFound('Employee not found', 'EMPLOYEE_NOT_FOUND');
    }

    // Build user updates
    const userUpdates: Record<string, unknown> = {};
    if (input.firstName !== undefined) userUpdates.firstName = input.firstName;
    if (input.lastName !== undefined) userUpdates.lastName = input.lastName;
    if (input.isActive !== undefined) userUpdates.isActive = input.isActive;

    if (input.officeLocationRequired !== undefined) {
      userUpdates.officeLocationRequired = input.officeLocationRequired;
      if (input.officeLocationRequired) {
        if (
          input.officeLatitude == null ||
          input.officeLongitude == null ||
          input.officeRadiusMeters == null
        ) {
          throw ApiError.badRequest(
            'Office coordinates and radius are required when location-based login is enabled',
            'EMPLOYEE_LOCATION_REQUIRED',
          );
        }
        userUpdates.officeLatitude = input.officeLatitude;
        userUpdates.officeLongitude = input.officeLongitude;
        userUpdates.officeRadiusMeters = input.officeRadiusMeters;
      } else {
        userUpdates.officeLatitude = null;
        userUpdates.officeLongitude = null;
        userUpdates.officeRadiusMeters = null;
      }
    }

    if (Object.keys(userUpdates).length > 0) {
      await this.userRepo.update(profile.userId, userUpdates);
    }

    // Revoke tokens when deactivating so employee is logged out immediately
    if (input.isActive === false) {
      await this.tokenService.revokeAllUserTokens(profile.userId);
    }

    // Build profile updates
    const profileUpdates: Record<string, unknown> = {};
    if (input.department !== undefined) profileUpdates.department = input.department;
    if (input.designation !== undefined) profileUpdates.designation = input.designation;
    if (input.employmentType !== undefined) profileUpdates.employmentType = input.employmentType;
    if (input.dateOfJoining !== undefined) profileUpdates.dateOfJoining = input.dateOfJoining;
    if (input.reportingManager !== undefined)
      profileUpdates.reportingManager = input.reportingManager;
    if (input.shiftSchedule !== undefined) profileUpdates.shiftSchedule = input.shiftSchedule;

    if (Object.keys(profileUpdates).length > 0) {
      await this.employeeRepo.update(id, profileUpdates);
    }

    return this.getEmployee(id);
  }

  async updateProfilePhoto(id: string, file: Express.Multer.File) {
    const profile = await this.employeeRepo.findById(id);
    if (!profile) {
      fs.unlink(file.path, () => undefined);
      throw ApiError.notFound('Employee not found', 'EMPLOYEE_NOT_FOUND');
    }

    const previousPhoto = profile.user.profilePhotoUrl;
    const profilePhotoUrl = `/uploads/profile-photos/${file.filename}`;
    await this.userRepo.update(profile.userId, { profilePhotoUrl });

    if (previousPhoto?.startsWith('/uploads/profile-photos/')) {
      const previousPath = path.resolve(previousPhoto.replace(/^\//, ''));
      fs.unlink(previousPath, () => undefined);
    }

    return { profilePhotoUrl };
  }
}
