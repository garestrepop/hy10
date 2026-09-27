# Manual Testing Guide for US-01 Authentication

This guide provides step-by-step instructions to manually test the authentication system.

## Prerequisites

1. PostgreSQL database running (use docker-compose or local)
2. Environment variables configured (see .env.example)

## Start the Services

```bash
# Start PostgreSQL with docker-compose
docker-compose up -d postgres

# Install dependencies
pnpm install

# Run migrations
cd apps/api
pnpm migration:run

# Start the API
pnpm dev
```

The API will be available at: http://localhost:3001

## Test Scenarios

### 1. User Registration (Email/Password)

**Endpoint:** `POST /api/v1/auth/register`

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hy10.com",
    "password": "SecurePass123!",
    "first_name": "Admin",
    "last_name": "User"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "a1b2c3...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "admin@hy10.com",
    "role": "staff",
    "first_name": "Admin",
    "last_name": "User"
  }
}
```

### 2. Login with Email/Password

**Endpoint:** `POST /api/v1/auth/login`

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hy10.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:** Same as registration

### 3. Test Password Validation

#### 3.1. Short Password (< 8 characters)

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hy10.com",
    "password": "Short1"
  }'
```

**Expected:** 400 Bad Request - "Password must be at least 8 characters"

#### 3.2. Weak/Leaked Password

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@hy10.com",
    "password": "password"
  }'
```

**Expected:** 400 Bad Request - "Password is too common and may be compromised"

### 4. Failed Login Attempts & Account Lockout

Try logging in with wrong password 5 times:

```bash
# Attempt 1-5
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hy10.com",
    "password": "WrongPassword123"
  }'
```

**After 5 failed attempts:**
- Account should be locked for 15 minutes
- Response: 401 Unauthorized - "Account is temporarily locked. Try again in X minutes."

### 5. Get Current User (Protected Route)

```bash
# Replace YOUR_ACCESS_TOKEN with the token from login/register
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "userId": "uuid",
  "email": "admin@hy10.com",
  "role": "staff"
}
```

### 6. Token Refresh

```bash
# Replace YOUR_REFRESH_TOKEN with the refresh token from login
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected:** New access_token and refresh_token (old refresh token is revoked)

### 7. Logout (Single Device)

```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected:** 204 No Content

**Verify:** Try using the refresh token - should fail with 401

### 8. Logout All Devices

```bash
# Login from multiple devices (run login 2-3 times to get multiple refresh tokens)
# Then logout from all:

curl -X POST http://localhost:3001/api/v1/auth/logout-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** 204 No Content

**Verify:** All refresh tokens should be revoked

### 9. Password Reset Flow

#### 9.1. Request Password Reset

```bash
curl -X POST http://localhost:3001/api/v1/auth/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hy10.com"
  }'
```

**Expected:** 200 OK with generic message (even if email doesn't exist)

**Note:** In production, this would send an email. For testing, check the database:

```sql
SELECT token, expires_at FROM password_reset_tokens 
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@hy10.com')
ORDER BY created_at DESC LIMIT 1;
```

#### 9.2. Confirm Password Reset

```bash
# Replace TOKEN with the token from database
curl -X POST http://localhost:3001/api/v1/auth/password-reset/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_DATABASE",
    "new_password": "NewSecurePass456!"
  }'
```

**Expected:** 200 OK - "Password reset successful"

**Verify:** 
1. Login with new password should work
2. All previous sessions should be revoked

### 10. Google OAuth (Manual Browser Test)

1. Navigate to: http://localhost:3001/api/v1/auth/google
2. Choose Google account
3. Should redirect to: http://localhost:3000/auth/callback?access_token=...&refresh_token=...

**Note:** Requires valid Google OAuth credentials in .env

### 11. Rate Limiting Test

#### 11.1. Login Rate Limit (5 requests per minute)

```bash
# Run this 6 times quickly:
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@hy10.com", "password": "SecurePass123!"}'
done
```

**Expected:** First 5 succeed, 6th returns 429 Too Many Requests

#### 11.2. Password Reset Rate Limit (3 requests per 5 minutes)

```bash
# Run this 4 times:
for i in {1..4}; do
  curl -X POST http://localhost:3001/api/v1/auth/password-reset/request \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@hy10.com"}'
done
```

**Expected:** First 3 succeed, 4th returns 429 Too Many Requests

## API Documentation

Interactive API documentation available at:
- Swagger UI: http://localhost:3001/api/docs

## Database Verification

Connect to the database and verify:

```sql
-- View users
SELECT id, email, role, auth_provider, is_active, 
       failed_login_attempts, locked_until, created_at 
FROM users;

-- View active refresh tokens
SELECT rt.id, u.email, rt.expires_at, rt.is_revoked, rt.device_info
FROM refresh_tokens rt
JOIN users u ON rt.user_id = u.id
WHERE rt.is_revoked = false;

-- View password reset tokens
SELECT prt.token, u.email, prt.expires_at, prt.is_used
FROM password_reset_tokens prt
JOIN users u ON prt.user_id = u.id
WHERE prt.is_used = false;
```

## Security Verification Checklist

- [ ] Password minimum 8 characters enforced
- [ ] Weak passwords rejected
- [ ] Account locks after 5 failed attempts
- [ ] JWT tokens validate correctly
- [ ] Refresh tokens rotate on use
- [ ] Logout invalidates tokens
- [ ] Protected routes require authentication
- [ ] Role-based access control works
- [ ] Generic error messages (no email disclosure)
- [ ] Rate limiting active on sensitive endpoints
- [ ] Google OAuth prevents duplicate accounts
- [ ] Password reset tokens one-time use
- [ ] Password reset tokens expire after 1 hour

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres
```

### Migration Issues
```bash
# Check migration status
pnpm migration:show

# Revert last migration
pnpm migration:revert

# Re-run migrations
pnpm migration:run
```

### Token Validation Issues
- Verify JWT_SECRET is set in .env
- Check token hasn't expired (access token = 15min)
- Verify Bearer prefix in Authorization header

### Google OAuth Issues
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
- Check callback URL matches Google Console configuration
- Ensure redirect URI is whitelisted in Google Console
