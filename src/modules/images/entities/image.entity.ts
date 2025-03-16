import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Classifiedad } from '../../classifiedads/entities/classifiedad.entity';

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
  classifiedadId: string;

  @ManyToOne(() => Classifiedad, classifiedad => classifiedad.images)
  @JoinColumn({ name: 'classifiedadId' })
  classifiedad: Classifiedad;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 