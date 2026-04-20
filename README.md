# NETO - Plataforma Inteligente de Gestion de Gastos Personales

Proyecto academico de Ingenieria Web II (2026).

NETO es una plataforma web cliente-servidor para registrar, analizar y mejorar habitos de gasto personal, con soporte de OCR para tickets y funcionalidades de analisis para asesores.

## Descripcion del sistema

El sistema trabaja con tres roles:

- `USER`: registra gastos manualmente o desde ticket, consulta historial, visualiza estadisticas, administra presupuestos/metas y recibe recomendaciones.
- `ADVISOR`: visualiza usuarios, analiza patrones de consumo y crea recomendaciones financieras.
- `ADMIN`: administra usuarios, roles y estado de cuentas.

## Arquitectura

Arquitectura web cliente-servidor:

- Frontend: HTML, CSS y JavaScript vanilla (sin frameworks SPA)
- Backend: NestJS con API REST
- Persistencia: PostgreSQL con TypeORM

Patrones y decisiones aplicadas:

- `Controller-Service-Repository` en backend
- modularizacion por dominio en NestJS
- DTOs con validacion declarativa
- RBAC con guards y decorators
- modulos compartidos en frontend para reducir duplicacion (`nav`, `month-picker`, `shared/dom`, `shared/icons`, `shared/format`)

## Tecnologias utilizadas

- Frontend: HTML, CSS, JavaScript, Bootstrap 5, Chart.js
- Backend: NestJS, TypeORM, class-validator, JWT
- Base de datos: PostgreSQL
- OCR: OCR.Space API
- IA para recomendaciones/chat: Groq con fallback OpenAI

## Estructura del proyecto

- `backend/`: API REST, autenticacion, roles, gastos, OCR, dashboard, recomendaciones, chat y exportes
- `frontend/`: aplicacion estatica por roles
  - `frontend/public/src/html/public/`
  - `frontend/public/src/html/user/`
  - `frontend/public/src/html/advisor/`
  - `frontend/public/src/html/admin/`

## Funcionalidades implementadas

### Gestion de usuarios

- registro y login
- refresh token
- perfil de usuario
- recuperacion de contraseña
- login con Google
- administracion de usuarios (rol/activo)

### Gestion de gastos

- alta manual de gastos
- edicion y eliminacion
- listado y organizacion
- carga por ticket con OCR y precompletado

### Analitica y visualizacion

- dashboard mensual
- distribucion por categoria
- evolucion temporal
- gasto promedio y top categoria
- ranking de comercios
- deteccion de gastos inusuales

### Planificacion financiera

- presupuestos por categoria y mes
- metas de ahorro con seguimiento de progreso

### Recomendaciones

- recomendaciones generadas por sistema
- recomendaciones creadas por asesor
- historial de recomendaciones por usuario

### Chat

- chat usuario <-> asesor en tiempo real
- chat de asistencia financiera con IA

### Exportacion

- exportacion de gastos a CSV, XLSX y PDF

## Modelo de datos (resumen)

Entidades principales:

- `User`
- `Expense`
- `Budget`
- `Goal`
- `Recommendation`
- `ChatConversation`
- `ChatMessage`
- `AiChatSession`
- `AiChatMessage`

Relaciones relevantes:

- usuario 1..N gastos
- usuario 1..N presupuestos
- usuario 1..N metas
- usuario 1..N recomendaciones
- conversaciones y mensajes vinculados a usuario/asesor

## Endpoints del backend

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/refresh`
- `POST /auth/forgot-password`

### Usuarios

- `GET /users/me`
- `PATCH /users/me`
- `GET /users` (advisor/admin)
- `PATCH /users/:id/active` (admin)
- `PATCH /users/:id/role` (admin)

### Gastos y tickets

- `GET /expenses`
- `POST /expenses`
- `PATCH /expenses/:id`
- `DELETE /expenses/:id`
- `POST /tickets/upload`

### Dashboard y planificacion

- `GET /dashboard/me?month=YYYY-MM`
- `GET /dashboard/global` (admin)
- `GET /budgets`
- `POST /budgets`
- `PATCH /budgets/:id`
- `DELETE /budgets/:id`
- `GET /goals`
- `POST /goals`
- `PATCH /goals/:id`
- `DELETE /goals/:id`

### Recomendaciones y chat

- `POST /recommendations/generate`
- `GET /recommendations`
- `POST /recommendations/advisor`
- `GET /ai-chat/sessions`
- `POST /ai-chat/sessions`
- `GET /ai-chat/sessions/:id/messages`
- `POST /ai-chat/sessions/:id/messages`

### Exportes y salud

- `GET /exports/csv`
- `GET /exports/pdf`
- `GET /exports/xlsx`
- `GET /health`

## Uso de IA en el proyecto

La IA se utiliza en dos flujos:

1. OCR de tickets:
   - se sube una imagen
   - se extraen monto, comercio y fecha
   - se precompleta el formulario para confirmacion del usuario

2. Asistencia y recomendaciones:
   - sugerencias financieras en base a comportamiento de gasto
   - chat de asistencia financiera con proveedor principal y fallback

## Estado frente a la consigna

El proyecto implementa la arquitectura requerida, stack obligatorio y funcionalidades troncales (auth, roles, CRUD de gastos, OCR, visualizacion y recomendaciones), incluyendo panel por rol y persistencia de datos.
