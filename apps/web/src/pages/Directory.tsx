import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Church } from '@chbook/types';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

export default function Directory() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = setTimeout(async () => {
      setLoading(true);
      let request = supabase
        .from('churches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (query.trim()) {
        const q = `%${query.trim()}%`;
        request = request.or(
          `name.ilike.${q},city.ilike.${q},denomination.ilike.${q},country.ilike.${q}`
        );
      }
      const { data } = await request;
      setChurches((data as Church[]) ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Link to="/">
          <Logo size="sm" />
        </Link>
        <Link
          to="/login"
          className="rounded-lg bg-carbon px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Entrar
        </Link>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl">Directorio de iglesias</h1>
        <p className="mt-1 text-sm text-carbon/60">
          Encuentra iglesias por nombre, ciudad o denominación.
        </p>

        <input
          className="input mt-6"
          placeholder="Buscar: Nueva Vida, Bucaramanga, Pentecostal…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="mt-8 space-y-4">
          {loading ? (
            <p className="py-8 text-center text-carbon/50">Buscando…</p>
          ) : churches.length === 0 ? (
            <p className="py-8 text-center text-carbon/50">
              No se encontraron iglesias con esa búsqueda.
            </p>
          ) : (
            churches.map((c) => (
              <Link
                key={c.id}
                to={`/iglesia/${c.slug}`}
                className="card block transition hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-medium">{c.name}</h2>
                    <p className="mt-0.5 text-sm text-carbon/60">
                      {[c.denomination, c.city, c.country]
                        .filter(Boolean)
                        .join(' · ') || 'Sin información adicional'}
                    </p>
                    {c.pastor_name && (
                      <p className="mt-0.5 text-sm text-carbon/50">
                        Pastor: {c.pastor_name}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-sage-dark">
                    Ver perfil →
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
