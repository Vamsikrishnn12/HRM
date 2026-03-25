import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AlternateSaturdayRule } from './OrgSettings.entity';
import {
  AttendanceClassificationConfig,
  AttendanceAccessMode,
  AttendancePermissionConfig,
  AttendanceRegularizationConfig,
  DEFAULT_ORGANIZATION_ID,
} from '../attendance/attendance.enums';

@Entity('attendance_policies')
export class AttendancePolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80, default: DEFAULT_ORGANIZATION_ID })
  organizationId: string;

  @Column({ type: 'varchar', length: 180, default: 'Default Attendance Policy' })
  defaultPolicyName: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'date' })
  effectiveFrom: string;

  @Column({ type: 'time', default: '09:00' })
  workStartTime: string;

  @Column({ type: 'time', default: '18:00' })
  workEndTime: string;

  @Column({ type: 'int', default: 15 })
  lateGraceMinutes: number;

  @Column({ type: 'int', default: 240 })
  halfDayMinMinutes: number;

  @Column({ type: 'int', default: 480 })
  fullDayMinMinutes: number;

  @Column({ type: 'int', default: 30 })
  overtimeMinMinutes: number;

  @Column({ type: 'int', default: 15 })
  maxEarlyOutToleranceMinutes: number;

  @Column({ type: 'boolean', default: true })
  allowMultiplePunchSessions: boolean;

  @Column({ type: 'boolean', default: true })
  autoCloseOpenSessionAtEndOfDay: boolean;

  @Column({ type: 'int', default: 5 })
  minimumPunchGapMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  officeLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  officeLongitude: number | null;

  @Column({ type: 'int', nullable: true })
  allowedRadiusMeters: number | null;

  @Column({ type: 'boolean', default: true })
  geoFenceRequired: boolean;

  @Column({ type: 'boolean', default: true })
  allowAdminOverrideForGeoFenceMiss: boolean;

  @Column({ type: 'boolean', default: false })
  allowRemotePunch: boolean;

  @Column({
    type: 'varchar',
    length: 30,
    default: AttendanceAccessMode.GEO_FENCE_ONLY,
  })
  defaultAttendanceMode: AttendanceAccessMode | string;

  @Column({ type: 'boolean', default: false })
  requireRemotePunchReason: boolean;

  @Column({ type: 'boolean', default: true })
  allowEmployeePolicyOverride: boolean;

  @Column({ type: 'boolean', default: true })
  captureLocationOnEveryPunch: boolean;

  @Column({ type: 'varchar', length: 100, default: 'SUNDAY' })
  weekOffDays: string;

  @Column({
    type: 'enum',
    enum: AlternateSaturdayRule,
    default: AlternateSaturdayRule.NONE,
  })
  alternateSaturdayOffRule: AlternateSaturdayRule;

  @Column({ type: 'jsonb', default: {} })
  classificationConfig: AttendanceClassificationConfig;

  @Column({ type: 'jsonb', default: {} })
  permissionConfig: AttendancePermissionConfig;

  @Column({ type: 'jsonb', default: {} })
  regularizationConfig: AttendanceRegularizationConfig;

  @Column({ type: 'jsonb', default: {} })
  policyPrecedenceConfig: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
