import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

const plans = [
  {
    emoji: '🌱',
    name: 'Semilla',
    members: 'Hasta 100 miembros',
    price: '$20',
    features: ['Registro de miembros con QR', 'Check-in GPS automático', 'Dashboard de métricas', 'Calendario y notificaciones'],
    highlight: false,
  },
  {
    emoji: '📈',
    name: 'Crecimiento',
    members: 'Hasta 500 miembros',
    price: '$45',
    features: ['Todo lo de Semilla', 'Dashboard de líderes', 'Seguimiento individual', 'Métricas comparativas'],
    highlight: true,
  },
  {
    emoji: '⛪',
    name: 'Iglesia Mayor',
    members: 'Hasta 2.000 miembros',
    price: '$80',
    features: ['Todo lo de Crecimiento', 'Extensión Músicos', 'Extensión Finanzas', 'Extensión Células'],
    highlight: false,
  },
];

const differentiators = [
  {
    title: 'Sabe quién llegó al culto sin pasar lista',
    body: 'El miembro abre la app dentro del templo y su asistencia queda registrada por GPS. Sin papel, sin filas, sin olvidos.',
  },
  {
    title: 'Miembros reales, no seguidores anónimos',
    body: 'Cada persona en tu congregación pasa por aprobación del pastor. Las métricas de tu iglesia son verificables.',
  },
  {
    title: 'Pensado para Latinoamérica',
    body: 'Precios accesibles para congregaciones de 80 personas, no solo para mega-iglesias. El precio se ajusta a tu país.',
  },
  {
    title: 'Personas, no dinero',
    body: 'El recurso más importante de una iglesia es el ser humano. Por eso el dashboard gira alrededor de la congregación.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Logo size="sm" />
        <nav className="flex items-center gap-4">
          <Link
            to="/directorio"
            className="text-sm font-medium text-carbon/70 hover:text-carbon"
          >
            Directorio
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-carbon px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Entrar
          </Link>
        </nav>
      </header>

      {/* Hero — fondo sage claro, texto blanco, CTA carbón */}
      <section className="bg-sage-light px-6 py-20 text-center sm:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-8 inline-block rounded-2xl bg-cream px-6 py-4">
            <Logo />
          </div>
          <h1 className="text-4xl leading-tight text-white sm:text-5xl">
            Organizando la iglesia.
            <br />
            Un perfil a la vez.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/90">
            La plataforma de gestión para iglesias de Latinoamérica. Asistencia
            automática por GPS, miembros reales y métricas verificables.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="rounded-lg bg-carbon px-7 py-3 font-medium text-white transition hover:opacity-90"
            >
              Registra tu iglesia
            </Link>
            <Link
              to="/directorio"
              className="rounded-lg border border-white/60 px-7 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Explora el directorio
            </Link>
          </div>
        </div>
      </section>

      {/* Diferenciadores */}
      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
          {differentiators.map((d) => (
            <div key={d.title} className="card">
              <h3 className="text-lg font-medium text-sage-dark">{d.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-carbon/70">
                {d.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Planes */}
      <section className="bg-cream/50 px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl">Un plan para cada congregación</h2>
          <p className="mt-2 text-center text-sm text-carbon/60">
            Precios en USD. Se ajustan según tu país.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl bg-white p-6 ${
                  p.highlight
                    ? 'border-2 border-sage-dark shadow-lg'
                    : 'border border-carbon/10'
                }`}
              >
                <p className="text-3xl">{p.emoji}</p>
                <h3 className="mt-2 text-xl font-medium">{p.name}</h3>
                <p className="text-sm text-carbon/60">{p.members}</p>
                <p className="mt-4">
                  <span className="text-4xl font-medium text-sage-dark">
                    {p.price}
                  </span>
                  <span className="text-sm text-carbon/60"> USD/mes</span>
                </p>
                <ul className="mt-5 space-y-2 text-sm text-carbon/80">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-sage-dark">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`mt-6 block rounded-lg py-2.5 text-center font-medium transition ${
                    p.highlight
                      ? 'bg-sage-dark text-white hover:opacity-90'
                      : 'border border-sage-dark text-sage-dark hover:bg-sage-dark/5'
                  }`}
                >
                  Comenzar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 text-center text-sm text-carbon/50">
        <p>ChBook — Church Management Platform</p>
        <p className="mt-1">Organizando la iglesia. Un perfil a la vez.</p>
      </footer>
    </div>
  );
}
