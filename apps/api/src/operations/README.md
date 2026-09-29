# Operations Module

## Overview

The Operations module provides read-only API endpoints for administrators to query business operations data via REST API. This module implements **US-22: Consultar la operación por Telegram**.

## Purpose

Allow administrators with linked Telegram accounts to query:
- **Occupation**: Current reservation status across all staff members
- **Availability**: Time slots available for booking services
- **Staff per Service**: Which staff members provide each service

These are **read-only queries** - they do not create, cancel, or reschedule any reservations.

## Authorization

All endpoints in this module are protected by two guards:

1. **JwtAuthGuard**: Requires valid JWT authentication
2. **AdminOnlyGuard**: Restricts access to users with `ADMIN` role only

Per US-22 Gherkin scenarios:
- ✅ Administrators with linked Telegram can query these endpoints
- ❌ Staff users **cannot** access administrator-level results
- ❌ Client users **cannot** access administrator-level results

## API Endpoints

### Base Path
```
/api/v1/operations
```

### 1. Get Occupation

Query current occupation across the entire business.

**Endpoint**: `GET /api/v1/operations/occupation`

**Authorization**: Admin only

**Response**:
```json
{
  "timestamp": "2026-09-29T10:00:00Z",
  "total_active_reservations": 15,
  "total_staff": 5,
  "staff_occupation": [
    {
      "staff_id": "uuid-123",
      "staff_name": "John Doe",
      "staff_email": "john@example.com",
      "active_reservations_count": 3,
      "upcoming_reservations": [
        {
          "id": "reservation-uuid",
          "service_name": "Haircut",
          "staff_name": "John Doe",
          "client_name": "Jane Smith",
          "start_time": "2026-09-29T14:00:00Z",
          "end_time": "2026-09-29T14:30:00Z",
          "status": "confirmed"
        }
      ]
    }
  ]
}
```

**Note**: Currently returns empty reservation data until the Reservations module is implemented.

### 2. Get Availability

Query available time slots for a service on a specific date.

**Endpoint**: `GET /api/v1/operations/availability`

**Authorization**: Admin only

**Query Parameters**:
- `service_id` (required): UUID of the service
- `date` (required): Date in ISO 8601 format (e.g., "2026-09-30")
- `staff_id` (optional): UUID of staff member to filter by

**Response**:
```json
{
  "service_id": "service-uuid",
  "service_name": "Haircut",
  "date": "2026-09-30",
  "staff_id": "staff-uuid",
  "slots": [
    {
      "start_time": "2026-09-30T10:00:00Z",
      "end_time": "2026-09-30T10:30:00Z",
      "staff_id": "staff-uuid",
      "staff_name": "John Doe",
      "is_available": true
    }
  ],
  "total_slots": 10
}
```

**Note**: Currently returns empty slots until the Agenda module is implemented.

### 3. Get Staff per Service

Query which staff members provide each service.

**Endpoint**: `GET /api/v1/operations/staff-per-service`

**Authorization**: Admin only

**Response**:
```json
{
  "timestamp": "2026-09-29T10:00:00Z",
  "total_services": 3,
  "services": [
    {
      "service": {
        "id": "service-uuid",
        "name": "Haircut",
        "description": "Basic haircut service",
        "duration_minutes": 30,
        "price_cents": 5000,
        "is_active": true
      },
      "staff": [
        {
          "id": "staff-uuid",
          "name": "John Doe",
          "email": "john@example.com",
          "is_active": true
        }
      ]
    }
  ]
}
```

**Note**: This endpoint is fully functional as it uses existing Services module data.

## Usage Examples

### cURL Examples

```bash
# Get access token first
TOKEN="your-jwt-token"

# Get occupation
curl -X GET "http://localhost:3000/api/v1/operations/occupation" \
  -H "Authorization: Bearer $TOKEN"

# Get availability for a service
curl -X GET "http://localhost:3000/api/v1/operations/availability?service_id=SERVICE_UUID&date=2026-09-30" \
  -H "Authorization: Bearer $TOKEN"

# Get staff per service
curl -X GET "http://localhost:3000/api/v1/operations/staff-per-service" \
  -H "Authorization: Bearer $TOKEN"
```

### TypeScript/JavaScript Example

```typescript
const token = 'your-jwt-token';
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};

// Get occupation
const occupation = await fetch('http://localhost:3000/api/v1/operations/occupation', {
  headers,
});
const occupationData = await occupation.json();

// Get availability
const availability = await fetch(
  'http://localhost:3000/api/v1/operations/availability?service_id=SERVICE_UUID&date=2026-09-30',
  { headers }
);
const availabilityData = await availability.json();

// Get staff per service
const staffServices = await fetch('http://localhost:3000/api/v1/operations/staff-per-service', {
  headers,
});
const staffServicesData = await staffServices.json();
```

## Error Responses

### 401 Unauthorized
Missing or invalid JWT token:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
User is not an administrator:
```json
{
  "statusCode": 403,
  "message": "Access denied. Administrator role required."
}
```

### 404 Not Found
Service or staff not found:
```json
{
  "statusCode": 404,
  "message": "Service with ID service-uuid not found or inactive"
}
```

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Staff per Service | ✅ Fully Implemented | Uses existing Services module |
| Authorization Guards | ✅ Fully Implemented | Admin-only access enforced |
| Occupation Query | ⏳ Placeholder | Awaits Reservations module |
| Availability Query | ⏳ Placeholder | Awaits Agenda module |

## Dependencies

### Current
- `@nestjs/common`
- `@nestjs/typeorm`
- `typeorm`
- Existing: `User`, `Service`, `StaffService` entities
- Existing: `JwtAuthGuard` from Auth module

### Future (for full implementation)
- Reservations module (for occupation queries)
- Agenda module (for availability queries)

## Module Structure

```
src/operations/
├── dto/
│   ├── availability-query.dto.ts           # Query params for availability
│   ├── availability-response.dto.ts        # Availability response structure
│   ├── occupation-response.dto.ts          # Occupation response structure
│   └── staff-services-response.dto.ts      # Staff-service response structure
├── guards/
│   └── admin-only.guard.ts                 # Admin role authorization
├── operations.controller.ts                # REST API endpoints
├── operations.service.ts                   # Business logic
├── operations.service.spec.ts              # Unit tests
├── operations.module.ts                    # Module definition
└── README.md                               # This file
```

## Testing

Run unit tests:
```bash
pnpm --filter @hy10/api test operations.service.spec.ts
```

Run with coverage:
```bash
pnpm --filter @hy10/api test:cov
```

## Related User Stories

- **US-22**: Consultar la operación por Telegram (this module)
- **US-10**: Definir mi disponibilidad (requires Agenda module)
- **US-11**: Supervisar ocupación y agendas (requires Reservations module)
- **US-12**: Reservar un turno (requires Reservations module)

## Security Considerations

1. **Admin-Only Access**: All endpoints require Admin role
2. **Read-Only**: No mutations allowed (no POST, PUT, PATCH, DELETE)
3. **JWT Validation**: All requests must include valid JWT
4. **No Data Leakage**: Staff and Clients cannot access admin-level data

## Future Enhancements

When Reservations and Agenda modules are implemented:

1. **Occupation Query**: Replace placeholder with real reservation data
2. **Availability Query**: Replace placeholder with real schedule calculation
3. **Telegram Bot Integration**: Connect these endpoints to Telegram bot for admin queries
4. **Caching**: Add Redis caching for frequently-queried data
5. **Pagination**: Add pagination for large datasets
6. **Filtering**: Add more granular filtering options
7. **Date Ranges**: Support multi-day availability queries

## Compliance with US-22

### Gherkin Scenario 1: Consultas de solo lectura ✅

- ✅ Administrator with linked Telegram can query
- ✅ Responses come from API
- ✅ Covers complete business
- ✅ No reservations created, cancelled, or rescheduled

### Gherkin Scenario 2: Cliente o Staff pide lo mismo ✅

- ✅ Client cannot access (AdminOnlyGuard blocks)
- ✅ Staff cannot access (AdminOnlyGuard blocks)
- ✅ They do not receive Administrator results

## Support

For questions or issues, refer to:
- Linear Issue: HY1-47
- User Story: US-22 in `aidlc-docs/inception/user-stories/stories.md`
- Component Design: `aidlc-docs/inception/application-design/components.md`
