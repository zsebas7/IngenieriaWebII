# Railway CLI Command Reference

Guía rápida de los comandos más útiles de Railway CLI.

## Instalación

```bash
npm install -g @railway/cli
```

## Comandos Básicos

### Iniciar sesión
```bash
railway login
```
Abre tu navegador para autenticarte.

### Seleccionar proyecto
```bash
railway link
```
Selecciona el proyecto de Railway a usar.

### Ver estado
```bash
railway status
```
Muestra el estado actual del proyecto y servicios.

---

## Comandos de Logs

### Ver logs en tiempo real
```bash
railway logs
```
Scrollea continuamente los logs de producción.

### Ver logs de un servicio específico
```bash
railway logs --service api
railway logs --service database
```

### Ver x últimas líneas
```bash
railway logs -n 100
```

---

## Deployments

### Ver historial de deployments
```bash
railway deployments
```

### Ver detalles de un deployment
```bash
railway deployments <deployment-id>
```

### Hacer rollback a un deployment anterior
```bash
railway rollback <deployment-id>
```

### Trigger manual deployment
```bash
railway deploy
```

---

## Variables de Entorno

### Listar variables
```bash
railway variables ls
```

### Establecer variable
```bash
railway variables set JWT_SECRET=your_secret_here
```

### Obtener valor de variable
```bash
railway variables get JWT_SECRET
```

### Actualizar desde .env.example
```bash
railway variables clear
# Luego agregar variables manualmente
```

---

## Base de Datos

### Conectar a PostgreSQL localmente
```bash
railway connect database
```

### Ejecutar query
```bash
railway db query "SELECT * FROM users;"
```

### Backup de base de datos
```bash
railway db backup
```

---

## Servicios

### Listar servicios
```bash
railway services
```

### Ver detalles de servicio
```bash
railway info --service api
```

### Restart servicio
```bash
railway restart --service api
```

---

## Configuration

### Abrir dashboard web
```bash
railway open
```

### Abrir variables en editor
```bash
railway variables edit
```

### Ver config
```bash
railway config
```

---

## Troubleshooting

### Ver full logs (verbose)
```bash
railway logs --verbose
```

### Debug mode
```bash
railway logs --follow
```

### Ver eventos del proyecto
```bash
railway events
```

---

## Ejemplos Prácticos

### Workflow típico de despliegue
```bash
# 1. Hacer cambios locales
# 2. Commit a GitHub
git add .
git commit -m "Update config"
git push origin main

# 3. Verificar que se está desplegando
railway logs

# 4. Test en producción
curl https://tu-dominio-railway.app/api/health

# 5. Si hay problemas, rollback
railway rollback <previous-deployment-id>
```

### Actualizar variables de entorno
```bash
# Ver variables actuales
railway variables ls

# Actualizar una variable
railway variables set NODE_ENV=production

# Verificar el cambio
railway variables get NODE_ENV

# Esperar a que re-deploy automáticamente
railway logs
```

### Monitorear en tiempo real
```bash
# Terminal 1: Ver logs continuamente
railway logs --follow

# Terminal 2: Correr tests o requests
while true; do 
  curl https://tu-dominio-railway.app/api/health
  sleep 10
done
```

---

## Ayuda

Para ver todos los comandos:
```bash
railway --help
railway <comando> --help
```

Por ejemplo:
```bash
railway logs --help
railway variables --help
```

---

## Recursos

- [Railway CLI Docs](https://docs.railway.app/cli/commands)
- [Railway API](https://docs.railway.app/api-reference)
- [Status Page](https://status.railway.app)

---

**Tip:** Guarda este archivo para referencia rápida durante el despliegue.
