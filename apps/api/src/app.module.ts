import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AccessModule } from './access/access.module';
import { SettingsModule } from './settings/settings.module';
import { EmailModule } from './email/email.module';
import { ServicesModule } from './services/services.module';
import { AgendaModule } from './agenda/agenda.module';
import { OperationsModule } from './operations/operations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'hy10',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: process.env.NODE_ENV !== 'production',
      migrationsRun: false,
    }),
    EmailModule,
    AuthModule,
    AccessModule,
    AuditModule,
    HealthModule,
    SettingsModule,
    ServicesModule,
    AgendaModule,
    OperationsModule,
  ],
})
export class AppModule {}
