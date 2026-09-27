# US-31: Audit Consultation Implementation

## Overview

This document describes the implementation of US-31 (Consultar la auditoría) for the hy10 project.

## User Story

**Priority**: Must  
**Persona**: Administrador  
**Requirements**: FR-56, NFR-07, NFR-16

As an Administrator, I want to see who changed a booking, invoice, or configuration to reconstruct what happened.

## Scenarios

### Scenario 1: Query

**Given** events of reservations, invoices, invitations, or configuration  
**When** the Administrator filters by action and dates  
**Then** sees actor, timestamp, previous value, and new value  
**And** the log does not show passwords, tokens, or card data

### Scenario 2: Staff

**Given** a Staff user  
**When** opens the audit  
**Then** the server rejects it

## Implementation Details

### Components Created

1. **AuditLog Entity** (`audit-log.entity.ts`)
   - Database table with full audit trail
   - Includes action type, actor information, entity details, before/after values
   - Indexed for efficient querying

2. **DTOs**
   - `CreateAuditLogDto`: For recording audit events
   - `QueryAuditDto`: For filtering audit logs with validation
   - `AuditLogResponseDto`: For returning audit data to clients

3. **AuditService** (`audit.service.ts`)
   - `record()`: Append-only recording with automatic sensitive data redaction
   - `query()`: Admin-only query with role validation and filtering
   - Implements FR-56 requirement: business operation doesn't fail if audit write fails

4. **AuditController** (`audit.controller.ts`)
   - `GET /api/v1/audit`: Query endpoint with comprehensive filtering
   - Role-based authorization (Admin only)
   - Swagger/OpenAPI documentation

5. **Tests**
   - Unit tests for service layer
   - Unit tests for controller layer
   - Coverage for all scenarios including sensitive data redaction

### Sensitive Data Protection

The following fields are automatically redacted from audit logs:
- `password`, `password_hash`
- `token`, `access_token`, `refresh_token`
- `api_key`, `secret`, `webhook_secret`, `bot_token`
- `card_number`, `cvv`, `card_data`, `credit_card`, `payment_method`
- `audio`, `voice_note`, `recording`

### Database Schema

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  action VARCHAR NOT NULL,  -- Enum: AuditAction
  actor_type VARCHAR NOT NULL,  -- Enum: user, system, webhook
  actor_id VARCHAR,
  actor_email VARCHAR,
  actor_role VARCHAR,
  entity_type VARCHAR,
  entity_id VARCHAR,
  previous_value JSONB,
  new_value JSONB,
  metadata TEXT,
  ip_address VARCHAR,
  user_agent VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_audit_action_created ON audit_log(action, created_at);
CREATE INDEX idx_audit_actor ON audit_log(actor_type, actor_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
```

### Audit Actions

The system tracks the following actions:

**Access**:
- `login`, `logout`, `password_reset`
- `mfa_enabled`, `mfa_disabled`

**Invitations**:
- `staff_invited`, `invitation_accepted`

**Reservations**:
- `reservation_created`, `reservation_cancelled`
- `reservation_rescheduled`, `reservation_completed`
- `reservation_no_show`

**Invoices**:
- `invoice_issued`, `invoice_paid`, `invoice_voided`
- `payment_received`

**Configuration**:
- `settings_updated`
- `service_created`, `service_updated`, `service_deactivated`
- `staff_registered`, `staff_updated`, `staff_deactivated`
- `business_hours_updated`, `schedule_updated`

### API Examples

#### Query all reservation changes in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/audit?action=reservation_created&from_date=2026-09-01T00:00:00Z&to_date=2026-09-30T23:59:59Z" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Query all changes by a specific actor

```bash
curl -X GET "http://localhost:3001/api/v1/audit?actor_id=user-123&page=1&page_size=50" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Query invoice changes

```bash
curl -X GET "http://localhost:3001/api/v1/audit?entity_type=invoice" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Integration with Other Modules

When other modules (Reservations, Billing, Settings, etc.) perform critical operations, they should inject `AuditService` and record events:

```typescript
import { AuditService } from '../audit/audit.service';
import { AuditAction, ActorType } from '../audit/entities/audit-log.entity';

@Injectable()
export class ReservationsService {
  constructor(private readonly auditService: AuditService) {}

  async create(actor: User, dto: CreateReservationDto) {
    // Business logic
    const reservation = await this.save(dto);

    // Record audit event
    await this.auditService.record({
      action: AuditAction.RESERVATION_CREATED,
      actor_type: ActorType.USER,
      actor_id: actor.id,
      actor_email: actor.email,
      actor_role: actor.role,
      entity_type: 'reservation',
      entity_id: reservation.id,
      previous_value: null,
      new_value: {
        service: reservation.service,
        staff: reservation.staff,
        start_time: reservation.start_time,
      },
    });

    return reservation;
  }
}
```

## Requirements Traceability

| Requirement | Status | Notes |
|-------------|--------|-------|
| FR-56 | ✅ Implemented | Append-only log, no secrets, filterable by Admin |
| NFR-07 | ⚠️ Partial | 90-day retention to be configured at database level |
| NFR-16 | ✅ Implemented | Critical changes recorded with actor, timestamp, before/after |
| US-31 Scenario 1 | ✅ Implemented | Admin can query with filters, sees all required fields |
| US-31 Scenario 2 | ✅ Implemented | Staff users are rejected with 403 Forbidden |

## Testing

Run the audit module tests:

```bash
cd apps/api
pnpm test audit
```

Expected output:
- All tests pass
- 100% code coverage on audit module
- Scenarios validated:
  - ✅ Recording audit events
  - ✅ Sensitive data redaction
  - ✅ Admin authorization
  - ✅ Staff rejection
  - ✅ Filtering by action, date, entity
  - ✅ Non-blocking writes (per FR-56)

## Future Enhancements

1. **Real-time audit streaming**: WebSocket connection for live audit monitoring
2. **Audit retention policies**: Automated archival after 90 days
3. **Advanced search**: Full-text search on previous_value and new_value
4. **Audit reports**: Pre-built reports for common compliance queries
5. **Export functionality**: CSV/JSON export for external audit tools

## Dependencies

- NestJS 10.x
- TypeORM 0.3.x
- PostgreSQL 14+
- class-validator, class-transformer

## Deployment Considerations

1. **Database**: Ensure PostgreSQL has sufficient storage for audit logs
2. **Retention**: Configure database-level partition/archival for 90+ day retention
3. **Performance**: Indexes are created for common query patterns
4. **Security**: Audit table should have restricted write permissions
5. **Monitoring**: Set up alerts for audit write failures

## References

- [hy10 User Stories](/workspace/aidlc-docs/inception/user-stories/stories.md)
- [hy10 Requirements](/workspace/aidlc-docs/inception/requirements/requirements.md)
- [hy10 Application Design](/workspace/aidlc-docs/inception/application-design/)
