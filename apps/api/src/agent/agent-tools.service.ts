import { Injectable, Logger } from '@nestjs/common';
import { ReservationsService } from '../reservations/reservations.service';
import { Reservation } from '../reservations/entities/reservation.entity';

export interface StaffAgendaQuery {
  staffId: string;
  fromDate?: Date;
}

@Injectable()
export class AgentToolsService {
  private readonly logger = new Logger(AgentToolsService.name);

  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  async readStaffAgenda(query: StaffAgendaQuery): Promise<Reservation[]> {
    this.logger.log(
      `Reading agenda for staff ${query.staffId}`,
    );

    const reservations = await this.reservationsService.findByStaffId(
      query.staffId,
      query.fromDate || new Date(),
    );

    this.logger.log(
      `Found ${reservations.length} reservations for staff ${query.staffId}`,
    );

    return reservations;
  }
}
