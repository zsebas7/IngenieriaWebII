# NETO - Plataforma Inteligente de Gestion de Gastos Personales

Proyecto de Ingenieria Web II (2026).

## Stack usado
- Frontend: HTML, CSS, JavaScript (vanilla) + Bootstrap 5 + Chart.js
- Backend: NestJS + TypeORM + PostgreSQL
- OCR: OCR.Space API
- IA recomendaciones: OpenAI (gpt-4o-mini)
- Deploy: Backend en Railway, Frontend en Netlify

## Estructura
- `backend/` API REST, autenticacion, OCR, recomendaciones, dashboard, exportes
- `frontend/` sitio estatico con landing, auth, dashboard y paneles por rol

## Roles
- USER: carga gastos manual/OCR, dashboard, presupuesto, metas, recomendaciones
- ADVISOR: visualiza usuarios y analiza informacion
- ADMIN: gestiona usuarios, roles y activacion

## Variables de entorno backend
Copiar `backend/.env.example` a `backend/.env` y completar:

- `PORT`
- `NODE_ENV`
- `CORS_ORIGIN` (recomendado en Railway)
- `FRONTEND_URL`
- `DATABASE_URL` (Railway) o `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `GOOGLE_CLIENT_ID`
- `OCR_PROVIDER` (`ocrspace`)
- `OCR_SPACE_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `FORMSPREE_ENDPOINT`

## Instalacion local
### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
Sirve `frontend/public/src` con cualquier servidor estatico.
Ejemplo:
```bash
cd frontend/public/src
python3 -m http.server 5500
```
Abrir: `http://localhost:5500/html/index.html`

## Seed de datos demo
```bash
cd backend
npm run seed
```
Usuarios demo:
- admin@neto.app / Admin1234
- asesor@neto.app / Asesor1234
- usuario@neto.app / Usuario1234

## Endpoints principales
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

### Gastos y OCR
- `GET /expenses`
- `POST /expenses`
- `PATCH /expenses/:id`
- `DELETE /expenses/:id`
- `POST /tickets/upload`

### Analitica y extras
- `GET /dashboard/me?month=YYYY-MM`
- `GET /dashboard/global` (admin)
- `GET/POST /budgets`
- `GET/POST /goals`
- `POST /recommendations/generate`
- `GET /recommendations`
- `GET /exports/csv`
- `GET /exports/pdf`
- `GET /exports/xlsx`
- `GET /health`

## Deploy backend en Railway
Ver guia completa: `backend/RAILWAY_DEPLOYMENT.md`

### Troubleshooting Railway (Railpack)
Si aparece `Error creating build plan with Railpack`:
- Configura `Root Directory` del servicio en `backend`.
- O despliega desde la raiz usando `railway.json` (builder Docker + `backend/Dockerfile`).
- En `Service Settings` verifica que el builder sea Dockerfile, no Railpack.
- Si Railway igualmente usa Railpack en la raiz: el repo ya tiene `package.json` de monorepo para que detecte Node y use scripts `build/start` apuntando a `backend`.

## Deploy frontend en Netlify
Ver guia completa: `frontend/NETLIFY_DEPLOYMENT.md`

## Documentacion detallada
- Implementacion completa paso a paso: `docs/IMPLEMENTACION_PASO_A_PASO.md`

## Mantenimiento del README
Este README se considera documento vivo del proyecto. Cada cambio funcional relevante debe actualizar:
- alcance y stack
- endpoints nuevos o modificados
- variables de entorno
- cambios de despliegue
- enlaces a nueva documentacion tecnica
