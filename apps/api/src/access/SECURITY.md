# Security Review - Access Module

## Hallazgos Corregidos

### H10: JWT_SECRET con fallback inseguro ✅ CORREGIDO
**Estado anterior**: El secreto JWT tenía un fallback hardcodeado `'dev-secret-change-in-production'`

**Corrección aplicada**:
- La aplicación ahora lanza error fatal si `JWT_SECRET` no está definido
- Valida longitud mínima de 64 caracteres
- Sin fallback inseguro en producción

**Ubicación**: 
- `src/access/access.module.ts` líneas 17-32
- `src/access/strategies/jwt.strategy.ts` líneas 14-27

**Verificación**: 
```bash
# Sin JWT_SECRET, la aplicación no arranca
pnpm dev
# Error: JWT_SECRET is not defined. Set JWT_SECRET environment variable.

# Con JWT_SECRET corto
JWT_SECRET=short pnpm dev
# Error: JWT_SECRET must be at least 64 characters long for security.
```

---

### H11 & H13: Refresh tokens en texto claro ✅ CORREGIDO
**Estado anterior**: Los refresh tokens se guardaban en texto plano en la base de datos

**Corrección aplicada**:
- Los refresh tokens ahora se hashean con bcrypt (10 rounds) antes de guardar
- La comparación usa `bcrypt.compare()` que es timing-safe
- El token en claro solo se envía una vez al cliente (al crear la sesión)
- Si la base es comprometida, los tokens no son utilizables

**Ubicación**:
- `src/access/auth.service.ts` líneas 36-70 (logout con bcrypt)
- `src/access/auth.service.ts` líneas 147-184 (generateSession con hash)
- `src/access/entities/refresh-token.entity.ts` línea 11 (`token_hash`)
- `src/migrations/1727410000000-CreateAuthTables.ts` línea 102 (`token_hash` column)

**Verificación en base de datos**:
```sql
SELECT token_hash FROM refresh_tokens LIMIT 1;
-- Resultado esperado: $2b$10$abc... (hash bcrypt)
```

---

### H14: CORS no configurado ✅ CORREGIDO
**Estado anterior**: CORS aceptaba cualquier origen

**Corrección aplicada**:
- CORS configurado con lista explícita de orígenes permitidos
- Soporta múltiples orígenes desde variable de entorno `WEB_ORIGIN`
- Headers personalizados permitidos: `X-Refresh-Token`
- Credenciales habilitadas para cookies/auth

**Ubicación**: `src/main.ts` líneas 28-44

**Configuración**:
```bash
# .env
WEB_ORIGIN=http://localhost:3000,https://app.hy10.com
```

---

## Hallazgos Pendientes (Para próximos PRs)

### H2: Rate limiting en endpoints de auth
**Impacto**: Medio  
**Recomendación**: Implementar throttling en US-01 (login)
- 5 intentos de login por minuto por IP
- 10 intentos de refresh por minuto por cuenta

### H12: Rate limiting en logout
**Impacto**: Bajo (requiere token válido)  
**Recomendación**: Implementar en US-01
- 10 logout por minuto por cuenta

---

## Controles Actuales

| Control | Estado | Ubicación |
|---------|--------|-----------|
| JWT expiration | ✅ 15 min | `auth.service.ts:152` |
| Refresh token expiration | ✅ 2 días | `auth.service.ts:153` |
| Token rotation | ✅ | `auth.service.ts:120-145` |
| Token revocation | ✅ | `auth.service.ts:34-74` |
| Audit logging | ✅ | `auth.service.ts:63-73`, `102-116` |
| IP tracking | ✅ | `refresh_tokens.ip_address` |
| Timing-safe comparison | ✅ bcrypt | `auth.service.ts:48-51` |
| Token hashing | ✅ bcrypt 10 rounds | `auth.service.ts:169` |
| CORS whitelist | ✅ | `main.ts:28-44` |
| JWT secret validation | ✅ | `access.module.ts:17-32` |

---

## Flujo de Token Hasheado

```
1. Generación (auth.service.ts:167-178)
   - crypto.randomBytes(64) → token claro (128 chars hex)
   - bcrypt.hash(token, 10) → hash ($2b$10$...)
   - Guarda hash en DB
   - Devuelve token claro al cliente (única vez)

2. Validación (auth.service.ts:36-70)
   - Cliente envía token claro
   - Servicio lee todos los hashes no revocados
   - bcrypt.compare(token_claro, hash) para cada uno
   - Timing-safe: no revela cuántos tokens existen

3. Revocación (logout)
   - Marca is_revoked=true
   - Hash queda en DB pero inservible
```

---

## Generación de JWT_SECRET

```bash
# Generar secreto seguro de 64 caracteres (128 hex)
openssl rand -hex 64

# Ejemplo de salida:
# a1b2c3d4e5f6...128 caracteres totales

# Agregar a .env
echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env
```

---

## Ambiente de Producción

### Variables Requeridas
```bash
JWT_SECRET=<openssl-rand-hex-64>  # OBLIGATORIO, >= 64 chars
WEB_ORIGIN=https://app.hy10.com   # Dominio web permitido
NODE_ENV=production
```

### Checklist de Despliegue
- [ ] `JWT_SECRET` configurado en Railway/ambiente
- [ ] `JWT_SECRET` tiene >= 64 caracteres
- [ ] `WEB_ORIGIN` apunta al dominio correcto
- [ ] No hay fallbacks hardcodeados en el código
- [ ] CORS permite solo orígenes de confianza
- [ ] Base de datos usa TLS en producción
