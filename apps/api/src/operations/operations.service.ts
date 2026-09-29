import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../auth/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { StaffService as StaffServiceEntity } from '../services/entities/staff-service.entity';
import {
  OccupationResponseDto,
  StaffOccupationDto,
  ReservationSummaryDto,
} from './dto/occupation-response.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import {
  AvailabilityResponseDto,
  TimeSlotDto,
} from './dto/availability-response.dto';
import {
  StaffServicesResponseDto,
  ServiceWithStaffDto,
  ServiceBasicDto,
  StaffMemberDto,
} from './dto/staff-services-response.dto';

/**
 * OperationsService
 * 
 * Provides read-only queries for administrators to check:
 * - Occupation (business-wide reservation status)
 * - Availability (time slots for services)
 * - Staff assignments per service
 * 
 * As per US-22, these queries must only be accessible to administrators
 * and should not allow any mutations (create, cancel, reschedule).
 */
@Injectable()
export class OperationsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(StaffServiceEntity)
    private readonly staffServiceRepository: Repository<StaffServiceEntity>,
  ) {}

  /**
   * Get occupation across the entire business
   * 
   * Returns occupation data for all staff members including:
   * - Number of active reservations per staff
   * - Upcoming reservations with details
   * 
   * @returns OccupationResponseDto with business-wide occupation data
   * 
   * @todo Implement when Reservations module exists
   * Currently returns empty placeholder data with proper structure
   */
  async getOccupation(): Promise<OccupationResponseDto> {
    // Get all active staff members
    const staffMembers = await this.userRepository.find({
      where: { role: UserRole.STAFF, is_active: true },
      select: ['id', 'first_name', 'last_name', 'email'],
    });

    // TODO: Query reservations when Reservations module is implemented
    // For now, return empty occupation data with proper structure
    const staffOccupation: StaffOccupationDto[] = staffMembers.map(staff => ({
      staff_id: staff.id,
      staff_name: this.getFullName(staff),
      staff_email: staff.email,
      active_reservations_count: 0,
      upcoming_reservations: [],
    }));

    return {
      timestamp: new Date().toISOString(),
      total_active_reservations: 0,
      total_staff: staffMembers.length,
      staff_occupation: staffOccupation,
    };
  }

  /**
   * Get availability for a service on a specific date
   * 
   * Returns available time slots for booking a service.
   * Optionally filtered by staff member.
   * 
   * @param query - Service ID, date, and optional staff ID
   * @returns AvailabilityResponseDto with available time slots
   * 
   * @todo Implement when Agenda module exists
   * Currently returns empty placeholder data with proper structure
   */
  async getAvailability(query: AvailabilityQueryDto): Promise<AvailabilityResponseDto> {
    // Validate service exists
    const service = await this.serviceRepository.findOne({
      where: { id: query.service_id, is_active: true },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${query.service_id} not found or inactive`);
    }

    // If staff_id provided, validate it exists and is associated with this service
    if (query.staff_id) {
      const staffService = await this.staffServiceRepository.findOne({
        where: {
          service_id: query.service_id,
          staff_id: query.staff_id,
        },
        relations: ['staff'],
      });

      if (!staffService || !staffService.staff.is_active) {
        throw new NotFoundException(
          `Staff member ${query.staff_id} not found, inactive, or not associated with this service`
        );
      }
    }

    // TODO: Calculate actual availability when Agenda module is implemented
    // For now, return empty slots with proper structure
    return {
      service_id: service.id,
      service_name: service.name,
      date: query.date,
      staff_id: query.staff_id,
      slots: [],
      total_slots: 0,
    };
  }

  /**
   * Get all services with their assigned staff members
   * 
   * Returns the complete catalog of services and which staff
   * members can provide each service. This is read-only data
   * from the existing Catalog module.
   * 
   * @returns StaffServicesResponseDto with services and staff assignments
   */
  async getStaffPerService(): Promise<StaffServicesResponseDto> {
    // Get all active services
    const services = await this.serviceRepository.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });

    // For each service, get assigned staff
    const servicesWithStaff: ServiceWithStaffDto[] = await Promise.all(
      services.map(async (service) => {
        const staffServices = await this.staffServiceRepository.find({
          where: { service_id: service.id },
          relations: ['staff'],
        });

        const staffMembers: StaffMemberDto[] = staffServices
          .filter(ss => ss.staff && ss.staff.is_active)
          .map(ss => ({
            id: ss.staff.id,
            name: this.getFullName(ss.staff),
            email: ss.staff.email,
            is_active: ss.staff.is_active,
          }));

        const serviceBasic: ServiceBasicDto = {
          id: service.id,
          name: service.name,
          description: service.description,
          duration_minutes: service.duration_minutes,
          price_cents: service.price_cents,
          is_active: service.is_active,
        };

        return {
          service: serviceBasic,
          staff: staffMembers,
        };
      })
    );

    return {
      timestamp: new Date().toISOString(),
      total_services: services.length,
      services: servicesWithStaff,
    };
  }

  /**
   * Helper method to get full name from User entity
   * 
   * @param user - User entity with first_name and last_name
   * @returns Full name or email if names not set
   */
  private getFullName(user: User): string {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`.trim();
    }
    if (user.first_name) {
      return user.first_name;
    }
    if (user.last_name) {
      return user.last_name;
    }
    return user.email;
  }
}
