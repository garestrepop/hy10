# hy10

CRM operativo **single-tenant** (un solo negocio) + agenda + agente de AI en Telegram.

No es SaaS. No es multitenancy. Inspirado en patrones de HiTurno, reescrito para un cliente concreto.

## Estructura

```
hy10/
├── docs/           # Inputs de producto
│   └── 00-overview.md
├── specs/          # Outputs de especificación
│   ├── prd.md      # PRD (Markdown)
│   └── prd.html    # PRD (HTML retro-moderno)
└── README.md
```

## Roles

| Rol | Canal |
|-----|-------|
| Administrador | Web |
| Staff | Web |
| Cliente | Telegram (agente AI 24/7) |

## Infra objetivo

Supabase · Vercel · Railway · GitHub Actions · Telegram Bot API

## Ramas (GitFlow)

| Rama | Uso |
|------|-----|
| `main` | Producción. Solo entra lo que ya salió en un `release/*` o un `hotfix/*`. |
| `develop` | Integración. Rama por defecto. El trabajo nuevo sale de aquí. |
| `feature/*` | Una historia o una unidad. Sale de `develop` y vuelve a `develop`. |
| `release/*` | Cierre de una versión. Sale de `develop`, entra a `main` y se devuelve a `develop`. |
| `hotfix/*` | Corrección sobre producción. Sale de `main`, entra a `main` y se devuelve a `develop`. |

Los Cloud Agents usan `develop` como rama base.

## Empezar por aquí

1. [`docs/00-overview.md`](docs/00-overview.md) — brief
2. [`docs/01-decisions.md`](docs/01-decisions.md) — decisiones D1–D7 (cerradas)
3. [`specs/prd.md`](specs/prd.md) / [`specs/prd.html`](specs/prd.html) — PRD v0.2
4. Siguiente: `specs/arquitectura.md` → `specs/backlog.md`
