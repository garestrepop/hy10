import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { BusinessHours } from './entities/business-hours.entity';
import { StaffScheduleBlock } from './entities/staff-schedule-block.entity';
import { StaffException } from './entities/staff-exception.entity';
import { User } from '../auth/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { StaffService } from '../services/entities/staff-service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessHours,
      StaffScheduleBlock,
      StaffException,
      User,
      Service,
      StaffService,
    ]),
  ],
  controllers: [AgendaController],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
