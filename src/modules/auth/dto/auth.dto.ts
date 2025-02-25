import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty() // Añadido: El email no debe estar vacío
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty() // Añadido: la contraseña no debe estar vacía
  @MinLength(8)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty() // Añadido: El nombre no debe estar vacío
  @Matches(/^[a-zA-Z\s]+$/, { message: 'First name can only contain letters and spaces' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty() // Añadido: El apellido no debe estar vacío
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Last name can only contain letters and spaces' })
  lastName: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty() // Añadido: El email no debe estar vacío
  email: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Password must contain at least 8 characters, one uppercase letter, one number, and one special character'
  })
  @IsString()
  @IsNotEmpty() // Añadido: La contraseña no debe estar vacía
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    { message: 'Password too weak' }
  )
  password: string;
}

export class PhoneVerificationDto {
  @ApiProperty({ example: '+1234567890' })
  @IsPhoneNumber()
  @IsNotEmpty() // Añadido: El teléfono no debe estar vacío
  phone: string;
}

export class VerifyPhoneDto extends PhoneVerificationDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty() // Añadido: el codigo no debe estar vacío
  @MinLength(6)
  code: string;
}

export class SocialAuthDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()  //Añadido, el token no puede estar vacío
    accessToken: string;
}