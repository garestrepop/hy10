import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Role } from '@hy10/database';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsResponseDto } from './dto/settings-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('api/v1/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  async getSettings(): Promise<SettingsResponseDto> {
    return this.settingsService.get();
  }

  @Patch()
  @Roles(Role.ADMIN)
  async updateSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    updateDto: UpdateSettingsDto,
  ): Promise<SettingsResponseDto> {
    return this.settingsService.update(user.id, user.role, updateDto);
  }
}
