import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { LeavePolicy } from '../entities/LeavePolicy.entity';
import { LeavePolicySlab } from '../entities/LeavePolicySlab.entity';
import { LeaveRequest, LeaveStatus, RequestMode } from '../entities/LeaveRequest.entity';

export class LeaveRepository {
  private policyRepo: Repository<LeavePolicy>;
  private slabRepo: Repository<LeavePolicySlab>;
  private requestRepo: Repository<LeaveRequest>;

  constructor() {
    this.policyRepo = AppDataSource.getRepository(LeavePolicy);
    this.slabRepo = AppDataSource.getRepository(LeavePolicySlab);
    this.requestRepo = AppDataSource.getRepository(LeaveRequest);
  }

  // ── Leave Policy ──

  async getPolicy(): Promise<LeavePolicy | null> {
    return this.policyRepo.findOne({
      where: {},
      relations: ['slabs'],
      order: { createdAt: 'ASC' },
    });
  }

  async upsertPolicy(data: Partial<LeavePolicy>): Promise<LeavePolicy> {
    let policy = await this.policyRepo.findOne({ where: {}, order: { createdAt: 'ASC' } });
    if (policy) {
      Object.assign(policy, data);
      return this.policyRepo.save(policy);
    }
    const created = this.policyRepo.create(data);
    return this.policyRepo.save(created);
  }

  async getPolicyWithSlabs(): Promise<LeavePolicy | null> {
    return this.policyRepo.findOne({
      where: {},
      relations: ['slabs'],
      order: { createdAt: 'ASC' },
    });
  }

  // ── Slabs ──

  async findSlabsByPolicyId(policyId: string): Promise<LeavePolicySlab[]> {
    return this.slabRepo.find({
      where: { leavePolicyId: policyId },
      order: { minYearsOfService: 'ASC' },
    });
  }

  async replaceSlabs(policyId: string, slabs: Partial<LeavePolicySlab>[]): Promise<LeavePolicySlab[]> {
    await this.slabRepo.delete({ leavePolicyId: policyId });
    const entities = slabs.map((s) => this.slabRepo.create({ ...s, leavePolicyId: policyId }));
    return this.slabRepo.save(entities);
  }

  // ── Leave Requests ──

  async createRequest(data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const request = this.requestRepo.create(data);
    return this.requestRepo.save(request);
  }

  async findRequestById(id: string): Promise<LeaveRequest | null> {
    return this.requestRepo.findOne({ where: { id } });
  }

  async findRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]> {
    return this.requestRepo.find({
      where: { employeeId },
      order: { createdAt: 'DESC' },
    });
  }

  async findApprovedByEmployeeAndYear(
    employeeId: string,
    year: number,
  ): Promise<LeaveRequest[]> {
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    return this.requestRepo
      .createQueryBuilder('lr')
      .where('lr.employeeId = :employeeId', { employeeId })
      .andWhere('lr.status = :status', { status: LeaveStatus.APPROVED })
      .andWhere(
        '(lr.startDate BETWEEN :start AND :end OR lr.date BETWEEN :start AND :end)',
        { start: startOfYear, end: endOfYear },
      )
      .orderBy('lr.createdAt', 'DESC')
      .getMany();
  }

  async findPermissionsByEmployeeAndMonth(
    employeeId: string,
    year: number,
    month: number,
  ): Promise<LeaveRequest[]> {
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    return this.requestRepo
      .createQueryBuilder('lr')
      .where('lr.employeeId = :employeeId', { employeeId })
      .andWhere('lr.requestMode = :mode', { mode: RequestMode.PERMISSION })
      .andWhere('lr.status IN (:...statuses)', {
        statuses: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
      })
      .andWhere('lr.date BETWEEN :start AND :end', {
        start: startOfMonth,
        end: endOfMonth,
      })
      .getMany();
  }

  async findOverlapping(
    employeeId: string,
    startDate: string,
    endDate: string,
    excludeId?: string,
  ): Promise<LeaveRequest[]> {
    const qb = this.requestRepo
      .createQueryBuilder('lr')
      .where('lr.employeeId = :employeeId', { employeeId })
      .andWhere('lr.status IN (:...statuses)', {
        statuses: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
      })
      .andWhere(
        `(
          (lr.requestMode = 'FULL_DAY' AND lr.startDate <= :endDate AND lr.endDate >= :startDate)
          OR
          (lr.requestMode != 'FULL_DAY' AND lr.date >= :startDate AND lr.date <= :endDate)
        )`,
        { startDate, endDate },
      );

    if (excludeId) {
      qb.andWhere('lr.id != :excludeId', { excludeId });
    }

    return qb.getMany();
  }

  async updateRequest(id: string, data: Partial<LeaveRequest>): Promise<void> {
    await this.requestRepo.update(id, data as any);
  }

  async saveRequest(request: LeaveRequest): Promise<LeaveRequest> {
    return this.requestRepo.save(request);
  }

  // ── Admin queries ──

  async findAllRequests(filters: {
    status?: string;
    leaveType?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<LeaveRequest[]> {
    const qb = this.requestRepo.createQueryBuilder('lr');

    if (filters.status) {
      qb.andWhere('lr.status = :status', { status: filters.status });
    }
    if (filters.leaveType) {
      qb.andWhere('lr.leaveType = :leaveType', { leaveType: filters.leaveType });
    }
    if (filters.employeeId) {
      qb.andWhere('lr.employeeId = :employeeId', { employeeId: filters.employeeId });
    }
    if (filters.startDate) {
      qb.andWhere(
        '(lr.startDate >= :fs OR lr.date >= :fs)',
        { fs: filters.startDate },
      );
    }
    if (filters.endDate) {
      qb.andWhere(
        '(lr.endDate <= :fe OR lr.date <= :fe)',
        { fe: filters.endDate },
      );
    }

    qb.orderBy('lr.createdAt', 'DESC');
    return qb.getMany();
  }

  async countByStatus(status: LeaveStatus): Promise<number> {
    return this.requestRepo.count({ where: { status } });
  }
}
