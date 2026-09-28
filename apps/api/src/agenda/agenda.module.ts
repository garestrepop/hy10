import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { ScheduleBlock } from './entities/schedule-block.entity';
import { ScheduleException } from './entities/schedule-exception.entity';
import { Account } from '../access/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleBlock, ScheduleException, Account]),
  ],
  controllers: [AgendaController],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
