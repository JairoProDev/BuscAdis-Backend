import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Publication } from '../../publications/entities/publication.entity';

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
  publicationId: string;

  @ManyToOne(() => Publication, publication => publication.images)
  @JoinColumn({ name: 'publicationId' })
  publication: Publication;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 