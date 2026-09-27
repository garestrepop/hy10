import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { AuditLogPageResponseDto } from './dto/audit-log-response.dto';

/**
 * Audit Log Controller
 * US-31: Consultar la auditoría
 * 
 * As an Administrator, I want to see who changed a booking, invoice,
 * or configuration to reconstruct what happened.
 * 
 * Scenarios:
 * - Query: Admin filters by action and dates, sees actor, timestamp,
 *   previous value, and new value. Log does not show passwords,
 *   tokens, or card data.
 * - Staff: When a Staff user opens audit, server rejects.
 */
@ApiTags('Audit')
@Controller('audit')
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Query audit logs
   * GET /api/v1/audit
   * 
   * Per US-31:
   * - Only Admin can access
   * - Filter by action and dates
   * - Shows actor, timestamp, previous value, new value
   * - No passwords, tokens, or card data
   */
  @Get()
  @ApiOperation({
    summary: 'Query audit logs (Admin only)',
    description: `Query the audit log with filters for action type, dates, and entities.
    
    Only administrators can access this endpoint. Staff users will be rejected.
    
    The log shows:
    - Actor (who made the change)
    - Timestamp (when it happened)
    - Previous value
    - New value
    
    Sensitive data (passwords, tokens, card data) is never included in the log.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    type: AuditLogPageResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only administrators can access audit logs',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT required',
  })
  async query(
    @Request() req: any,
    @Query() queryDto: QueryAuditDto,
  ): Promise<AuditLogPageResponseDto> {
    // Extract user role from JWT (would be set by auth guard in real implementation)
    // For now, we simulate it from the request
    const userRole = req.user?.role || 'staff';

    // US-31 Scenario: Staff - server rejects
    if (userRole !== 'admin' && userRole !== 'administrator') {
      throw new ForbiddenException(
        'Only administrators can access audit logs',
      );
    }

    return this.auditService.query(userRole, queryDto);
  }
}
