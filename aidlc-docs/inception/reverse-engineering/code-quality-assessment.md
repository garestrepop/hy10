# Code Quality Assessment — HiTurno

## Test Coverage

- **Overall**: No hay un porcentaje publicado en los archivos leídos. No se inventa una cifra.
- **Unit Tests**: Hay 73 archivos `*.spec.ts`. Cubren agente, auth de cuentas, filtros y herramientas, entre otros. No se ejecutó la suite.
- **Integration Tests**: No se identificó un paquete e2e separado en el listado.

## Code Quality Indicators

- **Linting**: ESLint configurado en `apps/api` y `apps/web` (`eslint.config.mjs`). El script de raíz es `turbo run lint`.
- **Code Style**: Prettier ^3.3.3 con `format` y `format:check`.
- **Documentation**: Alta en `.specify`, ADR, `contexto` y `docs`. El índice de features todavía dice varias implementaciones en "Pendiente", pero el código ya tiene módulos, entidades y controladores. Ese índice está detrás del código.

## Technical Debt

- El modelo entero de negocio lleva `tenant_id`. Para hy10 eso es deuda si se copia sin recorte.
- Auth tiene dos niveles de token (cuenta y tenant). hy10 ya decidió un solo JWT de aplicación.
- Billing mezcla Wompi con planes y tokens. hy10 necesita otro agregado de factura.
- El webhook de Telegram exige `:tenantId` en la ruta.
- `LlmInvocation` guarda provider y tier `fast` o `smart`, que hy10 no expone como catálogo.
- El índice `.specify/INDEX.md` no refleja el código actual. No usarlo como estado de implementación.

## Patterns and Anti-patterns

- **Good Patterns**: módulos por capacidad, ValidationPipe, Helmet, interfaces de LLM y de STT, webhook de pagos separado, auditoría append-only, soft delete, tests del ejecutor de tools.
- **Anti-patterns para hy10**: aislamiento solo pensado con tenant, switch-tenant, CRM de plataforma dentro del mismo monolito de producto, y factura de suscripción reutilizada como si fuera la factura al cliente.

## Implicación

El código es una base real, no un esqueleto vacío. El trabajo de hy10 es recortar tenant y SaaS, no reescribir el dominio de citas desde una página en blanco.
