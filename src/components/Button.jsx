const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none'

const VARIANTES = {
  primario:
    'bg-linear-to-r from-violet-600 to-blue-600 text-white shadow-sm hover:from-violet-700 hover:to-blue-700 focus-visible:outline-violet-600',
  secundario: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:outline-slate-400',
  contorno:
    'border border-slate-300 bg-white/80 text-slate-700 hover:bg-white focus-visible:outline-violet-500',
  perigo: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:outline-rose-600',
  sucesso:
    'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-emerald-600',
}

function Button({ variante = 'primario', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`${BASE} ${VARIANTES[variante]} ${className}`}
      {...props}
    />
  )
}

export default Button
