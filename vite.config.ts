import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/SceneNote/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'SceneNote',
        short_name: 'SceneNote',
        description: '为影视创作者记录混剪灵感的独立计时工具。',
        lang: 'zh-CN',
        theme_color: '#080808',
        background_color: '#080808',
        display: 'standalone',
        start_url: '/SceneNote/',
        scope: '/SceneNote/',
        icons: [
          {
            src: '/SceneNote/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
