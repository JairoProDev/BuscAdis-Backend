import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  key: string;

  @Column()
  bucket: string;

  @Column()
  mimeType: string;

  @Column()
  order: number;

  @Column({ default: '' })
  alt: string;

  @Column({ nullable: true })
  thumbnail?: string;

  @Column()
  listingId: string;

  @ManyToOne(() => Listing, listing => listing.images)
  @JoinColumn({ name: 'listingId' })
  listing: Listing;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 