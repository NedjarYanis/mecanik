import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'


export default defineConfig({
  plugins: [
    react(),
    basicSsl() // <-- Active le HTTPS pour débloquer la caméra sur mobile
  ],
  server: {
    host: true // <-- Permet de se connecter via l'IP depuis ton téléphone
  }
})