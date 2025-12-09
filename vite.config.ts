import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          marketplace: resolve(__dirname, 'pages/marketplace.html'),
          details: resolve(__dirname, 'pages/details.html'),
          login: resolve(__dirname, 'pages/login.html'),
          signup: resolve(__dirname, 'pages/signup.html'),
          solutions: resolve(__dirname, 'pages/solutions.html'),
          sell: resolve(__dirname, 'pages/sell.html'),
          dashboard: resolve(__dirname, 'pages/dashboard.html'),
          profile: resolve(__dirname, 'pages/profile.html'),
        },
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
