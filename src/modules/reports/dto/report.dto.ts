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
import { ReportReason, ReportStatus } from '../entities/report.entity';

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
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  listingId: string;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiProperty({ example: 'This listing contains inappropriate content...' })
  @IsString()
  @MinLength(20)
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => EvidenceDto)
  evidence?: EvidenceDto;
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

export class ReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty()
  listing: {
    id: string;
    title: string;
    slug: string;
    type: string;
  };

  @ApiProperty()
  reason: ReportReason;

  @ApiProperty()
  description: string;

  @ApiProperty()
  status: ReportStatus;

  @ApiPropertyOptional()
  adminNotes?: string;

  @ApiPropertyOptional()
  evidence?: {
    urls: string[];
    description: string;
  };

  @ApiPropertyOptional()
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  resolvedAt?: Date;
} 