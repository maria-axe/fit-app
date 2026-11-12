import { CIRCUNFERENCIA_ANEL, RAIO_ANEL, calcularProgressoAnel } from '../../lib/progresso'

function ProgressRing({ feitos, meta }) {
  const { dashOffset } = calcularProgressoAnel(feitos, meta)

  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full -rotate-90"
      >
        <circle
          cx="32"
          cy="32"
          r={RAIO_ANEL}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-white/20"
        />
        <circle
          cx="32"
          cy="32"
          r={RAIO_ANEL}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA_ANEL}
          strokeDashoffset={dashOffset}
          className="text-white transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="text-center">
        <p className="text-lg font-bold leading-none">{feitos}</p>
        <p className="text-[10px] text-white/70">de {meta || '—'}</p>
      </div>
    </div>
  )
}

export default ProgressRing
