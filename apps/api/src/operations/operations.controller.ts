import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminOnlyGuard } from './guards/admin-only.guard';
import { OccupationResponseDto } from './dto/occupation-response.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { StaffServicesResponseDto } from './dto/staff-services-response.dto';

/**
 * OperationsController
 * 
 * REST API for administrator-only operational queries.
 * 
 * US-22: Consultar la operación por Telegram
 * 
 * Provides read-only endpoints for administrators to query:
 * - Business occupation (reservations status)
 * - Service availability (time slots)
 * - Staff assignments per service
 * 
 * These endpoints are protected by:
 * 1. JwtAuthGuard - Requires valid authentication
 * 2. AdminOnlyGuard - Restricts access to Admin role only
 * 
 * Per US-22 Gherkin scenarios:
 * - Staff and Clients should NOT receive administrator-level results
 * - These are read-only queries (no mutations)
 */
@ApiTags('Operations')
@Controller('operations')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@ApiBearerAuth()
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  /**
   * Get business occupation
   * 
   * Returns current occupation data across all staff members:
   * - Active reservations count per staff
   * - Upcoming reservations
   * - Total occupation statistics
   * 
   * US-22 Scenario: Consultas de solo lectura
   * Admin with linked Telegram queries occupation.
   * 
   * @returns OccupationResponseDto - Business-wide occupation data
   */
  @Get('occupation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get business occupation (Admin only)',
    description: 'Query current reservation status and occupation across all staff. Read-only operation per US-22.'
  })
  @ApiResponse({
    status: 200,
    description: 'Occupation data retrieved successfully',
    type: OccupationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an Administrator',
  })
  async getOccupation(): Promise<OccupationResponseDto> {
    return this.operationsService.getOccupation();
  }

  /**
   * Get service availability
   * 
   * Returns available time slots for a service on a specific date.
   * Can optionally filter by staff member.
   * 
   * US-22 Scenario: Consultas de solo lectura
   * Admin with linked Telegram queries availability.
   * 
   * @param query - Service ID, date, and optional staff ID
   * @returns AvailabilityResponseDto - Available time slots
   */
  @Get('availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get service availability (Admin only)',
    description: 'Query available time slots for a service on a specific date. Read-only operation per US-22.'
  })
  @ApiResponse({
    status: 200,
    description: 'Availability data retrieved successfully',
    type: AvailabilityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid query parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an Administrator',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found or inactive',
  })
  async getAvailability(
    @Query() query: AvailabilityQueryDto,
  ): Promise<AvailabilityResponseDto> {
    return this.operationsService.getAvailability(query);
  }

  /**
   * Get staff per service
   * 
   * Returns all services with their assigned staff members.
   * Shows which staff can provide each service.
   * 
   * US-22 Scenario: Consultas de solo lectura
   * Admin with linked Telegram queries which staff provides each service.
   * 
   * @returns StaffServicesResponseDto - Services with staff assignments
   */
  @Get('staff-per-service')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get staff assignments per service (Admin only)',
    description: 'Query which staff members provide each service. Read-only operation per US-22.'
  })
  @ApiResponse({
    status: 200,
    description: 'Staff assignments retrieved successfully',
    type: StaffServicesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an Administrator',
  })
  async getStaffPerService(): Promise<StaffServicesResponseDto> {
    return this.operationsService.getStaffPerService();
  }
}
