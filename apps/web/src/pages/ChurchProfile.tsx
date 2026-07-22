import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Church, ChurchEvent, ChurchMetrics } from '@chbook/types';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card text-center">
      <p className="text-3xl font-medium text-sage-dark">{value}</p>
      <p className="mt-1 text-xs text-carbon/60">{label}</p>
    </div>
  );
}

export default function ChurchProfile() {
  const { slug } = useParams<{ slug: string }>();
  const [church, setChurch] = useState<Church | null>(null);
  const [metrics, setMetrics] = useState<ChurchMetrics | null>(null);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: c } = await supabase
        .from('churches')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      const found = c as Church | null;
      setChurch(found);

      if (found) {
        const [{ data: m }, { data: e }] = await Promise.all([
          supabase
            .from('church_metrics')
            .select('*')
            .eq('church_id', found.id)
            .maybeSingle(),
          supabase
            .from('events')
            .select('*')
            .eq('church_id', found.id)
            .eq('is_public', true)
            .gte('starts_at', new Date().toISOString())
            .order('starts_at', { ascending: true })
            .limit(5),
        ]);
        setMetrics(m as ChurchMetrics | null);
        setEvents((e as ChurchEvent[]) ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-carbon/50">
        Cargando perfil…
      </div>
    );
  }

  if (!church) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-carbon/60">Esta iglesia no existe en ChBook.</p>
        <Link to="/directorio" className="btn-primary">
          Volver al directorio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Link to="/">
          <Logo size="sm" />
        </Link>
        <Link
          to="/directorio"
          className="text-sm font-medium text-carbon/70 hover:text-carbon"
        >
          ← Directorio
        </Link>
      </header>

      {/* Cabecera del perfil */}
      <section className="bg-sage-light px-6 py-14 text-center">
        <h1 className="text-4xl text-white">{church.name}</h1>
        <p className="mt-2 text-white/90">
          {[church.denomination, church.city, church.country]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {church.pastor_name && (
          <p className="mt-1 text-sm text-white/80">
            Pastor: {church.pastor_name}
          </p>
        )}
        {church.founded_year && (
          <p className="mt-1 text-sm text-white/70">
            Fundada en {church.founded_year}
          </p>
        )}
      </section>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Métricas verificables — el diferenciador */}
        <h2 className="mb-4 text-xl">Métricas de la congregación</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Miembros registrados" value={metrics?.total_members ?? 0} />
          <Stat label="% activos último mes" value={`${metrics?.active_pct ?? 0}%`} />
          <Stat label="Asistencia promedio" value={metrics?.avg_attendance ?? 0} />
          <Stat label="Ocupación del templo" value={`${metrics?.occupancy_pct ?? 0}%`} />
        </div>
        <p className="mt-3 text-xs text-carbon/50">
          Métricas reales generadas por asistencia GPS verificada. No son
          seguidores anónimos: cada miembro fue aprobado por la iglesia.
        </p>

        {/* Próximos eventos públicos */}
        {events.length > 0 && (
          <>
            <h2 className="mb-4 mt-10 text-xl">Próximos eventos</h2>
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="card flex items-center gap-4">
                  <div className="w-16 shrink-0 text-center">
                    <p className="text-2xl font-medium text-sage-dark">
                      {e.starts_at ? new Date(e.starts_at).getDate() : '—'}
                    </p>
                    <p className="text-xs uppercase text-carbon/60">
                      {e.starts_at
                        ? new Date(e.starts_at).toLocaleString('es-CO', {
                            month: 'short',
                          })
                        : ''}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">{e.title}</p>
                    {e.description && (
                      <p className="text-sm text-carbon/60">{e.description}</p>
                    )}
                    {e.starts_at && (
                      <p className="mt-0.5 text-xs text-carbon/50">
                        {new Date(e.starts_at).toLocaleString('es-CO', {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA para unirse */}
        <div className="mt-12 rounded-2xl bg-cream p-8 text-center">
          <h2 className="text-xl">¿Asistes a esta iglesia?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-carbon/60">
            Descarga la app, escanea el código QR del templo
            {church.code && (
              <>
                {' '}
                o ingresa el código{' '}
                <span className="font-mono font-medium text-sage-dark">
                  {church.code}
                </span>
              </>
            )}{' '}
            y únete como miembro.
          </p>
        </div>
      </div>
    </div>
  );
}
