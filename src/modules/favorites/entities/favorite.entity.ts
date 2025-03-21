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
import { Publication } from '../../publications/entities/publication.entity';

@Entity('favorites')
@Unique(['userId', 'publicationId'])
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

  @ManyToOne(() => Publication, publication => publication.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publicationId' })
  publication: Publication;

  @Column()
  publicationId: string;

  @Column({ default: false })
  isNotified: boolean;
} 