import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleBlock } from './entities/schedule-block.entity';
import { ScheduleException } from './entities/schedule-exception.entity';
import { Account, AccountRole } from '../access/entities/account.entity';
import {
  ReplaceScheduleDto,
  ScheduleBlockResponseDto,
} from './dto/schedule-block.dto';
import {
  CreateExceptionDto,
  ExceptionResponseDto,
} from './dto/schedule-exception.dto';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(ScheduleBlock)
    private scheduleBlockRepository: Repository<ScheduleBlock>,
    @InjectRepository(ScheduleException)
    private scheduleExceptionRepository: Repository<ScheduleException>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async replaceStaffSchedule(
    actorId: string,
    targetStaffId: string,
    replaceScheduleDto: ReplaceScheduleDto,
  ): Promise<ScheduleBlockResponseDto[]> {
    const actor = await this.accountRepository.findOne({
      where: { id: actorId },
    });

    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    if (actor.role !== AccountRole.ADMIN && actorId !== targetStaffId) {
      throw new ForbiddenException(
        'Staff can only edit their own availability',
      );
    }

    const targetStaff = await this.accountRepository.findOne({
      where: { id: targetStaffId },
    });

    if (!targetStaff) {
      throw new NotFoundException('Staff not found');
    }

    if (targetStaff.role !== AccountRole.STAFF && targetStaff.role !== AccountRole.ADMIN) {
      throw new BadRequestException('Target user is not a staff member');
    }

    this.validateScheduleBlocks(replaceScheduleDto.blocks);

    await this.scheduleBlockRepository.delete({ staff_id: targetStaffId });

    const blocks = replaceScheduleDto.blocks.map((block) => {
      const scheduleBlock = new ScheduleBlock();
      scheduleBlock.staff_id = targetStaffId;
      scheduleBlock.day_of_week = block.day_of_week;
      scheduleBlock.start_time = this.normalizeTime(block.start_time);
      scheduleBlock.end_time = this.normalizeTime(block.end_time);
      return scheduleBlock;
    });

    const savedBlocks = await this.scheduleBlockRepository.save(blocks);

    return savedBlocks.map((block) => this.mapBlockToResponse(block));
  }

  async addException(
    actorId: string,
    targetStaffId: string,
    createExceptionDto: CreateExceptionDto,
  ): Promise<ExceptionResponseDto> {
    const actor = await this.accountRepository.findOne({
      where: { id: actorId },
    });

    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    if (actor.role !== AccountRole.ADMIN && actorId !== targetStaffId) {
      throw new ForbiddenException(
        'Staff can only edit their own availability',
      );
    }

    const targetStaff = await this.accountRepository.findOne({
      where: { id: targetStaffId },
    });

    if (!targetStaff) {
      throw new NotFoundException('Staff not found');
    }

    if (targetStaff.role !== AccountRole.STAFF && targetStaff.role !== AccountRole.ADMIN) {
      throw new BadRequestException('Target user is not a staff member');
    }

    this.validateException(createExceptionDto);

    const exception = new ScheduleException();
    exception.staff_id = targetStaffId;
    exception.exception_type = createExceptionDto.exception_type;
    exception.exception_date = createExceptionDto.exception_date;
    exception.start_time = createExceptionDto.start_time
      ? this.normalizeTime(createExceptionDto.start_time)
      : null;
    exception.end_time = createExceptionDto.end_time
      ? this.normalizeTime(createExceptionDto.end_time)
      : null;

    const savedException =
      await this.scheduleExceptionRepository.save(exception);

    return this.mapExceptionToResponse(savedException);
  }

  async getStaffSchedule(
    actorId: string,
    targetStaffId: string,
  ): Promise<ScheduleBlockResponseDto[]> {
    const actor = await this.accountRepository.findOne({
      where: { id: actorId },
    });

    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    if (actor.role !== AccountRole.ADMIN && actorId !== targetStaffId) {
      throw new ForbiddenException('Staff can only view their own schedule');
    }

    const blocks = await this.scheduleBlockRepository.find({
      where: { staff_id: targetStaffId },
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });

    return blocks.map((block) => this.mapBlockToResponse(block));
  }

  async getStaffExceptions(
    actorId: string,
    targetStaffId: string,
  ): Promise<ExceptionResponseDto[]> {
    const actor = await this.accountRepository.findOne({
      where: { id: actorId },
    });

    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    if (actor.role !== AccountRole.ADMIN && actorId !== targetStaffId) {
      throw new ForbiddenException('Staff can only view their own exceptions');
    }

    const exceptions = await this.scheduleExceptionRepository.find({
      where: { staff_id: targetStaffId },
      order: { exception_date: 'ASC', start_time: 'ASC' },
    });

    return exceptions.map((exception) => this.mapExceptionToResponse(exception));
  }

  async deleteException(
    actorId: string,
    targetStaffId: string,
    exceptionId: string,
  ): Promise<void> {
    const actor = await this.accountRepository.findOne({
      where: { id: actorId },
    });

    if (!actor) {
      throw new NotFoundException('Actor not found');
    }

    if (actor.role !== AccountRole.ADMIN && actorId !== targetStaffId) {
      throw new ForbiddenException(
        'Staff can only delete their own exceptions',
      );
    }

    const exception = await this.scheduleExceptionRepository.findOne({
      where: { id: exceptionId, staff_id: targetStaffId },
    });

    if (!exception) {
      throw new NotFoundException('Exception not found');
    }

    await this.scheduleExceptionRepository.delete(exceptionId);
  }

  private validateScheduleBlocks(blocks: any[]): void {
    for (const block of blocks) {
      const start = this.parseTime(block.start_time);
      const end = this.parseTime(block.end_time);

      if (start >= end) {
        throw new BadRequestException(
          `Invalid time range: ${block.start_time} to ${block.end_time}. Start time must be before end time.`,
        );
      }
    }
  }

  private validateException(exception: CreateExceptionDto): void {
    if (
      (exception.start_time && !exception.end_time) ||
      (!exception.start_time && exception.end_time)
    ) {
      throw new BadRequestException(
        'Both start_time and end_time must be provided together, or both omitted',
      );
    }

    if (exception.start_time && exception.end_time) {
      const start = this.parseTime(exception.start_time);
      const end = this.parseTime(exception.end_time);

      if (start >= end) {
        throw new BadRequestException(
          `Invalid time range: ${exception.start_time} to ${exception.end_time}. Start time must be before end time.`,
        );
      }
    }
  }

  private parseTime(timeStr: string): number {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
  }

  private normalizeTime(timeStr: string): string {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    }
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
  }

  private mapBlockToResponse(block: ScheduleBlock): ScheduleBlockResponseDto {
    return {
      id: block.id,
      staff_id: block.staff_id,
      day_of_week: block.day_of_week,
      start_time: block.start_time,
      end_time: block.end_time,
      created_at: block.created_at,
      updated_at: block.updated_at,
    };
  }

  private mapExceptionToResponse(
    exception: ScheduleException,
  ): ExceptionResponseDto {
    return {
      id: exception.id,
      staff_id: exception.staff_id,
      exception_type: exception.exception_type,
      exception_date: exception.exception_date,
      start_time: exception.start_time,
      end_time: exception.end_time,
      created_at: exception.created_at,
      updated_at: exception.updated_at,
    };
  }
}
