# Cubana Express - PWA

Una aplicación web progresiva (PWA) para la gestión de remesas y servicios express.

## 🚀 Características

### PWA (Progressive Web App)
- ✅ **Instalable** en dispositivos móviles y desktop
- ✅ **Funciona offline** con cache inteligente
- ✅ **Actualizaciones automáticas** del service worker
- ✅ **Banner de instalación** nativo
- ✅ **Manifest optimizado** para todas las plataformas

### Funcionalidades
- 🔐 **Sistema de autenticación** con login moderno
- 📱 **Diseño responsive** para todos los dispositivos
- 🎨 **UI moderna** con gradientes y animaciones
- ⚡ **Rendimiento optimizado** con lazy loading

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd cubana_express/cubana_web

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm start

# Construir para producción
npm run build
```

## 📱 Instalación en Dispositivos

### Android (Chrome)
1. Abre la aplicación en Chrome
2. Toca el menú (⋮) → "Instalar aplicación"
3. Confirma la instalación

### iOS (Safari)
1. Abre la aplicación en Safari
2. Toca el botón compartir (📤)
3. Selecciona "Agregar a pantalla de inicio"

### Desktop (Chrome/Edge)
1. Abre la aplicación en el navegador
2. Busca el ícono de instalación en la barra de direcciones
3. Haz clic en "Instalar"

## 🔧 Configuración PWA

### Manifest
El archivo `public/manifest.json` contiene:
- Nombre y descripción de la aplicación
- Iconos para diferentes tamaños
- Colores del tema
- Configuración de pantalla completa

### Service Worker
- Cache automático de recursos estáticos
- Funcionamiento offline
- Actualizaciones automáticas

### Componentes PWA
- `PWAInstall.tsx`: Banner de instalación
- `useServiceWorker.ts`: Hook para registro
- `serviceWorkerRegistration.ts`: Lógica avanzada

## 🎨 Personalización

### Colores del Tema
```css
--primary-color: #667eea
--secondary-color: #764ba2
--background-color: #ffffff
```

### Iconos
Reemplaza los archivos en `public/`:
- `logo192.png` (192x192)
- `logo512.png` (512x512)
- `favicon.ico`

## 📊 Métricas PWA

Para verificar que tu PWA cumple con los estándares:

1. Abre Chrome DevTools
2. Ve a la pestaña "Lighthouse"
3. Selecciona "Progressive Web App"
4. Ejecuta la auditoría

## 🚀 Despliegue

### Netlify
```bash
npm run build
# Subir la carpeta build/
```

### Vercel
```bash
vercel --prod
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

## 🔗 Integración con API

Para conectar con tu backend:

```typescript
// En App.tsx, descomenta y configura:
fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
```

## 📝 Scripts Disponibles

- `npm start`: Servidor de desarrollo
- `npm run build`: Construcción para producción
- `npm test`: Ejecutar tests
- `npm run eject`: Eyectar configuración (irreversible)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Revisa la documentación de PWA en MDN
