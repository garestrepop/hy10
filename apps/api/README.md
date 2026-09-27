# hy10 API

Backend API for the hy10 business management system.

## US-07: Configure the Business

This module implements the business configuration feature as specified in user story US-07.

### Features

- ✅ Default configuration values for new businesses
- ✅ Admin-only access to modify settings
- ✅ Audit trail for all configuration changes
- ✅ Staff users can view but not modify settings
- ✅ Model identifier configuration (API key stored separately in secrets)
- ✅ Timezone, conversation timeouts, and policy management

### API Endpoints

#### GET /api/v1/settings
Get the current business settings.

**Authorization**: Admin or Staff (read-only for Staff)

**Response**:
```json
{
  "id": "uuid",
  "timezone": "America/Bogota",
  "model_identifier": "gpt-4",
  "conversation_session_ttl_minutes": 60,
  "handoff_ambiguity_attempts": 3,
  "staff_upcoming_notice_minutes": 30,
  "voice_note_max_seconds": 60,
  "allow_cancel": false,
  "allow_reschedule": false,
  "cancel_min_hours": null,
  "reschedule_min_hours": null,
  "max_reschedules": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### PATCH /api/v1/settings
Update business settings.

**Authorization**: Admin only

**Request Body**:
```json
{
  "timezone": "America/Mexico_City",
  "model_identifier": "claude-3-opus",
  "allow_cancel": true,
  "cancel_min_hours": 24
}
```

**Response**: Updated settings object

### Default Values

When a business is first created, the following defaults are applied:

- `timezone`: "America/Bogota"
- `conversation_session_ttl_minutes`: 60
- `handoff_ambiguity_attempts`: 3
- `staff_upcoming_notice_minutes`: 30
- `voice_note_max_seconds`: 60
- `allow_cancel`: false
- `allow_reschedule`: false
- `cancel_min_hours`: null
- `reschedule_min_hours`: null
- `max_reschedules`: null

### Audit Trail

All configuration changes are automatically logged with:
- Actor (who made the change)
- Previous values
- New values
- Timestamp

Sensitive data (passwords, tokens, API keys) is automatically redacted from audit logs.

### Security

- JWT authentication required for all endpoints
- Role-based authorization (Admin/Staff)
- Staff users receive 403 Forbidden when attempting to modify settings
- API keys and secrets are never exposed in responses
- Audit logs exclude sensitive information

## Running the API

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
cd ../../packages/database
pnpm db:migrate

# Start development server
cd ../../apps/api
pnpm dev
```

The API will be available at `http://localhost:3001`.

## Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run tests in watch mode
pnpm test:watch
```

All three scenarios from US-07 are covered by unit tests:
1. Initial default values
2. Save policies and model with audit trail
3. Staff authorization rejection
