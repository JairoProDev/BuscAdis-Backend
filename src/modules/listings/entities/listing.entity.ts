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
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

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
  DRAFT = 'draft',
  PUBLISHED = 'published',
  UNDER_REVIEW = 'under_review',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  ARCHIVED = 'archived'
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

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({
    type: 'enum',
    enum: PriceType,
    default: PriceType.CONTACT
  })
  priceType: PriceType;

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
  }>;

  @Column('jsonb', { nullable: true })
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };

  @Column('jsonb', { nullable: true })
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    showEmail?: boolean;
    showPhone?: boolean;
  };

  @Column({ default: 0 })
  views: number;

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

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner: User;

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'listing_categories',
    joinColumn: { name: 'listing_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
  })
  categories: Category[];

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  // Virtual fields
  @Column({ select: false, insert: false, update: false, nullable: true })
  distance?: number;

  @Column({ select: false, insert: false, update: false, nullable: true })
  relevanceScore?: number;
} 