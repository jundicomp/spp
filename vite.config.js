import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Repo GitHub bernama "spp" -> dipublikasikan di jundicomp.github.io/spp/
  // (bukan di root domain), jadi semua path aset harus diawali /spp/
  base: '/spp/',
})
