# US-11 Implementation Guide

## Overview
This document describes the implementation of US-11 "Supervisar ocupación y agendas" (Supervise occupancy and schedules).

**Linear Issue**: [HY1-34](https://linear.app/hy10/issue/HY1-34)  
**Pull Request**: [#14](https://github.com/garestrepop/hy10/pull/14)

## What Was Built

### Backend API - Agenda Module

#### Entities
1. **BusinessHours**: Business operating hours by day of week
2. **StaffScheduleBlock**: Weekly recurring availability blocks for staff
3. **StaffException**: Date-specific schedule exceptions (blocks or openings)

#### Services
**AgendaService** provides:
- `setBusinessHours()` - Configure business hours (admin only)
- `replaceStaffSchedule()` - Update staff weekly blocks
- `addException()` - Add schedule exceptions
- `getStaffSchedule()` - Get schedule for specific staff
- `getAllStaffSchedules()` - Get all staff schedules (admin only)
- `getAvailability()` - Calculate available time slots
- `getOccupancy()` - Get business metrics and staff performance

#### API Endpoints
```
POST   /api/v1/agenda/business-hours           Admin sets business hours
GET    /api/v1/agenda/business-hours           Get business hours
POST   /api/v1/agenda/staff/schedule           Replace staff schedule
POST   /api/v1/agenda/staff/exception          Add exception
GET    /api/v1/agenda/staff/:staffId/schedule  Get staff schedule
GET    /api/v1/agenda/staff/schedules/all      Get all schedules (admin)
GET    /api/v1/agenda/availability             Get available slots
GET    /api/v1/agenda/occupancy                Get occupancy metrics (admin)
```

### Frontend - Web Dashboard

#### Pages
1. **Dashboard** (`/dashboard`)
   - Business occupancy overview
   - Total appointments and revenue
   - Per-staff metrics (appointments, hours)
   - Date range filtering

2. **Schedules** (`/schedules`)
   - Grid view of all staff schedules
   - Weekly blocks grouped by day
   - Exception counts
   - Edit button for each staff

3. **Schedule Editor** (modal view)
   - Add/edit/remove weekly blocks
   - Add schedule exceptions (block or opening)
   - Visual day-of-week selector
   - Time pickers for start/end times
   - Exception type and reason

#### Features
- ✅ Admin can view occupancy dashboard
- ✅ Admin can view all staff schedules
- ✅ Admin can edit any staff schedule
- ✅ Staff can edit own schedule (API supports it)
- ✅ Schedule blocks validated against business hours
- ✅ Exceptions support blocks (unavailable) and openings (extra hours)

## Database Setup

### Run Migrations
```bash
cd /workspace/apps/api
pnpm migration:run
```

### Tables Created
1. `business_hours` - Business operating hours
2. `staff_schedule_blocks` - Staff weekly availability
3. `staff_exceptions` - Date-specific exceptions

### Sample Data

#### Set Business Hours
```bash
curl -X POST http://localhost:3001/api/v1/agenda/business-hours \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "hours": [
      {"day_of_week": 1, "start_time": "09:00", "end_time": "18:00"},
      {"day_of_week": 2, "start_time": "09:00", "end_time": "18:00"},
      {"day_of_week": 3, "start_time": "09:00", "end_time": "18:00"},
      {"day_of_week": 4, "start_time": "09:00", "end_time": "18:00"},
      {"day_of_week": 5, "start_time": "09:00", "end_time": "18:00"}
    ]
  }'
```

#### Set Staff Schedule
```bash
curl -X POST http://localhost:3001/api/v1/agenda/staff/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "staff_id": "STAFF_UUID",
    "blocks": [
      {"day_of_week": 1, "start_time": "09:00", "end_time": "13:00"},
      {"day_of_week": 1, "start_time": "14:00", "end_time": "17:00"},
      {"day_of_week": 3, "start_time": "09:00", "end_time": "17:00"}
    ]
  }'
```

#### Add Exception
```bash
curl -X POST http://localhost:3001/api/v1/agenda/staff/exception \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "staff_id": "STAFF_UUID",
    "date": "2026-10-15",
    "start_time": "09:00",
    "end_time": "17:00",
    "type": "block",
    "reason": "Vacation"
  }'
```

## Running the Application

### Start the API
```bash
cd /workspace/apps/api
pnpm dev
```

### Start the Web App
```bash
cd /workspace/apps/web
npm run dev
```

### Access the Application
- API: http://localhost:3001/api/v1
- Web: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Schedules: http://localhost:3000/schedules

## Authorization

### Admin Access Required For:
- Setting business hours
- Viewing all staff schedules
- Editing any staff schedule
- Viewing occupancy metrics

### Staff Access:
- Viewing own schedule
- Editing own schedule
- Adding exceptions to own schedule

## Testing Checklist

### Backend
- [ ] Can set business hours as admin
- [ ] Cannot set business hours as staff
- [ ] Can create staff schedule blocks
- [ ] Blocks outside business hours are rejected
- [ ] Can add schedule exceptions (block and opening types)
- [ ] Can retrieve staff schedule with blocks and exceptions
- [ ] Admin can get all staff schedules
- [ ] Staff can only edit own schedule
- [ ] Availability calculation includes blocks, exceptions, and service duration
- [ ] Occupancy endpoint returns metrics

### Frontend
- [ ] Dashboard loads and displays occupancy data
- [ ] Dashboard shows total appointments and revenue
- [ ] Dashboard lists all staff with metrics
- [ ] Schedules page shows all staff
- [ ] Schedules page groups blocks by day
- [ ] Schedules page shows exception counts
- [ ] Schedule editor opens when clicking "Edit"
- [ ] Can add new blocks in schedule editor
- [ ] Can remove blocks in schedule editor
- [ ] Can change block day, start time, end time
- [ ] Exception form appears when clicking "Add Exception"
- [ ] Can add exceptions with type and reason
- [ ] Changes are saved to the backend
- [ ] Schedule list refreshes after saving

## Architecture

### Backend Flow
```
Request → Controller → Guard (Auth) → Service → Repository → Database
```

### Frontend Flow
```
Page → API Client → Backend API → Response → State Update → UI Update
```

### Data Models

#### BusinessHours
```typescript
{
  id: uuid,
  day_of_week: number,     // 0-6 (Sunday-Saturday)
  start_time: string,      // HH:mm
  end_time: string,        // HH:mm
}
```

#### StaffScheduleBlock
```typescript
{
  id: uuid,
  staff_id: uuid,
  day_of_week: number,     // 0-6 (Sunday-Saturday)
  start_time: string,      // HH:mm
  end_time: string,        // HH:mm
}
```

#### StaffException
```typescript
{
  id: uuid,
  staff_id: uuid,
  date: string,            // YYYY-MM-DD
  start_time: string,      // HH:mm
  end_time: string,        // HH:mm
  type: 'block' | 'opening',
  reason?: string,
}
```

## Design Decisions

### Why Weekly Blocks + Exceptions?
This pattern provides:
- Easy recurring schedule management
- Flexibility for one-off changes
- Clear distinction between regular and exceptional availability
- Support for both blocking (vacation) and opening (extra hours)

### Why Validate Against Business Hours?
- Ensures staff availability never exceeds business operating hours
- Prevents confusing "available but business is closed" situations
- Enforces a consistent policy at the API level

### Why Separate Occupancy Endpoint?
- Dashboard metrics may require different data sources in the future
- Separates read-heavy analytics from transactional schedule operations
- Allows caching and optimization of occupancy calculations

### Why Admin-Only for Some Operations?
- Business hours affect all staff - only admin should modify
- Viewing all schedules is a supervision feature (US-11 requirement)
- Occupancy metrics are management data

## Future Enhancements

### Backend
- [ ] Recurring exceptions (e.g., "every Monday for 3 months")
- [ ] Bulk schedule updates
- [ ] Schedule templates
- [ ] Conflict detection when creating appointments
- [ ] Integration with reservations module for real occupancy

### Frontend
- [ ] Calendar view for schedules
- [ ] Drag-and-drop schedule blocks
- [ ] Visual conflict indicators
- [ ] Export schedules to PDF/CSV
- [ ] Mobile-responsive design
- [ ] Real-time updates with WebSocket

## Troubleshooting

### API Endpoint Returns 401
- Ensure JWT token is included in Authorization header
- Check token has not expired (15 minutes)
- Verify user has correct role (admin for admin-only endpoints)

### API Endpoint Returns 403
- Staff trying to edit another staff's schedule
- Non-admin trying to access admin-only endpoint

### Block Creation Returns 400
- Block is outside business hours
- Invalid time format (must be HH:mm)
- Start time is after end time

### Web App Cannot Connect to API
- Verify API is running on port 3001
- Check NEXT_PUBLIC_API_URL in .env.local
- Verify CORS is configured correctly on backend

## Files Changed

### Backend
```
apps/api/src/agenda/
├── entities/
│   ├── business-hours.entity.ts
│   ├── staff-schedule-block.entity.ts
│   └── staff-exception.entity.ts
├── dto/
│   ├── business-hours.dto.ts
│   ├── schedule-block.dto.ts
│   ├── exception.dto.ts
│   ├── availability.dto.ts
│   └── occupancy.dto.ts
├── agenda.service.ts
├── agenda.controller.ts
└── agenda.module.ts

apps/api/src/migrations/
└── 1727425000000-CreateAgendaTables.ts

apps/api/src/app.module.ts (updated)
```

### Frontend
```
apps/web/
├── app/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── schedules/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── schedule-editor.tsx
├── lib/
│   └── api-client.ts
├── .env.local
└── package.json
```

## Related Documentation
- User Story: `aidlc-docs/inception/user-stories/stories.md` lines 260-277
- Requirements: `aidlc-docs/inception/requirements/requirements.md` FR-15, FR-17, FR-34
- Component Design: `aidlc-docs/inception/application-design/components.md` Agenda section
- Linear Issue: HY1-34
