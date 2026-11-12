const FUNDO = [
  'radial-gradient(ellipse 80% 60% at 10% -10%, rgba(139,92,246,0.34), transparent 60%)',
  'radial-gradient(ellipse 70% 55% at 95% 10%, rgba(59,130,246,0.30), transparent 60%)',
  'radial-gradient(ellipse 50% 50% at 0% 50%, rgba(139,92,246,0.14), transparent 60%)',
  'radial-gradient(ellipse 50% 50% at 100% 50%, rgba(59,130,246,0.14), transparent 60%)',
  'radial-gradient(ellipse 70% 55% at 50% 110%, rgba(168,85,247,0.18), transparent 65%)',
  'linear-gradient(180deg, #f5f3ff 0%, #ffffff 45%, #eff6ff 100%)',
].join(', ')

function Screen({ titulo, subtitulo, alinhamento = 'centro', children }) {
  const alinhamentoVertical = alinhamento === 'topo' ? 'justify-start' : 'justify-center'

  return (
    <div className="relative isolate min-h-dvh text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-violet-50"
        style={{ backgroundImage: FUNDO }}
      >
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <main
        className={`mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-8 sm:px-6 sm:py-10 ${alinhamentoVertical}`}
      >
        {(titulo || subtitulo) && (
          <header className="text-center">
            {titulo && (
              <h1 className="bg-linear-to-r from-violet-600 to-blue-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                {titulo}
              </h1>
            )}
            {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
          </header>
        )}
        {children}
      </main>
    </div>
  )
}

export default Screen
