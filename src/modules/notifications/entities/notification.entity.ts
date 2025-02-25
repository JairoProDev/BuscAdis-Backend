import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  MESSAGE = 'message',        //  minúsculas
  FAVORITE = 'favorite',    //  minúsculas
  LISTING_REPORT = 'listing_report',
  LISTING_STATUS = 'listing_status',
  LISTING_EXPIRING = 'listing_expiring',
  LISTING_EXPIRED = 'listing_expired', // No lo usas, pero lo dejo por si acaso
  LISTING_FEATURED = 'listing_featured',// No lo usas, pero lo dejo
  LISTING_VERIFIED = 'listing_verified',// No lo usas, pero lo dejo
  LISTING_VIEWS = 'listing_views',
  SYSTEM = 'system', // No lo usas, pero lo dejo
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) //  'userId', más consistente con el resto del código
  user: User; //  User, *NO* string (la relación se define aquí)

  @Column({
    type: 'enum',
    enum: NotificationType,
    // default: NotificationType.MESSAGE,  //  valor por defecto (opcional)
  })
  type: NotificationType;

  @Column('text')
  title: string;

  @Column('text')  // message en lugar de content
  message: string;

  @Column('jsonb', { nullable: true })
  data?: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  readAt?: Date;

  @Column({ nullable: true })
  expiresAt?: Date;
}