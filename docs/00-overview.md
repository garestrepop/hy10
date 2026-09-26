# hy10 — Overview del producto

> Documento de entrada para especificación.  
> Actualizado: 2026-09-25 · Decisiones cerradas en `docs/01-decisions.md`.

## Qué es

**hy10** es un CRM operativo + agenda + canal conversacional (Telegram) con agente de AI 24/7, construido para **un solo negocio** (no SaaS, no multitenancy, no pricing). Greenfield con UI/UX nueva, reutilizando de HiTurno: modelo de datos (sin tenancy), Auth Supabase, Telegram, agente, invitaciones, notificaciones y patrones de arquitectura.

## Para quién

- Vertical / marca de producto: **hy10**.
- Roles internos: **Administrador**, **Staff** (web).
- Rol externo: **Cliente** (Telegram; identidad = `telegram_user_id`).

## Capabilidades acordadas

| Capacidad | Canal | Actor |
|-----------|-------|-------|
| Login usuario/contraseña o Google (Supabase Auth) | Web | Admin, Staff |
| Módulo de Configuración (políticas globales, LLM provider, etc.) | Web | Admin |
| CRUD de servicios (+ políticas propias de cancel/reprogram) | Web | Admin |
| Administración de staff + asociación a servicios | Web | Admin |
| Invitaciones de staff y clientes | Web / Telegram | Admin, Sistema |
| Agenda del staff | Web | Admin, Staff |
| Consultar servicios | Telegram | Cliente |
| Reservar (elegir staff **o** auto-asignación) | Telegram | Cliente vía agente |
| Cancelar / reprogramar (según config global o del servicio) | Telegram | Cliente vía agente |
| Handoff humano solo si el agente no puede responder | Telegram | Sistema → Admin/Staff |
| Notificaciones | Sistema | Admin, Staff, Cliente |
| Agente AI 24/7 → API CRM | Telegram + API | Sistema |

## Infraestructura objetivo

| Capa | Servicio |
|------|----------|
| DB / Auth / Storage | **Supabase** |
| Frontend web (Admin/Staff) — UI nueva | **Vercel** |
| Backend API / agente / Telegram | **Railway** |
| CI/CD | **GitHub Actions** |
| Canal clientes | **Telegram Bot API** |
| LLM | Configurable en módulo Configuración |

## No objetivos (explícitos)

- No SaaS / no multitenancy / no `tenant_id`.
- No pricing / billing / planes.
- No panel web para clientes (MVP = Telegram).
- WhatsApp fuera de alcance inicial.
- No fork ciego de la UI de HiTurno.

## Decisiones

Ver **`docs/01-decisions.md`** (D1–D7 cerradas).
