import { UserRepository } from '../repositories/user.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
import { PersonalDetailsRepository } from '../repositories/personalDetails.repository';
import { comparePassword, hashPassword } from '../utils/password';
import { ApiError } from '../utils/apiError';

export class ProfileService {
  private userRepo: UserRepository;
  private employeeRepo: EmployeeRepository;
  private personalRepo: PersonalDetailsRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.employeeRepo = new EmployeeRepository();
    this.personalRepo = new PersonalDetailsRepository();
  }

  async getMyProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    const profile = await this.employeeRepo.findByUserId(userId);
    const personal = await this.personalRepo.findByUserId(userId);

    return {
      // User basics
      id: user.id,
      empId: user.empId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,

      // Employee profile
      department: profile?.department ?? '',
      designation: profile?.designation ?? '',
      employmentType: profile?.employmentType ?? '',
      dateOfJoining: profile?.dateOfJoining ?? '',
      reportingManager: profile?.reportingManager ?? '',
      shiftSchedule: profile?.shiftSchedule ?? '',

      // Personal details
      mobileNumber: personal?.mobileNumber ?? '',
      whatsappNumber: personal?.whatsappNumber ?? '',
      dateOfBirth: personal?.dateOfBirth ?? '',
      gender: personal?.gender ?? '',
      nationality: personal?.nationality ?? '',
      bloodGroup: personal?.bloodGroup ?? '',
      maritalStatus: personal?.maritalStatus ?? '',

      // Address
      currentAddressLine1: personal?.currentAddressLine1 ?? '',
      currentCity: personal?.currentCity ?? '',
      currentState: personal?.currentState ?? '',
      currentPincode: personal?.currentPincode ?? '',
      currentCountry: personal?.currentCountry ?? '',

      // Emergency contact
      emergencyContactPerson: personal?.emergencyContactPerson ?? '',
      emergencyContactNumber: personal?.emergencyContactNumber ?? '',
      emergencyContactRelationship: personal?.emergencyContactRelationship ?? '',
    };
  }

  async updateMyProfile(userId: string, input: Record<string, unknown>) {
    const personal = await this.personalRepo.findByUserId(userId);
    if (!personal) {
      // Create personal details if they don't exist
      await this.personalRepo.create({ userId, ...input } as any);
    } else {
      await this.personalRepo.update(personal.id, input as any);
    }
    return this.getMyProfile(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      throw ApiError.badRequest('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
    }

    if (currentPassword === newPassword) {
      throw ApiError.badRequest(
        'New password must be different from current password',
        'SAME_PASSWORD',
      );
    }

    const hashed = await hashPassword(newPassword);
    await this.userRepo.update(userId, { password: hashed } as any);
  }
}
