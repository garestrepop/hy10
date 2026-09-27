# hy10 API

Backend API for hy10 - CRM operativo single-tenant con agenda y agente de AI en Telegram.

## US-31: Consultar la auditoría (Audit Consultation)

This implementation provides the audit log functionality as specified in US-31.

### Features

- **Append-only audit log** for critical operations:
  - Reservations (create, cancel, reschedule, complete, no-show)
  - Invoices (issued, paid, voided)
  - Configuration changes (settings, services, staff, schedules)
  - Access events (login, logout, password reset, MFA)
  - Invitations (staff invited, invitation accepted)

- **Admin-only access**: Only administrators can query the audit log
- **Staff rejection**: Staff users are automatically rejected (per US-31 requirements)
- **Sensitive data protection**: Passwords, tokens, and card data are automatically redacted
- **Flexible filtering**: Filter by action type, date range, actor, and entity
- **Pagination**: Results are paginated for performance

### API Endpoints

#### Query Audit Logs

```http
GET /api/v1/audit
```

**Authentication**: Required (Bearer token with admin role)

**Query Parameters**:
- `action` (optional): Filter by action type (e.g., `reservation_created`, `invoice_paid`)
- `actor_id` (optional): Filter by actor ID
- `entity_type` (optional): Filter by entity type (e.g., `reservation`, `invoice`)
- `entity_id` (optional): Filter by specific entity ID
- `from_date` (optional): Start date (ISO 8601 format)
- `to_date` (optional): End date (ISO 8601 format)
- `page` (optional, default: 1): Page number
- `page_size` (optional, default: 50, max: 100): Items per page

**Example Request**:
```bash
curl -X GET "http://localhost:3001/api/v1/audit?action=reservation_created&from_date=2026-01-01T00:00:00Z&to_date=2026-12-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response**:
```json
{
  "items": [
    {
      "id": "uuid",
      "action": "reservation_created",
      "actor_type": "user",
      "actor_id": "user-123",
      "actor_email": "admin@example.com",
      "actor_role": "admin",
      "entity_type": "reservation",
      "entity_id": "res-456",
      "previous_value": null,
      "new_value": {
        "service": "Haircut",
        "staff": "staff-789",
        "start_time": "2026-09-27T10:00:00Z"
      },
      "metadata": null,
      "created_at": "2026-09-27T01:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50,
  "total_pages": 1
}
```

### Database Schema

The audit log uses the following table structure:

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  action VARCHAR NOT NULL,
  actor_type VARCHAR NOT NULL,
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
  created_at TIMESTAMPTZ NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_action_created ON audit_log(action, created_at);
CREATE INDEX idx_audit_actor ON audit_log(actor_type, actor_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
```

### Usage Example

To record an audit event from other modules:

```typescript
import { AuditService } from './audit/audit.service';
import { AuditAction, ActorType } from './audit/entities/audit-log.entity';

// Inject the service
constructor(private readonly auditService: AuditService) {}

// Record an event
await this.auditService.record({
  action: AuditAction.RESERVATION_CREATED,
  actor_type: ActorType.USER,
  actor_id: userId,
  actor_email: userEmail,
  actor_role: 'admin',
  entity_type: 'reservation',
  entity_id: reservation.id,
  previous_value: null,
  new_value: {
    service: reservation.service,
    staff: reservation.staff,
    start_time: reservation.start_time,
  },
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
});
```

### Requirements Met

✅ **FR-56**: Append-only log without passwords, tokens, or card data
✅ **NFR-07**: Audit logs retained (database-level retention to be configured)
✅ **NFR-16**: Critical changes recorded with actor, timestamp, previous and new values
✅ **US-31 Scenario 1**: Admin can filter by action and dates, sees actor, timestamp, values
✅ **US-31 Scenario 2**: Staff user is rejected by server

### Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Build for production
pnpm build

# Start production server
pnpm start:prod
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables for audit functionality:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Database connection
- `NODE_ENV`: Environment (development, production)
- `PORT`: API port (default: 3001)

### Testing

The audit module includes comprehensive tests:

```bash
# Run audit module tests
pnpm test audit

# Run with coverage
pnpm test:cov
```

Tests cover:
- Recording audit events with data sanitization
- Sensitive field redaction
- Admin authorization
- Staff rejection
- Query filtering by action, date, and entity
- Error handling per FR-56 (non-blocking writes)

## Architecture

This API follows the monolithic modular architecture specified in the hy10 design documents:

- **Modular structure**: Each capability (audit, reservations, billing, etc.) is a module
- **No multitenancy**: Single business focus, no `tenant_id`
- **API prefix**: All routes under `/api/v1`
- **TypeORM**: Database ORM with PostgreSQL
- **Snake_case**: Database column naming convention

## Next Steps

To complete the full hy10 system, implement:

1. **Access Module**: Authentication, JWT, MFA, invitations
2. **Catalog Module**: Services, staff, associations
3. **Agenda Module**: Business hours, staff schedules, availability calculation
4. **Reservations Module**: Create, cancel, reschedule, mark completed/no-show
5. **Clients Module**: Telegram identity, opt-out
6. **TelegramGateway Module**: Webhook, message handling
7. **Agent Module**: LLM integration, tools, handoff
8. **Billing Module**: Invoices, Wompi integration
9. **Settings Module**: Configuration management
10. **Notifications Module**: Event-driven notifications

Each module should use the `AuditService` to record critical changes.
