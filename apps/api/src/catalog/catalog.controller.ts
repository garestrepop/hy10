import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AssociateStaffDto } from './dto/associate-staff.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('catalog')
@Controller('catalog')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('services')
  @ApiOperation({ summary: 'Create a new service (Admin only)' })
  @ApiResponse({ status: 201, type: ServiceResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createService(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser() user: User,
  ): Promise<ServiceResponseDto> {
    const service = await this.catalogService.createService(createServiceDto, user);
    return ServiceResponseDto.fromEntity(service);
  }

  @Get('services')
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, type: [ServiceResponseDto] })
  async findAllServices(): Promise<ServiceResponseDto[]> {
    const services = await this.catalogService.findAll();
    return services.map(ServiceResponseDto.fromEntity);
  }

  @Get('services/active')
  @ApiOperation({ summary: 'Get all active services' })
  @ApiResponse({ status: 200, type: [ServiceResponseDto] })
  async findActiveServices(): Promise<ServiceResponseDto[]> {
    const services = await this.catalogService.findActive();
    return services.map(ServiceResponseDto.fromEntity);
  }

  @Get('services/:id')
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiResponse({ status: 200, type: ServiceResponseDto })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOneService(@Param('id') id: string): Promise<ServiceResponseDto> {
    const service = await this.catalogService.findOne(id);
    return ServiceResponseDto.fromEntity(service);
  }

  @Patch('services/:id')
  @ApiOperation({ summary: 'Update a service (Admin only)' })
  @ApiResponse({ status: 200, type: ServiceResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async updateService(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @CurrentUser() user: User,
  ): Promise<ServiceResponseDto> {
    const service = await this.catalogService.updateService(id, updateServiceDto, user);
    return ServiceResponseDto.fromEntity(service);
  }

  @Post('services/:id/staff')
  @ApiOperation({ summary: 'Associate staff with a service (Admin only)' })
  @ApiResponse({ status: 200, description: 'Staff successfully associated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async associateStaff(
    @Param('id') id: string,
    @Body() associateStaffDto: AssociateStaffDto,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.catalogService.associateStaff(id, associateStaffDto, user);
    return { message: 'Staff successfully associated with service' };
  }

  @Get('services/:id/staff')
  @ApiOperation({ summary: 'Get staff members associated with a service' })
  @ApiResponse({ status: 200, description: 'List of staff members' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async getStaffForService(@Param('id') id: string) {
    const staff = await this.catalogService.getStaffForService(id);
    return staff.map(s => ({
      id: s.id,
      email: s.email,
      first_name: s.first_name,
      last_name: s.last_name,
      is_active: s.is_active,
    }));
  }

  @Get('staff/:staffId/services')
  @ApiOperation({ summary: 'Get services associated with a staff member' })
  @ApiResponse({ status: 200, type: [ServiceResponseDto] })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async getServicesForStaff(@Param('staffId') staffId: string): Promise<ServiceResponseDto[]> {
    const services = await this.catalogService.getServicesForStaff(staffId);
    return services.map(ServiceResponseDto.fromEntity);
  }
}
