# Requirements Clarification Questions — hy10

Las 13 respuestas de `requirement-verification-questions.md` están completas. Antes de redactar `requirements.md` hay un conflicto de autenticación con HiTurno y decisiones que la extensión de resiliencia exige que elijas tú.

## Contradiction 1: Autenticación Admin/Staff
El PRD (`specs/prd.md`, D7 y el Must de Auth) dice **Supabase Auth** con email + contraseña y Google.

HiTurno (https://github.com/garestrepop/hiturno, F01 y README) usa **JWT propio**: email + contraseña, Google y Apple, token de cuenta y token de negocio. No usa Supabase Auth.

### Clarification Question 1
¿Qué mecanismo de autenticación queda en la especificación de hy10 para Admin y Staff?

A) Supabase Auth: email + contraseña y Google. El reuso de HiTurno cubre dominio, agente, invitaciones y notificaciones, no el esquema de tokens propios ni el cambio de negocio

B) Auth propia al estilo F01, recortada a un solo negocio: email + contraseña y Google, JWT de aplicación, sin Supabase Auth y sin token de tenant

C) Auth propia al estilo F01, incluyendo Apple además de Google, sin Supabase Auth y sin token de tenant

D) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 2
¿Cuáles son el RTO y el RPO, y qué estrategia de recuperación ante desastres corresponde? Definen la redundancia. No certifican por sí solos que el sistema esté listo para producción.

A) RPO/RTO de horas — Backup y restore. Menor costo. Datos respaldados, servicios no desplegados en el sitio de recuperación. Ante fallo se redespliega y se restaura el backup. Adecuado para cargas no críticas

B) RPO/RTO de decenas de minutos — Pilot light. Costo medio. Datos en vivo, servicios apagados y listos para escalar en el failover

C) RPO/RTO de minutos — Warm standby. Costo alto. Datos en vivo, servicios corriendo con capacidad reducida

D) RPO/RTO casi en tiempo real — Active/active en varios sitios. Costo máximo

E) N/A — Un solo región es aceptable. No hace falta recuperación entre regiones. Se confía en varias zonas de disponibilidad dentro de una región

F) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
¿El despliegue es de una sola región o de varias?

A) Una región, varias zonas — tolera la caída de una zona, no la de la región entera. Menor costo

B) Varias regiones, active-passive — sobrevive a la caída de una región mediante failover. Mayor costo

C) Varias regiones, active-active — sobrevive a la caída de una región sin downtime. Costo máximo

D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4
¿Cómo se gobiernan los cambios a producción?

A) Usar un proceso organizacional que ya existe (indica nombre o herramienta después de [Answer]:)

B) No hay proceso formal — la especificación debe proponer uno liviano: registro del cambio, aprobación y nota de rollback

C) N/A — esta carga está exenta de gestión de cambios formal (documenta el motivo después de [Answer]:)

D) Other (please describe after [Answer]: tag below)

[Answer]: A GitHub,  Linear

## Question 5
¿Qué herramienta de CI/CD usa esta carga?

A) GitHub Actions, como ya fija el PRD

B) No hay pipeline — la especificación debe proponer uno

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6
¿Cómo se revierte un despliegue de producción que falla?

A) Redesplegar la versión anterior del artefacto (rollback por versión fijada)

B) Volver al entorno anterior con un intercambio blue/green

C) Rollback automático de un canary si salud o métricas empeoran

D) Hace falta rollback que contemple la base de datos (reversa de migraciones). Debe diseñarse aparte

E) Usar un procedimiento de rollback que ya existe (indica la referencia después de [Answer]:)

F) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
¿Qué estilo de despliegue es aceptable?

A) Directo, in-place — menor costo, mayor radio de impacto

B) Rolling — reemplazo gradual de instancias

C) Blue/green — corte sin downtime, mayor costo

D) Canary — desplazamiento progresivo de tráfico con rollback automático

E) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 8
¿Cómo se atienden los incidentes de producción?

A) Usar un proceso que ya existe (indica la referencia después de [Answer]:)

B) No hay proceso formal — la especificación debe proponer una respuesta a incidentes liviana y un mecanismo de corrección de errores

C) Other (please describe after [Answer]: tag below)

[Answer]: B
