# Implementacion Paso a Paso - NETO

Este documento registra de forma detallada todo lo realizado para construir el proyecto NETO (Frontend + Backend + despliegue), incluyendo decisiones tecnicas, estructura, endpoints, integraciones y flujo de entrega.

## 1. Definicion de alcance

Se cerro un alcance de MVP funcional completo con:
- Landing page en Bootstrap.
- App web con autenticacion y roles.
- Gestion de gastos manual y por OCR.
- Analitica de gastos y dashboard.
- Recomendaciones financieras asistidas por IA.
- Presupuestos, metas y exportacion de datos.
- Despliegue pensado para Railway (backend + DB) y Netlify (frontend).

## 2. Arquitectura aplicada

Se implemento arquitectura cliente-servidor:
- Frontend estatico: HTML + CSS + JavaScript vanilla + Bootstrap + Chart.js.
- Backend API REST: NestJS + TypeORM.
- Base de datos: PostgreSQL.
- Integraciones externas:
  - OCR.Space para lectura de tickets.
  - OpenAI (gpt-4o-mini) para recomendaciones.
  - API de tasas para conversion de moneda ARS/USD/EUR.

## 3. Construccion de backend

### 3.1 Estructura base
Se creo un backend NestJS con:
- Configuracion de TypeScript y Nest CLI.
- Configuracion de entorno con `@nestjs/config`.
- Configuracion TypeORM compatible con `DATABASE_URL` y variables individuales.
- Healthcheck en `GET /health`.

### 3.2 Entidades y modelo
Se modelaron entidades principales:
- `User`
- `Expense`
- `Budget`
- `Goal`
- `Recommendation`

Se incluyeron campos para:
- Roles (`USER`, `ADVISOR`, `ADMIN`).
- Preferencias de idioma y moneda.
- OCR raw payload y fuente de gasto (`manual` / `ocr`).

### 3.3 Seguridad y autenticacion
Se implemento:
- Registro/login por email y contraseña.
- Login con Google usando `google-auth-library`.
- JWT access token (30m).
- JWT refresh token (30d).
- Guard de JWT y guard de roles.
- Placeholder de flujo de recuperacion de contraseña.

### 3.4 Modulos funcionales
Se implementaron modulos:
- `auth`
- `users`
- `expenses`
- `tickets`
- `dashboards`
- `budgets`
- `goals`
- `recommendations`
- `exchange-rate`
- `exports`

### 3.5 OCR de tickets
Flujo implementado:
1. Recepcion de archivo por `POST /tickets/upload`.
2. Envio del archivo a OCR.Space.
3. Parsing de texto para detectar comercio, monto, fecha y moneda.
4. Si la deteccion no es confiable, se rechaza y se pide carga manual.
5. Si es valida, el gasto se guarda automaticamente.

### 3.6 Recomendaciones con IA
Flujo implementado:
1. Se resumen gastos del mes en ARS.
2. Se consulta OpenAI Chat Completions con `gpt-4o-mini`.
3. Se guarda recomendacion en historial.
4. Fallback a recomendaciones por reglas si falla API o no hay key.

### 3.7 Conversion de moneda
Se implemento servicio de tipo de cambio con:
- Soporte ARS/USD/EUR.
- Cache diario en backend.
- Conversion de monto original a ARS para analitica uniforme.

### 3.8 Exportacion
Se implemento exportacion de gastos en:
- CSV (`/exports/csv`)
- PDF (`/exports/pdf`)
- XLSX (`/exports/xlsx`)

### 3.9 Datos demo
Se creo `seed.ts` con usuarios demo:
- admin@neto.app
- asesor@neto.app
- usuario@neto.app

Incluye gastos de ejemplo para demo inicial.

## 4. Construccion de frontend

### 4.1 Linea visual
Se aplico estilo minimalista/moderno con:
- Paleta principal solicitada:
  - `#2D6A4F`
  - `#D8F3DC`
  - `#212529`
- Bootstrap como base visual.
- CSS custom para identidad NETO.
- Soporte dark mode.

### 4.2 Internacionalizacion
Se implemento soporte ES/EN mediante diccionario JS y atributos `data-i18n`.

### 4.3 Paginas creadas
Se crearon paginas principales:
- Landing: `frontend/public/src/html/index.html`
- Login: `frontend/public/src/html/login.html`
- Registro: `frontend/public/src/html/register.html`
- Recuperar contraseña: `frontend/public/src/html/forgot-password.html`
- Dashboard usuario: `frontend/public/src/html/dashboard.html`
- Panel asesor: `frontend/public/src/html/advisor.html`
- Panel admin: `frontend/public/src/html/admin.html`
- Demo publica: `frontend/public/src/html/demo.html`
- Legales: `terms.html` y `privacy.html`

### 4.4 Scripts frontend
Se implementaron scripts para:
- Configuracion y endpoint API.
- Cliente HTTP (`fetch`) con JWT.
- Autenticacion local (token y usuario en localStorage).
- Dashboard (KPIs + Chart.js + formularios).
- Admin y asesor.
- Tema e idioma.
- Formulario de contacto con Formspree.

## 5. Despliegue

### 5.1 Backend Railway
Se agrego:
- `backend/Dockerfile`
- `backend/railway.json`
- `backend/Procfile`
- `backend/docker-compose.yml` (dev local)
- `backend/RAILWAY_DEPLOYMENT.md`

### 5.2 Frontend Netlify
Se agrego:
- `frontend/netlify.toml`
- `frontend/NETLIFY_DEPLOYMENT.md`

Publicacion prevista de sitio estatico desde `frontend/public/src`.

## 6. Validacion tecnica

Se ejecuto validacion de compilacion backend:
- `npm install`
- `npm run build`

Resultado:
- Build exitoso.
- Sin errores activos reportados por analizador en backend y frontend.

## 7. Repositorio y entrega

Estado de entrega preparado con:
- Codigo fuente frontend y backend.
- Documentacion de arquitectura, variables y deploy.
- Documento detallado de implementacion (este archivo).
- README actualizado para uso operativo del equipo.

## 8. Siguientes mejoras recomendadas

Para una version posterior:
- Migraciones TypeORM para produccion.
- SMTP real para recuperacion de contraseña.
- Subida persistente de imagenes de ticket (S3/Cloudinary).
- Testing automatizado (unit/integration/e2e).
- Mayor cobertura de i18n en todos los textos dinamicos.
