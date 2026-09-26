# Requirements Clarification Questions — hy10

El PRD v0.2 (`specs/prd.md`) y las decisiones D1–D7 están cerradas. Estas preguntas cubren solo lo que cambia la especificación: el alcance de este ciclo, los micro-pendientes que el PRD deja abiertos, y las extensiones del framework.

Responde cada pregunta con la letra después de `[Answer]:`. Si ninguna opción encaja, elige la última (Other) y describe tu preferencia en la misma línea.

## Question 1
¿Qué debe producir este ciclo de AI-DLC?

A) La especificación SDD de Inception (requisitos, historias, plan, diseño de aplicación y unidades de trabajo), sin generar código

B) La especificación de Inception y, después de aprobarla, continuar a Construction (diseño detallado y código)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
El PRD dice reusar patrones de HiTurno, pero ese código no está en este workspace. ¿Cómo tratamos ese reuso en la especificación?

A) Reuso conceptual: la especificación describe los patrones (datos sin tenancy, auth, Telegram, agente, invitaciones, notificaciones) sin analizar un repo de HiTurno

B) Hay un repo o ruta de HiTurno que debo analizar antes de cerrar requisitos (indica la ruta después de [Answer]:)

C) Other (please describe after [Answer]: tag below)

[Answer]: B https://github.com/garestrepop/hiturno

## Question 3
¿Cuál es el algoritmo de auto-asignación de staff en el MVP?

A) Primer hueco disponible entre el staff asociado al servicio (default propuesto en D4)

B) Menor carga: el staff del servicio con menos reservas en el periodo

C) Round-robin entre el staff elegible del servicio

D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4
¿Qué parámetros de cancelación y reprogramación entran en el catálogo v1 (global, con override por servicio)?

A) `allow_cancel`, `allow_reschedule`, `cancel_min_hours`, `reschedule_min_hours`, `max_reschedules`

B) Solo `allow_cancel`, `allow_reschedule`, `cancel_min_hours`, `reschedule_min_hours` (sin tope de reprogramaciones)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
¿Qué proveedores LLM incluye el catálogo v1 del módulo Configuración?

A) OpenAI y Anthropic, con un modelo default configurable

B) Solo OpenAI, con modelo default configurable

C) Other (please describe after [Answer]: tag below)

[Answer]: C solo modelo configurable

## Question 6
¿Cuál es la zona horaria default del negocio hasta que el Admin la cambie en Configuración?

A) America/Bogota

B) UTC

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
Si el cliente abandona una reserva a medias, ¿cuándo expira la sesión de conversación sin crear reserva?

A) 30 minutos

B) 60 minutos

C) Other (please describe after [Answer]: tag below)

[Answer]: C Por parametro en modulo de configuración

## Question 8
¿Tras cuántos intentos fallidos de resolver una ambigüedad el agente hace handoff?

A) 2 intentos

B) 3 intentos

C) Other (please describe after [Answer]: tag below)

[Answer]: C Por parametro de Configuración

## Question 9
¿Qué retención de datos personales aplica en el MVP (perfil Telegram, mensajes, logs de tools)?

A) Conservar mientras la cuenta del cliente esté activa; sin borrado automático en el MVP. Documentar el pendiente de política formal

B) Retención de 12 meses para mensajes y logs; el perfil se conserva mientras el cliente esté vinculado

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 10
El PRD exige 0 doble bookings y no fija latencia ni disponibilidad. ¿Qué objetivos numéricos usamos en la especificación del MVP?

A) Cero doble bookings; p95 de respuesta del agente menor a 8 segundos; disponibilidad objetivo 99% mensual, sin compromiso contractual

B) Cero doble bookings; el resto de metas queda cualitativo hasta el piloto (sin números de latencia ni disponibilidad)

C) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 11
¿Se aplican las reglas de la extensión Security Baseline como restricciones bloqueantes?

A) Sí — aplicar todas las reglas SECURITY como restricciones bloqueantes (recomendado para una aplicación que irá a producción)

B) No — omitir las reglas SECURITY (adecuado para PoC, prototipos y experimentos)

C) Other (please describe after [Answer]: tag below)

[Answer]:  A

## Question 12
¿Se aplica la línea base de resiliencia?

Esta extensión aporta prácticas de diseño (tolerancia a fallos, disponibilidad, observabilidad y recuperación) derivadas del AWS Well-Architected Framework. No certifica un RTO/RPO ni deja el sistema listo para producción por sí sola.

A) Sí — aplicar la línea base como guía de diseño (punto de partida para un sistema de negocio)

B) No — omitir la línea base (adecuado si importa más iterar rápido que la fiabilidad)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 13
¿Se aplican las reglas de property-based testing?

A) Sí — aplicar todas las reglas de property-based testing como restricciones bloqueantes (lógica de reservas, políticas y serialización)

B) Parcial — aplicarlas solo a funciones puras y round-trips de serialización

C) No — omitirlas

D) Other (please describe after [Answer]: tag below)

[Answer]: B
