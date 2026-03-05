// minimal node shims so ts tooling works without @types/node
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any
declare const __dirname: string

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore - node built-in, available at runtime
import path from 'path'

// https://vitejs.dev/config/
const repoName =
  process.env.GITHUB_ACTIONS && process.env.GITHUB_REPOSITORY
    ? process.env.GITHUB_REPOSITORY.split('/')[1] ?? ''
    : ''

export default defineConfig({
  base: repoName ? `/${repoName}/` : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: ['my-companyflow.ngrok-free.app'],
  },
})

