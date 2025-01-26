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

export enum ProductStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  UNDER_REVIEW = 'under_review',
  REJECTED = 'rejected',
  SOLD = 'sold',
  ARCHIVED = 'archived'
}

export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  SALVAGE = 'salvage'
}

export enum PriceType {
  FIXED = 'fixed',
  NEGOTIABLE = 'negotiable',
  FREE = 'free',
  CONTACT = 'contact'
}

@Entity('products')
@Index(['title', 'description'], { fulltext: true })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  title: string;

  @Column()
  slug: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: PriceType,
    default: PriceType.FIXED
  })
  priceType: PriceType;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT
  })
  status: ProductStatus;

  @Column({
    type: 'enum',
    enum: ProductCondition,
    default: ProductCondition.NEW
  })
  condition: ProductCondition;

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

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  seller: User;

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'product_categories',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
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
  soldAt: Date;

  // Virtual fields
  @Column({ select: false, insert: false, update: false, nullable: true })
  distance?: number;

  @Column({ select: false, insert: false, update: false, nullable: true })
  relevanceScore?: number;
} 