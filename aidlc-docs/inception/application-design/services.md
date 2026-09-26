# Services — hy10

Los servicios orquestan componentes. No sustituyen las reglas de cada uno.

## SessionService

- **Responsibilities**: Login, refresh, logout y MFA del Admin.
- **Orchestration**: Access emite la sesión. Audit registra fallos repetidos, cambio de contraseña y cierre total. La clave no se escribe en el log.

## CatalogService

- **Responsibilities**: Mantener servicios y staff.
- **Orchestration**: Catalog persiste. Audit registra la desactivación. Agenda deja de ofrecer lo inactivo en el siguiente cálculo.

## AvailabilityService

- **Responsibilities**: Publicar huecos reales.
- **Orchestration**: Agenda lee horario del negocio, bloques, excepciones y reservas. Catalog filtra staff activo del servicio. El Agent solo repite esa lista.

## ClientBookingService

- **Responsibilities**: Reserva, cancelación y reprogramación del Cliente.
- **Orchestration**: TelegramGateway autentica el webhook con SecretStore. Si hay voz, SpeechTranscriber produce texto o un fallo. Agent pide confirmación y entonces Reservations muta. Notifications avisa al Cliente y, si corresponde, al Staff. Audit registra el cambio.

## DeskBookingService

- **Responsibilities**: Alta, no-show y cierre desde la web.
- **Orchestration**: WebApp llama a Reservations con el rol del actor. `markCompleted` llama a Billing para emitir la factura. `markNoShow` no llama a Billing. Audit registra el estado.

## BillingService

- **Responsibilities**: Cobrar el servicio prestado una sola vez.
- **Orchestration**: Billing congela el precio, pide a SecretStore la clave de Wompi y crea el checkout. El webhook verifica la firma con esa clave. Un evento repetido no cambia el monto. Notifications manda el enlace por TelegramGateway. La clave no se registra.

## TeamTelegramService

- **Responsibilities**: Vínculo, agenda del Staff y consultas del Admin.
- **Orchestration**: Access o Clients cierra el vínculo de un solo uso. Agent resuelve el rol con Clients y lee Agenda, Reservations o Catalog. No llama a `commitReservation` para esos roles.

## ReminderService

- **Responsibilities**: Aviso previo al turno del Staff.
- **Orchestration**: Un proceso interno recorre reservas vigentes y llama a Notifications. El texto sale de la reserva. SecretStore no participa. Si el Staff no vinculó Telegram, no hay envío.

## SettingsService

- **Responsibilities**: Guardar parámetros públicos del negocio y el token del bot.
- **Orchestration**: Settings guarda lo no secreto. El token viaja de la web al SecretStore y no se vuelve a leer hacia el navegador. Audit registra el cambio de configuración sin el token.

## Almacén de claves

No es un servicio de negocio aparte del SecretStore.

- Railway guarda la clave del modelo, las de Wompi, la clave maestra y el secreto del webhook.
- Postgres guarda el ciphertext del token del bot.
- Redis no guarda secretos.
- Azure Key Vault no entra.
- El webhook sin secreto configurado se rechaza.
