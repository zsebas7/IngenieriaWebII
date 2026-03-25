# Guía de Despliegue en Railway

## Introducción
Esta guía te llevará paso a paso para desplegar tu aplicación NETO en Railway, una plataforma de hosting moderna y confiable.

## Requisitos Previos
- Cuenta en [Railway.app](https://railway.app)
- GitHub configurado con tu repositorio
- Node.js 18+ instalado localmente (para pruebas)

---

## Paso 1: Preparación del Proyecto

### 1.1 Verificar estructura del proyecto
Tu proyecto tiene una estructura full-stack:
```
IngenieriaWebII/
├── backend/          (API NestJS con Express)
├── frontend/         (HTML/CSS/JavaScript estático)
└── Otros archivos
```

### 1.2 Actualizar .env.example
El archivo `.env.example` está actualizado con todas las variables necesarias.

---

## Paso 2: Crear el Proyecto en Railway

### 2.1 Crear nuevo proyecto
1. Accede a [railway.app](https://railway.app)
2. Haz clic en **"New Project"** 
3. Selecciona **"Deploy from GitHub"**
4. Autoriza Railroad con tu cuenta de GitHub
5. Selecciona el repositorio `IngenieriaWebII`
6. Selecciona la rama `main` (o tu rama de producción)

### 2.2 Agregar servicio de Base de Datos PostgreSQL
1. En el dashboard de Railway, haz clic en **"Create"**
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Railway creará automáticamente:
   - Una instancia PostgreSQL
   - Variables de entorno: `DATABASE_URL`

---

## Paso 3: Agregar Variables de Entorno

En la sección de **Variables** de tu proyecto Railway, configura:

```bash
# Node Environment
NODE_ENV=production

# Puerto (Railway asigna automáticamente)
PORT=3000

# Base de Datos (Railway proporciona DATABASE_URL)
# Opción A: Usar DATABASE_URL (recomendado)
DATABASE_URL=postgresql://user:password@host:port/database

# Opción B: Variables individuales (si no usas DATABASE_URL)
DATABASE_HOST=<tu-host>
DATABASE_PORT=5432
DATABASE_USERNAME=<tu-usuario>
DATABASE_PASSWORD=<tu-password>
DATABASE_NAME=neto_db

# JWT
JWT_SECRET=tu_secreto_jwt_super_seguro_cambiar_en_produccion_minimo_32_caracteres
JWT_EXPIRATION=7d

# CORS (actualiza con tu dominio)
CORS_ORIGIN=https://tu-dominio.railway.app,https://tudominio.com
```

### ⚠️ Importante: Generar JWT_SECRET seguro

Ejecuta en tu terminal local:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y úsalo como `JWT_SECRET` en Railway.

---

## Paso 4: Configurar el Procfile (Opcional pero Recomendado)

Hemos creado un `Procfile` en la raíz del proyecto. Railway debería detectarlo automáticamente.

---

## Paso 5: Configurar Build y Deploy

### Opción A: Usando railway.json (Recomendado)

Se ha creado `railway.json` en la raíz del proyecto con:
- Comando de build: `npm run build`
- Comando de inicio: `npm run start:prod`
- Archivo de salida: `dist/`

### Opción B: Configurar manualmente en Railway

1. En **Settings** → **Deploy**
2. Build Command: `npm run build`
3. Start Command: `npm run start:prod`

---

## Paso 6: Configurar El Frontend

El frontend (archivos estáticos HTML/CSS/JS) se sirve desde el backend.

### 6.1 Configurar el backend para servir archivos estáticos

El `app.module.ts` debe servir la carpeta `frontend/src/pages`:

```typescript
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'src', 'pages'),
      exclude: ['/api/*'],
    }),
    // ... otros módulos
  ],
})
export class AppModule {}
```

### 6.2 Instalación de dependencia necesaria

En `backend/package.json`, añade:
```json
"@nestjs/serve-static": "^3.0.1"
```

---

## Paso 7: Desplegar en Railway

### 7.1 Hacer push a GitHub

```bash
git add .
git commit -m "Preparar para despliegue en Railway"
git push origin main
```

### 7.2 Despliegue automático

Railway detectará el push y comenzará automáticamente:
1. Clona tu repositorio
2. Ejecuta `npm install` en la carpeta `backend`
3. Ejecuta `npm run build`
4. Ejecuta `npm run start:prod`

Puedes ver el progreso en el **Deployment Log** de Railway.

---

## Paso 8: Verificar el Despliegue

### 8.1 Obtener la URL
1. En el dashboard de Railway, ve a tu proyecto
2. En el servicio de backend, haz clic en **"View Logs"**
3. Busca algo como: `Application is running on: http://localhost:3000`
4. Railway proporcionará una URL pública como: `https://xxx.railway.app`

### 8.2 Probar los endpoints
```bash
# Probar si el servidor está activo
curl https://xxx.railway.app

# Probar endpoint de login
curl -X POST https://xxx.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 8.3 Acceder a la página principal
Abre en tu navegador: `https://xxx.railway.app`

---

## Paso 9: Configurar el Dominio Personalizado (Opcional)

1. En Railway, ve a **Settings** → **Domains**
2. Haz clic en **"Create Domain"**
3. Selecciona o ingresa tu dominio personalizado
4. Sigue las instrucciones de DNS

---

## Solución de Problemas

### Error: "Cannot find module"
- Asegúrate de que `npm install` fue ejecutado
- Verifica que todas las dependencias están en `package.json`

### Error: "Port already in use"
- Railway asigna automáticamente el puerto 3000
- No cierres la aplicación manualmente en Railway

### Error de Conexión a Base de Datos
- Verifica las variables de entorno en Railway
- Revisa el log de PostgreSQL en el panel de Railway
- Asegúrate de que la contraseña y usuario son correctos

### Frontend no carga
- Verifica que `@nestjs/serve-static` está instalado
- Revisa que los archivos están en `frontend/src/pages/`
- Comprueba la configuración en `app.module.ts`

### Error CORS
- Actualiza `CORS_ORIGIN` con tu dominio de Railway
- Incluye el protocolo: `https://`

---

## Monitoreo Post-Despliegue

### Logs
En Railway, puedes ver:
- **View Logs**: Logs en tiempo real
- **Deployment**: Historial de despliegues
- **Metrics**: CPU, memoria, red

### Base de Datos
- Accede a PostgreSQL desde Railway
- Ejecuta queries de administración
- Verifica integridad de datos

### Actualizaciones Continuas
Cada push a GitHub dispara automáticamente un nuevo despliegue.

---

## Resumen de Variables de Entorno Finales

| Variable | Valor | Origen |
|----------|-------|--------|
| `NODE_ENV` | `production` | Manual |
| `PORT` | `3000` | Manual o Auto |
| `DATABASE_URL` | `postgresql://...` | Railway PostgreSQL |
| `JWT_SECRET` | `<tu-secreto>` | Manual (Generado) |
| `JWT_EXPIRATION` | `7d` | Manual |
| `CORS_ORIGIN` | `https://tu-dominio.railway.app` | Manual |

---

## Recursos Útiles

- [Documentación Railway](https://docs.railway.app)
- [NestJS Deploy Docs](https://docs.nestjs.com/deployment)
- [PostgreSQL en Railway](https://docs.railway.app/databases/postgresql)
- [Proyecto NETO README](./README.md)

---

## Próximos Pasos

1. ✅ Completar configuración en Railway
2. ✅ Hacer push a GitHub
3. ✅ Esperar a que se complete el despliegue
4. ✅ Probar la aplicación en la URL pública
5. ✅ Configurar dominio personalizado (opcional)
6. ✅ Monitorear logs y rendimiento

¡Tu aplicación está lista para desplegarse en Railway! 🚀
