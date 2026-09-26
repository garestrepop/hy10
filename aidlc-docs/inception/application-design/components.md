# Components — hy10

Monolito modular en la API. La web es otro proceso. No hay `tenant_id`. El almacén de claves es el de la pregunta 1 del plan: variables de Railway para el despliegue, y el token del bot cifrado en Postgres.

## WebApp

- **Purpose**: Pantallas de Admin y Staff.
- **Responsibilities**: Login, catálogo, agenda, reservas, facturación (solo Admin), configuración, vínculo de Telegram. No muestra claves ni el token en claro después de guardarlo.
- **Interfaces**: HTTPS hacia la API `/api/v1`. No habla con Telegram, Wompi ni el modelo.

## Access

- **Purpose**: Cuentas del equipo e invitaciones.
- **Responsibilities**: Email y contraseña, Google, JWT de aplicación, refresh, logout, MFA del Admin, recuperación, invitación de Staff. Sin switch de negocio.
- **Interfaces**: Rutas `/api/v1/auth` y `/api/v1/invitations`.

## Catalog

- **Purpose**: Servicios, staff y la relación entre ambos.
- **Responsibilities**: Alta, edición, desactivación, precio en COP, asociación. Un inactivo no entra en reservas nuevas.
- **Interfaces**: `/api/v1/services`, `/api/v1/staff`.

## Agenda

- **Purpose**: Horario del negocio, bloques del staff y cálculo de huecos.
- **Responsibilities**: Rechazar bloques fuera del horario del negocio. Los huecos cruzan horario, excepciones, servicio y reservas. Es la única disponibilidad que puede decir el agente.
- **Interfaces**: `/api/v1/staff/:id/schedule`, `/api/v1/availability`.

## Reservations

- **Purpose**: Crear, cancelar, reprogramar, marcar prestada y marcar no-show.
- **Responsibilities**: Solape atómico por staff. Confirmación previa solo en el camino del agente. Alta web sin esa confirmación. No-show no factura. Política servicio sobre global.
- **Interfaces**: `/api/v1/appointments`.

## Clients

- **Purpose**: Persona de Telegram y vínculo del equipo.
- **Responsibilities**: Alta por `telegram_user_id` si no es un usuario interno. Un id vinculado a Admin o Staff no es Cliente. Opt-out con STOP o BAJA.
- **Interfaces**: Uso interno de la API y `/api/v1/clients` para el equipo.

## TelegramGateway

- **Purpose**: Entrada y salida del único bot.
- **Responsibilities**: Rechazar el webhook si falta o no coincide el secreto. Descargar la nota de voz. Enviar solo texto. No enruta por tenant.
- **Interfaces**: `POST /api/v1/webhooks/telegram`.

## Agent

- **Purpose**: Interpretar el texto ya resuelto y llamar tools.
- **Responsibilities**: No escribe la base. No inventa huecos. Pide confirmación antes de mutar una reserva del Cliente. Consultas de Staff y Admin son de lectura y con su alcance. Handoff si no puede resolver.
- **Interfaces**: Lo invoca TelegramGateway. Tools hacia Catalog, Agenda, Reservations, Clients y Billing.

## SpeechTranscriber

- **Purpose**: Pasar una nota de voz a texto.
- **Responsibilities**: Respetar `voice_note_max_seconds`. Si falla o se excede, no llama tools. La clave del transcriptor solo está en el entorno.
- **Interfaces**: La usa TelegramGateway antes del Agent.

## Billing

- **Purpose**: Factura interna del servicio prestado y el cobro Wompi.
- **Responsibilities**: Una factura vigente por reserva con precio congelado. Monto fijado por la API. Webhook idempotente. Anular solo si no está pagada. Id fiscal externo vacío.
- **Interfaces**: `/api/v1/invoices`, `POST /api/v1/webhooks/payments/wompi`.

## Settings

- **Purpose**: Parámetros no secretos del negocio.
- **Responsibilities**: Zona horaria, modelo (el id, no la clave), políticas, TTL, umbral de handoff, antelación del aviso, tope de la nota de voz, horario de atención.
- **Interfaces**: `/api/v1/settings`, solo Admin.

## SecretStore

- **Purpose**: Claves de la aplicación.
- **Responsibilities**: Leer del entorno de Railway la clave del modelo, las de Wompi, la clave maestra y el secreto del webhook. Cifrar y descifrar el token del bot en Postgres con AES-256-GCM. No guardar esas claves en Redis ni en el cliente. No devolver el token en claro a la web.
- **Interfaces**: Solo lo usan TelegramGateway, Agent, SpeechTranscriber y Billing, dentro del proceso de la API.

## Audit

- **Purpose**: Registro append-only.
- **Responsibilities**: Actor, antes y después, sin secretos ni audio. Consulta solo del Admin. Si no puede escribir, la operación de negocio no se deshace por eso.
- **Interfaces**: Escritura interna. `GET /api/v1/audit`.

## Notifications

- **Purpose**: Avisos de reserva, invitación, handoff y próximo turno.
- **Responsibilities**: El Cliente recibe texto por Telegram. El Staff vinculado recibe el aviso del turno y el de cancelación o reprogramación desde la reserva guardada, no desde el modelo. Opt-out corta los avisos proactivos al Cliente.
- **Interfaces**: La disparan Reservations, Access y Agent.
