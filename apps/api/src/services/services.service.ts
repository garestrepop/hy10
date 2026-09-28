import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AccessPrincipal } from '../access/access-token';
import { AuditService } from '../audit/audit.service';
import { ActorType, AuditAction } from '../audit/entities/audit-log.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { SettingsService } from '../settings/settings.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ResolvedPolicyDto, ServiceResponseDto } from './dto/service-response.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AssociateStaffDto } from './dto/associate-staff.dto';
import { Service } from './entities/service.entity';
import { StaffService } from './entities/staff-service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(StaffService)
    private readonly staffServiceRepository: Repository<StaffService>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
  ) {}

  async create(
    actor: AccessPrincipal,
    dto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    const service = this.serviceRepository.create({
      ...dto,
      is_active: true,
    });

    const saved = await this.serviceRepository.save(service);

    await this.auditService.record({
      action: AuditAction.SERVICE_CREATED,
      actor_type: ActorType.USER,
      actor_id: actor.id,
      actor_email: actor.email,
      actor_role: actor.role,
      entity_type: 'service',
      entity_id: saved.id,
      previous_value: null,
      new_value: this.toResponse(saved),
    });

    return this.toResponse(saved);
  }

  async findAll(includeInactive = false): Promise<ServiceResponseDto[]> {
    const queryBuilder = this.serviceRepository.createQueryBuilder('service');

    if (!includeInactive) {
      queryBuilder.where('service.is_active = :isActive', { isActive: true });
    }

    const services = await queryBuilder
      .orderBy('service.created_at', 'DESC')
      .getMany();

    return services.map((s) => this.toResponse(s));
  }

  async findOne(id: string): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return this.toResponse(service);
  }

  async update(
    id: string,
    actor: AccessPrincipal,
    dto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const previous = this.toResponse(service);

    Object.assign(service, dto);
    const saved = await this.serviceRepository.save(service);

    await this.auditService.record({
      action: AuditAction.SERVICE_UPDATED,
      actor_type: ActorType.USER,
      actor_id: actor.id,
      actor_email: actor.email,
      actor_role: actor.role,
      entity_type: 'service',
      entity_id: saved.id,
      previous_value: previous,
      new_value: this.toResponse(saved),
    });

    return this.toResponse(saved);
  }

  async deactivate(id: string, actor: AccessPrincipal): Promise<ServiceResponseDto> {
    return this.update(id, actor, { is_active: false });
  }

  async resolvePolicy(serviceId: string): Promise<ResolvedPolicyDto> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    const globalSettings = await this.settingsService.get();

    return {
      allow_cancel: service.allow_cancel ?? globalSettings.allow_cancel,
      allow_reschedule: service.allow_reschedule ?? globalSettings.allow_reschedule,
      cancel_min_hours: service.cancel_min_hours ?? globalSettings.cancel_min_hours,
      reschedule_min_hours: service.reschedule_min_hours ?? globalSettings.reschedule_min_hours,
      max_reschedules: service.max_reschedules ?? globalSettings.max_reschedules,
    };
  }

  async associateStaff(
    serviceId: string,
    dto: AssociateStaffDto,
    actor: AccessPrincipal,
  ): Promise<void> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    const staffUsers = await this.userRepository.find({
      where: {
        id: In(dto.staff_ids),
        role: UserRole.STAFF,
        is_active: true,
      },
    });

    if (staffUsers.length !== dto.staff_ids.length) {
      throw new BadRequestException('One or more staff users not found or not active');
    }

    await this.staffServiceRepository.delete({ service_id: serviceId });

    const staffServices = dto.staff_ids.map(staffId =>
      this.staffServiceRepository.create({
        staff_id: staffId,
        service_id: serviceId,
      }),
    );

    await this.staffServiceRepository.save(staffServices);

    await this.auditService.record({
      action: AuditAction.SERVICE_UPDATED,
      actor_type: ActorType.USER,
      actor_id: actor.id,
      actor_email: actor.email,
      actor_role: actor.role,
      entity_type: 'service',
      entity_id: serviceId,
      previous_value: null,
      new_value: { staff_ids: dto.staff_ids },
      metadata: 'Staff association updated',
    });
  }

  async getStaffForService(serviceId: string): Promise<User[]> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    const staffServices = await this.staffServiceRepository.find({
      where: { service_id: serviceId },
      relations: ['staff'],
    });

    return staffServices
      .map(ss => ss.staff)
      .filter(staff => staff.is_active);
  }

  async getServicesForStaff(staffId: string): Promise<ServiceResponseDto[]> {
    const staff = await this.userRepository.findOne({
      where: { id: staffId, role: UserRole.STAFF },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const staffServices = await this.staffServiceRepository.find({
      where: { staff_id: staffId },
      relations: ['service'],
    });

    return staffServices.map(ss => this.toResponse(ss.service));
  }

  async canStaffProvideService(staffId: string, serviceId: string): Promise<boolean> {
    const staffService = await this.staffServiceRepository.findOne({
      where: { staff_id: staffId, service_id: serviceId },
      relations: ['staff', 'service'],
    });

    if (!staffService) {
      return false;
    }

    return staffService.staff.is_active && staffService.service.is_active;
  }

  private toResponse(service: Service): ServiceResponseDto {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      duration_minutes: service.duration_minutes,
      price_cents: service.price_cents,
      is_active: service.is_active,
      allow_cancel: service.allow_cancel,
      allow_reschedule: service.allow_reschedule,
      cancel_min_hours: service.cancel_min_hours,
      reschedule_min_hours: service.reschedule_min_hours,
      max_reschedules: service.max_reschedules,
      created_at: service.created_at,
      updated_at: service.updated_at,
    };
  }
}
