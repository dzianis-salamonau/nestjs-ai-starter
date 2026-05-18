import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum AiProvider {
  OPENHUB = 'openhub',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
}

class EnvironmentVariables {
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  PORT?: number;

  @IsString()
  @MinLength(16)
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsString()
  @MinLength(8)
  SERVICE_TOKEN!: string;

  @IsString()
  REDIS_HOST!: string;

  @IsNumber()
  REDIS_PORT!: number;

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;

  @IsOptional()
  @IsString()
  OPENAI_MODEL?: string;

  @IsOptional()
  @IsString()
  ANTHROPIC_API_KEY?: string;

  @IsOptional()
  @IsString()
  ANTHROPIC_MODEL?: string;

  @IsOptional()
  @IsEnum(AiProvider)
  AI_DEFAULT_PROVIDER?: AiProvider;

  @IsString()
  @MinLength(16)
  WEBHOOK_SIGNING_SECRET!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const coerced = {
    ...config,
    PORT: config.PORT !== undefined ? Number(config.PORT) : 3000,
    REDIS_PORT: config.REDIS_PORT !== undefined ? Number(config.REDIS_PORT) : 6379,
    THROTTLE_TTL_MS:
      config.THROTTLE_TTL_MS !== undefined
        ? Number(config.THROTTLE_TTL_MS)
        : 60_000,
    THROTTLE_LIMIT:
      config.THROTTLE_LIMIT !== undefined ? Number(config.THROTTLE_LIMIT) : 100,
  };

  const validated = plainToInstance(EnvironmentVariables, coerced, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return coerced;
}
