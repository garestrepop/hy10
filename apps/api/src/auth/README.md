# Authentication Module

This module implements the authentication system for hy10 (US-01).

## Features

✅ **Email/Password Authentication**
- User registration with email and password
- Secure password hashing with bcrypt
- Password validation (minimum 8 characters, check against leaked passwords)
- Account lockout after 5 failed login attempts (15-minute lockout)

✅ **Google OAuth Authentication**
- Login/Register with Google account
- No duplicate accounts (same email = same user)
- Automatic account linking

✅ **JWT Tokens**
- Access token: 15 minutes expiration
- Refresh token: 2 days expiration with rotation
- Tokens validated on server (signature, expiration, issuer, audience)

✅ **Session Management**
- Logout from current device
- Logout from all devices (revokes all refresh tokens)
- Device and IP tracking

✅ **Password Recovery**
- Email-based password reset
- One-time use tokens
- 1-hour expiration
- Generic error messages (doesn't reveal if email exists)

✅ **Security Features**
- Rate limiting on login (5 attempts per minute)
- Rate limiting on password reset (3 attempts per 5 minutes)
- Account lockout after repeated failed attempts
- Weak password detection
- JWT signature validation

## API Endpoints

### Authentication

#### POST `/api/v1/auth/register`
Register a new user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "a1b2c3...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "staff",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

#### POST `/api/v1/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Same as register

#### GET `/api/v1/auth/google`
Initiates Google OAuth flow. Redirects to Google login page.

#### GET `/api/v1/auth/google/callback`
Google OAuth callback. Redirects to web app with tokens.

#### POST `/api/v1/auth/refresh`
Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "a1b2c3..."
}
```

**Response:** Same as register (with new tokens)

#### POST `/api/v1/auth/logout`
Logout from current device. Requires authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "refresh_token": "a1b2c3..."
}
```

#### POST `/api/v1/auth/logout-all`
Logout from all devices. Requires authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/api/v1/auth/password-reset/request`
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

#### POST `/api/v1/auth/password-reset/confirm`
Reset password with token.

**Request:**
```json
{
  "token": "reset-token-here",
  "new_password": "NewSecurePass123!"
}
```

#### GET `/api/v1/auth/me`
Get current user information. Requires authentication.

**Headers:**
```
Authorization: Bearer <access_token>
```

## Protected Routes

To protect routes, use the `JwtAuthGuard`:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Controller('protected')
export class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtectedData(@CurrentUser() user: any) {
    return { message: 'This is protected data', user };
  }
}
```

### Role-Based Access Control

To restrict access by role:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from './auth/guards/roles.guard';
import { UserRole } from './auth/entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get()
  @Roles([UserRole.ADMIN])
  getAdminData() {
    return { message: 'This is admin-only data' };
  }
}
```

## Environment Variables

Required environment variables (see `.env.example`):

```env
# JWT
JWT_SECRET=your-secret-key-minimum-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=hy10

# Application
WEB_ORIGIN=http://localhost:3000
```

## Database Schema

The module creates three tables:

### `users`
- `id` (UUID, PK)
- `email` (unique)
- `password_hash` (nullable for OAuth users)
- `auth_provider` (email | google)
- `google_id` (nullable)
- `role` (admin | staff)
- `first_name`, `last_name` (nullable)
- `is_active` (boolean)
- `email_verified` (boolean)
- `mfa_secret`, `mfa_enabled` (for future MFA implementation)
- `telegram_user_id` (nullable, for future Telegram integration)
- `failed_login_attempts` (integer)
- `last_failed_login`, `locked_until` (timestamps)
- `created_at`, `updated_at`

### `refresh_tokens`
- `id` (UUID, PK)
- `user_id` (FK to users)
- `token` (unique)
- `expires_at` (timestamp)
- `is_revoked` (boolean)
- `device_info`, `ip_address` (nullable)
- `created_at`

### `password_reset_tokens`
- `id` (UUID, PK)
- `user_id` (FK to users)
- `token` (unique)
- `expires_at` (timestamp)
- `is_used` (boolean)
- `created_at`

## Testing

Run tests:
```bash
pnpm test auth.service.spec.ts
```

## Security Considerations

1. **JWT Secret**: Use a strong, random secret key in production (minimum 32 characters)
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Configured via `@nestjs/throttler`
4. **CORS**: Configure `WEB_ORIGIN` to match your frontend domain
5. **Password Storage**: Never store plain text passwords
6. **Token Rotation**: Refresh tokens are rotated on each use
7. **Account Lockout**: Protects against brute force attacks

## Password Reset Email

The system sends password reset emails using the configured SMTP provider. The email includes:
- A secure, single-use token valid for 1 hour
- A direct link to reset the password
- Clear security warnings
- Responsive HTML template

### Email Configuration

Set these environment variables:

```env
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-smtp-user
MAIL_PASSWORD=your-smtp-password
MAIL_FROM=noreply@hy10.app
```

For development, use [Mailtrap](https://mailtrap.io) to test emails safely without sending real messages.

For production, use a transactional email service:
- SendGrid
- AWS SES
- Postmark
- Mailgun

## Future Enhancements

- [ ] MFA (Multi-Factor Authentication) for admins (US-04)
- [ ] Email verification on registration
- [ ] Session management UI
- [ ] Security event logging
- [ ] Apple OAuth support
- [ ] Email template customization UI
