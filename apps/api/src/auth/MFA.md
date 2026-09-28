# Multi-Factor Authentication (MFA) Implementation

## Overview

This implementation provides TOTP-based Multi-Factor Authentication for administrators in the hy10 system, as specified in User Story US-04.

## Features

- **Administrator-only**: MFA is available exclusively for users with the ADMIN role
- **TOTP-based**: Uses Time-based One-Time Passwords compatible with Google Authenticator, Authy, and similar apps
- **Login flow integration**: Works with both email/password and Google OAuth authentication
- **QR code setup**: Generates QR codes for easy authenticator app configuration

## API Endpoints

### 1. Setup MFA
**POST** `/auth/mfa/setup`

Initiates MFA setup for an authenticated administrator.

**Authentication**: Required (JWT Bearer token)

**Response**:
```json
{
  "secret": "BASE32_SECRET",
  "otpauth_url": "otpauth://totp/hy10:admin@example.com?secret=BASE32_SECRET&issuer=hy10",
  "qr_code": "data:image/png;base64,iVBORw0KG..."
}
```

**Steps**:
1. Admin calls this endpoint while authenticated
2. System generates a secret and stores it temporarily
3. Admin scans the QR code with their authenticator app
4. Proceed to enable endpoint with a verification code

### 2. Enable MFA
**POST** `/auth/mfa/enable`

Enables MFA after verifying the TOTP code from the authenticator app.

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response**:
```json
{
  "message": "MFA enabled successfully"
}
```

### 3. Disable MFA
**POST** `/auth/mfa/disable`

Disables MFA for the authenticated administrator.

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response**:
```json
{
  "message": "MFA disabled successfully"
}
```

### 4. Login (Modified)
**POST** `/auth/login`

Standard login endpoint now returns MFA challenge for admins with MFA enabled.

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

**Response (MFA Required)**:
```json
{
  "mfa_required": true,
  "mfa_token": "TEMPORARY_JWT_TOKEN",
  "email": "admin@example.com"
}
```

**Response (No MFA)**:
```json
{
  "access_token": "JWT_ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### 5. Verify MFA
**POST** `/auth/mfa/verify`

Completes the login process by verifying the TOTP code.

**Request Body**:
```json
{
  "mfa_token": "TEMPORARY_JWT_TOKEN",
  "code": "123456"
}
```

**Response**:
```json
{
  "access_token": "JWT_ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### 6. Google OAuth Callback (Modified)
**GET** `/auth/google/callback`

Google OAuth callback now redirects to MFA page for admins with MFA enabled.

**Redirect (MFA Required)**:
```
{WEB_ORIGIN}/auth/mfa?mfa_token=TEMPORARY_JWT_TOKEN
```

**Redirect (No MFA)**:
```
{WEB_ORIGIN}/auth/callback?access_token=JWT_ACCESS_TOKEN&refresh_token=REFRESH_TOKEN
```

## User Flow

### Scenario 1: Setting Up MFA (Administrator)

1. Admin logs in normally
2. Admin calls `POST /auth/mfa/setup`
3. Admin scans the QR code with Google Authenticator or similar app
4. Admin enters the 6-digit code from the app
5. Admin calls `POST /auth/mfa/enable` with the code
6. MFA is now active

### Scenario 2: Login with MFA Active

1. Admin enters email and password
2. System validates credentials
3. System returns `{ "mfa_required": true, "mfa_token": "..." }`
4. Admin opens authenticator app and gets current 6-digit code
5. Admin calls `POST /auth/mfa/verify` with the MFA token and code
6. System validates the code
7. System returns full authentication response with access/refresh tokens

### Scenario 3: Login with MFA Active (Google OAuth)

1. Admin clicks "Sign in with Google"
2. Google validates and redirects back to `/auth/google/callback`
3. System detects MFA is enabled
4. System redirects to `{WEB_ORIGIN}/auth/mfa?mfa_token=...`
5. Web app extracts MFA token and prompts for TOTP code
6. Admin enters 6-digit code
7. Web app calls `POST /auth/mfa/verify`
8. System returns full authentication response

### Scenario 4: Incorrect MFA Code

1. Admin attempts to verify with wrong code
2. System returns `401 Unauthorized: Invalid MFA code`
3. Session is not created
4. Admin must retry with correct code

## Security Features

- **Time-based codes**: TOTP codes expire every 30 seconds
- **Temporary MFA tokens**: MFA tokens expire after 5 minutes
- **Admin-only**: Only ADMIN role can enable MFA
- **No bypass**: MFA cannot be skipped once enabled
- **Secure storage**: MFA secrets are stored encrypted in the database
- **Rate limiting**: Login and MFA verification endpoints are rate-limited

## Database Schema

The `users` table already includes the necessary columns:

```sql
mfa_secret VARCHAR(255) NULL,
mfa_enabled BOOLEAN DEFAULT FALSE
```

## Dependencies

- **otplib**: TOTP generation and verification
- **qrcode**: QR code generation for setup

## Testing

Run the test suite:

```bash
cd apps/api
pnpm test mfa.spec.ts
```

## Compliance

This implementation satisfies:
- **User Story**: US-04 Segundo factor del Administrador
- **Requirements**: NFR-11 (Security)
- **Priority**: Must
- **Persona**: Administrador

### Gherkin Scenarios Covered

✅ **Escenario: MFA activo**
- When admin with MFA configured passes email/password or Google auth
- System requests second factor before delivering session

✅ **Escenario: Segundo factor incorrecto**
- When invalid MFA code is sent
- Session is not created (401 Unauthorized response)
