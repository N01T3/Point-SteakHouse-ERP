import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../../features/auth/store/auth.store'
import { podeAcessarRota, type PapelUsuario } from '../../shared/tipos/papel'

declare module 'vue-router' {
  interface RouteMeta {
    titulo?: string
    papeisPermitidos?: PapelUsuario[]
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../../features/dashboard/views/DashboardView.vue'),
      meta: { titulo: 'Dashboard', papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR'] },
    },
    {
      path: '/mercado',
      name: 'mercado',
      component: () => import('../../features/mercado/views/MercadoView.vue'),
      meta: { titulo: 'Mercado', papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR', 'CAIXA'] },
    },
    {
      path: '/pdv',
      redirect: { name: 'mercado' },
    },
    {
      path: '/acougueiro',
      name: 'acougueiro',
      component: () => import('../../features/acougue/views/AcougueiroView.vue'),
      meta: { titulo: 'Açougue', papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR', 'ACOUGUEIRO'] },
    },
    {
      path: '/administrador',
      name: 'administrador',
      component: () => import('../../features/administrador/views/AdministradorView.vue'),
      meta: { titulo: 'Administração', papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR'] },
    },
    {
      path: '/acesso',
      name: 'acesso',
      component: () => import('../../features/acesso/views/GestaoAcessoView.vue'),
      meta: { titulo: 'Acesso e Auditoria', papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR'] },
    },
    {
      path: '/maturacao',
      name: 'maturacao',
      component: () => import('../../features/maturacao/views/CamaraDeMaturacaoView.vue'),
      meta: { titulo: 'Câmara de Maturação', papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR', 'ACOUGUEIRO'] },
    },
    {
      path: '/seguranca-biologica',
      name: 'seguranca-biologica',
      component: () => import('../../features/seguranca-biologica/views/SegurancaBiologicaView.vue'),
      meta: { titulo: 'Segurança Biológica', papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR', 'ACOUGUEIRO'] },
    },
    {
      path: '/desossa-subprodutos',
      name: 'desossa-subprodutos',
      component: () => import('../../features/desossa-subprodutos/views/DesossaSubprodutosView.vue'),
      meta: { titulo: 'Desossa & Subprodutos', papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR', 'ACOUGUEIRO'] },
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: () => import('../../features/clientes/views/ClientesView.vue'),
      meta: { titulo: 'Clientes', papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR'] },
    },
    {
      path: '/estoque',
      name: 'estoque',
      component: () => import('../../features/estoque/views/EstoqueView.vue'),
      meta: { titulo: 'Estoque', papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR'] },
    },
    {
      path: '/financeiro',
      name: 'financeiro',
      component: () => import('../../features/financeiro/views/FinanceiroView.vue'),
      meta: { titulo: 'Finanças', papeisPermitidos: ['PROPRIETARIO', 'ADMINISTRADOR'] },
    },
    {
      path: '/configuracoes',
      name: 'configuracoes',
      component: () => import('../../features/configuracoes/views/ConfiguracoesView.vue'),
      meta: { titulo: 'Configurações', papeisPermitidos: ['PROPRIETARIO'] },
    },
    {
      path: '/acesso-negado',
      name: 'acesso-negado',
      component: () => import('../../features/auth/views/AcessoNegadoView.vue'),
      meta: { titulo: 'Acesso negado' },
    },
  ],
})

router.beforeEach((to) => {
  const store = useAuthStore()
  if (!store.autenticado) return true
  if (!podeAcessarRota(store.papel, to.meta.papeisPermitidos)) {
    if (to.name === 'dashboard' && store.usuario) return store.usuario.rotaInicial
    return { name: 'acesso-negado' }
  }
  return true
})

export default router
