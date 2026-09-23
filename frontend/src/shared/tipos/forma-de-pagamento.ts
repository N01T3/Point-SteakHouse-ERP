export type FormaDePagamento = 'dinheiro' | 'cartao' | 'pix' | 'conta'

export const NOMES_FORMA_DE_PAGAMENTO: Record<FormaDePagamento, string> = {
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  pix: 'PIX',
  conta: 'Marcar na conta',
}
