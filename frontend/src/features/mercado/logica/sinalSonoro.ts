// Confirmação sonora do bip — WebAudio, sem arquivos externos.
// Retorna false quando o navegador não permite (ou fora do browser, ex.: testes).
export function emitirBipe(ok: boolean): boolean {
  try {
    if (typeof window === 'undefined') return false
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return false
    const ctx = new Ctor()
    void ctx.resume?.()
    const osc = ctx.createOscillator()
    const ganho = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = ok ? 880 : 220
    const duracao = ok ? 0.09 : 0.18
    ganho.gain.setValueAtTime(0.12, ctx.currentTime)
    ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracao)
    osc.connect(ganho)
    ganho.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duracao)
    osc.onended = () => void ctx.close()
    return true
  } catch {
    return false
  }
}
