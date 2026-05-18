import {
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('token')
  @ApiOperation({
    summary: 'Exchange service token for JWT (set x-service-token header)',
  })
  @ApiHeader({ name: 'x-service-token', required: true })
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  token(@Headers('x-service-token') serviceToken: string | undefined) {
    if (!serviceToken) throw new UnauthorizedException('missing service token');
    return this.auth.issueMachineToken(serviceToken);
  }
}
