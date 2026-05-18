import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { BullmqRootModule } from './queue/bullmq-root.module';
import { AuthModule } from './auth/auth.module';
import { VectorModule } from './vector/vector.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { validateEnv } from './config/env.validation';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: { get: (k: string) => unknown }) => ({
        pinoHttp: {
          level: (config.get('LOG_LEVEL') as string) || 'info',
          transport:
            (config.get('NODE_ENV') as string) !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: { singleLine: true, colorize: true },
                }
              : undefined,
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: { get: (k: string) => unknown }) => [
        {
          ttl:
            Number(config.get('THROTTLE_TTL_MS') ?? 60_000),
          limit: Number(config.get('THROTTLE_LIMIT') ?? 100),
        },
      ],
      inject: [ConfigService],
    }),
    BullmqRootModule,
    AuthModule,
    WebhooksModule,
    AiModule,
    VectorModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
