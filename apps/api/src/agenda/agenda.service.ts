import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { BusinessHours } from './entities/business-hours.entity';
import { StaffScheduleBlock } from './entities/staff-schedule-block.entity';
import { StaffException, ExceptionType } from './entities/staff-exception.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { StaffService } from '../services/entities/staff-service.entity';
import { SetBusinessHoursDto } from './dto/business-hours.dto';
import { ReplaceStaffScheduleDto } from './dto/schedule-block.dto';
import { AddExceptionDto } from './dto/exception.dto';
import { SlotDto } from './dto/availability.dto';
import { OccupancyResponseDto, StaffOccupancyDto } from './dto/occupancy.dto';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(BusinessHours)
    private businessHoursRepo: Repository<BusinessHours>,
    @InjectRepository(StaffScheduleBlock)
    private scheduleBlockRepo: Repository<StaffScheduleBlock>,
    @InjectRepository(StaffException)
    private exceptionRepo: Repository<StaffException>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    @InjectRepository(StaffService)
    private staffServiceRepo: Repository<StaffService>,
  ) {}

  async setBusinessHours(
    actor: User,
    dto: SetBusinessHoursDto,
  ): Promise<BusinessHours[]> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can set business hours');
    }

    await this.businessHoursRepo.delete({});

    const hours = dto.hours.map((h) => {
      const entity = this.businessHoursRepo.create(h);
      return entity;
    });

    return this.businessHoursRepo.save(hours);
  }

  async getBusinessHours(): Promise<BusinessHours[]> {
    return this.businessHoursRepo.find({
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  async replaceStaffSchedule(
    actor: User,
    dto: ReplaceStaffScheduleDto,
  ): Promise<StaffScheduleBlock[]> {
    if (actor.role !== UserRole.ADMIN && actor.id !== dto.staff_id) {
      throw new ForbiddenException(
        'Staff can only edit their own schedule, admins can edit any',
      );
    }

    const staff = await this.userRepo.findOne({
      where: { id: dto.staff_id },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    const businessHours = await this.getBusinessHours();
    
    for (const block of dto.blocks) {
      const dayHours = businessHours.filter(
        (bh) => bh.day_of_week === block.day_of_week,
      );

      if (dayHours.length === 0) {
        throw new BadRequestException(
          `No business hours defined for day ${block.day_of_week}`,
        );
      }

      const blockStart = this.timeToMinutes(block.start_time);
      const blockEnd = this.timeToMinutes(block.end_time);

      const isWithinBusinessHours = dayHours.some((bh) => {
        const bhStart = this.timeToMinutes(bh.start_time);
        const bhEnd = this.timeToMinutes(bh.end_time);
        return blockStart >= bhStart && blockEnd <= bhEnd;
      });

      if (!isWithinBusinessHours) {
        throw new BadRequestException(
          `Block ${block.start_time}-${block.end_time} on day ${block.day_of_week} is outside business hours`,
        );
      }
    }

    await this.scheduleBlockRepo.delete({ staff_id: dto.staff_id });

    const blocks = dto.blocks.map((b) =>
      this.scheduleBlockRepo.create({
        staff_id: dto.staff_id,
        ...b,
      }),
    );

    return this.scheduleBlockRepo.save(blocks);
  }

  async addException(
    actor: User,
    dto: AddExceptionDto,
  ): Promise<StaffException> {
    if (actor.role !== UserRole.ADMIN && actor.id !== dto.staff_id) {
      throw new ForbiddenException(
        'Staff can only add exceptions to their own schedule, admins can edit any',
      );
    }

    const staff = await this.userRepo.findOne({
      where: { id: dto.staff_id },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    const exception = this.exceptionRepo.create(dto);
    return this.exceptionRepo.save(exception);
  }

  async getStaffSchedule(
    staffId: string,
  ): Promise<{ blocks: StaffScheduleBlock[]; exceptions: StaffException[] }> {
    const blocks = await this.scheduleBlockRepo.find({
      where: { staff_id: staffId },
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });

    const exceptions = await this.exceptionRepo.find({
      where: { staff_id: staffId },
      order: { date: 'ASC', start_time: 'ASC' },
    });

    return { blocks, exceptions };
  }

  async getAllStaffSchedules(): Promise<
    Array<{
      staff: User;
      blocks: StaffScheduleBlock[];
      exceptions: StaffException[];
    }>
  > {
    const allStaff = await this.userRepo.find({
      where: { role: UserRole.STAFF, is_active: true },
    });

    const schedules = await Promise.all(
      allStaff.map(async (staff) => {
        const { blocks, exceptions } = await this.getStaffSchedule(staff.id);
        return { staff, blocks, exceptions };
      }),
    );

    return schedules;
  }

  async getAvailability(
    serviceId: string,
    date: string,
    staffId?: string,
  ): Promise<SlotDto[]> {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, is_active: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found or inactive');
    }

    let eligibleStaff: User[];

    if (staffId) {
      const staff = await this.userRepo.findOne({
        where: { id: staffId, is_active: true },
      });

      if (!staff) {
        throw new NotFoundException('Staff not found or inactive');
      }

      const association = await this.staffServiceRepo.findOne({
        where: { staff_id: staffId, service_id: serviceId },
      });

      if (!association) {
        throw new BadRequestException('Staff not associated with this service');
      }

      eligibleStaff = [staff];
    } else {
      const associations = await this.staffServiceRepo.find({
        where: { service_id: serviceId },
      });

      const staffIds = associations.map((a) => a.staff_id);

      if (staffIds.length === 0) {
        return [];
      }

      eligibleStaff = await this.userRepo.find({
        where: { id: In(staffIds), is_active: true },
      });
    }

    const slots: SlotDto[] = [];
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    for (const staff of eligibleStaff) {
      const { blocks, exceptions } = await this.getStaffSchedule(staff.id);

      const dayBlocks = blocks.filter((b) => b.day_of_week === dayOfWeek);

      const dateExceptions = exceptions.filter((e) => e.date === date);

      for (const block of dayBlocks) {
        const isBlocked = dateExceptions.some(
          (e) => e.type === ExceptionType.BLOCK,
        );

        if (!isBlocked) {
          const blockStart = this.timeToMinutes(block.start_time);
          const blockEnd = this.timeToMinutes(block.end_time);
          const duration = service.duration_minutes;

          for (
            let time = blockStart;
            time + duration <= blockEnd;
            time += duration
          ) {
            const startTime = this.minutesToTime(time);
            const endTime = this.minutesToTime(time + duration);

            const startDateTime = `${date}T${startTime}:00-05:00`;
            const endDateTime = `${date}T${endTime}:00-05:00`;

            const staffName = staff.first_name && staff.last_name 
              ? `${staff.first_name} ${staff.last_name}` 
              : staff.email;

            slots.push({
              start: startDateTime,
              end: endDateTime,
              staff_id: staff.id,
              staff_name: staffName,
            });
          }
        }
      }

      for (const exception of dateExceptions) {
        if (exception.type === ExceptionType.OPENING) {
          const exStart = this.timeToMinutes(exception.start_time);
          const exEnd = this.timeToMinutes(exception.end_time);
          const duration = service.duration_minutes;

          for (
            let time = exStart;
            time + duration <= exEnd;
            time += duration
          ) {
            const startTime = this.minutesToTime(time);
            const endTime = this.minutesToTime(time + duration);

            const startDateTime = `${date}T${startTime}:00-05:00`;
            const endDateTime = `${date}T${endTime}:00-05:00`;

            const staffName = staff.first_name && staff.last_name 
              ? `${staff.first_name} ${staff.last_name}` 
              : staff.email;

            slots.push({
              start: startDateTime,
              end: endDateTime,
              staff_id: staff.id,
              staff_name: staffName,
            });
          }
        }
      }
    }

    return slots.sort((a, b) => a.start.localeCompare(b.start));
  }

  async getOccupancy(
    startDate: string,
    endDate: string,
  ): Promise<OccupancyResponseDto> {
    const allStaff = await this.userRepo.find({
      where: { role: UserRole.STAFF, is_active: true },
    });

    const staffOccupancy: StaffOccupancyDto[] = allStaff.map((staff) => {
      const staffName = staff.first_name && staff.last_name 
        ? `${staff.first_name} ${staff.last_name}` 
        : staff.email;
      
      return {
        staff_id: staff.id,
        staff_name: staffName,
        total_appointments: 0,
        upcoming_appointments: 0,
        completed_appointments: 0,
        total_hours: 0,
      };
    });

    return {
      start_date: startDate,
      end_date: endDate,
      total_appointments: 0,
      total_revenue: 0,
      staff_occupancy: staffOccupancy,
    };
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}
