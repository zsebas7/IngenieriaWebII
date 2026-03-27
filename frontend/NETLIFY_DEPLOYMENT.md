# Deploy Frontend en Netlify

## 1. Importar proyecto
1. New site from Git.
2. Elegir repo.
3. Base directory: `frontend`.
4. Build command: vacio.
5. Publish directory: `public/src`.

## 2. Configuracion de API
El frontend usa `window.NETO_CONFIG.API_URL` desde `js/config.js`.
Opciones:
1. Editar `frontend/public/src/js/config.js` con tu URL Railway.
2. O definir via `localStorage.setItem('neto_api_url', 'https://tu-backend.up.railway.app')`.

## 3. Contacto Formspree
Define endpoint:
- `localStorage.setItem('neto_formspree', 'https://formspree.io/f/xxxx')`

## 4. URL final
- Landing: `/html/index.html`
- Login: `/html/login.html`
- Dashboard: `/html/dashboard.html`

## 5. Checklist
- API URL apuntando a Railway
- CORS en backend configurado con dominio Netlify
- OCR/OpenAI keys configuradas en Railway
