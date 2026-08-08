import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(() => {
  // The dev proxy always targets the LOCAL backend — it only exists in the `vite dev`
  // server. Production builds never use it (VITE_BACKEND_URL is baked from the
  // Vercel dashboard env instead). Change the port here if your backend runs elsewhere.
  const devBackendTarget = 'http://localhost:3000';
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: devBackendTarget,
          changeOrigin: true,
          secure: false,
        },
        // Socket.io must be proxied too, otherwise the dev client hits the backend
        // directly (cross-origin) or the production Render URL (CORS + cold start).
        "/socket.io": {
          target: devBackendTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };
});
