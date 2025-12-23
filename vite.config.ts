import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    define: {
      // Polyfill for Vercel/Node environment variables to client-side
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''),
      'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.VITE_OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || env.GEMINI_API_KEY || ''),
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
          about: resolve(__dirname, 'pages/about.html'),
          contact: resolve(__dirname, 'pages/contact.html'),
          howItWorks: resolve(__dirname, 'pages/how-it-works.html'),
          whyChooseUs: resolve(__dirname, 'pages/why-choose-us.html'),
          blog: resolve(__dirname, 'pages/blog.html'),
          successStories: resolve(__dirname, 'pages/success-stories.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
