# hy10 — Decisiones de producto (cerradas)

> Fuente: sesión de decisiones 2026-09-25.  
> Estado: **cerradas** salvo micro-especificaciones técnicas anotadas.

---

## D1 — Vertical / identidad

| Campo | Decisión |
|-------|----------|
| **Decisión** | El producto y la vertical de marca es **hy10** (no se acota a salón/clínica/etc. genérico). |
| **Implicación** | Naming, UI/UX y copy se construyen alrededor de hy10 como sistema propio del negocio. |
| **Pendiente fino** | Nombre legal / branding visual del negocio cliente (logo, colores) si difiere de “hy10”. |

---

## D2 — Identidad del Cliente

| Campo | Decisión |
|-------|----------|
| **Decisión** | Canal e identidad canónica del Cliente = **Telegram** (`telegram_user_id` como PK lógica). |
| **Implicación** | Sin login web para Cliente en MVP. Perfil mínimo: telegram_id, nombre Telegram, teléfono opcional, estado de invitación/vinculación. |
| **Reuso HiTurno** | Flujos de bot Telegram + vinculación de identidad. |

---

## D3 — Cancelación / reprogramación

| Campo | Decisión |
|-------|----------|
| **Decisión** | Son **parámetros de configuración**, no hardcode. |
| **Niveles** | 1) **Global** (módulo Configuración de la app). 2) **Por servicio** (override; un servicio puede tener particularidades). |
| **Resolución** | Si el servicio define el parámetro → gana el servicio; si no → cae al global. |
| **Ejemplos de params** | `cancel_min_hours`, `reschedule_min_hours`, `max_reschedules`, `allow_cancel`, `allow_reschedule` (lista exacta en arquitectura). |
| **Must** | Módulo **Configuración** en web Admin + campos de política en CRUD de Servicio. |

---

## D4 — Asignación de staff en la reserva

| Campo | Decisión |
|-------|----------|
| **Decisión** | **Ambas** opciones: el Cliente puede **elegir staff**, o el sistema puede **asignar automáticamente**. |
| **UX Telegram** | Flujo: servicio → “¿Prefieres a alguien o te asignamos?” → (a) lista staff del servicio con huecos, o (b) mejor slot disponible entre staff elegibles. |
| **Regla API** | El staff elegido/asignado debe estar asociado al servicio y tener disponibilidad real. |
| **Pendiente fino** | Algoritmo de auto-asignación (round-robin, menor carga, primer hueco) — default propuesto: **primer hueco disponible** entre staff del servicio. |

---

## D5 — Handoff humano

| Campo | Decisión |
|-------|----------|
| **Decisión** | Handoff **solo cuando el agente no pueda responder** (no por “quiero humano” como feature primaria de MVP, salvo que eso cuente como “no puede resolver”). |
| **Triggers** | Fallo de tool / ambigüedad irresoluble tras N intentos / fuera de dominio / error de sistema. |
| **Comportamiento** | Marcar conversación `escalated` + notificar Admin/Staff + mensaje al cliente de que un humano tomará el caso. |
| **Must** | Handoff pasa de Should → **Must** (condicionado a incapacidad del agente). |

---

## D6 — Proveedor LLM

| Campo | Decisión |
|-------|----------|
| **Decisión** | El proveedor LLM se define en el **módulo de Configuración** (no fijo en código). |
| **Implicación** | Abstracción `LlmProvider` + secretos (API keys) en config segura (env/Supabase secrets/vault — detalle en arquitectura). |
| **Pendiente fino** | Catálogo inicial de proveedores (OpenAI, Anthropic, etc.) y modelo default. |
| **Seguridad** | Keys nunca en el cliente web; solo backend. Rotación y mask en UI. |

---

## D7 — Estrategia de construcción vs HiTurno

| Campo | Decisión |
|-------|----------|
| **Decisión** | **Greenfield** con **UI/UX nueva**. |
| **No** | Multitenancy · Pricing / billing SaaS · planes · `tenant_id` / Account multi-org como eje. |
| **Sí reusar de HiTurno** | Modelo de datos (adaptado sin multitenancy) · Auth Supabase · Telegram · Agente · Invitaciones staff y clientes · Notificaciones · Arquitectura / patrones. |
| **Implicación repo** | Nuevo repo hy10; portar módulos útiles, no fork ciego del monorepo SaaS. |

### Mapa de reuso (alto nivel)

| Área | Reusar | Adaptar / eliminar |
|------|--------|---------------------|
| Auth Supabase (email/password + Google) | Sí | Quitar scopes multi-tenant / Account dual JWT si aplica |
| Dominio servicios / staff / citas | Sí (ideas + código) | Sin `tenant_id`; un solo negocio |
| Telegram adapter + agent tools | Sí | Tools alineados a API hy10 |
| Invitaciones staff / clientes | Sí | Flujos single-tenant |
| Notificaciones | Sí | Sin templates de billing/SaaS |
| Pricing / suscripciones / tenants | No | — |
| Landing / marketing SaaS | No | UI nueva hy10 |
| UI actual HiTurno | No (referencia) | Diseño nuevo |

---

## Impacto en MoSCoW (delta)

| Feature | Antes | Ahora |
|---------|-------|-------|
| Módulo Configuración (global) | implícito | **Must** |
| Políticas cancel/reprogram por servicio | — | **Must** |
| Elegir staff **o** auto-asignar | TBD | **Must** (ambas) |
| Handoff humano | Should | **Must** (solo si agente no puede) |
| Proveedor LLM configurable | TBD | **Must** (config) |
| UI/UX nueva | — | **Must** (greenfield visual) |
| Pricing / multitenancy | Won't | **Won't** (confirmado) |

---

## Micro-decisiones aún abiertas (no bloquean PRD)

1. Algoritmo exacto de auto-asignación de staff.  
2. Lista canónica de keys del módulo Configuración + overrides por servicio.  
3. Catálogo de proveedores LLM v1.  
4. Branding visual (paleta, logo) del negocio.  
5. Zona horaria default del negocio (candidato a Config global).
