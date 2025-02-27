import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    whatsapp: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    showEmail?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    showPhone?: boolean;
}
