import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Service } from './entities/service.entity';
import { StaffService } from './entities/staff-service.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AssociateStaffDto } from './dto/associate-staff.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, ActorType } from '../audit/entities/audit-log.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(StaffService)
    private staffServiceRepository: Repository<StaffService>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  async createService(
    createServiceDto: CreateServiceDto,
    actor: User,
  ): Promise<Service> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can create services');
    }

    const service = this.serviceRepository.create(createServiceDto);
    const savedService = await this.serviceRepository.save(service);

    await this.auditService.record({
      action: AuditAction.SERVICE_CREATED,
      actor_type: ActorType.USER,
      actor_id: actor.id,
      actor_email: actor.email,
      actor_role: actor.role,
      entity_type: 'service',
      entity_id: savedService.id,
      new_value: savedService,
    });

    return savedService;
  }

  async findAll(): Promise<Service[]> {
    return this.serviceRepository.find({
      relations: ['staff_services', 'staff_services.staff'],
      order: { created_at: 'DESC' },
    });
  }

  async findActive(): Promise<Service[]> {
    return this.serviceRepository.find({
      where: { is_active: true },
      relations: ['staff_services', 'staff_services.staff'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['staff_services', 'staff_services.staff'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async updateService(
    id: string,
    updateServiceDto: UpdateServiceDto,
    actor: User,
  ): Promise<Service> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can update services');
    }

    const service = await this.findOne(id);
    const oldValue = { ...service };

    Object.assign(service, updateServiceDto);
    const updatedService = await this.serviceRepository.save(service);

    await this.auditService.record({
      action: AuditAction.SERVICE_UPDATED,
      actor_type: ActorType.USER,
      actor_id: actor.id,
      actor_email: actor.email,
      actor_role: actor.role,
      entity_type: 'service',
      entity_id: service.id,
      previous_value: oldValue,
      new_value: updatedService,
    });

    return updatedService;
  }

  async associateStaff(
    serviceId: string,
    associateStaffDto: AssociateStaffDto,
    actor: User,
  ): Promise<void> {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can associate staff with services');
    }

    const service = await this.findOne(serviceId);

    const staffUsers = await this.userRepository.find({
      where: {
        id: In(associateStaffDto.staff_ids),
        role: UserRole.STAFF,
        is_active: true,
      },
    });

    if (staffUsers.length !== associateStaffDto.staff_ids.length) {
      throw new BadRequestException('One or more staff users not found or not active');
    }

    await this.staffServiceRepository.delete({ service_id: serviceId });

    const staffServices = associateStaffDto.staff_ids.map(staffId =>
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
      new_value: { staff_ids: associateStaffDto.staff_ids },
      metadata: 'Staff association updated',
    });
  }

  async getStaffForService(serviceId: string): Promise<User[]> {
    const service = await this.findOne(serviceId);

    const staffServices = await this.staffServiceRepository.find({
      where: { service_id: serviceId },
      relations: ['staff'],
    });

    return staffServices
      .map(ss => ss.staff)
      .filter(staff => staff.is_active);
  }

  async getServicesForStaff(staffId: string): Promise<Service[]> {
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

    return staffServices.map(ss => ss.service);
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
}
