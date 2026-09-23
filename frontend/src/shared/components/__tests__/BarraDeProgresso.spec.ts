import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BarraDeProgresso from '../BarraDeProgresso.vue'

describe('BarraDeProgresso', () => {
  it('renderiza a largura proporcional ao percentual informado', () => {
    const wrapper = mount(BarraDeProgresso, { props: { percentual: 40 } })
    const preenchimento = wrapper.find('.preenchimento')
    expect(preenchimento.attributes('style')).toContain('width: 40%')
  })

  it('limita o percentual ao intervalo 0-100', () => {
    const wrapper = mount(BarraDeProgresso, { props: { percentual: 150 } })
    expect(wrapper.find('.preenchimento').attributes('style')).toContain('width: 100%')
  })
})
