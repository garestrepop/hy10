# Component Inventory — HiTurno

## Application Packages

- `apps/api` — API NestJS. Heredable en módulos, no en tenants ni billing SaaS.
- `apps/web` — Next.js del SaaS. Referencia. UI de hy10 nueva.
- `apps/landing` — Landing del SaaS. Fuera de hy10.

## Infrastructure Packages

- No hay paquete CDK ni Terraform en el árbol revisado.
- Despliegue descrito en `docs/` y en el README: Railway, Vercel, Supabase, GitHub Actions.

## Shared Packages

- `packages/shared-types` — tipos de dominio. Heredables si se quita el tenant.
- `packages/shared-utils` — utilidades. Heredables tras revisión.
- `packages/shared-design-tokens` — tokens de la UI de HiTurno. No obligan el diseño visual de hy10.

## Test Packages

- Tests junto al código: 73 archivos `*.spec.ts`, sobre todo en `apps/api`.
- No hay un paquete separado de tests de carga.

## Specs y contexto, no son paquetes de runtime

- `.specify/features` — F01 a F20
- `.specify/adr` — ADR-01, ADR-02, ADR-11 a ADR-22
- `.specify/product` — visión, personas, jobs
- `.specify/constitution.md`
- `contexto/` — arquitectura y módulos
- `docs/` — entornos y cierres de MVP

## Total Count

- **Total Packages de workspace**: 3 de aplicación (`api`, `web`, `landing`) y 3 shared
- **Application**: 3
- **Infrastructure**: 0 como paquete
- **Shared**: 3
- **Test**: 0 paquetes propios. 73 specs dentro de las apps

## Disposición para hy10

| Pieza | Disposición |
|-------|-------------|
| services, staff, schedules, clients, appointments, invitations, audit, health, notifications, ai-agent, telegram | Heredar y quitar `tenant_id` |
| auth y accounts | Heredar sin switch-tenant |
| platform-config | Adaptar a un negocio |
| billing webhook Wompi | Patrón, no el dominio de suscripción |
| tenants, memberships, crm, support, whatsapp, landing | No heredar |
