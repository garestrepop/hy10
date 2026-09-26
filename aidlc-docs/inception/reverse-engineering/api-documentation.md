# API Documentation — HiTurno

Prefijo global configurable (`API_PREFIX` en `main.ts`). Versionado URI `v1`. Abajo las rutas se escriben como `/v1/...`. Hay ValidationPipe y Helmet. Swagger cuelga de `{prefix}/docs`.

hy10 mantiene el estilo `/api/v1` y descarta toda ruta cuyo recurso sea un tenant o un plan.

## REST APIs

### Auth

- **Path base**: `/v1/auth`
- **Purpose**: Cuenta global y, en HiTurno, sesión de negocio.
- **Request / Response**: JSON. Google redirige.
- **Rutas**: `POST register`, `POST login`, `GET google`, `GET google/callback`, `POST refresh`, `POST switch-tenant/:tenantId`, `GET tenant-session`, `POST clear-tenant-session`, `POST logout`, `POST logout-all`, `POST verify-email`, `POST password-reset/request`, `POST password-reset/confirm`
- **hy10**: Se quedan register, login, Google, refresh, logout, logout-all, verify-email y password-reset. Salen switch-tenant y la sesión de tenant.

### Citas y disponibilidad

- **Path**: `/v1/appointments`, `/v1/availability`, `/v1/appointments/dashboard-stats`, `/v1/reports/summary`
- **Purpose**: Agenda.
- **Rutas de cita**: `GET`, `GET :id`, `POST`, `POST :id/confirm`, `POST :id/complete`, `POST :id/cancel`, `POST :id/no-show`, `POST :id/reschedule`
- **hy10**: Se heredan, sin filtrar por tenant. El no-show no genera la factura de hy10.

### Servicios, staff, horarios, clientes

- **Servicios**: `/v1/services` CRUD y `POST :id/staff/:staffId`, `DELETE :id/staff/:staffId`
- **Staff**: `/v1/staff` CRUD
- **Horarios**: `GET/PUT /v1/staff/:staffId/schedule`, excepciones `GET/POST` y `DELETE /v1/schedule/exceptions/:id`
- **Clientes**: `/v1/clients` CRUD
- **hy10**: Se heredan. El cliente se busca por `telegram_user_id`, no por teléfono obligatorio.

### Invitaciones y auditoría

- **Invitaciones**: `/v1/invitations` listar, crear, revocar, reenviar, ver token, aceptar
- **Auditoría**: `GET /v1/audit/me`
- **hy10**: Se heredan para el único negocio.

### Telegram

- **Method**: POST
- **Path**: `/v1/webhooks/telegram/:tenantId`
- **Purpose**: Mensaje entrante, texto o voz, enrutado al tenant del path.
- **hy10**: Un solo path de webhook, con secreto del bot, sin `:tenantId`.

### Billing de plataforma

- **Path**: `/v1/billing/*`, `/v1/tenants/:tenantId/billing/*`, `POST /v1/webhooks/payments/wompi`
- **Purpose**: Suscripción, tokens, facturas del SaaS y webhook Wompi.
- **hy10**: No se heredan subscribe, change-plan, cancel ni token-usage. El webhook de Wompi es el patrón para la factura del servicio prestado.

### Salud

- **Path**: `GET /health` (versión neutra)
- **hy10**: Se hereda, más un ready que compruebe Postgres, como pide el requisito de hy10.

### CRM, tenants, WhatsApp, soporte

- **Paths**: `/v1` de `crm-*`, `tenants`, `webhooks/whatsapp`, tickets de soporte
- **hy10**: No se heredan.

## Internal APIs

### LLMProvider

- **Methods**: interfaz en `ai-agent/providers/llm-provider.interface.ts`
- **Parameters**: el resolver elige proveedor y tier `fast` o `smart`
- **Return Types**: texto y tools
- **hy10**: Se conserva la interfaz. No se conservan el catálogo Anthropic/Gemini ni el tier. El Admin configura el modelo.

### SpeechToTextProvider

- **Methods**: transcribe, cliente ElevenLabs en `elevenlabs-speech-to-text.client.ts`
- **hy10**: Se conserva para la nota de voz. La respuesta del bot sigue en texto.

### Agent tools executor

- **Location**: `ai-agent/tools/agent-tools.executor.ts`
- **Purpose**: El agente no escribe la base por su cuenta.
- **hy10**: Se conserva. Las tools de staff y admin quedan de lectura, como en los requisitos.

## Data Models

Las columnas salen de las entidades TypeORM. Casi todas las de negocio incluyen `tenantId`. hy10 elimina esa columna.

### Account (`auth.accounts`)

- **Fields**: email, passwordHash, fullName, emailVerified, oauthProviders, campos de signup, platformRole
- **Relationships**: refresh tokens, verificaciones, resets, memberships
- **hy10**: Cuenta del equipo. Sin `platformRole` de SaaS y sin membership.

### Tenant y AccountTenantMembership

- **Fields**: subdomain, name, timezone, businessHours, canales WhatsApp y Telegram, owner
- **hy10**: No. El horario y la zona horaria pasan a la configuración del único negocio.

### Service, ServiceStaff, Staff, Schedule, ScheduleException

- **Fields**: nombre, duración, precio, moneda, activo, bloques por weekday, excepciones por fecha
- **hy10**: Se heredan sin tenant. El precio en COP alimenta la factura de hy10.

### Client

- **Fields**: name, phone, email, notes, optedOut, phoneVerifiedAt, telegramUserId, accountId opcional
- **hy10**: `telegramUserId` es la identidad. El teléfono no es obligatorio ni exige OTP.

### Appointment

- **Fields**: serviceId, staffId, clientId, scheduledAt, durationMin, status, source, notes, cancelledBy, completedAt, cancelledAt
- **hy10**: Se hereda. Estados útiles: confirmada, cancelada, prestada, no-show.

### Invitation, AuditLog, LlmInvocation

- **hy10**: Invitación y auditoría sí. La traza del LLM se queda sin `tenantId` y sin tier obligatorio.

### Subscription, Invoice de plataforma, PaymentAttempt, BillingPricingConfig

- **Fields**: tokens, ciclo, monto del plan, intento de pago
- **hy10**: No son el modelo de la factura al cliente. hy10 tiene su propia factura por reserva prestada.
