import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';

@Entity('employee_profiles')
export class EmployeeProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  department: string;

  @Column({ type: 'varchar', length: 100 })
  designation: string;

  @Column({ type: 'varchar', length: 50, default: 'Fresher' })
  employmentType: string;

  @Column({ type: 'date' })
  dateOfJoining: string;

  @Column({ type: 'varchar', length: 200 })
  reportingManager: string;

  @Column({ type: 'varchar', length: 100 })
  shiftSchedule: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.employeeProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
