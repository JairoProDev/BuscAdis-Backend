import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '../../users/entities/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');
    const callbackURL = `${configService.get(
      'API_URL',
      'http://localhost:3001',
    )}/auth/google/callback`;

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error(
        'Google authentication configuration is missing (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, API_URL)',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      id: profile.id,
    };

    const result = await this.authService.handleSocialAuth(
      user,
      AuthProvider.GOOGLE,
    );
    done(null, result);
  }
}