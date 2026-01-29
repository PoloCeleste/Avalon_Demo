import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// import * as fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // server: {
  //   https: {
  //     key: fs.readFileSync('./localhost+1-key.pem'),
  //     cert: fs.readFileSync('./localhost+1.pem'),
  //   },
  //   proxy: {
  //     '/api': {
  //       target: 'https://api.manageschool.co.kr',
  //       changeOrigin: true,
  //       secure: true,
  //     },
  //   },
  // },
})
