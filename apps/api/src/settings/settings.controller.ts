import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AccessPrincipal } from '../access/access-token';
import { AccessTokenGuard } from '../access/access-token.guard';
import { CurrentUser } from '../access/current-user.decorator';
import { SettingsResponseDto } from './dto/settings-response.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(AccessTokenGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get(@CurrentUser() user: AccessPrincipal): Promise<SettingsResponseDto> {
    this.assertAdmin(user);
    return this.settingsService.get();
  }

  @Patch()
  update(
    @CurrentUser() user: AccessPrincipal,
    @Body() dto: UpdateSettingsDto,
  ): Promise<SettingsResponseDto> {
    this.assertAdmin(user);
    return this.settingsService.update(user, dto);
  }

  private assertAdmin(user: AccessPrincipal): void {
    if (user.role !== 'admin') {
      throw new ForbiddenException();
    }
  }
}
