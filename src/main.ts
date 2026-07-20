import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'

const app = createApp(App)

// 全局状态和页面路由在应用入口统一注册，避免业务组件承担初始化职责。
app.use(createPinia())
app.use(router)
app.mount('#app')
