# Application Design Plan — hy10

## Objetivo

Identificar componentes, métodos de alto nivel, servicios y dependencias del CRM de un solo negocio. La lógica detallada queda para un ciclo de construcción.

El diseño hereda el monolito modular de HiTurno y los requisitos ya aprobados. Esta parte fija el almacén de claves, que no puede copiarse tal cual.

## Revisión del vault de HiTurno

No hay Azure Key Vault ni un servicio de bóveda de nube en el código leído.

El token del bot se guarda así:

1. `TenantTelegramCredentialsVaultService` cifra el token con AES-256-GCM (`tenant-secret-cipher.util.ts`).
2. La clave maestra sale de la variable `TENANT_SECRETS_ENCRYPTION_KEY`. Si tiene menos de 16 caracteres, el guardado falla.
3. El ciphertext se escribe en Redis, clave `hiturno:tenant:{id}:telegram_bot_token`.
4. La base solo guarda la referencia `redis:tenant:{id}:telegram_bot_token`.
5. El secreto del webhook está en `TELEGRAM_WEBHOOK_SECRET`. Si esa variable viene vacía, `TelegramWebhookSecretGuard` deja pasar el request.

Para hy10 ese diseño tiene tres problemas: Redis no es un almacén durable de secretos, la clave está pensada por tenant, y el webhook abierto cuando falta el secreto contradice el fallo cerrado de los requisitos.

Las claves que el Admin no escribe en pantalla (modelo, Wompi, clave maestra, secreto del webhook) siguen solo en el entorno del API. El token del bot sí lo pega el Admin, así que hace falta un almacén cifrado en la aplicación.

## Preguntas

Responde con la letra después de `[Answer]:`. Si ninguna opción encaja, elige Other y descríbela.

## Question 1
¿Dónde viven las claves de hy10?

A) Variables de Railway para las claves de despliegue (modelo, Wompi, clave maestra, secreto del webhook). El token de Telegram que configura el Admin se cifra con AES-256-GCM y el ciphertext queda en Postgres. No se usa Redis ni Azure Key Vault. Si falta el secreto del webhook, el request se rechaza

B) El mismo vault de HiTurno: AES-256-GCM y el ciphertext en Redis, con la clave maestra en el entorno

C) Azure Key Vault para todas las claves, incluidas las que el Admin guarda desde la web

D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
¿Cómo se agrupan los componentes de aplicación?

A) Un monolito modular con los mismos límites que los módulos útiles de HiTurno: acceso, catálogo, agenda, reservas, Telegram y agente, facturación, auditoría, configuración

B) Tres bloques solamente: web, API única sin módulos nombrados, y Telegram

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Ejecución (después de aprobar este plan)

- [x] Confirmar que las respuestas no son ambiguas
- [x] Redactar `components.md`
- [x] Redactar `component-methods.md`
- [x] Redactar `services.md`
- [x] Redactar `component-dependency.md`
- [x] Redactar `application-design.md` que los reúna
- [x] Incluir el almacén de claves elegido, sin el fallo abierto del webhook de HiTurno
- [x] Marcar estos pasos al terminarlos
