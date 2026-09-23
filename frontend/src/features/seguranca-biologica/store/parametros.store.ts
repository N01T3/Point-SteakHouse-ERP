import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useParametrosSegurancaBiologicaStore = defineStore('parametros-seguranca-biologica', () => {
  const limiteZonaDePerigoMinutos = ref(240)
  const limiarAw = ref(0.85)
  const frequenciaColetaDias = ref(30)

  return { limiteZonaDePerigoMinutos, limiarAw, frequenciaColetaDias }
})
