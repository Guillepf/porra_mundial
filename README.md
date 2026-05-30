# 🏆 Porra Mundial de Fútbol 2026

¡Bienvenido a la **Porra Mundial 2026**! Una aplicación web ultra moderna y responsiva inspirada en plataformas como FotMob y SofaScore para jugar con amigos y competir pronosticando marcadores exactos del Mundial de Fútbol de USA, Canadá y México.

## 🚀 Tecnologías Principales
- **Frontend**: React 19, TypeScript, Vite 6, React Router v7, TanStack Query v5.
- **Estilos**: Tailwind CSS v4, shadcn/ui.
- **Backend / DB / Auth**: Firebase (Google Auth, Cloud Firestore sin costos de servidor propio).
- **Testing**: Vitest + React Testing Library.
- **Linter & Formatting**: ESLint + Prettier + Husky.

---

## 🛠️ Ejecución Local

### 1. Clonar el repositorio y acceder
```bash
npm install
```

### 2. Configurar Firebase
Crea un archivo `.env` en la raíz del proyecto basándote en el archivo `.env.example` proporcionado:
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

### 4. Sembrar los partidos oficiales (Seeding)
Ve al panel de administración en `/admin` dentro de la app (una vez autenticado y asignado tu rol a `admin` en la base de datos de Firestore), y presiona **"Semilla WC 2026"**. Esto poblará automáticamente todo el calendario oficial en tu Firestore.

---

## 🧪 Pruebas Unitarias
Ejecuta la suite de pruebas unitarias para el motor de puntuación de aciertos exactos (3 pts) o aciertos de signo/ganador (1 pt):
```bash
npm run test
```

---

## 📦 Despliegue Gratis a Producción (Vercel)

Esta aplicación viene completamente lista con la configuración `vercel.json` y se puede desplegar al instante en Vercel gratis:
1. Crea un proyecto en [Vercel](https://vercel.com).
2. Conecta tu repositorio de GitHub.
3. Configura las variables de entorno de la pestaña anterior (`VITE_FIREBASE_...`) en el dashboard del proyecto en Vercel.
4. Presiona **Deploy**. Vercel compilará y servirá la aplicación de forma global a través de su CDN de forma gratuita.
