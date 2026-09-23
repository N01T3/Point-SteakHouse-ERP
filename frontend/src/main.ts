import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './app/router'
import './shared/composables/useTema'
import './shared/estiloGlobal.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
