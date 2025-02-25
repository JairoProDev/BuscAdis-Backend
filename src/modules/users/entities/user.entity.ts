import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Listing } from '../../listings/entities/listing.entity';
import { Message } from '../../messages/entities/message.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ unique: true })
  email: string = '';

  @Column({ nullable: true })
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

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider = AuthProvider.LOCAL;

  @Column({ nullable: true })
  providerId: string;

  @Column({ default: true })
  isActive: boolean = true;

  @Column({ default: false })
  isVerified: boolean = false;

  @Column({ default: false })
  emailVerified: boolean = false;

  @Column({ default: false })
  phoneVerified: boolean = false;

  @OneToMany(() => Listing, listing => listing.seller)
  listings: Listing[];

  @OneToMany(() => Message, message => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, message => message.receiver)
  receivedMessages: Message[];

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @BeforeInsert()
  async hashPassword() {
    if (this.password && this.provider === AuthProvider.LOCAL) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (this.provider !== AuthProvider.LOCAL) {
      return false;
    }
    return bcrypt.compare(password, this.password);
  }
} 