import { defineConfig } from 'astro/config';

// In produzione (GitHub Actions) SITE e BASE arrivano dal workflow.
// In locale restano i valori di default.
export default defineConfig({
  site: process.env.SITE || 'http://localhost:4321',
  base: process.env.BASE || '/',
  trailingSlash: 'always',
});
