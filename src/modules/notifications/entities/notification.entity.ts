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

export enum NotificationType {
  MESSAGE = 'message',        //  minúsculas
  FAVORITE = 'favorite',    //  minúsculas
  PUBLICATION_UPDATE = 'publication_update',
  PUBLICATION_EXPIRED = 'publication_expired',
  PUBLICATION_SOLD = 'publication_sold',
  REPORT_UPDATE = 'report_update',
  SYSTEM = 'system', // No lo usas, pero lo dejo
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column('jsonb', { nullable: true })
  data?: Record<string, any>;

  @Column({ nullable: true })
  readAt?: Date;

  @Column({ nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}