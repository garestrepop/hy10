# Unit of Work — hy10

Siete unidades de planificación. La API sigue siendo un solo proceso, con mínimo 1 y máximo 2 instancias. La web es el otro despliegue. Ninguna unidad de la API tiene base ni servicio propio.

Las construye una persona, en este orden:

1. Plataforma
2. Acceso
3. Catálogo y agenda
4. Reservas y clientes
5. Facturación
6. Telegram y agente
7. Web

## Código futuro

Monorepo, fuera de este ciclo. Este ciclo no genera código.

```text
apps/web
apps/api/src/access
apps/api/src/catalog
apps/api/src/reservations
apps/api/src/billing
apps/api/src/telegram
apps/api/src/platform
```

`packages/` solo aparece si un tipo tiene que compartirse entre web y API. Los módulos de la API no se publican como paquetes separados.

## Esquemas

Un Postgres. Cada unidad de la API posee su esquema. Las referencias entre unidades son identificadores. La web no tiene esquema.

| Unidad | Esquema |
|--------|---------|
| Plataforma | `platform` |
| Acceso | `access` |
| Catálogo y agenda | `catalog` |
| Reservas y clientes | `reservations` |
| Facturación | `billing` |
| Telegram y agente | `telegram` |
| Web | ninguno |

En `platform` viven la configuración no secreta, la auditoría y el ciphertext del token del bot. Las claves de despliegue siguen en el entorno de Railway.

## Plataforma

- **Responsibilities**: Configuración del negocio, almacén de claves, auditoría y avisos. El aviso lee la reserva ya guardada. El webhook sin secreto se rechaza desde la regla que consume el secreto, no desde un segundo proceso.
- **Stories**: US-07, US-19, US-21, US-31.

## Acceso

- **Responsibilities**: Login, Google, JWT de aplicación, refresh, logout, MFA del Admin, recuperación e invitación de Staff. Sin selector de negocio.
- **Stories**: US-01, US-02, US-03, US-04, US-05.

## Catálogo y agenda

- **Responsibilities**: Servicios, staff, asociación, horario del negocio, bloques y huecos. Un hueco sale de horario, excepciones, servicio y reservas ya guardadas. La consulta de ocupación del Admin usa esos mismos datos.
- **Stories**: US-08, US-09, US-10, US-11, US-22, US-27.

## Reservas y clientes

- **Responsibilities**: Identidad del Cliente, opt-out, vínculo de Telegram del equipo, alta, cancelación, reprogramación, prestada y no-show. El solape es por staff. La confirmación conversacional aplica solo al camino del Cliente. La web no la pide.
- **Stories**: US-06, US-12, US-13, US-14, US-17, US-18, US-20, US-23, US-28, US-29, US-30.

## Facturación

- **Responsibilities**: Factura interna al marcar prestada una reserva con precio, checkout de Wompi, webhook idempotente y anulación solo si no está pagada. El monto lo fija la API.
- **Stories**: US-24, US-25, US-26.

## Telegram y agente

- **Responsibilities**: Webhook, nota de voz, turno de conversación y tools. No escribe la base de negocio. No inventa huecos. La sesión a medias y el handoff viven aquí. El texto de un Admin o un Staff no cambia su rol.
- **Stories**: US-15, US-16, US-32.

## Web

- **Responsibilities**: Pantallas de Admin y Staff. Llama a `/api/v1`. No guarda claves ni aplica reglas de reserva, precio o rol.
- **Stories**: ninguna. Cada historia con pantalla queda en la unidad de la regla. La web figura como dependencia.
