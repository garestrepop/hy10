import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { JwtAuthGuard } from '../access/guards/jwt-auth.guard';
import { CurrentUser } from '../access/current-user.decorator';
import { AccessPrincipal } from '../access/access-token';
import {
  ReplaceScheduleDto,
  ScheduleBlockResponseDto,
} from './dto/schedule-block.dto';
import {
  CreateExceptionDto,
  ExceptionResponseDto,
} from './dto/schedule-exception.dto';

@Controller('api/v1/staff')
@UseGuards(JwtAuthGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post(':id/schedule')
  @HttpCode(HttpStatus.OK)
  async replaceSchedule(
    @CurrentUser() actor: AccessPrincipal,
    @Param('id') staffId: string,
    @Body() replaceScheduleDto: ReplaceScheduleDto,
  ): Promise<ScheduleBlockResponseDto[]> {
    return this.agendaService.replaceStaffSchedule(
      actor.id,
      staffId,
      replaceScheduleDto,
    );
  }

  @Get(':id/schedule')
  async getSchedule(
    @CurrentUser() actor: AccessPrincipal,
    @Param('id') staffId: string,
  ): Promise<ScheduleBlockResponseDto[]> {
    return this.agendaService.getStaffSchedule(actor.id, staffId);
  }

  @Post(':id/exceptions')
  @HttpCode(HttpStatus.CREATED)
  async addException(
    @CurrentUser() actor: AccessPrincipal,
    @Param('id') staffId: string,
    @Body() createExceptionDto: CreateExceptionDto,
  ): Promise<ExceptionResponseDto> {
    return this.agendaService.addException(
      actor.id,
      staffId,
      createExceptionDto,
    );
  }

  @Get(':id/exceptions')
  async getExceptions(
    @CurrentUser() actor: AccessPrincipal,
    @Param('id') staffId: string,
  ): Promise<ExceptionResponseDto[]> {
    return this.agendaService.getStaffExceptions(actor.id, staffId);
  }

  @Delete(':staffId/exceptions/:exceptionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteException(
    @CurrentUser() actor: AccessPrincipal,
    @Param('staffId') staffId: string,
    @Param('exceptionId') exceptionId: string,
  ): Promise<void> {
    await this.agendaService.deleteException(
      actor.id,
      staffId,
      exceptionId,
    );
  }
}
