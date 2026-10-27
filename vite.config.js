import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/rede_social_gamer/' : '/',
  server: { proxy: { '/api': 'http://localhost:8787' } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.js'], include: ['src/**/*.test.{js,jsx}'] }
});