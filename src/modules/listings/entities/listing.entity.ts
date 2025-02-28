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
import { ListingType, ListingStatus, PriceType } from '../types/listing.types';
import { ContactDto } from '../dto/contact.dto';
import { LocationDto } from '../dto/location.dto';

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
    default: ListingType.OTHER,
  })
  type: ListingType;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: PriceType,
    default: PriceType.FIXED,
  })
  priceType: PriceType;

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.DRAFT,
  })
  status: ListingStatus;

  @Column('jsonb')
  contact: ContactDto;

  @Column('jsonb')
  location: LocationDto;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isUrgent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.listings)
  seller: User;

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'listing_categories',
    joinColumn: { name: 'listing_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @OneToMany(() => Image, image => image.listing)
  images: Image[];

  @Column('jsonb', { nullable: true })
  attributes?: Record<string, any>;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  favorites: number;

  @OneToMany(() => Message, message => message.listing)
  messages: Message[];

  @OneToMany(() => Report, report => report.listing)
  reports: Report[];

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

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

export { ListingType, ListingStatus, PriceType }; 

