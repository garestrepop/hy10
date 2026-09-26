# Personas — hy10

Tres personas. El dueño del negocio es el Administrador. No hay una cuarta persona de dueño.

## Administrador

| Campo | Descripción |
|-------|-------------|
| Rol | Dueño y operador principal del negocio |
| Canal | Web. Telegram solo después de vincular la cuenta, y solo para consultar |
| Motivación | Tener una sola agenda, saber la ocupación y cobrar el servicio ya prestado sin perseguir mensajes |
| Puede | Configurar el negocio, el catálogo, el staff, todas las agendas, las reservas y la facturación. Invitar staff. Consultar ocupación, disponibilidad y staff por servicio en Telegram |
| No puede | Elegir negocio o tenant. Crear, cancelar o reprogramar reservas desde Telegram. Ver un catálogo de proveedores LLM ni la clave. Usar el historial de conversaciones en el panel (eso es Should, fuera de estas historias) |

## Staff

| Campo | Descripción |
|-------|-------------|
| Rol | Persona que presta los servicios |
| Canal | Web para su agenda y para marcar una reserva propia como prestada. Telegram, si lo vinculó, para avisos y para consultar su agenda |
| Motivación | Saber a quién atiende, enterarse si el cliente canceló o cambió la hora, y no depender de un chat manual |
| Puede | Ver y editar su disponibilidad. Ver las reservas asignadas a él. Marcar como prestada una reserva suya. Recibir el aviso del próximo turno y el de cancelación o reprogramación. Preguntar su agenda por Telegram |
| No puede | Ver la ocupación global, la agenda de otro staff ni el catálogo completo de asociaciones. Configurar el negocio. Entrar al módulo de facturación. Operar reservas ajenas |

## Cliente

| Campo | Descripción |
|-------|-------------|
| Rol | Quien pide el turno |
| Canal | Solo Telegram. Sin cuenta web y sin JWT |
| Identidad | `telegram_user_id`. Si ese id está vinculado a un Admin o a un Staff, no se trata como Cliente |
| Motivación | Reservar, cambiar o cancelar sin esperar a que alguien conteste, y pagar el servicio cuando ya se prestó |
| Puede | Consultar servicios y huecos reales, reservar con staff elegido o con auto-asignación, cancelar y reprogramar sus reservas si la política lo permite, pedir el enlace de pago de su factura |
| No puede | Confirmar un horario que la API no devolvió. Mutar una reserva sin un sí explícito. Ver datos de otro cliente. Elegir el monto a pagar. Abrir un menú de “hablar con un humano” |

## Mapa persona → historias

| Persona | Historias |
|---------|-----------|
| Administrador | US-01, US-02, US-03, US-04, US-05, US-07, US-08, US-09, US-11, US-17, US-18, US-22, US-23, US-25, US-26, US-27, US-28, US-29, US-31, US-32 |
| Staff | US-01, US-02, US-03, US-05, US-10, US-17, US-18, US-19, US-20, US-21, US-23, US-28, US-29, US-32 |
| Cliente | US-06, US-12, US-13, US-14, US-15, US-16, US-24, US-30, US-32 |
