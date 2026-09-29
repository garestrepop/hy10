# US-10: Staff Availability Implementation

## Overview

Implementation of Linear issue [HY1-33](https://linear.app/hiturno/issue/HY1-33) - Staff availability management for the hy10 project.

## User Story

**Como Staff quiero armar mi semana y mis excepciones para que los huecos que ve el Cliente sean los míos.**

(As a Staff member, I want to build my weekly schedule and exceptions so that the available slots clients see are mine.)

## Implementation Details

### Architecture

The implementation follows the existing NestJS modular architecture with:

- **Module**: `AgendaModule` - Self-contained module for schedule management
- **Entities**: 
  - `ScheduleBlock` - Weekly recurring availability blocks
  - `ScheduleException` - Date-specific blocks or openings
- **Service**: `AgendaService` - Business logic with authorization
- **Controller**: `AgendaController` - RESTful API endpoints
- **DTOs**: Type-safe request/response validation

### Database Schema

#### schedule_blocks
```sql
- id (uuid, primary key)
- staff_id (uuid, foreign key to accounts)
- day_of_week (integer, 0=Monday, 6=Sunday)
- start_time (time)
- end_time (time)
- created_at (timestamptz)
- updated_at (timestamptz)
- Index on (staff_id, day_of_week)
```

#### schedule_exceptions
```sql
- id (uuid, primary key)
- staff_id (uuid, foreign key to accounts)
- exception_type (enum: 'block' | 'opening')
- exception_date (date)
- start_time (time, nullable)
- end_time (time, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
- Index on (staff_id, exception_date)
```

### API Endpoints

All endpoints require JWT authentication (`JwtAuthGuard`).

#### 1. Replace Staff Schedule
```http
POST /api/v1/staff/:id/schedule
Content-Type: application/json

{
  "blocks": [
    {
      "day_of_week": 0,  // Monday
      "start_time": "09:00",
      "end_time": "17:00"
    }
  ]
}

Response: 200 OK
[
  {
    "id": "uuid",
    "staff_id": "uuid",
    "day_of_week": 0,
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "created_at": "2026-09-28T...",
    "updated_at": "2026-09-28T..."
  }
]
```

#### 2. Get Staff Schedule
```http
GET /api/v1/staff/:id/schedule

Response: 200 OK
[
  {
    "id": "uuid",
    "staff_id": "uuid",
    "day_of_week": 0,
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "created_at": "2026-09-28T...",
    "updated_at": "2026-09-28T..."
  }
]
```

#### 3. Add Schedule Exception
```http
POST /api/v1/staff/:id/exceptions
Content-Type: application/json

{
  "exception_type": "block",
  "exception_date": "2026-10-01",
  "start_time": "09:00",
  "end_time": "12:00"
}

Response: 201 Created
{
  "id": "uuid",
  "staff_id": "uuid",
  "exception_type": "block",
  "exception_date": "2026-10-01",
  "start_time": "09:00:00",
  "end_time": "12:00:00",
  "created_at": "2026-09-28T...",
  "updated_at": "2026-09-28T..."
}
```

#### 4. Get Staff Exceptions
```http
GET /api/v1/staff/:id/exceptions

Response: 200 OK
[
  {
    "id": "uuid",
    "staff_id": "uuid",
    "exception_type": "block",
    "exception_date": "2026-10-01",
    "start_time": "09:00:00",
    "end_time": "12:00:00",
    "created_at": "2026-09-28T...",
    "updated_at": "2026-09-28T..."
  }
]
```

#### 5. Delete Exception
```http
DELETE /api/v1/staff/:staffId/exceptions/:exceptionId

Response: 204 No Content
```

### Authorization Rules

1. **Staff Members**:
   - Can ONLY view/edit their OWN schedule and exceptions
   - Attempting to access another staff member's schedule returns `403 Forbidden`

2. **Administrators**:
   - Can view/edit ANY staff member's schedule
   - Full access to all operations

### Validations

1. **Time Range Validation**:
   - Start time must be before end time
   - Returns `400 Bad Request` if invalid

2. **Exception Time Validation**:
   - If `start_time` is provided, `end_time` must also be provided
   - If `end_time` is provided, `start_time` must also be provided
   - Both can be null for all-day blocks/openings

3. **Time Format**:
   - Accepts `HH:MM` or `HH:MM:SS` format
   - Normalized to `HH:MM:SS` in database

### Testing

**Total Tests**: 21 new tests (all passing)

#### Service Tests (13 tests)
- ✅ Staff can replace their own schedule
- ✅ Admin can replace any staff schedule
- ✅ Staff cannot edit another staff's schedule
- ✅ Time range validation
- ✅ Staff can add their own exception
- ✅ Staff cannot add exception for another staff
- ✅ Exception time validation
- ✅ Staff can view their own schedule
- ✅ Staff cannot view another staff's schedule
- ✅ Admin can view any staff schedule
- ✅ Staff can delete their own exception
- ✅ Staff cannot delete another staff's exception
- ✅ Service is defined

#### Controller Tests (8 tests)
- ✅ Replace staff schedule endpoint
- ✅ Get staff schedule endpoint
- ✅ Forbidden exception for viewing others
- ✅ Add exception endpoint
- ✅ Get exceptions endpoint
- ✅ Delete exception endpoint
- ✅ Not found exception handling
- ✅ Controller is defined

### Files Created

```
apps/api/src/agenda/
├── agenda.controller.spec.ts       # Controller tests
├── agenda.controller.ts            # REST API endpoints
├── agenda.module.ts                # Module definition
├── agenda.service.spec.ts          # Service tests
├── agenda.service.ts               # Business logic
├── dto/
│   ├── schedule-block.dto.ts       # Request/response DTOs for blocks
│   └── schedule-exception.dto.ts   # Request/response DTOs for exceptions
└── entities/
    ├── schedule-block.entity.ts    # Weekly schedule entity
    └── schedule-exception.entity.ts # Exception entity

apps/api/src/migrations/
└── 1727420000000-CreateAgendaTables.ts  # Database migration
```

### Files Modified

```
apps/api/src/app.module.ts          # Added AgendaModule import
```

## Acceptance Criteria

### ✅ Escenario: Bloques y excepciones propios
**Given**: Un Staff autenticado  
**When**: Guarda bloques semanales o una excepción de bloqueo o de apertura sobre su agenda  
**Then**: El cálculo de slots usa esos datos

**Status**: ✅ Implemented
- Staff can save weekly blocks via `POST /api/v1/staff/:id/schedule`
- Staff can save exceptions via `POST /api/v1/staff/:id/exceptions`
- Data is persisted in database with proper relationships
- Ready for slot calculation integration

### ✅ Escenario: Agenda de otro
**Given**: Un Staff  
**When**: Intenta editar la disponibilidad de otro staff  
**Then**: El servidor lo rechaza

**Status**: ✅ Implemented
- Service layer checks authorization
- Returns `403 ForbiddenException` if staff tries to edit another's schedule
- Admin can edit any schedule (proper privilege escalation)

## Integration Points

This implementation provides the foundation for:

1. **Slot Calculation** (Future):
   - The `getAvailability` method mentioned in design docs can query these tables
   - Algorithm will merge: business hours + staff schedule + exceptions + existing reservations

2. **Web UI** (Future):
   - Calendar component to visualize weekly schedule
   - Exception management interface
   - All API endpoints ready for consumption

3. **Telegram Bot** (Future):
   - Staff can query their schedule via bot
   - Notifications about upcoming appointments considering availability

## Next Steps

1. **Business Hours Integration**: Add validation that staff blocks fall within business hours (from `Settings`)
2. **Slot Calculation**: Implement the availability algorithm that uses this data
3. **Web UI**: Build staff schedule management interface
4. **Audit Logging**: Add audit trail for schedule changes
5. **Performance**: Add caching for frequently accessed schedules

## Technical Notes

### Dependencies
- `@nestjs/common`, `@nestjs/typeorm`: Core framework
- `class-validator`, `class-transformer`: DTO validation
- `typeorm`: Database ORM
- `pg`: PostgreSQL driver

### Design Decisions

1. **Replace vs Update**: The schedule replacement endpoint (`POST /schedule`) replaces ALL blocks at once rather than updating individual blocks. This simplifies the API and ensures consistency.

2. **Time Normalization**: Times are normalized to `HH:MM:SS` format to ensure consistency in the database.

3. **Soft Delete**: Entities use timestamps but not soft deletes (no `deleted_at` column) since schedule history is not a requirement.

4. **Day of Week Enum**: Using integers (0-6) for days of week following ISO standard where Monday=0.

5. **Exception Types**: Two types supported:
   - `block`: Staff is unavailable (e.g., vacation, meeting)
   - `opening`: Staff is available outside normal schedule

## Migration Instructions

To apply the database changes:

```bash
cd apps/api
pnpm migration:run
```

To rollback:

```bash
cd apps/api
pnpm migration:revert
```

## Testing Instructions

Run all tests:
```bash
cd apps/api
pnpm test
```

Run only agenda tests:
```bash
cd apps/api
pnpm test agenda
```

## Pull Request

**PR**: [#13](https://github.com/garestrepop/hy10/pull/13)  
**Branch**: `cursor/staff-availability-us10-a4d7`  
**Base**: `develop`  
**Status**: Draft

---

**Implementation Date**: September 28, 2026  
**Linear Issue**: [HY1-33](https://linear.app/hiturno/issue/HY1-33)  
**AI-DLC Unit**: Catálogo y agenda
