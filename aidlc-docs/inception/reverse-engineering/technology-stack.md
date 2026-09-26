# Technology Stack — HiTurno

Versiones tomadas de `package.json` del repo. El rango semver es el declarado, no un lock pin citado línea a línea.

## Programming Languages

- TypeScript ^5.7.2 — API, web y paquetes shared
- HTML estático — `apps/landing`

## Frameworks

- NestJS ^11.0.1 — API
- TypeORM ^0.3.20 — persistencia
- Next.js ^16.0.0 y React ^19.0.0 — web
- Passport ^0.7.0 y @nestjs/jwt ^11.0.0 — auth
- Zod ^3.24.1 y class-validator ^0.14.1 — validación

## Infrastructure

- PostgreSQL vía Supabase — datos. No se usa Supabase Auth
- Upstash Redis ^1.34.4 — sesión y límites
- Railway — API, según README y `railway.toml`
- Vercel — web, según README y `apps/web/vercel.json`
- GitHub Actions — CI, carpeta `.github`

## Build Tools

- pnpm 9.15.0 — paquetes
- Turborepo ^2.3.3 — tareas
- Node >= 20

## Testing Tools

- El script `test` de Turbo corre los tests de cada paquete
- Vitest ^2.1.8 — web
- Testing Library ^16.1.0 — web
- Specs `*.spec.ts` en la API — el runner de la API no se abrió archivo por archivo en este pase

## Integraciones

- Anthropic SDK ^0.105.0 y Google Generative AI ^0.24.1
- ElevenLabs, cliente propio de STT en `ai-agent/providers`
- SendGrid ^8.1.4
- Wompi, configuración en `apps/api/src/config/wompi.config.ts` y widget en la web
- Telegram Bot API y Meta WhatsApp

## Qué de este stack ya está decidido para hy10

NestJS, Next.js, Postgres en Supabase, Railway, Vercel, GitHub Actions, Passport y JWT, Telegram, transcripción de nota de voz y Wompi para el cobro del servicio. No entran Supabase Auth, WhatsApp, el catálogo fijo de modelos ni el billing por tokens.
