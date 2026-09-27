import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReservationsService, CancelReservationDto, RescheduleReservationDto } from './reservations.service';

@ApiTags('reservations')
@Controller('api/v1/reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: Omit<CancelReservationDto, 'reservationId'>,
  ) {
    return this.reservationsService.cancel({
      ...dto,
      reservationId: id,
    });
  }

  @Post(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation rescheduled successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async reschedule(
    @Param('id') id: string,
    @Body() dto: Omit<RescheduleReservationDto, 'reservationId'>,
  ) {
    return this.reservationsService.reschedule({
      ...dto,
      reservationId: id,
    });
  }

  @Get('staff/:staffId')
  @ApiOperation({ summary: 'Get reservations for a staff member' })
  @ApiResponse({ status: 200, description: 'List of reservations' })
  async getStaffReservations(
    @Param('staffId') staffId: string,
  ) {
    return this.reservationsService.findByStaffId(staffId, new Date());
  }
}
