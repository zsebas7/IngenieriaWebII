# NETO - Plataforma Inteligente de Gestión de Gastos Personales
## Guía Completa de Instalación y Uso

---

## 📋 Tabla de Contenidos

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Requisitos Previos](#requisitos-previos)
3. [Instalación del Backend](#instalación-del-backend)
4. [Instalación del Frontend](#instalación-del-frontend)
5. [Configuración de la Base de Datos](#configuración-de-la-base-de-datos)
6. [Ejecución del Proyecto](#ejecución-del-proyecto)
7. [Guía de Uso](#guía-de-uso)
8. [Endpoints de API](#endpoints-de-api)
9. [Solución de Problemas](#solución-de-problemas)

---

## 📁 Estructura del Proyecto

```
IngenieriaWebII/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.html (Landing page)
│   │   │   ├── login.html (Autenticación)
│   │   │   ├── registro.html (Registro)
│   │   │   ├── dashboard.html (Panel principal)
│   │   │   ├── add-expense.html (Agregar gastos)
│   │   │   ├── estadisticas.html (Análisis)
│   │   │   └── style.css (Estilos)
│   │   ├── images/
│   │   └── js/
│   │       └── api.js (Cliente API)
│   └── README.md
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── users/
│   │   │   ├── auth/
│   │   │   ├── expenses/
│   │   │   └── categories/
│   │   ├── config/
│   │   ├── main.ts (Entrada)
│   │   ├── app.module.ts
│   │   └── app.controller.ts
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
└── README.md (Este archivo)
```

---

## 🔧 Requisitos Previos

### Software Necesario

- **Node.js** v18 o superior
- **npm** o **yarn**
- **PostgreSQL** v12 o superior
- **Git** (opcional)

### Verificar Instalación

```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar PostgreSQL
psql --version
```

---

## 🚀 Instalación del Backend

### Paso 1: Navegar al directorio del backend

```bash
cd backend
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=tu_password_aqui
DATABASE_NAME=neto_db
NODE_ENV=development
PORT=3000
JWT_SECRET=tu_secreto_jwt_seguro
JWT_EXPIRATION=7d
CORS_ORIGIN=http://localhost:5500,http://localhost:8080
```

### Paso 4: Crear la base de datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Dentro de psql, ejecutar:
CREATE DATABASE neto_db;

# Salir
\q
```

### Paso 5: Sinc ronizar las tablas (automático en desarrollo)

Cuando ejecutes el backend en modo desarrollo, las tablas se crearán automáticamente.

---

## 🎨 Instalación del Frontend

### Paso 1: Navegar al directorio del frontend

```bash
# Desde la raíz del proyecto
cd frontend
```

### Paso 2: Servir el frontend

Opción A: Usando Live Server (Recomendado para desarrollo)
```bash
# Instalar Live Server globalmente
npm install -g live-server

# Ejecutar desde la carpeta src
cd src
live-server --port=5500
```

Opción B: Usando Python
```bash
# Python 3
python -m http.server 5500

# Python 2
python -m SimpleHTTPServer 5500
```

Opción C: Usando Node.js
```bash
npm install -g http-server
cd src
http-server -p 5500
```

---

## 🗄️ Configuración de la Base de Datos

### Crear Tablas Automáticamente

NestJS con TypeORM sincronizará automáticamente en desarrollo. Al ejecutar:

```bash
npm run start:dev
```

Las tablas se crearán según las entities definidas:
- `users` - Información de usuarios
- `categories` - Categorías de gastos
- `expenses` - Registro de gastos

### Estructura de Tablas (Referencia)

**users table:**
```sql
- id (UUID, PK)
- nombre (varchar)
- email (varchar, UNIQUE)
- telefono (varchar)
- password (varchar, hashado)
- rol (enum: admin, user, advisor)
- presupuestoMensual (decimal)
- activo (boolean)
- perfilFinanciero (text)
- createdAt (timestamp)
- updatedAt (timestamp)
```

**categories table:**
```sql
- id (UUID, PK)
- nombre (varchar)
- descripcion (text)
- color (varchar)
- icono (varchar)
- activa (boolean)
- createdAt (timestamp)
- updatedAt (timestamp)
```

**expenses table:**
```sql
- id (UUID, PK)
- comercio (varchar)
- monto (decimal)
- fecha (date)
- descripcion (text)
- tipo (enum: manual, ticket, transfer)
- metodoPago (enum: cash, card, transfer, mobile_payment)
- usuarioId (UUID, FK)
- categoriaId (UUID, FK)
- esRecurrente (boolean)
- urlTicket (varchar)
- notasIA (text)
- confianzaIA (decimal)
- createdAt (timestamp)
- updatedAt (timestamp)
```

---

## ▶️ Ejecución del Proyecto

### Terminal 1: Iniciar el Backend

```bash
cd backend
npm run start:dev
```

Salida esperada:
```
[NestFactory] Starting Nest application...
✅ Application is running on: http://localhost:3000
```

### Terminal 2: Iniciar el Frontend

```bash
cd frontend/src
live-server --port=5500
```

Salida esperada:
```
Serving "/path/to/frontend/src" at http://127.0.0.1:5500
```

### Acceder a la Aplicación

- **Frontend:** http://localhost:5500
- **API:** http://localhost:3000
- **Documentación API:** http://localhost:3000/api/docs (no implementado, ver endpoints)

---

## 📖 Guía de Uso

### 1. Registro de Usuario

1. Abre http://localhost:5500
2. Haz clic en "Crear Cuenta" o navega a `registro.html`
3. Completa el formulario:
   - Nombre completo
   - Email
   - Teléfono (opcional)
   - Contraseña (mínimo 6 caracteres)
   - Confirmar contraseña
   - Tipo de usuario (Usuario Regular o Asesor)
4. Haz clic en "Crear Cuenta"
5. Se redirigirá a login

### 2. Iniciar Sesión

1. Ve a `login.html` o desde el landing
2. Ingresa tus credenciales:
   - Email
   - Contraseña
3. Haz clic en "Iniciar Sesión"
4. Serás redirigido al dashboard

### 3. Usar el Dashboard

**Bienvenida:**
- Muestra el nombre del usuario
- Muestra presupuesto mensual

**Tarjetas de Estadísticas:**
- Gastos este mes
- Promedio diario
- Categoría más gastada
- Ahorros estimados

**Gráficos:**
- Distribución de gastos por categoría
- Gastos por día de la semana

**Gastos Recientes:**
- Tabla con últimos gastos
- Opciones de editar/eliminar

### 4. Agregar Gastos

1. Navega a "Agregar Gasto" (`add-expense.html`)
2. Completa los datos:
   - **Tab Manual:**
     - Comercio/Tienda
     - Monto
     - Fecha
     - Categoría
     - Descripción
     - Método de pago
   - **Tab Cámara (Demo):**
     - Carga una imagen de ticket
     - Simula extracción con IA

3. Haz clic en "Guardar Gasto"

### 5. Ver Estadísticas

1. Navega a "Estadísticas" (`estadisticas.html`)
2. Usa los filtros:
   - Período
   - Categoría
   - Tipo de gasto
3. Visualiza:
   - Gráficos de evolución
   - Distribución por categoría
   - Top comercios
   - Comparación semanal

### 6. Gestionar Presupuesto

1. Ve al Dashboard
2. Haz clic en "Editar Perfil"
3. Establece tu presupuesto mensual
4. El sistema alerta si se excede

---

## 🔌 Endpoints de API

### Autenticación

```
POST   /auth/login              - Iniciar sesión
POST   /auth/verify             - Verificar token (requiere auth)
```

### Usuarios

```
POST   /users/register          - Registrarse
GET    /users                   - Listar usuarios (requiere auth)
GET    /users/profile           - Obtener perfil actual (requiere auth)
GET    /users/:id               - Obtener usuario por ID (requiere auth)
PUT    /users/:id               - Actualizar usuario (requiere auth)
POST   /users/:id/change-password - Cambiar contraseña (requiere auth)
DELETE /users/:id               - Eliminar usuario (requiere auth)
POST   /users/:id/deactivate    - Desactivar usuario (requiere auth)
POST   /users/:id/activate      - Activar usuario (requiere auth)
```

### Gastos

```
POST   /expenses                - Crear gasto (requiere auth)
GET    /expenses                - Listar mis gastos (requiere auth)
GET    /expenses/:id            - Obtener gasto (requiere auth)
PUT    /expenses/:id            - Actualizar gasto (requiere auth)
DELETE /expenses/:id            - Eliminar gasto (requiere auth)
GET    /expenses/stats/summary  - Estadísticas (requiere auth)
GET    /expenses/recurring      - Gastos recurrentes (requiere auth)
POST   /expenses/filter         - Filtrar gastos (requiere auth)
```

### Categorías

```
POST   /categories              - Crear categoría (requiere auth)
GET    /categories              - Listar categorías activas
GET    /categories/init         - Inicializar categorías por defecto
GET    /categories/:id          - Obtener categoría
PUT    /categories/:id          - Actualizar categoría (requiere auth)
DELETE /categories/:id          - Eliminar categoría (requiere auth)
POST   /categories/:id/deactivate - Desactivar (requiere auth)
POST   /categories/:id/activate    - Activar (requiere auth)
```

### Salud de la Aplicación

```
GET    /                        - Info de la API
GET    /health                  - Health check
```

---

## 🐛 Solución de Problemas

### Error: "Could not connect to database"

**Solución:**
```bash
# Verificar que PostgreSQL está corriendo
sudo service postgresql status

# Iniciar PostgreSQL (Linux/Mac)
sudo service postgresql start

# Verificar credenciales en .env
cat backend/.env
```

### Error: "CORS error"

**Solución:** En `backend/.env`, asegúrate que el frontend está en CORS_ORIGIN:
```env
CORS_ORIGIN=http://localhost:5500,http://localhost:8080
```

### Error: "Port 3000 already in use"

**Solución:**
```bash
# Cambiar puerto en .env
PORT=3001

# O liberar puerto 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9
```

### Error: "Token inválido o expirado"

**Solución:**
1. Limpia localStorage en el navegador
2. Vuelve a iniciar sesión
3. Verifica que JWT_SECRET en .env es consistente

### Frontend no se conecta a la API

**Solución:**
1. Verifica que el backend está corriendo (http://localhost:3000)
2. Abre Developer Tools (F12)
3. Revisa la consola por errores CORS
4. Comprueba la URL en `frontend/src/js/api.js` (debe ser `http://localhost:3000`)

### Base de datos no sincroniza

**Solución:**
```bash
# En el backend, deja que NestJS sincronice automáticamente
npm run start:dev

# Si persiste, resetea las tablas
# CUIDADO: Esto elimina todos los datos
psql -U postgres -d neto_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## 📱 Características Principales

### ✅ Implementadas

- [x] Autenticación con JWT
- [x] Registro y login de usuarios
- [x] CRUD completo de gastos
- [x] Categorización de gastos
- [x] Estadísticas y gráficos
- [x] Filtrado de gastos
- [x] Dashboard personalizado
- [x] Gestión de categorías
- [x] Validación de datos
- [x] Respuesta responsiva del frontend

### 🔄 Próximas Mejoras (Opcionales)

- [ ] Integración real de OCR para tickets
- [ ] Recomendaciones financieras con IA
- [ ] Alertas de gastos excesivos
- [ ] Exportar reportes (PDF, Excel)
- [ ] Integración con billeteras digitales
- [ ] Análisis predictivo
- [ ] Metas de ahorro
- [ ] Comparación histórica
- [ ] Notificaciones push
- [ ] Autenticación social (Google, Facebook)

---

## 📚 Más Información

- **Backend README:** [backend/README.md](./backend/README.md)
- **Frontend:** Archivos HTML en `frontend/src/pages/`
- **Estilos:** `frontend/src/pages/style.css`
- **API Client:** `frontend/src/js/api.js`

---

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver el archivo LICENSE para más detalles.

---

## ✉️ Soporte

Para soporte, crea un issue en el repositorio o contacta al equipo de desarrollo.

---

**Última actualización:** Enero 2026
**Versión:** 1.0.0
**Estado:** En desarrollo y pruebas
