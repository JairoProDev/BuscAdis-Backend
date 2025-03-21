import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsUrl,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportStatus, ReportType } from '../entities/report.entity';
import { PublicationType } from '../../publications/entities/publication.entity';

class EvidenceDto {
  @ApiProperty({ type: [String], description: 'URLs of evidence (images, documents, etc.)' })
  @IsArray()
  @IsUrl({}, { each: true })
  urls: string[];

  @ApiProperty({ description: 'Description of the evidence' })
  @IsString()
  @MinLength(10)
  description: string;
}

export class CreateReportDto {
  @ApiProperty({ enum: ReportType })
  type: ReportType;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  reportedUserId?: string;

  @ApiPropertyOptional()
  publicationId?: string;
}

export class UpdateReportDto {
  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

class UserInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;
}

class PublicationInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: PublicationType })
  type: PublicationType;
}

export class ReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ReportType })
  type: ReportType;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: ReportStatus })
  status: ReportStatus;

  @ApiProperty()
  reporter: UserInfo;

  @ApiPropertyOptional()
  reportedUser?: UserInfo;

  @ApiPropertyOptional()
  publication?: PublicationInfo | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  resolvedAt?: Date;
} 