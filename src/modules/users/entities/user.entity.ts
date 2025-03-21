import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Publication } from '../../publications/entities/publication.entity';
import { Message } from '../../messages/entities/message.entity';
import { Report } from '../../reports/entities/report.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { Notification } from '../../notifications/entities/notification.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  // Añade otros proveedores si los tienes
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true, select: false }) //  nullable y select: false
  password?: string; // Opcional

  @Column({ nullable: true })
  phoneNumber?: string; //  phoneNumber, y opcional

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;

  @Column({ nullable: true })  //  nullable, solo para usuarios OAuth
  oauthId?: string;    //  oauthId, y opcional.

  @Column({ default: true }) //  isActive
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

    @Column({ default: false }) //  isVerified
    isVerified: boolean;

  @OneToMany(() => Publication, publication => publication.seller)
  publications: Publication[];

  @OneToMany(() => Message, message => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, message => message.receiver)
  receivedMessages: Message[];

  @OneToMany(() => Report, report => report.reporter)
  reports: Report[];

  @OneToMany(() => Favorite, favorite => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => Notification, notification => notification.user)
  notifications: Notification[];

  @BeforeInsert()
  @BeforeUpdate()
  trimFields() {
    if (this.firstName) {
      this.firstName = this.firstName.trim();
    }
    if (this.lastName) {
      this.lastName = this.lastName.trim();
    }
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && this.provider === AuthProvider.LOCAL) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (this.provider !== AuthProvider.LOCAL || !this.password) {
      return false; //  Si no es autenticación local, no hay contraseña
    }
    return bcrypt.compare(password, this.password);
  }
}