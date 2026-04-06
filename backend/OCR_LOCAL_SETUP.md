# OCR local setup (sin Railway)

## 1) Levantar Postgres local
Desde `backend/`:

```bash
docker compose up -d
```

## 2) Instalar y levantar backend
Desde `backend/`:

```bash
npm install
npm run start:dev
```

El backend quedara en `http://localhost:3000`.

## 3) Levantar frontend local
Desde la raiz del proyecto:

```bash
python3 -m http.server 5500
```

Abrir:
- `http://localhost:5500/frontend/public/src/html/login.html`
- `http://localhost:5500/frontend/public/src/html/expenses.html`

## 4) Probar OCR
1. Iniciar sesion.
2. Ir a Cargar gastos.
3. Subir ticket (jpg/png/pdf).
4. Verificar que aparezca en historial.

## 5) Debug rapido
- Si OCR key no esta: error `OCR_SPACE_API_KEY no configurada`.
- Si OCR no lee bien: error `No se pudo extraer informacion confiable del ticket`.
- Ver logs de backend en la terminal donde corre `npm run start:dev`.
