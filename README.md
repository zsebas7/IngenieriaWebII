# NETO - Plataforma Inteligente de Gestión de Gastos Personales

Proyecto sobre un Gestor Inteligente de Gastos Personales.

**Estudiantes:** CAPARROZ, Sebastian y RUIZ NOTARI, Leonel

---

## 📖 Documentación

### Getting Started
- **[INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)** - Guía completa de instalación y uso local

### Deployment en Railway
- **[RAILWAY_SETUP_COMPLETE.md](./RAILWAY_SETUP_COMPLETE.md)** ⭐ **COMIENZA AQUÍ** - Resumen de setup completado
- **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** - Guía paso a paso para desplegar en Railway
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Checklist pre/durante/post despliegue
- **[RAILWAY_CLI_COMMANDS.md](./RAILWAY_CLI_COMMANDS.md)** - Referencia rápida de comandos

### Local Development
- **Dockerfile** - Build optimizado para producción
- **docker-compose.yml** - Entorno local con PostgreSQL

---

## 🚀 Desplegar en Railway (Rápido)

1. **Generar JWT_SECRET seguro:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Crear proyecto en Railway:**
   - Ir a [railway.app](https://railway.app)
   - Conectar repositorio GitHub
   - Agregar PostgreSQL
   - Configurar variables de entorno

3. **Más info:** Ver [RAILWAY_SETUP_COMPLETE.md](./RAILWAY_SETUP_COMPLETE.md)

---

## 📁 Estructura del Proyecto

```
IngenieriaWebII/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── modules/           # Módulos principales
│   │   ├── config/            # Configuración
│   │   └── main.ts           # Entrada
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # HTML/CSS/JS
│   └── src/pages/
├── Dockerfile                  # Build Docker
├── docker-compose.yml          # Entorno local
├── railway.json               # Config Railway
├── Procfile                   # Process definition
└── README.md
```

---

## 🛠️ Tecnologías

**Backend:**
- NestJS
- TypeORM
- PostgreSQL
- JWT Authentication

**Frontend:**
- HTML5
- CSS3
- Vanilla JavaScript
- Bootstrap 5
- Chart.js

---

## ✨ Características

- 🔐 Autenticación JWT
- 💰 Gestión de gastos
- 📊 Análisis estadísticos
- 🏷️ Categorías personalizadas
- 🤖 Extracción por IA (demo)
- 📱 Responsive design

---

## 📞 Soporte

Para problemas con el despliegue:
1. Lee [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
2. Consulta [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
3. Revisa los logs en Railway dashboard

---

**Última Actualización:** Marzo 2026  
**Versión:** 1.0.0
