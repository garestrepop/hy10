# Unit of Work Plan — hy10

## Objetivo

Partir hy10 en unidades de trabajo. Una unidad agrupa historias para construirlas. No es, por sí sola, un microservicio.

El diseño ya cerrado es un monolito modular más una web. La API no se parte en servicios desplegables. Estas preguntas fijan cuántas unidades hay, cómo se hablan, quién las posee y dónde viviría el código.

## Categorías evaluadas

- Agrupación de historias: pregunta 1 y pregunta 5.
- Dependencias: pregunta 2.
- Alineación de equipo: pregunta 3.
- Consideraciones técnicas: van dentro de la pregunta 1. La API sigue en un proceso (mínimo 1, máximo 2 instancias). La web ya se despliega aparte.
- Dominio de negocio: la pregunta 1 usa las capacidades del diseño. No se abre otra pregunta de bounded context.
- Organización de código: pregunta 4. El workspace de hy10 no tiene código de aplicación; el baseline es el monorepo de HiTurno.

## Preguntas

Responde con la letra después de `[Answer]:`. Si ninguna opción encaja, elige Other y descríbela.

## Question 1
¿Cómo se cortan las unidades de trabajo?

A) Una sola unidad: el sistema completo. Los módulos del diseño quedan como agrupación lógica dentro de esa unidad

B) Dos unidades, que son las dos cosas que se despliegan: Web y API. Dentro de la API, los módulos siguen siendo agrupación lógica

C) Una unidad por capacidad, para planificar el trabajo, sin convertir la API en microservicios: Acceso, Catálogo y agenda, Reservas y clientes, Telegram y agente, Facturación, Plataforma (configuración, secretos, auditoría y avisos) y Web

D) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 2
Si hay más de una unidad, ¿cómo se relacionan?

A) Una sola base Postgres y llamadas dentro del mismo proceso de API. Ninguna unidad de la API tiene base ni despliegue propio. Si en la pregunta 1 elegiste una sola unidad, esta opción también aplica

B) Cada unidad de la API tiene su esquema, pero comparten el mismo Postgres y el mismo proceso

C) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3
¿Quién construye las unidades?

A) Una persona. El orden de las unidades es una secuencia, no un reparto de equipos

B) Varias personas. Cada unidad tiene un dueño distinto

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4
¿Dónde viviría el código de hy10 cuando se genere, fuera de este ciclo?

A) Monorepo al estilo de HiTurno: `apps/web`, `apps/api` y `packages` solo si hace falta. Los módulos de la API viven dentro de `apps/api`

B) Dos proyectos separados, web y API, sin monorepo

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
Cuando una historia toca más de una unidad, ¿dónde se asigna?

A) A la unidad que posee la regla de negocio. Las demás unidades quedan como dependencia, sin duplicar la historia

B) Se copia la historia en cada unidad que participa

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Ejecución (después de aprobar este plan)

- [x] Confirmar que las respuestas no son ambiguas
- [x] Redactar `aidlc-docs/inception/application-design/unit-of-work.md` con definición, responsabilidades y, por ser workspace nuevo, la estrategia de carpetas
- [x] Redactar `aidlc-docs/inception/application-design/unit-of-work-dependency.md` con la matriz de dependencias
- [x] Redactar `aidlc-docs/inception/application-design/unit-of-work-story-map.md` asignando US-01 a US-32
- [x] Validar límites y dependencias
- [x] Comprobar que ninguna historia quede sin unidad
- [x] Marcar estos pasos al terminarlos
