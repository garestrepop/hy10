# Staff Invitation API - US-05

Implementation of user story US-05: "Invitar a un Staff"

## Overview

This feature allows Administrators to invite staff members via email without sharing passwords. It implements a secure, token-based invitation system with the following requirements:

- **Single-use tokens** valid for 7 days
- Support for **new users** (creates Staff account)
- Support for **existing users** (assigns Staff role)
- **Admin-only** invitation creation
- Proper validation for expired, used, or invalid tokens

## API Endpoints

### 1. Create Staff Invitation (Admin Only)

**Endpoint:** `POST /auth/invite-staff`

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "email": "newstaff@example.com"
}
```

**Response (201 Created):**
```json
{
  "token": "abc123def456...",
  "email": "newstaff@example.com",
  "expires_at": "2026-10-05T15:26:00.000Z",
  "invited_by_email": "admin@example.com"
}
```

**Error Responses:**
- `400 Bad Request` - User already has Staff role
- `401 Unauthorized` - Not authenticated or not an Admin
- `409 Conflict` - Invalid email format

**Example cURL:**
```bash
curl -X POST http://localhost:3001/auth/invite-staff \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "newstaff@example.com"}'
```

---

### 2. Get Invitation Information

**Endpoint:** `GET /auth/invitation/:token`

**Authentication:** Not required

**Response (200 OK):**
```json
{
  "email": "newstaff@example.com",
  "email_exists": false,
  "expires_at": "2026-10-05T15:26:00.000Z",
  "is_expired": false,
  "is_used": false
}
```

**Error Responses:**
- `400 Bad Request` - Invalid token

**Example cURL:**
```bash
curl http://localhost:3001/auth/invitation/abc123def456...
```

---

### 3. Accept Staff Invitation

**Endpoint:** `POST /auth/accept-invitation`

**Authentication:** Optional (required if user already has an account)

**Request Body (New User):**
```json
{
  "token": "abc123def456...",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Request Body (Existing User):**
```json
{
  "token": "abc123def456..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4e5f6...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "user-uuid",
    "email": "newstaff@example.com",
    "role": "staff",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid, expired, or used token; missing password for new user
- `401 Unauthorized` - Wrong account trying to accept invitation for existing email

**Example cURL (New User):**
```bash
curl -X POST http://localhost:3001/auth/accept-invitation \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456...",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

**Example cURL (Existing User):**
```bash
curl -X POST http://localhost:3001/auth/accept-invitation \
  -H "Authorization: Bearer USER_EXISTING_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "abc123def456..."}'
```

---

## Scenarios (from US-05)

### Escenario 1: Email nuevo
**Given:** Admin invites an email without an account  
**When:** Invitation is accepted with password  
**Then:** New account is created with Staff role

### Escenario 2: Email que ya tiene cuenta
**Given:** Email already has an account  
**When:** User logs in and accepts invitation  
**Then:** User's role becomes Staff (no account duplication)

### Escenario 3: Token vencido, usado o ajeno
**Given:** Expired, used, or unauthorized token  
**When:** Attempting to accept or create  
**Then:** Staff role is not assigned

---

## Database Schema

### Table: staff_invitations

| Column           | Type      | Description                           |
|------------------|-----------|---------------------------------------|
| id               | uuid      | Primary key                           |
| email            | varchar   | Email address invited                 |
| token            | varchar   | Unique invitation token (indexed)     |
| invited_by       | uuid      | Foreign key to users (admin)          |
| expires_at       | timestamp | Expiry date (7 days from creation)    |
| is_used          | boolean   | Whether token has been used           |
| used_at          | timestamp | When token was used (nullable)        |
| created_user_id  | uuid      | FK to created user (nullable)         |
| created_at       | timestamp | Creation timestamp                    |

---

## Security Considerations

1. **Token Generation:** Uses crypto.randomBytes(32) for secure random tokens
2. **Single Use:** Tokens are marked as used after acceptance
3. **Time-Limited:** 7-day expiry enforced
4. **Admin-Only Creation:** Only users with Admin role can create invitations
5. **Account Matching:** Existing users must be logged in with matching email
6. **Password Policy:** Same validation as registration (min 8 chars, no leaked passwords)

---

## Testing Checklist

### Manual Testing Steps

1. **Setup:**
   - Run database migration
   - Create an admin user
   - Get admin JWT token

2. **Test New User Invitation:**
   ```bash
   # 1. Admin creates invitation
   curl -X POST http://localhost:3001/auth/invite-staff \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"email": "newstaff@example.com"}'
   
   # 2. Get invitation info (verify it's valid)
   curl http://localhost:3001/auth/invitation/TOKEN_FROM_STEP_1
   
   # 3. Accept invitation (creates new user)
   curl -X POST http://localhost:3001/auth/accept-invitation \
     -H "Content-Type: application/json" \
     -d '{
       "token": "TOKEN_FROM_STEP_1",
       "password": "SecurePass123!",
       "first_name": "New",
       "last_name": "Staff"
     }'
   
   # 4. Verify user can login
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "newstaff@example.com", "password": "SecurePass123!"}'
   ```

3. **Test Existing User Invitation:**
   ```bash
   # 1. Create a regular user first (or use existing)
   # 2. Admin creates invitation for that email
   # 3. User logs in and accepts invitation
   # 4. Verify user now has Staff role
   ```

4. **Test Validations:**
   ```bash
   # Test expired token (wait 7 days or modify database)
   # Test used token (accept twice)
   # Test invalid token
   # Test non-admin creating invitation
   # Test wrong user accepting invitation
   ```

---

## Migration

To apply the database changes:

```bash
cd apps/api
pnpm run migration:run
```

To rollback:

```bash
cd apps/api
pnpm run migration:revert
```

---

## Related Files

- **Migration:** `apps/api/src/migrations/1727403600000-CreateStaffInvitationsTable.ts`
- **Entity:** `apps/api/src/auth/entities/staff-invitation.entity.ts`
- **DTOs:** 
  - `apps/api/src/auth/dto/create-staff-invitation.dto.ts`
  - `apps/api/src/auth/dto/accept-staff-invitation.dto.ts`
  - `apps/api/src/auth/dto/staff-invitation-response.dto.ts`
- **Service:** `apps/api/src/auth/auth.service.ts` (methods: `createStaffInvitation`, `getInvitationInfo`, `acceptStaffInvitation`)
- **Controller:** `apps/api/src/auth/auth.controller.ts` (endpoints: `/invite-staff`, `/invitation/:token`, `/accept-invitation`)
- **Tests:** `apps/api/src/auth/auth.service.spec.ts`

---

## Next Steps (Future Enhancements)

1. Email notification service integration
2. Invitation revocation endpoint
3. List all pending invitations (Admin)
4. Invitation history/audit trail
5. Resend invitation functionality
6. Custom expiry periods
