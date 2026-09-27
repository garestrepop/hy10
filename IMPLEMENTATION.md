# US-07 Implementation: Configure the Business

## Summary

This implementation provides the business configuration feature as specified in user story US-07 from the hy10 project.

## User Story

**US-07 Configurar el negocio**

**Prioridad**: Must  
**Persona**: Administrador  
**Requisitos**: FR-09, FR-10, FR-11, NFR-16

Como Administrador quiero guardar zona horaria, modelo, políticas y tiempos de conversación para que el equipo y el bot usen las mismas reglas.

## Implementation Details

### Architecture

The implementation follows the monolithic modular architecture specified in the application design documents:

- **Settings Component**: Manages business configuration parameters
- **Audit Component**: Tracks all configuration changes
- **Authorization**: Role-based access control (Admin/Staff)

### Database Schema

The `Settings` table stores all business configuration:

```prisma
model Settings {
  id                                String    @id @default(uuid())
  timezone                          String    @default("America/Bogota")
  model_identifier                  String?
  conversation_session_ttl_minutes  Int       @default(60)
  handoff_ambiguity_attempts        Int       @default(3)
  staff_upcoming_notice_minutes     Int       @default(30)
  voice_note_max_seconds            Int       @default(60)
  allow_cancel                      Boolean   @default(false)
  allow_reschedule                  Boolean   @default(false)
  cancel_min_hours                  Int?
  reschedule_min_hours              Int?
  max_reschedules                   Int?
  created_at                        DateTime  @default(now())
  updated_at                        DateTime  @updatedAt
}
```

The `AuditEvent` table tracks all changes:

```prisma
model AuditEvent {
  id              String    @id @default(uuid())
  entity_type     String
  entity_id       String?
  action          String
  actor_id        String?
  actor_type      String
  previous_value  Json?
  new_value       Json?
  created_at      DateTime  @default(now())
}
```

### API Endpoints

#### GET /api/v1/settings
- **Authorization**: Admin or Staff
- **Returns**: Current business settings
- **Staff access**: Read-only

#### PATCH /api/v1/settings
- **Authorization**: Admin only
- **Body**: Partial settings update
- **Returns**: Updated settings
- **Side effects**: Creates audit event

### Scenario Coverage

#### Escenario 1: Valores iniciales
✅ Implemented in `SettingsService.ensureDefaultSettings()`
- Creates default settings on first access
- Timezone: America/Bogota
- TTL: 60 minutes
- Handoff threshold: 3 attempts
- Staff notice: 30 minutes
- Policies disabled by default (user must explicitly enable)

#### Escenario 2: Guardar políticas y modelo
✅ Implemented in `SettingsService.update()` and `SettingsController.updateSettings()`
- Validates Admin role
- Updates settings atomically
- Creates audit event with previous and new values
- Excludes API keys from response
- Audit log contains actor and value changes

#### Escenario 3: Staff intenta configurar
✅ Implemented in `RolesGuard` and service-level validation
- `@Roles(Role.ADMIN)` decorator on PATCH endpoint
- Service validates role before update
- Returns 403 Forbidden for Staff users
- Error message: "Only administrators can update settings"

### Frontend

A Next.js-based settings page provides:
- Form for all configuration parameters
- Real-time validation
- Success/error feedback
- Authorization error handling (403 → friendly message)
- Audit notification on successful save

### Testing

Comprehensive unit tests cover all three scenarios:

```typescript
// Test files:
// - apps/api/src/settings/settings.service.spec.ts
// - apps/api/src/settings/settings.controller.spec.ts

describe('US-07 Escenario: Valores iniciales')
describe('US-07 Escenario: Guardar políticas y modelo')
describe('US-07 Escenario: Staff intenta configurar')
```

### Security Considerations

1. **Authentication**: JWT-based authentication required
2. **Authorization**: Role-based access control
3. **Audit**: All changes logged with actor information
4. **Secret Protection**: 
   - API keys stored separately (SecretStore, not in Settings)
   - Sensitive data redacted from audit logs
   - Model identifier exposed, but not the API key

### Files Changed

**Backend (API)**:
- `apps/api/src/settings/` - Settings module
- `apps/api/src/audit/` - Audit module
- `apps/api/src/common/guards/` - Authorization guards
- `apps/api/src/common/decorators/` - Role decorators
- `packages/database/prisma/schema.prisma` - Database schema

**Frontend (Web)**:
- `apps/web/src/app/settings/page.tsx` - Settings UI
- `apps/web/src/lib/api.ts` - API client

**Infrastructure**:
- `package.json` - Monorepo setup
- `turbo.json` - Build configuration
- `pnpm-workspace.yaml` - Workspace definition

## Setup Instructions

### Prerequisites
- Node.js >= 20
- pnpm >= 9
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Configure environment
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local

# Edit .env.local files with your configuration
# Required: DATABASE_URL, JWT_SECRET

# Generate Prisma client
cd packages/database
pnpm db:generate

# Run migrations
pnpm db:migrate
```

### Running

```bash
# Terminal 1: API
cd apps/api
pnpm dev

# Terminal 2: Web
cd apps/web
pnpm dev
```

- API: http://localhost:3001
- Web: http://localhost:3000

### Testing

```bash
cd apps/api
pnpm test
```

## Compliance with Requirements

### FR-09: Configuration Management
✅ Admin can edit timezone, model identifier, policies, TTL, handoff threshold, and staff notice time

### FR-10: Default Values
✅ All defaults implemented as specified
✅ Policies disabled by default (explicit save required)

### FR-11: Secret Protection
✅ Model identifier stored in settings (visible)
✅ API keys stored separately in SecretStore (not in Settings table)
✅ UI does not display API keys

### NFR-16: Audit Trail
✅ All configuration changes logged
✅ Actor information captured
✅ Previous and new values recorded
✅ Sensitive data redacted

## Future Enhancements

1. **Bot Token Management**: Implement SecretStore for encrypted bot token storage
2. **Business Hours**: Add schedule configuration UI
3. **Audit Query Interface**: Admin UI for viewing audit logs
4. **Configuration History**: Timeline view of changes
5. **Import/Export**: Backup and restore configuration

## Related Documentation

- User Story: `aidlc-docs/inception/user-stories/stories.md` (US-07)
- Requirements: `aidlc-docs/inception/requirements/requirements.md` (FR-09, FR-10, FR-11, NFR-16)
- Application Design: `aidlc-docs/inception/application-design/`
- Component Methods: `aidlc-docs/inception/application-design/component-methods.md` (Settings section)
