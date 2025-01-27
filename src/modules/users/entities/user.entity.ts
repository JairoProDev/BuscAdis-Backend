import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ unique: true })
  email: string = '';

  @Column()
  password: string = '';

  @Column({ nullable: true })
  firstName: string = '';

  @Column({ nullable: true })
  lastName: string = '';

  @Column({ nullable: true })
  phone: string = '';

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole = UserRole.USER;

  @Column({ default: true })
  isActive: boolean = true;

  @Column({ default: false })
  isVerified: boolean = false;

  @OneToMany(() => Listing, listing => listing.seller)
  listings: Listing[];

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();
} 