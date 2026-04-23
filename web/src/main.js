// QQ Bot Manager - Copyright (c) 2025 云码小栈 <https://yunmaxz.com> | MIT 非商业许可证
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 初始化 auth store，恢复登录状态
const authStore = useAuthStore()
authStore.init()

app.use(router)
app.use(ElementPlus)
app.mount('#app')
