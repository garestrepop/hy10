import { Module } from '@nestjs/common';
import { AgentToolsService } from './agent-tools.service';
import { AgentToolsController } from './agent-tools.controller';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [ReservationsModule],
  controllers: [AgentToolsController],
  providers: [AgentToolsService],
  exports: [AgentToolsService],
})
export class AgentModule {}
