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
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Image } from '../../images/entities/image.entity';
import { Message } from '../../messages/entities/message.entity';
import { Report } from '../../reports/entities/report.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { slugify } from '../../../common/utils/slugify';
import { ImageDto } from '../../images/dto/image.dto';

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

  @OneToMany(() => Image, (image) => image.listing)
  images: ImageDto[];

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

  @ManyToOne(() => User, user => user.listings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column()
  sellerId: string;

  @ManyToMany(() => Category, category => category.listings)
  @JoinTable({
    name: 'listing_categories',
    joinColumn: {
      name: 'listingId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'categoryId',
      referencedColumnName: 'id',
    },
  })
  categories: Category[];

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @OneToMany(() => Message, message => message.listing)
  messages: Message[];

  @OneToMany(() => Report, report => report.listing)
  reports: Report[];

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

  @ManyToOne(() => Category, category => category.listings)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  condition: string;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.title) {
      this.slug = slugify(this.title);
    }
  }
} 

