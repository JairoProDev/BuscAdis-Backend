import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const getJwtConfig = (
  configService: ConfigService,
): JwtModuleOptions => ({
  secret: configService.get('jwt.secret'),
  signOptions: {
    expiresIn: configService.get('jwt.expiresIn'),
  },
}); 