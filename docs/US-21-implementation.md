# US-21: Staff Notification for Cancellations and Rescheduling

## Overview

This document describes the implementation of US-21 (Enterarme de una cancelación o reprogramación) for the hy10 project.

## User Story

**Priority**: Must  
**Persona**: Staff  
**Requirements**: FR-30, FR-40  
**Unit**: Plataforma

As Staff, I want to know when a Client cancels or moves my reservation so I don't show up at the old time slot.

## Scenarios

### Scenario 1: Notification on Change

**Given** a Staff with linked Telegram  
**When** a Client cancels or reschedules a reservation for that Staff  
**Then** they receive the fact, the previous schedule, and if there was a reschedule, the new schedule

### Scenario 2: Query Later

**Given** that change already occurred  
**When** the Staff asks via Telegram  
**Then** the response uses their reservation history and not another staff member's

## Implementation Details

### Architecture

This implementation follows the modular monolith pattern defined in the application design:

- **Platform** schema: Notifications, Settings
- **Reservations** schema: Reservations, Clients
- **Access** schema: Users (Staff)

### Components Created

#### 1. Platform Module (`src/platform/`)

**Entities:**
- `Settings`: Business configuration including timezone, notification windows
- `Notification`: Notification queue with type, recipient, message, and status

**Services:**
- `NotificationsService`: Creates and manages notifications
  - `reservationChanged(reservation, kind, serviceName, clientName)`: Creates notification when reservation is cancelled or rescheduled
  - `staffUpcoming(reservation, serviceName, clientName)`: Creates upcoming appointment reminder
  - `getPendingNotifications()`: Retrieves pending notifications for processing
  - `markAsSent(notificationId)`: Marks notification as successfully sent
  - `markAsFailed(notificationId, error)`: Marks notification as failed

- `NotificationProcessorService`: Background processor that sends pending notifications
  - Runs every 30 seconds via cron job
  - Retrieves pending notifications and sends via Telegram
  - Updates notification status based on send result

#### 2. Reservations Module (`src/reservations/`)

**Entities:**
- `Reservation`: Reservation with status, times, and change tracking

**Services:**
- `ReservationsService`: Manages reservation lifecycle
  - `cancel(dto)`: Cancels a reservation, creates audit log, and triggers cancellation notification
  - `reschedule(dto)`: Reschedules a reservation, tracks previous time, and triggers reschedule notification
  - `findByStaffId(staffId, fromDate)`: Retrieves reservations for a staff member (used by agent tools)

**Controller:**
- `POST /api/v1/reservations/:id/cancel`: Cancel a reservation
- `POST /api/v1/reservations/:id/reschedule`: Reschedule a reservation
- `GET /api/v1/reservations/staff/:staffId`: Get staff reservations

#### 3. Agent Module (`src/agent/`)

**Services:**
- `AgentToolsService`: Provides tools for the AI agent
  - `readStaffAgenda(query)`: Returns only the staff member's own reservations

**Controller:**
- `GET /api/v1/agent/tools/staff/:staffId/agenda`: Agent tool for querying staff agenda

#### 4. Telegram Module (`src/telegram/`)

**Services:**
- `TelegramService`: Handles Telegram communication
  - `sendMessage(dto)`: Sends text message to Telegram user

#### 5. Supporting Modules

- **Staff Module** (`src/staff/`): User entity with Telegram linking
- **Clients Module** (`src/clients/`): Client entity with Telegram user ID

### Database Schema

#### Platform Schema

```sql
CREATE SCHEMA platform;

CREATE TABLE platform.settings (
  id UUID PRIMARY KEY,
  timezone VARCHAR DEFAULT 'America/Bogota',
  staff_upcoming_notice_minutes INT DEFAULT 30,
  -- ... other settings
);

CREATE TABLE platform.notifications (
  id UUID PRIMARY KEY,
  type notification_type NOT NULL,
  recipient_id UUID NOT NULL,
  recipient_telegram_id VARCHAR,
  reservation_id UUID,
  message TEXT NOT NULL,
  metadata JSONB,
  status notification_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
```

#### Reservations Schema

```sql
CREATE SCHEMA reservations;

CREATE TABLE reservations.reservations (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  service_id UUID NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL,
  status reservation_status DEFAULT 'confirmed',
  reschedule_count INT DEFAULT 0,
  previous_start_time TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reservations.clients (
  id UUID PRIMARY KEY,
  telegram_user_id VARCHAR UNIQUE NOT NULL,
  display_name VARCHAR NOT NULL,
  opted_out BOOLEAN DEFAULT FALSE
);
```

#### Access Schema

```sql
CREATE SCHEMA access;

CREATE TABLE access.users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  role user_role DEFAULT 'staff',
  telegram_user_id VARCHAR UNIQUE,
  display_name VARCHAR,
  is_active BOOLEAN DEFAULT TRUE
);
```

### Notification Flow

1. **Cancellation Flow:**
   ```
   Client/Web → ReservationsService.cancel()
     ↓ (saves to DB)
   AuditService.record() (audit log)
     ↓
   NotificationsService.reservationChanged(CANCELLED)
     ↓ (creates notification record)
   NotificationProcessorService (cron)
     ↓ (retrieves pending)
   TelegramService.sendMessage()
     ↓
   NotificationsService.markAsSent/Failed()
   ```

2. **Rescheduling Flow:**
   ```
   Client/Web → ReservationsService.reschedule()
     ↓ (updates start_time, saves previous_start_time)
   AuditService.record() (audit log)
     ↓
   NotificationsService.reservationChanged(RESCHEDULED)
     ↓ (creates notification with both times)
   NotificationProcessorService (cron)
     ↓
   TelegramService.sendMessage()
   ```

3. **Query Flow (Scenario 2):**
   ```
   Telegram Bot → Agent
     ↓ (identifies staff from telegram_user_id)
   AgentToolsService.readStaffAgenda(staffId)
     ↓ (filters by staff_id only)
   ReservationsService.findByStaffId()
     ↓ (returns only staff's reservations)
   Agent → Telegram (formatted response)
   ```

### Notification Message Format

**Cancellation:**
```
🚫 Cancelación de reserva

Cliente: Jane Doe
Servicio: Haircut
Horario cancelado: 29 de septiembre de 2026, 10:00 AM

El horario ha quedado disponible.
```

**Rescheduling:**
```
🔄 Reprogramación de reserva

Cliente: Jane Doe
Servicio: Haircut
Horario anterior: 29 de septiembre de 2026, 10:00 AM
Nuevo horario: 30 de septiembre de 2026, 2:00 PM

No te presentes al horario anterior.
```

**Upcoming Appointment:**
```
⏰ Próximo turno

Cliente: Jane Doe
Servicio: Haircut
Horario: 30 de septiembre de 2026, 2:00 PM

Este turno comienza pronto.
```

### Security & Access Control

1. **Staff Isolation**: The `findByStaffId()` method ensures staff only see their own reservations
2. **Telegram Linking**: Staff must link Telegram from authenticated web session (future implementation)
3. **Notification Filtering**: Notifications only sent to staff with `telegram_user_id` set
4. **Audit Trail**: All cancellations and reschedules are logged via AuditService

### API Examples

#### Cancel a Reservation

```bash
POST /api/v1/reservations/reservation-123/cancel
Content-Type: application/json

{
  "actorId": "client-456",
  "actorRole": "client",
  "reason": "Client request"
}
```

#### Reschedule a Reservation

```bash
POST /api/v1/reservations/reservation-123/reschedule
Content-Type: application/json

{
  "newStartTime": "2026-09-30T14:00:00Z",
  "actorId": "client-456",
  "actorRole": "client"
}
```

#### Query Staff Agenda (Agent Tool)

```bash
GET /api/v1/agent/tools/staff/staff-123/agenda?fromDate=2026-09-27T00:00:00Z
```

Response:
```json
[
  {
    "id": "reservation-123",
    "client_id": "client-456",
    "staff_id": "staff-123",
    "service_id": "service-789",
    "start_time": "2026-09-30T10:00:00Z",
    "duration_minutes": 60,
    "status": "confirmed",
    "reschedule_count": 0
  }
]
```

### Testing

#### Unit Tests

- `notifications.service.spec.ts`: Tests notification creation for cancellations, reschedules, and upcoming appointments
- `reservations.service.spec.ts`: Tests reservation cancellation, rescheduling, and staff query isolation

Run tests:
```bash
cd apps/api
pnpm test notifications.service
pnpm test reservations.service
```

#### Integration Testing

To test the full flow:

1. Create a staff user with Telegram linked
2. Create a reservation for that staff
3. Cancel or reschedule the reservation
4. Check that a notification was created in `platform.notifications`
5. Wait for cron job or manually trigger `NotificationProcessorService`
6. Verify notification status updated to 'sent'

### Environment Configuration

Required environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=hy10
```

### Database Migrations

Run migrations to create schemas:

```bash
cd apps/api
pnpm migration:run
```

Migrations:
- `1727500000000-CreatePlatformSchema.ts`: Creates platform schema with settings and notifications
- `1727500100000-CreateAccessSchema.ts`: Creates access schema with users
- `1727500200000-CreateReservationsSchema.ts`: Creates reservations schema

### Requirements Traceability

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| FR-30 | ✅ Implemented | NotificationsService sends notifications on reservation changes |
| FR-40 | ✅ Implemented | Staff receives notification with old/new times when client changes reservation |
| US-21 Scenario 1 | ✅ Implemented | Cancellation and reschedule notifications created and sent via Telegram |
| US-21 Scenario 2 | ✅ Implemented | AgentToolsService.readStaffAgenda() filters by staff_id |

### Future Enhancements

1. **Telegram Bot Integration**: Full webhook handler for incoming messages
2. **Voice Note Support**: Transcription and processing (US-32)
3. **Upcoming Appointment Reminders**: Scheduled job to send reminders based on `staff_upcoming_notice_minutes`
4. **Notification History**: UI for staff to view past notifications
5. **Retry Logic**: Exponential backoff for failed Telegram sends
6. **Real-time WebSocket**: Push notifications to web interface

### Dependencies

This implementation depends on:
- NestJS 10.x
- TypeORM 0.3.x
- @nestjs/schedule 4.x
- PostgreSQL 14+

### Notes

- Notification messages are in Spanish as per product requirements
- Timezone formatting uses `America/Bogota` by default (configurable via Settings)
- The notification processor runs every 30 seconds (configurable via cron expression)
- Staff without linked Telegram will not receive notifications (logged as debug)
- All reservation changes are audited via AuditService (US-31)

## Related Stories

- US-19: Staff upcoming appointment reminders
- US-20: Staff queries their agenda via Telegram
- US-31: Audit trail for all reservation changes
- US-32: Voice note support for Telegram messages

## References

- [Application Design](/workspace/aidlc-docs/inception/application-design/application-design.md)
- [Component Methods](/workspace/aidlc-docs/inception/application-design/component-methods.md)
- [Unit of Work](/workspace/aidlc-docs/inception/application-design/unit-of-work.md)
- [User Stories](/workspace/aidlc-docs/inception/user-stories/stories.md)
