import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Attendance, AttendanceStatus } from '../entities/Attendance.entity';
import { AttendancePunch, PunchType } from '../entities/AttendancePunch.entity';

export class AttendanceRepository {
  private attendanceRepo: Repository<Attendance>;
  private punchRepo: Repository<AttendancePunch>;

  constructor() {
    this.attendanceRepo = AppDataSource.getRepository(Attendance);
    this.punchRepo = AppDataSource.getRepository(AttendancePunch);
  }

  // ── Attendance ──

  async findByEmployeeAndDate(employeeId: string, date: string): Promise<Attendance | null> {
    return this.attendanceRepo.findOne({ where: { employeeId, date } });
  }

  async findByDate(date: string): Promise<Attendance[]> {
    return this.attendanceRepo.find({
      where: { date },
      relations: ['employee'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByEmployeeHistory(
    employeeId: string,
    startDate: string,
    endDate: string,
  ): Promise<Attendance[]> {
    return this.attendanceRepo.find({
      where: {
        employeeId,
        date: Between(startDate, endDate),
      },
      order: { date: 'DESC' },
    });
  }

  async findById(id: string): Promise<Attendance | null> {
    return this.attendanceRepo.findOne({
      where: { id },
      relations: ['employee'],
    });
  }

  async createAttendance(data: Partial<Attendance>): Promise<Attendance> {
    const record = this.attendanceRepo.create(data);
    return this.attendanceRepo.save(record);
  }

  async updateAttendance(id: string, data: Partial<Attendance>): Promise<void> {
    await this.attendanceRepo.update(id, data);
  }

  async saveAttendance(attendance: Attendance): Promise<Attendance> {
    return this.attendanceRepo.save(attendance);
  }

  async getDateSummary(date: string): Promise<Record<string, number>> {
    const results = await this.attendanceRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('a.date = :date', { date })
      .groupBy('a.status')
      .getRawMany();

    const summary: Record<string, number> = {
      PRESENT: 0,
      LATE: 0,
      ABSENT: 0,
      HALF_DAY: 0,
      LEAVE: 0,
      HOLIDAY: 0,
      WEEK_OFF: 0,
    };

    for (const r of results) {
      summary[r.status] = parseInt(r.count, 10);
    }
    return summary;
  }

  async findByDateFiltered(
    date: string,
    status?: AttendanceStatus,
    search?: string,
  ): Promise<Attendance[]> {
    const qb = this.attendanceRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.employee', 'emp')
      .where('a.date = :date', { date });

    if (status) {
      qb.andWhere('a.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(emp.firstName ILIKE :search OR emp.lastName ILIKE :search OR emp.empId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return qb.orderBy('emp.firstName', 'ASC').getMany();
  }

  // ── Punches ──

  async createPunch(data: Partial<AttendancePunch>): Promise<AttendancePunch> {
    const punch = this.punchRepo.create(data);
    return this.punchRepo.save(punch);
  }

  async findPunchesByEmployeeAndDate(
    employeeId: string,
    startOfDay: Date,
    endOfDay: Date,
  ): Promise<AttendancePunch[]> {
    return this.punchRepo.find({
      where: {
        employeeId,
        time: Between(startOfDay, endOfDay),
      },
      order: { time: 'ASC' },
    });
  }
}
