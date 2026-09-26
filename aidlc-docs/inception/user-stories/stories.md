# User Stories — hy10

Método aprobado: épicas de dominio, una historia por objetivo de usuario, criterios en Gherkin, solo Must, en español, con rechazos dentro de la historia. Fuera de este documento queda FR-35 (historial de conversaciones, Should) y las plantillas de email adicionales (Should).

Las historias US-01 a US-26 se mantienen. US-27 a US-32 suman lo compatible de F03, F11 y F20, incluida la nota de voz entrante. No incorporan multitenancy, SaaS, WhatsApp, OTP de teléfono ni el catálogo de modelos de HiTurno.

## Épica: Acceso

### US-01 Iniciar sesión

**Prioridad**: Must  
**Personas**: Administrador, Staff  
**Requisitos**: FR-01, FR-02, FR-03, FR-05, FR-08, NFR-11, NFR-12, NFR-13, NFR-15

Como miembro del equipo quiero entrar con email y contraseña o con Google para operar el negocio sin elegir una organización.

```gherkin
Escenario: Login con email y contraseña
  Dado un usuario con email único y contraseña de al menos 8 caracteres que no está en la lista de contraseñas filtradas
  Cuando envía email y contraseña correctos
  Entonces recibe una sesión JWT validada en el servidor
  Y el access token dura 15 minutos
  Y el refresh token dura 2 días y rota al usarse
  Y no aparece un selector de negocio

Escenario: Login con Google
  Dado un usuario que elige Google
  Cuando el proveedor confirma ese email
  Entonces entra con el rol de esa cuenta
  Y no se crea una segunda cuenta si el email ya existe

Escenario: Contraseña rechazada o intentos repetidos
  Dado credenciales incorrectas o una contraseña de menos de 8 caracteres o presente en la lista de filtradas
  Cuando intenta entrar
  Entonces la sesión no se crea
  Y el mensaje no revela si el email existe ni el detalle interno
  Y tras intentos fallidos repetidos el login se bloquea o se retrasa

Escenario: Ruta sin sesión
  Dado un visitante sin JWT válido
  Cuando abre una pantalla de Admin o de Staff
  Entonces el servidor rechaza el acceso
```

### US-02 Cerrar sesión

**Prioridad**: Must  
**Personas**: Administrador, Staff  
**Requisitos**: FR-04

Como miembro del equipo quiero cerrar la sesión de este dispositivo o de todos para que un token robado deje de servir.

```gherkin
Escenario: Cerrar este dispositivo
  Dado una sesión activa
  Cuando cierra la sesión en este dispositivo
  Entonces ese refresh token queda invalidado
  Y un access token vencido no se renueva con él

Escenario: Cerrar todos los dispositivos
  Dado sesiones en más de un dispositivo
  Cuando cierra la sesión en todos
  Entonces ningún refresh token anterior renueva la sesión
```

### US-03 Recuperar la contraseña

**Prioridad**: Must  
**Personas**: Administrador, Staff  
**Requisitos**: FR-07, NFR-11, NFR-13

Como miembro del equipo quiero un enlace de un solo uso por email para volver a entrar si olvidé la contraseña.

```gherkin
Escenario: Enlace vigente
  Dado una cuenta con ese email
  Cuando pide recuperar la contraseña y abre el enlace antes de que expire
  Entonces puede guardar una contraseña nueva que cumple la política
  Y el enlace no sirve una segunda vez

Escenario: Enlace vencido o repetido
  Dado un enlace expirado o ya usado
  Cuando lo abre
  Entonces la contraseña no cambia
  Y el mensaje es genérico
```

### US-04 Segundo factor del Administrador

**Prioridad**: Must  
**Persona**: Administrador  
**Requisitos**: NFR-11

Como Administrador quiero un segundo factor para que la cuenta no dependa solo de la contraseña.

```gherkin
Escenario: MFA activo
  Dado un Administrador con MFA configurado
  Cuando supera email y contraseña o Google
  Entonces el sistema pide el segundo factor antes de entregar la sesión

Escenario: Segundo factor incorrecto
  Dado un código MFA inválido
  Cuando lo envía
  Entonces la sesión no se crea
```

### US-05 Invitar a un Staff

**Prioridad**: Must  
**Personas**: Administrador, Staff  
**Requisitos**: FR-08, FR-28, FR-30

Como Administrador quiero invitar por email a quien atiende para que tenga rol Staff sin compartir mi clave.

```gherkin
Escenario: Email nuevo
  Dado un Administrador autenticado
  Cuando invita un email que no tiene cuenta
  Entonces sale un token opaco de un solo uso, vigente 7 días
  Y al aceptarlo se crea la cuenta con rol Staff

Escenario: Email que ya tiene cuenta
  Dado un email que ya es usuario
  Cuando esa persona abre la invitación
  Entonces debe iniciar sesión
  Y al aceptar queda con rol Staff
  Y no se duplica la cuenta

Escenario: Token vencido, usado o ajeno
  Dado un token expirado, ya usado, o un usuario que no es Administrador
  Cuando intenta aceptarlo o crearlo
  Entonces no se asigna el rol Staff
```

### US-06 Reconocer al Cliente por Telegram

**Prioridad**: Must  
**Persona**: Cliente  
**Requisitos**: FR-06, FR-27, FR-29

Como Cliente quiero que el bot me reconozca por Telegram para reservar sin crear una cuenta web.

```gherkin
Escenario: Primer mensaje de un id desconocido
  Dado un telegram_user_id que no está vinculado a Admin ni a Staff
  Cuando escribe al bot por primera vez
  Entonces se crea un cliente con ese id y el nombre que entrega Telegram
  Y no recibe usuario web ni JWT

Escenario: Id ya vinculado al equipo
  Dado un telegram_user_id vinculado a un Admin o a un Staff
  Cuando escribe al bot
  Entonces no se crea un cliente con ese id
  Y el rol es el del usuario interno
```

## Épica: Catálogo

### US-07 Configurar el negocio

**Prioridad**: Must  
**Persona**: Administrador  
**Requisitos**: FR-09, FR-10, FR-11, NFR-16

Como Administrador quiero guardar zona horaria, modelo, políticas y tiempos de conversación para que el equipo y el bot usen las mismas reglas.

```gherkin
Escenario: Valores iniciales
  Dado un negocio recién creado
  Cuando el Administrador abre la configuración
  Entonces la zona horaria es America/Bogota
  Y el TTL de sesión es 60 minutos
  Y el umbral de handoff es 3
  Y el aviso al staff es 30 minutos
  Y cancelar o reprogramar no quedan permitidos fuera de una ventana hasta que él guarde las políticas

Escenario: Guardar políticas y modelo
  Dado un Administrador autenticado
  Cuando guarda zona horaria, identificador de modelo, políticas, TTL, umbral de handoff y antelación del aviso
  Entonces esos valores quedan auditados con actor y valor anterior
  Y la pantalla no muestra un catálogo de proveedores ni la clave del modelo

Escenario: Staff intenta configurar
  Dado un usuario Staff
  Cuando abre la configuración del negocio
  Entonces el servidor lo rechaza
```

### US-08 Mantener los servicios

**Prioridad**: Must  
**Persona**: Administrador  
**Requisitos**: FR-12, FR-13, FR-16

Como Administrador quiero crear y desactivar servicios, con precio y política propia, para que el bot solo ofrezca lo que está vigente.

```gherkin
Escenario: Alta de servicio
  Dado un Administrador autenticado
  Cuando crea un servicio con nombre, descripción, duración en minutos y precio en centavos de COP mayor o igual a cero
  Entonces el servicio queda disponible para asociar staff

Escenario: Override de política
  Dado un servicio con un parámetro de política definido y el resto en nulo
  Cuando se resuelve la política de ese servicio
  Entonces el parámetro definido gana al global
  Y cada nulo usa el valor global

Escenario: Servicio inactivo
  Dado un servicio desactivado
  Cuando un Cliente pide turnos
  Entonces ese servicio no se ofrece
  Y su historial se conserva
```

### US-09 Mantener el staff y sus servicios

**Prioridad**: Must  
**Persona**: Administrador  
**Requisitos**: FR-14, FR-16

Como Administrador quiero dar de alta al staff y decir qué servicios presta para que la agenda y el bot no ofrezcan a quien no corresponde.

```gherkin
Escenario: Asociar servicios
  Dado un staff activo
  Cuando el Administrador lo asocia a uno o más servicios
  Entonces solo esos servicios pueden reservarse con ese staff

Escenario: Staff inactivo
  Dado un staff desactivado
  Cuando se calcula disponibilidad para una reserva nueva
  Entonces ese staff no aparece
  Y sus reservas históricas siguen visibles
```

## Épica: Agenda

### US-10 Definir mi disponibilidad

**Prioridad**: Must  
**Persona**: Staff  
**Requisitos**: FR-15, FR-17, FR-25

Como Staff quiero armar mi semana y mis excepciones para que los huecos que ve el Cliente sean los míos.

```gherkin
Escenario: Bloques y excepciones propios
  Dado un Staff autenticado
  Cuando guarda bloques semanales o una excepción de bloqueo o de apertura sobre su agenda
  Entonces el cálculo de slots usa esos datos

Escenario: Agenda de otro
  Dado un Staff
  Cuando intenta editar la disponibilidad de otro staff
  Entonces el servidor lo rechaza
```

### US-11 Supervisar ocupación y agendas

**Prioridad**: Must  
**Persona**: Administrador  
**Requisitos**: FR-15, FR-17, FR-34

Como Administrador quiero ver la ocupación y editar la agenda de cualquier staff para corregir la disponibilidad real.

```gherkin
Escenario: Dashboard y agenda global
  Dado un Administrador autenticado
  Cuando abre el dashboard y la agenda global
  Entonces ve la ocupación del negocio y la agenda de cada staff

Escenario: Editar la agenda de un staff
  Dado un Administrador autenticado
  Cuando cambia bloques o excepciones de un staff
  Entonces los slots siguientes usan esa disponibilidad
```

## Épica: Reservas

### US-12 Reservar un turno

**Prioridad**: Must  
**Persona**: Cliente  
**Requisitos**: FR-17, FR-18, FR-19, FR-20, FR-21, FR-31, NFR-01, NFR-09, NFR-14, NFR-18

Como Cliente quiero reservar por Telegram, eligiendo staff o pidiendo que me asignen, para quedar en un hueco que existe de verdad.

```gherkin
Escenario: Elige staff y confirma
  Dado un servicio activo con staff asociado y huecos calculados por la API
  Cuando el Cliente elige servicio, staff y un hueco, y responde que sí a la confirmación
  Entonces se crea una reserva con ese servicio, ese staff, ese cliente y ese inicio
  Y la duración es la del servicio
  Y antes del sí no existe la reserva

Escenario: Auto-asignación
  Dado varios staff del servicio con huecos distintos
  Cuando el Cliente pide que le asignen y confirma el primer hueco disponible
  Entonces la reserva queda con el staff de ese primer hueco
  Y ese staff está asociado al servicio

Escenario: Hueco ya tomado
  Dado un hueco que dejó de estar libre
  Cuando la API intenta crear la reserva
  Entonces la rechaza
  Y no quedan dos reservas solapadas de ese staff

Escenario: El agente no recibe slots
  Dado un fallo o una respuesta vacía de disponibilidad
  Cuando el Cliente pide una hora
  Entonces el agente no confirma un horario inventado
```

### US-13 Cancelar mi reserva

**Prioridad**: Must  
**Persona**: Cliente  
**Requisitos**: FR-20, FR-22, FR-25, FR-30, NFR-14

Como Cliente quiero cancelar mi reserva por Telegram cuando la política lo permite para liberar el hueco.

```gherkin
Escenario: Política cumplida y confirmación
  Dado una reserva propia y una política resuelta que permite cancelar
  Cuando el Cliente pide cancelar y confirma
  Entonces la reserva queda cancelada
  Y el Cliente recibe el aviso por Telegram

Escenario: Fuera de política o reserva ajena
  Dado una política que no permite cancelar, o una reserva de otro cliente
  Cuando insiste en cancelar
  Entonces la reserva no cambia
```

### US-14 Reprogramar mi reserva

**Prioridad**: Must  
**Persona**: Cliente  
**Requisitos**: FR-20, FR-22, FR-23, FR-24, FR-30

Como Cliente quiero mover mi reserva a otro hueco real, dentro de la política y del tope, sin dejar dos citas mías activas por el mismo servicio.

```gherkin
Escenario: Reprogramación confirmada
  Dado una reserva propia bajo el tope max_reschedules y un hueco nuevo libre
  Cuando confirma el cambio
  Entonces la misma reserva queda en el nuevo inicio
  Y el hueco anterior queda libre
  Y no se solapa con otra reserva de ese staff
  Y el contador de reprogramaciones sube en uno

Escenario: Tope o política
  Dado el tope ya alcanzado o una política que no permite reprogramar
  Cuando pide otro cambio
  Entonces la API rechaza y la reserva sigue igual
```

### US-15 Abandonar la reserva a medias

**Prioridad**: Must  
**Persona**: Cliente  
**Requisitos**: FR-10, FR-26

Como Cliente quiero que un chat abandonado no me deje una cita que no confirmé.

```gherkin
Escenario: Sesión vencida
  Dado una conversación de reserva sin confirmación
  Cuando pasa el TTL de sesión configurado
  Entonces no se crea la reserva
```

### US-16 Escalar cuando el agente no puede

**Prioridad**: Must  
**Persona**: Cliente  
**Requisitos**: FR-32, FR-33, NFR-18

Como Cliente quiero que una persona del negocio se entere solo cuando el bot no puede resolver, no porque yo pida un menú de humano.

```gherkin
Escenario: Fallo, ambigüedad o fuera de dominio
  Dado un fallo de tool, un error de sistema, una petición fuera de dominio, o ambigüedad que supera handoff_ambiguity_attempts
  Cuando el agente ya no puede responder
  Entonces la conversación queda escalated
  Y Admin o Staff reciben aviso
  Y el Cliente recibe que una persona tomará el caso

Escenario: Camino feliz
  Dado una petición que el agente puede resolver con tools
  Cuando el Cliente escribe
  Entonces no aparece un menú de hablar con un humano
```

### US-17 Ver las reservas en la web

**Prioridad**: Must  
**Personas**: Administrador, Staff  
**Requisitos**: FR-25, FR-34, NFR-14

Como miembro del equipo quiero ver las reservas que me corresponden para saber qué está agendado.

```gherkin
Escenario: Staff
  Dado un Staff autenticado
  Cuando abre la lista y el detalle de reservas
  Entonces solo ve las asignadas a él

Escenario: Administrador
  Dado un Administrador autenticado
  Cuando abre la lista y el detalle
  Entonces ve todas las reservas del negocio

Escenario: Reserva ajena
  Dado un Staff
  Cuando pide el detalle de una reserva de otro staff
  Entonces el servidor la niega
```

## Épica: Telegram del equipo

### US-18 Vincular Telegram

**Prioridad**: Must  
**Personas**: Administrador, Staff  
**Requisitos**: FR-36, FR-37, NFR-14

Como miembro del equipo quiero vincular mi Telegram desde la web, ya autenticado, para recibir avisos o consultar sin que el texto del chat decida mi rol.

```gherkin
Escenario: Vínculo de un solo uso
  Dado un Admin o Staff con sesión web
  Cuando genera un código o enlace de corta vigencia y lo usa en Telegram
  Entonces ese telegram_user_id queda ligado solo a esa cuenta

Escenario: Sin vínculo
  Dado una cuenta sin Telegram ligado
  Cuando opera la web
  Entonces la web sigue funcionando
  Y no salen avisos de Telegram para esa cuenta

Escenario: El mensaje pide otro rol
  Dado un id ya vinculado como Staff
  Cuando el texto afirma ser Administrador
  Entonces el servidor mantiene el rol Staff
```

### US-19 Avisar el próximo turno

**Prioridad**: Must  
**Persona**: Staff  
**Requisitos**: FR-30, FR-38

Como Staff quiero un aviso antes de cada reserva mía vigente para saber a quién atiendo.

```gherkin
Escenario: Aviso desde la reserva
  Dado un Staff con Telegram vinculado y una reserva suya vigente
  Cuando falta staff_upcoming_notice_minutes para el inicio
  Entonces recibe servicio, inicio en la zona horaria del negocio y nombre del cliente
  Y esos datos salen de la reserva guardada

Escenario: Sin vínculo o reserva ya cancelada
  Dado un Staff sin Telegram, o una reserva que ya no está vigente
  Cuando llega la hora del aviso
  Entonces no sale ese aviso de próximo turno
```

### US-20 Consultar mi agenda por Telegram

**Prioridad**: Must  
**Persona**: Staff  
**Requisitos**: FR-31, FR-39, FR-42, NFR-14

Como Staff quiero preguntarle al bot mi agenda próxima para verla sin abrir la web.

```gherkin
Escenario: Solo lo propio
  Dado un Staff con Telegram vinculado y reservas suyas y ajenas
  Cuando pregunta su agenda
  Entonces la API devuelve solo las suyas, ordenadas por inicio, con servicio, cliente y estado

Escenario: Pide ocupación u otra agenda
  Dado un Staff vinculado
  Cuando pide la ocupación global, la agenda de otro o el catálogo completo de asociaciones
  Entonces no recibe esos datos
```

### US-21 Enterarme de una cancelación o reprogramación

**Prioridad**: Must  
**Persona**: Staff  
**Requisitos**: FR-30, FR-40

Como Staff quiero saber cuando un Cliente cancela o mueve una reserva mía para no presentarme al hueco viejo.

```gherkin
Escenario: Aviso al cambiar
  Dado un Staff con Telegram vinculado
  Cuando un Cliente cancela o reprograma una reserva de ese Staff
  Entonces recibe el hecho, el horario anterior y, si hubo reprogramación, el horario nuevo

Escenario: Preguntar después
  Dado ese cambio ya ocurrido
  Cuando el Staff lo pregunta por Telegram
  Entonces la respuesta usa el historial de sus reservas y no el de otro staff
```

### US-22 Consultar la operación por Telegram

**Prioridad**: Must  
**Persona**: Administrador  
**Requisitos**: FR-31, FR-41, FR-42

Como Administrador quiero preguntar ocupación, disponibilidad y qué staff presta cada servicio para mirarlo desde Telegram sin cambiar la agenda.

```gherkin
Escenario: Consultas de solo lectura
  Dado un Administrador con Telegram vinculado
  Cuando pregunta ocupación, disponibilidad o staff por servicio
  Entonces las respuestas salen de la API y cubren el negocio completo
  Y no se crea, cancela ni reprograma ninguna reserva

Escenario: Cliente o Staff pide lo mismo
  Dado un Cliente, o un Staff
  Cuando pide la ocupación global o el staff de todos los servicios
  Entonces no recibe el resultado de Administrador
```

## Épica: Facturación

### US-23 Marcar el servicio como prestado

**Prioridad**: Must  
**Personas**: Administrador, Staff  
**Requisitos**: FR-43, FR-44, FR-45, FR-50

Como quien atendió quiero marcar la reserva como prestada para que quede la factura del precio de ese momento.

```gherkin
Escenario: Precio mayor que cero
  Dado una reserva sin factura y un servicio con precio mayor que cero
  Cuando el Administrador, o el Staff asignado, la marca prestada en la web
  Entonces existe una sola factura vigente de esa reserva
  Y el monto en COP es el precio de ese momento
  Y el id fiscal externo está vacío
  Y un cambio posterior del precio del servicio no altera esa factura

Escenario: Precio cero
  Dado un servicio con precio cero
  Cuando se marca la reserva prestada
  Entonces no se crea factura

Escenario: Por Telegram o por otro staff
  Dado un intento de marcarla prestada desde Telegram, o un Staff que no es el asignado
  Cuando lo intenta
  Entonces no se crea la factura
```

### US-24 Pagar el servicio prestado

**Prioridad**: Must  
**Persona**: Cliente  
**Requisitos**: FR-31, FR-46, FR-48, FR-51, NFR-18

Como Cliente quiero un enlace de Wompi por el monto de mi factura para pagar el servicio que ya me prestaron.

```gherkin
Escenario: Enlace al emitir y al pedirlo
  Dado una factura propia en estado cobrable
  Cuando se emite, o cuando el Cliente pide el enlace
  Entonces recibe un checkout de Wompi
  Y el monto y la referencia los fija la API
  Y un mensaje con otro valor no cambia el monto

Escenario: Wompi no responde
  Dado un timeout de Wompi al crear el enlace
  Cuando el Cliente lo pide
  Entonces la factura no pasa a pagada
  Y la reserva prestada sigue registrada
  Y puede pedirlo de nuevo

Escenario: Datos de tarjeta
  Dado cualquier pago
  Cuando Wompi procesa el checkout
  Entonces hy10 no guarda número ni datos de tarjeta
```

### US-25 Registrar el pago una sola vez

**Prioridad**: Must  
**Persona**: Administrador  
**Requisitos**: FR-47, FR-48, NFR-16, NFR-18

Como Administrador quiero que un pago aprobado quede una sola vez en la factura para no cobrar dos veces el mismo servicio.

```gherkin
Escenario: Pago aprobado por el monto exacto
  Dado un webhook de Wompi con firma válida y monto igual al de la factura
  Cuando la API lo procesa
  Entonces la factura pasa a paid
  Y queda auditoría con actor Wompi y la referencia del evento

Escenario: Evento repetido o monto distinto
  Dado el mismo evento por segunda vez, o un monto que no coincide, o una firma inválida
  Cuando llega el webhook
  Entonces no se crea otro pago
  Y una firma inválida o un monto distinto no marcan la factura como paid

Escenario: Pago rechazado
  Dado un resultado rechazado con firma válida
  Cuando se procesa
  Entonces la factura sigue cobrable
```

### US-26 Consultar y anular facturas

**Prioridad**: Must  
**Persona**: Administrador  
**Requisitos**: FR-34, FR-49, FR-50

Como Administrador quiero ver facturas y pagos en un solo módulo para saber qué está cobrado y reenviar un enlace si hace falta.

```gherkin
Escenario: Listado
  Dado facturas con pagos
  Cuando el Administrador abre facturación
  Entonces ve cliente, servicio, reserva, monto, estado y referencia de Wompi
  Y el id fiscal externo puede ir vacío

Escenario: Anular o reenviar
  Dado una factura que no está paid
  Cuando la anula o reenvía el enlace
  Entonces la anulada queda void y no se cobra
  Y el reenvío manda de nuevo el enlace al Cliente

Escenario: Factura pagada o usuario Staff
  Dado una factura paid, o un usuario Staff
  Cuando intenta anularla o abrir el módulo
  Entonces la factura paid no pasa a void
  Y el Staff no entra al módulo
```

### US-27 Definir el horario del negocio

**Prioridad**: Must  
**Persona**: Administrador  
**Requisitos**: FR-52  
**Origen**: F03, recortado a un solo negocio

Como Administrador quiero fijar el horario de atención para que nadie ofrezca un turno con el negocio cerrado.

```gherkin
Escenario: Bloque fuera de horario
  Dado un horario de negocio ya guardado
  Cuando un Staff o el Administrador guarda un bloque que cae fuera
  Entonces el bloque se rechaza

Escenario: Slot
  Dado ese horario
  Cuando se calculan huecos
  Entonces ninguno cae fuera del horario del negocio
```

### US-28 Marcar que el cliente no vino

**Prioridad**: Must  
**Personas**: Administrador, Staff  
**Requisitos**: FR-53, FR-44  
**Origen**: F03. No consume token de plan: esa regla de F04 no aplica

Como quien atendía quiero marcar la reserva como no-show para que no se cobre un servicio que no se prestó.

```gherkin
Escenario: No-show
  Dado una reserva vigente
  Cuando el Administrador, o el Staff asignado, la marca no-show en la web
  Entonces el estado queda no_show
  Y no se crea factura

Escenario: Desde Telegram o por otro staff
  Dado un intento desde Telegram, o un Staff que no es el asignado
  Cuando lo intenta
  Entonces el estado no cambia
```

### US-29 Crear una reserva desde la web

**Prioridad**: Must  
**Personas**: Administrador, Staff  
**Requisitos**: FR-54, FR-21, NFR-01  
**Origen**: F03. La confirmación conversacional del Cliente se mantiene en US-12

Como miembro del equipo quiero agendar a un cliente desde la web para cubrir una reserva que no llegó por el bot.

```gherkin
Escenario: El Administrador agenda
  Dado un cliente existente, un servicio activo y un hueco libre
  Cuando el Administrador crea la reserva en la web
  Entonces queda guardada sin pedir el sí conversacional
  Y no se solapa con otra del mismo staff

Escenario: El Staff agenda
  Dado un Staff autenticado
  Cuando crea una reserva
  Entonces el staff de esa reserva es él mismo

Escenario: Hueco tomado
  Dado un hueco que ya no está libre
  Cuando intenta crearla
  Entonces la API la rechaza
```

### US-30 Silenciar avisos del bot

**Prioridad**: Must  
**Persona**: Cliente  
**Requisitos**: FR-55, FR-57  
**Origen**: F20, sin onboarding por teléfono ni cambio de canal

Como Cliente quiero poder pedir que paren los avisos, y que el bot solo acepte mensajes del negocio configurado.

```gherkin
Escenario: STOP o BAJA
  Dado un Cliente que recibe avisos
  Cuando envía STOP o BAJA
  Entonces queda en opt-out
  Y no salen más avisos proactivos
  Y si vuelve a escribir, la conversación puede seguir

Escenario: Webhook
  Dado un POST al webhook sin el secreto del bot
  Cuando llega
  Entonces no se procesa como mensaje del Cliente
```

### US-31 Consultar la auditoría

**Prioridad**: Must  
**Persona**: Administrador  
**Requisitos**: FR-56, NFR-07, NFR-16  
**Origen**: F11, sin eventos de tenant ni de suscripción, y sin alargar la retención

Como Administrador quiero ver quién cambió una reserva, una factura o la configuración para reconstruir lo que pasó.

```gherkin
Escenario: Consulta
  Dado eventos de reserva, factura, invitación o configuración
  Cuando el Administrador filtra por acción y fechas
  Entonces ve actor, momento, valor anterior y valor nuevo
  Y el log no muestra contraseñas, tokens ni datos de tarjeta

Escenario: Staff
  Dado un usuario Staff
  Cuando abre la auditoría
  Entonces el servidor lo rechaza
```

### US-32 Enviar una nota de voz

**Prioridad**: Must  
**Personas**: Cliente, Staff, Administrador  
**Requisitos**: FR-09, FR-10, FR-59, FR-57, NFR-18  
**Origen**: F20. Solo entra la voz. La respuesta del bot sigue en texto

Como quien habla con el bot quiero mandar una nota de voz para no tener que escribir, y que se trate igual que un mensaje.

```gherkin
Escenario: Nota dentro del límite
  Dado un telegram_user_id ya resuelto como Cliente, Staff o Administrador
  Y una nota de voz de a lo sumo voice_note_max_seconds
  Cuando llega al bot
  Entonces se transcribe a texto
  Y ese texto sigue el mismo flujo y el mismo rol que un mensaje escrito
  Y la respuesta del bot es texto

Escenario: Demasiado larga o transcripción fallida
  Dado una nota más larga que el límite, o un transcriptor que no responde
  Cuando llega al bot
  Entonces no se ejecuta ninguna tool
  Y se pide que lo escriba
  Y no se confirma un horario inventado

Escenario: Audio y secreto
  Dado cualquier nota de voz
  Cuando se procesa
  Entonces el audio no queda en el log
  Y la clave del transcriptor no sale del backend
```

## Trazabilidad

| Requisito | Historia |
|-----------|----------|
| FR-01, FR-02, FR-03, FR-05 | US-01 |
| FR-04 | US-02 |
| FR-06, FR-27, FR-29 | US-06 |
| FR-07 | US-03 |
| FR-08 | US-01, US-05 |
| FR-09, FR-10, FR-11 | US-07, US-15, US-16, US-19 |
| FR-12, FR-13 | US-08 |
| FR-14 | US-09 |
| FR-15, FR-17 | US-10, US-11, US-12 |
| FR-16 | US-08, US-09 |
| FR-18, FR-19, FR-20, FR-21 | US-12 |
| FR-22, FR-25 | US-13, US-14, US-17 |
| FR-23, FR-24 | US-14 |
| FR-26 | US-15 |
| FR-28, FR-30 | US-05, US-13, US-14, US-19, US-21 |
| FR-31 | US-12, US-20, US-22, US-24 |
| FR-32, FR-33 | US-16 |
| FR-34 | US-11, US-17, US-26 |
| FR-35 | Fuera de este ciclo (Should) |
| FR-36, FR-37 | US-18 |
| FR-38 | US-19 |
| FR-39, FR-42 | US-20, US-22 |
| FR-40 | US-21 |
| FR-41 | US-22 |
| FR-43, FR-44, FR-45, FR-50 | US-23, US-26 |
| FR-46, FR-48, FR-51 | US-24 |
| FR-47 | US-25 |
| FR-49 | US-26 |
| FR-52 | US-27 |
| FR-53 | US-28 |
| FR-54 | US-29 |
| FR-55, FR-57 | US-30 |
| FR-59 | US-32 |
| FR-56 | US-31 |
| FR-58 | US-08, US-09 |
| NFR-25 | Sin historia de usuario. Restricción técnica para cuando exista código |
| NFR-01 | US-12 |
| NFR-11, NFR-12, NFR-13, NFR-15 | US-01, US-03, US-04 |
| NFR-14 | US-12, US-13, US-17, US-18, US-20 |
| NFR-16 | US-07, US-25 |
| NFR-18 | US-12, US-16, US-24, US-25, US-32 |

NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-07, NFR-08, NFR-09, NFR-10, NFR-17, NFR-19, NFR-20, NFR-21, NFR-22, NFR-23 y NFR-24 no son objetivos de una persona. Siguen vigentes en `requirements.md` para el diseño y la construcción.
