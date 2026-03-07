import { AppDataSource } from '../config/database';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
import { LeaveRepository } from '../repositories/leave.repository';
import { PayrollRepository } from '../repositories/payroll.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { PersonalDetailsRepository } from '../repositories/personalDetails.repository';
import { LeaveStatus, LeaveType } from '../entities/LeaveRequest.entity';
import { PayrollRecordStatus } from '../entities/PayrollRecord.entity';
import { User, UserRole } from '../entities/User.entity';
import { EmployeeProfile } from '../entities/EmployeeProfile.entity';
import { PersonalDetails } from '../entities/PersonalDetails.entity';

const attendanceRepo = new AttendanceRepository();
const employeeRepo = new EmployeeRepository();
const leaveRepo = new LeaveRepository();
const payrollRepo = new PayrollRepository();
const settingsRepo = new SettingsRepository();

// Leave type labels for chart
const LEAVE_TYPE_LABELS: Record<string, string> = {
  CL: 'Casual Leave',
  SL: 'Sick Leave',
  EL: 'Earned Leave',
  LOP: 'Loss of Pay',
  PERMISSION: 'Permission',
};

const LEAVE_TYPE_COLORS: Record<string, string> = {
  CL: '#8B5CF6',
  SL: '#6D28D9',
  EL: '#A785FA',
  LOP: '#64748B',
  PERMISSION: '#C4ADFC',
};

export class DashboardService {
  async getSummary() {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Run all independent queries in parallel
    const [
      activeEmployees,
      todaySummary,
      pendingLeaveCount,
      openRequestCount,
      payrollRecords,
      holidays,
      todayAttendance,
      departmentHeadcount,
      leaveDistribution,
      attendanceTrend,
    ] = await Promise.all([
      attendanceRepo.findAllActiveEmployees(),
      attendanceRepo.getDateSummary(today),
      leaveRepo.countByStatus(LeaveStatus.PENDING),
      leaveRepo.countByStatus(LeaveStatus.PENDING), // same as pending leaves for "open requests"
      payrollRepo.findRecords({ year: currentYear, month: currentMonth }),
      settingsRepo.findAllHolidays(),
      attendanceRepo.findByDateFiltered(today),
      this.getDepartmentHeadcount(),
      this.getLeaveDistribution(currentYear),
      this.getAttendanceTrend(14),
    ]);

    // ── KPI Stats ──
    const totalEmployees = activeEmployees.length;
    const presentToday = todaySummary.PRESENT + todaySummary.LATE;
    const presentPct = totalEmployees > 0
      ? ((presentToday / totalEmployees) * 100).toFixed(1) + '%'
      : '0%';
    const lateArrivals = todaySummary.LATE;

    // Payroll summary for current month — query actual PayrollRecord rows
    const generatedRecords = payrollRecords.filter(
      r => r.status === PayrollRecordStatus.GENERATED || r.status === PayrollRecordStatus.EMAILED,
    );
    const totalPayout = generatedRecords.reduce((sum, r) => sum + Number(r.netPay), 0);
    const monthLabel = now.toLocaleString('en', { month: 'short' });

    const payrollProcessed = {
      totalRecords: payrollRecords.length,
      generatedCount: generatedRecords.length,
      totalPayout,
      month: monthLabel,
      year: currentYear,
      isRun: generatedRecords.length > 0,
    };

    const payrollProcessedLabel = payrollProcessed.isRun
      ? `\u20B9${totalPayout.toLocaleString('en-IN')}`
      : 'Not run';
    const payrollMonth = `${monthLabel} ${currentYear}`;

    const kpiStats = [
      { label: 'Total Employees', value: String(totalEmployees), change: '', changeType: 'neutral' as const, icon: 'Users' },
      { label: 'Present Today', value: String(presentToday), change: presentPct, changeType: 'up' as const, icon: 'UserCheck' },
      { label: 'Pending Leaves', value: String(pendingLeaveCount), change: '', changeType: pendingLeaveCount > 0 ? 'down' as const : 'neutral' as const, icon: 'CalendarOff' },
      { label: 'Payroll Processed', value: payrollProcessedLabel, change: payrollMonth, changeType: 'neutral' as const, icon: 'Wallet' },
      { label: 'Late Arrivals', value: String(lateArrivals), change: '', changeType: lateArrivals > 0 ? 'down' as const : 'up' as const, icon: 'Clock' },
      { label: 'Open Requests', value: String(openRequestCount), change: '', changeType: openRequestCount > 0 ? 'down' as const : 'neutral' as const, icon: 'FileText' },
    ];

    // ── Recent Attendance (today, max 10) ──
    const recentAttendance = todayAttendance.slice(0, 10).map(a => {
      const emp = a.employee;
      const checkIn = a.firstCheckInAt
        ? new Date(a.firstCheckInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : '—';
      const checkOut = a.lastCheckOutAt
        ? new Date(a.lastCheckOutAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : '—';

      // Map backend status to frontend label
      const statusMap: Record<string, string> = {
        PRESENT: 'Present',
        LATE: 'Late',
        ABSENT: 'Absent',
        HALF_DAY: 'Half Day',
        LEAVE: 'Absent',
        HOLIDAY: 'Present',
        WEEK_OFF: 'Absent',
        NOT_STARTED: 'Absent',
        MISSED_CHECK_IN: 'Absent',
      };

      return {
        id: emp?.empId ?? a.employeeId.slice(0, 8),
        name: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
        department: '', // will be filled below
        date: new Date(today).toLocaleDateString('en', { month: 'short', day: '2-digit' }),
        checkIn,
        checkOut,
        status: statusMap[a.status] ?? 'Absent',
      };
    });

    // Fill department info from employee profiles
    if (recentAttendance.length > 0) {
      const profileRepo = AppDataSource.getRepository(EmployeeProfile);
      const profiles = await profileRepo.find({ relations: ['user'] });
      const profileMap = new Map<string, EmployeeProfile>();
      for (const p of profiles) {
        profileMap.set(p.userId, p);
      }
      for (const rec of recentAttendance) {
        // Find profile by matching attendance employeeId to userId
        const att = todayAttendance.find(a =>
          (a.employee?.empId === rec.id) || (a.employeeId.slice(0, 8) === rec.id)
        );
        if (att) {
          const profile = profileMap.get(att.employeeId);
          rec.department = profile?.department ?? '';
        }
      }
    }

    // ── Upcoming Holidays (from today onward) ──
    const upcomingHolidays = holidays
      .filter(h => h.date >= today)
      .slice(0, 4)
      .map(h => {
        const d = new Date(h.date + 'T00:00:00');
        return {
          name: h.name,
          date: d.toLocaleDateString('en', { month: 'short', day: '2-digit' }),
          day: d.toLocaleDateString('en', { weekday: 'long' }),
        };
      });

    // ── Announcements (static for now, can be entity-driven later) ──
    const announcements = upcomingHolidays.slice(0, 2).map(h => ({
      title: `Holiday — ${h.name}`,
      date: h.date,
      type: 'holiday' as const,
    }));

    return {
      kpiStats,
      payrollProcessed,
      attendanceTrend,
      departmentData: departmentHeadcount,
      leaveTypesData: leaveDistribution,
      recentAttendance,
      announcements,
      upcomingHolidays,
    };
  }

  // ── Helpers ──

  private async getAttendanceTrend(days: number) {
    const results: { date: string; present: number; absent: number; late: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const summary = await attendanceRepo.getDateSummary(dateStr);

      results.push({
        date: d.toLocaleDateString('en', { month: 'short', day: '2-digit' }),
        present: summary.PRESENT + summary.LATE,
        absent: summary.ABSENT + summary.HALF_DAY,
        late: summary.LATE,
      });
    }

    return results;
  }

  private async getDepartmentHeadcount() {
    const profileRepo = AppDataSource.getRepository(EmployeeProfile);
    const rows: { department: string; count: string }[] = await profileRepo
      .createQueryBuilder('ep')
      .innerJoin('ep.user', 'u')
      .select('ep.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .where('u.isActive = true')
      .andWhere('u.role = :role', { role: UserRole.EMPLOYEE })
      .groupBy('ep.department')
      .orderBy('count', 'DESC')
      .getRawMany();

    return rows.map(r => ({
      department: r.department,
      count: parseInt(r.count, 10),
    }));
  }

  private async getLeaveDistribution(year: number) {
    const repo = AppDataSource.getRepository(
      (await import('../entities/LeaveRequest.entity')).LeaveRequest,
    );

    const rows: { leaveType: string; count: string }[] = await repo
      .createQueryBuilder('lr')
      .select('lr.leaveType', 'leaveType')
      .addSelect('COUNT(*)', 'count')
      .where('lr.status IN (:...statuses)', {
        statuses: [LeaveStatus.APPROVED, LeaveStatus.PENDING],
      })
      .andWhere(
        '(EXTRACT(YEAR FROM lr.startDate) = :year OR EXTRACT(YEAR FROM lr.date) = :year)',
        { year },
      )
      .groupBy('lr.leaveType')
      .getRawMany();

    return rows.map(r => ({
      name: LEAVE_TYPE_LABELS[r.leaveType] ?? r.leaveType,
      value: parseInt(r.count, 10),
      color: LEAVE_TYPE_COLORS[r.leaveType] ?? '#94A3B8',
    }));
  }

  // ── Public: Upcoming Birthdays ──

  async getUpcomingBirthdays(days = 30) {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Get all personal details with user + profile
    const personalRepo = AppDataSource.getRepository(PersonalDetails);
    const records = await personalRepo
      .createQueryBuilder('pd')
      .innerJoinAndSelect('pd.user', 'u')
      .leftJoin(EmployeeProfile, 'ep', 'ep.userId = u.id')
      .addSelect('ep.department', 'department')
      .addSelect('ep.designation', 'designation')
      .where('pd.dateOfBirth IS NOT NULL')
      .andWhere('u.isActive = true')
      .andWhere('u.role = :role', { role: UserRole.EMPLOYEE })
      .getRawAndEntities();

    const currentYear = today.getFullYear();
    const results: {
      employeeId: string;
      employeeCode: string;
      fullName: string;
      department: string;
      designation: string;
      dateOfBirth: string;
      birthdayThisYear: string;
      daysLeft: number;
    }[] = [];

    for (let i = 0; i < records.entities.length; i++) {
      const pd = records.entities[i];
      const raw = records.raw[i];
      if (!pd.dateOfBirth) continue;

      const dob = new Date(pd.dateOfBirth + 'T00:00:00');
      let bday = new Date(currentYear, dob.getMonth(), dob.getDate());

      // If birthday has already passed this year, check next year
      if (bday.toISOString().slice(0, 10) < todayStr) {
        bday = new Date(currentYear + 1, dob.getMonth(), dob.getDate());
      }

      const bdayStr = bday.toISOString().slice(0, 10);
      const diffMs = bday.getTime() - new Date(todayStr + 'T00:00:00').getTime();
      const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (daysLeft > days) continue;

      results.push({
        employeeId: pd.userId,
        employeeCode: pd.user?.empId ?? '',
        fullName: pd.user ? `${pd.user.firstName} ${pd.user.lastName}` : '',
        department: raw.department ?? '',
        designation: raw.designation ?? '',
        dateOfBirth: pd.dateOfBirth,
        birthdayThisYear: bdayStr,
        daysLeft,
      });
    }

    results.sort((a, b) => a.daysLeft - b.daysLeft);
    return results;
  }

  // ── Public: Upcoming Holidays ──

  async getUpcomingHolidays(limit = 4) {
    const today = new Date().toISOString().slice(0, 10);
    const holidays = await settingsRepo.findAllHolidays();

    return holidays
      .filter(h => h.date >= today)
      .slice(0, limit)
      .map(h => {
        const d = new Date(h.date + 'T00:00:00');
        const diffMs = d.getTime() - new Date(today + 'T00:00:00').getTime();
        const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
        return {
          id: h.id,
          name: h.name,
          date: h.date,
          dayName: d.toLocaleDateString('en', { weekday: 'long' }),
          daysLeft,
        };
      });
  }
}
