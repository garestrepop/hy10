import {
  Controller,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AgentToolsService } from './agent-tools.service';

@ApiTags('agent-tools')
@Controller('api/v1/agent/tools')
export class AgentToolsController {
  constructor(private readonly agentToolsService: AgentToolsService) {}

  @Get('staff/:staffId/agenda')
  @ApiOperation({ summary: 'Get staff agenda (agent tool)' })
  @ApiResponse({ status: 200, description: 'Staff agenda retrieved' })
  async getStaffAgenda(
    @Param('staffId') staffId: string,
    @Query('fromDate') fromDate?: string,
  ) {
    return this.agentToolsService.readStaffAgenda({
      staffId,
      fromDate: fromDate ? new Date(fromDate) : new Date(),
    });
  }
}
