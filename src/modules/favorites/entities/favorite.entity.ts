import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Classifiedad } from '../../classifiedads/entities/classifiedad.entity';

@Entity('favorites')
@Unique(['userId', 'classifiedadId'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Classifiedad, classifiedad => classifiedad.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classifiedadId' })
  classifiedad: Classifiedad;

  @Column()
  classifiedadId: string;

  @Column({ default: false })
  isNotified: boolean;
} 