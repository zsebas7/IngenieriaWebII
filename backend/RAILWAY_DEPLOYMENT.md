# Deploy Backend en Railway

## 1. Preparar repo
1. Asegura que `backend/` tenga todos los archivos commiteados.
2. En Railway crea un proyecto nuevo.

## 2. Crear servicio backend
1. New Service -> Deploy from GitHub Repo.
2. Root directory: `backend`.
3. Railway detecta `Dockerfile` automaticamente.

### Si aparece "Error creating build plan with Railpack"
1. Abre `Service Settings` del servicio backend.
2. En `Root Directory`, usa `backend`.
3. En `Builder`, selecciona `Dockerfile`.
4. Reintenta `Build -> Build image`.
5. Alternativa: desplegar desde la raiz del repo usando `railway.json` en la raiz (ya incluido) para que Railway use `backend/Dockerfile`.
6. Si Railway insiste en Railpack desde la raiz: este repo ya incluye `package.json` en raiz (workspaces) para que Railpack detecte Node y ejecute `build/start` sobre `backend`.

## 3. Crear PostgreSQL
1. En el mismo proyecto, Add Service -> PostgreSQL.
2. Railway inyecta `DATABASE_URL` automaticamente.

## 4. Variables de entorno
Configura en backend service:
- `PORT=3000`
- `NODE_ENV=production`
- `CORS_ORIGIN=https://TU-SITIO.netlify.app`
- `FRONTEND_URL=https://TU-SITIO.netlify.app` (fallback)
- `JWT_ACCESS_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `GOOGLE_CLIENT_ID=...`
- `OCR_PROVIDER=ocrspace`
- `OCR_SPACE_API_KEY=...`
- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-4o-mini`
- `DB_SSL=true`

## 5. Verificacion
1. Espera deploy exitoso.
2. Probar `GET /health`.
3. Ejecutar seed local o endpoint administrativo segun estrategia.

## 6. Notas
- `synchronize=true` en no-produccion; para produccion real, usa migraciones.
- CORS depende de `FRONTEND_URL`.
