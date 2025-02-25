import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate, //  BeforeUpdate  importante para actualizar la contraseña
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Listing } from '../../listings/entities/listing.entity';
import { Message } from '../../messages/entities/message.entity';
import { Favorite } from '../../favorites/entities/favorite.entity'; //  Favorite

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum AuthProvider {
  LOCAL = 'local',  //  minúsculas, como buena práctica
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  // ... otros proveedores
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true }) // Debe ser nullable
  password?: string; //  opcional, con ?

  @Column() //  No nullable,  un valor por defecto
  firstName: string;

  @Column() //  No nullable,  un valor por defecto
  lastName: string;

  @Column({ nullable: true }) //  nullable, porque no todos los usuarios tendrán teléfono
  phoneNumber?: string; //  phoneNumber, no phone

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

  @Column({ nullable: true }) //  nullable, solo para proveedores externos
  oauthId?: string; //  oauthId, no providerId.  providerId no tiene sentido

  @Column({ default: true }) //  isActive, no es lo mismo que isVerified
  isActive: boolean;

  @Column({ default: false }) //  isVerified
  isVerified: boolean;

    // Considera eliminar estas dos, si solo usas isVerified
  @Column({ default: false, select: false }) // , select: false  para que no se envíen por defecto
  emailVerified: boolean;

  @Column({ default: false, select: false}) // , select: false  para que no se envíen por defecto
  phoneVerified: boolean;

  @OneToMany(() => Listing, listing => listing.seller)
  listings: Listing[];

  @OneToMany(() => Message, message => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, message => message.receiver)
  receivedMessages: Message[];

  @OneToMany(() => Favorite, favorite => favorite.user) //  Favorite
  favorites: Favorite[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


  @BeforeInsert()
  @BeforeUpdate() //  IMPORTANTE:  También antes de actualizar
  async hashPassword() {
      if (this.password && this.provider === AuthProvider.LOCAL) {
          this.password = await bcrypt.hash(this.password, 10);
      }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (this.provider !== AuthProvider.LOCAL || !this.password) {
      return false;
    }
    return await bcrypt.compare(password, this.password);
  }
}