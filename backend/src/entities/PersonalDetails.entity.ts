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

@Entity('personal_details')
export class PersonalDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  // Identity
  @Column({ type: 'varchar', length: 12, nullable: true })
  aadhaarNumber: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  panNumber: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  mobileNumber: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  whatsappNumber: string | null;

  // Demographics
  @Column({ type: 'varchar', length: 5, nullable: true })
  bloodGroup: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  maritalStatus: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nationality: string | null;

  // Current Address
  @Column({ type: 'varchar', length: 255, nullable: true })
  currentAddressLine1: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  currentCity: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  currentState: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currentPincode: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  currentCountry: string | null;

  // Permanent Address
  @Column({ type: 'boolean', default: true })
  permanentSameAsCurrent: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  permanentAddressLine1: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  permanentCity: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  permanentState: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  permanentPincode: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  permanentCountry: string | null;

  // Emergency Contact
  @Column({ type: 'varchar', length: 15, nullable: true })
  emergencyContactNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emergencyContactPerson: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  emergencyContactRelationship: string | null;

  // Education
  @Column({ type: 'varchar', length: 50, nullable: true })
  highestQualification: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  institutionName: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  graduationYear: string | null;

  // Experience
  @Column({ type: 'varchar', length: 10, nullable: true })
  totalExperienceYears: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  lastCompany: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  lastDesignation: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reasonForLeaving: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  previousCompanyCTC: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
