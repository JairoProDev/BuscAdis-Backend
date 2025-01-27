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
  SOLD = 'sold',
  ARCHIVED = 'archived',
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
  id: string = '';

  @Column()
  @Index()
  title: string = '';

  @Column({ unique: true })
  slug: string = '';

  @Column('text')
  description: string = '';

  @Column({
    type: 'enum',
    enum: ListingType,
    default: ListingType.OTHER
  })
  type: ListingType;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number = 0;

  @Column({
    type: 'enum',
    enum: PriceType,
    default: PriceType.FIXED,
  })
  priceType: PriceType = PriceType.FIXED;

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.DRAFT,
  })
  status: ListingStatus = ListingStatus.DRAFT;

  @Column('jsonb', { nullable: true })
  attributes: Record<string, any>;

  @Column('jsonb', { default: [] })
  images: Array<{
    url: string;
    alt?: string;
    order: number;
  }> = [];

  @Column('jsonb', { nullable: true })
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  } = {
    address: '',
    city: '',
    state: '',
    country: '',
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
  views: number = 0;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: true })
  isActive: boolean = true;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isUrgent: boolean;

  @ManyToOne(() => User, user => user.listings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  seller: User;

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
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  soldAt?: Date;

  // Virtual fields
  @Column({ select: false, insert: false, update: false, nullable: true })
  distance?: number;

  @Column({ select: false, insert: false, update: false, nullable: true })
  relevanceScore?: number;
} 

