# Spotify Clone

Un clon del reproductor de música Spotify desarrollado con Next.js y la API oficial de Spotify, ofreciendo una experiencia muy similar a la aplicación original con autenticación, reproducción de música, navegación de playlists, álbumes y artistas.

## Características Clave

- **Autenticación completa con OAuth 2.0** integrada con Spotify
- **Reproducción de música** tanto para usuarios Premium (reproducción completa) como para usuarios gratuitos (vistas previas de 30 segundos)
- **Exploración de contenido personalizado** incluyendo:
  - Playlists destacadas
  - Nuevos lanzamientos
  - Recomendaciones basadas en tus artistas favoritos
- **Gestión de playlists** con posibilidad de crear, editar y personalizar tus propias playlists
- **Búsqueda avanzada** de canciones, artistas, álbumes y playlists
- **Interfaz responsive** que se adapta a diferentes tamaños de pantalla
- **Control de reproducción** con funcionalidades de reproducción/pausa, siguiente/anterior, control de volumen, modo aleatorio y repetición
- **Biblioteca personalizada** donde ver tus canciones favoritas y playlists guardadas

## Capturas de Pantalla

### Página Principal
![Página Principal](/public/imagespoti1.png)
*Vista principal con contenido personalizado, playlists destacadas y nuevos lanzamientos.*

### Reproductor
![Reproductor](/public/imagespoti2.png)
*Reproductor de música con controles, información de la canción actual y barra de progreso.*

### Barra Lateral
![Barra Lateral](/public/imagespoti3.png)
*Navegación principal y acceso rápido a playlists personales.*

### Búsqueda
![Búsqueda](/public/imagespoti4.png)
*Interfaz de búsqueda con resultados categorizados por tipo.*

## Tecnologías Utilizadas

- **Frontend:**
  - [Next.js 13+](https://nextjs.org/) con App Router para el enrutamiento y estructura de la aplicación
  - [React 18](https://reactjs.org/) para la construcción de la interfaz de usuario
  - [TypeScript](https://www.typescriptlang.org/) para tipo seguro y mejor desarrollo
  - [Tailwind CSS](https://tailwindcss.com/) para estilos y diseño responsive
  - [React Icons](https://react-icons.github.io/react-icons/) para iconografía consistente

- **Estado y Gestión de Datos:**
  - [Zustand](https://github.com/pmndrs/zustand) para gestión de estado global (autenticación y reproductor)
  - [Axios](https://axios-http.com/) para peticiones HTTP a la API de Spotify

- **Autenticación:**
  - OAuth 2.0 con flujo de autorización de Spotify
  - Manejo de tokens y refresco automático

- **APIs:**
  - [API Web de Spotify](https://developer.spotify.com/documentation/web-api/) para datos de música y playlists
  - [Web Playback SDK de Spotify](https://developer.spotify.com/documentation/web-playback-sdk/) para reproducción (usuarios Premium)

## Desafíos y Aprendizajes

### Principales Desafíos Técnicos

1. **Autenticación OAuth 2.0 con Spotify:**
   - Implementación del flujo completo de autenticación
   - Gestión y renovación automática de tokens de acceso
   - Manejo de diferentes niveles de permisos según el tipo de cuenta

2. **Reproducción de música para diferentes tipos de usuario:**
   - Integración del SDK de Spotify para usuarios Premium
   - Implementación de fallback con las vistas previas de 30 segundos para usuarios gratuitos
   - Sincronización del estado del reproductor entre diferentes partes de la aplicación

3. **Manejo de estado global:**
   - Implementación de un sistema robusto para gestionar el estado de autenticación
   - Creación de un store para el reproductor que funcione con diferentes fuentes de reproducción
   - Persistencia del estado entre navegaciones y recargas de página

4. **Optimización de rendimiento:**
   - Implementación de carga lazy y paginación para grandes colecciones de datos
   - Optimización de re-renders con memoización donde era necesario
   - Gestión eficiente de caché para reducir llamadas a la API

### Aprendizajes

- Profundización en el uso de App Router de Next.js y sus características
- Implementación práctica de autenticación OAuth en aplicaciones modernas
- Gestión de estado complejo con Zustand en lugar de soluciones más pesadas
- Experiencia en integración con SDKs y APIs de terceros
- Técnicas para mejorar UX con estados de carga, manejo de errores y diseño responsive

## Instalación y Uso

### Requisitos Previos

- Node.js 16.8 o superior
- Cuenta de desarrollador en [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
- Credenciales de aplicación Spotify (Client ID y Client Secret)

### Configuración

1. Clona el repositorio:
   ```bash
   git clone https://github.com/AlexCodeNow/spotifyclone.git
   cd spotify-clone
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

3. Configura las variables de entorno:
   - Crea un archivo `.env.local` en la raíz del proyecto y configura:
   ```
   NEXT_PUBLIC_CLIENT_ID=tu_client_id_de_spotify
   NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback
   NEXT_PUBLIC_API_URL=https://api.spotify.com/v1
   CLIENT_SECRET=tu_client_secret_de_spotify
   ```

4. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Uso en Producción

Para crear una versión optimizada para producción:

```bash
npm run build
npm start
# o
yarn build
yarn start
```

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.