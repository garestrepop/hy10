# Catalog Module

## Overview

The Catalog module provides service management and staff-service association functionality for the hy10 booking system. It implements **US-09: Mantener el staff y sus servicios**.

## Key Features

- Create and manage services (name, description, duration, price)
- Service-specific policy overrides (cancellation, rescheduling)
- Associate staff members with services
- Filter active/inactive services and staff
- Full audit trail integration

## Entities

### Service
Represents a bookable service offered by the business.

```typescript
{
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
  cancel_window_hours: number | null;     // Override global setting
  reschedule_window_hours: number | null; // Override global setting
  max_reschedules: number | null;         // Override global setting
  created_at: Date;
  updated_at: Date;
}
```

### StaffService
Many-to-many relationship between staff and services.

```typescript
{
  id: string;
  staff_id: string;
  service_id: string;
  created_at: Date;
}
```

## API Usage

### Create a Service (Admin only)

```http
POST /catalog/services
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Corte de cabello",
  "description": "Corte básico",
  "duration_minutes": 30,
  "price_cents": 20000,
  "cancel_window_hours": 24,
  "reschedule_window_hours": 12,
  "max_reschedules": 2
}
```

### Associate Staff with Service (Admin only)

```http
POST /catalog/services/{serviceId}/staff
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "staff_ids": [
    "staff-uuid-1",
    "staff-uuid-2"
  ]
}
```

### Get Active Services

```http
GET /catalog/services/active
Authorization: Bearer <jwt-token>
```

Returns only services where `is_active = true`.

### Get Staff for a Service

```http
GET /catalog/services/{serviceId}/staff
Authorization: Bearer <jwt-token>
```

Returns only active staff members associated with the service.

### Get Services for a Staff Member

```http
GET /catalog/staff/{staffId}/services
Authorization: Bearer <jwt-token>
```

## Integration Guide

### For Reservation/Booking Module

When creating a reservation, validate that:

1. The service is active
2. The staff member is active
3. The staff member is associated with the service

```typescript
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class ReservationService {
  constructor(private catalogService: CatalogService) {}

  async createReservation(serviceId: string, staffId: string, ...otherParams) {
    // Validate staff can provide service
    const canProvide = await this.catalogService.canStaffProvideService(
      staffId,
      serviceId
    );
    
    if (!canProvide) {
      throw new BadRequestException(
        'Staff member cannot provide this service'
      );
    }

    // Get service for duration and price
    const service = await this.catalogService.findOne(serviceId);
    
    // Use service policies or fall back to global settings
    const cancelWindowHours = service.cancel_window_hours ?? 
      globalSettings.cancel_min_hours;
    
    // Create reservation...
  }
}
```

### For Availability Calculation

When calculating available slots, only consider active staff:

```typescript
async getAvailableSlots(serviceId: string, date: Date) {
  // Get active staff for this service
  const eligibleStaff = await this.catalogService.getStaffForService(serviceId);
  
  // Calculate slots based on eligibleStaff availability...
  for (const staff of eligibleStaff) {
    // Calculate staff's available slots
  }
}
```

### For Policy Resolution

Services can override global policies. Always check service-specific values first:

```typescript
function resolvePolicy(service: Service, globalSettings: BusinessSettings) {
  return {
    cancelWindowHours: service.cancel_window_hours ?? 
      globalSettings.cancel_min_hours ?? null,
    rescheduleWindowHours: service.reschedule_window_hours ?? 
      globalSettings.reschedule_min_hours ?? null,
    maxReschedules: service.max_reschedules ?? 
      globalSettings.max_reschedules ?? null,
  };
}
```

### For Telegram Bot

Show only active services to clients:

```typescript
async showAvailableServices() {
  const services = await this.catalogService.findActive();
  
  return services.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    duration: s.duration_minutes,
    price: s.price_cents / 100, // Convert to pesos
  }));
}
```

## Business Rules

### Service Creation
- ✅ Only administrators can create services
- ✅ Duration must be at least 1 minute
- ✅ Price must be >= 0 (COP cents)
- ✅ Policy overrides are optional (null = use global)

### Staff Association
- ✅ Only administrators can associate staff with services
- ✅ All staff IDs must exist and be active
- ✅ Previous associations are replaced (not appended)
- ✅ Association changes are audited

### Active/Inactive Filtering
- ✅ Inactive services don't appear in `findActive()`
- ✅ Inactive staff don't appear in `getStaffForService()`
- ✅ `canStaffProvideService()` returns false if either is inactive
- ✅ Historical data is preserved (not deleted)

### Audit Trail
All changes are logged with:
- Action type (SERVICE_CREATED, SERVICE_UPDATED)
- Actor information (ID, email, role)
- Previous and new values
- Timestamp

## Error Handling

```typescript
// 403 Forbidden - Staff trying to create/update
throw new ForbiddenException('Only administrators can create services');

// 404 Not Found - Service doesn't exist
throw new NotFoundException('Service not found');

// 400 Bad Request - Invalid staff IDs
throw new BadRequestException('One or more staff users not found or not active');
```

## Testing

Run the test suite:

```bash
pnpm --filter @hy10/api test catalog.service.spec.ts
```

All scenarios from US-09 are covered:
- ✅ Alta de servicio
- ✅ Override de política
- ✅ Asociar servicios
- ✅ Staff inactivo
- ✅ Servicio inactivo

## Database Schema

### services table
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  cancel_window_hours INT,
  reschedule_window_hours INT,
  max_reschedules INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### staff_services table
```sql
CREATE TABLE staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_id, service_id)
);
```

## Related User Stories

- **US-08**: Mantener los servicios (service CRUD)
- **US-12**: Reservar un turno (uses service and staff validation)
- **US-17**: Ver las reservas en la web (displays service information)
- **US-23**: Marcar el servicio como prestado (uses service price)

## Future Enhancements

Potential improvements not in current scope:

- Service categories/tags
- Service images
- Service availability by day of week
- Staff-specific pricing overrides
- Service bundles/packages
- Seasonal pricing
- Multi-location support (if business expands)

## Support

For questions or issues:
- Review test cases in `catalog.service.spec.ts`
- Check implementation summary in `US-09-IMPLEMENTATION-SUMMARY.md`
- Refer to user story in `aidlc-docs/inception/user-stories/stories.md`
