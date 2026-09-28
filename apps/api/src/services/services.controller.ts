import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccessPrincipal } from '../access/access-token';
import { CurrentUser } from '../access/current-user.decorator';
import { JwtAuthGuard } from '../access/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { ResolvedPolicyDto, ServiceResponseDto } from './dto/service-response.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AssociateStaffDto } from './dto/associate-staff.dto';
import { ServicesService } from './services.service';

@Controller('api/v1/services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async create(
    @CurrentUser() actor: AccessPrincipal,
    @Body() dto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.create(actor, dto);
  }

  @Get()
  async findAll(
    @Query('include_inactive') includeInactive?: string,
  ): Promise<ServiceResponseDto[]> {
    return this.servicesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ServiceResponseDto> {
    return this.servicesService.findOne(id);
  }

  @Get(':id/policy')
  async resolvePolicy(@Param('id') id: string): Promise<ResolvedPolicyDto> {
    return this.servicesService.resolvePolicy(id);
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async update(
    @Param('id') id: string,
    @CurrentUser() actor: AccessPrincipal,
    @Body() dto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.update(id, actor, dto);
  }

  @Patch(':id/deactivate')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() actor: AccessPrincipal,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.deactivate(id, actor);
  }

  @Post(':id/staff')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async associateStaff(
    @Param('id') id: string,
    @Body() dto: AssociateStaffDto,
    @CurrentUser() actor: AccessPrincipal,
  ): Promise<{ message: string }> {
    await this.servicesService.associateStaff(id, dto, actor);
    return { message: 'Staff successfully associated with service' };
  }

  @Get(':id/staff')
  async getStaffForService(@Param('id') id: string) {
    const staff = await this.servicesService.getStaffForService(id);
    return staff.map(s => ({
      id: s.id,
      email: s.email,
      first_name: s.first_name,
      last_name: s.last_name,
      is_active: s.is_active,
    }));
  }

  @Get('staff/:staffId')
  async getServicesForStaff(@Param('staffId') staffId: string): Promise<ServiceResponseDto[]> {
    return this.servicesService.getServicesForStaff(staffId);
  }
}
