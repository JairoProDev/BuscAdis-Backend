import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Publication } from '../../publications/entities/publication.entity';

export enum ReportType {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  FRAUD = 'fraud',
  DUPLICATE = 'duplicate',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  type: ReportType;

  @Column()
  reason: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({ nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column()
  reporterId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'reportedUserId' })
  reportedUser?: User;

  @Column({ nullable: true })
  reportedUserId?: string;

  @ManyToOne(() => Publication, publication => publication.reports, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'publicationId' })
  publication?: Publication;

  @Column({ nullable: true })
  publicationId?: string;
} 