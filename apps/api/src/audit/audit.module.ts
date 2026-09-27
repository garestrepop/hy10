import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@hy10/database';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
    AuditService,
  ],
  exports: [AuditService, PrismaClient],
})
export class AuditModule {}
