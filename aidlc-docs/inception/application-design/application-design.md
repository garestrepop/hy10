# Application Design — hy10

Resumen del diseño de aplicación. El detalle está en `components.md`, `component-methods.md`, `services.md` y `component-dependency.md`.

## Decisiones de este diseño

- Monolito modular con los límites de HiTurno que sí aplican: acceso, catálogo, agenda, reservas, clientes, Telegram, agente, facturación, auditoría y configuración.
- La web es un proceso aparte y no guarda claves.
- No hay tenant, Redis de secretos ni Azure Key Vault.
- Claves de despliegue en Railway: modelo, Wompi, clave maestra y secreto del webhook.
- Token del bot: AES-256-GCM, ciphertext en Postgres, lectura solo dentro de la API.
- Webhook sin secreto: se rechaza.

## Capacidades y componentes

| Capacidad | Componentes |
|-----------|-------------|
| Entrar y invitar Staff | WebApp, Access |
| Catálogo y agenda | Catalog, Agenda |
| Reservar por Telegram | TelegramGateway, SpeechTranscriber, Agent, Reservations |
| Consultar por Telegram siendo Staff o Admin | Agent, Agenda, Reservations, Catalog |
| Cobrar el servicio prestado | Billing, SecretStore, Notifications |
| Configurar el negocio y el bot | Settings, SecretStore |
| Saber quién cambió qué | Audit |

## Fuera de este diseño

Pantallas copiadas de HiTurno, WhatsApp, planes, tokens de suscripción, cambio de negocio y respuesta del bot en audio.
