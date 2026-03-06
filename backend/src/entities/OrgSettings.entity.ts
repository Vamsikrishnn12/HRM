import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AlternateSaturdayRule {
  NONE = 'NONE',
  SECOND_FOURTH = 'SECOND_FOURTH',
  FIRST_THIRD = 'FIRST_THIRD',
}

@Entity('org_settings')
export class OrgSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Office Timings ──
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

  // ── Weekly Off Rules ──
  @Column({ type: 'varchar', length: 100, default: 'SUNDAY' })
  weekOffDays: string;

  @Column({
    type: 'enum',
    enum: AlternateSaturdayRule,
    default: AlternateSaturdayRule.NONE,
  })
  alternateSaturdayOffRule: AlternateSaturdayRule;

  // ── Office Location ──
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  officeLatitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  officeLongitude: number | null;

  @Column({ type: 'int', nullable: true })
  officeRadiusMeters: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
