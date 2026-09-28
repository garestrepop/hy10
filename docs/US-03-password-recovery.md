# US-03: Recuperar la contraseña - Implementation

**Linear Issue**: [HY1-26](https://linear.app/hy10/issue/HY1-26)  
**Status**: ✅ Complete  
**Date**: 2026-09-28

## User Story

Como miembro del equipo quiero un enlace de un solo uso por email para volver a entrar si olvidé la contraseña.

**Prioridad**: Must  
**Personas**: Administrador, Staff  
**Requisitos**: FR-07, NFR-11, NFR-13

## Scenarios Covered

### ✅ Escenario: Enlace vigente
- ✅ Dado una cuenta con ese email
- ✅ Cuando pide recuperar la contraseña y abre el enlace antes de que expire
- ✅ Entonces puede guardar una contraseña nueva que cumple la política
- ✅ Y el enlace no sirve una segunda vez

### ✅ Escenario: Enlace vencido o repetido
- ✅ Dado un enlace expirado o ya usado
- ✅ Cuando lo abre
- ✅ Entonces la contraseña no cambia
- ✅ Y el mensaje es genérico

## Implementation Details

### Files Created/Modified

**New Files:**
- `apps/api/src/email/email.module.ts` - Email module configuration
- `apps/api/src/email/email.service.ts` - Email service implementation
- `apps/api/src/email/email.service.spec.ts` - Email service tests
- `apps/api/src/email/templates/password-reset.hbs` - Password reset email template
- `apps/api/src/email/templates/welcome.hbs` - Welcome email template
- `docs/US-03-password-recovery.md` - This documentation

**Modified Files:**
- `apps/api/src/auth/auth.service.ts` - Added email sending to password reset
- `apps/api/src/auth/auth.module.ts` - Imported EmailModule
- `apps/api/src/app.module.ts` - Added EmailModule to global imports
- `apps/api/.env.example` - Added email configuration
- `apps/api/src/auth/README.md` - Updated documentation
- `apps/api/package.json` - Added email dependencies

### Database Schema

Uses existing `password_reset_tokens` table:
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token VARCHAR UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### POST `/api/v1/auth/password-reset/request`
Request a password reset link.

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

**Security Features:**
- Rate limited: 3 requests per 5 minutes
- Generic response (doesn't reveal if email exists)
- Email only sent if account exists
- Old tokens automatically deleted

#### POST `/api/v1/auth/password-reset/confirm`
Reset password using the token from email.

**Request:**
```json
{
  "token": "abc123...",
  "new_password": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

**Validations:**
- Token must be valid and not expired (1 hour)
- Token must not have been used before
- Password must be at least 8 characters
- Password must not be in common leaked passwords list
- All existing sessions are revoked after reset

## Email Configuration

### Environment Variables

```env
# SMTP Configuration
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_SECURE=false
MAIL_USER=your-mailtrap-user
MAIL_PASSWORD=your-mailtrap-password
MAIL_FROM=noreply@hy10.app
```

### Development Setup

For development, use [Mailtrap](https://mailtrap.io):
1. Create a free Mailtrap account
2. Get SMTP credentials from your inbox
3. Add to `.env` file
4. All emails will be captured safely without sending real messages

### Production Setup

Recommended email providers:
- **SendGrid**: Reliable, good free tier (100 emails/day)
- **AWS SES**: Cost-effective, requires AWS account
- **Postmark**: Excellent deliverability
- **Mailgun**: Good for high volume

## Security Features

### Token Security
- ✅ Cryptographically secure random token (32 bytes)
- ✅ Single-use enforcement (`is_used` flag)
- ✅ 1-hour expiration
- ✅ Old tokens deleted when new request made
- ✅ Generic error messages

### Password Policy
- ✅ Minimum 8 characters
- ✅ Check against common leaked passwords
- ✅ Secure bcrypt hashing (10 rounds)

### Rate Limiting
- ✅ 3 requests per 5 minutes per IP
- ✅ Prevents brute force attacks

### Session Management
- ✅ All refresh tokens revoked after password reset
- ✅ User must log in again with new password

## Email Template

The password reset email includes:
- Clear subject line in Spanish
- Responsive HTML design
- Prominent call-to-action button
- Plain text link as fallback
- Expiration warning (1 hour)
- Security notice if not requested
- Professional branding

Template language: Spanish (system language)

## Testing

### Unit Tests
```bash
cd apps/api
pnpm test email.service.spec.ts
```

**Coverage**: 8 test cases
- ✅ Email service initialization
- ✅ Password reset email with correct parameters
- ✅ Success logging
- ✅ Error handling and logging
- ✅ Custom WEB_ORIGIN configuration
- ✅ Welcome email sending
- ✅ Non-critical error handling

### Manual Testing

1. **Request password reset**:
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/password-reset/request \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@hy10.app"}'
   ```

2. **Check Mailtrap inbox** for email

3. **Copy token** from email link

4. **Reset password**:
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/password-reset/confirm \
     -H "Content-Type: application/json" \
     -d '{"token":"TOKEN_HERE","new_password":"NewSecure123!"}'
   ```

5. **Verify**:
   - Can login with new password
   - Cannot reuse the same token
   - Old sessions are invalidated

### Integration Test Scenarios

✅ Valid token, valid password → Success  
✅ Expired token → Error  
✅ Used token → Error  
✅ Invalid token → Error  
✅ Weak password → Error  
✅ Non-existent email → Silent success (security)  
✅ Rate limit exceeded → Error (429)  

## Dependencies Added

```json
{
  "dependencies": {
    "@nestjs-modules/mailer": "^2.3.7",
    "nodemailer": "^10.0.12",
    "handlebars": "^4.7.9"
  },
  "devDependencies": {
    "@types/nodemailer": "^8.0.2"
  }
}
```

## Compliance

### FR-07: Password Recovery
✅ Email-based password reset  
✅ Secure token generation  
✅ Token expiration  
✅ Single-use tokens  

### NFR-11: Security
✅ Secure token generation (crypto.randomBytes)  
✅ Rate limiting  
✅ Generic error messages  
✅ Session revocation  
✅ Password policy enforcement  

### NFR-13: Data Protection
✅ No password in logs  
✅ No password in email  
✅ Tokens stored securely  
✅ HTTPS enforced in production  

## Future Enhancements

- [ ] Email template customization UI
- [ ] HTML and plain text versions
- [ ] Internationalization (i18n) support
- [ ] Custom expiration times per business settings
- [ ] Email delivery status tracking
- [ ] Retry logic for failed emails
- [ ] Email verification on registration
- [ ] Password changed notification email

## References

- [NestJS Mailer Documentation](https://nest-modules.github.io/mailer/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [OWASP Password Reset Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
