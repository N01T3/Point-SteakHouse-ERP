import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './app/router'
import { modoAmostraOnline } from './features/auth/services/auth.mock'
import vuetify from './plugins/vuetify'
import { marcarPrimeiraVisita, siteExpirado } from './shared/amostra/prazo-do-site'
import { aplicarTemaVuetify } from './shared/composables/useTema'
import './shared/estiloGlobal.css'

const TELA_ENCERRADA = [
  '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;',
  'padding:24px;background:#14110d;font-family:system-ui,sans-serif">',
  '<div style="max-width:420px;text-align:center;background:#1f1a14;border:1px solid #3a3129;',
  'border-radius:16px;padding:32px">',
  '<div style="font-size:22px;font-weight:700;color:#f5efe6;margin-bottom:12px">',
  'Point Steak House — demonstração encerrada</div>',
  '<p style="font-size:14px;color:#b8ab99;margin:0">',
  'O período de avaliação terminou. Fale com o responsável para agendar uma nova amostra.</p>',
  '</div></div>',
].join('')

if (modoAmostraOnline()) {
  marcarPrimeiraVisita()
}

// Amostra com prazo estourado: nem monta o app — só a tela de encerrada.
// (O bundle é ofuscado no deploy; a remoção real do ar é no dashboard do Render.)
if (modoAmostraOnline() && siteExpirado()) {
  const raiz = document.getElementById('app')
  if (raiz) raiz.innerHTML = TELA_ENCERRADA
} else {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)
  app.use(vuetify)
  aplicarTemaVuetify(vuetify)

  app.mount('#app')
}
