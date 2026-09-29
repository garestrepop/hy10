import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AgendaService } from './agenda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';
import { AccessRole } from '../access/access-token';
import { SetBusinessHoursDto } from './dto/business-hours.dto';
import { ReplaceStaffScheduleDto } from './dto/schedule-block.dto';
import { AddExceptionDto } from './dto/exception.dto';
import { SlotDto } from './dto/availability.dto';
import { OccupancyResponseDto } from './dto/occupancy.dto';

@ApiTags('agenda')
@Controller('agenda')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post('business-hours')
  @Roles('admin')
  @ApiOperation({ summary: 'Set business hours (Admin only)' })
  @ApiResponse({ status: 200, description: 'Business hours updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async setBusinessHours(
    @CurrentUser() user: User,
    @Body() dto: SetBusinessHoursDto,
  ) {
    return this.agendaService.setBusinessHours(user, dto);
  }

  @Get('business-hours')
  @ApiOperation({ summary: 'Get business hours' })
  @ApiResponse({ status: 200, description: 'Business hours retrieved' })
  async getBusinessHours() {
    return this.agendaService.getBusinessHours();
  }

  @Post('staff/schedule')
  @ApiOperation({ summary: 'Replace staff schedule blocks' })
  @ApiResponse({ status: 200, description: 'Schedule updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  async replaceStaffSchedule(
    @CurrentUser() user: User,
    @Body() dto: ReplaceStaffScheduleDto,
  ) {
    return this.agendaService.replaceStaffSchedule(user, dto);
  }

  @Post('staff/exception')
  @ApiOperation({ summary: 'Add schedule exception for staff' })
  @ApiResponse({ status: 201, description: 'Exception added' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  async addException(
    @CurrentUser() user: User,
    @Body() dto: AddExceptionDto,
  ) {
    return this.agendaService.addException(user, dto);
  }

  @Get('staff/:staffId/schedule')
  @ApiOperation({ summary: 'Get staff schedule with blocks and exceptions' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved' })
  @ApiResponse({ status: 404, description: 'Staff not found' })
  async getStaffSchedule(@Param('staffId') staffId: string) {
    return this.agendaService.getStaffSchedule(staffId);
  }

  @Get('staff/schedules/all')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all staff schedules (Admin only)' })
  @ApiResponse({ status: 200, description: 'All schedules retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllStaffSchedules() {
    return this.agendaService.getAllStaffSchedules();
  }

  @Get('availability')
  @ApiOperation({ summary: 'Get available time slots for a service' })
  @ApiResponse({
    status: 200,
    description: 'Available slots retrieved',
    type: [SlotDto],
  })
  @ApiResponse({ status: 404, description: 'Service or staff not found' })
  async getAvailability(
    @Query('service_id') serviceId: string,
    @Query('date') date: string,
    @Query('staff_id') staffId?: string,
  ) {
    return this.agendaService.getAvailability(serviceId, date, staffId);
  }

  @Get('occupancy')
  @Roles('admin')
  @ApiOperation({ summary: 'Get business occupancy metrics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Occupancy data retrieved',
    type: OccupancyResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOccupancy(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.agendaService.getOccupancy(startDate, endDate);
  }
}
