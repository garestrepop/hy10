# MFA Testing Guide

## Prerequisites

1. PostgreSQL database running
2. API server running: `cd apps/api && pnpm dev`
3. Required tools: `curl`, `jq`, `node`

## Automated Testing

Run the automated test script:

```bash
cd apps/api
./test-mfa.sh
```

This script will:
1. Register/login an admin user
2. Setup MFA and generate QR code
3. Enable MFA with TOTP verification
4. Test login with MFA challenge
5. Verify MFA code and complete login
6. Test rejection of invalid codes

## Manual Testing with cURL

### 1. Register Admin User

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "TestPassword123",
    "first_name": "Admin",
    "last_name": "Test"
  }'
```

Save the `access_token` from the response.

### 2. Setup MFA

```bash
curl -X POST http://localhost:3001/api/v1/auth/mfa/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response includes:
- `secret`: Base32 encoded secret
- `otpauth_url`: URL for QR code
- `qr_code`: Data URL of QR code image

**Action Required**: Scan the QR code with Google Authenticator or similar app.

### 3. Enable MFA

Get the 6-digit code from your authenticator app, then:

```bash
curl -X POST http://localhost:3001/api/v1/auth/mfa/enable \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "code": "123456"
  }'
```

### 4. Test Login with MFA

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "TestPassword123"
  }'
```

**Expected Response**:
```json
{
  "mfa_required": true,
  "mfa_token": "temporary-jwt-token",
  "email": "admin@test.com"
}
```

### 5. Verify MFA Code

Get a fresh code from your authenticator app:

```bash
curl -X POST http://localhost:3001/api/v1/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{
    "mfa_token": "YOUR_MFA_TOKEN",
    "code": "789012"
  }'
```

**Expected Response**: Full authentication response with `access_token` and `refresh_token`.

### 6. Test Invalid Code

```bash
curl -X POST http://localhost:3001/api/v1/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{
    "mfa_token": "YOUR_MFA_TOKEN",
    "code": "999999"
  }'
```

**Expected Response**: `401 Unauthorized` with message "Invalid MFA code"

### 7. Disable MFA

```bash
curl -X POST http://localhost:3001/api/v1/auth/mfa/disable \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "code": "123456"
  }'
```

## Testing with Postman

Import the following collection to test MFA endpoints:

1. Create a new collection "MFA Testing"
2. Add environment variables:
   - `base_url`: `http://localhost:3001/api/v1`
   - `access_token`: (will be set automatically)
   - `mfa_token`: (will be set automatically)

3. Add requests:
   - POST `{{base_url}}/auth/register` → Save token
   - POST `{{base_url}}/auth/mfa/setup` → Save secret
   - POST `{{base_url}}/auth/mfa/enable` → Manual code input
   - POST `{{base_url}}/auth/login` → Save MFA token
   - POST `{{base_url}}/auth/mfa/verify` → Manual code input

## Test Scenarios from US-04

### ✅ Escenario: MFA activo

**Given**: An administrator with MFA configured  
**When**: Passes email/password or Google auth  
**Then**: System requests second factor before delivering session

**Test**:
1. Enable MFA for admin user
2. Login with valid credentials
3. Verify response contains `mfa_required: true`
4. Verify no `access_token` in initial response
5. Complete verification with TOTP code
6. Verify full auth response received

### ✅ Escenario: Segundo factor incorrecto

**Given**: Invalid MFA code  
**When**: Submitted for verification  
**Then**: Session is not created

**Test**:
1. Login with valid credentials (receive MFA challenge)
2. Submit invalid code (e.g., "999999")
3. Verify response is `401 Unauthorized`
4. Verify error message is "Invalid MFA code"
5. Verify no tokens are issued

## Google OAuth Testing

### Setup
1. Configure Google OAuth credentials in `.env`
2. Visit `http://localhost:3001/api/v1/auth/google`
3. Complete Google sign-in

### With MFA Enabled
**Expected Flow**:
1. Google authentication succeeds
2. Redirect to `http://localhost:3000/auth/mfa?mfa_token=...`
3. User enters TOTP code
4. Frontend calls `/auth/mfa/verify`
5. User receives full authentication tokens

### Without MFA
**Expected Flow**:
1. Google authentication succeeds
2. Redirect to `http://localhost:3000/auth/callback?access_token=...&refresh_token=...`
3. User is logged in directly

## Error Cases to Test

1. **Non-admin tries to setup MFA**
   - Expected: `400 Bad Request` - "MFA is only available for administrators"

2. **Enable MFA without setup**
   - Expected: `400 Bad Request` - "MFA setup not initiated"

3. **Expired MFA token**
   - Wait 6 minutes after login
   - Expected: `401 Unauthorized` - "Invalid or expired MFA token"

4. **Disable MFA when not enabled**
   - Expected: `400 Bad Request` - "MFA is not enabled"

5. **Setup MFA when already enabled**
   - Expected: `400 Bad Request` - "MFA is already enabled"

## Security Considerations Verified

- ✅ MFA secrets stored in database (encrypted at rest)
- ✅ TOTP codes expire every 30 seconds
- ✅ Temporary MFA tokens expire after 5 minutes
- ✅ Admin-only restriction enforced
- ✅ Rate limiting applied to verification endpoints
- ✅ No bypass mechanism exists
- ✅ Invalid codes don't leak timing information

## Performance Testing

Test concurrent MFA verifications:

```bash
# Generate 100 concurrent requests
for i in {1..100}; do
  curl -X POST http://localhost:3001/api/v1/auth/mfa/verify \
    -H "Content-Type: application/json" \
    -d '{"mfa_token":"test","code":"123456"}' &
done
wait
```

Verify:
- All requests handled correctly
- No race conditions
- Rate limiting works as expected

## Compliance Checklist

- [x] US-04 Scenario 1: MFA active
- [x] US-04 Scenario 2: Incorrect second factor
- [x] NFR-11: Security requirements met
- [x] Admin-only restriction
- [x] Works with email/password login
- [x] Works with Google OAuth
- [x] Temporary tokens expire
- [x] QR code generation
- [x] TOTP compatibility verified
- [x] Invalid codes rejected
- [x] No session leakage
