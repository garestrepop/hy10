# Unit of Work Story Map — hy10

Cada historia tiene una unidad dueña: la de la regla de negocio. Las otras quedan como dependencia y no repiten la historia. US-01 a US-32 están asignadas.

## Acceso

| Historia | Dependencias |
|----------|----------------|
| US-01 Iniciar sesión | Web |
| US-02 Cerrar sesión | Web |
| US-03 Recuperar la contraseña | Plataforma, Web |
| US-04 Segundo factor del Administrador | Web |
| US-05 Invitar a un Staff | Plataforma, Web |

## Catálogo y agenda

| Historia | Dependencias |
|----------|----------------|
| US-08 Mantener los servicios | Web |
| US-09 Mantener el staff y sus servicios | Web |
| US-10 Definir mi disponibilidad | Web |
| US-11 Supervisar ocupación y agendas | Web |
| US-22 Consultar la operación por Telegram | Telegram y agente |
| US-27 Definir el horario del negocio | Web |

## Reservas y clientes

| Historia | Dependencias |
|----------|----------------|
| US-06 Reconocer al Cliente por Telegram | Telegram y agente |
| US-12 Reservar un turno | Telegram y agente, Catálogo y agenda |
| US-13 Cancelar mi reserva | Telegram y agente, Plataforma |
| US-14 Reprogramar mi reserva | Telegram y agente, Plataforma |
| US-17 Ver las reservas en la web | Web |
| US-18 Vincular Telegram | Web, Telegram y agente, Acceso |
| US-20 Consultar mi agenda por Telegram | Telegram y agente |
| US-23 Marcar el servicio como prestado | Facturación, Web |
| US-28 Marcar que el cliente no vino | Web |
| US-29 Crear una reserva desde la web | Web, Catálogo y agenda |
| US-30 Silenciar avisos del bot | Telegram y agente, Plataforma |

## Facturación

| Historia | Dependencias |
|----------|----------------|
| US-24 Pagar el servicio prestado | Telegram y agente, Reservas y clientes |
| US-25 Registrar el pago una sola vez | Plataforma |
| US-26 Consultar y anular facturas | Web |

## Plataforma

| Historia | Dependencias |
|----------|----------------|
| US-07 Configurar el negocio | Web |
| US-19 Avisar el próximo turno | Reservas y clientes, Telegram y agente |
| US-21 Enterarme de una cancelación o reprogramación | Reservas y clientes, Telegram y agente |
| US-31 Consultar la auditoría | Web |

## Telegram y agente

| Historia | Dependencias |
|----------|----------------|
| US-15 Abandonar la reserva a medias | Plataforma |
| US-16 Escalar cuando el agente no puede | Plataforma |
| US-32 Enviar una nota de voz | Plataforma |

## Web

No posee historias. Participa como dependencia donde hay pantalla.

## Cobertura

| Unidad | Historias dueñas |
|--------|------------------|
| Acceso | 5 |
| Catálogo y agenda | 6 |
| Reservas y clientes | 11 |
| Facturación | 3 |
| Plataforma | 4 |
| Telegram y agente | 3 |
| Web | 0 |
| Total | 32 |
