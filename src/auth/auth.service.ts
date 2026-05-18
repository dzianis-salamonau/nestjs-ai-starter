import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  issueMachineToken(serviceToken: string | undefined) {
    const expected = this.config.getOrThrow<string>('SERVICE_TOKEN');
    if (!serviceToken || serviceToken !== expected) {
      this.log.warn('Rejected token exchange: bad service token');
      throw new UnauthorizedException();
    }
    const sub = 'm2m';
    const access_token = this.jwt.sign({ sub });
    return { access_token, token_type: 'Bearer', expires_in: this.expiresInSec() };
  }

  private expiresInSec(): number {
    const raw = this.config.get<string>('JWT_EXPIRES_IN') ?? '7d';
    const m = /^(\d+)([smhd])$/.exec(raw.trim());
    if (!m) return 604800;
    const n = Number(m[1]);
    const u = m[2];
    const mult =
      u === 's' ? 1 : u === 'm' ? 60 : u === 'h' ? 3600 : u === 'd' ? 86400 : 1;
    return n * mult;
  }
}
