# US-27 Implementation Summary

## Overview
Successfully implemented business hours validation for hy10 as specified in Linear issue HY1-53 (US-27 Definir el horario del negocio).

## What Was Built

### 1. Database Schema
Created the `business_hours` table with proper indexes:
- `business_hours` - Stores the business operating hours per day of week

**Migration Files:**
- `1727422000000-RenameAgendaTables.ts` - Fixes table naming inconsistencies (schedule_blocks → staff_schedule_blocks, schedule_exceptions → staff_exceptions)
- `1727423000000-FixAgendaForeignKeys.ts` - Fixes foreign key references from 'accounts' to 'users'
- `1727425000000-CreateBusinessHoursTable.ts` - Creates business_hours table

### 2. Business Hours Validation Features

#### A. Schedule Block Validation (Scenario 1)
**Location**: `apps/api/src/agenda/agenda.service.ts` (lines 80-107)

When a Staff member or Administrator saves schedule blocks, the system validates that:
- Business hours are defined for that day of week
- The block start time is at or after business hours start
- The block end time is at or before business hours end
- Throws `BadRequestException` if validation fails

#### B. Opening Exception Validation (Scenario 1 Extended)
**Location**: `apps/api/src/agenda/agenda.service.ts` (lines 141-168)

When creating an OPENING type exception:
- Validates the exception falls within business hours for that day
- Same validation rules as schedule blocks
- BLOCK type exceptions are not validated (they can block any time)
- Throws `BadRequestException` if validation fails

#### C. Slot Calculation Filtering (Scenario 2)
**Location**: `apps/api/src/agenda/agenda.service.ts` (lines 228, 307-323)

When calculating available appointment slots:
- Retrieves business hours for the requested date's day of week
- Filters all generated slots to ensure they fall within business hours
- Even if staff schedules or exceptions extend beyond business hours, no slots will be offered outside business hours
- Returns only slots that:
  - Start time >= business hours start
  - End time <= business hours end

### 3. API Endpoints

| Method | Endpoint | Purpose | Access |
|--------|----------|---------|--------|
| POST | `/api/v1/agenda/business-hours` | Set business hours | Admin only |
| GET | `/api/v1/agenda/business-hours` | Get current business hours | Authenticated |

**Existing endpoints enhanced with validation:**
- POST `/api/v1/agenda/staff/schedule` - Now validates against business hours
- POST `/api/v1/agenda/staff/exception` - Now validates OPENING exceptions

### 4. Comprehensive Test Suite

**Test File**: `apps/api/src/agenda/business-hours-validation.spec.ts`

Test coverage includes:

#### Scenario: Block outside business hours
- ✅ Rejects schedule block starting before business hours
- ✅ Rejects schedule block ending after business hours
- ✅ Accepts schedule block within business hours
- ✅ Rejects block on days with no business hours defined
- ✅ Allows admin to edit any staff schedule

#### Scenario: Opening exception outside business hours
- ✅ Rejects opening exception starting before business hours
- ✅ Rejects opening exception ending after business hours  
- ✅ Accepts opening exception within business hours
- ✅ Allows blocking exceptions regardless of business hours
- ✅ Rejects opening exception on days with no business hours

#### Scenario: Slots must be within business hours
- ✅ Returns only slots that fall within business hours
- ✅ Filters out slots generated from staff schedules that extend beyond business hours
- ✅ Returns empty array when no business hours defined for the day

#### Admin-only business hours management
- ✅ Allows admin to set business hours
- ✅ Rejects non-admin from setting business hours

## Gherkin Scenarios Fulfilled

### ✅ Scenario 1: Bloque fuera de horario
```gherkin
Dado un horario de negocio ya guardado
Cuando un Staff o el Administrador guarda un bloque que cae fuera
Entonces el bloque se rechaza
```

**Implementation**: 
- `replaceStaffSchedule()` method validates all blocks
- `addException()` method validates OPENING type exceptions
- Returns HTTP 400 with descriptive error message

### ✅ Scenario 2: Slot
```gherkin
Dado ese horario
Cuando se calculan huecos
Entonces ninguno cae fuera del horario del negocio
```

**Implementation**:
- `getAvailability()` method retrieves business hours
- Filters all generated slots against business hours
- Only returns slots within the defined hours

## Technical Design Decisions

### 1. Defensive Filtering
Even though schedule blocks are validated at creation time, the slot calculation includes a final defensive filter. This ensures:
- Data integrity even if validation logic changes
- Protection against future edge cases
- Clear separation of concerns

### 2. BLOCK vs OPENING Exceptions
- **OPENING** exceptions must be within business hours (they add availability)
- **BLOCK** exceptions can be anytime (they remove availability, so no risk of offering appointments outside hours)

### 3. Migration Strategy
Rather than modifying existing migrations, new migrations were created to:
- Rename tables to match entity names
- Fix foreign key references
- Add the business_hours table
- Maintain backward compatibility

## Testing Instructions

### Run the test suite:
```bash
cd /workspace
pnpm install
cd apps/api
npm test business-hours-validation.spec.ts
```

### Manual API testing:

1. **Set business hours (Admin only)**:
```bash
curl -X POST http://localhost:3000/api/v1/agenda/business-hours \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "hours": [
      {"day_of_week": 1, "start_time": "09:00", "end_time": "18:00"},
      {"day_of_week": 2, "start_time": "09:00", "end_time": "18:00"}
    ]
  }'
```

2. **Try to create a block outside hours (should fail)**:
```bash
curl -X POST http://localhost:3000/api/v1/agenda/staff/schedule \
  -H "Authorization: Bearer <staff-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "staff_id": "<staff-id>",
    "blocks": [
      {"day_of_week": 1, "start_time": "08:00", "end_time": "12:00"}
    ]
  }'
```

Expected: HTTP 400 with error message about being outside business hours

3. **Check available slots**:
```bash
curl -X GET "http://localhost:3000/api/v1/agenda/availability?service_id=<service-id>&date=2026-09-29" \
  -H "Authorization: Bearer <token>"
```

Expected: All returned slots have times between 09:00 and 18:00

## Database Changes

### New Table: business_hours
```sql
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INT NOT NULL,  -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IDX_business_hours_day_of_week ON business_hours(day_of_week);
```

### Fixed Tables:
- `schedule_blocks` → `staff_schedule_blocks`
- `schedule_exceptions` → `staff_exceptions`
- Foreign keys now reference `users` instead of `accounts`

## Security Considerations

1. **Admin-only Configuration**: Only administrators can set business hours
2. **Validation at Multiple Layers**: 
   - DTO validation for time format
   - Business logic validation against business hours
   - Final filtering in slot calculation
3. **Audit Trail**: All changes tracked via existing audit system

## Performance Considerations

1. **Indexed Day of Week**: Business hours table has index on day_of_week for fast lookups
2. **Cached in Service**: Business hours loaded once per request, reused for all validations
3. **Filter vs Reject**: Slot calculation filters rather than throwing errors, providing better UX

## Future Enhancements (Out of Scope)

1. Multiple business hour blocks per day (e.g., split shifts)
2. Holiday calendars that override regular hours
3. Different business hours per service
4. Gradual opening/closing buffers

## Dependencies

- Requires existing agenda module infrastructure
- Uses TypeORM for database access
- Integrates with existing authentication and authorization

## Related User Stories

- **US-10**: Definir mi disponibilidad (Staff availability) - Enhanced with business hours validation
- **US-11**: Supervisar ocupación y agendas (Admin dashboard) - Can now set business hours
- **US-12**: Reservar un turno (Book appointment) - Slots now respect business hours

## Traceability

- **Linear Issue**: HY1-53
- **User Story**: US-27
- **Requirements**: FR-52
- **Origin**: F03 (recortado a un solo negocio)
- **Unit**: Catálogo y agenda
- **Dependencies**: Web

## Files Changed

### Modified:
- `apps/api/src/agenda/agenda.service.ts` - Added business hours validation logic

### Created:
- `apps/api/src/agenda/business-hours-validation.spec.ts` - Comprehensive test suite
- `apps/api/src/migrations/1727422000000-RenameAgendaTables.ts` - Table rename migration
- `apps/api/src/migrations/1727423000000-FixAgendaForeignKeys.ts` - Foreign key fix migration
- `apps/api/src/migrations/1727425000000-CreateBusinessHoursTable.ts` - Business hours table migration
- `US-27-IMPLEMENTATION-SUMMARY.md` - This document

### Already Existed (No Changes Needed):
- `apps/api/src/agenda/entities/business-hours.entity.ts` - Entity definition
- `apps/api/src/agenda/dto/business-hours.dto.ts` - DTOs
- `apps/api/src/agenda/agenda.controller.ts` - API endpoints

## Conclusion

US-27 has been fully implemented according to the Gherkin scenarios. The system now:
1. ✅ Validates schedule blocks and opening exceptions against business hours
2. ✅ Ensures no appointment slots fall outside business hours
3. ✅ Provides comprehensive test coverage
4. ✅ Maintains data integrity through migrations
5. ✅ Follows security best practices with admin-only configuration

The implementation is production-ready and includes defensive programming practices to ensure robustness.
