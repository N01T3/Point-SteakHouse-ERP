const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function useFormatador() {
  function formatarMoeda(valor: number): string {
    return formatadorMoeda.format(valor)
  }

  function formatarDataPorExtenso(data: Date = new Date()): string {
    const texto = formatadorData.format(data)
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  function formatarPercentual(valor: number): string {
    return `${(valor * 100).toFixed(1).replace('.', ',')}%`
  }

  return { formatarMoeda, formatarDataPorExtenso, formatarPercentual }
}
