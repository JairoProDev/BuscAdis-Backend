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

  @Column({ nullable: true })
  thumbnail?: string;

  @Column({ default: 0 })
  order: number;

  @Column({ nullable: true })
  listingId?: string;

  @ManyToOne(() => Listing, listing => listing.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listingId' })
  listing?: Listing;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 