# Story Generation Plan — hy10

## Objetivo

Convertir `aidlc-docs/inception/requirements/requirements.md` en personas e historias centradas en el usuario. Esta parte solo fija el método. Las historias se escriben después de que este plan esté respondido y aprobado.

## Enfoques posibles

| Enfoque | Qué agrupa | Cuándo conviene |
|---------|------------|-----------------|
| Por recorrido | El flujo de punta a punta (reservar, cobrar, consultar) | Cuando el valor está en la secuencia |
| Por funcionalidad | Auth, catálogo, agenda, reservas, Telegram, facturación | Cuando cada módulo se quiere leer aparte |
| Por persona | Todo lo que hace Admin, luego Staff, luego Cliente | Cuando el permiso y el canal cambian el comportamiento |
| Por épica | Épica de dominio y, debajo, historias de un objetivo | Cuando hace falta ambos: módulo e historia pequeña |
| Híbrido | Épicas de dominio, cada historia contada desde la persona | Cuando el sistema tiene módulos y tres roles |

## Preguntas

Responde con la letra después de `[Answer]:`. Si ninguna opción encaja, elige Other y descríbela en la misma línea.

## Question 1
¿Cómo se parten las historias?

A) Por persona y, dentro de cada persona, por recorrido

B) Por épica de dominio (acceso, catálogo, agenda, reservas, Telegram del equipo, facturación) con historias de un objetivo debajo

C) Por recorrido de punta a punta, aunque cruce personas

D) Híbrido: épicas de dominio, y cada historia escrita desde el objetivo de una persona

E) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 2
¿Qué tamaño tiene una historia?

A) Un objetivo de usuario. Varios requisitos pueden caber en la misma historia si se prueban juntos

B) Una historia por cada requisito FR

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
¿Cómo se escriben los criterios de aceptación?

A) Gherkin: Dado / Cuando / Entonces

B) Lista de condiciones comprobables, sin Gherkin

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4
¿Qué alcance entran en las historias de este ciclo?

A) Solo lo Must del MVP

B) Must y Should, con la prioridad marcada en cada historia

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
¿Cuántas personas se documentan?

A) Tres: Administrador, Staff y Cliente. El dueño del negocio es el Administrador

B) Cuatro: el dueño queda separado del Administrador que opera el día a día

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6
¿En qué idioma se redactan personas e historias?

A) Español

B) Inglés

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
¿Dónde viven los rechazos (permiso, política, hueco ocupado, webhook repetido, rol de Telegram)?

A) Dentro de la historia que los provoca, como criterios de aceptación

B) Solo en los requisitos. Las historias cubren el camino feliz

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 8
¿Las historias citan los requisitos que cubren?

A) Sí. Cada historia lista los identificadores FR y NFR que satisface

B) No. La historia se lee sola, sin identificadores de requisitos

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Ejecución (después de aprobar este plan)

- [x] Leer las respuestas de este plan y confirmar que no quedan ambigüedades
- [x] Redactar `aidlc-docs/inception/user-stories/personas.md` con los arquetipos aprobados
- [x] Redactar `aidlc-docs/inception/user-stories/stories.md` con el corte, el tamaño, el formato de aceptación y el alcance aprobados
- [x] Cumplir INVEST: independiente, negociable, valiosa, estimable, pequeña y comprobable
- [x] Incluir criterios de aceptación en cada historia
- [x] Mapear cada persona a las historias que le corresponden
- [x] Marcar estos pasos al terminarlos
