# Requirements — hy10

## Intent Analysis

| Campo | Valor |
|-------|-------|
| User request | Construir la especificación SDD de hy10 a partir de `specs/prd.md` |
| Request type | New project |
| Scope estimate | System-wide |
| Complexity estimate | Complex |
| Depth | Comprehensive |
| Cycle scope | Solo artefactos de Inception. Este ciclo no genera código de aplicación |

**Fuentes**: `specs/prd.md` v0.2, `docs/00-overview.md`, `docs/01-decisions.md`, respuestas en `requirement-verification-questions.md` y `requirement-clarification-questions.md`, análisis en `hiturno-reuse-analysis.md`.

## Resumen

hy10 es el sistema de citas de un solo negocio. Admin y Staff operan la aplicación web y, con su Telegram vinculado, consultan la operación en el mismo bot. El Cliente reserva, cancela y reprograma por Telegram, y paga el servicio ya prestado con un enlace de Wompi. El agente ejecuta tools contra la API. La API es la autoridad de disponibilidad, políticas, permisos y montos.

## Actores

| Actor | Acceso | Identidad |
|-------|--------|-----------|
| Administrador | Web y Telegram | Cuenta email + contraseña o Google. Telegram opcional, vinculado a esa cuenta |
| Staff | Web y Telegram | Cuenta email + contraseña o Google. Telegram opcional, vinculado a esa cuenta |
| Cliente | Telegram | `telegram_user_id`. Sin login web |
| Sistema | API, agente, notificaciones | Procesos internos |

## Decisiones incorporadas

| Tema | Decisión |
|------|----------|
| Alcance del ciclo | Especificación de Inception, sin código |
| Reuso HiTurno | Patrones de las specs F03, F05, F08, F09 y F20. Sin analizar código de `apps/` como fuente de verdad |
| Auth | Propia, un solo negocio: email + contraseña y Google. JWT de aplicación. Sin Supabase Auth, sin Apple, sin token de tenant |
| Datos | Postgres en Supabase. Sin `tenant_id` |
| Auto-asignación | Primer hueco disponible entre el staff del servicio |
| Políticas v1 | `allow_cancel`, `allow_reschedule`, `cancel_min_hours`, `reschedule_min_hours`, `max_reschedules`. Override de servicio gana; si el campo es nulo, vale el global |
| LLM | El Admin configura el identificador de modelo. No hay catálogo de proveedores en la UI. La clave vive solo en secretos del backend |
| Zona horaria default | `America/Bogota` |
| Sesión de conversación | Parámetro `conversation_session_ttl_minutes`. Default 60. Al expirar no se crea reserva |
| Handoff por ambigüedad | Parámetro `handoff_ambiguity_attempts`. Default 3 |
| Retención de perfil y mensajes | Mientras el cliente esté vinculado. Sin borrado automático en el MVP |
| Metas numéricas | Cero doble reservas. Latencia y disponibilidad del piloto quedan cualitativas |
| RPO / RTO | Horas. Estrategia Backup and Restore |
| Topología | Una región, varias zonas, apoyada en la redundancia gestionada de Supabase, Vercel y Railway |
| Cambios a producción | Linear (issue) + GitHub (PR y Actions). No se inventa otro proceso |
| CI/CD | GitHub Actions |
| Rollback | Redesplegar el artefacto de la versión anterior |
| Estilo de despliegue | Directo, in-place |
| Incidentes | Proceso liviano propuesto en este documento. Seguimiento en Linear |
| Telegram del equipo | Mismo bot. Staff recibe avisos del próximo turno y de cancelaciones o reprogramaciones propias, y consulta su agenda. El Admin consulta ocupación, disponibilidad y staff por servicio. Esas consultas son de solo lectura |
| Cobro al cliente | El Cliente paga el servicio después de prestado, por enlace de Wompi. No es un depósito para reservar |
| Facturación | Módulo simple de facturas y pagos. La factura interna es la fuente de verdad. Un conector hacia ERP o facturador externo queda para después; el modelo ya reserva el id externo |

## Herencia de HiTurno

hy10 nace como producto nuevo: un CRM de un solo negocio. No es el SaaS HiTurno. Las features y los ADR de [HiTurno](https://github.com/garestrepop/hiturno) actualizan esta especificación solo donde no chocan con lo ya cerrado.

| Fuente | Qué pasa en hy10 |
|--------|------------------|
| F01, ADR-02 | Se mantiene la auth propia, sin Supabase Auth. Email + contraseña y Google. JWT de aplicación. Sin Apple |
| ADR-01, F02 | No se adopta la cuenta multi-negocio, el token de tenant ni el aislamiento por `tenant_id` |
| F03 | Se mantiene el núcleo de servicios, staff, horarios, solape y reservas. Se agregan el horario del negocio, el no-show y el alta de reserva desde la web |
| F04, constitución §5 | No se adoptan planes, tokens de cita ni suscripción. Se mantiene la factura del servicio ya prestado y Wompi |
| F05, ADR-11 | Se mantiene que el agente solo usa tools. No se adopta el catálogo Anthropic/Gemini ni el par fast/smart. El Admin sigue configurando solo el modelo |
| F06, ADR-18, ADR-19, ADR-20 § teléfono, ADR-22 | No se adopta WhatsApp, ni el OTP de teléfono, ni el canal conmutable. El Cliente sigue siendo `telegram_user_id` |
| F08 | Se mantiene la invitación de Staff por email. El Cliente no entra por cuenta web |
| F09 | Se mantienen los avisos por evento. El canal del Cliente es Telegram |
| F10, F17, F18 | No se adopta el CRM de plataforma ni el marketing SaaS |
| F11 | Se adopta el log append-only, sin secretos, consultable por el Admin. No se adoptan los plazos de 5, 2 y 1 año. La retención sigue en NFR-07 |
| F12 | Se adapta a la configuración de este único negocio |
| F14–F16, ADR-14, ADR-15, ADR-17 | La UI de hy10 sigue siendo nueva. No se copian las pantallas de HiTurno |
| F20 | Se adopta un solo bot, el webhook, el límite por usuario, el opt-out y la nota de voz entrante. La respuesta del bot sigue siendo texto. No se adopta el enrutado por tenant ni la voz de respuesta |
| Constitución §2 y §3, ADR-13 | Para cuando haya código: monolito modular, API bajo `/api/v1`, `snake_case`, soft delete, y el SDK de Wompi o del modelo solo dentro de su adaptador. Sin RLS por tenant |

## Requisitos funcionales

### Auth y acceso

- **FR-01** Admin y Staff se registran e inician sesión con email + contraseña o con Google.
- **FR-02** Un email existe una sola vez.
- **FR-03** La sesión de aplicación es un JWT validado en el servidor en cada request (firma, expiración, emisor y audiencia). El access token dura 15 minutos. El refresh token dura 2 días y se rota al usarse.
- **FR-04** Cerrar sesión invalida el refresh token de ese dispositivo. Existe cierre de sesión de todos los dispositivos.
- **FR-05** No hay selector de negocio ni cambio de tenant.
- **FR-06** El Cliente no tiene cuenta web ni JWT. Su identidad es `telegram_user_id`. Un `telegram_user_id` vinculado a Admin o Staff no se trata como Cliente.
- **FR-07** La recuperación de contraseña es por email, con enlace de un solo uso y expiración.
- **FR-08** Las rutas de Admin y Staff exigen autenticación. La autorización de rol se evalúa en el servidor.

### Configuración

- **FR-09** El Admin edita la configuración global: zona horaria, modelo LLM, políticas de cancelación y reprogramación, TTL de sesión de conversación, umbral de intentos de handoff, antelación del aviso al staff (`staff_upcoming_notice_minutes`) y duración máxima de una nota de voz (`voice_note_max_seconds`).
- **FR-10** Defaults iniciales: zona horaria `America/Bogota`, `conversation_session_ttl_minutes` = 60, `handoff_ambiguity_attempts` = 3, `staff_upcoming_notice_minutes` = 30, `voice_note_max_seconds` = 60. Las políticas no tienen default que permita cancelar o reprogramar fuera de una ventana; el Admin debe guardar valores explícitos antes de que el agente ofrezca esas acciones.
- **FR-11** La clave del proveedor LLM no se guarda en la base ni se envía al navegador. Vive en el almacén de secretos del backend. La UI no muestra un catálogo de proveedores; solo el identificador de modelo.
- **FR-12** Un servicio puede dejar en nulo cualquier parámetro de política. Nulo significa “usar el global”. Un valor definido en el servicio reemplaza al global solo para ese parámetro.

### Catálogo, staff y agenda

- **FR-13** El Admin crea, edita y desactiva servicios: nombre, descripción, duración en minutos, precio en COP, estado activo y overrides de política. El precio es un entero de centavos, mayor o igual a cero.
- **FR-14** El Admin registra staff, lo activa o desactiva, y lo asocia a uno o más servicios.
- **FR-15** Cada staff tiene disponibilidad semanal por bloques y excepciones (bloqueo o apertura). El staff edita la suya. El Admin edita todas.
- **FR-16** Un servicio inactivo o un staff inactivo no se ofrece para reservas nuevas. El historial se conserva.
- **FR-17** El cálculo de slots cruza horario del staff, excepciones, servicio que puede prestar y reservas existentes. El resultado es la única disponibilidad que el agente puede decir.

### Reservas

- **FR-18** Una reserva une servicio, staff, cliente y inicio. La duración sale del servicio.
- **FR-19** El Cliente elige staff entre quienes prestan el servicio y tienen hueco, o pide auto-asignación. La auto-asignación toma el primer hueco disponible entre ese staff.
- **FR-20** Crear, cancelar y reprogramar exigen confirmación explícita del Cliente antes de la llamada que muta.
- **FR-21** Crear una reserva es atómico: si el hueco ya no está libre, la API rechaza y no deja dos reservas solapadas del mismo staff.
- **FR-22** Cancelar y reprogramar respetan la política resuelta (servicio, si no global). Si la política no se cumple, la API rechaza y no cambia la reserva.
- **FR-23** Reprogramar es una sola transacción: la reserva queda en el nuevo inicio y el hueco anterior queda libre, sin solaparse con otra reserva del staff.
- **FR-24** `max_reschedules` cuenta reprogramaciones exitosas de esa reserva. Al llegar al tope, la API rechaza otra reprogramación.
- **FR-25** El Cliente solo opera sus reservas. El Staff opera las asignadas a él. El Admin opera todas.
- **FR-26** Si la sesión de conversación expira a media reserva, no se crea reserva.

### Clientes, invitaciones, notificaciones y agente

- **FR-27** El primer contacto de un `telegram_user_id` desconocido, que no esté en un vínculo de Admin o Staff, crea un cliente con perfil mínimo (id de Telegram y nombre que entrega Telegram). El teléfono es opcional.
- **FR-28** El Admin invita Staff por email. El token es opaco, de un solo uso, con 7 días de vigencia. Aceptar crea la cuenta si no existe, o exige login si el email ya tiene cuenta, y asigna el rol Staff.
- **FR-29** La invitación de Cliente es un vínculo de Telegram, no una cuenta web.
- **FR-30** El sistema notifica creación, cancelación, reprogramación, invitación de staff y handoff. El canal del Cliente es Telegram. La invitación de Staff sigue por email. Si el Staff tiene Telegram vinculado, la cancelación y la reprogramación de una reserva suya también le llegan por Telegram. El detalle de plantillas de email adicionales es Should.
- **FR-31** El agente solo lee o muta el sistema mediante tools de la API. No escribe la base por su cuenta. Las tools de mutación de agenda (crear, cancelar, reprogramar) siguen reservadas al Cliente sobre sus reservas. El Cliente también puede pedir el enlace de pago de una factura propia. Las tools de Admin y Staff en Telegram son de lectura, con el alcance de FR-39 y FR-41.
- **FR-32** El agente hace handoff solo si no puede resolver: fallo de tool, ambigüedad tras `handoff_ambiguity_attempts`, petición fuera de dominio, o error de sistema. Marca la conversación `escalated`, avisa a Admin o Staff y se lo dice al Cliente.
- **FR-33** No hay menú “hablar con un humano” en el camino feliz del MVP.

### Web

- **FR-34** Pantallas Must: login, dashboard de ocupación, servicios, staff con asociación a servicios, agenda propia y agenda global (Admin), reservas (lista y detalle), facturación (Admin), configuración (Admin).
- **FR-35** Historial de conversaciones en el panel Admin es Should.

### Telegram de Staff y Admin

- **FR-36** Admin y Staff vinculan su Telegram desde la web, ya autenticados. El vínculo es un código o enlace de un solo uso y de corta vigencia. Un `telegram_user_id` queda ligado como máximo a un usuario interno.
- **FR-37** Sin vínculo, la web sigue funcionando y no salen avisos de Telegram para ese usuario. Con vínculo, el bot resuelve el rol en el servidor a partir de ese id. El texto del mensaje no elige el rol.
- **FR-38** El Staff con Telegram vinculado recibe un aviso el número de minutos indicado en `staff_upcoming_notice_minutes` antes de cada reserva suya que siga vigente. El aviso sale de la reserva persistida: servicio, inicio en la zona horaria del negocio y nombre del cliente. No lo redacta el modelo como dato de agenda.
- **FR-39** El Staff pregunta por Telegram su agenda próxima. La API devuelve solo reservas asignadas a él, ordenadas por inicio, con servicio, cliente y estado.
- **FR-40** Cuando un Cliente cancela o reprograma una reserva de ese Staff, el Staff vinculado recibe un mensaje con el hecho, el horario anterior y, si hubo reprogramación, el horario nuevo. También puede preguntarlo después. La respuesta usa el historial de esa reserva y se limita a las suyas.
- **FR-41** El Admin con Telegram vinculado consulta, en solo lectura: ocupación, disponibilidad de la agenda y qué staff presta cada servicio. El alcance es el negocio completo. Esas respuestas salen de tools de la API.
- **FR-42** El Staff no consulta ocupación global, la agenda de otro staff ni el catálogo completo de asociaciones. El Admin no crea, cancela ni reprograma reservas desde Telegram en el MVP. El Cliente no accede a las tools de FR-39 ni FR-41.

### Facturación y pago del servicio

- **FR-43** El Admin o el Staff asignado marca una reserva como prestada desde la web. Esa acción no está en Telegram.
- **FR-44** Al marcarla prestada, si el precio del servicio es mayor que cero, el sistema crea una factura por esa reserva. El monto queda copiado en la factura y no cambia si después se edita el precio del servicio. Precio cero no genera factura.
- **FR-45** Hay como máximo una factura vigente por reserva. La factura guarda: id interno, reserva, cliente, servicio, staff, monto en COP, estado (`issued`, `payment_pending`, `paid`, `void`) y un id fiscal externo vacío.
- **FR-46** El Cliente paga por un checkout de Wompi. El enlace llega por Telegram al emitir la factura y cuando el Cliente lo vuelve a pedir. El monto y la referencia los fija la API. El mensaje del Cliente no define el valor.
- **FR-47** Wompi notifica el resultado a un webhook. La API verifica la firma, exige que el monto coincida con la factura y trata el mismo evento como idempotente: una repetición no crea otro pago ni vuelve a marcar la factura.
- **FR-48** Solo un pago aprobado por el monto exacto pasa la factura a `paid`. Un pago rechazado la deja cobrable. hy10 no guarda número de tarjeta ni datos de tarjeta.
- **FR-49** El módulo de facturación, visible solo para el Admin, lista facturas y sus pagos: cliente, servicio, reserva, monto, estado y referencia de Wompi. El Admin puede anular una factura que no esté `paid` y puede reenviar el enlace.
- **FR-50** La factura interna es la fuente de verdad. El id fiscal externo y un evento de salida (`invoice_issued`, `invoice_paid`, `invoice_voided`) quedan definidos para un conector posterior hacia un facturador o un ERP. Ese conector no forma parte del MVP.
- **FR-51** Las claves de Wompi viven solo en secretos del backend. Si Wompi no responde, la reserva prestada y la factura se conservan, y el Cliente puede pedir el enlace más tarde.

### Heredado de HiTurno y recortado a un negocio

- **FR-52** El Admin define el horario de atención del negocio. Un bloque de staff que cae fuera de ese horario es rechazado. Los slots también lo respetan.
- **FR-53** Una reserva puede marcarse `no_show` desde la web, por el Admin o por el Staff asignado. No genera factura. No se marca desde Telegram.
- **FR-54** El Admin crea una reserva desde la web para un cliente existente, con cualquier staff elegible. El Staff la crea solo consigo mismo. Valen el mismo solape y los mismos slots que en Telegram. Esta alta no pide la confirmación conversacional del Cliente. El camino del agente sí la sigue pidiendo.
- **FR-55** El webhook de Telegram comprueba el secreto del bot. Hay un límite de mensajes por `telegram_user_id`. `STOP` o `BAJA` marcan al Cliente como opt-out: cesan los avisos proactivos hasta que vuelva a escribir.
- **FR-56** Los cambios críticos se escriben en un log append-only, sin contraseñas, tokens ni datos de tarjeta. El Admin lo consulta filtrado por acción y fechas. El catálogo incluye acceso, invitaciones, reservas (crear, cancelar, reprogramar, prestada, no-show), facturas y configuración. No hay eventos de tenant ni de suscripción. Si el log no se puede escribir, la operación de negocio no se revierte por eso, y la falla queda en el log de aplicación.
- **FR-57** Hay un solo bot. El Admin lo conecta desde Configuración. El token queda solo en secretos del backend. El bot responde en texto. No enruta por tenant. No envía notas de voz de vuelta.
- **FR-59** Quien escribe al bot puede enviar una nota de voz. El sistema la descarga, la transcribe a texto y ese texto entra al mismo flujo que un mensaje escrito, con el mismo rol. Si dura más que `voice_note_max_seconds`, o si la transcripción falla, no se ejecuta ninguna tool: se pide que lo escriba. El audio no se guarda como dato de agenda y no se escribe en el log. La clave del transcriptor vive solo en secretos del backend.
- **FR-58** Servicios, staff, clientes y reservas no se borran físicamente. Desactivar o anular conserva el historial.
- **NFR-25** Cuando exista código, la API vive bajo `/api/v1`, en un monolito modular. El SDK del modelo y el de Wompi solo se importan dentro de su adaptador. Las columnas van en `snake_case`. Esto no reabre el catálogo de proveedores ni la multitenancy.

## Requisitos no funcionales

- **NFR-01** Cero doble reservas del mismo staff. Es el único objetivo numérico de fiabilidad del MVP.
- **NFR-02** Latencia del agente y disponibilidad mensual no tienen cifra de piloto. Se observan; no son criterio de aceptación numérico.
- **NFR-03** RPO y RTO de horas para API, base y web. Estrategia Backup and Restore.
- **NFR-04** Una sola región. La tolerancia a caída de zona la dan Supabase, Vercel y Railway en su despliegue multi-zona gestionado. No hay segundo región ni réplica cross-region.
- **NFR-05** Postgres cifrado en reposo y conexiones TLS 1.2 o superior. Tráfico web y API solo por HTTPS. La base acepta conexiones solo desde la API, no desde internet abierto. No hay VPC propia: la red es la de Supabase, Vercel y Railway.
- **NFR-06** Logs estructurados con timestamp, id de correlación, nivel y mensaje. Sin contraseñas, tokens, claves ni contenido que identifique al cliente más allá de un id interno.
- **NFR-07** Logs de seguridad y de auditoría se retienen al menos 90 días. La aplicación no puede borrar sus propios logs de auditoría.
- **NFR-08** La web envía `Content-Security-Policy` (mínimo `default-src 'self'`), `Strict-Transport-Security` con `max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy: strict-origin-when-cross-origin`.
- **NFR-09** Toda entrada de API se valida por esquema: tipo, longitud máxima, formato y tamaño de cuerpo. Las consultas a la base son parametrizadas.
- **NFR-10** CORS de la API solo permite el origen de la web. Las rutas autenticadas no usan origen comodín.
- **NFR-11** Contraseñas con mínimo 8 caracteres, rechazo contra lista de contraseñas filtradas, y hash adaptativo. MFA disponible para el rol Admin. El login tiene bloqueo o retraso progresivo tras intentos fallidos.
- **NFR-12** Cookies de sesión, si se usan, llevan `Secure`, `HttpOnly` y `SameSite`.
- **NFR-13** Errores hacia el usuario son genéricos. El detalle queda en el log.
- **NFR-14** Ante error de autorización, tool o base, la operación se niega. No hay fail-open.
- **NFR-15** Rate limit en login, webhook de Telegram y tools del agente.
- **NFR-16** Cambios críticos de reservas, facturas, pagos y configuración quedan en auditoría: actor, timestamp, y valor anterior y nuevo. En un pago, el actor del webhook es Wompi, con la referencia del evento.
- **NFR-17** Dependencias con lockfile, escaneo de vulnerabilidades en GitHub Actions, imágenes y acciones pinneadas (sin tag `latest`), y SBOM en el pipeline de producción cuando exista código.
- **NFR-18** Llamadas a Telegram, al transcriptor, al LLM, a Wompi y a la base tienen timeout. Si el LLM o la transcripción no responden, el agente no inventa horarios: informa el fallo y puede escalar. Si Wompi no responde, no se marca la factura como pagada.
- **NFR-19** API: mínimo 1 instancia y máximo 2 en el MVP. Web en el escalado gestionado de Vercel.
- **NFR-20** Cuotas a vigilar antes de producción: Supabase (conexiones y almacenamiento), Railway (réplicas y memoria), Vercel (ancho de banda), Telegram Bot API, Wompi y el proveedor del modelo configurado. Alarma al 80% de la cuota conocida.

## Clasificación de cargas

| Componente | Criticidad | Si no está disponible | Depende de | Lo consumen |
|------------|------------|------------------------|------------|-------------|
| Postgres (Supabase) | Critical | No hay reservas ni agenda | Plataforma Supabase | API |
| API | Critical | No se crean ni cambian citas; el agente no puede ejecutar tools | Postgres, secretos | Web, agente |
| Web Admin/Staff | High | El equipo no configura ni ve la agenda. El Cliente puede seguir en Telegram si la API vive | API | Admin, Staff |
| Agente y adaptador Telegram | High | Se pierden reservas del Cliente y las consultas y avisos del equipo. La web sigue operando | API, Telegram, LLM | Cliente, Staff, Admin |
| Notificaciones | Medium | La cita puede existir sin aviso inmediato | API, Telegram, email | Admin, Staff, Cliente |
| Proveedor LLM | High como dependencia | El agente degrada a handoff. No inventa slots | Red y secreto | Agente |
| Wompi | Medium | No se cobran facturas nuevas. Las citas y las facturas ya emitidas siguen | API, secreto | Cliente, módulo de facturación |

Impacto de negocio de API o base caídas: el negocio no toma ni modifica citas hasta restaurar. No hay efecto regulatorio identificado en el MVP. La facturación del MVP es un registro interno de cobro al cliente, no una factura electrónica.

## Recuperación

Estrategia: Backup and Restore, alineada a RPO/RTO de horas. No hay sitio de recuperación caliente. El costo se acepta porque el usuario eligió el nivel de horas para un solo negocio, no un objetivo de minutos.

Backups automáticos de Postgres, cifrados, retención 14 días. No hay réplica cross-region: el usuario eligió una sola región. La validación del backup es un restore de prueba manual al menos cada trimestre, registrado en Linear.

### Failover

1. Confirmar que la región o la base no sirven (health de la API y error de conexión a Postgres).
2. Abrir un issue de incidente en Linear.
3. Si el fallo es de aplicación, redesplegar con GitHub Actions el artefacto de la versión anterior.
4. Si el fallo es de datos, restaurar el backup de Supabase dentro de la misma región y volver a desplegar la versión conocida de la API.
5. Comprobar `GET /health` y `GET /health/ready` (ready incluye la base).
6. Crear una reserva de prueba y cancelarla.
7. Avisar al Admin del negocio por el canal que usen fuera del sistema.

### Failback

1. Corregir la causa en una rama y un PR enlazado al issue de Linear.
2. Desplegar esa versión con GitHub Actions en el mismo entorno.
3. Repetir las comprobaciones de health y la reserva de prueba.
4. Cerrar el incidente solo después de esas comprobaciones.

No hay failover automático entre regiones. El despliegue directo no intercambia entornos blue/green.

## Cambios, despliegue e incidentes

Un cambio a producción empieza en un issue de Linear y sigue en un pull request de GitHub que lo referencia. El merge a la rama de producción dispara GitHub Actions y despliega in-place en Vercel (web) y Railway (API). Las migraciones de base van en el mismo repositorio y son hacia adelante. El rollback elegido es volver a desplegar el artefacto anterior; no incluye reversa automática de migraciones. Una migración destructiva se trata como incidente y, si hace falta, restore del backup.

El mecanismo de despliegue es la configuración de Vercel, Railway y Supabase operada por GitHub Actions. No hay una herramienta de infraestructura como código aparte.

### Incidentes y corrección de errores

1. La alerta (fallos de login repetidos, 5xx de la API, fallos de tools, fallo de backup) abre o se asocia a un issue de Linear de tipo incidente.
2. Quien responde mitiga con el rollback de artefacto o con el restore descrito arriba.
3. Se avisa al Admin del negocio si las citas del día están afectadas.
4. En un plazo de 5 días hábiles el issue recoge qué pasó, a quién afectó, la causa y la acción correctiva. Ese registro es el mecanismo de corrección de errores.

## Salud y observabilidad

- **NFR-21** `GET /health` responde si el proceso vive. `GET /health/ready` comprueba Postgres. Railway usa ready para no enviar tráfico a una instancia que no alcanza la base.
- **NFR-22** Métricas mínimas de la API: latencia, tasa de error, solicitudes. Logs centralizados en la plataforma de Railway y de Vercel. Trazas entre web, API y agente mediante el id de correlación.
- **NFR-23** Alertas de fallo de autenticación repetido, acceso denegado reiterado, error de backup y caída del health ready. Esas alertas entran al proceso de incidentes en Linear. Una evaluación formal de postura de resiliencia queda para después del MVP.
- **NFR-24** Prueba sintética: un chequeo externo periódico de `GET /health` de la API y de la página de login.

## Property-based testing (parcial)

Se aplican como obligación de construcción futura, no en este ciclo de especificación, las reglas PBT-02, PBT-03, PBT-07, PBT-08 y PBT-09.

- Framework: **fast-check**, integrado al test runner de TypeScript. Debe estar en las dependencias cuando exista código.
- Round-trip: serialización JSON de los cuerpos de reserva, política y configuración; parseo y formato de instantes en la zona horaria del negocio.
- Invariantes: dos reservas del mismo staff no se solapan; la política resuelta es la del servicio si el campo está definido y la global si es nulo; reprogramar no aumenta el número de reservas activas de ese cliente para el mismo servicio; auto-asignación elige un staff asociado al servicio; una consulta de agenda de Staff solo contiene reservas de ese staff; el monto de una factura pagada es igual al único pago aprobado de esa factura; repetir el mismo evento de Wompi no cambia el monto cobrado.
- Generadores de dominio para servicio, staff, bloque horario y reserva, con límites reales (duración positiva, horas dentro del día).
- Shrinking activo y semilla registrada en CI.

PBT-01, PBT-04, PBT-05, PBT-06 y PBT-10 quedan como guía, no como bloqueo.

## Criterios de éxito del MVP

- El Admin inicia sesión, crea un servicio, asocia staff y define disponibilidad.
- El Cliente, por Telegram, reserva con staff elegido y con auto-asignación, y recibe confirmación solo después de un sí explícito.
- Cancelar y reprogramar cumplen la política y no producen solape.
- Un segundo intento sobre el mismo hueco falla.
- El agente no confirma un horario que la API no devolvió.
- El handoff ocurre cuando el agente no puede resolver, y no como botón del camino feliz.
- Un Staff vinculado recibe el aviso previo a su próximo turno y el aviso cuando un Cliente cancela o reprograma esa reserva.
- Ese Staff consulta por Telegram solo su agenda. Un Staff no ve la agenda de otro.
- Un Admin vinculado consulta por Telegram la ocupación, la disponibilidad y el staff de cada servicio, sin modificar reservas por ese canal.
- Al marcar una reserva como prestada, queda una factura con el precio del servicio en ese momento, y el Cliente recibe un enlace de Wompi por ese monto.
- Un no-show no genera factura.
- El Admin o el Staff pueden crear una reserva desde la web sin doble booking.
- Un webhook de Wompi repetido no deja la factura cobrada dos veces.
- El Admin ve en un solo módulo las facturas y sus pagos. El id fiscal externo puede ir vacío.
- `STOP` o `BAJA` detienen los avisos proactivos al Cliente.
- Una nota de voz dentro del límite se transcribe y se trata como el texto equivalente. Si falla, no se crea ni se cambia una reserva.

## Fuera de alcance

Multitenancy, `tenant_id`, planes y precios de SaaS, depósito para poder reservar, factura electrónica DIAN, notas crédito, conector real a un ERP o facturador externo, panel web del Cliente, app nativa, CRM de ventas, WhatsApp, Apple Sign-In, Supabase Auth, catálogo cerrado de proveedores LLM, menú explícito de humano, y copiar la UI de HiTurno.

## Reuso HiTurno

Se reutilizan como especificación de referencia, adaptados a un solo negocio y a Telegram: modelo de citas y slots de F03, agente con tools e interfaz de proveedor de F05, invitación de staff por email de F08, notificaciones por eventos de F09, y el canal Telegram de F20.

No se reutilizan tenants, el billing SaaS de F04 (tokens de plan y suscripción), WhatsApp como identidad, CRM de plataforma, marketing ni la UI actual. El cobro al Cliente por el servicio prestado es un módulo nuevo de hy10; Wompi entra ahí, no como facturación de la plataforma.

## Pendiente no bloqueante

Branding visual (logo y paleta) del negocio cliente. No cambia estos requisitos funcionales.
