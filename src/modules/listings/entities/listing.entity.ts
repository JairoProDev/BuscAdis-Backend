import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  Index,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Message } from '../../messages/entities/message.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';

export enum ListingType {
  JOB = 'job',
  REAL_ESTATE = 'real_estate',
  VEHICLE = 'vehicle',
  SERVICE = 'service',
  PRODUCT = 'product',
  EVENT = 'event',
  EDUCATION = 'education',
  TOURISM = 'tourism',
  PET = 'pet',
  BUSINESS = 'business',
  OTHER = 'other'
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PUBLISHED = 'PUBLISHED',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED'
}

export enum PriceType {
  FIXED = 'fixed',
  NEGOTIABLE = 'negotiable',
  FREE = 'free',
  CONTACT = 'contact',
  HOURLY = 'hourly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

@Entity('listings')
@Index(['title', 'description'], { fulltext: true })
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  title: string;

  @Column()
  slug: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ListingType,
    default: ListingType.OTHER
  })
  type: ListingType;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: PriceType,
    default: PriceType.FIXED,
  })
  priceType: PriceType = PriceType.FIXED;

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.DRAFT
  })
  status: ListingStatus;

  @Column('jsonb', { nullable: true })
  attributes: Record<string, any>;

  @Column('jsonb', { default: [] })
  images: Array<{
    url: string;
    alt?: string;
    order: number;
  }> = [];

  @Column({ type: 'jsonb', nullable: true })
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    showEmail?: boolean;
    showPhone?: boolean;
  };

  @Column({ default: 0 })
  views: number = 0;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isUrgent: boolean;

  @ManyToOne(() => User, user => user.listings)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => Category, category => category.listings)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @OneToMany(() => Message, message => message.listing)
  messages: Message[];

  @OneToMany(() => Favorite, favorite => favorite.listing)
  favorites: Favorite[];

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields
  @Column({ select: false, insert: false, update: false, nullable: true })
  distance?: number;

  @Column({ select: false, insert: false, update: false, nullable: true })
  relevanceScore?: number;
} 

