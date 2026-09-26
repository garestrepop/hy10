# Análisis de reuso — HiTurno

**Fuente**: https://github.com/garestrepop/hiturno (`main`, TypeScript, actualizado 2026-09-18)  
**Pedido en**: Question 2 de `requirement-verification-questions.md` — analizar antes de cerrar requisitos.  
**Alcance**: lectura de README, `.specify/INDEX.md` y specs F01, F03, F05, F08, F09, F20. No es reverse engineering del código de `apps/`.

## Qué es HiTurno

SaaS multitenant de agendamiento. Monorepo pnpm + Turborepo. API NestJS en Railway, web Next.js en Vercel, Postgres en Supabase. El README declara auth con Passport y JWT propio, sin Supabase Auth. Canal histórico: WhatsApp. El mapa de features añade Telegram como canal oficial (F20, ADR-22).

La implementación de la mayoría de features figura como pendiente en el índice. La fuente de reuso para hy10 son las **especificaciones** de `.specify/features/`, no un código de producción ya cerrado.

## Mapa de reuso para hy10

| Área HiTurno | Decisión para hy10 | Adaptación |
|---|---|---|
| F03 servicios, staff, horarios, citas, slots | Reusar el modelo de dominio | Quitar `tenant_id`, precio/moneda y consumo de tokens de plan. Identidad de cliente = `telegram_user_id` (D2), no teléfono E.164 + OTP. |
| F03 overlap atómico y “cualquier staff” | Reusar la regla | Auto-asignación hy10 = primer hueco disponible (Question 3 = A). |
| F05 agente con tools y `LLMProvider` | Reusar el patrón | Tools contra la API. El agente no escribe la base. Confirmación antes de mutar (P3 del PRD). |
| F05 sesión, fallback y handoff si el LLM falla | Reusar la idea | TTL de sesión y umbral de handoff son parámetros de Configuración (Questions 7 y 8). |
| F05 catálogo Anthropic/Gemini y modelos fast/smart | No copiar el catálogo | Question 5 = solo el modelo es configurable. |
| F08 invitaciones por email y token | Reusar para Admin/Staff | Un solo negocio: sin membership multi-tenant ni rol OWNER de plataforma. Invitación de cliente se adapta a Telegram (D2), no a cuenta web. |
| F09 notificaciones por eventos, reintentos y log | Reusar el patrón | Canal del cliente = Telegram. Sin eventos de billing. |
| F20 canal Telegram | Referencia de canal | hy10 es solo Telegram (D2). WhatsApp queda fuera del MVP. |
| F02 tenants, subdominios, token de negocio | No reusar | Single-tenant (D7). |
| F04 billing / Wompi / tokens de plan | No reusar | Pagos y pricing fuera del MVP. |
| F06 WhatsApp + OTP de teléfono | No reusar como identidad | Contradice D2. |
| F10 CRM de plataforma / F18 marketing | No reusar | hy10 no es SaaS ni tiene panel de plataforma. |
| UI HiTurno (F14–F17) | No reusar | UI/UX greenfield (D7). |

## Resolución

Clarification Question 1 = B. hy10 usa auth propia de un solo negocio (email + contraseña y Google, JWT de aplicación). No usa Supabase Auth, Apple ni token de tenant. El hallazgo queda cerrado en `requirements.md` (FR-01 a FR-08).
