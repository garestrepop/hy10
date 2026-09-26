# Component Methods — hy10

Firmas de alto nivel. Las reglas finas quedan para el diseño funcional de cada unidad. Los tipos son lógicos, no un contrato de código.

## Access

- `register(email, password) -> Account`
- `login(email, password) -> Session`
- `startGoogleLogin() -> Redirect`
- `completeGoogleLogin(code) -> Session`
- `refresh(refreshToken) -> Session`
- `logout(sessionId) -> void`
- `logoutAll(accountId) -> void`
- `requestPasswordReset(email) -> void`
- `confirmPasswordReset(token, newPassword) -> void`
- `verifyAdminMfa(accountId, code) -> Session`
- `inviteStaff(actor, email) -> Invitation`
- `acceptInvitation(token, credentials) -> Account`

`Session` es un JWT de aplicación. No hay token de tenant.

## Catalog

- `createService(actor, input) -> Service`
- `updateService(actor, serviceId, patch) -> Service`
- `deactivateService(actor, serviceId) -> Service`
- `listServices(actor, onlyActive) -> Service[]`
- `registerStaff(actor, input) -> Staff`
- `setStaffActive(actor, staffId, active) -> Staff`
- `assignStaffToService(actor, serviceId, staffId) -> void`
- `listStaffForService(serviceId) -> Staff[]`

## Agenda

- `setBusinessHours(actor, hours) -> BusinessHours`
- `replaceStaffSchedule(actor, staffId, blocks) -> Schedule`
- `addException(actor, staffId, exception) -> Exception`
- `getAvailability(serviceId, date, staffId?) -> Slot[]`

`getAvailability` devuelve solo huecos reales. La auto-asignación elige el primero de esa lista entre el staff del servicio.

## Reservations

- `createFromWeb(actor, command) -> Reservation`
- `createFromClient(clientId, command) -> Reservation`
- `cancel(actorOrClient, reservationId) -> Reservation`
- `reschedule(actorOrClient, reservationId, newStart) -> Reservation`
- `markCompleted(actor, reservationId) -> Reservation`
- `markNoShow(actor, reservationId) -> Reservation`
- `list(actor, filter) -> Reservation[]`
- `get(actor, reservationId) -> Reservation`

`createFromClient` solo corre después de la confirmación explícita. `markCompleted` y `markNoShow` no existen en Telegram.

## Clients

- `findOrCreateByTelegram(telegramUserId, displayName) -> Client`
- `resolveActor(telegramUserId) -> Client | Staff | Admin | Unknown`
- `linkTelegram(actor, oneTimeCode) -> void`
- `setOptOut(clientId, optedOut) -> Client`

## TelegramGateway

- `handleWebhook(headers, body) -> void`
- `sendText(telegramUserId, text) -> void`
- `downloadVoice(fileId) -> Audio`

`handleWebhook` compara el secreto con comparación de tiempo constante. Si la variable no está o no coincide, rechaza. No hay camino que acepte el webhook sin secreto.

## SpeechTranscriber

- `transcribe(audio) -> Text | TranscriptionFailed`

Si el audio supera `voice_note_max_seconds` o la transcripción falla, el resultado es `TranscriptionFailed` y nadie llama tools.

## Agent

- `handleTurn(actor, text) -> Reply`
- `listServiceNames() -> ServiceSummary[]`
- `quoteSlots(serviceId, staffChoice) -> Slot[]`
- `commitReservation(clientId, draft) -> Reservation`
- `commitCancel(clientId, reservationId) -> Reservation`
- `commitReschedule(clientId, reservationId, newStart) -> Reservation`
- `readStaffAgenda(staffId) -> Reservation[]`
- `readOperations(adminId) -> OperationsSnapshot`
- `requestPaymentLink(clientId, invoiceId) -> CheckoutLink`
- `escalate(conversationId, reason) -> void`

Las lecturas de Staff y Admin no mutan reservas.

## Billing

- `issueForCompletedReservation(reservationId) -> Invoice | None`
- `createCheckout(invoiceId) -> CheckoutLink`
- `applyProviderEvent(signedEvent) -> Invoice`
- `voidUnpaid(actor, invoiceId) -> Invoice`
- `list(actor, filter) -> Invoice[]`
- `resendLink(actor, invoiceId) -> void`

`issueForCompletedReservation` no crea factura si el precio es cero o el estado es no-show. `applyProviderEvent` exige firma, monto igual y es idempotente.

## Settings

- `get() -> Settings`
- `update(actor, patch) -> Settings`

`Settings` no incluye claves. El identificador de modelo es un texto. La clave del modelo no entra a este método.

## SecretStore

- `requireWebhookSecret() -> Secret`
- `requireMasterKey() -> Secret`
- `requireProviderKey(name) -> Secret`
- `saveBotToken(plaintext) -> void`
- `readBotToken() -> Secret | Missing`

`requireWebhookSecret` falla si la variable está vacía. `saveBotToken` cifra con AES-256-GCM y persiste solo el ciphertext. `readBotToken` descifra en memoria del API. Ningún método devuelve secretos a la web.

## Audit

- `record(event) -> void`
- `query(actor, filter) -> AuditPage`

`record` omite contraseñas, tokens, audio y datos de tarjeta. `query` es solo del Admin.

## Notifications

- `reservationChanged(reservation, kind) -> void`
- `staffUpcoming(reservation) -> void`
- `invitationEmail(invitation) -> void`
- `handoff(conversation) -> void`

Si el Cliente está en opt-out, no sale el aviso proactivo. El aviso al Staff sale de la reserva guardada.
