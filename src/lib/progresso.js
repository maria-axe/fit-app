export const RAIO_ANEL = 26
export const CIRCUNFERENCIA_ANEL = 2 * Math.PI * RAIO_ANEL

// Progresso do anel: 0..1 (clampa quando feitos > meta) e o offset do traço.
export function calcularProgressoAnel(feitos, meta) {
  const progresso = meta > 0 ? Math.min(feitos / meta, 1) : 0
  return {
    progresso,
    dashOffset: CIRCUNFERENCIA_ANEL * (1 - progresso),
  }
}
