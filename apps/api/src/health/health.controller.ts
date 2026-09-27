import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get()
  @ApiOperation({
    summary: 'Health check - process liveness',
    description: 'Returns OK if the process is alive',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-09-27T01:50:00Z' },
      },
    },
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness check - database connectivity',
    description:
      'Returns OK if the process is alive AND can connect to the database',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ready' },
        database: { type: 'string', example: 'connected' },
        timestamp: { type: 'string', example: '2026-09-27T01:50:00Z' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service not ready - database connection failed',
  })
  async ready() {
    try {
      // Test database connection
      await this.connection.query('SELECT 1');

      return {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'not ready',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
