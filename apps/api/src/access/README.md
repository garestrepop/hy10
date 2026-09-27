# Access Module - Logout Functionality

This module implements the logout functionality for the hy10 application, as specified in user story US-02.

## Features

### 1. Logout from Current Device
Invalidates the current refresh token, preventing an expired access token from being renewed.

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
- `Authorization: Bearer <access-token>` (required)

**Body:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

Or alternatively, send the refresh token in the header:
```
X-Refresh-Token: your-refresh-token
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out from this device"
}
```

**Gherkin Scenario Implemented:**
```gherkin
Escenario: Cerrar este dispositivo
  Dado una sesión activa
  Cuando cierra la sesión en este dispositivo
  Entonces ese refresh token queda invalidado
  Y un access token vencido no se renueva con él
```

### 2. Logout from All Devices
Invalidates all refresh tokens for the current user account, preventing any previous refresh token from renewing the session.

**Endpoint:** `POST /api/v1/auth/logout-all`

**Headers:**
- `Authorization: Bearer <access-token>` (required)

**Body:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out from all devices (3 sessions revoked)"
}
```

**Gherkin Scenario Implemented:**
```gherkin
Escenario: Cerrar todos los dispositivos
  Dado sesiones en más de un dispositivo
  Cuando cierra la sesión en todos
  Entonces ningún refresh token anterior renueva la sesión
```

## Database Schema

### Accounts Table
Stores user account information.

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR,
  role ENUM('admin', 'staff') NOT NULL,
  provider ENUM('local', 'google') DEFAULT 'local',
  provider_id VARCHAR,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  telegram_user_id VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Refresh Tokens Table
Stores and tracks refresh tokens for all active sessions.

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR UNIQUE NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_account_revoked ON refresh_tokens(account_id, is_revoked);
```

## Security Features

1. **Token Revocation**: Refresh tokens are immediately revoked upon logout
2. **Audit Logging**: All logout actions are logged in the audit trail
3. **IP Tracking**: Client IP addresses are recorded for security monitoring
4. **Cascade Deletion**: When an account is deleted, all associated refresh tokens are automatically deleted

## Token Rotation

The system implements refresh token rotation as specified in US-01:
- Access tokens expire after 15 minutes
- Refresh tokens expire after 2 days
- When a refresh token is used, it is revoked and a new one is issued
- Logout operations revoke tokens without issuing new ones

## Audit Trail

All logout operations are recorded in the audit log with:
- Action: `LOGOUT`
- Actor information (account ID, email, role)
- Logout type (single_device or all_devices)
- Number of sessions revoked (for logout-all)
- IP address
- Timestamp

## Testing

Run tests with:
```bash
pnpm test auth.service.spec
pnpm test auth.controller.spec
```

## Migration

Apply the database migration:
```bash
pnpm migration:run
```

## Dependencies

- `@nestjs/jwt` - JWT token generation and validation
- `@nestjs/passport` - Authentication middleware
- `passport-jwt` - Passport strategy for JWT
