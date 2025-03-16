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
import { ClassifiedadType, ClassifiedadStatus, PriceType } from '../types/classifiedad.types';
import { ContactDto } from '../dto/contact.dto';
import { LocationDto } from '../dto/location.dto';

@Entity('classifiedads')
@Index(['title', 'description'], { fulltext: true })
export class Classifiedad {
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
    enum: ClassifiedadType,
    default: ClassifiedadType.OTHER,
  })
  type: ClassifiedadType;

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
    enum: ClassifiedadStatus,
    default: ClassifiedadStatus.DRAFT,
  })
  status: ClassifiedadStatus;

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

  @ManyToOne(() => User, user => user.classifiedads)
  seller: User;

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'classifiedad_categories',
    joinColumn: { name: 'classifiedad_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @OneToMany(() => Image, image => image.classifiedad)
  images: Image[];

  @Column('jsonb', { nullable: true })
  attributes?: Record<string, any>;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  favorites: number;

  @OneToMany(() => Message, message => message.classifiedad)
  messages: Message[];

  @OneToMany(() => Report, report => report.classifiedad)
  reports: Report[];

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ select: false, insert: false, update: false, nullable: true })
  distance?: number;

  @Column({ select: false, insert: false, update: false, nullable: true })
  relevanceScore?: number;

  @ManyToOne(() => Category, category => category.classifiedads)
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

export { ClassifiedadType, ClassifiedadStatus, PriceType }; 

