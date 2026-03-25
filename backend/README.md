# NETO API Backend

API RESTful para la Plataforma Inteligente de Gestión de Gastos Personales (NETO), desarrollada con NestJS y PostgreSQL.

## Características

- ✅ Autenticación con JWT
- ✅ Gestión de usuarios con roles (Admin, User, Advisor)
- ✅ CRUD completo de gastos
- ✅ Gestión de categorías
- ✅ Estadísticas y análisis de gastos
- ✅ Filtrado de gastos por fecha, categoría y método de pago
- ✅ Gastos recurrentes
- ✅ Validación de datos con class-validator
- ✅ CORS habilitado para conexión con frontend

## Requisitos

- Node.js (v18 o superior)
- npm o yarn
- PostgreSQL (v12 o superior)

## Instalación

### 1. Clonar el repositorio e instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales de PostgreSQL:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=tu_password
DATABASE_NAME=neto_db
NODE_ENV=development
PORT=3000
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRATION=7d
CORS_ORIGIN=http://localhost:5500
```

### 3. Crear la base de datos

```bash
# Con PostgreSQL ejecutado
psql -U postgres
CREATE DATABASE neto_db;
```

### 4. Ejecutar la aplicación

**Modo desarrollo:**
```bash
npm run start:dev
```

**Modo producción:**
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Autenticación

- `POST /auth/login` - Login de usuario
- `POST /auth/verify` - Verificar token válido

### Usuarios

- `POST /users/register` - Registrar nuevo usuario
- `GET /users` - Obtener todos los usuarios (requiere autenticación)
- `GET /users/profile` - Obtener perfil del usuario autenticado
- `GET /users/:id` - Obtener usuario por ID
- `PUT /users/:id` - Actualizar usuario
- `POST /users/:id/change-password` - Cambiar contraseña
- `DELETE /users/:id` - Eliminar usuario
- `POST /users/:id/deactivate` - Desactivar usuario
- `POST /users/:id/activate` - Activar usuario

### Gastos

- `POST /expenses` - Crear gasto
- `GET /expenses` - Obtener todos los gastos del usuario
- `GET /expenses/:id` - Obtener gasto por ID
- `PUT /expenses/:id` - Actualizar gasto
- `DELETE /expenses/:id` - Eliminar gasto
- `GET /expenses/stats/summary` - Obtener estadísticas
- `GET /expenses/recurring` - Obtener gastos recurrentes
- `POST /expenses/filter` - Filtrar gastos

### Categorías

- `POST /categories` - Crear categoría (requiere autenticación)
- `GET /categories` - Obtener todas las categorías
- `GET /categories/init` - Inicializar categorías por defecto
- `GET /categories/:id` - Obtener categoría por ID
- `PUT /categories/:id` - Actualizar categoría
- `DELETE /categories/:id` - Eliminar categoría
- `POST /categories/:id/deactivate` - Desactivar categoría
- `POST /categories/:id/activate` - Activar categoría

## Estructura del Proyecto

```
backend/
├── src/
│   ├── modules/
│   │   ├── users/
│   │   ├── auth/
│   │   ├── expenses/
│   │   └── categories/
│   ├── config/
│   │   └── database.config.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   └── main.ts
├── test/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Ejemplo de Uso

### Registrar usuario

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "+34123456789",
    "password": "secure_password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "secure_password123"
  }'
```

Respuesta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "user"
  }
}
```

### Crear gasto

```bash
curl -X POST http://localhost:3000/expenses \
  -H "Authorization: Bearer tu_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "comercio": "Supermercado XYZ",
    "monto": 45.50,
    "fecha": "2024-01-15",
    "descripcion": "Compra semanal",
    "metodoPago": "card",
    "categoriaId": "uuid-categoria"
  }'
```

### Obtener estadísticas

```bash
curl -X GET "http://localhost:3000/expenses/stats/summary?mes=1&año=2024" \
  -H "Authorization: Bearer tu_token_jwt"
```

## Scripts Disponibles

```bash
npm run build        # Compilar TypeScript
npm run start        # Iniciar modo producción
npm run start:dev    # Iniciar modo desarrollo con watch
npm run start:debug  # Iniciar con debugger
npm run lint         # Ejecutar linter
npm run test         # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run test:cov     # Coverage de tests
```

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DATABASE_HOST` | Host de PostgreSQL | localhost |
| `DATABASE_PORT` | Puerto de PostgreSQL | 5432 |
| `DATABASE_USERNAME` | Usuario de PostgreSQL | postgres |
| `DATABASE_PASSWORD` | Contraseña de PostgreSQL | postgres |
| `DATABASE_NAME` | Nombre de la BD | neto_db |
| `NODE_ENV` | Ambiente de ejecución | development |
| `PORT` | Puerto de la API | 3000 |
| `JWT_SECRET` | Secreto para firmar tokens JWT | secret_key |
| `JWT_EXPIRATION` | Expiración de tokens JWT | 7d |
| `CORS_ORIGIN` | Orígenes permitidos para CORS | * |

## Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Autenticación JWT
- ✅ Validación de entrada con class-validator
- ✅ CORS configurable
- ✅ Relaciones de usuario para aislar datos

## Notas de Desarrollo

- La base de datos se sincroniza automáticamente en desarrollo (synchronize: true)
- Usa entidades de TypeORM para un ORM type-safe
- Los endpoints protegidos requieren header: `Authorization: Bearer <token>`
- Todos los gastos están asociados a un usuario específico

## Mantenimiento

### Crear migración

Para cambios en la estructura de BD en producción:

```bash
npm run typeorm migration:create
```

### Resetear BD (Development only)

```bash
# Eliminar tablas
npm run typeorm schema:drop

# Recrear tablas
npm run start:dev
```

## Soporte

Para reportar problemas o sugerencias, crea un issue en el repositorio.

## Licencia

MIT
