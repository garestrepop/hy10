# Access Module - Logout Functionality

This module implements the logout functionality for the hy10 application, as specified in user story US-02.

## 🔒 Security Features

### Token Security
- ✅ **Hashed refresh tokens**: Tokens are hashed with bcrypt (10 rounds) before storage
- ✅ **Timing-safe comparison**: Uses bcrypt.compare() to prevent timing attacks
- ✅ **Token rotation**: Old refresh token is revoked when creating new session
- ✅ **Immediate revocation**: Logout invalidates tokens instantly

### JWT Security
- ✅ **Mandatory JWT_SECRET**: Application fails to start without valid secret
- ✅ **Minimum secret length**: 64 characters enforced
- ✅ **Short-lived access tokens**: 15-minute expiration
- ✅ **Configurable expiration**: Refresh tokens expire after 2 days

### API Security
- ✅ **CORS whitelist**: Only configured origins allowed
- ✅ **IP tracking**: All sessions record client IP address
- ✅ **Audit logging**: Complete logout history with actor and metadata
- ✅ **No hardcoded secrets**: All secrets from environment variables

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

**Security Note**: The refresh token is sent once and compared against hashed values in the database using timing-safe comparison.

### 2. Logout from All Devices
Invalidates all refresh tokens for the current user account.

**Endpoint:** `POST /api/v1/auth/logout-all`

**Headers:**
- `Authorization: Bearer <access-token>` (required)

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out from all devices (3 sessions revoked)"
}
```

## Database Schema

### Accounts Table
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
**IMPORTANT**: Tokens are stored as bcrypt hashes, not plaintext.

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash VARCHAR UNIQUE NOT NULL,  -- bcrypt hash, not plaintext
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_account_revoked ON refresh_tokens(account_id, is_revoked);
```

## Environment Variables

### Required for Production
```bash
# JWT Secret - MUST be at least 64 characters
# Generate with: openssl rand -hex 64
JWT_SECRET=your-secure-jwt-secret-minimum-64-characters

# CORS Configuration
WEB_ORIGIN=https://app.hy10.com

# Database (already configured)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=hy10
```

### Generating JWT_SECRET
```bash
# Generate a cryptographically secure 64-character secret
openssl rand -hex 64

# Add to .env file
echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env
```

**CRITICAL**: The application will NOT start without a valid `JWT_SECRET` of at least 64 characters.

## Token Flow

### Session Creation (Login - US-01)
```
1. User authenticates
2. Generate random token: crypto.randomBytes(64)
3. Hash token: bcrypt.hash(token, 10) → $2b$10$...
4. Save hash to database
5. Return plaintext token to client (ONLY TIME IT'S VISIBLE)
```

### Token Validation (Refresh)
```
1. Client sends plaintext token
2. Load all non-revoked hashes from database
3. bcrypt.compare(plaintext, hash) for each (timing-safe)
4. If match found: revoke old token, generate new session
5. If no match: reject with 401
```

### Token Revocation (Logout)
```
1. Client sends plaintext token + JWT
2. Load all non-revoked tokens for that account
3. Find matching hash using bcrypt.compare
4. Mark token as revoked (is_revoked=true, revoked_at=now)
5. Token hash remains in DB but unusable
```

## Testing

All tests passing (22 total):
```bash
# Run all auth tests
JWT_SECRET=$(openssl rand -hex 64) pnpm test -- auth

# Run specific test suites
JWT_SECRET=$(openssl rand -hex 64) pnpm test -- auth.service.spec.ts
JWT_SECRET=$(openssl rand -hex 64) pnpm test -- auth.controller.spec.ts
```

**Note**: Tests require `JWT_SECRET` environment variable to pass validation.

## Migration

Apply the database changes:
```bash
pnpm migration:run
```

**Migration Details**:
- Creates `accounts` table with user authentication data
- Creates `refresh_tokens` table with hashed tokens
- Sets up indexes for performance
- Configures cascade deletion

## Security Audit

See [SECURITY.md](./SECURITY.md) for complete security review and resolved findings.

### Key Security Improvements (vs. original implementation)
1. ✅ Refresh tokens hashed with bcrypt (was plaintext)
2. ✅ JWT_SECRET validation on startup (was optional with insecure fallback)
3. ✅ CORS whitelist configuration (was accepting all origins)
4. ✅ Timing-safe token comparison (prevents timing attacks)

## Dependencies

- `bcrypt` ^5.1.1 - Secure password/token hashing
- `@nestjs/jwt` - JWT token generation and validation
- `@nestjs/passport` - Authentication middleware
- `passport-jwt` - Passport strategy for JWT

## Related Issues

- Implements HY1-25 (US-02 Cerrar sesión)
- Foundation for US-01 Iniciar sesión (login implementation)

## Notes for US-01 (Login Implementation)

When implementing login, reuse:
- `generateSession()` method for token creation
- `Account` and `RefreshToken` entities
- JWT configuration from `AccessModule`
- Token hashing pattern with bcrypt

Remember to:
- Hash passwords with bcrypt before saving
- Implement rate limiting (5 login attempts/minute)
- Add MFA validation for admin accounts
- Use same audit pattern for login events

