# Checklist de Despliegue en Railway

## Antes de Desplegar

### ☐ Preparación del Código
- [ ] Código limpio y sin errores de compilación: `npm run build`
- [ ] Pruebas pasando: `npm test`
- [ ] Linter sin errores: `npm run lint`
- [ ] Variables de entorno configuradas localmente
- [ ] Todos los archivos committeados a Git

### ☐ Configuración del Proyecto
- [ ] `.env.example` actualizado con todas las variables necesarias
- [ ] `package.json` con todas las dependencias correctas
- [ ] `tsconfig.json` configurado correctamente
- [ ] `Procfile` presente en la raíz
- [ ] `railway.json` presente en la raíz
- [ ] `Dockerfile` presente (para testing local)
- [ ] Root `.gitignore` con archivos sensibles

### ☐ Variables de Entorno Seguras
- [ ] JWT_SECRET generado con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Contraseñas de base de datos cambiadas (no usar defaults)
- [ ] CORS_ORIGIN actualizado con tu dominio de Railway
- [ ] NODE_ENV=production

---

## Durante la Configuración en Railway

### ☐ Crear Proyecto
- [ ] Cuenta creada en railway.app
- [ ] Repositorio conectado desde GitHub
- [ ] Rama seleccionada (main/prod)

### ☐ Agregar Servicios
- [ ] PostgreSQL agregado y configurado
- [ ] Servicio de API (Node.js) creado

### ☐ Configurar Variables de Entorno
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...  (Railway proporciona esto)
JWT_SECRET=<tu-secreto-generado>
JWT_EXPIRATION=7d
CORS_ORIGIN=https://tu-dominio-railway.app,https://tudominio.com
DEBUG=false
```

### ☐ Configurar Build & Deploy
- [ ] Build Command: `npm run build` (en la carpeta backend)
- [ ] Start Command: `npm run start:prod`
- [ ] Install Command: `npm install` (automático)

### ☐ Configurar Health Check
- [ ] Health check path: `/`
- [ ] Health check timeout: 30 segundos

---

## Después del Despliegue

### ☐ Verificar Despliegue
- [ ] Ver logs de despliegue exitoso en Railway
- [ ] URL pública accesible: `https://xxx.railway.app`
- [ ] Endpoint `/api/health` respondiendo (si existe)
- [ ] Sistema de autenticación funcionando
- [ ] Base de datos conectada correctamente

### ☐ Pruebas Funcionales
```bash
# Ver si servidor está activo
curl https://xxx.railway.app

# Probar autenticación
curl -X POST https://xxx.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Probar CORS
curl -H "Origin: https://tu-dominio.com" https://xxx.railway.app
```

### ☐ Monitoreo
- [ ] Logs monitoreados regularmente
- [ ] Métricas de CPU/Memoria visibles
- [ ] Alertas configuradas (opcional)
- [ ] Backups de base de datos configurados

### ☐ Dominio Personalizado (Opcional)
- [ ] Dominio configurado en Railway
- [ ] DNS actualizado correctamente
- [ ] Certificado SSL automático (Let's Encrypt)
- [ ] Acceso HTTPS funcionando

---

## Problemas Comunes y Soluciones

### ❌ Error: "Build failed"
**Solución:**
- Verificar que `npm run build` funciona localmente
- Ver detalles en Railway Build Logs
- Revisar que todas las dependencias están en package.json

### ❌ Error: "Cannot find module"
**Solución:**
- Ejecutar `npm install` después de cambios
- Revisar que `package.json` tiene todas las dependencias
- Limpiar node_modules: `rm -rf node_modules && npm install`

### ❌ Base de datos no conecta
**Solución:**
- Verificar DATABASE_URL en Railway
- Confirmar que PostgreSQL está creado y activo
- Ver logs de conexión en Railway
- Probar conexión local primero

### ❌ CORS errors en frontend
**Solución:**
- Actualizar CORS_ORIGIN con el dominio correcto
- Incluir protocolo completo: `https://dominio.com`
- Múltiples orígenes: `https://dom1.com,https://dom2.com`

### ❌ Frontend no carga
**Solución:**
- Verificar que `@nestjs/serve-static` está instalado
- Confirmar rutas en `app.module.ts`
- Verificar que archivos fronternd están en `frontend/src/pages/`
- Ver logs del servidor

### ❌ 500 errors ocasionales
**Solución:**
- Ver logs detallados en Railway
- Aumentar timeout en health check
- Revisar límites de recursos
- Optimizar queries de base de datos

---

## Checklist de Seguridad

- [ ] No exponer secrets en código
- [ ] JWT_SECRET mínimo 32 caracteres
- [ ] Contraseñas de BD cambiadas de defaults
- [ ] HTTPS forzado (Railway lo hace automáticamente)
- [ ] Validación de entrada en endpoints
- [ ] CORS restringido a dominios conocidos
- [ ] Rate limiting configurado (opcional)
- [ ] Logs de auditoría (opcional)

---

## Rollback Plan

Si algo sale mal:

1. **Ver logs**: Railway → View Logs
2. **Identificar error**: Buscar en los logs últimos cambios
3. **Hacer rollback**: 
   - En GitHub, revertir el commit problemático
   - Push a main
   - Railway re-desplegará automáticamente
4. **Verificar**: Esperar a que se complete el nuevo despliegue

---

## Próximas Optimizaciones

- [ ] Implementar caching (Redis)
- [ ] Configurar CDN para static files
- [ ] Monitoring con Sentry
- [ ] Logs centralizados
- [ ] Auto-scaling (si es necesario)
- [ ] Database backups automáticos
- [ ] Email notifications para errores

---

## Recursos Útiles

- [Railway Dokumentation](https://docs.railway.app)
- [NestJS Deploy Guide](https://docs.nestjs.com/deployment)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
- [Railway CLI Reference](https://docs.railway.app/cli/commands)

---

**Última Actualización:** Marzo 2026
**Estado:** ✅ Listo para despliegue
