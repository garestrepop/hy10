import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { User } from '../auth/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { StaffService } from '../services/entities/staff-service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Service, StaffService]),
  ],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}
