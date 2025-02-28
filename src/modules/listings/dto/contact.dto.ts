import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    whatsapp: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty()
    @IsBoolean()
    showEmail: boolean;

    @ApiProperty()
    @IsBoolean()
    showPhone: boolean;
}
